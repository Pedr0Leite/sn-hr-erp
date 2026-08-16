import { ScriptInclude } from '@servicenow/sdk/core'

// L3-12. The sync engine's Script Include bridge, mirroring erp-connector.now.ts exactly.
//
// `script` is STRING-ONLY (kickoff §9), so the body comes from Now.include() of a real file.
// The wrapper uses Class.create, imports NO Glide APIs, and its `type`, its class name and this
// `name` all read `SyncEngine`.
//
// accessibleFrom: 'package_private' -- same reasoning as L2-D4. The consumer is L4's
// POST /refresh, in scope. A Global-scope background script cannot call this, which is why the
// L3 jobs are in-scope scheduled scripts.
//
// clientCallable: false -- the SPA reaches the engine through the L4 REST API, never GlideAjax.

export const syncEngineScriptInclude = ScriptInclude({
    $id: Now.ID['SyncEngine'],
    name: 'SyncEngine',
    apiName: 'x_335329_sn_hr_erp.SyncEngine',
    script: Now.include('../../server/script-includes/sync-engine.js'),
    description:
        'Staging sync engine: run lifecycle, idempotent batched upsert, success-only absent-row reconciliation, pagination with two ceilings, retention. Thin bridge to src/server/sync -- no logic here.',
    accessibleFrom: 'package_private',
    clientCallable: false,
    sandboxCallable: false,
    active: true,
})
