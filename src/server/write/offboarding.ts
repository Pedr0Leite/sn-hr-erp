import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { loadMap } from '../connector/config-loader.ts'
import { readForEmployee } from '../ess/read-service.ts'
import { resolveIdentity } from './identity.ts'
import { dispatch } from './dispatcher.ts'
import { createWrite } from './create-write.ts'
import type { DispatchResult } from './dispatcher.ts'

/**
 * NV-45 -- offboarding. PHASE 1 IS ORCHESTRATION ONLY, AND THAT IS THE DELIVERABLE.
 *
 * BRD R8 recommends the first release orchestrate offboarding with a MANUAL ERP step. This module
 * therefore contains no Submit-to-ERP path that phase 1 can reach, and nothing in this
 * application draws such a control (repo rule 1: never draw a button that cannot commit its
 * decision). What phase 1 does instead is VERIFY: HR records the termination in the ERP by hand,
 * confirms here, and this module reads the ERP back and compares.
 *
 * THE READ-BACK IS THE CONTROL. A confirmation checkbox proves that someone clicked a checkbox.
 * Comparing `employment_status` and `employment_end_date` against the case proves the ERP holds
 * what the case says it holds -- and a mismatch blocks closure NAMING BOTH VALUES, because "the
 * ERP does not match" gives HR nothing to correct.
 *
 * TERMINATION IS A STATUS CHANGE, NEVER A DELETE (TRD §5). This is enforced three ways: the
 * `object_map.http_method` choice list has no `delete` value at all, so it is unsaveable; the
 * phase-2 write below is hard-coded to `update`; and `assertNotDelete()` refuses at dispatch time.
 * An ex-employee whose ERP record was deleted has no payroll history, no final settlement and no
 * evidence they ever worked there.
 */

export const TERMINATION_POLICY_KEY = 'employee_profile.terminate'

export interface ReadBack {
    matches: boolean
    /** Names BOTH sides. Rendered on the case, blocking closure. */
    message: string
    /** False when the ERP could not be read at all -- which is not a mismatch. */
    readable: boolean
}

/**
 * Phase 1 AC2. Compare the ERP against the case.
 *
 * An unreadable ERP is NOT a mismatch and must not be reported as one: "the ERP says something
 * different" and "the ERP did not answer" send HR to two different places.
 */
export function verifyTermination(
    userSysId: string,
    systemId: string,
    caseStatus: string,
    caseEndDate: string,
): ReadBack {
    const read = readForEmployee(userSysId, systemId, 'employee_profile')
    if (read.state !== 'live') {
        return {
            matches: false,
            readable: false,
            message: 'The ERP could not be read, so the termination could not be verified. ' + (read.message || ''),
        }
    }
    if (read.rows.length === 0) {
        return {
            matches: false,
            readable: false,
            message: 'The ERP returned no employee record, so the termination could not be verified.',
        }
    }
    const row = read.rows[0] as { [k: string]: string }
    const erpStatus = String(row['employment_status'] || '')
    const erpEnd = String(row['employment_end_date'] || '').substring(0, 10)
    const wantStatus = String(caseStatus || '')
    const wantEnd = String(caseEndDate || '').substring(0, 10)

    if (erpStatus === wantStatus && erpEnd === wantEnd) {
        return { matches: true, readable: true, message: '' }
    }
    return {
        matches: false,
        readable: true,
        message:
            'The ERP shows ' +
            (erpStatus || 'no status') +
            '/' +
            (erpEnd || 'no end date') +
            ', the case records ' +
            (wantStatus || 'no status') +
            '/' +
            (wantEnd || 'no end date') +
            '.',
    }
}

export interface ClosureDecision {
    allowed: boolean
    reason: string
}

/**
 * Phase 1 AC1. The case cannot close until the manual confirmation task is complete AND the
 * read-back agrees.
 *
 * `confirmedBy` is recorded by the caller on the case. A confirmation with no completer is not a
 * confirmation -- the whole point of a manual step is that a named human takes responsibility.
 */
export function closureAllowed(
    userSysId: string,
    systemId: string,
    caseStatus: string,
    caseEndDate: string,
    confirmedBy: string,
): ClosureDecision {
    if (!String(confirmedBy || '')) {
        return {
            allowed: false,
            reason: 'The manual ERP confirmation task has not been completed. Record the termination in the ERP, then confirm here.',
        }
    }
    const check = verifyTermination(userSysId, systemId, caseStatus, caseEndDate)
    if (!check.matches) {
        return { allowed: false, reason: check.message }
    }
    return { allowed: true, reason: '' }
}

/**
 * A last guard on the verb. The choice list already makes `delete` unsaveable, so reaching this
 * means someone changed the schema -- and a schema change must not silently become a hard delete.
 */
export function assertNotDelete(systemId: string): string {
    // OD51: the UPDATE map. The read map is a GET by definition, so checking it would have been
    // a guard that could never fire -- and the guard exists for the one binding that must not be
    // saveable.
    const map = loadMap(systemId, 'employee_profile', 'update')
    if (!map) {
        return 'Not configured -- create an Object Map for employee_profile with operation update'
    }
    const verb = String(map.httpMethod || '').toLowerCase()
    if (verb === 'delete') {
        return 'Offboarding must be a status change, not a hard delete (TRD §5).'
    }
    return ''
}

/**
 * PHASE 2 -- the automatic write. Not reachable from phase 1 and not wired to any surface.
 *
 * It exists now so that the approval policy, the cut-off gate and the idempotency key are built
 * and testable rather than designed. A re-termination of an already-terminated record is
 * CONFIRMED by the read-back, not re-sent: sending it again risks a second termination-dated
 * record and a second final-settlement calculation.
 */
export function dispatchTermination(
    userSysId: string,
    systemId: string,
    sourceTable: string,
    sourceRecord: string,
    endDate: string,
    reason: string,
    approvalRef: string,
): DispatchResult {
    const verbProblem = assertNotDelete(systemId)
    if (verbProblem) {
        return { ok: false, state: 'failed', message: verbProblem, writeId: '', ackRef: '' }
    }
    const identity = resolveIdentity(userSysId, systemId)
    if (!identity.ok) {
        return { ok: false, state: 'failed', message: identity.message, writeId: '', ackRef: '' }
    }
    const effective = String(endDate || '').substring(0, 10)
    if (!effective) {
        return {
            ok: false,
            state: 'failed',
            message: 'A termination needs a last working day. Without one it cannot be dated to a payroll cycle.',
            writeId: '',
            ackRef: '',
        }
    }

    // The existence check, before anything is queued: an ERP that already shows the employee
    // terminated on this date has recorded the change, and a second write would not improve that.
    const already = verifyTermination(userSysId, systemId, 'terminated', effective)
    if (already.matches) {
        return {
            ok: true,
            state: 'confirmed',
            message: 'The ERP already records this termination.',
            writeId: '',
            ackRef: '',
        }
    }

    const writeId = createWrite({
        systemId: systemId,
        logicalObject: 'employee_profile',
        // HARD-CODED `update`. There is no argument that could make this a delete.
        operation: 'update',
        externalId: identity.employeeKey,
        sourceTable: sourceTable,
        sourceRecord: sourceRecord,
        requestedBy: userSysId,
        approvalRef: approvalRef,
        policyKey: TERMINATION_POLICY_KEY,
        qualifier: effective,
    })
    if (!writeId) {
        return { ok: false, state: 'failed', message: 'The termination could not be queued.', writeId: '', ackRef: '' }
    }

    const payload = JSON.stringify({
        employee_id: identity.employeeKey,
        employment_status: 'terminated',
        employment_end_date: effective,
        reason: reason,
    })
    return dispatch(writeId, payload, effective)
}

/** The ERP id is RETAINED after termination and never reassigned (NV-10 / NV-45 AC5). */
export function retainIdentity(userSysId: string, systemId: string): boolean {
    const gr = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    gr.addQuery('user', userSysId)
    gr.addQuery('erp_system', systemId)
    gr.setLimit(1)
    gr.query()
    if (!gr.next()) {
        return false
    }
    // `terminated`, NOT deleted and NOT deactivated-and-reusable. The unique index on
    // (erp_system, erp_employee_key) is what actually prevents reassignment; this flag is what
    // makes a terminated link visible to a human reading the table.
    gr.setValue('terminated', true)
    gr.setValue('linked_on', String(gr.getValue('linked_on') || new GlideDateTime().getValue()))
    return !!gr.update()
}
