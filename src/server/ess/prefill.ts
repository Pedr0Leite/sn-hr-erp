import { readForEmployee } from './read-service.ts'

/**
 * NV-31 -- the prefill read behind every personal-data change form.
 *
 * THE POINT OF THE STORY IS WHAT IS *NOT* SHOWN. A field the ERP did not return must render
 * empty and LABELLED, because a silently blank field on a change form is indistinguishable
 * from a value the employee cleared on purpose -- and submitting that blank overwrites a real
 * value in a payroll system with nothing. `Not returned by the ERP` is therefore a rendered
 * string, not a code comment.
 *
 * NEVER PREFILL FROM `sys_user` (NV-31 AC2). ServiceNow's copy of an address is not the ERP's
 * copy, and showing one as though it were the other invites the employee to "confirm" a value
 * the ERP has never held.
 *
 * OD47 -- THE URL PREFILL PATH IS FORBIDDEN FOR THIS FORM. The platform's documented prefill
 * mechanism is `sysparm_variable_values={...}` in the URL
 * (servicenow-platform/service-catalog/prefill-variable-values-catalog-item-form.md). It works,
 * and it puts every prefilled value in the URL -- which lands in browser history, in the
 * referrer header, and in every proxy and web-server access log between the employee and the
 * instance. NV-31 AC3 requires that the full IBAN never appear in the page payload, and a
 * masked value cannot be un-masked for submission anyway. This module is therefore server-side
 * and is read by a catalog client script over GlideAjax/Scripted REST; the URL mechanism is
 * rejected for prefill of any field this module marks `masked`.
 *
 * NOTHING READ HERE IS WRITTEN ANYWHERE (DL-D2, BRD O3). The result is a return value.
 */

/** Rendered verbatim. A field with no ERP value gets this label, never a blank and never a `0`. */
export const NOT_RETURNED = 'Not returned by the ERP'

/**
 * Fields that may be READ for display but only ever in masked form, and may never be submitted
 * through the non-sensitive item (NV-32 AC8 enforces the second half).
 */
export const MASKED_FIELDS = ['bank_account_iban', 'bank_account_number']

export interface PrefillField {
    field: string
    /** Already masked where the field is sensitive. Safe to serialise to the browser. */
    value: string
    /** False when the ERP answered but had no value for this field. */
    returned: boolean
    masked: boolean
    /** What the form renders under the field when `returned` is false. */
    label: string
}

export interface PrefillResult {
    /** Mirrors ReadState so the form and the tile speak the same four-state vocabulary. */
    state: string
    /** False => do not render the Submit control at all (repo rule 1). */
    orderable: boolean
    /** True => render every field disabled. A form you cannot see is a form you must not save. */
    readOnly: boolean
    message: string
    fields: PrefillField[]
}

/**
 * Last four characters only, and never fewer than four asterisks, so the mask does not leak the
 * length of a short value.
 */
export function maskTail(raw: string): string {
    const text = String(raw || '')
    if (text === '') {
        return ''
    }
    const tail = text.length > 4 ? text.substring(text.length - 4) : text
    return '****' + tail
}

function isMasked(field: string): boolean {
    return MASKED_FIELDS.indexOf(field) !== -1
}

/**
 * Read the employee's current `employee_profile` and shape it for a change form.
 *
 * `wantedFields` is the form's field list. A field absent from the ERP response still appears in
 * the result, marked `returned: false` -- omitting it would leave the form silently short of a
 * field the employee expected to edit.
 */
export function prefillPersonal(userSysId: string, systemId: string, wantedFields: string[]): PrefillResult {
    const read = readForEmployee(userSysId, systemId, 'employee_profile')

    if (read.state === 'not_configured') {
        // NAMES THE REMEDY. The item is not orderable, rather than orderable-and-broken.
        return { state: 'not_configured', orderable: false, readOnly: true, message: read.message, fields: [] }
    }
    if (read.state !== 'live') {
        // failed / throttled / stale: the form renders READ-ONLY and says why. Submitting against
        // values you could not read is how a stale form overwrites a value changed meanwhile.
        return {
            state: read.state,
            orderable: false,
            readOnly: true,
            message:
                'Current values could not be retrieved from the ERP. Submitting now risks overwriting data you cannot see.',
            fields: [],
        }
    }

    // `live` with no row is NOT an empty form -- it means the ERP has no profile for this
    // employee, and a change form over a non-existent record has nothing to change.
    if (read.rows.length === 0) {
        return {
            state: 'failed',
            orderable: false,
            readOnly: true,
            message: 'The ERP returned no employee record for you. Contact HR before changing anything.',
            fields: [],
        }
    }

    const row = read.rows[0] as { [k: string]: string }
    const fields: PrefillField[] = []
    for (let i = 0; i < wantedFields.length; i++) {
        const name = wantedFields[i]
        const raw = row[name]
        const present = raw !== undefined && raw !== null && String(raw) !== ''
        const masked = isMasked(name)
        fields.push({
            field: name,
            value: present ? (masked ? maskTail(String(raw)) : String(raw)) : '',
            returned: present,
            masked: masked,
            label: present ? '' : NOT_RETURNED,
        })
    }

    return { state: 'live', orderable: true, readOnly: false, message: '', fields: fields }
}
