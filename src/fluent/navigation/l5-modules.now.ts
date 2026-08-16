import { Record, Workspace } from '@servicenow/sdk/core'
import { appMenu } from './app-menu.now'

// L5-13. The workspace shell and the hub's navigator module.
//
// L5-D7 -- WHAT THIS WORKSPACE HONESTLY IS. `Workspace()` exposes six meaningful properties:
// path, title, landingPath, tables, listConfig, order. It builds a list-and-navigation
// workspace over TABLES. It cannot host an arbitrary tabbed analytics composition -- which is
// exactly the reasoning D1 recorded when it rejected native UIB. So this is a real workspace
// giving admins list navigation over the config and audit tables, and the hub is reached in one
// click from the module below. The five-tab hub does NOT render inside the workspace as a
// native workspace page, and story L5-2 should not be read as promising that;
// docs/uib-page-spec.md is the deliverable that would enable it.
//
// Story L5-2 AC3's `schema_version` criterion applies to any sys_ux_macroponent authored. THIS
// DESIGN AUTHORS NONE, so AC3 is satisfied vacuously. Recorded, not claimed as a pass.
//
// EVERY LINK USES .do -- NEVER .list, which fails in the Next Experience shell (kickoff §9).

const VIEWER = 'x_335329_sn_hr_erp.viewer'

export const hubWorkspace = Workspace({
    $id: Now.ID['hub-workspace'],
    title: 'SN HR&ERP',
    path: 'sn_hr_erp',
    active: true,
    order: 100,
    tables: [
        'x_335329_sn_hr_erp_erp_system',
        'x_335329_sn_hr_erp_object_map',
        'x_335329_sn_hr_erp_sync_run',
        'x_335329_sn_hr_erp_doc_req',
    ],
})

// THE MODULE IS GATED ON viewer, NOT admin. The app menu itself is admin-gated (L0) because
// every module it carried until now was a configuration surface. The hub is the one surface a
// plain viewer must reach, so it carries its own role list -- story L5-2 AC2 is "reachable in
// one click as the viewer-only test user".
Record({
    $id: Now.ID['module-hub-page'],
    table: 'sys_app_module',
    data: {
        title: 'ERP Hub',
        application: appMenu,
        link_type: 'DIRECT',
        query: 'x_335329_sn_hr_erp_hub.do',
        hint: 'Five-tab consolidated ERP hub. Every figure carries the state of the ERP that produced it.',
        roles: [VIEWER],
        active: true,
        order: 10,
    },
})
