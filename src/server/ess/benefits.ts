import { GlideRecord } from '@servicenow/glide'
import { readForEmployee } from './read-service.ts'
import { resolveIdentity } from '../write/identity.ts'
import { dispatch } from '../write/dispatcher.ts'
import { createWrite } from '../write/create-write.ts'
import type { DispatchResult } from '../write/dispatcher.ts'

/**
 * NV-46 -- benefits and pension enrollment (R9, INT-20/INT-21).
 *
 * PLAN OPTIONS ARE READ FROM THE ERP, NEVER HARD-CODED AND NEVER FREE TEXT (AC3, repo rule 5). A
 * typed plan code that the ERP does not recognise is a deduction that silently does not happen;
 * a hard-coded list is the same failure with a longer fuse, because it works until the ERP's
 * scheme list changes. With no reference data available the change item is NOT ORDERABLE and says
 * why -- which is the only honest option, since there is nothing valid to pick from.
 *
 * OQ-5 -- NO DEFAULT APPROVAL POLICY SHIPS FOR R9. The BRD does not mark R9 approval-gated, and
 * seeding a gate the BRD never asked for is as wrong as omitting one it did. `write_approval_policy`
 * accepts a `benefit_enrollment.update` row from any organisation that wants one, and the gate
 * then applies with no code change.
 */

export interface Enrollment {
    benefitType: string
    planOption: string
    /** Rendered ONLY with its currency. A bare contribution figure is not actionable. */
    contributionAmount: string
    currency: string
    effectiveDate: string
}

export interface EnrollmentView {
    state: string
    message: string
    enrollments: Enrollment[]
    /** True only when a successful read genuinely returned nothing. */
    genuinelyEmpty: boolean
}

/**
 * INT-20. A contribution of `0` reaches the widget ONLY through a `live` read that genuinely
 * returned zero -- an opted-out scheme is a real answer. A failed read returns no rows at all, so
 * there is no path on which `0` stands in for "the ERP did not answer".
 */
export function currentEnrollments(userSysId: string, systemId: string): EnrollmentView {
    const read = readForEmployee(userSysId, systemId, 'benefit_enrollment')
    if (read.state !== 'live') {
        return { state: read.state, message: read.message, enrollments: [], genuinelyEmpty: false }
    }
    const out: Enrollment[] = []
    for (let i = 0; i < read.rows.length; i++) {
        const row = read.rows[i] as { [k: string]: string }
        const amount = String(row['contribution_amount'] || '')
        const currency = String(row['currency'] || '')
        out.push({
            benefitType: String(row['benefit_type'] || ''),
            planOption: String(row['plan_option'] || ''),
            // BOTH OR NEITHER. An amount whose currency is unmapped renders as not configured
            // upstream rather than as a number in an assumed currency.
            contributionAmount: amount && currency ? amount : '',
            currency: amount && currency ? currency : '',
            effectiveDate: String(row['effective_date'] || ''),
        })
    }
    return { state: 'live', message: '', enrollments: out, genuinelyEmpty: read.rows.length === 0 }
}

export interface OptionList {
    /** False => do not render the change item at all. */
    orderable: boolean
    message: string
    options: string[]
}

/**
 * The available plan options, from the ERP's own reference data.
 *
 * A separate `object_map` may serve them; where the ERP exposes none, the answer is that the item
 * is not orderable -- NOT an empty picker, which reads as "no plans exist" and is a different
 * claim entirely.
 */
export function planOptions(systemId: string, userSysId: string): OptionList {
    const read = readForEmployee(userSysId, systemId, 'benefit_enrollment')
    if (read.state !== 'live') {
        return {
            orderable: false,
            message:
                read.state === 'not_configured'
                    ? read.message
                    : 'Plan options could not be read from the ERP, so a change cannot be submitted.',
            options: [],
        }
    }
    const options: string[] = []
    for (let i = 0; i < read.rows.length; i++) {
        const option = String((read.rows[i] as { [k: string]: string })['plan_option'] || '')
        if (option && options.indexOf(option) === -1) {
            options.push(option)
        }
    }
    if (options.length === 0) {
        return {
            orderable: false,
            message: 'The ERP returned no plan options, so there is nothing to choose between.',
            options: [],
        }
    }
    return { orderable: true, message: '', options: options }
}

/**
 * INT-21. Submit an enrollment change.
 *
 * The chosen option is CHECKED against the reference data before anything is queued. Trusting the
 * submitted value would let a stale form post a plan code the ERP retired last month, and the
 * failure would surface as a 422 the employee cannot act on.
 */
export function submitEnrollmentChange(
    userSysId: string,
    systemId: string,
    sourceTable: string,
    sourceRecord: string,
    benefitType: string,
    planOption: string,
    effectiveDate: string,
    approvalRef: string,
): DispatchResult {
    const fail = (message: string): DispatchResult => {
        return { ok: false, state: 'failed', message: message, writeId: '', ackRef: '' }
    }

    const identity = resolveIdentity(userSysId, systemId)
    if (!identity.ok) {
        return fail(identity.message)
    }
    const effective = String(effectiveDate || '').substring(0, 10)
    if (!effective) {
        return fail('An enrollment change needs an effective date. R9 is payroll-affecting (BRD §7).')
    }

    const options = planOptions(systemId, userSysId)
    if (!options.orderable) {
        return fail(options.message)
    }
    if (options.options.indexOf(String(planOption)) === -1) {
        return fail('That plan option is not one the ERP currently offers. Reload the form and choose again.')
    }

    const writeId = createWrite({
        systemId: systemId,
        logicalObject: 'benefit_enrollment',
        operation: 'update',
        externalId: identity.employeeKey,
        sourceTable: sourceTable,
        sourceRecord: sourceRecord,
        requestedBy: userSysId,
        approvalRef: approvalRef,
        // No policy_key: OQ-5. The gate applies if and only if an organisation seeds
        // `benefit_enrollment.update`, which the derived key already resolves.
        qualifier: effective,
    })
    if (!writeId) {
        return fail('The change could not be queued.')
    }

    const payload = JSON.stringify({
        employee_id: identity.employeeKey,
        benefit_type: benefitType,
        plan_option: planOption,
        effective_date: effective,
    })
    return dispatch(writeId, payload, effective)
}
