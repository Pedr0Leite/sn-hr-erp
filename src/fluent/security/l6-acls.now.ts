import { Acl } from '@servicenow/sdk/core'

// L6-1 and L6-6. ACLs for the four HR-document tables.
//
// THE THREE RULES CARRIED FORWARD FROM l1/l3-acls.now.ts, unchanged:
//   1. `adminOverrides` IS WRITTEN EXPLICITLY ON EVERY RULE. The SDK default is `true`, which is
//      fine on an allow rule and catastrophic on a deny rule (L0 trap T4).
//   2. THE DENY RULES USE SHAPE A (D17): decisionType 'deny' + script 'answer = false;' +
//      adminOverrides false.
//   3. A SHAPE A REFUSAL IS SILENT -- HTTP 200, normal body, field simply unchanged. T6-23 must
//      RE-READ the value after the PATCH; a test asserting on the status code passes against a
//      completely broken ACL.

const HR_VIEWER = 'x_335329_sn_hr_erp.hr_viewer'
const ADMIN = 'x_335329_sn_hr_erp.admin'
const VIEWER = 'x_335329_sn_hr_erp.viewer'

const T_XREF = 'x_335329_sn_hr_erp_emp_xref'
const T_TYPE = 'x_335329_sn_hr_erp_doc_type'
const T_TMPL = 'x_335329_sn_hr_erp_doc_tmpl'
const T_REQ = 'x_335329_sn_hr_erp_doc_req'

// ---------------------------------------------------------------------------------------
// emp_xref -- hr_viewer or admin read. A finance_viewer-only user is REFUSED (story L6-1 AC5),
// and that follows from L0-D2: the four containsRoles lists are empty, so no role implies
// hr_viewer. The table holds four columns and none of them is HR content, but the join key
// itself maps a ServiceNow identity to an ERP payroll identity, and that is not a finance fact.
// ---------------------------------------------------------------------------------------
Acl({
    $id: Now.ID['acl-emp-xref-read'],
    type: 'record',
    table: T_XREF,
    operation: 'read',
    roles: [HR_VIEWER, ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'hr_viewer or admin only. finance_viewer is never implied by any other role (L0-D2), so a finance-only caller is refused -- T6-2.',
})

Acl({
    $id: Now.ID['acl-emp-xref-write'],
    type: 'record',
    table: T_XREF,
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only an app admin maintains the cross-reference. It is never populated by a sync (story L6-1 AC6).',
})

Acl({
    $id: Now.ID['acl-emp-xref-create'],
    type: 'record',
    table: T_XREF,
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only an app admin creates a cross-reference row.',
})

Acl({
    $id: Now.ID['acl-emp-xref-delete'],
    type: 'record',
    table: T_XREF,
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only an app admin deletes a cross-reference row.',
})

// ---------------------------------------------------------------------------------------
// doc_type / doc_tmpl -- configuration. Read by viewer so the record producer's type picker
// resolves for an ordinary requester; written by admin only.
// ---------------------------------------------------------------------------------------
Acl({
    $id: Now.ID['acl-doc-type-read'],
    type: 'record',
    table: T_TYPE,
    operation: 'read',
    roles: [VIEWER, HR_VIEWER, ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'A requester must be able to see the list of document types they may request, or the producer renders an empty picker and reads as "no documents available".',
})

Acl({
    $id: Now.ID['acl-doc-type-write'],
    type: 'record',
    table: T_TYPE,
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'What a document requires is configuration, and configuration is admin-only.',
})

Acl({
    $id: Now.ID['acl-doc-type-create'],
    type: 'record',
    table: T_TYPE,
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Admin-only.',
})

Acl({
    $id: Now.ID['acl-doc-tmpl-read'],
    type: 'record',
    table: T_TMPL,
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Templates are an admin surface. A requester never reads the body; they receive the rendered attachment.',
})

Acl({
    $id: Now.ID['acl-doc-tmpl-write'],
    type: 'record',
    table: T_TMPL,
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Admin-only.',
})

Acl({
    $id: Now.ID['acl-doc-tmpl-create'],
    type: 'record',
    table: T_TMPL,
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Admin-only.',
})

// ---------------------------------------------------------------------------------------
// doc_req -- create is granted to `viewer`, deliberately. Self-service means an ordinary user
// submits their own request; the BOUNDARY is the before-insert rule, not the create ACL.
// Tightening create to hr_viewer would mean every self-service request silently failed.
// ---------------------------------------------------------------------------------------
Acl({
    $id: Now.ID['acl-doc-req-create'],
    type: 'record',
    table: T_REQ,
    operation: 'create',
    roles: [VIEWER, HR_VIEWER, ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Self-service. The rule that decides WHO a request may name is enforceRequestBoundary, which runs on every path including the Table API (story L6-3 AC3).',
})

Acl({
    $id: Now.ID['acl-doc-req-read'],
    type: 'record',
    table: T_REQ,
    operation: 'read',
    roles: [VIEWER, HR_VIEWER, ADMIN],
    decisionType: 'allow',
    script: 'answer = (current.requester == gs.getUserID()) || gs.hasRole("x_335329_sn_hr_erp.hr_viewer") || gs.hasRole("x_335329_sn_hr_erp.admin");',
    adminOverrides: true,
    active: true,
    description:
        'Story L6-6 AC6 -- a requester sees their own requests and not other people\'s. failure_reason is readable to them (story L6-3 AC8): a refusal nobody can read is a refusal nobody can act on.',
})

// --- THE SEVEN DENY-WRITE COLUMNS (Shape A, adminOverrides FALSE). ----------------------
//
// Story L6-6 AC5: AN ADMIN CANNOT RETRO-EDIT WHO REQUESTED WHAT. Every one of these is written
// server-side -- by the before-insert rule or by the generator -- and an audit trail that the
// audited party can edit is not an audit trail.

Acl({
    $id: Now.ID['acl-doc-req-write-requester'],
    type: 'record',
    table: T_REQ,
    field: 'requester',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A, D17). Set unconditionally from gs.getUserID() by the before-insert rule (L6-D4). adminOverrides is false ON PURPOSE -- the SDK default is true and would make this rule decorative.',
})

Acl({
    $id: Now.ID['acl-doc-req-write-status'],
    type: 'record',
    table: T_REQ,
    field: 'status',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write. A hand-edited status is a document someone can claim was generated when it was not.',
})

Acl({
    $id: Now.ID['acl-doc-req-write-failure-reason'],
    type: 'record',
    table: T_REQ,
    field: 'failure_reason',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write. The stated reason is the deliverable of a failure; an editable one states nothing.',
})

Acl({
    $id: Now.ID['acl-doc-req-write-generated-on'],
    type: 'record',
    table: T_REQ,
    field: 'generated_on',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write. Written by the generator from a GlideDateTime at the moment of attachment.',
})

Acl({
    $id: Now.ID['acl-doc-req-write-output-format'],
    type: 'record',
    table: T_REQ,
    field: 'output_format',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write. Set by resolveFormat() from what was ACTUALLY produced. A hand-set PDF label on an HTML file is precisely what OD2 forbids.',
})

Acl({
    $id: Now.ID['acl-doc-req-write-source-call-ids'],
    type: 'record',
    table: T_REQ,
    field: 'source_call_ids',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write. The trail from a printed figure back to the call that produced it (story L6-6 AC2).',
})

Acl({
    $id: Now.ID['acl-doc-req-write-pdf-probe'],
    type: 'record',
    table: T_REQ,
    field: 'pdf_probe_result',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description: 'Hard deny-write. Instance evidence for OD2, recorded per generation by the runtime probe.',
})
