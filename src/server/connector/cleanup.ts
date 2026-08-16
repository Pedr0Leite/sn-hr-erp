import { GlideRecord, gs } from '@servicenow/glide'

/**
 * L2 test-data teardown.
 *
 * The `installMethod: 'demo'` fixtures themselves STAY -- they are deliverables of step L2-11.
 * What this removes is the telemetry a test run generated: `call_log` rows and any residual
 * breaker state.
 *
 * IT DELETES THE EVIDENCE'S SHADOW, NOT THE EVIDENCE. The evidence is the drivers' own PASS/FAIL
 * lines in `syslog_app_scope` (§8); this only clears table state, which was never evidence.
 * Run it AFTER the build report has been written, never before.
 */
export function runCleanup(): void {
    const M = '[HRERP-L2-CLEAN]'

    const log = new GlideRecord('x_335329_sn_hr_erp_call_log')
    log.query()
    let deleted = 0
    while (log.next()) {
        log.deleteRecord()
        deleted++
    }
    gs.info(M + ' deleted ' + deleted + ' call_log row(s)')

    const sys = new GlideRecord('x_335329_sn_hr_erp_erp_system')
    sys.addQuery('circuit_open_until', '!=', '')
    sys.query()
    let cleared = 0
    while (sys.next()) {
        sys.setValue('circuit_open_until', '')
        sys.update()
        cleared++
    }
    gs.info(M + ' cleared circuit_open_until on ' + cleared + ' system(s)')
    gs.info(M + ' ===== DONE =====')
}
