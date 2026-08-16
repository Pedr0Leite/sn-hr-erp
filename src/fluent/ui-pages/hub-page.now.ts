import { UiPage } from '@servicenow/sdk/core'
import page from '../../client/index.html'

// L5-3 / L5-D1. THE FIRST VISIBLE PRODUCT IN THIS APP.
//
// `sys_ux_lib_asset` IS NOT AUTHORED, and that is deliberate (L5-D1). The SDK 4.9.0 UI Page
// documentation never mentions those tables, forbids custom build configuration, and documents
// exactly this path instead: import the entry HTML and let the build system bundle. Story
// L5-1 AC1's SUBSTANCE -- a sys_ui_page served at <scope>_hub.do loading a built JS asset --
// holds; the registration table named in it is superseded.
//
// THREE PROPERTIES ARE CRITICAL AND EASY TO GET WRONG:
//   endpoint MUST begin with the scope name -- x_335329_sn_hr_erp_hub.do
//   html     MUST be the IMPORTED index.html, so the bundler's output is what gets served
//   direct   MUST be true
//
// The cache-buster is in src/client/index.html, not here: `main.tsx?uxpcb=$[...]`. Without it
// a redeploy serves the previously cached bundle and every visible change looks like it did
// not deploy (L5-D2).

export const hubPage = UiPage({
    $id: Now.ID['hub-ui-page'],
    category: 'general',
    endpoint: 'x_335329_sn_hr_erp_hub.do',
    html: page,
    direct: true,
    description:
        'BYOUI React 18.2.0 SPA: five ERP tabs, one fat GET /data per tab, every tile carrying its own state (live | stale | failed | not_configured | partial | restricted). No CRM content, no Approve/Reject control (D3), no monetary figure without finance_viewer (D6).',
})
