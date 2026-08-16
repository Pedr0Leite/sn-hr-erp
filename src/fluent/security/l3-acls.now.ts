import { Acl } from '@servicenow/sdk/core'

// L3-2 and L3-5. ACLs for sync_run, erp_staging and sync_request.
//
// THREE RULES CARRIED FORWARD FROM l1-acls.now.ts, unchanged:
//
// 1. `adminOverrides` IS WRITTEN EXPLICITLY ON EVERY RULE. The SDK default is `true`, which is
//    fine on an allow rule and catastrophic on a deny rule (L0 trap T4).
// 2. THE DENY RULES USE SHAPE A (D17): decisionType 'deny' + script 'answer = false;' +
//    adminOverrides false.
// 3. A SHAPE A REFUSAL IS SILENT -- HTTP 200, normal body, field simply unchanged. Every test
//    against a deny rule MUST re-read the value and MUST move a control field in the same
//    request. A test asserting on the status code passes against a completely broken ACL.
//
// WHAT IS NOT HERE, DELIBERATELY: erp_staging has NO create, write or delete ACL for any app
// role (L0 §5.6, L3-D7). `createAccessControls: false` on the Table() means the platform
// generates none either. The sync engine writes as `system` from a scheduled job. Granting
// create to `viewer` so a UI refresh could write inline would make every deny-write rule below
// decorative, since a viewer could then insert a fabricated row with a fabricated fetched_at.

const VIEWER = 'x_335329_sn_hr_erp.viewer'
const ADMIN = 'x_335329_sn_hr_erp.admin'

const T_SYNC_RUN = 'x_335329_sn_hr_erp_sync_run'
const T_STAGING = 'x_335329_sn_hr_erp_staging'
const T_SYNC_REQUEST = 'x_335329_sn_hr_erp_sync_request'

// ---------------------------------------------------------------------------------------
// sync_run -- read viewer, delete admin. NO create and NO write ACL: a run row is the audit
// spine, and evidence that can be edited is not evidence (the call_log reasoning, L2-4).
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-sync-run-read'],
    type: 'record',
    table: T_SYNC_RUN,
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'x_335329_sn_hr_erp.viewer reads sync runs. Not optional: L4 derives every tile state from the latest run, and L5 renders "ERP did not answer" and "as of" from it. A viewer who cannot read this table sees a not-configured tile on a correctly-configured object.',
})

Acl({
    $id: Now.ID['acl-sync-run-delete'],
    type: 'record',
    table: T_SYNC_RUN,
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin deletes a run row. The retention cleaner runs as system and is unaffected.',
})

// FIELD-READ RESTRICTION. story L3-2 AC6 / T3-3: a viewer sees status, started and finished;
// error_message can name a host, an endpoint or a credential profile and is admin-only.
Acl({
    $id: Now.ID['acl-sync-run-read-error-message'],
    type: 'record',
    table: T_SYNC_RUN,
    field: 'error_message',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'The failure reason is admin-only (L0 §5.4). A viewer learns THAT the ERP did not answer, never the endpoint it failed to reach. L4 invariant P6 is the second enforcement: error_message never reaches a non-admin payload.',
})

// HARD DENY-WRITE on the two columns that carry the four-state contract itself (Shape A).
// A run whose status or rows_fetched can be hand-edited is a tile state someone can forge.
Acl({
    $id: Now.ID['acl-sync-run-write-status'],
    type: 'record',
    table: T_SYNC_RUN,
    field: 'status',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A, D17). `status` IS the four-state rule. Written only by the sync engine running as system. adminOverrides is false ON PURPOSE -- the SDK default is true and would make this rule decorative.',
})

Acl({
    $id: Now.ID['acl-sync-run-write-rows-fetched'],
    type: 'record',
    table: T_SYNC_RUN,
    field: 'rows_fetched',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A, D17). Empty-vs-zero on this column is the whole rule in one field: 0 means the ERP said zero, empty means we do not know. Hand-setting it to 0 turns "we could not reach the warehouse" into "no low-stock alerts".',
})

// ---------------------------------------------------------------------------------------
// erp_staging -- read viewer only. Plus hard deny-write on all seven provenance columns, all
// nine promoted columns and `payload` (L3-5). Seventeen deny rules, Shape A, every one with
// adminOverrides FALSE.
//
// T3-2 runs as a FULL ADMIN and asserts the value is unchanged. An admin who can edit a staged
// figure fails that test: the entire attribution chain -- tile -> sync_run -> call_log ->
// object_map -> field_map -- is worthless if the number at the end of it is editable.
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-staging-read'],
    type: 'record',
    table: T_STAGING,
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'x_335329_sn_hr_erp.viewer reads staged ERP data. Monetary gating is NOT done here -- it is done in the L4 payload (D6/D14) plus this table being unreachable except through it for the SPA.',
})

Acl({
    $id: Now.ID['acl-staging-delete'],
    type: 'record',
    table: T_STAGING,
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Only x_335329_sn_hr_erp.admin deletes a staged row by hand. The sync engine reconciles and the retention cleaner ages out, both as system.',
})

Acl({
    $id: Now.ID['acl-staging-write-erp-system'],
    type: 'record',
    table: T_STAGING,
    field: 'erp_system',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). Provenance: which system said this.',
})

Acl({
    $id: Now.ID['acl-staging-write-erp-category'],
    type: 'record',
    table: T_STAGING,
    field: 'erp_category',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). Provenance.',
})

Acl({
    $id: Now.ID['acl-staging-write-logical-object'],
    type: 'record',
    table: T_STAGING,
    field: 'logical_object',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). Provenance, and the filter every list view depends on.',
})

Acl({
    $id: Now.ID['acl-staging-write-source-record-id'],
    type: 'record',
    table: T_STAGING,
    field: 'source_record_id',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). The upsert match key -- editing it duplicates the row on the next sync.',
})

Acl({
    $id: Now.ID['acl-staging-write-fetched-at'],
    type: 'record',
    table: T_STAGING,
    field: 'fetched_at',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A). THE most important of the seventeen: fetched_at drives every "as of" and the whole staleness calculation. Editing it makes a three-week-old figure read as live.',
})

Acl({
    $id: Now.ID['acl-staging-write-sync-run'],
    type: 'record',
    table: T_STAGING,
    field: 'sync_run',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). The link back to the audit spine.',
})

Acl({
    $id: Now.ID['acl-staging-write-object-map'],
    type: 'record',
    table: T_STAGING,
    field: 'object_map',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). Which mapping produced this row.',
})

Acl({
    $id: Now.ID['acl-staging-write-amount'],
    type: 'record',
    table: T_STAGING,
    field: 'amount',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). A figure the ERP stated. Nobody adjusts it in ServiceNow.',
})

Acl({
    $id: Now.ID['acl-staging-write-qty'],
    type: 'record',
    table: T_STAGING,
    field: 'qty',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A).',
})

Acl({
    $id: Now.ID['acl-staging-write-threshold'],
    type: 'record',
    table: T_STAGING,
    field: 'threshold',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). Per-row comparison partner -- editable would mean an editable low-stock alert.',
})

Acl({
    $id: Now.ID['acl-staging-write-ratio'],
    type: 'record',
    table: T_STAGING,
    field: 'ratio',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). OEE is a number executives act on (OD7).',
})

Acl({
    $id: Now.ID['acl-staging-write-delta'],
    type: 'record',
    table: T_STAGING,
    field: 'delta',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). Precomputed qty - threshold; an editable delta is an editable low-stock alert (L3-D12).',
})

Acl({
    $id: Now.ID['acl-staging-write-status'],
    type: 'record',
    table: T_STAGING,
    field: 'status',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). The row\'s own ERP-side state.',
})

Acl({
    $id: Now.ID['acl-staging-write-dim'],
    type: 'record',
    table: T_STAGING,
    field: 'dim',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). Every chart groups by this.',
})

Acl({
    $id: Now.ID['acl-staging-write-label'],
    type: 'record',
    table: T_STAGING,
    field: 'label',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A).',
})

Acl({
    $id: Now.ID['acl-staging-write-code'],
    type: 'record',
    table: T_STAGING,
    field: 'code',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). The business key a user quotes back to the ERP team.',
})

Acl({
    $id: Now.ID['acl-staging-write-occurred-on'],
    type: 'record',
    table: T_STAGING,
    field: 'occurred_on',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). Due dates drive the overdue and EOL lists.',
})

Acl({
    $id: Now.ID['acl-staging-write-payload'],
    type: 'record',
    table: T_STAGING,
    field: 'payload',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write (Shape A). The full mapped record behind the promoted columns.',
})

// ---------------------------------------------------------------------------------------
// sync_request -- read + CREATE for viewer (see the table file for why create is viewer),
// delete admin, and an explicit WRITE for admin so the drainer can close a row.
//
// The write rule was originally omitted on the assumption that the drainer "runs as system" and is
// therefore unconstrained. If that assumption is wrong the failure is silent and expensive: a
// scoped write refusal does not throw, so `drained` stays false, the row is re-selected by
// `addQuery('drained', false)` on EVERY subsequent drain, and each pass re-syncs it — unbounded
// outbound ERP traffic plus a new `sync_run` per pass, forever. An explicit rule costs nothing and
// removes the assumption. See BUG-008.
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-sync-request-write'],
    type: 'record',
    table: T_SYNC_REQUEST,
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Lets the drainer close a queue row by setting `drained`. Without it a refused write is silent and the queue re-syncs forever (BUG-008).',
})

Acl({
    $id: Now.ID['acl-sync-request-read'],
    type: 'record',
    table: T_SYNC_REQUEST,
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'A viewer reads the refresh queue so the SPA can say "Refresh queued" honestly rather than optimistically.',
})

Acl({
    $id: Now.ID['acl-sync-request-create'],
    type: 'record',
    table: T_SYNC_REQUEST,
    operation: 'create',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'CREATE IS GRANTED TO viewer, NOT admin, AND THAT IS THE POINT -- the same reasoning as call_log create (L2-4). POST /refresh runs in the caller\'s real session; admin-only create would make every viewer-pressed Refresh silently enqueue nothing.',
})

Acl({
    $id: Now.ID['acl-sync-request-delete'],
    type: 'record',
    table: T_SYNC_REQUEST,
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin clears the queue by hand.',
})
