import { Record, UiAction } from '@servicenow/sdk/core'
import { appMenu } from './app-menu.now'
import { applyVendorDefaultsAction } from '../../server/mapping/apply-template'

// L1-12 and L1-13. The "Apply vendor defaults" action and the navigator modules that make
// the config surface reachable. Links use `_list.do` -- never `.list`, which fails in Next
// Experience (kickoff §9).

const ADMIN = 'x_335329_sn_hr_erp.admin'

// ---------------------------------------------------------------------------------------
// L1-12 -- "Apply vendor defaults". §5.3, story L1-4 AC4/AC5, tests T1-17, T1-18, T1-21.
//
// A UI ACTION, admin-gated, run only when a human asks for it. Deliberately NOT a business
// rule: T1-17 inserts an object_map through the Table API and requires ZERO field_map
// children afterwards. A rule that populated them on insert makes every new map silently a
// guess and fails that test.
//
// No Script Include bridge is built alongside it, and that is a deliberate deviation from
// §5.3's "plus the same logic exposed as a Script Include method". Rationale in
// docs/l1-build-report.md: nothing at L1 calls it, ScriptInclude.script is string-only so
// the bridge would be a version-pinned require() path that breaks on the first version bump,
// and the logic lives in an importable module any later layer can consume directly.
// ---------------------------------------------------------------------------------------

UiAction({
    $id: Now.ID['ui-action-apply-vendor-defaults'],
    name: 'Apply vendor defaults',
    table: 'x_335329_sn_hr_erp_object_map',
    actionName: 'apply_vendor_defaults',
    active: true,
    order: 100,
    roles: [ADMIN],
    hint: 'Copy this vendor\'s default field mappings into this object mapping. Existing rows are never overwritten.',
    comments:
        'Skips any logical field already mapped and reports the count, so a re-apply can never destroy an admin\'s hand-verified work (story L1-4 AC5).',
    condition: 'current.sys_id != ""',
    form: { showButton: true, showContextMenu: true, showLink: false, style: 'primary' },
    script: applyVendorDefaultsAction,
})

// ---------------------------------------------------------------------------------------
// L1-13 -- navigator modules. The L0 menu shipped with none, because its target tables did
// not exist yet. These are the first.
// ---------------------------------------------------------------------------------------

Record({
    $id: Now.ID['module-erp-systems'],
    table: 'sys_app_module',
    data: {
        title: 'ERP Systems',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_335329_sn_hr_erp_erp_system',
        hint: 'Connection registry: one record per ERP instance.',
        roles: [ADMIN],
        active: true,
        order: 100,
    },
})

Record({
    $id: Now.ID['module-object-maps'],
    table: 'sys_app_module',
    data: {
        title: 'Object Mappings',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_335329_sn_hr_erp_object_map',
        hint: 'One record per (ERP system x logical object). Field mappings are its related list.',
        roles: [ADMIN],
        active: true,
        order: 200,
    },
})

// Story L1-4 AC7 / test T1-20: the unverified surface is reachable by an admin in ONE
// navigation step. §5.4 fixes the query verbatim.
Record({
    $id: Now.ID['module-unverified-mappings'],
    table: 'sys_app_module',
    data: {
        title: 'Unverified Mappings',
        application: appMenu,
        link_type: 'FILTER',
        name: 'x_335329_sn_hr_erp_object_map',
        filter: 'mapping_verified=false^mapping_source=template',
        hint: 'Every object mapping populated from a vendor template that nobody has confirmed against a real endpoint.',
        roles: [ADMIN],
        active: true,
        order: 300,
    },
})

Record({
    $id: Now.ID['module-mapping-templates'],
    table: 'sys_app_module',
    data: {
        title: 'Mapping Templates',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_335329_sn_hr_erp_map_tmpl',
        hint: 'Seeded per-vendor defaults. Every shipped row is a guess and ships verified=false.',
        roles: [ADMIN],
        active: true,
        order: 400,
    },
})
