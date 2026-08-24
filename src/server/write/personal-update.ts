import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { resolveIdentity } from './identity.ts'
import { dispatch } from './dispatcher.ts'
import type { DispatchResult } from './dispatcher.ts'
import { approvalRequired } from './approval-gate.ts'
import { maskTail } from '../ess/prefill.ts'
import { createWrite } from './create-write.ts'

/**
 * NV-32 and NV-33 -- personal data and banking changes.
 *
 * The two stories share a diff and a dispatcher and differ in exactly one thing: NV-33 is
 * approval-gated and notifies the employee's PRIOR-of-record channel. They are one file because
 * the sensitive-field split must be visible in one place; they are two functions because a
 * banking change reaching the non-sensitive path is the payroll-fraud scenario BRD §9 risk 2
 * describes.
 *
 * ONLY CHANGED FIELDS ARE SENT (NV-32 AC1). Sending the whole form back means a value the
 * employee never touched -- but which someone changed in the ERP since the form was prefilled --
 * is silently overwritten with the stale prefill. The diff is not an optimisation.
 */

/**
 * Structurally excluded from the non-sensitive item. This list is the enforcement, not a UI
 * convention: `buildPersonalUpdate` refuses the submission rather than filtering the field out,
 * because silently dropping a field the employee filled in tells them the change was made.
 */
/** The field-level policy key every banking change is judged against (NV-33 AC1). */
export const BANKING_POLICY_KEY = 'employee_profile.bank_account_iban'

export const BANKING_FIELDS = ['bank_account_iban', 'bank_account_number', 'bank_bic', 'bank_name']

export interface Submission {
    [field: string]: string
}

export interface BuildResult {
    ok: boolean
    /** The fields that actually changed. Empty object with ok=true means "nothing to do". */
    changed: Submission
    message: string
}

/** Values that differ from what the ERP currently holds. An unchanged field is not a change. */
export function changedFields(current: Submission, submitted: Submission): Submission {
    const out: Submission = {}
    for (const key in submitted) {
        if (!Object.prototype.hasOwnProperty.call(submitted, key)) {
            continue
        }
        const before = current[key] === undefined || current[key] === null ? '' : String(current[key])
        const after = submitted[key] === undefined || submitted[key] === null ? '' : String(submitted[key])
        if (after !== before) {
            out[key] = after
        }
    }
    return out
}

function containsBanking(submitted: Submission): string {
    for (let i = 0; i < BANKING_FIELDS.length; i++) {
        const f = BANKING_FIELDS[i]
        if (submitted[f] !== undefined && String(submitted[f]) !== '') {
            return f
        }
    }
    return ''
}

/** NV-32. Refuses rather than filters when a banking field arrives on the general item. */
export function buildPersonalUpdate(current: Submission, submitted: Submission): BuildResult {
    const banking = containsBanking(submitted)
    if (banking) {
        return { ok: false, changed: {}, message: 'Banking changes must use the approval-gated item.' }
    }
    const changed = changedFields(current, submitted)
    return { ok: true, changed: changed, message: '' }
}

/**
 * NV-33. The prior-of-record channel: the contact value read from the ERP BEFORE this change,
 * captured at submission time.
 *
 * Notifying the newly submitted address is the control failing exactly when it matters -- an
 * attacker who changed both the IBAN and the email receives their own fraud alert. The argument
 * is the PRE-CHANGE read, never the form.
 */
export function priorOfRecordChannel(current: Submission): string {
    const candidates = ['work_email', 'personal_email', 'email', 'mobile_phone', 'phone']
    for (let i = 0; i < candidates.length; i++) {
        const v = current[candidates[i]]
        if (v !== undefined && v !== null && String(v) !== '') {
            return String(v)
        }
    }
    return ''
}

/**
 * The notification body's IBAN reference. Last four only -- and it is the same masking function
 * the prefill uses, so there is one definition of "masked" in the application rather than two
 * that can drift apart.
 */
export function maskIban(value: string): string {
    return maskTail(value)
}

function refused(message: string): DispatchResult {
    return { ok: false, state: 'failed', message: message, writeId: '', ackRef: '' }
}

/**
 * NV-32 end to end. `current` MUST be the values read at prefill time, not re-read here: the
 * diff's whole purpose is to compare against what the employee was shown.
 */
export function submitPersonalUpdate(
    userSysId: string,
    systemId: string,
    sourceTable: string,
    sourceRecord: string,
    current: Submission,
    submitted: Submission,
): DispatchResult {
    const identity = resolveIdentity(userSysId, systemId)
    if (!identity.ok) {
        return refused(identity.message)
    }

    const build = buildPersonalUpdate(current, submitted)
    if (!build.ok) {
        return refused(build.message)
    }
    let count = 0
    for (const k in build.changed) {
        if (Object.prototype.hasOwnProperty.call(build.changed, k)) {
            count++
        }
    }
    if (count === 0) {
        // Not an error and not a write. A no-op dispatched anyway would burn an ERP call and put
        // a `confirmed` row in the audit trail for a change nobody made.
        return { ok: true, state: 'confirmed', message: 'No changes were submitted.', writeId: '', ackRef: '' }
    }

    const writeId = createWrite({
        systemId: systemId,
        logicalObject: 'employee_profile',
        operation: 'update',
        externalId: identity.employeeKey,
        sourceTable: sourceTable,
        sourceRecord: sourceRecord,
        requestedBy: userSysId,
        // No policy key: an address change is ungated by design (NV-32 AC2), and it must not
        // inherit the banking gate just because both are employee_profile.update.
    })
    if (!writeId) {
        return refused('The change could not be queued.')
    }
    // An address change takes effect now; the cut-off still judges it, because a payroll-affecting
    // object dispatched after cut-off belongs to the next cycle whatever the employee intended.
    return dispatch(writeId, JSON.stringify(build.changed), new GlideDateTime().getValue().substring(0, 10))
}

/**
 * NV-33 end to end.
 *
 * `approvalRef` is a `sysapproval_approver` sys_id. It is passed in rather than looked up so the
 * caller's flow owns the approval's creation -- but it is NOT trusted: `gateWrite()` re-reads it
 * inside the dispatcher's pre-flight and compares its timestamp to `first_sent_at`, which is the
 * only check that a retroactive approval cannot pass (OD44 layer two).
 *
 * Returns the prior-of-record channel on the result so the calling flow notifies the OLD address.
 * Notification is deliberately not sent here: it fires on `confirmed`, never on `sent`, and only
 * the flow knows whether the confirmation poller has since resolved the write.
 */
export interface BankingResult {
    dispatch: DispatchResult
    /** Notify THIS, never the submitted value. Empty means the ERP returned no prior channel. */
    priorChannel: string
    /** Safe for a notification body. The full value never leaves this function. */
    maskedNew: string
}

export function submitBankingUpdate(
    userSysId: string,
    systemId: string,
    sourceTable: string,
    sourceRecord: string,
    current: Submission,
    submitted: Submission,
    approvalRef: string,
): BankingResult {
    const prior = priorOfRecordChannel(current)
    const masked = maskIban(String(submitted['bank_account_iban'] || ''))

    const identity = resolveIdentity(userSysId, systemId)
    if (!identity.ok) {
        return { dispatch: refused(identity.message), priorChannel: prior, maskedNew: masked }
    }

    // The policy row must exist and be active. If someone deactivated it, the gate would pass
    // silently -- so the refusal is here as well as in the ACL that denies the deactivation.
    if (!approvalRequired(BANKING_POLICY_KEY, identity.payrollCountry)) {
        return {
            dispatch: refused(
                'The banking approval policy is missing or inactive -- the change was not sent. Restore the write approval policy for employee_profile.bank_account_iban.',
            ),
            priorChannel: prior,
            maskedNew: masked,
        }
    }

    const changed = changedFields(current, submitted)
    const writeId = createWrite({
        systemId: systemId,
        logicalObject: 'employee_profile',
        operation: 'update',
        externalId: identity.employeeKey,
        sourceTable: sourceTable,
        sourceRecord: sourceRecord,
        requestedBy: userSysId,
        approvalRef: approvalRef,
        policyKey: BANKING_POLICY_KEY,
    })
    if (!writeId) {
        return { dispatch: refused('The change could not be queued.'), priorChannel: prior, maskedNew: masked }
    }
    const result = dispatch(writeId, JSON.stringify(changed), new GlideDateTime().getValue().substring(0, 10))
    return { dispatch: result, priorChannel: prior, maskedNew: masked }
}
