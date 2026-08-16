/**
 * ErpConnector -- the L2 connector's only Script Include entry point (design §6).
 *
 * NO LOGIC LIVES HERE. It require()s the bundled orchestrator and delegates. All behaviour is
 * in src/server/connector/erp-connector.ts, where it is typed, testable and reviewable.
 *
 * WHY A FACADE AT ALL: `ScriptInclude.script` is a string-only property and cannot take a
 * module function (kickoff §9, module-guide). L3's sync engine and L6's document assembler
 * reach the connector by Script Include name. The bridge gives us typed modules AND a
 * legacy-callable entry point (I11).
 *
 * DO NOT import Glide APIs in this file. Script Include class files run in a context where they
 * are already available, and importing them here breaks the build (kickoff §9, module-guide).
 *
 * THE require() PATH IS NOT A GUESS. This app publishes modules as sys_module rows at
 *   x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/<dir>/<file>.ts
 * (verified live on dev296062 against the eight L1 modules), so
 * `require('./src/server/connector/erp-connector.ts')` is the specifier that resolves. The
 * SDK docs' `./dist/modules/...` example does not exist in this project's build at all.
 *
 * AND THE EXTENSION IS LOAD-BEARING EVERYWHERE, NOT JUST HERE. D19 / L1 trap T7: a relative
 * import BETWEEN modules under src/server/ is emitted verbatim, and the platform's loader
 * resolves `'../util/bool'` to a sys_module path that does not exist. It builds clean, it
 * installs clean, and it throws ModuleResolutionException the first time the code runs -- and
 * inside a `before` business rule that exception is SWALLOWED and the record saves. Every
 * intra-layer import in src/server/connector/ therefore ends in `.ts`. Do not strip them "for
 * tidiness"; it breaks the app only at runtime.
 */
var ErpConnector = Class.create()

ErpConnector.prototype = {
    initialize: function () {
        this._mod = require('./src/server/connector/erp-connector.ts')
    },

    /**
     * Fetch one logical object from one ERP system. READ-ONLY BY CONSTRUCTION.
     * @param {string} erpSystemSysId sys_id of an x_335329_sn_hr_erp_erp_system row
     * @param {string} object logical object name (invoice, stock_item, ...)
     * @param {object} [params] { externalId, extraQuery, headers, body }
     * @returns {object} ConnectorResult -- note `body` is in memory only and must not be stored (C1)
     */
    fetch: function (erpSystemSysId, object, params) {
        return this._mod.fetch(erpSystemSysId, object, params)
    },

    /** @returns {boolean} true when the breaker is currently refusing calls for this system. */
    isCircuitOpen: function (erpSystemSysId) {
        return this._mod.isCircuitOpen(erpSystemSysId)
    },

    /** Admin utility: clear `circuit_open_until`. Bypasses nothing an admin could not do by hand. */
    resetCircuit: function (erpSystemSysId) {
        return this._mod.resetCircuit(erpSystemSysId)
    },

    type: 'ErpConnector',
}
