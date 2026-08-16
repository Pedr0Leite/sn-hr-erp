import { GlideRecord, gs } from '@servicenow/glide'
import { syncObject } from './engine.ts'

/**
 * THE L3 GATE DRIVER (docs/l3-staging-design.md §8). SHIPS DISARMED AND WAS NOT RUN.
 *
 * Testing breadth is deferred to a dedicated pass by the product owner; this driver exists so
 * that the pass has something to press, not so that this build can claim the gate. THE L3 GATE
 * IS RECORDED NOT MET. Nothing in this file should be read as partial credit for it.
 *
 * It produces both halves of §8 in one run, logged under the marker [HRERP-L3-GATE]:
 *
 *  1. PROVENANCE -- run a sync, read one staged row back, and print all seven provenance
 *     columns. Any empty one fails.
 *  2. THREE-WAY DISTINGUISHABILITY, BY QUERY, NOT BY INSPECTION (story L3-2 AC3):
 *       (a) working map, ERP returns []      -> status=success, rows_fetched=0
 *       (b) same object, unreachable host    -> status=failed, error_message non-empty,
 *                                               rows_fetched THE LITERAL '' -- NOT '0'
 *       (c) no object_map                    -> status=not_configured
 *     Case (b)'s assertion is on the RAW value. `0` means the ERP said zero and `''` means we
 *     do not know, and a driver that printed `rows_fetched` through a getter that coerces
 *     empty to 0 would pass while the product was broken.
 *
 * IT READS ITS TARGETS FROM PROPERTIES, NEVER FROM HARDCODED sys_ids -- the same pattern as the
 * L2 drivers. Change the property, not the code.
 *
 * T10 BINDS THIS DRIVER: an active object_map with ZERO field_map rows refuses to dial and
 * returns not_configured/MAP_UNMAPPED. Any fixture used for case (a) or (b) needs at least one
 * field_map row or it will silently never call anything.
 */

const T_SYNC_RUN = 'x_335329_sn_hr_erp_sync_run'
const T_STAGING = 'x_335329_sn_hr_erp_staging'

function log(line: string): void {
    gs.info('[HRERP-L3-GATE] ' + line)
}

/** Read a run row's RAW column values -- no coercion, no display values. */
function rawRun(runSysId: string): string {
    const gr = new GlideRecord(T_SYNC_RUN)
    if (!gr.get(runSysId)) {
        return 'run ' + runSysId + ' not found'
    }
    const rowsFetched = gr.getValue('rows_fetched')
    return (
        'status=' + gr.getValue('status') +
        ' rows_fetched=[' + (rowsFetched === null ? 'null' : rowsFetched) + ']' +
        ' rows_deleted=' + gr.getValue('rows_deleted') +
        ' pages=' + gr.getValue('pages_fetched') +
        ' error=' + (gr.getValue('error_message') || '')
    )
}

export function runL3Gate(): void {
    const systemA = String(gs.getProperty('x_335329_sn_hr_erp.test.system_a', '') || '')
    const systemC = String(gs.getProperty('x_335329_sn_hr_erp.test.system_c', '') || '')
    const objectMapped = String(gs.getProperty('x_335329_sn_hr_erp.test.l3_object', 'invoice') || 'invoice')
    const objectUnmapped = String(gs.getProperty('x_335329_sn_hr_erp.test.l3_object_unmapped', 'work_order') || 'work_order')

    log('START systemA=' + systemA + ' systemC=' + systemC)

    // --- §8 step 2(a) and step 1 -----------------------------------------------------------
    const a = syncObject(systemA, objectMapped)
    log('(a) working map on ' + objectMapped + ' -> ' + rawRun(a.runSysId))

    const staged = new GlideRecord(T_STAGING)
    staged.addQuery('sync_run', a.runSysId)
    staged.setLimit(1)
    staged.query()
    if (staged.next()) {
        log(
            'PROVENANCE erp_system=' + staged.getValue('erp_system') +
                ' erp_category=' + staged.getValue('erp_category') +
                ' logical_object=' + staged.getValue('logical_object') +
                ' source_record_id=' + staged.getValue('source_record_id') +
                ' fetched_at=' + staged.getValue('fetched_at') +
                ' sync_run=' + staged.getValue('sync_run') +
                ' object_map=' + staged.getValue('object_map'),
        )
    } else {
        log('PROVENANCE no staged row for this run -- expected when the fixture returns an empty array.')
    }

    // --- §8 step 2(b): unreachable host. rows_fetched must read as the literal ''. ----------
    const b = syncObject(systemC, objectMapped)
    log('(b) unreachable host -> ' + rawRun(b.runSysId))

    // --- §8 step 2(c): no object_map at all. -----------------------------------------------
    const c = syncObject(systemA, objectUnmapped)
    log('(c) no object map for ' + objectUnmapped + ' -> ' + rawRun(c.runSysId))

    log('END -- three states above must be success / failed / not_configured, and (b) rows_fetched must be [] not [0].')
}
