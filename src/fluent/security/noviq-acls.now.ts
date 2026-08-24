import { Acl } from '@servicenow/sdk/core'

// NV-2, NV-3, NV-8, NV-9, NV-12, NV-15 -- ACLs for the six Noviq tables.
//
// THE THREE RULES FROM l1-acls.now.ts APPLY UNCHANGED, and they are not negotiable here either:
//
// 1. `adminOverrides` IS WRITTEN EXPLICITLY ON EVERY RULE. The SDK default is `true`, which is
//    harmless on an allow rule and catastrophic on a deny rule: a deny ACL that omits the flag is
//    silently admin-overridable, which is the exact failure it exists to prevent, arriving on a
//    clean build with no diagnostic. CLAUDE.md trap 3.
//
// 2. DENY RULES USE SHAPE A, proven live against a full admin at L0 (D17):
//    decisionType 'deny' + script 'answer = false;' + adminOverrides false.
//
// 3. A SHAPE A REFUSAL IS SILENT -- HTTP 200, normal body, field simply unchanged. Every test
//    against a deny rule below MUST re-read the value and MUST write a control field in the same
//    request. A test asserting on status code passes against a completely broken ACL. Trap 4.
//
// WHY erp_write IS THE MOST GUARDED TABLE IN THE APPLICATION: it is the audit trail for every
// change this app pushes into a payroll system. If its provenance columns are editable, the
// audit answers "who approved this salary change" with whatever the last editor typed. BRD §7
// requires the chain to be traceable; a forgeable chain is not a chain.

const VIEWER = 'x_335329_sn_hr_erp.viewer'
const HR_VIEWER = 'x_335329_sn_hr_erp.hr_viewer'
const ADMIN = 'x_335329_sn_hr_erp.admin'

// =======================================================================================
// erp_scope_grant (NV-2) -- configuration. Admin writes, viewer reads.
// =======================================================================================
Acl({
    $id: Now.ID['acl-scope-grant-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_scope_grant',
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'A viewer may read scope grants so that a `not configured` tile can name the grant that is missing. The grant names an ERP role, never a credential.',
})

Acl({
    $id: Now.ID['acl-scope-grant-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_scope_grant',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin declares what an ERP credential is scoped to.',
})

Acl({
    $id: Now.ID['acl-scope-grant-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_scope_grant',
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin creates a scope grant.',
})

// =======================================================================================
// erp_write (NV-3, NV-8) -- THE AUDIT TRAIL. Read by HR, written by nobody through the UI.
// =======================================================================================
Acl({
    $id: Now.ID['acl-erp-write-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_write',
    operation: 'read',
    roles: [HR_VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'hr_viewer reads the write trail to answer "did my change actually happen?" and to work exceptions. NOT viewer: these rows name employees and the changes requested against them.',
})

// The five provenance columns below are written by the dispatcher and by nothing else. Each is a
// separate Shape A deny so that a single over-broad rule cannot be relaxed by accident.
Acl({
    $id: Now.ID['acl-erp-write-deny-state'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_write',
    field: 'state',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A, D17). `state` is what the app believes happened at the ERP. A hand-edited state turns "failed" into "confirmed" with no ERP involved. adminOverrides is false ON PURPOSE.',
})

Acl({
    $id: Now.ID['acl-erp-write-deny-ack'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_write',
    field: 'erp_ack_ref',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A). The ERP\'s own acknowledgement. If a human can type it, "the ERP confirmed this" stops being evidence. adminOverrides is false ON PURPOSE.',
})

Acl({
    $id: Now.ID['acl-erp-write-deny-approval'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_write',
    field: 'approval_ref',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A). The approval this write claims to be covered by. Editable, it defeats the whole of NV-9 without touching the gate. adminOverrides is false ON PURPOSE.',
})

Acl({
    $id: Now.ID['acl-erp-write-deny-first-sent'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_write',
    field: 'first_sent_at',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A). The gate compares this timestamp to the approval time to refuse a retroactive approval. Moving it forwards makes a late approval look prior. adminOverrides is false ON PURPOSE.',
})

Acl({
    $id: Now.ID['acl-erp-write-deny-idem'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_write',
    field: 'idempotency_key',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A). Editing the key defeats the unique index and permits the duplicate create that NV-4 exists to prevent. adminOverrides is false ON PURPOSE.',
})

// =======================================================================================
// erp_exception (NV-12) -- HR works these, so HR may update state and assignment.
// =======================================================================================
Acl({
    $id: Now.ID['acl-erp-exception-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_exception',
    operation: 'read',
    roles: [HR_VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'hr_viewer reads the exception queue. An exception nobody can see is an exception nobody works.',
})

Acl({
    $id: Now.ID['acl-erp-exception-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_exception',
    operation: 'write',
    roles: [HR_VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'hr_viewer moves an exception through open -> in progress -> resolved.',
})

Acl({
    $id: Now.ID['acl-erp-exception-deny-category'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_exception',
    field: 'category',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A). The category is derived from what the ERP actually returned. Re-categorising a permission failure as a timeout hides a real access problem behind a retry. adminOverrides is false ON PURPOSE.',
})

// =======================================================================================
// payroll_calendar (NV-7) -- read widely, written by admin. A wrong cut-off misroutes pay.
// =======================================================================================
Acl({
    $id: Now.ID['acl-payroll-calendar-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_payroll_calendar',
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'The cut-off message names the period and pay date to the employee, so it must be readable.',
})

Acl({
    $id: Now.ID['acl-payroll-calendar-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_payroll_calendar',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only admin edits a payroll calendar. A wrong cut-off silently routes a change into the wrong pay cycle.',
})

Acl({
    $id: Now.ID['acl-payroll-calendar-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_payroll_calendar',
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only admin creates a payroll calendar period.',
})

// =======================================================================================
// write_approval_policy (NV-9) -- the gate configuration. Deactivating a row disables a
// BRD-mandated control, so writes are admin-only and `approval_required` is hard-denied.
// =======================================================================================
Acl({
    $id: Now.ID['acl-write-policy-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Readable so a surface can state that an item is approval-gated before it is ordered.',
})

Acl({
    $id: Now.ID['acl-write-policy-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only admin edits approval policy. See the field-level deny on approval_required.',
})

Acl({
    $id: Now.ID['acl-write-policy-deny-required'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    field: 'approval_required',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A). Flipping this to false on the banking, compensation or termination row removes a payroll-fraud control that BRD §7 and §9 both mandate -- silently, with no approval and no trace. Changing a mandated gate is a governance decision, not a form edit. adminOverrides is false ON PURPOSE.',
})

// =======================================================================================
// vendor_onboarding (NV-15) -- research findings. Admin maintains; everyone reads.
// =======================================================================================
Acl({
    $id: Now.ID['acl-vendor-onboarding-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_vendor_onboarding',
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'The onboarding checklist is a scoping artefact -- it is meant to be read before work is committed.',
})

Acl({
    $id: Now.ID['acl-vendor-onboarding-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_vendor_onboarding',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only admin records a confirmation, and every confirmed item needs its citation.',
})

Acl({
    $id: Now.ID['acl-vendor-onboarding-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_vendor_onboarding',
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only admin adds a checklist row.',
})

// =======================================================================================
// usage_event (NV-50) and landscape_discovery (NV-52).
//
// Both were created after the six tables above and NV-49 AC3 requires every table to carry
// explicit ACLs -- a table with none inherits whatever the platform decides, which is not a
// decision anybody in this repo made.
// =======================================================================================

Acl({
    $id: Now.ID['acl-usage-event-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_usage_event',
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Telemetry is readable by any viewer: it holds an area, an action, an outcome and a role name, and no employee, payload or business value. There is nothing here to restrict.',
})

Acl({
    $id: Now.ID['acl-usage-event-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_usage_event',
    operation: 'write',
    roles: [],
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'SHAPE A HARD DENY. A usage event is a fact about something that already happened -- editing one rewrites the evidence a scope decision is made from. Rows are inserted by the shared read and write paths and never amended, by anyone, including an admin.',
})

Acl({
    $id: Now.ID['acl-landscape-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_landscape_discovery',
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'A viewer reads the discovery record because it is what a `not published` area points at: the control tower must be able to say WHICH area is unanswered and which system owns it.',
})

Acl({
    $id: Now.ID['acl-landscape-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_landscape_discovery',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Only x_335329_sn_hr_erp.admin records which system is the authority for a requirement area. This record decides what publishes, so it is an administrative decision, not a per-user one.',
})

Acl({
    $id: Now.ID['acl-landscape-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_landscape_discovery',
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'As above -- discovery rows are created by the delivery lead during scoping.',
})
