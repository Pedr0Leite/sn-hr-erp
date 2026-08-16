import { ScriptInclude } from '@servicenow/sdk/core'

// L2-9. The connector's Script Include bridge. docs/l2-connector-design.md §6.
//
// `script` is STRING-ONLY (kickoff §9), so the body comes from Now.include() of a real file.
// Per script-include-guide the wrapper uses Class.create, must NOT import Glide APIs, and its
// `type`, its class name and this `name` must match exactly -- all three read `ErpConnector`.
//
// accessibleFrom: 'package_private' is L2-D4 and is DELIBERATE. The sibling ships 'public'; D4
// removed the only cross-scope consumer, and 'public' on a class that dials external systems
// with stored credentials is an unnecessary surface. table-api warns that package_private can
// make a record unselectable in some platform features -- verified irrelevant here: no Business
// Rule and no Flow references ErpConnector by name, and only L3 and L6 modules call it, in
// scope.
//
// CONSEQUENCE, recorded rather than worked around: a Global-scope background script CANNOT call
// this. That is precisely why the L2 test drivers are in-scope scheduled scripts (§8) and not
// something more convenient.
//
// clientCallable: false -- the SPA reaches the data through the L4 REST API, never GlideAjax.
// sandboxCallable: false -- never reachable from a `javascript:` filter or a column default.

export const erpConnectorScriptInclude = ScriptInclude({
    $id: Now.ID['ErpConnector'],
    name: 'ErpConnector',
    apiName: 'x_335329_sn_hr_erp.ErpConnector',
    script: Now.include('../../server/script-includes/erp-connector.js'),
    description: 'Read-only ERP REST connector: retry, backoff, circuit breaker, telemetry. Thin bridge to src/server/connector -- no logic here.',
    accessibleFrom: 'package_private',
    clientCallable: false,
    sandboxCallable: false,
    active: true,
})
