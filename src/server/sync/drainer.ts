import { GlideDateTime, GlideRecord, gs } from '@servicenow/glide'
import { isTrue } from '../util/bool.ts'
import { syncCategory, syncObject } from './engine.ts'
import { runRetention } from './retention.ts'
import { LOGICAL_OBJECTS } from '../contract/objects.ts'

/**
 * L3-13. The two job bodies. docs/l3-staging-design.md §4.6.
 *
 * BOTH SHIP `frequency: 'on_demand'` AND `active: false`. See src/fluent/scheduled-scripts/
 * l3-jobs.now.ts for why that is two independent locks and not one belt-and-braces.
 *
 * The engine's inserts run as `system` because `erp_staging` has no create ACL for any app role
 * (L0 §5.6 / L3-D7). Granting create to `viewer` so a UI refresh could write inline would make
 * every deny-write field ACL on that table decorative — a viewer could insert a fabricated row
 * with a fabricated `fetched_at`. The cost, accepted: a UI refresh is asynchronous, and the SPA
 * says "Refresh queued" rather than pretending otherwise. That is what a refresh against a
 * remote ERP actually is.
 */

const T_SYNC_REQUEST = 'x_335329_sn_hr_erp_sync_request'

/** One drain pass: every queued category, oldest first, then the request is marked drained. */
export function drainRefreshQueue(): void {
    const gr = new GlideRecord(T_SYNC_REQUEST)
    gr.addQuery('drained', false)
    gr.orderBy('requested_at')
    gr.query()

    while (gr.next()) {
        const category = String(gr.getValue('erp_category') || '')
        // A queue row holds a CATEGORY and there is no encoding for "everything"
        // (story L3-3 AC6). A refresh from Tab 3 syncs inventory objects on the systems that
        // map them; a fan-out to every system fails the story.
        const outcomes = category ? syncCategory(category) : []
        gs.info(
            '[HRERP-L3-DRAIN] category=' + category + ' runs=' + outcomes.length +
                ' states=' + outcomes.map(function (o) { return o.status }).join(','),
        )
        gr.setValue('drained', true)
        // A scoped write refusal is SILENT — no throw, field simply unchanged. If `drained` does
        // not stick, this row is re-selected on every subsequent drain and re-syncs the ERP each
        // time, forever. Verify and shout, so an unbounded loop shows up in the log as itself
        // rather than as mysterious outbound traffic. See BUG-008.
        if (!gr.update()) {
            gs.error(
                '[HRERP-L3-DRAIN] FAILED to mark request ' + gr.getUniqueValue() +
                    ' drained. It WILL be re-synced on the next pass. Check the sync_request write ACL.',
            )
        }
    }
}

/**
 * The `RetentionCleaner` job body. Logs what it did, because a cleaner that deletes silently is
 * a cleaner nobody can audit after the fact — and OD1 is a data-protection approval.
 *
 * ARMING THIS IS A HUMAN STEP AND IT IS RECORDED (story L3-5 AC2, AC6). An armed cleaner
 * without recorded approval fails T3-19.
 */
export function runRetentionJob(): void {
    const report = runRetention()
    gs.info(
        '[HRERP-L3-RETENTION] windows=' + report.categories.join(',') +
            ' staging_deleted=' + report.stagingDeleted +
            ' runs_deleted=' + report.runsDeleted +
            ' runs_protected=' + report.runsProtected,
    )
}

/**
 * The scheduled sync. Every staged object on every ACTIVE system.
 *
 * SHIPS DISARMED. When it is armed, arming order matters: the cleaner (R3-4) should be armed
 * with it or before it, or data accumulates with no expiry.
 */
export function runScheduledSync(): void {
    const systems: string[] = []
    const sys = new GlideRecord('x_335329_sn_hr_erp_erp_system')
    sys.addQuery('active', true)
    sys.query()
    while (sys.next()) {
        // isTrue is not needed on addQuery, but IS needed the moment a Boolean is read back:
        // getValue() on a Boolean returns '1'/'0', never 'true'/'false' (kickoff §9).
        if (isTrue(sys.getValue('active'))) {
            systems.push(sys.getUniqueValue())
        }
    }

    const objects: string[] = []
    const names = Object.keys(LOGICAL_OBJECTS)
    for (let i = 0; i < names.length; i++) {
        // Null category means live-only: payroll_record and employee_profile are never staged
        // (D2). The scheduled job cannot reach them because this list cannot contain them.
        if (LOGICAL_OBJECTS[names[i]].category) {
            objects.push(names[i])
        }
    }

    const started = new GlideDateTime().getValue()
    let runs = 0
    for (let s = 0; s < systems.length; s++) {
        for (let o = 0; o < objects.length; o++) {
            syncObject(systems[s], objects[o])
            runs++
        }
    }
    gs.info('[HRERP-L3-SYNC] started=' + started + ' systems=' + systems.length + ' runs=' + runs)
}
