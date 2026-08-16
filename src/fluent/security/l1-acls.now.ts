import { Acl } from '@servicenow/sdk/core'

// L1-4 and L1-9. Every ACL for the four L1 tables. 24 rules.
// docs/l1-control-tower-design.md §6, inventory rows 1-16, 38-43, 58-59 of
// docs/l0-build-report.md §8.3.
//
// THREE RULES THAT ARE NOT NEGOTIABLE ON THIS FILE:
//
// 1. `adminOverrides` IS WRITTEN EXPLICITLY ON ALL 24. The SDK default is `true`
//    (acl-plugin.js:166 -- `admin_overrides: $.from('adminOverrides').def(true)`), which is
//    fine on an allow rule and catastrophic on a deny rule: a deny ACL that omits the flag
//    is silently admin-overridable, which is the exact failure the deny rules exist to
//    prevent, arriving on a clean build with no diagnostic. L0 trap T4.
//
// 2. THE TWO DENY RULES USE SHAPE A, PROVEN LIVE AT L0 AGAINST A FULL ADMIN (D17):
//    decisionType 'deny' + script 'answer = false;' + adminOverrides false. Shape B was
//    never needed and is not built.
//
// 3. A SHAPE A REFUSAL IS SILENT -- HTTP 200, normal response body, field simply unchanged
//    (D17). Every test against rows 23 and 24 below MUST re-read the value and MUST write a
//    control field in the same request. A test asserting on status code passes against a
//    completely broken ACL.
//
// `createAccessControls: false` is set on all four Table() declarations, so nothing here
// competes with a platform-generated rule.

const VIEWER = 'x_335329_sn_hr_erp.viewer'
const ADMIN = 'x_335329_sn_hr_erp.admin'

// ---------------------------------------------------------------------------------------
// erp_system -- table level. Inventory rows 1-4.
// READ is `viewer`, NOT `admin`: L2's connector and L4's tiles name the system a figure came
// from, and provenance a viewer cannot read is not provenance. The sensitive columns are
// carved out individually below, so a viewer sees WHICH system answered and never its URL
// or its credentials.
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-erp-system-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    operation: 'read',
    roles: [VIEWER],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'x_335329_sn_hr_erp.viewer may read an ERP system so that a figure can name its source. base_url, all three auth profiles and mid_server are separately restricted to admin.',
})

Acl({
    $id: Now.ID['acl-erp-system-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin registers an ERP system.',
})

Acl({
    $id: Now.ID['acl-erp-system-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Only x_335329_sn_hr_erp.admin edits an ERP system. circuit_open_until is deliberately writable here -- spec §5.1 calls it admin-editable for manual reset; it is operational state, not provenance, and is NOT deny-write.',
})

Acl({
    $id: Now.ID['acl-erp-system-delete'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin deletes an ERP system.',
})

// ---------------------------------------------------------------------------------------
// object_map -- table level. Inventory rows 5-8.
// READ is `admin`, NOT `viewer`. Story L1-3 AC8 and test T1-14 assert that a viewer-only
// user is REFUSED, and refused with a security message rather than an empty 200 -- an empty
// list reads as "no systems configured", which is the §7 failure mode delivered by an ACL.
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-object-map-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_object_map',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Only x_335329_sn_hr_erp.admin reads an object mapping. Story L1-3 AC8: a viewer-only user is refused, not shown an empty list.',
})

Acl({
    $id: Now.ID['acl-object-map-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_object_map',
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin creates an object mapping.',
})

Acl({
    $id: Now.ID['acl-object-map-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_object_map',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Only x_335329_sn_hr_erp.admin edits an object mapping. mapping_source and mapping_verified are additionally under hard deny-write.',
})

Acl({
    $id: Now.ID['acl-object-map-delete'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_object_map',
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin deletes an object mapping.',
})

// ---------------------------------------------------------------------------------------
// field_map -- table level. Inventory rows 9-12. Inherits object_map's sensitivity: a field
// mapping names an ERP's internal field names, which is reconnaissance.
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-field-map-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_field_map',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        "Only x_335329_sn_hr_erp.admin reads a field mapping. It inherits object_map's sensitivity -- source_field names an ERP's internal schema.",
})

Acl({
    $id: Now.ID['acl-field-map-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_field_map',
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin creates a field mapping.',
})

Acl({
    $id: Now.ID['acl-field-map-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_field_map',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin edits a field mapping.',
})

Acl({
    $id: Now.ID['acl-field-map-delete'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_field_map',
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin deletes a field mapping.',
})

// ---------------------------------------------------------------------------------------
// mapping_template (x_335329_sn_hr_erp_map_tmpl) -- table level. Inventory rows 13-16.
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-map-tmpl-read'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_map_tmpl',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin reads a seeded vendor mapping template.',
})

Acl({
    $id: Now.ID['acl-map-tmpl-create'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_map_tmpl',
    operation: 'create',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin creates a mapping template.',
})

Acl({
    $id: Now.ID['acl-map-tmpl-write'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_map_tmpl',
    operation: 'write',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Only x_335329_sn_hr_erp.admin edits a mapping template, including flipping `verified` to true after confirming it against a real endpoint.',
})

Acl({
    $id: Now.ID['acl-map-tmpl-delete'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_map_tmpl',
    operation: 'delete',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Only x_335329_sn_hr_erp.admin deletes a mapping template.',
})

// ---------------------------------------------------------------------------------------
// FIELD-LEVEL READ RESTRICTIONS -- 6 rules. Inventory rows 38-43.
// These are what make the viewer-level table read on erp_system safe. A viewer sees the
// system's name, vendor and legal entity -- enough to attribute a figure -- and none of the
// endpoint, credential or topology detail.
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-erp-system-read-base-url'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    field: 'base_url',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'The ERP endpoint is admin-only. A viewer attributing a figure does not need the URL.',
})

Acl({
    $id: Now.ID['acl-erp-system-read-auth-basic'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    field: 'auth_profile_basic',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Credential reference. Admin only.',
})

Acl({
    $id: Now.ID['acl-erp-system-read-auth-oauth'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    field: 'auth_profile_oauth',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Credential reference. Admin only.',
})

Acl({
    $id: Now.ID['acl-erp-system-read-auth-mutual'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    field: 'auth_profile_mutual',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Credential reference, held as a String because sys_auth_profile_mutual does not exist on this instance. Admin only.',
})

Acl({
    $id: Now.ID['acl-erp-system-read-mid-server'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_erp_system',
    field: 'mid_server',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description: 'Network topology. Admin only.',
})

Acl({
    $id: Now.ID['acl-object-map-read-query-template'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_object_map',
    field: 'query_template',
    operation: 'read',
    roles: [ADMIN],
    decisionType: 'allow',
    adminOverrides: true,
    active: true,
    description:
        'Filter syntax can carry identifiers. Admin only. (Redundant while the object_map table read is admin-only, and kept deliberately: it survives any later widening of the table rule.)',
})

// ---------------------------------------------------------------------------------------
// HARD DENY-WRITE -- 2 rules. Inventory rows 58-59. SHAPE A (D17).
//
// NOBODY, ADMIN INCLUDED, MAY HAND-SET A MAPPING TO "VERIFIED". Both columns are written
// exclusively by the "Apply vendor defaults" action, which copies mapping_verified from the
// template it applied. `verified` on a template means someone confirmed that guess against a
// real endpoint. If an admin can type it, it means nothing.
//
// Every assertion against these two MUST re-read the value and MUST move a control field in
// the same request -- the refusal is silent (D17).
// ---------------------------------------------------------------------------------------

Acl({
    $id: Now.ID['acl-object-map-write-mapping-source'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_object_map',
    field: 'mapping_source',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A, D17). mapping_source is provenance: it records whether a mapping was hand-built or copied from a vendor guess. Written only by the Apply vendor defaults action. adminOverrides is false ON PURPOSE -- the SDK default is true and would make this rule decorative.',
})

Acl({
    $id: Now.ID['acl-object-map-write-mapping-verified'],
    type: 'record',
    table: 'x_335329_sn_hr_erp_object_map',
    field: 'mapping_verified',
    operation: 'write',
    decisionType: 'deny',
    script: 'answer = false;',
    adminOverrides: false,
    active: true,
    description:
        'Hard deny-write (Shape A, D17). mapping_verified drives the unverified-mapping banner. Nobody, admin included, may declare a guess verified without having verified anything. adminOverrides is false ON PURPOSE.',
})
