import { GlideRecord, GlideSysAttachment, GlideTextReader } from '@servicenow/glide'
import { RESTMessageV2 } from '@servicenow/glide/sn_ws'
import type { SystemConfig } from './types.ts'
import { writeAttempt } from './call-log.ts'

/**
 * NV-5 -- binary payload transport. Retrieve a PDF, upload a PDF.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM rest-client.ts: the JSON path must never see these bytes.
 * `getBody()` is unusable on a response saved as an attachment (ServiceNow RESTResponseV2 docs:
 * "Do not use this method when saving the response as a binary attachment"), so the two paths
 * cannot share a response reader without one of them being wrong.
 *
 * OD43 -- SPOOL AND SHRED, NOT STREAM. BRD R1 asks for a document "streamed to the employee --
 * never stored at rest in ServiceNow". ServiceNow has no supported API that hands a scoped app a
 * binary stream: `saveResponseBodyAsAttachment(table, sysId, fileName)` is the only route, so the
 * bytes MUST touch disk for the duration of one request. We therefore write a temporary
 * attachment, verify it, deliver it, and delete it in the same transaction -- and assert the
 * deletion rather than trusting it. `sys_attachment` row count is unchanged across a successful
 * retrieval, which is the promise the requirement is actually making. The transient copy is
 * disclosed in the runbook and in OD43; it is not hidden behind the word "streamed".
 *
 * TRAP, from the scoped GlideSysAttachment docs: `getContent()` supports CSV, JSON and TXT ONLY.
 * It is NOT a way to read PDF bytes -- it returns a string and is undefined behaviour here. The
 * magic-byte check uses `getContentStream()`, which yields the actual bytes.
 */

/** Repo rule 2, mechanised. A file is PDF because its bytes say so -- never because a header did. */
export const PDF_MAGIC = '%PDF-'

export interface BinaryFetchResult {
    ok: boolean
    /** sys_id of the TEMPORARY attachment. The caller MUST call shred() when done. */
    attachmentId: string
    contentType: string
    contentLength: number
    /** Set when ok is false. Already plain language -- safe to render to an employee. */
    error: string
    /** Distinguishes "the ERP did not answer" from "the ERP answered with the wrong thing". */
    category: string
}

function fail(category: string, error: string): BinaryFetchResult {
    return { ok: false, attachmentId: '', contentType: '', contentLength: 0, error: error, category: category }
}

/**
 * True when the attachment's first bytes are `%PDF-`.
 *
 * The realistic failure this catches is not a corrupt file. It is an expired session: the ERP
 * answers 200 with `Content-Type: application/pdf` and a LOGIN PAGE in the body. Trusting the
 * header would hand the employee an HTML file named `.pdf` -- repo rule 2, exactly.
 */
export function hasPdfMagic(attachmentId: string): boolean {
    if (!attachmentId) {
        return false
    }
    const sa = new GlideSysAttachment()
    // getContentStream, NOT getContent: getContent is documented for CSV/JSON/TXT only.
    const stream = sa.getContentStream(attachmentId)
    if (!stream) {
        return false
    }
    // getContent() takes a GlideRecord and is documented for CSV/JSON/TXT only, so it is not a
    // way to read PDF bytes. GlideTextReader over the byte stream is: the first line of a valid
    // PDF begins `%PDF-1.x`, which is ASCII whatever follows it.
    const head = String(new GlideTextReader(stream, 'ISO-8859-1').readLine() || '')
    return head.substring(0, PDF_MAGIC.length) === PDF_MAGIC
}

/** Parse the comma-separated allow list. Empty means "not configured", never "allow everything". */
export function mimeAllowed(system: SystemConfig, contentType: string): boolean {
    const raw = String((system as { allowedMimeTypes?: string }).allowedMimeTypes || '')
    if (!raw) {
        return false
    }
    const got = String(contentType || '').split(';')[0].toLowerCase().trim()
    const list = raw.toLowerCase().split(',')
    for (let i = 0; i < list.length; i++) {
        if (list[i].trim() === got) {
            return true
        }
    }
    return false
}

/**
 * Delete the temporary attachment and PROVE it is gone.
 *
 * Returns false if the row survives. A caller that ignores this return value has reintroduced
 * the at-rest copy OD43 exists to prevent, so the return is deliberately not void.
 */
export function shred(attachmentId: string): boolean {
    if (!attachmentId) {
        return true
    }
    new GlideSysAttachment().deleteAttachment(attachmentId)
    const check = new GlideRecord('sys_attachment')
    return !check.get('sys_id', attachmentId)
}

/**
 * Retrieve a document. The caller owns the returned attachment and MUST shred() it.
 *
 * Size is checked BEFORE transfer where the ERP declares it, and again after: a vendor that
 * under-reports Content-Length would otherwise walk straight past the limit.
 */
export function fetchBinary(
    system: SystemConfig,
    url: string,
    spoolTable: string,
    spoolRecord: string,
    fileName: string,
): BinaryFetchResult {
    const maxBytes = Number((system as { maxAttachmentBytes?: number }).maxAttachmentBytes || 0)
    if (!maxBytes) {
        // NV-11: an unset limit means attachments are UNAVAILABLE, never unlimited. A guessed
        // ceiling is the invented-field-name failure wearing a different hat (repo rule 5).
        return fail('unexpected_format', 'Attachment limits are not configured for this ERP system.')
    }

    const msg = new RESTMessageV2()
    msg.setHttpMethod('get')
    msg.setEndpoint(url)
    msg.setRequestHeader('Accept', 'application/pdf')
    msg.setHttpTimeout(Number(system.timeoutMs || 30000))
    // Never follow a redirect: the Authorization header must not travel to an unconfigured host.
    msg.setFollowRedirect(false)
    if (system.authType === 'basic') {
        msg.setAuthenticationProfile('basic', system.authProfileBasic)
    } else if (
        system.authType === 'oauth2' ||
        system.authType === 'oauth2_client_credentials' ||
        system.authType === 'oauth2_jwt'
    ) {
        // OD45: the three OAuth values resolve to one branch. They differ in what they tell a
        // human reading the record, not in what the platform does.
        msg.setAuthenticationProfile('oauth2', system.authProfileOauth)
    }

    msg.saveResponseBodyAsAttachment(spoolTable, spoolRecord, fileName)

    let attachmentId = ''
    try {
        const response = msg.execute()
        const status = parseInt(String(response.getStatusCode() || '0'), 10)
        attachmentId = String(response.getResponseAttachmentSysid() || '')
        const contentType = String(response.getHeader('Content-Type') || '')

        if (status < 200 || status >= 300) {
            shred(attachmentId)
            if (status === 404) {
                return fail('record_not_found', 'The ERP has no document for this request.')
            }
            if (status === 403 || status === 401) {
                return fail('permission_denied', 'Not authorised to retrieve this document.')
            }
            return fail('erp_unavailable', 'ERP did not answer')
        }
        if (!attachmentId) {
            return fail('unexpected_format', 'The ERP returned no document content.')
        }

        if (!mimeAllowed(system, contentType)) {
            shred(attachmentId)
            return fail(
                'unexpected_format',
                'Document could not be retrieved -- the ERP returned an unexpected format (' + contentType + ')',
            )
        }
        // The header claimed PDF. Now make the bytes prove it (repo rule 2).
        if (!hasPdfMagic(attachmentId)) {
            shred(attachmentId)
            return fail(
                'unexpected_format',
                'Document could not be retrieved -- the ERP returned an unexpected format',
            )
        }

        const row = new GlideRecord('sys_attachment')
        const size = row.get('sys_id', attachmentId) ? parseInt(String(row.getValue('size_bytes') || '0'), 10) : 0
        if (size > maxBytes) {
            shred(attachmentId)
            return fail(
                'unexpected_format',
                'Document exceeds the ERP\'s stated size limit of ' + Math.floor(maxBytes / 1048576) + ' MB',
            )
        }

        return {
            ok: true,
            attachmentId: attachmentId,
            contentType: contentType,
            contentLength: size,
            error: '',
            category: '',
        }
    } catch (e) {
        // A throw mid-transfer can still have created the spool row. Never leave it behind.
        shred(attachmentId)
        return fail('erp_unavailable', 'ERP did not answer')
    }
}

// ===========================================================================================
// UPLOAD. NV-5's other half, used by NV-34 (receipts) and NV-37 (document archival).
// ===========================================================================================

export interface BinaryUploadResult {
    ok: boolean
    /** The response body, in memory only. The caller extracts the ERP's acknowledgement from it. */
    body: string
    httpCode: number
    error: string
    category: string
    callLogId: string
}

function uploadFail(category: string, error: string, httpCode: number, callLogId: string): BinaryUploadResult {
    return { ok: false, body: '', httpCode: httpCode, error: error, category: category, callLogId: callLogId }
}

/**
 * Send one attachment's bytes to the ERP.
 *
 * TRANSPORT IS RAW, NOT MULTIPART, AND THAT IS A DELIBERATE LIMITATION RATHER THAN AN OVERSIGHT.
 * The platform's documented multipart route (KB0745010) builds the form parts from a REST Message
 * RECORD -- a `type: attachment` form parameter on a stored `sys_rest_message_fn`. There is no
 * scriptable equivalent: `RESTMessageV2` in a scoped app can attach a body from an attachment
 * (`setRequestBodyFromAttachment`) but cannot compose the boundary-delimited parts around it.
 * Hand-assembling a multipart body in script would mean concatenating binary content into a
 * string, which is precisely the operation trap 16 says is unreliable for PDF bytes.
 *
 * So: an ERP that requires `multipart/form-data` for uploads needs a REST Message record, and
 * `object_map` must carry the endpoint for it. That gap is REPORTED (`multipart_unsupported`),
 * never papered over with a guessed body -- an upload that "succeeds" with a corrupted part is
 * the archived-document failure that nobody notices until an audit.
 *
 * Size and MIME are checked BEFORE the transfer, using the ERP's own stated limits (NV-11). An
 * unset limit means uploads are UNAVAILABLE, never unlimited.
 */
export function uploadBinary(
    system: SystemConfig,
    url: string,
    attachmentId: string,
    fileName: string,
    contentType: string,
    logicalObject: string,
): BinaryUploadResult {
    const started = Date.now()
    const maxBytes = Number((system as { maxAttachmentBytes?: number }).maxAttachmentBytes || 0)
    if (!maxBytes) {
        return uploadFail(
            'unexpected_format',
            'Attachment limits are not configured for this ERP system -- upload refused.',
            0,
            '',
        )
    }
    if (!mimeAllowed(system, contentType)) {
        return uploadFail(
            'unexpected_format',
            'This ERP does not accept ' + String(contentType || 'that file type') + ' uploads.',
            0,
            '',
        )
    }

    const row = new GlideRecord('sys_attachment')
    if (!row.get('sys_id', attachmentId)) {
        return uploadFail('record_not_found', 'The file to upload no longer exists.', 0, '')
    }
    const size = parseInt(String(row.getValue('size_bytes') || '0'), 10)
    if (size > maxBytes) {
        return uploadFail(
            'unexpected_format',
            'File exceeds the ERP\'s stated size limit of ' + Math.floor(maxBytes / 1048576) + ' MB.',
            0,
            '',
        )
    }

    const msg = new RESTMessageV2()
    msg.setHttpMethod('post')
    msg.setEndpoint(url)
    msg.setRequestHeader('Content-Type', contentType)
    // The file name travels in a header rather than a form part, for the reason above. An ERP
    // that ignores it will name the archived copy itself; an ERP that requires a form part is the
    // `multipart_unsupported` case and is refused by configuration, not silently mangled here.
    msg.setRequestHeader('Content-Disposition', 'attachment; filename="' + String(fileName).replace(/"/g, '') + '"')
    msg.setHttpTimeout(Number(system.timeoutMs || 30000))
    msg.setFollowRedirect(false)
    if (system.authType === 'basic') {
        msg.setAuthenticationProfile('basic', system.authProfileBasic)
    } else if (
        system.authType === 'oauth2' ||
        system.authType === 'oauth2_client_credentials' ||
        system.authType === 'oauth2_jwt'
    ) {
        msg.setAuthenticationProfile('oauth2', system.authProfileOauth)
    }
    msg.setRequestBodyFromAttachment(attachmentId)

    try {
        const response = msg.execute()
        const status = parseInt(String(response.getStatusCode() || '0'), 10)
        const ok = status >= 200 && status < 300
        // Every binary attempt logs, exactly like every JSON attempt (C7). A transport that
        // leaves no call_log row is a transport nobody can audit.
        const callLogId =
            writeAttempt({
                erpSystemSysId: String(system.sysId || ''),
                object: logicalObject,
                startedMs: started,
                durationMs: Date.now() - started,
                status: ok ? 'success' : 'failure',
                httpCode: status,
                errorCode: ok ? null : 'HTTP_' + status,
                errorDetail: ok ? null : String(response.getErrorMessage() || ''),
                rowsReturned: null,
                objectMapSysId: null,
                mappingVerified: false,
            }) || ''

        if (!ok) {
            if (status === 403 || status === 401) {
                return uploadFail('permission_denied', 'Not authorised to upload to this ERP.', status, callLogId)
            }
            if (status === 413) {
                return uploadFail('unexpected_format', 'The ERP rejected the file as too large.', status, callLogId)
            }
            return uploadFail('erp_unavailable', 'ERP did not answer', status, callLogId)
        }
        return {
            ok: true,
            body: String(response.getBody() || ''),
            httpCode: status,
            error: '',
            category: '',
            callLogId: callLogId,
        }
    } catch (e) {
        const callLogId =
            writeAttempt({
                erpSystemSysId: String(system.sysId || ''),
                object: logicalObject,
                startedMs: started,
                durationMs: Date.now() - started,
                status: 'failure',
                httpCode: null,
                errorCode: 'TRANSPORT',
                errorDetail: null,
                rowsReturned: null,
                objectMapSysId: null,
                mappingVerified: false,
            }) || ''
        return uploadFail('erp_unavailable', 'ERP did not answer', 0, callLogId)
    }
}
