import { ApplicationMenu } from '@servicenow/sdk/core'
import { admin, viewer } from '../security/roles.now'

// L0 §8 step L0-11. The navigator container every later layer's module hangs off.
//
// The menu is gated on x_335329_sn_hr_erp.admin because every module it will carry is a
// configuration surface (erp_system, object_map, field_map, mapping_template -- all L1).
// No Module() records are declared at L0: their target tables do not exist yet, and a module
// pointing at a non-existent table is a broken link, not a scaffold. Each layer adds its own.
//
// The title deliberately carries the literal ampersand. This is the navigator half of the
// OD8 / story L0-2 ampersand verification -- if & breaks a nav label or a generated link,
// it breaks here.
// Module links, when they land, use `_list.do` -- never `.list`, which fails in Next Experience (§9).

export const appMenu = ApplicationMenu({
    $id: Now.ID['app-menu-sn-hr-erp'],
    title: 'SN HR&ERP',
    name: 'SN HR&ERP',
    description: 'Consolidated HR and ERP hub: configuration, staged ERP data and document generation.',
    hint: 'SN HR&ERP configuration',
    // L5 AMENDMENT (L5-D9). The menu shipped admin-only at L0 because every module it carried
    // was a configuration surface. L5 adds the ERP Hub module, which story L5-2 AC2 requires a
    // viewer-only user to reach in ONE CLICK -- and an admin-only MENU hides a viewer-gated
    // module inside it, so the criterion would fail on the container rather than the link.
    // `viewer` is added HERE and the per-module role lists stay as they were: the config
    // modules remain admin-gated, so a viewer sees the menu with exactly one entry in it.
    roles: [admin, viewer],
    active: true,
    order: 100,
})
