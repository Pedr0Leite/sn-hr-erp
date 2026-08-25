import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { resolveIdentity } from './identity.ts'
import { dispatch } from './dispatcher.ts'
import { createWrite } from './create-write.ts'
import type { DispatchResult } from './dispatcher.ts'

/**
 * NV-44 -- contract, role or compensation change with an effective date (R6, INT-06).
 *
 * THE EFFECTIVE DATE IS THE POINT. A promotion dispatched today with next month's effective date
 * belongs to next month's payroll cycle, and the cut-off is judged against THAT date, not against
 * today -- which is why `dispatch()` takes the effective date as an argument rather than reading
 * the clock. A change that misses its cycle is a person paid the wrong amount.
 *
 * THE NEW SALARY FIGURE IS NEVER PERSISTED BY THIS APPLICATION. It travels in the payload
 * argument to `dispatch()`, which stores a hash and never the body; no message composed here ever
 * quotes it. NV-44 AC4 greps `call_log`, `erp_write`, `erp_exception` and `doc_audit` for the
 * seeded figure and requires zero hits in all four.
 */

export const COMPENSATION_POLICY_KEY = 'compensation_change.update'

/** The stages the BRD names. Finance is required for salary changes and only for those. */
export type ChangeType = 'salary' | 'role' | 'department' | 'contract'

export interface ChangeRequest {
    changeType: ChangeType
    effectiveDate: string
    oldValue: string
    newValue: string
    currency: string
}

export interface ChainResult {
    complete: boolean
    /** Names the MISSING stage. "Approval missing" alone tells an HRBP nothing actionable. */
    reason: string
    /** The approval that authorises the dispatch -- the last stage to approve. */
    approvalRef: string
}

/**
 * Is the approval chain complete for this change?
 *
 * Manager and HR always; Finance additionally when the change is to salary. A salary change that
 * manager and HR approved but Finance did not is BLOCKED -- NV-44 AC6 asserts zero outbound
 * requests in that state, because "two of three approvals" is not an approval.
 *
 * `stageOf` reads the approval's group or role name, so the chain is configuration rather than a
 * hard-coded list of user ids.
 */
export function approvalChainComplete(sourceRecord: string, changeType: string): ChainResult {
    const key = policyKeyFor(changeType)
    const groups = requiredGroups(key)
    if (groups.length === 0) {
        return {
            complete: false,
            reason:
                'No approver groups are configured for ' +
                key +
                '. A compensation change cannot dispatch until the approval policy names the groups that must approve it.',
            approvalRef: '',
        }
    }

    let last = ''
    for (let i = 0; i < groups.length; i++) {
        const approvalId = approvalFromGroup(sourceRecord, groups[i])
        if (!approvalId) {
            return {
                complete: false,
                reason: 'The ' + groups[i] + ' approval has not been given.',
                approvalRef: '',
            }
        }
        last = approvalId
    }
    return { complete: true, reason: '', approvalRef: last }
}

/** Salary changes are judged against their own policy key, which names the extra Finance group. */
export function policyKeyFor(changeType: string): string {
    return String(changeType) === 'salary' ? COMPENSATION_POLICY_KEY + '.salary' : COMPENSATION_POLICY_KEY
}

/** The ordered group names this gate requires, from the policy row. */
function requiredGroups(policyKey: string): string[] {
    const gr = new GlideRecord('x_335329_sn_hr_erp_write_approval_policy')
    gr.addQuery('policy_key', policyKey)
    gr.addQuery('active', true)
    gr.setLimit(1)
    gr.query()
    if (!gr.next()) {
        return []
    }
    const out: string[] = []
    const parts = String(gr.getValue('required_groups') || '').split(',')
    for (let i = 0; i < parts.length; i++) {
        const name = parts[i].trim()
        if (name) {
            out.push(name)
        }
    }
    return out
}

/**
 * An approved approval for this case whose approver belongs to `groupName`.
 *
 * THIS IS THE FIX FOR A GATE THAT COULD NEVER OPEN. The first implementation read the stage from
 * `sysapproval_approver.source_table`, which holds a TABLE NAME -- nothing in the platform ever
 * writes 'manager' or 'finance' there, so the chain never completed and every compensation change
 * sat in `blocked_approval` for ever. It failed closed, which is the right direction to fail, and
 * it was still unusable.
 *
 * Group membership is the stage, because it is the thing the organisation already configures: a
 * Finance approval is one given by somebody in the Finance group.
 */
function approvalFromGroup(sourceRecord: string, groupName: string): string {
    const group = new GlideRecord('sys_user_group')
    group.addQuery('name', groupName)
    group.setLimit(1)
    group.query()
    if (!group.next()) {
        // A group that does not exist cannot have approved anything. Refusing here is what keeps
        // a typo in the policy from reading as "this stage is satisfied".
        return ''
    }
    const groupId = String(group.getUniqueValue())

    const appr = new GlideRecord('sysapproval_approver')
    appr.addQuery('sysapproval', sourceRecord)
    appr.addQuery('state', 'approved')
    appr.orderBy('sys_updated_on')
    appr.query()
    while (appr.next()) {
        const member = new GlideRecord('sys_user_grmember')
        member.addQuery('group', groupId)
        member.addQuery('user', String(appr.getValue('approver') || ''))
        member.setLimit(1)
        member.query()
        if (member.next()) {
            return String(appr.getUniqueValue())
        }
    }
    return ''
}

function refused(message: string): DispatchResult {
    return { ok: false, state: 'failed', message: message, writeId: '', ackRef: '' }
}

/**
 * Submit an approved compensation or contract change.
 *
 * A change with no effective date is REFUSED before anything is queued (NV-21). "Effective when
 * the ERP happens to process it" is not an answer a payroll auditor accepts, and an empty date
 * silently becomes "today" in most ERPs -- which is the wrong cycle roughly half the time.
 */
export function submitChange(
    userSysId: string,
    systemId: string,
    sourceTable: string,
    sourceRecord: string,
    change: ChangeRequest,
): DispatchResult {
    const identity = resolveIdentity(userSysId, systemId)
    if (!identity.ok) {
        return refused(identity.message)
    }
    const effective = String(change.effectiveDate || '').substring(0, 10)
    if (!effective) {
        return refused('This change has no effective date. A change with no effective date cannot be dated to a payroll cycle.')
    }
    if (String(change.changeType) === 'salary' && !String(change.currency || '')) {
        // A salary with no currency is a number, and payroll will interpret it in whichever
        // currency the ERP defaults to.
        return refused('A salary change needs an explicit currency.')
    }

    const chain = approvalChainComplete(sourceRecord, String(change.changeType))
    if (!chain.complete) {
        return { ok: false, state: 'blocked_approval', message: chain.reason, writeId: '', ackRef: '' }
    }

    const writeId = createWrite({
        systemId: systemId,
        logicalObject: 'compensation_change',
        operation: 'update',
        externalId: identity.employeeKey,
        sourceTable: sourceTable,
        sourceRecord: sourceRecord,
        requestedBy: userSysId,
        approvalRef: chain.approvalRef,
        policyKey: policyKeyFor(String(change.changeType)),
        // The effective date qualifies the key: the same employee may legitimately have two
        // salary changes in a year, and they are not retries of each other.
        qualifier: effective,
    })
    if (!writeId) {
        return refused('The change could not be queued.')
    }

    const payload = JSON.stringify({
        employee_id: identity.employeeKey,
        change_type: change.changeType,
        effective_date: effective,
        old_value: change.oldValue,
        new_value: change.newValue,
        currency: change.currency,
        approval_reference: chain.approvalRef,
    })
    // A cut-off refusal here leaves the row `blocked_cutoff` and QUEUED, not dropped: NV-44 AC3
    // requires it to dispatch automatically when the next period opens, which the drainer does by
    // re-calling this write. Nothing about the change is lost in the meantime.
    return dispatch(writeId, payload, effective)
}

/** The current date, for a caller that needs the default effective date. Never inside a payload. */
export function today(): string {
    return new GlideDateTime().getValue().substring(0, 10)
}
