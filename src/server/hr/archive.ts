import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { loadMap, loadSystem } from '../connector/config-loader.ts'
import { buildEndpoint } from '../connector/rest-client.ts'
import { uploadBinary } from '../connector/binary-client.ts'
import { mapResponse } from '../connector/field-mapper.ts'
import { fetch } from '../connector/erp-connector.ts'
import { defaultAssignmentGroup, extractAck, preflight } from '../write/dispatcher.ts'
import { raiseException } from '../write/exception-queue.ts'

/**
 * NV-37 and NV-38 -- archive a generated document back to the ERP, and reconcile what was
 * archived against what was issued.
 *
 * BRD R5 calls the archival the point of the whole requirement, and its key requirement is
 * IDEMPOTENCY: two dispatches must leave exactly ONE copy in the employee's personnel file. A
 * duplicated employment letter is not a cosmetic defect -- it is two documents of record for one
 * decision.
 *
 * THE ARCHIVAL IS A WRITE AND USES THE GOVERNED PRE-FLIGHT. The transport cannot be
 * `erp-connector.fetch()` (trap 15 -- the JSON path cannot carry these bytes), but the DECISION
 * path is shared: `preflight()` runs read-only, approval, cut-off, idempotency and throttle
 * exactly as it does for a JSON write. A binary transport exception is not a governance
 * exception.
 *
 * FAILURE TO ARCHIVE NEVER DESTROYS THE EMPLOYEE'S COPY. The RITM attachment stays, the archival
 * is queued for retry, and the request says `Issued. ERP archival pending.` -- never `Archived`
 * before the ERP confirmed it.
 */

const T_WRITE = 'x_335329_sn_hr_erp_erp_write'
const T_REQ = 'x_335329_sn_hr_erp_doc_req'
const OBJECT = 'erp_attachment'

export interface ArchiveResult {
    ok: boolean
    state: string
    /** Plain language, safe to render on the request. */
    message: string
    ackRef: string
    writeId: string
}

function res(ok: boolean, state: string, message: string, ackRef: string, writeId: string): ArchiveResult {
    return { ok: ok, state: state, message: message, ackRef: ackRef, writeId: writeId }
}

/**
 * NV-37 AC8 -- the vendor gap, stated rather than silently skipped.
 *
 * An ERP with no attachment-upload capability has no `erp_scope_grant` for `erp_attachment.create`.
 * The document still generates and still attaches to the request; what does NOT happen is a
 * pretence that it was filed. BRD §11 Q6 names this as one of the two hardest capabilities to
 * confirm for any ERP, so it is reported as a capability gap, not as an error.
 */
export function archivalGranted(systemId: string): boolean {
    const gr = new GlideRecord('x_335329_sn_hr_erp_scope_grant')
    gr.addQuery('erp_system', systemId)
    gr.addQuery('logical_object', OBJECT)
    gr.addQuery('operation', 'create')
    gr.addQuery('active', true)
    gr.setLimit(1)
    gr.query()
    return gr.next()
}

export interface ArchivedDocument {
    reference: string
    fileName: string
    category: string
    uploadedDate: string
}

export interface ArchiveListing {
    ok: boolean
    documents: ArchivedDocument[]
    /** Set when ok is false. The reconciliation refuses to show a number in that case. */
    message: string
}

/**
 * INT-19 -- what the ERP holds for this employee.
 *
 * ONE IMPLEMENTATION SERVES TWO CALLERS (NV-38 AC4): the reconciliation view and the existence
 * check that makes the archival idempotent. A second implementation of "what is already there"
 * is a second answer to the question idempotency depends on.
 */
export function listArchived(systemId: string, employeeKey: string): ArchiveListing {
    const map = loadMap(systemId, OBJECT)
    if (!map) {
        return { ok: false, documents: [], message: 'Not configured -- create an Object Map for ' + OBJECT }
    }
    const result = fetch(systemId, OBJECT, { externalId: employeeKey })
    if (!result.ok || !result.body) {
        return { ok: false, documents: [], message: 'ERP did not answer' }
    }
    let parsed: unknown
    try {
        parsed = JSON.parse(String(result.body))
    } catch (e) {
        return { ok: false, documents: [], message: 'The ERP returned an unexpected format' }
    }
    const rows = mapResponse(parsed, map.responseRoot, OBJECT, map.fields, map.dateFormat)
    // NULL IS NOT AN EMPTY LIST. An unresolved response root reported as "nothing archived" is
    // how a misconfiguration becomes a clean reconciliation report (NV-38 AC3).
    if (rows === null) {
        return { ok: false, documents: [], message: 'Not configured -- response root did not resolve for ' + OBJECT }
    }
    const docs: ArchivedDocument[] = []
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as { [k: string]: string }
        docs.push({
            reference: String(row['erp_attachment_reference'] || ''),
            fileName: String(row['file_name'] || ''),
            category: String(row['document_type_category'] || ''),
            uploadedDate: String(row['uploaded_date'] || ''),
        })
    }
    return { ok: true, documents: docs, message: '' }
}

/** The existence check behind NV-4 for archival: same category AND same file name. */
function alreadyArchived(listing: ArchiveListing, category: string, fileName: string): string {
    for (let i = 0; i < listing.documents.length; i++) {
        const d = listing.documents[i]
        if (d.category === category && d.fileName === fileName) {
            return d.reference || 'archived'
        }
    }
    return ''
}

function attachmentOf(requestSysId: string): { id: string; name: string; type: string } {
    const gr = new GlideRecord('sys_attachment')
    gr.addQuery('table_name', T_REQ)
    gr.addQuery('table_sys_id', requestSysId)
    gr.orderByDesc('sys_created_on')
    gr.setLimit(1)
    gr.query()
    if (!gr.next()) {
        return { id: '', name: '', type: '' }
    }
    return {
        id: String(gr.getUniqueValue()),
        name: String(gr.getValue('file_name') || ''),
        type: String(gr.getValue('content_type') || ''),
    }
}

/**
 * Archive one generated document.
 *
 * `writeId` is an `erp_write` row the calling flow already created against the request (NV-8), so
 * the archival has a case behind it before anything is attempted.
 */
export function archiveDocument(requestSysId: string, writeId: string): ArchiveResult {
    const req = new GlideRecord(T_REQ)
    if (!req.get(requestSysId)) {
        return res(false, 'failed', 'Document request not found.', '', writeId)
    }
    // A document that was never generated has nothing to archive, and asking the ERP to file
    // nothing is how an empty file lands in a personnel record.
    if (String(req.getValue('status') || '') !== 'generated') {
        return res(false, 'failed', 'Nothing to archive -- the document was not generated.', '', writeId)
    }

    const write = new GlideRecord(T_WRITE)
    if (!write.get('sys_id', writeId)) {
        return res(false, 'failed', 'Write record not found.', '', writeId)
    }
    const systemId = String(write.getValue('erp_system') || '')
    const employeeKey = String(write.getValue('external_id') || '')

    if (!archivalGranted(systemId)) {
        const sys = new GlideRecord('x_335329_sn_hr_erp_erp_system')
        const name = sys.get('sys_id', systemId) ? String(sys.getValue('name') || 'This ERP') : 'This ERP'
        const msg = name + ' does not expose document archival -- R5 archival unavailable.'
        // NOT a failure of this request: the employee has their document. It is a capability gap.
        write.setValue('state', 'blocked_readonly')
        write.setValue('error_message', msg)
        write.update()
        return res(false, 'blocked_readonly', msg, '', writeId)
    }

    const attachment = attachmentOf(requestSysId)
    if (!attachment.id) {
        return res(false, 'failed', 'Nothing to archive -- the request carries no document.', '', writeId)
    }

    // The category is the document type's code, which is also the idempotency qualifier: the same
    // employee may legitimately hold one letter per type, and two of the same type is the
    // duplicate BRD R5 forbids.
    const type = new GlideRecord('x_335329_sn_hr_erp_doc_type')
    const category = type.get(String(req.getValue('document_type') || '')) ? String(type.getValue('code') || '') : ''
    if (!category) {
        // NV-37 AC4. A document with no category would be filed where nobody can find it.
        return res(false, 'failed', 'Archival refused -- this document type has no ERP category configured.', '', writeId)
    }

    // ---- The governed pre-flight, shared with the JSON dispatcher.
    const pre = preflight(writeId, new GlideDateTime().getValue().substring(0, 10))
    if (!pre.proceed) {
        return res(pre.state === 'confirmed', pre.state, pre.message, pre.priorAck, writeId)
    }

    // ---- Existence check BEFORE the upload (NV-4). This is what makes a retry safe: after a
    // timeout the caller does not know whether the first attempt landed, and asking is the only
    // honest way to find out.
    const listing = listArchived(systemId, employeeKey)
    if (listing.ok) {
        const existing = alreadyArchived(listing, category, attachment.name)
        if (existing) {
            const done = new GlideRecord(T_WRITE)
            if (done.get('sys_id', writeId)) {
                done.setValue('state', 'confirmed')
                done.setValue('erp_ack_ref', existing)
                done.setValue('confirmed_at', new GlideDateTime().getValue())
                done.update()
            }
            return res(true, 'confirmed', 'Already archived in the ERP as ' + existing, existing, writeId)
        }
    }
    // A FAILED EXISTENCE CHECK DOES NOT BLOCK THE FIRST ARCHIVAL, and it does not silently
    // authorise a retry either: `attempts` is what separates them. On a retry we cannot prove
    // absence, so we refuse rather than risk the duplicate BRD R5 exists to prevent.
    if (!listing.ok && parseInt(String(write.getValue('attempts') || '0'), 10) > 0) {
        const msg = 'Archival retry refused -- the ERP could not confirm whether the document is already filed.'
        const q = new GlideRecord(T_WRITE)
        if (q.get('sys_id', writeId)) {
            q.setValue('state', 'queued')
            q.setValue('error_message', msg)
            q.update()
        }
        return res(false, 'queued', msg, '', writeId)
    }

    const system = loadSystem(systemId).config
    // OD51: the CREATE map, not the read map. The listing above resolves the read map for the
    // same object, and they are different endpoints -- listing an employee's archived documents
    // and filing a new one are not the same call in any ERP.
    const map = loadMap(systemId, OBJECT, 'create')
    if (!system || !map) {
        return res(
            false,
            'failed',
            'Not configured -- create an Object Map for ' + OBJECT + ' with operation create',
            '',
            writeId,
        )
    }
    const url = buildEndpoint(system, map, { externalId: employeeKey })

    const stamp = new GlideRecord(T_WRITE)
    if (stamp.get('sys_id', writeId)) {
        if (!String(stamp.getValue('first_sent_at') || '')) {
            stamp.setValue('first_sent_at', new GlideDateTime().getValue())
        }
        stamp.setValue('idempotency_key', pre.key)
        stamp.setValue('attempts', parseInt(String(stamp.getValue('attempts') || '0'), 10) + 1)
        stamp.setValue('state', 'sent')
        stamp.update()
    }

    const upload = uploadBinary(system, url, attachment.id, attachment.name, attachment.type, OBJECT)
    if (upload.callLogId) {
        const t = new GlideRecord(T_WRITE)
        if (t.get('sys_id', writeId)) {
            const existing = String(t.getValue('call_log_ids') || '')
            t.setValue('call_log_ids', existing ? existing + ',' + upload.callLogId : upload.callLogId)
            t.update()
        }
    }

    if (!upload.ok) {
        const q = new GlideRecord(T_WRITE)
        if (q.get('sys_id', writeId)) {
            q.setValue('state', 'failed')
            q.setValue('error_message', upload.error)
            q.update()
        }
        raiseException({
            systemId: systemId,
            status: upload.httpCode,
            transportError: upload.httpCode ? '' : 'no response',
            shortDescription: 'Document archival failed for ' + category,
            erpMessage: upload.error,
            writeId: writeId,
            sourceTable: T_REQ,
            sourceRecord: requestSysId,
            // `raiseException` returns '' on a falsy group and the table's column is mandatory, so
            // passing '' here meant a FAILED ARCHIVAL RAISED NOTHING AT ALL -- NV-37's exception
            // AC silently never happened, and a document that never reached the ERP left no queue
            // item for anyone to work.
            assignmentGroup: defaultAssignmentGroup(),
            callLogIds: upload.callLogId,
        })
        // THE EMPLOYEE KEEPS THEIR DOCUMENT (NV-37 AC5). Deleting it because the filing failed
        // punishes the employee for an ERP outage.
        return res(false, 'failed', 'Issued. ERP archival pending.', '', writeId)
    }

    // A 2xx is not success on its own. No confirmable reference means the ERP may or may not hold
    // the file, and `confirmed` would assert something we cannot check.
    const ack = extractAck(upload.body)
    if (!ack) {
        const q = new GlideRecord(T_WRITE)
        if (q.get('sys_id', writeId)) {
            q.setValue('state', 'failed')
            q.setValue('error_message', 'Archival returned no confirmable reference (TRD §2 Write pattern).')
            q.update()
        }
        return res(false, 'failed', 'Issued. ERP archival pending.', '', writeId)
    }

    const done = new GlideRecord(T_WRITE)
    if (done.get('sys_id', writeId)) {
        done.setValue('state', 'confirmed')
        done.setValue('erp_ack_ref', ack)
        done.setValue('confirmed_at', new GlideDateTime().getValue())
        done.update()
    }
    return res(true, 'confirmed', 'Archived in the ERP as ' + ack, ack, writeId)
}

// ===========================================================================================
// NV-38 -- reconciliation.
// ===========================================================================================

export interface Reconciliation {
    /** True only when BOTH sides answered. False means no number is rendered at all. */
    reconcilable: boolean
    message: string
    issuedAndArchived: number
    issuedNotArchived: number
    archivedWithNoServiceNowRecord: number
    documents: ArchivedDocument[]
}

/**
 * Compare what the ERP holds against what this application issued.
 *
 * EVERY COUNT IS REFUSED IF EITHER SIDE FAILED (NV-38 AC3). `0 issued, 0 archived, all
 * reconciled` from an ERP that never answered is the four-state rule's exact failure: a number
 * nobody investigates standing in for an absence.
 */
export function reconcile(systemId: string, employeeKey: string): Reconciliation {
    const empty = { issuedAndArchived: 0, issuedNotArchived: 0, archivedWithNoServiceNowRecord: 0 }

    const listing = listArchived(systemId, employeeKey)
    if (!listing.ok) {
        return {
            reconcilable: false,
            message: 'Could not be reconciled -- the ERP did not answer',
            documents: [],
            issuedAndArchived: empty.issuedAndArchived,
            issuedNotArchived: empty.issuedNotArchived,
            archivedWithNoServiceNowRecord: empty.archivedWithNoServiceNowRecord,
        }
    }

    const write = new GlideRecord(T_WRITE)
    write.addQuery('erp_system', systemId)
    write.addQuery('logical_object', OBJECT)
    write.addQuery('external_id', employeeKey)
    write.query()

    const seen: { [ref: string]: boolean } = {}
    let archived = 0
    let notArchived = 0
    while (write.next()) {
        const ref = String(write.getValue('erp_ack_ref') || '')
        if (String(write.getValue('state') || '') === 'confirmed' && ref) {
            archived++
            seen[ref] = true
        } else {
            notArchived++
        }
    }

    let orphan = 0
    for (let i = 0; i < listing.documents.length; i++) {
        if (!seen[listing.documents[i].reference]) {
            orphan++
        }
    }

    return {
        reconcilable: true,
        message: '',
        issuedAndArchived: archived,
        issuedNotArchived: notArchived,
        archivedWithNoServiceNowRecord: orphan,
        documents: listing.documents,
    }
}
