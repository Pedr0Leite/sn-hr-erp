import { GlideDateTime, GlideRecord, GlideSysAttachment } from '@servicenow/glide'
import { loadMap } from '../connector/config-loader.ts'
import { fetch } from '../connector/erp-connector.ts'
import { mapResponse } from '../connector/field-mapper.ts'
import { DocumentContext, probePdf, renderHtml, resolveFormat } from './render.ts'

// L6-9 / L6-10 / L6-11 / L6-13. docs/l6-document-design.md §5.
//
// ===========================================================================================
// THE RULE THIS WHOLE FILE EXISTS TO SERVE:
//   A DOCUMENT THAT CANNOT BE GENERATED CORRECTLY IS NOT GENERATED AT ALL, AND SAYS WHY.
// There is no partial document, no placeholder standing in for a figure, no fallback to a
// stored value, and no file labelled PDF that is not one. "A blank or a zero on a salary
// certificate is a document someone applies for a mortgage with."
// ===========================================================================================
//
// NOTHING IS PERSISTED (§5.1). DocumentContext lives in a local variable and is passed to the
// renderer. It is never written to a table, a property, a cache or a log line. Every failure
// message names the FIELD, never its value (R6-2). `source_call_ids` holds sys_ids and nothing
// else -- an audit row quoting the salary reintroduces the shadow database through the back door.
//
// NO FALLBACK EXISTS, AND IT IS UNREACHABLE RATHER THAN MERELY OMITTED (§5.2): payroll_record
// and employee_profile cannot be staged (enforced three ways at L3), so there is nothing to
// substitute FROM.
//
// EVERY RELATIVE IMPORT CARRIES `.ts` (D19). Stripping one leaves this module silently dead.

const T_REQ = 'x_335329_sn_hr_erp_doc_req'

function nowValue(): string {
    // gs.nowDateTime() is not allowed in scoped apps (kickoff §9).
    return new GlideDateTime().getValue()
}

/** One place writes a failure, so a failure can never be written without a stated reason. */
function fail(req: any, reason: string): void {
    req.setValue('status', 'failed')
    req.setValue('failure_reason', reason)
    req.update()
}

function appendCallId(req: any, callLogId: string | null): void {
    if (!callLogId) {
        return
    }
    // L6-D7 -- WRITTEN AS CALLS HAPPEN, NOT ON SUCCESS. A failed request must be audited as
    // thoroughly as a successful one, and that includes the id of the call that failed.
    const existing = String(req.getValue('source_call_ids') || '')
    req.setValue('source_call_ids', existing ? existing + ',' + callLogId : callLogId)
    req.update()
}

interface Requirement {
    object: string
    field: string
}

function parseRequirements(raw: string): Requirement[] {
    const out: Requirement[] = []
    const parts = String(raw || '').split(',')
    for (let i = 0; i < parts.length; i++) {
        const pair = parts[i].replace(/\s+/g, '')
        const dot = pair.indexOf('.')
        if (pair && dot > 0) {
            out.push({ object: pair.substring(0, dot), field: pair.substring(dot + 1) })
        }
    }
    return out
}

function distinctObjects(reqs: Requirement[], declared: string): string[] {
    const out: string[] = []
    const parts = String(declared || '').split(',')
    for (let i = 0; i < parts.length; i++) {
        const name = parts[i].replace(/\s+/g, '')
        if (name && out.indexOf(name) === -1) {
            out.push(name)
        }
    }
    for (let i = 0; i < reqs.length; i++) {
        if (out.indexOf(reqs[i].object) === -1) {
            out.push(reqs[i].object)
        }
    }
    return out
}

/**
 * §5. Generate one document. IDEMPOTENT: a request that is not `pending` is left alone, so a
 * second drain pass cannot produce a second attachment.
 */
export function generate(requestSysId: string): void {
    const req = new GlideRecord(T_REQ)
    if (!req.get(requestSysId)) {
        return
    }
    if (String(req.getValue('status') || '') !== 'pending') {
        return
    }

    const type = new GlideRecord('x_335329_sn_hr_erp_doc_type')
    if (!type.get(String(req.getValue('document_type') || ''))) {
        fail(req, 'Cannot generate the document: its document type no longer exists.')
        return
    }
    const typeName = String(type.getValue('name') || '')
    if (String(type.getValue('active') || '') !== '1') {
        fail(req, 'Document type ' + typeName + ' is not active.')
        return
    }

    // --- 3. The cross-reference. No xref, no ERP-side identity, no document. ----------------
    const xref = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    xref.addQuery('user', String(req.getValue('subject_employee') || ''))
    xref.addQuery('active', true)
    xref.setLimit(1)
    xref.query()
    if (!xref.next()) {
        fail(
            req,
            'Cannot generate ' + typeName + ': no employee cross-reference exists for the subject employee.',
        )
        return
    }
    const systemSysId = String(xref.getValue('erp_system') || '')
    const employeeKey = String(xref.getValue('erp_employee_key') || '')

    const system = new GlideRecord('x_335329_sn_hr_erp_erp_system')
    const systemName = system.get(systemSysId) ? String(system.getValue('name') || systemSysId) : systemSysId

    // --- 4. PRE-FLIGHT, BEFORE ANY RENDERING AND BEFORE ANY ERP CALL (L6-D3). ---------------
    //
    // A document that cannot be completed should not cost an ERP call, and a mapping gap should
    // be reported AS A MAPPING GAP rather than surfacing later as a missing figure -- which is
    // a far less actionable sentence for the admin who has to fix it. T6-11 instruments the
    // outbound calls and requires ZERO of them on this path.
    const required = parseRequirements(String(type.getValue('required_fields') || ''))
    const optional = parseRequirements(String(type.getValue('optional_fields') || ''))
    const objects = distinctObjects(required, String(type.getValue('required_objects') || ''))

    const maps: { [object: string]: any } = {}
    for (let i = 0; i < objects.length; i++) {
        const map = loadMap(systemSysId, objects[i])
        if (!map || !map.active) {
            fail(req, 'Cannot generate ' + typeName + ": '" + objects[i] + "' is not mapped for system " + systemName + '.')
            return
        }
        maps[objects[i]] = map
    }
    for (let i = 0; i < required.length; i++) {
        const map = maps[required[i].object]
        let found = false
        for (let f = 0; f < map.fields.length; f++) {
            if (map.fields[f].logicalField === required[i].field) {
                found = true
            }
        }
        if (!found) {
            fail(
                req,
                'Cannot generate ' + typeName + ": '" + required[i].field + "' is not mapped for system " + systemName + '.',
            )
            return
        }
    }

    // --- 5. LIVE FETCH. Nothing here is staged, cached or retained (D2/D10). ----------------
    const rows: { [object: string]: { [field: string]: string } } = {}
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i]
        const map = maps[object]
        const result = fetch(systemSysId, object, { externalId: employeeKey })
        appendCallId(req, result.callLogId)
        if (!result.ok || !result.body) {
            fail(
                req,
                'Cannot generate ' +
                    typeName +
                    ': ' +
                    systemName +
                    ' did not answer for ' +
                    object +
                    ' (' +
                    String(result.errorCode || result.status) +
                    ').',
            )
            return
        }
        let parsed: unknown = null
        try {
            parsed = JSON.parse(String(result.body))
        } catch (e) {
            fail(req, 'Cannot generate ' + typeName + ': the response from ' + systemName + ' for ' + object + ' was unparseable.')
            return
        }
        // mapRecord/mapResponse already apply L1 §4.4's zero rule: a value that is empty, or
        // that is 0 while `zero_is_meaningful` is false, is OMITTED from the mapped record --
        // ABSENT, not zero. L6-D5 is therefore enforced by the shared mapper, not re-implemented
        // here, and the safe direction is the default.
        const mapped = mapResponse(parsed, map.responseRoot, object, map.fields, map.dateFormat)
        if (!mapped || mapped.length === 0) {
            fail(req, 'Cannot generate ' + typeName + ': ' + systemName + ' returned no ' + object + ' record for this employee.')
            return
        }
        rows[object] = mapped[0] as { [field: string]: string }
    }

    // --- 6. Context. ANY required field unavailable => NO DOCUMENT. -------------------------
    const context: DocumentContext = {}
    for (let i = 0; i < required.length; i++) {
        const value = rows[required[i].object][required[i].field]
        if (value === undefined || value === null || String(value) === '') {
            // The message names the FIELD. It never quotes the value -- failure_reason is a
            // readable, audited column, and a salary in it is a salary in the database (R6-2).
            fail(
                req,
                'Cannot generate ' + typeName + ": '" + required[i].field + "' was not returned by " + systemName + '.',
            )
            return
        }
        context[required[i].field] = String(value)
    }
    for (let i = 0; i < optional.length; i++) {
        const row = rows[optional[i].object]
        const value = row ? row[optional[i].field] : undefined
        if (value !== undefined && value !== null && String(value) !== '') {
            context[optional[i].field] = String(value)
        }
    }

    // --- 7. Render. ------------------------------------------------------------------------
    const tmpl = new GlideRecord('x_335329_sn_hr_erp_doc_tmpl')
    tmpl.addQuery('document_type', type.getUniqueValue())
    tmpl.addQuery('active', true)
    tmpl.setLimit(1)
    tmpl.query()
    if (!tmpl.next()) {
        fail(req, 'Cannot generate ' + typeName + ': no active template exists for this document type.')
        return
    }
    const rendered = renderHtml(context, String(tmpl.getValue('body') || ''))
    if (!rendered.html) {
        fail(req, 'Cannot generate ' + typeName + ': ' + rendered.error + '.')
        return
    }

    // --- 8. Format, then attach. THE RECORD SAYS WHAT WAS ACTUALLY PRODUCED. ----------------
    //
    // OD2 branch (a) is what runs today: no PDF generator is callable on this instance, so the
    // output is HTML and is LABELLED HTML. The probe runs HERE, at generation time, and its
    // result is recorded per request -- installing the store app later needs no redeploy.
    const probe = probePdf()
    req.setValue('pdf_probe_result', probe.result)
    // Only a converter that returned real `%PDF-` bytes yields the PDF format. No converter is
    // called on this instance, so `null` is passed and resolveFormat() returns HTML.
    const format = resolveFormat(probe, null)

    const attachment = new GlideSysAttachment()
    const fileName = String(req.getValue('number') || 'document') + format.extension
    const attachmentId = attachment.write(req, fileName, format.contentType, rendered.html)
    if (!attachmentId) {
        // No attachment, no claim of success. A zero-byte file is worse than no file.
        fail(req, 'Cannot generate ' + typeName + ': the rendered document could not be attached.')
        return
    }

    req.setValue('output_format', format.label)
    req.setValue('generated_on', nowValue())
    req.setValue('status', 'generated')
    req.update()
}

/**
 * L6-13 / L6-D2. The drainer. Generation is ASYNCHRONOUS: a live payroll call inside the submit
 * transaction means a slow ERP holds a user-facing transaction near the 300 s quota, which is a
 * real failure mode the connector's own budget guard exists because of.
 *
 * SHIPS `on_demand` + `active: false`. Nothing generates until a human runs it.
 */
export function drainDocumentQueue(): void {
    const gr = new GlideRecord(T_REQ)
    gr.addQuery('status', 'pending')
    gr.orderBy('sys_created_on')
    gr.setLimit(25)
    gr.query()
    const ids: string[] = []
    while (gr.next()) {
        ids.push(gr.getUniqueValue())
    }
    // Collected first, then generated: generate() re-queries and updates the same table, and
    // mutating a cursor mid-walk is how a queue silently skips half its rows.
    for (let i = 0; i < ids.length; i++) {
        generate(ids[i])
    }
}
