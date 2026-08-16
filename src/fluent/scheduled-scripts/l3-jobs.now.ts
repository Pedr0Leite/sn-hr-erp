import { Property, ScheduledScript } from '@servicenow/sdk/core'
import { admin, viewer } from '../security/roles.now'
import { drainRefreshQueue, runRetentionJob, runScheduledSync } from '../../server/sync/drainer'
import { runL3Gate } from '../../server/sync/test-driver-l3'

// L3-13 and L3-14. The three L3 jobs plus the gate driver.
//
// ===========================================================================================
// ALL FOUR SHIP `frequency: 'on_demand'` AND `active: false`. NO EXCEPTIONS, ZERO ARMED JOBS.
//
// DOCUMENTED DEVIATION, RECORDED AS L3-D8: docs/l3-staging-design.md §4.6 and §6.3 specify
// `frequency: 'daily'` + `active: false` for the scheduled sync and the retention cleaner. The
// product owner's standing constraint for this build is `on_demand` + `active: false` on EVERY
// job, which is strictly stronger: an `on_demand` job has no interval to fire on even if
// `active` is flipped by accident, so it is two independent locks rather than one. Arming
// either job for production means changing `frequency` here as well as `active` -- a source
// change with a diff, which is the point. The design is not reworded; this is a tightening,
// and it is recorded rather than silently applied.
//
// The paid-for reason: a `periodically` driver left armed on a prior instance fired every three
// minutes for hours, issued ~10 outbound requests a run, and was reported four times before
// anyone disarmed it.
//
// AND NOTE: `installMethod: 'demo'` records ignore a redeploy for their `active` field.
// Flipping `active` in source does NOT change an already-installed instance. T3-16 is therefore
// checked by QUERYING sysauto_script AFTER the final deploy, never by reading this file.
// ===========================================================================================

// --- OD1's two category overrides. PUBLISHED BUT EMPTY, deliberately (§6.1). ---------------
//
// Governance approves ONE number now (staging_retention_days = 90, already shipped at L0), and
// per-category tuning becomes an admin decision later with no redeploy. Publishing three
// numbers for approval turns a data-protection sign-off into a debate about inventory
// analytics. The recommended values are in the description, not in the value.
//
// `type: 'string'`, not 'integer': an integer property with an empty value is read back as 0,
// and 0 days would delete everything on the first cycle. Empty must stay EMPTY, and
// retentionDaysFor() falls through to the base window on a blank.

Property({
    $id: Now.ID['prop-staging-retention-inventory-days'],
    name: 'x_335329_sn_hr_erp.staging_retention_inventory_days',
    type: 'string',
    value: '',
    description:
        'Per-category retention override for `inventory`. EMPTY = fall through to staging_retention_days (90). Recommended 30: a low-stock alert from March is noise, and stock_item is the highest-volume object. Requires the same approval as OD1 before it is set.',
    roles: { read: [viewer], write: [admin] },
})

Property({
    $id: Now.ID['prop-staging-retention-assets-days'],
    name: 'x_335329_sn_hr_erp.staging_retention_assets_days',
    type: 'string',
    value: '',
    description:
        'Per-category retention override for `assets`. EMPTY = fall through to staging_retention_days (90). Recommended 365: "depreciated this quarter" and "due within 180 days" are annual-cycle figures, and a 90-day window makes a quarterly figure un-recomputable after a sync gap.',
    roles: { read: [viewer], write: [admin] },
})

// --- The L3 gate driver's targets. Properties, never hardcoded sys_ids in the driver. ------

Property({
    $id: Now.ID['l3-prop-gate-object'],
    name: 'x_335329_sn_hr_erp.test.l3_object',
    type: 'string',
    value: 'invoice',
    description:
        'L3 gate driver only: the logical object with a WORKING map, used for §8 cases (a) and (b). T10 binds this -- the map needs at least one field_map row or it refuses to dial.',
})

Property({
    $id: Now.ID['l3-prop-gate-object-unmapped'],
    name: 'x_335329_sn_hr_erp.test.l3_object_unmapped',
    type: 'string',
    value: 'work_order',
    description:
        'L3 gate driver only: an object with NO object_map on System A, used for §8 case (c) -- the not_configured state.',
})

/**
 * The scheduled sync. Design §4.6 says `daily`; shipped `on_demand` per L3-D8 above.
 *
 * R3-4: arming this before the retention cleaner means data accumulates with no expiry. The
 * arming ORDER is cleaner first (or both together), never sync first.
 */
export const l3ScheduledSync = ScheduledScript({
    $id: Now.ID['l3-scheduled-sync'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L3 SCHEDULED SYNC',
    script: runScheduledSync,
    frequency: 'on_demand',
    active: false,
})

/**
 * The refresh drainer. L4's POST /refresh inserts an x_335329_sn_hr_erp_sync_request row; this
 * drains it. The queue row holds a CATEGORY and there is no encoding for "everything"
 * (story L3-3 AC6).
 */
export const l3RefreshDrainer = ScheduledScript({
    $id: Now.ID['l3-refresh-drainer'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L3 REFRESH DRAINER',
    script: drainRefreshQueue,
    frequency: 'on_demand',
    active: false,
})

/**
 * `RetentionCleaner` -- OD1 / L3-D5. Design §6.3 says `daily`; shipped `on_demand` per L3-D8.
 *
 * NOTHING HERE IS ARMED UNTIL A HUMAN APPROVES THE WINDOW (story L3-5 AC2). T3-19 fails an
 * armed cleaner with no recorded approval. The arming step is: approve OD1's number, then set
 * `frequency: 'daily'` and `active: true` IN SOURCE, rebuild, redeploy -- not a checkbox on the
 * instance, so the approval leaves a diff.
 */
export const l3RetentionCleaner = ScheduledScript({
    $id: Now.ID['l3-retention-cleaner'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L3 RETENTION CLEANER',
    script: runRetentionJob,
    frequency: 'on_demand',
    active: false,
})

/**
 * THE L3 GATE DRIVER. Built, deployed, NOT RUN -- see docs/l3-l4-build-report.md. The gate is
 * recorded NOT MET, not partially credited.
 */
export const l3Gate = ScheduledScript({
    $id: Now.ID['l3-driver-gate'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L3 GATE (temporary)',
    script: runL3Gate,
    frequency: 'on_demand',
    active: false,
})
