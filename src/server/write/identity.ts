import { GlideRecord } from '@servicenow/glide'

/**
 * NV-10 -- the shared employee identifier. TRD §2 Identity linkage, BRD §7.
 *
 * EVERY read and write in the Noviq backlog resolves its target employee through this module.
 * Nothing may build a query from `sys_user.email` or `sys_user.name`: email is reassigned, names
 * repeat and both are edited by helpdesks. NV-10 AC2 asserts no connector call in the app does it.
 */

export interface Identity {
    ok: boolean
    employeeKey: string
    payrollCountry: string
    /** Plain language, already safe to render to the employee. */
    message: string
}

const UNLINKED = 'Your record is not yet linked to the ERP -- contact HR'

/**
 * Resolve the signed-in user's ERP employee key for a system.
 *
 * An unlinked user gets NO FIGURE OF ANY KIND -- not `0`, not a blank tile, not "no data". The
 * message names the remedy, which is the four-state contract's `not configured` applied to a
 * person rather than to a mapping.
 */
export function resolveIdentity(userSysId: string, systemId: string): Identity {
    if (!userSysId || !systemId) {
        return { ok: false, employeeKey: '', payrollCountry: '', message: UNLINKED }
    }
    const gr = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    gr.addQuery('user', userSysId)
    gr.addQuery('erp_system', systemId)
    gr.addQuery('active', true)
    gr.setLimit(1)
    gr.query()
    if (!gr.next()) {
        return { ok: false, employeeKey: '', payrollCountry: '', message: UNLINKED }
    }
    // getValue() on a Boolean returns '1'/'0', never 'true'/'false' -- CLAUDE.md trap 6.
    if (String(gr.getValue('identity_mismatch')) === '1') {
        return {
            ok: false,
            employeeKey: '',
            payrollCountry: '',
            // Deliberately blocks reads too. A read against the wrong employee shows one person
            // another person's payroll -- worse than showing nothing.
            message: 'Your ERP link is being verified by HR. Data is unavailable until it is resolved.',
        }
    }
    return {
        ok: true,
        employeeKey: String(gr.getValue('erp_employee_key') || ''),
        payrollCountry: String(gr.getValue('payroll_country') || ''),
        message: '',
    }
}

/**
 * Bind a ServiceNow user to an ERP employee key.
 *
 * Refuses silently-wrong outcomes rather than repairing them: a key already bound elsewhere, or a
 * user already bound to a different key, is an operator error that must be seen.
 */
export function bindIdentity(
    userSysId: string,
    systemId: string,
    employeeKey: string,
    actorSysId: string,
): { ok: boolean; message: string } {
    if (!employeeKey) {
        return { ok: false, message: 'No ERP employee id supplied.' }
    }

    const taken = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    taken.addQuery('erp_system', systemId)
    taken.addQuery('erp_employee_key', employeeKey)
    taken.setLimit(1)
    taken.query()
    if (taken.next()) {
        const otherUser = String(taken.getValue('user') || '')
        if (otherUser !== userSysId) {
            // Covers the terminated case too: the leaver's row is retained, so the key is still
            // taken and cannot be recycled onto a new joiner (NV-10 AC6).
            return { ok: false, message: 'ERP employee ' + employeeKey + ' is already linked to another user.' }
        }
        return { ok: true, message: 'Already linked.' }
    }

    const existing = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    existing.addQuery('user', userSysId)
    existing.addQuery('erp_system', systemId)
    existing.setLimit(1)
    existing.query()
    if (existing.next()) {
        const current = String(existing.getValue('erp_employee_key') || '')
        if (current && current !== employeeKey) {
            // Written ONCE. Changing it is an hr_admin action with an audit row, not a rebind.
            return {
                ok: false,
                message: 'This user is already linked to ERP employee ' + current + '. Changing a link requires hr_admin.',
            }
        }
    }

    const row = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    row.initialize()
    row.setValue('user', userSysId)
    row.setValue('erp_system', systemId)
    row.setValue('erp_employee_key', employeeKey)
    row.setValue('linked_by', actorSysId)
    row.setValue('active', true)
    return row.insert()
        ? { ok: true, message: 'Linked to ERP employee ' + employeeKey }
        : { ok: false, message: 'Could not create the ERP link.' }
}

/** NV-10 AC5. Raised when the ERP returns a key differing from the stored one. */
export function flagMismatch(userSysId: string, systemId: string, erpReturned: string): string {
    const gr = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    gr.addQuery('user', userSysId)
    gr.addQuery('erp_system', systemId)
    gr.setLimit(1)
    gr.query()
    if (!gr.next()) {
        return ''
    }
    const stored = String(gr.getValue('erp_employee_key') || '')
    if (stored === erpReturned) {
        return ''
    }
    gr.setValue('identity_mismatch', true)
    gr.update()
    return 'Identity mismatch for this user: stored ' + stored + ', ERP returned ' + erpReturned
}
