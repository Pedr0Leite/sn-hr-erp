import { gs } from '@servicenow/glide'
import { LOGICAL_OBJECTS } from '../contract/objects.ts'

// L3-3 and L3-6. The two `before` rules that make l3 §3.5's guards real.
//
// WHY RULES AND NOT JUST CHOICE LISTS: a choice list is not evaluated on a Table API insert at
// all. `erp_category` offers five values and `logical_object` offers fourteen, and a POST can
// still carry `hr` and `payroll_record` past both. T3-6 and T3-7 post exactly that.
//
// A `before` RULE THAT THROWS IS SWALLOWED AND THE RECORD SAVES (D19 / L1 trap T7). That is why
// this module imports its one dependency with the `.ts` EXTENSION -- '../contract/objects'
// without it resolves to a sys_module path that does not exist, builds clean, installs clean,
// and leaves both rules silently dead at runtime. Do not strip it "for tidiness".

/** The exact message story L3-1 AC3 requires, verbatim. T3-7 asserts on this string. */
const PAYROLL_MESSAGE = 'Payroll and employee data are never staged (decision D2).'

/**
 * `before` insert/update on erp_staging.
 *
 * Three refusals, in the order of l3 §3.5:
 *  1. erp_category = 'hr'                         -- there is no such category (D2)
 *  2. logical_object with no erp_category         -- payroll_record / employee_profile
 *  3. no sync_run reference                       -- story L3-1 AC6: a row with no run is
 *     impossible, because a staged row that cannot be traced to a run cannot be assigned a
 *     state, and a figure with no state is exactly the figure kickoff §7 forbids.
 */
export function validateStaging(current: any): void {
    const category = String(current.getValue('erp_category') || '')
    const object = String(current.getValue('logical_object') || '')

    if (category === 'hr') {
        gs.addErrorMessage(PAYROLL_MESSAGE)
        current.setAbortAction(true)
        return
    }

    // Guard 2. Driven by the CONTRACT, not by a hardcoded pair of names: an object with a null
    // category is by definition live-only and never staged. A 17th live-only object added to
    // src/server/contract/objects.ts is refused here with no edit to this file.
    const def = LOGICAL_OBJECTS[object]
    if (!def || !def.category) {
        gs.addErrorMessage(PAYROLL_MESSAGE)
        current.setAbortAction(true)
        return
    }

    if (!current.getValue('sync_run')) {
        gs.addErrorMessage(
            'A staged row must reference the sync run that produced it (story L3-1 AC6).',
        )
        current.setAbortAction(true)
    }
}

/**
 * `before` insert/update on sync_run.
 *
 * Story L3-2 AC4: every `failed` run carries a reason. The engine always supplies one -- the
 * connector's ConnectorResult.errorMessage is never null on a failure path -- so this is a
 * backstop against a future caller, not routine flow. It is here because "the ERP did not
 * answer" with no recorded reason is an unattributable failure, and attribution is the product.
 */
export function validateSyncRun(current: any): void {
    const status = String(current.getValue('status') || '')
    const message = String(current.getValue('error_message') || '')

    if (status === 'failed' && message.trim() === '') {
        gs.addErrorMessage('A failed sync run must record why it failed (story L3-2 AC4).')
        current.setAbortAction(true)
    }
}
