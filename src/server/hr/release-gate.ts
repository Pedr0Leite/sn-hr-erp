import { GlideRecord } from '@servicenow/glide'
import { approvalRequired } from '../write/approval-gate.ts'
import { payrollCountryOf } from './template-resolver.ts'

/**
 * NV-40 -- the document release gate (D2 Salary Certificate, and D6/D7/D8/D9 by the same seam).
 *
 * THE GATE IS AT GENERATION, NOT AT DELIVERY. NV-40 AC2 asks that the employee cannot see the PDF
 * before approval, and asserts it by re-reading `sys_attachment` rather than by checking whether
 * a UI control was hidden. The only implementation that survives that test is one where the file
 * DOES NOT EXIST yet: generate-then-hide leaves a salary figure in an attachment row, protected
 * by nothing but an ACL and whoever remembers it is there.
 *
 * The policy key is `document.<code>`, resolved from data through the same
 * `write_approval_policy` table every write gate uses -- so a new gated document is a seeded row,
 * not a code change.
 */

export interface ReleaseDecision {
    allowed: boolean
    /** Written to `doc_req.failure_reason` is WRONG for this case -- the request is not failed. */
    reason: string
}

export function policyKeyFor(typeCode: string): string {
    return 'document.' + String(typeCode || '')
}

/**
 * Is this document cleared to be generated?
 *
 * An approval that does not belong to THIS request does not clear it, and a rejected approval is
 * a refusal rather than a wait -- the two produce different messages because they need different
 * things from the reader.
 */
export function releaseAllowed(docRequestSysId: string, typeCode: string, subjectUserSysId?: string): ReleaseDecision {
    // A jurisdiction may gate a document the default does not (NV-51). Passing '' made every
    // country-specific document policy unreachable.
    const country = subjectUserSysId ? payrollCountryOf(subjectUserSysId) : ''
    if (!approvalRequired(policyKeyFor(typeCode), country)) {
        return { allowed: true, reason: '' }
    }

    const appr = new GlideRecord('sysapproval_approver')
    appr.addQuery('sysapproval', docRequestSysId)
    appr.orderByDesc('sys_updated_on')
    appr.query()
    while (appr.next()) {
        const state = String(appr.getValue('state') || '')
        if (state === 'approved') {
            return { allowed: true, reason: '' }
        }
        if (state === 'rejected') {
            return { allowed: false, reason: 'Approval rejected' }
        }
    }
    return {
        allowed: false,
        reason: 'Awaiting approval -- this document is not generated until it is released.',
    }
}
