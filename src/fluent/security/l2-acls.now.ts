import { Acl } from '@servicenow/sdk/core'

// L2-4. The call_log ACLs. Extends the L1 inventory in docs/l1-build-report.md §7.
//
// `adminOverrides` IS WRITTEN EXPLICITLY ON EVERY RULE. The SDK default is `true`, which is
// fine on an allow rule and catastrophic on a deny rule (L0 trap T4). All three below are
// allow rules; the flag is still written, because the habit is the control.
//
// THERE IS DELIBERATELY NO WRITE ACL. `createAccessControls: false` on the Table() means the
// platform generates none either, so `write` on call_log is denied to every role including
// x_335329_sn_hr_erp.admin. A telemetry row is IMMUTABLE after insert: it is the evidence
// trail a wrong figure is traced through, and evidence that can be edited is not evidence.
// An admin who needs a row gone deletes it (and that is audited by sys_audit_delete), rather
// than quietly correcting its http_code.

const VIEWER = 'x_335329_sn_hr_erp.viewer'
const ADMIN = 'x_335329_sn_hr_erp.admin'

Acl({
    $id: Now.ID['acl-call-log-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_call_log',
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'x_335329_sn_hr_erp.viewer may read call telemetry. Provenance a viewer cannot read is not provenance: L4 names the system and the call behind every figure, and L5 renders the failed/stale states from it.',
})

Acl({
    $id: Now.ID['acl-call-log-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_call_log',
    operation: 'create',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'CREATE IS GRANTED TO viewer, NOT admin, AND THAT IS THE POINT. The connector writes one telemetry row per attempt IN THE INVOKING USER\'S CONTEXT. If create were admin-only, every viewer-invoked call would silently log nothing -- telemetry invisible to exactly the users who generate it, and a breaker that can never see enough failures to trip. T2-14 is its test.',
})

Acl({
    $id: Now.ID['acl-call-log-delete'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_call_log',
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Only x_335329_sn_hr_erp.admin deletes telemetry. The L3 retention job runs as system and is unaffected.',
})
