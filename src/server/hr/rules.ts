import { gs, GlideRecord } from '@servicenow/glide'
import { hasHrViewer } from '../api/role-check.ts'

// L6-4, L6-5, L6-7. The three `before` rules of docs/l6-document-design.md §3.2, §3.3 and §4.1.
//
// EVERY RELATIVE IMPORT IN THIS DIRECTORY CARRIES THE `.ts` EXTENSION (D19). Without it the
// specifier resolves to a sys_module path that does not exist: it builds clean, installs clean,
// and leaves the rule SILENTLY DEAD at runtime. That has already cost two deploy cycles.

/**
 * L6-4 / story L6-2 AC2. A document type cannot be activated with an empty requirement list.
 *
 * A type that requires nothing generates a document that verified nothing -- which is the blank
 * salary certificate this whole layer exists to prevent, arriving by configuration instead of
 * by a missing figure.
 */
export function validateDocType(current: any): void {
    const active = String(current.getValue('active') || '') === '1'
    const required = String(current.getValue('required_fields') || '').replace(/\s+/g, '')
    if (active && required === '') {
        gs.addErrorMessage(
            'A document type cannot be activated with no required fields: it would produce a document that verified nothing.',
        )
        current.setAbortAction(true)
    }
}

/** `${name}` occurrences in a template body, de-duplicated, in first-seen order. */
export function placeholdersIn(body: string): string[] {
    const out: string[] = []
    const re = /\$\{([a-zA-Z0-9_]+)\}/g
    let m = re.exec(body)
    while (m) {
        if (out.indexOf(m[1]) === -1) {
            out.push(m[1])
        }
        m = re.exec(body)
    }
    return out
}

/** The FIELD half of every `object.field` pair a document type declares. */
export function fieldsOfType(typeRecord: any): string[] {
    const out: string[] = []
    const raw = String(typeRecord.getValue('required_fields') || '') + ',' + String(typeRecord.getValue('optional_fields') || '')
    const parts = raw.split(',')
    for (let i = 0; i < parts.length; i++) {
        const pair = parts[i].replace(/\s+/g, '')
        if (!pair) {
            continue
        }
        const dot = pair.indexOf('.')
        const field = dot === -1 ? pair : pair.substring(dot + 1)
        if (field && out.indexOf(field) === -1) {
            out.push(field)
        }
    }
    return out
}

/**
 * L6-5 / story L6-2 AC7. A template may not reference a placeholder its type does not provide.
 *
 * The refusal NAMES BOTH SIDES, because "invalid template" is not something an admin can act on:
 *   Template references 'annual_gross_salary', which Employment Verification Letter does not provide.
 */
export function validateDocTemplate(current: any): void {
    const typeId = String(current.getValue('document_type') || '')
    if (!typeId) {
        return
    }
    const type = new GlideRecord('x_335329_sn_hr_erp_doc_type')
    if (!type.get(typeId)) {
        gs.addErrorMessage('The referenced document type does not exist.')
        current.setAbortAction(true)
        return
    }
    const provided = fieldsOfType(type)
    const used = placeholdersIn(String(current.getValue('body') || ''))
    for (let i = 0; i < used.length; i++) {
        if (provided.indexOf(used[i]) === -1) {
            gs.addErrorMessage(
                "Template references '" + used[i] + "', which " + String(type.getValue('name')) + ' does not provide.',
            )
            current.setAbortAction(true)
            return
        }
    }
}

/**
 * L6-7 / §4.1 -- THE SELF-SERVICE BOUNDARY, AND IT IS A BUSINESS RULE ON PURPOSE.
 *
 * Story L6-3 AC3: a request submitted via the TABLE API, bypassing the form entirely, naming a
 * subject employee other than the caller is refused. A boundary enforced only by hiding a field
 * on the record producer fails that story, because the producer is not in the path.
 *
 * Step 1 is why `requester` is deny-write: a Table API caller can put anything in that field,
 * and this rule overwrites it UNCONDITIONALLY before it is stored (L6-D4). Validating the
 * submitted value instead can be bypassed by a field the rule does not check; an unconditional
 * overwrite cannot.
 */
export function enforceRequestBoundary(current: any): void {
    const caller = String(gs.getUserID() || '')

    // 1. ALWAYS. Never trusted from the payload.
    current.setValue('requester', caller)

    // 2. An omitted subject is the caller -- self-service is the default, not a special case.
    let subject = String(current.getValue('subject_employee') || '')
    if (!subject) {
        subject = caller
        current.setValue('subject_employee', subject)
    }

    // 3. On behalf of somebody else is an hr_viewer privilege (L0-D3).
    if (subject !== caller && !hasHrViewer()) {
        gs.addErrorMessage('You may only request documents for yourself.')
        current.setAbortAction(true)
        return
    }

    // 4. AC6 -- refused AT SUBMISSION, not accepted and failed later. A request that can never
    // resolve to a person is not a pending document, it is a typo.
    const user = new GlideRecord('sys_user')
    if (!user.get('sys_id', subject) || String(user.getValue('active') || '') !== '1') {
        gs.addErrorMessage('Employee ' + subject + ' does not exist.')
        current.setAbortAction(true)
        return
    }

    // 5. An inactive type is named, not silently accepted.
    const typeId = String(current.getValue('document_type') || '')
    const type = new GlideRecord('x_335329_sn_hr_erp_doc_type')
    if (!typeId || !type.get(typeId)) {
        gs.addErrorMessage('The requested document type does not exist.')
        current.setAbortAction(true)
        return
    }
    if (String(type.getValue('active') || '') !== '1') {
        gs.addErrorMessage('Document type ' + String(type.getValue('name')) + ' is not active.')
        current.setAbortAction(true)
    }
}
