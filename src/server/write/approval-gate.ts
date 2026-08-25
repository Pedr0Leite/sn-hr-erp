import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { countryOrder } from '../country.ts'

/**
 * NV-9 / OD44 -- the approval gate. LAYER TWO OF TWO.
 *
 * Layer one is a `before insert` business rule on erp_write, which produces the readable message.
 * THIS function is layer two, called by the dispatcher immediately before the HTTP request.
 *
 * Why two layers, when one would pass every ordinary test: CLAUDE.md trap 5, established live on
 * this instance -- A `before` BUSINESS RULE THAT THROWS IS SWALLOWED AND THE RECORD SAVES. A
 * crashed gate and an approving gate are indistinguishable from the record's state. A rule is
 * therefore the wrong and only place to enforce something whose failure mode is "the payment
 * went out". This layer is not a rule, so a rule crash cannot lift it.
 *
 * T9-8 deliberately breaks the business rule and asserts the write still does not reach the ERP.
 */

export interface GateResult {
    allowed: boolean
    /** Plain language, already safe to render. */
    reason: string
}

/** Resolve the policy from DATA (NV-9 AC1), never a code branch per flow. */
function policyRow(policyKey: string, country: string): GlideRecord<'x_335329_sn_hr_erp_write_approval_policy'> | null {
    const gr = new GlideRecord('x_335329_sn_hr_erp_write_approval_policy')
    gr.addQuery('policy_key', policyKey)
    gr.addQuery('active', true)
    gr.addQuery('country', country)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? gr : null
}

export function approvalRequired(policyKey: string, country: string): boolean {
    // NV-51: the SHARED country rule, not a local one. It was once a single
    // `addQuery('country', 'IN', ...)` whose list is EMPTY when the country is unknown -- and if
    // that matched nothing, this function returned false and the banking gate FAILED OPEN.
    // `countryOrder()` is now the only definition of the fallback in the application.
    const order = countryOrder(country)
    let gr = null
    for (let i = 0; i < order.length && !gr; i++) {
        gr = policyRow(policyKey, order[i])
    }
    if (gr) {
        // getValue() on a Boolean returns '1'/'0', NOT 'true'/'false' -- CLAUDE.md trap 6.
        return String(gr.getValue('approval_required')) === '1'
    }
    // NO POLICY ROW MEANS NO APPROVAL REQUIRED, and that is safe ONLY because the policy rows for
    // every BRD-mandated gate ship seeded and their deactivation is ACL-denied (NV-33 AC1).
    return false
}

/**
 * Is there a valid, PRIOR approval for this write?
 *
 * The timing comparison is the substance of the story. An approval whose sys_updated_on is LATER
 * than first_sent_at is an approval granted after the fact -- it cannot retroactively authorise a
 * request that already left. NV-33 tests exactly this.
 */
export function gateWrite(writeId: string): GateResult {
    const write = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    if (!write.get(writeId)) {
        return { allowed: false, reason: 'Write record not found.' }
    }

    // The row's own key wins. NV-32 (address) and NV-33 (banking) are BOTH
    // `employee_profile.update`, and only the second is gated -- deriving the key from the object
    // and operation alone would either gate every address change or gate no banking change. A
    // document release uses the same seam with `document.D2` (NV-40).
    const policyKey =
        String(write.getValue('policy_key') || '') ||
        String(write.getValue('logical_object') || '') + '.' + String(write.getValue('operation') || '')
    // THE COUNTRY, RESOLVED FROM THE ERP LINK. Passing '' here made every country-specific policy
    // row unreachable -- a jurisdiction that mandates approval where the default does not would
    // have had its gate silently skipped.
    const country = payrollCountryFor(
        String(write.getValue('external_id') || ''),
        String(write.getValue('erp_system') || ''),
    )
    if (!approvalRequired(policyKey, country)) {
        return { allowed: true, reason: '' }
    }

    const approvalId = String(write.getValue('approval_ref') || '')
    if (!approvalId) {
        return { allowed: false, reason: 'Approval record missing -- write refused.' }
    }

    const appr = new GlideRecord('sysapproval_approver')
    if (!appr.get('sys_id', approvalId)) {
        return { allowed: false, reason: 'Approval record missing -- write refused.' }
    }
    if (String(appr.getValue('state')) !== 'approved') {
        return { allowed: false, reason: 'Approval is not granted -- write refused.' }
    }

    // The approval must belong to the SAME case that raised the write. Without this, an approval
    // from any other case would satisfy the gate.
    const approvalDoc = String(appr.getValue('sysapproval') || '')
    if (approvalDoc && approvalDoc !== String(write.getValue('source_record') || '')) {
        return { allowed: false, reason: 'Approval belongs to a different case -- write refused.' }
    }

    const firstSent = String(write.getValue('first_sent_at') || '')
    if (firstSent) {
        const approvedAt = new GlideDateTime(String(appr.getValue('sys_updated_on') || ''))
        const sentAt = new GlideDateTime(firstSent)
        if (approvedAt.getNumericValue() > sentAt.getNumericValue()) {
            return {
                allowed: false,
                reason: 'Approval was recorded after dispatch -- a retroactive approval does not satisfy the gate.',
            }
        }
    }

    return { allowed: true, reason: '' }
}


/**
 * The employee's payroll country, from `emp_xref`. Blank when the link or the column is empty --
 * which resolves the country-agnostic policy, never a guessed jurisdiction.
 */
export function payrollCountryFor(employeeKey: string, systemId: string): string {
    if (!employeeKey || !systemId) {
        return ''
    }
    const gr = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    gr.addQuery('erp_system', systemId)
    gr.addQuery('erp_employee_key', employeeKey)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? String(gr.getValue('payroll_country') || '') : ''
}
