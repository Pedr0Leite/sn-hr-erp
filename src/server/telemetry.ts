import { GlideDateTime, GlideRecord, gs } from '@servicenow/glide'

/**
 * NV-50 -- usage telemetry.
 *
 * BEST-EFFORT, ALWAYS. A telemetry failure must never break the employee's transaction: nobody's
 * payslip should be unavailable because an analytics insert failed. Every call is wrapped, the
 * failure is swallowed HERE and nowhere else, and the function returns whether it recorded so a
 * caller that cares can log it.
 *
 * WHAT IS RECORDED IS DELIBERATELY THIN: area, action, outcome, role, time, system. No employee,
 * no payload, no business value. NV-50 AC1 greps this table for a seeded salary and IBAN and
 * requires zero hits -- which is trivially true only because there is nowhere for them to go.
 *
 * `no usage` IS NOT `0` (AC2). This module only ever INSERTS; the distinction between "no rows"
 * and "zero requests" belongs to the dashboard, and the dashboard can only tell them apart
 * because a genuinely-unused area has no rows at all rather than a row saying zero.
 */

const T_USAGE = 'x_335329_sn_hr_erp_usage_event'

export type TelemetryAction = 'view' | 'submit' | 'download'
export type TelemetryOutcome = 'success' | 'failed' | 'not_configured' | 'blocked_approval' | 'blocked_cutoff'

/**
 * Map a read or write state onto a telemetry outcome.
 *
 * The three blocked states stay distinct all the way into the dashboard, for the same reason they
 * are distinct on `erp_write`: "employees are blocked by cut-off" and "employees are blocked by
 * approvals" call for opposite responses from a product owner.
 */
export function outcomeFor(state: string): TelemetryOutcome {
    const s = String(state || '')
    if (s === 'live' || s === 'confirmed' || s === 'success') {
        return 'success'
    }
    if (s === 'not_configured') {
        return 'not_configured'
    }
    if (s === 'blocked_approval') {
        return 'blocked_approval'
    }
    if (s === 'blocked_cutoff') {
        return 'blocked_cutoff'
    }
    // failed, throttled, queued, blocked_readonly, sent, stale, partial. All are "it did not
    // complete", and none of them is a success -- a `sent` write has not been recorded by the ERP.
    return 'failed'
}

export function record(
    requirementArea: string,
    action: TelemetryAction,
    outcome: TelemetryOutcome,
    personaRole: string,
    systemId: string,
): boolean {
    try {
        const gr = new GlideRecord(T_USAGE)
        gr.initialize()
        gr.setValue('requirement_area', requirementArea)
        gr.setValue('action', action)
        gr.setValue('outcome', outcome)
        gr.setValue('persona_role', personaRole)
        gr.setValue('occurred', new GlideDateTime().getValue())
        if (systemId) {
            gr.setValue('erp_system', systemId)
        }
        return !!gr.insert()
    } catch (e) {
        // Swallowed ON PURPOSE and only here. The employee's transaction continues.
        return false
    }
}


/**
 * Which requirement area a logical object belongs to.
 *
 * This is the shared instrumentation hook (NV-50 ServiceNow notes): the read path and the write
 * path both know their logical object, so neither caller has to remember to pass an area -- and
 * an area nobody remembered to pass is a feature that looks unused.
 *
 * An object with no mapping returns '' and NOTHING IS RECORDED. A wrong area is worse than a
 * missing row, because the dashboard's whole job is telling the product owner which area to keep.
 */
const AREA_BY_OBJECT: { [logicalObject: string]: string } = {
    payslip_document: 'R1',
    employee_profile: 'R2',
    leave_request: 'R3',
    leave_balance: 'R3',
    leave_type_ref: 'R3',
    expense_claim: 'R4',
    erp_attachment: 'R5',
    compensation_change: 'R6',
    benefit_enrollment: 'R9',
    timesheet_entry: 'R10',
    cost_centre_project_ref: 'R10',
    income_statement: 'D4',
}

export function areaForObject(logicalObject: string): string {
    return AREA_BY_OBJECT[String(logicalObject || '')] || ''
}

/**
 * The caller's persona, as a ROLE NAME.
 *
 * `gs.hasRole()` is correct here for the same reason OD11 accepted it in role-check.ts: this is
 * not a security decision. Nothing is granted or refused on the answer -- it only labels a
 * telemetry row, and a mislabelled row costs a wrong bar on a chart, not a disclosure.
 */
export function personaRole(): string {
    if (gs.hasRole('x_335329_sn_hr_erp.hr_admin') === true) {
        return 'hr_admin'
    }
    if (gs.hasRole('x_335329_sn_hr_erp.hr_viewer') === true) {
        return 'hr_viewer'
    }
    if (gs.hasRole('x_335329_sn_hr_erp.finance_viewer') === true) {
        return 'finance_viewer'
    }
    return 'employee'
}

/**
 * The one call the shared read and write paths make. Best-effort in every direction: an unmapped
 * object records nothing, and a failed insert changes nothing about the caller's result.
 */
export function recordForObject(
    logicalObject: string,
    action: TelemetryAction,
    state: string,
    systemId: string,
): boolean {
    const area = areaForObject(logicalObject)
    if (!area) {
        return false
    }
    return record(area, action, outcomeFor(state), personaRole(), systemId)
}
