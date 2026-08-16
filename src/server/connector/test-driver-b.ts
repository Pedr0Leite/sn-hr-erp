import { GlideDateTime, GlideRecord, gs } from '@servicenow/glide'
import { fetch } from './erp-connector.ts'
import { CONNECTOR_CONSTANTS } from './constants.ts'
import { nowMs } from './util.ts'
import {
    MARK_ADMIN,
    assert,
    clearBreaker,
    clearCallLog,
    forceHalfOpen,
    getSystemField,
    isFutureDateTime,
    log,
    looksLikePayload,
    readCallLog,
    summarise,
} from './test-driver-util.ts'

/**
 * The ported test plan, cases T24-T28, T32 and T33 -- the breaker cases, the C1 audit, the
 * zero-code proof and the IntegrationHub-independence grep.
 *
 * These run SECOND and in order: T24 deliberately trips the breaker and T25-T27 depend on that
 * state, so nothing here may reset the breaker except where a case says so.
 *
 * NOTE ON THE SIBLING'S RECORDED MISTAKE (§8): runDriverB ends with an unconditional
 * clearBreaker, so TABLE STATE AFTER THIS RUN IS TEARDOWN STATE, NOT EVIDENCE. The evidence is
 * the PASS/FAIL lines below, in syslog_app_scope. Do not read circuit_open_until after the fact
 * and conclude anything from it.
 */

const M = MARK_ADMIN
const SYS_A = 'x_335329_sn_hr_erp.test.system_a'
const SYS_B = 'x_335329_sn_hr_erp.test.system_b'

/** T24 -- breaker opens after CB_FAILURE_THRESHOLD consecutive non-success attempts. GATE. */
function t24(a: string): boolean {
    clearBreaker(a)
    clearCallLog(a)

    // Two consecutive fully-exhausted calls = 6 attempt rows = CB_FAILURE_THRESHOLD exactly.
    fetch(a, 'balance')
    fetch(a, 'balance')

    const rows = readCallLog(a)
    const until = getSystemField(a, 'circuit_open_until')
    log(M, 'T24 circuit_open_until="' + until + '" | ' + summarise(rows))

    const okRows = assert(M, 'T24', '6 attempt rows total', rows.length === 6, String(rows.length))
    const okSet = assert(M, 'T24', 'circuit_open_until populated', until !== '', '"' + until + '"')
    const okFuture = assert(M, 'T24', 'circuit_open_until is in the FUTURE', isFutureDateTime(until), '"' + until + '"')

    // Expected ~ now + CB_COOLDOWN_MS (2 minutes). Assert the MAGNITUDE, not just "future" --
    // a 1-second cooldown would also be "in the future" and would be a silent misconfiguration.
    if (until !== '') {
        const deltaMs = new GlideDateTime(until).getNumericValue() - nowMs()
        const expected = CONNECTOR_CONSTANTS.CB_COOLDOWN_MS
        assert(M, 'T24', 'cooldown ~= CB_COOLDOWN_MS (120000ms)', Math.abs(deltaMs - expected) < 15000,
            'deltaMs=' + deltaMs + ' expected=' + expected)
    }

    // The trip must be auditable -- erp_system has audit: true and setWorkflow(false) is
    // deliberately NOT used on breaker writes.
    const audit = new GlideRecord('sys_audit')
    audit.addQuery('documentkey', a)
    audit.addQuery('fieldname', 'circuit_open_until')
    audit.orderByDesc('sys_created_on')
    audit.setLimit(5)
    audit.query()
    let auditCount = 0
    while (audit.next()) {
        auditCount++
    }
    assert(M, 'T24', 'sys_audit records the circuit_open_until change', auditCount > 0, String(auditCount))

    return okRows && okSet && okFuture
}

/** T25 -- breaker refuses fast, without dialling. */
function t25(a: string): void {
    // Clear first so the refusal row can be identified unambiguously: `started` has one-second
    // granularity and T24's rows land in the same second or two. Clearing does NOT affect what
    // is under test -- the breaker's state lives in circuit_open_until, not in call_log.
    clearCallLog(a)
    const t0 = nowMs()
    // A KNOWN-GOOD endpoint. Its being refused is the POINT: the breaker protects a system that
    // is down, not this particular endpoint.
    const r = fetch(a, 'invoice')
    const elapsed = nowMs() - t0
    const newRows = readCallLog(a)

    log(M, 'T25 ok=' + r.ok + ' errorCode=' + r.errorCode + ' elapsedMs=' + elapsed + ' | ' + summarise(newRows))
    assert(M, 'T25', 'ok=false, errorCode=CIRCUIT_OPEN', r.ok === false && r.errorCode === 'CIRCUIT_OPEN',
        'ok=' + r.ok + ' code=' + String(r.errorCode))
    assert(M, 'T25', 'one row logged with status=circuit_open',
        newRows.length === 1 && newRows[0].status === 'circuit_open',
        newRows.length ? newRows[0].status : 'no row')
    assert(M, 'T25', 'http_code empty', newRows.length === 1 && newRows[0].httpCode === '',
        newRows.length ? newRows[0].httpCode : 'no row')
    assert(M, 'T25', 'refused fast (< 1000ms, no dial)', elapsed < 1000, String(elapsed))
}

/** T26 -- half-open probe succeeds -> breaker CLOSES. The gate's third read. */
function t26(a: string): void {
    clearCallLog(a)
    // Force HALF_OPEN rather than waiting out the 2-minute cooldown.
    forceHalfOpen(a, 60000)

    const r = fetch(a, 'invoice')
    const until = getSystemField(a, 'circuit_open_until')
    const rows = readCallLog(a)
    log(M, 'T26 ok=' + r.ok + ' circuit_open_until="' + until + '" | ' + summarise(rows))

    assert(M, 'T26', 'probe was ATTEMPTED, not refused', r.status === 'success', r.status)
    assert(M, 'T26', 'circuit_open_until CLEARED on success', until === '', '"' + until + '"')
    assert(M, 'T26', 'one row, status=success', rows.length === 1 && rows[0].status === 'success',
        summarise(rows))

    const r2 = fetch(a, 'invoice')
    assert(M, 'T26', 'subsequent call proceeds normally', r2.status === 'success', r2.status)
}

/** T27 -- half-open probe fails -> breaker RE-OPENS. */
function t27(a: string): void {
    clearCallLog(a)
    forceHalfOpen(a, 60000)

    const r = fetch(a, 'balance')
    const until = getSystemField(a, 'circuit_open_until')
    const rows = readCallLog(a)
    log(M, 'T27 ok=' + r.ok + ' attempts=' + r.attempts + ' circuit_open_until="' + until + '" | ' + summarise(rows))

    assert(M, 'T27', 'attempts ran (not refused)', r.attempts >= 1, String(r.attempts))
    assert(M, 'T27', 'rows logged for every attempt', rows.length === r.attempts, rows.length + ' vs ' + r.attempts)
    assert(M, 'T27', 'circuit_open_until re-set to the FUTURE', isFutureDateTime(until), '"' + until + '"')
}

/**
 * T28 -- no payload ever reaches call_log. C1.
 *
 * Reviews EVERY row on the table, not just this case's. Any payload fragment in any row is a C1
 * breach and a hard stop routed to the architect.
 */
function t28(): void {
    const gr = new GlideRecord('x_335329_sn_hr_erp_call_log')
    gr.query()
    let scanned = 0
    let breaches = 0
    const offenders: string[] = []
    while (gr.next()) {
        scanned++
        const err = gr.getValue('error') || ''
        if (looksLikePayload(err)) {
            breaches++
            offenders.push(gr.getUniqueValue() + ':' + err)
        }
    }
    log(M, 'T28 scanned ' + scanned + ' row(s) for payload fragments')
    assert(M, 'T28', 'C1: no call_log.error contains a payload fragment', breaches === 0,
        breaches === 0 ? 'clean across ' + scanned + ' rows' : offenders.join(' | '))
}

/**
 * T32 -- second ERP, zero code.
 *
 * System B is a different erp_system row added as DATA ONLY. The second half repoints it at a
 * different path AT RUNTIME -- no rebuild, no redeploy -- which is the actual claim being tested.
 *
 * NOTE, stated rather than hidden: both fixtures answer from postman-echo.com (D12/OD15). This
 * proves the connector carries no vendor knowledge. It does NOT prove L1-b -- that a genuinely
 * different vendor API is pure data -- and that gate stays open until OD3 supplies a real ERP.
 */
function t32(b: string): void {
    clearBreaker(b)
    clearCallLog(b)

    const r1 = fetch(b, 'invoice')
    log(M, 'T32a system B as shipped ok=' + r1.ok + ' http=' + r1.httpCode + ' | ' + summarise(readCallLog(b)))
    assert(M, 'T32a', 'second ERP works with zero code changes', r1.ok === true, 'ok=' + r1.ok + ' http=' + String(r1.httpCode))

    const prevPath = getMapField(b, 'invoice', 'endpoint_path')
    clearCallLog(b)
    setMapEndpoint(b, 'invoice', '/get?Repointed=yes')

    const r2 = fetch(b, 'invoice')
    log(M, 'T32b repointed ok=' + r2.ok + ' http=' + r2.httpCode + ' | ' + summarise(readCallLog(b)))
    assert(M, 'T32b', 'repointed to another path with NO redeploy', r2.ok === true,
        'ok=' + r2.ok + ' http=' + String(r2.httpCode))

    setMapEndpoint(b, 'invoice', prevPath)
    clearCallLog(b)
}

function getMapField(systemSysId: string, object: string, field: string): string {
    const gr = new GlideRecord('x_335329_sn_hr_erp_object_map')
    gr.addQuery('erp_system', systemSysId)
    gr.addQuery('logical_object', object)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? gr.getValue(field) || '' : ''
}

function setMapEndpoint(systemSysId: string, object: string, path: string): void {
    const gr = new GlideRecord('x_335329_sn_hr_erp_object_map')
    gr.addQuery('erp_system', systemSysId)
    gr.addQuery('logical_object', object)
    gr.setLimit(1)
    gr.query()
    if (gr.next()) {
        gr.setValue('endpoint_path', path)
        gr.update()
    }
}

/**
 * T33 -- no IntegrationHub / Flow Designer dependency at runtime.
 *
 * The sibling proved this by grep. A deployed driver cannot grep source, so it asserts the
 * INSTANCE-side half: this scope declares no sys_hub_action_instance, no sys_hub_flow and no
 * sn_cc connection. The source-side grep is run locally and pasted into the build report.
 */
function t33(): void {
    const tables = ['sys_hub_flow', 'sys_hub_action_instance', 'sys_connection']
    for (let i = 0; i < tables.length; i++) {
        let n = 0
        try {
            const gr = new GlideRecord(tables[i])
            gr.addQuery('sys_scope.scope', 'x_335329_sn_hr_erp')
            gr.query()
            while (gr.next()) {
                n++
            }
        } catch (e) {
            log(M, 'T33 table ' + tables[i] + ' not readable in scope: ' + String(e))
            continue
        }
        assert(M, 'T33', 'no ' + tables[i] + ' record in this scope', n === 0, String(n))
    }
}

export function runDriverB(): void {
    const a = gs.getProperty(SYS_A, '') || ''
    const b = gs.getProperty(SYS_B, '') || ''
    if (!a || !b) {
        gs.error(M + ' system properties not set (a="' + a + '" b="' + b + '")')
        return
    }

    log(M, '===== DRIVER B BEGIN (T24-T28, T32, T33) =====')
    try {
        const tripped = t24(a)
        if (tripped) {
            t25(a)
            t26(a)
            t27(a)
        } else {
            log(M, 'SKIP T25-T27 -- T24 did not trip the breaker, so their preconditions do not hold')
        }
        t32(b)
        t28()
        t33()
    } catch (e) {
        gs.error(M + ' DRIVER B THREW: ' + (e && (e as Error).message ? (e as Error).message : String(e)))
    }
    // Leave the fixtures in a clean state. THIS IS WHY TABLE STATE IS NOT EVIDENCE.
    clearBreaker(a)
    clearBreaker(b)
    log(M, '===== DRIVER B END =====')
}
