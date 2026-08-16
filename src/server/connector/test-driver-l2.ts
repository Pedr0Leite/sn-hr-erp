import { GlideRecord, gs } from '@servicenow/glide'
import { fetch } from './erp-connector.ts'
import { loadMap } from './config-loader.ts'
import { mapRecord, walkPath } from './field-mapper.ts'
import {
    MARK_ADMIN,
    MARK_GATE,
    assert,
    clearBreaker,
    clearCallLog,
    forceHalfOpen,
    getMapSysId,
    getSystemField,
    log,
    readCallLog,
    setSystemFields,
    summarise,
} from './test-driver-util.ts'

/**
 * This layer's OWN cases -- T2-1, T2-2, T2-7, T2-8, T2-11, T2-12, T2-13 -- and THE GATE
 * (T2-19 / T2-20). These are additions to the ported suite, not replacements for it.
 *
 * NOTHING HERE LOGS `result.body`. T2-8 and T2-12 inspect it in memory and log only a boolean
 * or a key list. That restraint is C1, not tidiness.
 */

const M = MARK_ADMIN
const G = MARK_GATE
const SYS_A = 'x_335329_sn_hr_erp.test.system_a'
const SYS_C = 'x_335329_sn_hr_erp.test.system_c'

/** T2-1 -- loadMap() returns field_map child rows, not a JSON column. */
function t2_1(a: string): void {
    const cfg = loadMap(a, 'invoice')
    if (!cfg) {
        assert(M, 'T2-1', 'loadMap resolved the invoice map', false, 'null')
        return
    }
    assert(M, 'T2-1', 'fields.length == 4 (from field_map ROWS, no JSON column)', cfg.fields.length === 4,
        String(cfg.fields.length))

    let shapeOk = cfg.fields.length > 0
    const names: string[] = []
    for (let i = 0; i < cfg.fields.length; i++) {
        const f = cfg.fields[i]
        names.push(f.logicalField + '<-' + f.sourceField + '/' + f.transform + '/z=' + f.zeroIsMeaningful)
        if (!f.logicalField || !f.sourceField || typeof f.transform !== 'string' || typeof f.zeroIsMeaningful !== 'boolean') {
            shapeOk = false
        }
    }
    assert(M, 'T2-1', 'every entry carries logicalField/sourceField/transform/zeroIsMeaningful', shapeOk, names.join(' '))
    assert(M, 'T2-1', 'the six new ObjectMapConfig fields are populated',
        cfg.paginationStyle !== '' && cfg.pageSize > 0,
        'pagination=' + cfg.paginationStyle + ' pageSize=' + cfg.pageSize + ' dateFormat=' + cfg.dateFormat +
            ' deepLink="' + cfg.deepLinkPath + '" source="' + cfg.mappingSource + '" verified=' + cfg.mappingVerified)
}

/** T2-2 -- the FOUR not_configured branches are distinguishable, and NONE of them is a failure. */
function t2_2(a: string): void {
    const seen: string[] = []
    const statuses: string[] = []

    // 1. SYSTEM_INACTIVE
    clearBreaker(a)
    clearCallLog(a)
    setSystemFields(a, { active: false })
    let r = fetch(a, 'invoice')
    seen.push(String(r.errorCode))
    statuses.push(String(r.status))
    setSystemFields(a, { active: true })

    // 2. MAP_MISSING -- machine_downtime deliberately has no object_map row anywhere.
    clearCallLog(a)
    r = fetch(a, 'machine_downtime')
    seen.push(String(r.errorCode))
    statuses.push(String(r.status))

    // 3. MAP_INACTIVE -- fixed_asset ships active:false.
    clearCallLog(a)
    r = fetch(a, 'fixed_asset')
    seen.push(String(r.errorCode))
    statuses.push(String(r.status))

    // 4. MAP_UNMAPPED -- backorder is ACTIVE with ZERO field_map rows. This is L1-D6's other
    //    half: it must NOT come back as `success, rows_returned = 0`.
    clearCallLog(a)
    r = fetch(a, 'backorder')
    seen.push(String(r.errorCode))
    statuses.push(String(r.status))

    log(M, 'T2-2 errorCodes=' + seen.join(',') + ' statuses=' + statuses.join(','))

    const expected = ['SYSTEM_INACTIVE', 'MAP_MISSING', 'MAP_INACTIVE', 'MAP_UNMAPPED']
    let allMatch = true
    for (let i = 0; i < expected.length; i++) {
        if (seen[i] !== expected[i]) {
            allMatch = false
        }
    }
    assert(M, 'T2-2', 'four distinct errorCodes in order ' + expected.join(','), allMatch, seen.join(','))

    let allNotConfigured = true
    for (let i = 0; i < statuses.length; i++) {
        if (statuses[i] !== 'not_configured') {
            allNotConfigured = false
        }
    }
    assert(M, 'T2-2', 'all four are status=not_configured and NONE is `failure`', allNotConfigured, statuses.join(','))
}

/** T2-7 -- 3xx is NOT followed and is a non-retryable failure (I6). */
function t2_7(a: string): void {
    clearBreaker(a)
    clearCallLog(a)
    const r = fetch(a, 'work_order')
    const rows = readCallLog(a)
    log(M, 'T2-7 ok=' + r.ok + ' http=' + r.httpCode + ' attempts=' + r.attempts + ' | ' + summarise(rows))

    assert(M, 'T2-7', 'exactly ONE attempt (3xx is non-retryable)', r.attempts === 1, String(r.attempts))
    assert(M, 'T2-7', 'http_code is a 3xx, i.e. the redirect was NOT followed',
        r.httpCode !== null && r.httpCode >= 300 && r.httpCode < 400, String(r.httpCode))
    assert(M, 'T2-7', 'ok=false', r.ok === false, String(r.ok))
    assert(M, 'T2-7', 'one call_log row', rows.length === 1, String(rows.length))
}

/** T2-8 -- disableForcedVariableSubstitution: a literal ${x} survives to the wire (I7). */
function t2_8(a: string): void {
    clearBreaker(a)
    clearCallLog(a)
    const r = fetch(a, 'maintenance_schedule')
    // The body is INSPECTED, never logged. postman-echo echoes the query it received, so a
    // surviving `${x}` proves substitution was disabled end to end.
    const survived = r.body !== null && r.body.indexOf('${x}') !== -1
    log(M, 'T2-8 status=' + r.status + ' http=' + r.httpCode + ' (body inspected in memory, never logged)')
    assert(M, 'T2-8', 'literal ${x} reached the endpoint unaltered', survived, 'substitutionDisabled=' + survived)
}

/** T2-11 -- mapping resolution is logged per call (§4.3). */
function t2_11(a: string): void {
    clearBreaker(a)
    clearCallLog(a)
    const r = fetch(a, 'invoice')
    const rows = readCallLog(a)
    const mapSysId = getMapSysId(a, 'invoice')

    log(M, 'T2-11 resolvedMapping=' + JSON.stringify(r.resolvedMapping) + ' | ' + summarise(rows))

    assert(M, 'T2-11', 'call_log.object_map is populated with the resolved map',
        rows.length === 1 && rows[0].objectMap === mapSysId, rows.length ? rows[0].objectMap : 'no row')
    assert(M, 'T2-11', 'resolvedMapping.fieldCount matches the field_map row count',
        r.resolvedMapping.fieldCount === countFieldRows(mapSysId),
        r.resolvedMapping.fieldCount + ' vs ' + countFieldRows(mapSysId))
    assert(M, 'T2-11', "origin is 'object_map' -- there is NO call-time template fallback (L2-D2)",
        r.resolvedMapping.origin === 'object_map', r.resolvedMapping.origin)
    assert(M, 'T2-11', 'mappingSource and mappingVerified are present on the result',
        typeof r.resolvedMapping.mappingSource === 'string' && typeof r.resolvedMapping.mappingVerified === 'boolean',
        'source="' + r.resolvedMapping.mappingSource + '" verified=' + r.resolvedMapping.mappingVerified)
    assert(M, 'T2-11', 'call_log.mapping_verified was written', rows.length === 1 && rows[0].mappingVerified !== '',
        rows.length ? rows[0].mappingVerified : 'no row')
}

function countFieldRows(objectMapSysId: string): number {
    const gr = new GlideRecord('x_335329_sn_hr_erp_field_map')
    gr.addQuery('object_map', objectMapSysId)
    gr.query()
    let n = 0
    while (gr.next()) {
        n++
    }
    return n
}

/**
 * T2-12 -- the mapper drops unknown source fields and keeps a partial record.
 *
 * The invoice fixture echoes THREE mapped source fields plus FOUR unmapped ones, and its
 * field_map names a FOURTH mapped field that the response does not carry. Expected:
 * 3 logical fields present, 4 ignored silently, the absent one ABSENT -- not zero -- and the
 * record still produced.
 */
function t2_12(a: string): void {
    clearBreaker(a)
    clearCallLog(a)
    const r = fetch(a, 'invoice')
    const cfg = loadMap(a, 'invoice')
    if (!r.body || !cfg) {
        assert(M, 'T2-12', 'fixture returned a body and a map', false, 'body=' + (r.body ? 'yes' : 'no') + ' map=' + (cfg ? 'yes' : 'no'))
        return
    }

    let parsed: any = null
    try {
        parsed = JSON.parse(r.body)
    } catch (e) {
        assert(M, 'T2-12', 'response parsed', false, 'parse failed')
        return
    }

    const record = walkPath(parsed, cfg.responseRoot)
    const mapped = mapRecord(record, 'invoice', cfg.fields, cfg.dateFormat)
    const keys = Object.keys(mapped).sort()
    // KEYS ONLY. The values are ERP payload and are never logged (C1).
    log(M, 'T2-12 mapped logical fields = [' + keys.join(',') + '] (values withheld, C1)')

    assert(M, 'T2-12', 'exactly the 3 present mapped fields are produced', keys.length === 3, keys.join(','))
    assert(M, 'T2-12', 'the mapped-but-absent field is ABSENT, not zero',
        Object.prototype.hasOwnProperty.call(mapped, 'due_on') === false, 'due_on present=' + Object.prototype.hasOwnProperty.call(mapped, 'due_on'))

    // The four unmapped source fields must not appear under any name.
    let leaked = false
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('Ignored') === 0) {
            leaked = true
        }
    }
    assert(M, 'T2-12', 'unmapped source fields are ignored silently', !leaked, keys.join(','))

    // A vendor field name must never become a logical field name.
    assert(M, 'T2-12', 'no vendor field name appears as a logical field',
        keys.indexOf('InvoiceNo') === -1 && keys.indexOf('GrossAmount') === -1, keys.join(','))
}

/**
 * T2-13 -- `not_configured` MUST NOT trip the breaker. §4.2, R2-1.
 *
 * THE HIGHEST-VALUE SINGLE TEST AT L2. It exists for ONE LINE in circuit-breaker.recordFailure.
 * If that line reverts to the sibling's `!= 'circuit_open'`, an unmapped object trips the
 * breaker on a perfectly healthy ERP and takes the other 13 objects down with it -- silently.
 */
function t2_13(a: string): void {
    clearBreaker(a)
    clearCallLog(a)

    const before = getSystemField(a, 'circuit_open_until')

    // 8 consecutive MAP_MISSING calls -- more than CB_FAILURE_THRESHOLD (6).
    for (let i = 0; i < 8; i++) {
        fetch(a, 'machine_downtime')
    }

    const after = getSystemField(a, 'circuit_open_until')
    log(M, 'T2-13a 8x MAP_MISSING: before="' + before + '" after="' + after + '"')
    assert(M, 'T2-13a', 'circuit_open_until empty BEFORE', before === '', '"' + before + '"')
    assert(M, 'T2-13a', 'circuit_open_until STILL empty after 8 not_configured calls', after === '', '"' + after + '"')

    // T2-13b -- the sharper half, and the one that actually reads the `NOT IN` clause.
    //
    // Leave the 8 not_configured rows in place, then make ONE genuinely failed call (3 attempt
    // rows). The table now holds 11 non-success rows, but only 3 are evidence about the ERP.
    // With the sibling's `!= 'circuit_open'` the window would be all-non-success and the breaker
    // WOULD trip. It must not.
    const r = fetch(a, 'balance')
    const after2 = getSystemField(a, 'circuit_open_until')
    const rows = readCallLog(a)
    log(M, 'T2-13b after 8 not_configured + 1 exhausted call: circuit_open_until="' + after2 + '" | ' + summarise(rows))
    assert(M, 'T2-13b', '11 non-success rows but only 3 are ERP evidence -> breaker STAYS CLOSED',
        after2 === '', '"' + after2 + '" attempts=' + r.attempts)

    clearBreaker(a)
    clearCallLog(a)
}

/**
 * THE GATE -- T2-19 and T2-20. docs/l2-connector-design.md §8.
 *
 * "One successful live call AND one forced-failure call, both logged, breaker demonstrably
 * opening." All three parts, with the three circuit_open_until reads spelled out in the log so
 * they can be quoted verbatim into the build report.
 */
function gate(a: string, c: string): void {
    // ---- Step 1: T2-19, a successful live call ------------------------------------------
    clearBreaker(a)
    clearCallLog(a)
    const ok = fetch(a, 'invoice')
    const okRows = readCallLog(a)
    log(G, 'GATE-1 success: ok=' + ok.ok + ' http=' + ok.httpCode + ' durationMs=' + ok.durationMs + ' | ' + summarise(okRows))
    assert(G, 'T2-19', 'GATE successful live call: call_log row status=success with a real http_code and duration_ms',
        okRows.length === 1 && okRows[0].status === 'success' && okRows[0].httpCode === '200' && okRows[0].durationMs > 0,
        okRows.length ? okRows[0].status + '/' + okRows[0].httpCode + '/' + okRows[0].durationMs + 'ms' : 'no row')

    // ---- Step 2: T2-20, forced failure on the DELIBERATELY BROKEN system, breaker OPENS ---
    // BROKEN-FIXTURE points at erp-invalid.invalid. It is broken ON PURPOSE and must not be
    // "fixed": it is the only fixture that proves a genuinely unreachable host.
    clearBreaker(c)
    clearCallLog(c)
    const cRead1 = getSystemField(c, 'circuit_open_until')
    log(G, 'GATE-2 READ 1 (System C, before): circuit_open_until="' + cRead1 + '"')
    assert(G, 'T2-20', 'READ 1 -- System C circuit_open_until EMPTY before', cRead1 === '', '"' + cRead1 + '"')

    fetch(c, 'invoice')
    fetch(c, 'invoice')
    const cRows = readCallLog(c)
    const cRead2 = getSystemField(c, 'circuit_open_until')
    log(G, 'GATE-2 READ 2 (System C, after 6 attempts): circuit_open_until="' + cRead2 + '" | ' + summarise(cRows))
    assert(G, 'T2-20', 'READ 2 -- System C circuit_open_until is a FUTURE datetime after 6 non-success attempts',
        cRead2 !== '', '"' + cRead2 + '"')
    assert(G, 'T2-20', 'System C logged 6 attempt rows, none of them success', cRows.length === 6 && noSuccess(cRows),
        summarise(cRows))

    // ---- Step 3: the CLOSE path, which the sibling initially missed ----------------------
    // System C can never close: nothing at erp-invalid.invalid will ever answer, and repointing
    // it would be exactly the fixture edit R2-4 forbids. The close path is therefore
    // demonstrated on System A, which is tripped by a REAL forced failure (/status/503) first.
    // Stated here rather than glossed over.
    clearBreaker(a)
    clearCallLog(a)
    const aRead1 = getSystemField(a, 'circuit_open_until')
    log(G, 'GATE-3 READ 1 (System A, before): circuit_open_until="' + aRead1 + '"')

    fetch(a, 'balance')
    fetch(a, 'balance')
    const aRead2 = getSystemField(a, 'circuit_open_until')
    log(G, 'GATE-3 READ 2 (System A, after 6x HTTP 503): circuit_open_until="' + aRead2 + '"')

    // Force the cooldown to have elapsed rather than holding a transaction open for two
    // minutes. circuit_open_until in the PAST is HALF_OPEN -- three states, one column.
    forceHalfOpen(a, 60000)
    const probe = fetch(a, 'invoice')
    const aRead3 = getSystemField(a, 'circuit_open_until')
    log(G, 'GATE-3 READ 3 (System A, after one successful half-open probe): circuit_open_until="' + aRead3 + '" probeStatus=' + probe.status)

    assert(G, 'T2-20', 'READ 1 -- System A empty', aRead1 === '', '"' + aRead1 + '"')
    assert(G, 'T2-20', 'READ 2 -- System A future datetime (breaker OPEN)', aRead2 !== '', '"' + aRead2 + '"')
    assert(G, 'T2-20', 'READ 3 -- System A empty again (breaker CLOSED by a successful probe)',
        aRead3 === '' && probe.status === 'success', '"' + aRead3 + '" probe=' + probe.status)

    clearBreaker(a)
    clearBreaker(c)
    log(G, 'GATE sequence complete. TABLE STATE AFTER THIS POINT IS TEARDOWN STATE, NOT EVIDENCE.')
}

function noSuccess(rows: { status: string }[]): boolean {
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].status === 'success') {
            return false
        }
    }
    return true
}

/**
 * THE GATE, AND NOTHING ELSE.
 *
 * Testing breadth is deferred to a dedicated pass; the gate is not. This entry point exists so
 * the four pieces of gate evidence can be produced without running the whole ported suite.
 */
export function runGateOnly(): void {
    const a = gs.getProperty(SYS_A, '') || ''
    const c = gs.getProperty(SYS_C, '') || ''
    if (!a || !c) {
        gs.error(G + ' system properties not set (a="' + a + '" c="' + c + '")')
        return
    }
    log(G, '===== L2 GATE BEGIN =====')
    try {
        gate(a, c)
    } catch (e) {
        gs.error(G + ' GATE THREW: ' + (e && (e as Error).message ? (e as Error).message : String(e)))
    }
    log(G, '===== L2 GATE END =====')
}

export function runDriverL2(): void {
    const a = gs.getProperty(SYS_A, '') || ''
    const c = gs.getProperty(SYS_C, '') || ''
    if (!a || !c) {
        gs.error(M + ' system properties not set (a="' + a + '" c="' + c + '")')
        return
    }

    log(M, '===== DRIVER L2 BEGIN (T2-1, T2-2, T2-7, T2-8, T2-11, T2-12, T2-13, GATE) =====')
    try {
        t2_1(a)
        t2_2(a)
        t2_7(a)
        t2_8(a)
        t2_11(a)
        t2_12(a)
        t2_13(a)
        gate(a, c)
    } catch (e) {
        gs.error(M + ' DRIVER L2 THREW: ' + (e && (e as Error).message ? (e as Error).message : String(e)))
    }
    log(M, '===== DRIVER L2 END =====')
}
