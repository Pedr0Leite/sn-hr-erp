import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { countryOrder } from '../country.ts'

/**
 * NV-7 -- payroll cut-off resolution. BRD §7, TRD §5.
 *
 * THE LOAD-BEARING DECISION IS THE ABSENT-CALENDAR CASE. A payroll-affecting write with no
 * matching calendar row is REFUSED, not allowed through. Treating "no calendar configured" as
 * "no cut-off applies" is the four-state rule's failure in a new costume -- an absence read as a
 * permission -- and the cost of getting it wrong is a change landing in the wrong pay cycle,
 * which nobody notices until payslips are wrong.
 */

export interface CutoffResult {
    /** True when the write may dispatch now. */
    clear: boolean
    /** Set when blocked: the cycle the change will land in instead. */
    effectiveCycle: string
    /** Plain language, already safe to render on a case. */
    message: string
    /** True when blocked because no calendar exists -- a configuration failure, not a timing one. */
    notConfigured: boolean
}

/**
 * The objects BRD §7 names as payroll-affecting. Everything else bypasses the gate.
 *
 * OD52 -- `employee_profile` IS SPLIT BY POLICY KEY, and this is the one judgement call in the
 * function. Banking details and a termination land in a pay run; an address, a phone number and an
 * emergency contact do not. Treating the whole object as payroll-affecting meant an employee could
 * not correct their phone number until somebody configured a payroll calendar -- an absent
 * calendar refusing a write that no pay run depends on.
 *
 * The refusal itself is unchanged and stays absolute for the writes that DO reach payroll: an
 * absent calendar must never be read as "no cut-off applies".
 */
export function isPayrollAffecting(logicalObject: string, policyKey?: string): boolean {
    if (
        logicalObject === 'leave_request' ||
        logicalObject === 'compensation_change' ||
        logicalObject === 'benefit_enrollment'
    ) {
        return true
    }
    if (logicalObject !== 'employee_profile') {
        return false
    }
    const key = String(policyKey || '')
    return key === 'employee_profile.bank_account_iban' || key === 'employee_profile.terminate'
}

/**
 * Resolve the cut-off for an effective date.
 *
 * `country` comes from the ERP record, never from the ServiceNow user's location (NV-51): a
 * secondee's payroll jurisdiction and their desk are routinely different places.
 */
export function resolveCutoff(
    systemId: string,
    country: string,
    effectiveDate: string,
    logicalObject: string,
    policyKey?: string,
): CutoffResult {
    if (!isPayrollAffecting(logicalObject, policyKey)) {
        return { clear: true, effectiveCycle: '', message: '', notConfigured: false }
    }
    if (!country) {
        return {
            clear: false,
            effectiveCycle: '',
            notConfigured: true,
            message: 'No payroll country resolved for this employee -- write refused.',
        }
    }

    // NV-51 AC3. The SAME fallback as the object map, the template and the approval policy: this
    // country's calendar, then a country-agnostic one (a single-country deployment configures one
    // calendar and leaves country blank), then nothing. NEVER another country's calendar -- a pay
    // run's cut-off is the last thing that should be borrowed across jurisdictions.
    const order = countryOrder(country)
    let cal = null
    for (let i = 0; i < order.length && !cal; i++) {
        const gr = new GlideRecord('x_335329_sn_hr_erp_payroll_calendar')
        gr.addQuery('erp_system', systemId)
        gr.addQuery('country', order[i])
        gr.addQuery('period_start', '<=', effectiveDate)
        gr.addQuery('period_end', '>=', effectiveDate)
        gr.setLimit(1)
        gr.query()
        if (gr.next()) {
            cal = gr
        }
    }

    if (!cal) {
        // REFUSE. See the file header -- this is the decision, not an oversight.
        return {
            clear: false,
            effectiveCycle: '',
            notConfigured: true,
            message:
                'No payroll calendar configured for ' + country + ' covering ' + effectiveDate + ' -- write refused.',
        }
    }

    const cutoff = new GlideDateTime(String(cal.getValue('cutoff_datetime') || ''))
    const now = new GlideDateTime()
    if (now.getNumericValue() <= cutoff.getNumericValue()) {
        return { clear: true, effectiveCycle: String(cal.getValue('pay_period_label') || ''), message: '', notConfigured: false }
    }

    const nextLabel = String(cal.getValue('next_period_label') || '')
    if (!nextLabel) {
        return {
            clear: false,
            effectiveCycle: '',
            notConfigured: true,
            message:
                'Submitted after the ' +
                String(cal.getValue('pay_period_label') || '') +
                ' cut-off, and the next period is not configured -- write refused.',
        }
    }
    return {
        clear: false,
        effectiveCycle: nextLabel,
        notConfigured: false,
        message:
            'Submitted after the ' +
            String(cal.getValue('pay_period_label') || '') +
            ' cut-off (' +
            String(cal.getValue('cutoff_datetime') || '') +
            '). This change will apply in ' +
            nextLabel +
            ', pay date ' +
            String(cal.getValue('pay_date') || '') +
            '.',
    }
}
