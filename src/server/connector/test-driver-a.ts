import { GlideRecord, gs } from '@servicenow/glide'
import { fetch } from './erp-connector.ts'
import { loadMap, loadSystem } from './config-loader.ts'
import {
    MARK_ADMIN,
    assert,
    clearBreaker,
    clearCallLog,
    getSystemField,
    log,
    looksLikePayload,
    readCallLog,
    review,
    setMapFields,
    setSystemFields,
    summarise,
} from './test-driver-util.ts'

/**
 * The ported test plan, cases T15-T23 and the review-only T29.
 *
 * THE 19 PORTED CASES KEEP THEIR SIBLING IDENTIFIERS (T15..T33) so that a deleted case is
 * visible as a gap in a numbered sequence (R2-2). The design's §9 says "21 ported cases" and
 * then names the range T15-T33, which is 19 identifiers -- the sibling's own build report
 * confirms 19, T29 review-only and T33 a grep. That arithmetic is reconciled in
 * docs/l2-build-report.md, NOT by dropping or inventing cases.
 *
 * LOGICAL OBJECTS DIFFER FROM THE SIBLING'S and that is forced, not chosen: OD9 dropped
 * `credit_status` and `receipt` from this app's 16 objects. `gl_summary` carries T16's
 * rows_returned fixture and `vendor_invoice` carries T17's 404. The assertions are unchanged.
 *
 * Each case resets the breaker and clears this system's call_log first, so a failure in one
 * case cannot cascade into the next.
 */

const M = MARK_ADMIN
const SYS_A = 'x_335329_sn_hr_erp.test.system_a'
const AUTH_PROFILE_NAME = 'HRERP L2 Test Credentials'

function reset(sysId: string): void {
    clearBreaker(sysId)
    clearCallLog(sysId)
}

/** Resolve the demo basic-auth profile by name. Its sys_id is generated, so it is not hardcoded. */
function authProfileSysId(): string {
    const gr = new GlideRecord('sys_auth_profile_basic')
    gr.addQuery('name', AUTH_PROFILE_NAME)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? gr.getUniqueValue() : ''
}

/** T15 -- successful live call, and basic-auth resolution. GATE (the success half). */
function t15(a: string): void {
    reset(a)
    const r = fetch(a, 'invoice')
    const rows = readCallLog(a)
    log(M, 'T15 result ok=' + r.ok + ' http=' + r.httpCode + ' attempts=' + r.attempts + ' | ' + summarise(rows))

    assert(M, 'T15', 'ok=true and httpCode=200', r.ok === true && r.httpCode === 200, 'ok=' + r.ok + ' http=' + r.httpCode)
    assert(M, 'T15', 'exactly one call_log row', rows.length === 1, String(rows.length))
    if (rows.length === 1) {
        const row = rows[0]
        assert(M, 'T15', 'status=success', row.status === 'success', row.status)
        assert(M, 'T15', 'http_code=200', row.httpCode === '200', row.httpCode)
        assert(M, 'T15', 'duration_ms > 0', row.durationMs > 0, String(row.durationMs))
        assert(M, 'T15', 'error empty', row.error === '', '"' + row.error + '"')
        assert(M, 'T15', 'cache_hit=false', row.cacheHit === 'false' || row.cacheHit === '0', row.cacheHit)
    }

    // Basic auth resolves via the sys_auth_profile_basic REFERENCE, not hardcoded credentials.
    // A 401 here is a configuration failure, not a network problem.
    const profile = authProfileSysId()
    if (!profile) {
        log(M, 'FAIL T15 | demo basic auth profile "' + AUTH_PROFILE_NAME + '" not found -- auth resolution NOT tested')
        return
    }
    const prevProfile = getSystemField(a, 'auth_profile_basic')
    setSystemFields(a, { auth_profile_basic: profile })
    reset(a)
    const rAuth = fetch(a, 'requisition')
    log(M, 'T15auth /basic-auth ok=' + rAuth.ok + ' http=' + rAuth.httpCode + ' | ' + summarise(readCallLog(a)))
    assert(M, 'T15', 'basic auth profile resolved (200, not 401)', rAuth.httpCode === 200, String(rAuth.httpCode))
    setSystemFields(a, { auth_profile_basic: prevProfile })
}

/** T16 -- rows_returned, and the C1 no-fragment rule. */
function t16(a: string): void {
    // (a) response_root set -> expect 2. postman-echo's /get?a=1&a=2 echoes args.a as a
    // deterministic 2-element array.
    reset(a)
    setMapFields(a, 'gl_summary', { response_root: 'args.a' })
    let r = fetch(a, 'gl_summary')
    let rows = readCallLog(a)
    log(M, 'T16a ' + summarise(rows))
    assert(M, 'T16a', 'status=success', r.status === 'success', r.status)
    assert(M, 'T16a', 'rows_returned=2', rows.length === 1 && rows[0].rowsReturned === '2', rows.length ? rows[0].rowsReturned : 'no row')

    // (b) response_root blank -> success, rows empty, no error
    reset(a)
    setMapFields(a, 'gl_summary', { response_root: '' })
    r = fetch(a, 'gl_summary')
    rows = readCallLog(a)
    log(M, 'T16b ' + summarise(rows))
    assert(M, 'T16b', 'success, rows_returned empty, error empty',
        r.status === 'success' && rows.length === 1 && rows[0].rowsReturned === '' && rows[0].error === '',
        rows.length ? 'rows=' + rows[0].rowsReturned + ' err="' + rows[0].error + '"' : 'no row')

    // (c) bad path -> success, rows empty, RESPONSE_UNPARSEABLE, and NO body fragment in error
    reset(a)
    setMapFields(a, 'gl_summary', { response_root: 'not.a.path' })
    r = fetch(a, 'gl_summary')
    rows = readCallLog(a)
    log(M, 'T16c ' + summarise(rows))
    assert(M, 'T16c', 'status=success', r.status === 'success', r.status)
    assert(M, 'T16c', 'errorCode=RESPONSE_UNPARSEABLE', r.errorCode === 'RESPONSE_UNPARSEABLE', String(r.errorCode))
    if (rows.length === 1) {
        assert(M, 'T16c', 'rows_returned empty', rows[0].rowsReturned === '', rows[0].rowsReturned)
        // A parse error message quotes the offending fragment, and that fragment is a payload.
        // The error must be a bare code.
        assert(M, 'T16c', 'C1: no body fragment in error', !looksLikePayload(rows[0].error), '"' + rows[0].error + '"')
    }

    setMapFields(a, 'gl_summary', { response_root: 'args.a' })
}

/** T17 -- non-retryable 4xx. A status code beats the transport message (I10). */
function t17(a: string): void {
    reset(a)
    const r = fetch(a, 'vendor_invoice')
    const rows = readCallLog(a)
    log(M, 'T17 ' + summarise(rows))
    // More than one row here means 4xx is being retried -- the regression I10 exists for.
    assert(M, 'T17', 'exactly ONE row (4xx not retried)', rows.length === 1, String(rows.length))
    assert(M, 'T17', 'status=failure http=404', rows.length === 1 && rows[0].status === 'failure' && rows[0].httpCode === '404',
        rows.length ? rows[0].status + '/' + rows[0].httpCode : 'no row')
    assert(M, 'T17', 'error is a status line HTTP_404', rows.length === 1 && rows[0].error.indexOf('HTTP_404') === 0,
        rows.length ? rows[0].error : 'no row')
    assert(M, 'T17', 'attempts=1', r.attempts === 1, String(r.attempts))
}

/** T18 -- mutual auth refused before dialling. */
function t18(a: string): void {
    reset(a)
    const prevType = getSystemField(a, 'auth_type')
    const prevBasic = getSystemField(a, 'auth_profile_basic')

    // L1's validation rule requires exactly the profile matching auth_type, so the basic
    // profile must be cleared for this row to save as `mutual`.
    setSystemFields(a, { auth_type: 'mutual', auth_profile_mutual: '0123456789abcdef0123456789abcdef', auth_profile_basic: '' })

    const r = fetch(a, 'invoice')
    const rows = readCallLog(a)
    log(M, 'T18 ok=' + r.ok + ' durationMs=' + r.durationMs + ' | ' + summarise(rows))

    assert(M, 'T18', 'one row', rows.length === 1, String(rows.length))
    // §4.2 row 6: AUTH_UNSUPPORTED stays a `failure`, NOT not_configured -- the row is
    // configured, the platform simply cannot honour it.
    assert(M, 'T18', 'status=failure (not not_configured)', rows.length === 1 && rows[0].status === 'failure', rows.length ? rows[0].status : 'no row')
    assert(M, 'T18', 'error starts AUTH_UNSUPPORTED', rows.length === 1 && rows[0].error.indexOf('AUTH_UNSUPPORTED') === 0,
        rows.length ? rows[0].error : 'no row')
    assert(M, 'T18', 'http_code empty', rows.length === 1 && rows[0].httpCode === '', rows.length ? rows[0].httpCode : 'no row')
    // Near-zero elapsed is the proof that NO outbound request was made.
    assert(M, 'T18', 'no outbound call made (durationMs < 250)', r.durationMs < 250, String(r.durationMs))

    setSystemFields(a, { auth_type: prevType, auth_profile_mutual: '', auth_profile_basic: prevBasic })
}

/** T19 -- inactive system and inactive map. Both are `not_configured` in this app (L2-D1). */
function t19(a: string): void {
    // (a) inactive SYSTEM
    reset(a)
    setSystemFields(a, { active: false })
    let r = fetch(a, 'invoice')
    let rows = readCallLog(a)
    log(M, 'T19a ' + summarise(rows))
    // If this call proceeds normally, the Boolean gotcha is back -- the exact failure signature
    // the sibling shipped (branch silently dead, everything looks fine).
    assert(M, 'T19a', 'refused with SYSTEM_INACTIVE',
        rows.length === 1 && rows[0].error.indexOf('SYSTEM_INACTIVE') === 0,
        rows.length ? rows[0].error : 'no row')
    assert(M, 'T19a', 'status=not_configured (L2-D1)', rows.length === 1 && rows[0].status === 'not_configured',
        rows.length ? rows[0].status : 'no row')
    assert(M, 'T19a', 'no HTTP call made', r.httpCode === null, String(r.httpCode))
    setSystemFields(a, { active: true })

    // (b) inactive MAP -- fixed_asset ships active:false
    reset(a)
    r = fetch(a, 'fixed_asset')
    rows = readCallLog(a)
    log(M, 'T19b ' + summarise(rows))
    assert(M, 'T19b', 'refused with MAP_INACTIVE',
        rows.length === 1 && rows[0].error.indexOf('MAP_INACTIVE') === 0,
        rows.length ? rows[0].error : 'no row')
    assert(M, 'T19b', 'status=not_configured (L2-D1)', rows.length === 1 && rows[0].status === 'not_configured',
        rows.length ? rows[0].status : 'no row')
    assert(M, 'T19b', 'no HTTP call made', r.httpCode === null, String(r.httpCode))
}

/**
 * T20 -- Boolean read audit.
 *
 * A live behavioural test, not a code read -- a code read is what let the sibling's defect
 * through. Records the raw stored representation AND the loader's interpretation, both ways.
 */
function t20(a: string): void {
    reset(a)
    const pairs = [
        { field: 'active', prop: 'active' },
        { field: 'use_mid_server', prop: 'useMidServer' },
    ]

    for (let i = 0; i < pairs.length; i++) {
        const f = pairs[i].field
        const prev = getSystemField(a, f)
        for (let v = 0; v < 2; v++) {
            const target = v === 1
            // use_mid_server = true is rejected by L1's validation rule when no MID server is
            // selected, and this instance has zero ecc_agent rows. Bypass the rule for this
            // observation only -- we are testing the READ path, not config validation.
            const patch: { [k: string]: any } = {}
            patch[f] = target
            setSystemFields(a, patch, f === 'use_mid_server')
            const raw = getSystemField(a, f)
            const cfg = loadSystem(a).config
            const interpreted = cfg ? (cfg as any)[pairs[i].prop] : null
            assert(M, 'T20', f + ' set ' + target + ' -> isTrue agrees', interpreted === target,
                'raw=' + JSON.stringify(raw) + ' interpreted=' + interpreted)
        }
        const restore: { [k: string]: any } = {}
        restore[f] = prev
        setSystemFields(a, restore, f === 'use_mid_server')
    }

    // object_map.active, both ways, on a map that is normally active.
    for (let v = 0; v < 2; v++) {
        const target = v === 1
        setMapFields(a, 'invoice', { active: target })
        reset(a)
        const r = fetch(a, 'invoice')
        const refused = r.errorCode === 'MAP_INACTIVE'
        assert(M, 'T20', 'object_map.active=' + target + ' -> refused=' + !target, refused === !target,
            'errorCode=' + String(r.errorCode))
    }
    setMapFields(a, 'invoice', { active: true })

    // field_map.zero_is_meaningful -- L1 §4.4, and the column R2-5 exists for. Read through
    // the loader, both ways, so a `=== 'true'` regression is visible behaviourally.
    const fm = new GlideRecord('x_335329_sn_hr_erp_field_map')
    fm.addQuery('logical_field', 'amount')
    fm.setLimit(1)
    fm.query()
    if (fm.next()) {
        const fmId = fm.getUniqueValue()
        const prevZ = fm.getValue('zero_is_meaningful')
        for (let v = 0; v < 2; v++) {
            const target = v === 1
            const w = new GlideRecord('x_335329_sn_hr_erp_field_map')
            if (w.get(fmId)) {
                w.setValue('zero_is_meaningful', target)
                w.update()
            }
            const interpreted = readZeroIsMeaningful(fmId)
            assert(M, 'T20', 'field_map.zero_is_meaningful=' + target + ' round-trips through loadMap()',
                interpreted === target, 'interpreted=' + interpreted)
        }
        const w2 = new GlideRecord('x_335329_sn_hr_erp_field_map')
        if (w2.get(fmId)) {
            w2.setValue('zero_is_meaningful', prevZ)
            w2.update()
        }
    } else {
        log(M, 'FAIL T20 | no field_map row with logical_field=amount -- zero_is_meaningful NOT tested')
    }
}

/**
 * Read one field_map row's zeroIsMeaningful THROUGH loadMap() -- the production read path --
 * rather than by re-reading the column. Reading it a second, different way is exactly how a
 * Boolean bug hides from its own test.
 */
function readZeroIsMeaningful(fieldMapSysId: string): boolean | null {
    const gr = new GlideRecord('x_335329_sn_hr_erp_field_map')
    if (!gr.get(fieldMapSysId)) {
        return null
    }
    const logicalField = gr.getValue('logical_field') || ''

    const parent = new GlideRecord('x_335329_sn_hr_erp_object_map')
    if (!parent.get(gr.getValue('object_map') || '')) {
        return null
    }

    const cfg = loadMap(parent.getValue('erp_system') || '', parent.getValue('logical_object') || '')
    if (!cfg) {
        return null
    }
    for (let i = 0; i < cfg.fields.length; i++) {
        if (cfg.fields[i].logicalField === logicalField) {
            return cfg.fields[i].zeroIsMeaningful
        }
    }
    return null
}

/** T21 -- retry on a retryable 5xx. The forced-failure half of the gate, on a healthy host. */
function t21(a: string): void {
    reset(a)
    const r = fetch(a, 'balance')
    const rows = readCallLog(a)
    log(M, 'T21 ok=' + r.ok + ' attempts=' + r.attempts + ' | ' + summarise(rows))

    assert(M, 'T21', 'exactly 3 rows (1 + max_retries 2)', rows.length === 3, String(rows.length))
    let all503 = rows.length === 3
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].status !== 'failure' || rows[i].httpCode !== '503') {
            all503 = false
        }
    }
    assert(M, 'T21', 'every row status=failure http=503', all503, summarise(rows))
    assert(M, 'T21', 'ok=false', r.ok === false, String(r.ok))
    // 3 < threshold 6, so the breaker must NOT be open yet.
    assert(M, 'T21', 'breaker NOT open (3 < threshold 6)', getSystemField(a, 'circuit_open_until') === '',
        '"' + getSystemField(a, 'circuit_open_until') + '"')
}

/** T22 -- timeout classified and retried. */
function t22(a: string): void {
    // The shipped fixture timeout_ms is 30000, which /delay/10 would satisfy. Lower it for this
    // case only and restore afterwards -- the same runtime-mutation pattern T18/T20/T23 use.
    const prevTimeout = getSystemField(a, 'timeout_ms')
    setSystemFields(a, { timeout_ms: 2000 })

    reset(a)
    const r = fetch(a, 'purchase_order')
    const rows = readCallLog(a)
    log(M, 'T22 ok=' + r.ok + ' attempts=' + r.attempts + ' errorMessage=' + r.errorMessage + ' | ' + summarise(rows))

    assert(M, 'T22', '3 rows', rows.length === 3, String(rows.length))
    let allTimeout = rows.length === 3
    let durationsOk = rows.length === 3
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].status !== 'timeout') {
            allTimeout = false
        }
        if (rows[i].httpCode !== '') {
            allTimeout = false
        }
        if (rows[i].durationMs < 1500 || rows[i].durationMs > 8000) {
            durationsOk = false
        }
    }
    assert(M, 'T22', 'all rows status=timeout, http_code empty', allTimeout, summarise(rows))
    assert(M, 'T22', 'per-attempt duration ~2000ms (timeout_ms honoured)', durationsOk, summarise(rows))
    // Record WHICH failure path fired. The design handles both because the platform's behaviour
    // is not reliably documented (I9).
    log(M, 'T22 FAILURE-PATH observed transport message: ' + String(r.errorMessage))

    setSystemFields(a, { timeout_ms: prevTimeout })
}

/**
 * T23 -- backoff is real, jittered and capped.
 *
 * backoff_ms is raised to 4000 because sub-second jitter is invisible at call_log's one-second
 * `started` granularity. Gaps are measured between consecutive attempt rows of one call.
 */
function t23(a: string): void {
    const prev = getSystemField(a, 'backoff_ms')
    setSystemFields(a, { backoff_ms: 4000 })

    const runs: number[][] = []
    for (let run = 0; run < 3; run++) {
        reset(a)
        fetch(a, 'balance')
        const rows = readCallLog(a)
        const gaps: number[] = []
        for (let i = 1; i < rows.length; i++) {
            gaps.push(rows[i].startedMs - rows[i - 1].startedMs - rows[i - 1].durationMs)
        }
        runs.push(gaps)
        log(M, 'T23 run' + (run + 1) + ' gaps(ms)=' + gaps.join(',') + ' | ' + summarise(rows))
    }

    let anyNonZero = false
    let allWithinCap = true
    for (let i = 0; i < runs.length; i++) {
        for (let j = 0; j < runs[i].length; j++) {
            if (runs[i][j] > 200) {
                anyNonZero = true
            }
            // MAX_BACKOFF_SLEEP_MS is 5000; allow slack for measurement noise.
            if (runs[i][j] > 6000) {
                allWithinCap = false
            }
        }
    }
    // Zero gaps would mean the sleep primitive is a no-op.
    assert(M, 'T23', 'backoff delays are observable (non-zero)', anyNonZero, JSON.stringify(runs))
    assert(M, 'T23', 'no gap exceeds MAX_BACKOFF_SLEEP_MS (5s)', allWithinCap, JSON.stringify(runs))
    // Identical gaps across runs would mean jitter is not applied.
    const differ = JSON.stringify(runs[0]) !== JSON.stringify(runs[1]) || JSON.stringify(runs[1]) !== JSON.stringify(runs[2])
    assert(M, 'T23', 'gaps differ between runs (jitter applied)', differ, JSON.stringify(runs))

    setSystemFields(a, { backoff_ms: prev })
    reset(a)
}

/**
 * T29 -- MID Server routing by NAME (I8). REVIEWED, NEVER PASS.
 *
 * This instance has zero `ecc_agent` records, so the branch cannot be executed. The review
 * records the two facts that make it correct, and the count that makes it untestable.
 */
function t29(a: string): void {
    const eccCount = countRows('ecc_agent')
    review(M, 'T29', 'MID routing cannot be live-tested', 'ecc_agent row count = ' + eccCount)

    // config-loader resolves the NAME, not the sys_id. Demonstrate it on the real row.
    const cfg = loadSystem(a).config
    const midName = cfg ? cfg.midServerName : '(no config)'
    const midRaw = getSystemField(a, 'mid_server')
    review(M, 'T29', 'config-loader reads getDisplayValue(mid_server), not the reference sys_id',
        'raw="' + midRaw + '" resolvedName="' + String(midName) + '"')
    review(M, 'T29', 'rest-client guards setMIDServer behind useMidServer && midServerName',
        'useMidServer=' + (cfg ? cfg.useMidServer : 'n/a') + ' -> no MID branch executes')
    log(M, 'T29 NOT A PASS. A sys_id passed to setMIDServer silently never routes; that failure mode is unproven on this instance.')
}

function countRows(table: string): number {
    const gr = new GlideRecord(table)
    gr.query()
    let n = 0
    while (gr.next()) {
        n++
    }
    return n
}

export function runDriverA(): void {
    const a = gs.getProperty(SYS_A, '') || ''
    if (!a) {
        gs.error(M + ' property ' + SYS_A + ' not set')
        return
    }
    log(M, '===== DRIVER A BEGIN (T15-T23, T29) =====')
    try {
        t15(a)
        t16(a)
        t17(a)
        t18(a)
        t19(a)
        t20(a)
        t21(a)
        t22(a)
        t23(a)
        t29(a)
    } catch (e) {
        gs.error(M + ' DRIVER A THREW: ' + (e && (e as Error).message ? (e as Error).message : String(e)))
    }
    log(M, '===== DRIVER A END =====')
}
