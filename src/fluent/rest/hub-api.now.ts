import { RestApi } from '@servicenow/sdk/core'
import { getData, postRefresh } from '../../server/api/routes'

// L4-6 and L4-8. ONE SERVICE, TWO ROUTES. docs/l4-api-design.md §2.
//
// `namespace` is omitted deliberately -- restapi-api confirms it defaults to the application
// scope, so the base path is /api/x_335329_sn_hr_erp/hub without declaring it. A hand-written
// namespace is a second place for the scope name to drift.
//
// THE TAB IS A PARAMETER, NOT A ROUTE (L4-D5). One route per tab would mean five near-identical
// bodies, five ACL sets, and -- decisively -- an unknown tab would produce a router 404 instead
// of the 400 story L4-1 AC5 requires. "That tab does not exist" and "this API does not exist"
// are different sentences to whoever is debugging.
//
// `authentication: true` ON BOTH ROUTES AND IT IS EASY TO GET WRONG. Resource ACLs are only
// checked for AUTHENTICATED users (ServiceNowOfficialDocs/api-reference/rest-api-explorer/
// t_WbSvcOpRqACL.md), so an `enforceAcl` list alone does not produce the 401 that story L4-3
// AC5 requires. This flag does.
//
// Route `script` is a MODULE FUNCTION, which module-guide lists RestApi route handlers among
// the APIs that accept. The bodies are in src/server/api/routes.ts and are thin: parse,
// delegate, serialise.

export const hubApi = RestApi({
    $id: Now.ID['hub-api'],
    name: 'SN HR ERP Hub',
    serviceId: 'hub',
    active: true,
    produces: 'application/json',
    consumes: 'application/json',
    shortDescription:
        'One fat GET /data per tab, carrying every tile state explicitly. The client never infers state from an absent or zero value.',
    routes: [
        {
            $id: Now.ID['hub-route-data'],
            name: 'data',
            method: 'GET',
            path: '/data',
            script: getData,
            authentication: true,
            produces: 'application/json',
            shortDescription:
                'Returns every KPI, chart and list for one tab in ONE response, each carrying st (live | stale | failed | not_configured | partial | restricted). A tab needing two calls fails story L4-1 AC1.',
            parameters: [
                {
                    $id: Now.ID['hub-route-data-param-tab'],
                    name: 'tab',
                    required: true,
                    exampleValue: 'inventory',
                    shortDescription:
                        'financial | procurement | inventory | assets | manufacturing. Missing or unrecognised is a 400 naming the value -- never a 200 with an empty body.',
                },
            ],
        },
        {
            $id: Now.ID['hub-route-refresh'],
            name: 'refresh',
            method: 'POST',
            path: '/refresh',
            script: postRefresh,
            authentication: true,
            consumes: 'application/json',
            produces: 'application/json',
            shortDescription:
                "Enqueues a sync for ONLY the posted tab's objects and returns immediately. Not a GET, because it has an effect; not synchronous, because a tab open must not block on an ERP that may be timing out. There is no variant that takes no tab.",
        },
    ],
})
