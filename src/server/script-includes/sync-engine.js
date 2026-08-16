/**
 * SyncEngine -- L3's only Script Include entry point (docs/l3-staging-design.md §4.6, L3-12).
 *
 * NO LOGIC LIVES HERE. It require()s the bundled engine and delegates, exactly as ErpConnector
 * does for L2. All behaviour is in src/server/sync/, where it is typed and reviewable.
 *
 * WHY A FACADE AT ALL: `ScriptInclude.script` is a string-only property and cannot take a
 * module function (kickoff §9). This gives L4's POST /refresh and any future caller a
 * legacy-callable entry point without duplicating a line of the engine.
 *
 * DO NOT import Glide APIs in this file. Script Include class files run in a context where they
 * are already global, and importing them here breaks the build.
 *
 * THE require() PATHS END IN `.ts` AND THAT IS LOAD-BEARING (D19 / L1 trap T7). This app
 * publishes modules as sys_module rows at
 *   x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/<dir>/<file>.ts
 * A specifier without the extension resolves to a path that does not exist: it builds clean,
 * installs clean, and throws ModuleResolutionException the first time it runs.
 */
var SyncEngine = Class.create()

SyncEngine.prototype = {
    initialize: function () {
        this._engine = require('./src/server/sync/engine.ts')
        this._retention = require('./src/server/sync/retention.ts')
    },

    /**
     * Sync one logical object from one ERP system. Produces exactly one sync_run row.
     * @param {string} erpSystemSysId sys_id of an x_335329_sn_hr_erp_erp_system row
     * @param {string} object logical object name (invoice, stock_item, ...)
     * @returns {object} SyncOutcome -- rowsFetched is NULL, never 0, on a non-success run
     */
    syncObject: function (erpSystemSysId, object) {
        return this._engine.syncObject(erpSystemSysId, object)
    },

    /**
     * Sync one erp_category across every active system that maps its objects.
     * THERE IS DELIBERATELY NO VARIANT THAT TAKES NO CATEGORY -- story L3-3 AC6 forbids a
     * refresh that fans out to every system, and the signature is the guard.
     * @param {string} category finance | procurement | inventory | assets | manufacturing
     */
    syncCategory: function (category) {
        return this._engine.syncCategory(category)
    },

    /** One retention cycle. The ScheduledScript that calls it ships active: false (OD1). */
    runRetention: function () {
        return this._retention.runRetention()
    },

    type: 'SyncEngine',
}
