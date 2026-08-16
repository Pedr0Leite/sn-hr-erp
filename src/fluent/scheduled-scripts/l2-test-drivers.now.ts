import { Property, ScheduledScript } from '@servicenow/sdk/core'
import { runAllAdminTests } from '../../server/connector/test-driver-all'
import { runViewerTests } from '../../server/connector/test-driver-viewer'
import { runGateOnly } from '../../server/connector/test-driver-l2'
import { runCleanup } from '../../server/connector/cleanup'
import { runHarness } from '../../server/connector/harness'

// L2-10. The test drivers. docs/l2-connector-design.md §7 step L2-10, T2-17.
//
// ===========================================================================================
// EVERY ONE OF THESE SHIPS `frequency: 'on_demand'` AND `active: false`. NO EXCEPTIONS.
//
// This is not caution, it is a paid-for rule. A `periodically` driver left armed on a prior
// instance fired every three minutes for hours, issuing ~10 outbound requests a run, and was
// reported four times before anyone disarmed it. `on_demand` means there is no interval for it
// to fire on even if `active` were flipped by accident; `active: false` means it does not run.
// Both, together, deliberately.
//
// TO RUN ONE: *Execute Now* on the record (or the equivalent sys_trigger insert), capture the
// syslog_app_scope evidence, and leave `active` alone -- an on_demand job does not need arming.
//
// AND NOTE: `installMethod: 'demo'` records ignore a redeploy for their `active` field. Flipping
// `active` in source does NOT change an already-installed instance. T2-17 is therefore checked
// by QUERYING sysauto_script AFTER the final deploy, never by reading this file.
// ===========================================================================================
//
// DOCUMENTED DEVIATION from the design's test plan, inherited from the sibling: the plan assumes
// an operator with a browser (Execute Now, editing fixtures between cases, UI impersonation for
// T30/T31). No browser session is available here, so the plan is executed by these scripts,
// which perform their own setup, assertions and teardown and report to `syslog_app_scope` --
// readable with `now-sdk query`, which is the only evidence channel this environment has.

// The three fixture sys_ids, from a live query against dev296062 (the one case kickoff §9
// permits a raw sys_id: a value returned by a query against a real instance).
const SYSTEM_A_SYS_ID = '540bdfeb47260b100739b71f316d43a1' // ECHO-PRIMARY
const SYSTEM_B_SYS_ID = '523bd72f47260b100739b71f316d43e6' // ECHO-SAP-DE
const SYSTEM_C_SYS_ID = '240bdfeb47260b100739b71f316d43b7' // BROKEN-FIXTURE
const VIEWER_TEST_USER = 'bdede8af476e87100739b71f316d435c' // hrerp_viewer_only

export const testSystemAProperty = Property({
    $id: Now.ID['l2-prop-test-system-a'],
    $meta: { installMethod: 'demo' },
    name: 'x_335329_sn_hr_erp.test.system_a',
    type: 'string',
    value: SYSTEM_A_SYS_ID,
    description: 'L2 test drivers only: sys_id of the ECHO-PRIMARY fixture (System A).',
})

export const testSystemBProperty = Property({
    $id: Now.ID['l2-prop-test-system-b'],
    $meta: { installMethod: 'demo' },
    name: 'x_335329_sn_hr_erp.test.system_b',
    type: 'string',
    value: SYSTEM_B_SYS_ID,
    description: 'L2 test drivers only: sys_id of the ECHO-SAP-DE fixture (System B, the zero-code proof).',
})

export const testSystemCProperty = Property({
    $id: Now.ID['l2-prop-test-system-c'],
    $meta: { installMethod: 'demo' },
    name: 'x_335329_sn_hr_erp.test.system_c',
    type: 'string',
    value: SYSTEM_C_SYS_ID,
    description: 'L2 test drivers only: sys_id of BROKEN-FIXTURE (System C). Deliberately unreachable -- the gate\'s forced-failure path.',
})

export const harnessSystemProperty = Property({
    $id: Now.ID['l2-prop-harness-system'],
    $meta: { installMethod: 'demo' },
    name: 'x_335329_sn_hr_erp.harness.erp_system',
    type: 'string',
    value: SYSTEM_A_SYS_ID,
    description: 'Ad-hoc connector harness: which erp_system row to call. Change the property, not the code.',
})

export const harnessObjectProperty = Property({
    $id: Now.ID['l2-prop-harness-object'],
    $meta: { installMethod: 'demo' },
    name: 'x_335329_sn_hr_erp.harness.object',
    type: 'string',
    value: 'invoice',
    description: 'Ad-hoc connector harness: which logical object to fetch.',
})

export const harnessExternalIdProperty = Property({
    $id: Now.ID['l2-prop-harness-external-id'],
    $meta: { installMethod: 'demo' },
    name: 'x_335329_sn_hr_erp.harness.external_id',
    type: 'string',
    value: '',
    description: 'Ad-hoc connector harness: optional {external_id} substitution value.',
})

/**
 * The whole admin-context suite in ONE job, so the cases cannot overlap on the same fixture
 * rows: driver A's single-call cases must not meet a tripped breaker, driver B trips it
 * deliberately, and the L2 driver's gate sequence needs a clean start.
 */
export const l2DriverAdmin = ScheduledScript({
    $id: Now.ID['l2-driver-admin'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L2 DRIVER ADMIN (temporary)',
    script: runAllAdminTests,
    frequency: 'on_demand',
    active: false,
})

/**
 * T30 / T31 / T2-14 -- the only non-admin evidence this environment can produce.
 *
 * `runAs` is the whole point of this record. It is `hrerp_viewer_only`, a user holding exactly
 * one app role, and it needs no password -- which routes around the instance-level 401 that
 * blocked L1's non-admin verification.
 *
 * IT IS STILL NOT A BROWSER SESSION. C5 stays open.
 */
export const l2DriverViewer = ScheduledScript({
    $id: Now.ID['l2-driver-viewer'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L2 DRIVER VIEWER (temporary)',
    script: runViewerTests,
    frequency: 'on_demand',
    active: false,
    runAs: VIEWER_TEST_USER,
})

/**
 * THE L2 GATE, on its own: one successful live call, one forced-failure call, both logged, and
 * the breaker's three circuit_open_until reads. Separate from the suite above because the gate
 * is non-negotiable and the rest of the test breadth is deferred to a dedicated pass.
 */
export const l2DriverGate = ScheduledScript({
    $id: Now.ID['l2-driver-gate'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L2 GATE (temporary)',
    script: runGateOnly,
    frequency: 'on_demand',
    active: false,
})

/** Ad-hoc single call against any system/object pair. Reads its target from properties. */
export const l2Harness = ScheduledScript({
    $id: Now.ID['l2-harness'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L2 CONNECTOR HARNESS (temporary)',
    script: runHarness,
    frequency: 'on_demand',
    active: false,
})

/**
 * Teardown. Deletes call_log rows and clears residual breaker state.
 *
 * RUN IT AFTER THE BUILD REPORT IS WRITTEN, NEVER BEFORE. It removes table state, which was
 * never the evidence -- but a reader who ran it first would find an empty table and no way to
 * cross-check the drivers' own log lines.
 */
export const l2Cleanup = ScheduledScript({
    $id: Now.ID['l2-cleanup'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L2 CLEANUP (temporary)',
    script: runCleanup,
    frequency: 'on_demand',
    active: false,
})
