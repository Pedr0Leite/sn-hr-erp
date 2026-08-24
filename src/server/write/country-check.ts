import { GlideRecord } from '@servicenow/glide'
import { raiseException } from './exception-queue.ts'
import { defaultAssignmentGroup } from './dispatcher.ts'

/**
 * NV-51 AC4, the side-effecting half. Separate from `country.ts` so the pure rule can be imported
 * by `config-loader` without closing an import cycle through the dispatcher.
 */

/**
 * NV-51 AC4 -- the employee's country comes from the ERP, and a disagreement with ServiceNow is
 * RAISED rather than resolved.
 *
 * The ERP value wins, because payroll jurisdiction is an ERP fact: a secondee's desk and their
 * payroll country are routinely different places, and the ServiceNow user record follows the desk.
 * But silently preferring one of two disagreeing sources is how a person is paid under the wrong
 * jurisdiction's rules for a year. The exception queue is where a human decides which is wrong.
 *
 * Returns the ERP country in every case -- the check never changes the answer, only records the
 * disagreement.
 */
export function payrollCountryChecked(userSysId: string, systemId: string): string {
    const xref = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    xref.addQuery('user', userSysId)
    xref.addQuery('erp_system', systemId)
    xref.addQuery('active', true)
    xref.setLimit(1)
    xref.query()
    if (!xref.next()) {
        return ''
    }
    const erpCountry = String(xref.getValue('payroll_country') || '')

    const user = new GlideRecord('sys_user')
    const userCountry = user.get('sys_id', userSysId) ? String(user.getValue('country') || '') : ''

    // Only a DISAGREEMENT is worth a human's time. An empty value on either side is an absence,
    // not a conflict -- a queue full of "the ERP did not say" is a queue nobody reads.
    if (erpCountry && userCountry && erpCountry.toUpperCase() !== userCountry.toUpperCase()) {
        raiseCountryMismatch(userSysId, systemId, erpCountry, userCountry)
    }
    return erpCountry
}

/** One open exception per user and system. A repeat read must not raise a second row. */
function raiseCountryMismatch(userSysId: string, systemId: string, erpCountry: string, userCountry: string): void {
    const existing = new GlideRecord('x_335329_sn_hr_erp_erp_exception')
    existing.addQuery('source_table', 'sys_user')
    existing.addQuery('source_record', userSysId)
    existing.addQuery('state', 'open')
    existing.setLimit(1)
    existing.query()
    if (existing.next()) {
        return
    }
    raiseException({
        systemId: systemId,
        // Not an HTTP failure at all. `unexpected_format` is the closest existing category and is
        // used deliberately rather than adding a category for a configuration disagreement.
        status: 0,
        transportError: '',
        shortDescription: 'Payroll country disagreement for an employee',
        erpMessage:
            'The ERP records payroll country ' +
            erpCountry +
            '; the ServiceNow user record says ' +
            userCountry +
            '. The ERP value is being used. Confirm which is correct.',
        writeId: '',
        sourceTable: 'sys_user',
        sourceRecord: userSysId,
        assignmentGroup: defaultAssignmentGroup(),
        callLogIds: '',
    })
}
