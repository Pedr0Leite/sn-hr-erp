import { computeDelayMs, sleepMs } from './backoff.ts'
import { composeError, writeAttempt } from './call-log.ts'
import { readState, recordFailure, recordSuccess, resetCircuit, takeProbeLease } from './circuit-breaker.ts'
import { classify } from './classify.ts'
import { CONFIG_UNREADABLE, loadMap, loadSystem } from './config-loader.ts'
import { CONNECTOR_CONSTANTS } from './constants.ts'
import { sendOnce } from './rest-client.ts'
import { nowMs } from './util.ts'
import type {
    CallStatus,
    ConnectorResult,
    FetchParams,
    ObjectMapConfig,
    ResolvedMapping,
    SystemConfig,
} from './types.ts'

/**
 * The orchestrator: pre-flight table, retry loop, then recordFailure.
 *
 * PORTED from the sibling app. Changes: §4.2 (the `not_configured` outcome and its four
 * pre-flight branches) and §4.3 (`resolvedMapping` on the result, written to `call_log`).
 *
 * THIS FILE HOLDS THE SINGLE `getBody()` CALL SITE IN THE ENTIRE LAYER (I1). Its value is
 * assigned to ConnectorResult.body, returned to the caller IN MEMORY, and never persisted by
 * L2. L3 inherits the obligation not to store it. Build-order step L2-12 asserts the call-site
 * count is exactly 1 — adding a second one anywhere is a C1 risk and a hard stop.
 *
 * NO WRITE METHOD EXISTS. fetch() is read-only by construction, which is why `read_only` is not
 * consulted.
 *
 * RULE FOR WHOEVER BUILDS WRITE-BACK (L7, deferred by D3): the first method that can mutate an
 * ERP must check `system.active && !system.readOnly` before dialling, and must log its refusal.
 * This sentence is the design's only defence against that being forgotten.
 */

/** §4.3 — what a call resolved when it never got as far as resolving anything. */
const NO_MAPPING: ResolvedMapping = {
    objectMapSysId: '',
    fieldCount: 0,
    origin: 'none',
    mappingSource: '',
    mappingVerified: false,
}

function mappingOf(map: ObjectMapConfig | null): ResolvedMapping {
    if (!map) {
        return {
            objectMapSysId: '',
            fieldCount: 0,
            origin: 'none',
            mappingSource: '',
            mappingVerified: false,
        }
    }
    return {
        objectMapSysId: map.sysId,
        fieldCount: map.fields.length,
        // ALWAYS 'object_map'. There is no 'template' origin — L2-D2: a template is expanded
        // into real field_map rows by an explicit action, so the connector never sees one.
        origin: 'object_map',
        mappingSource: map.mappingSource,
        mappingVerified: map.mappingVerified,
    }
}

function emptyResult(
    status: CallStatus,
    errorCode: string,
    errorMessage: string,
    resolved: ResolvedMapping,
): ConnectorResult {
    return {
        ok: false,
        status: status,
        httpCode: null,
        durationMs: 0,
        attempts: 0,
        rowsReturned: null,
        body: null,
        errorCode: errorCode,
        errorMessage: errorMessage,
        callLogId: null,
        resolvedMapping: resolved,
    }
}

/**
 * Log a pre-flight refusal and return. Each refusal produces exactly one call_log row (C7) and
 * makes no outbound request.
 */
function refuse(
    erpSystemSysId: string,
    object: string,
    status: CallStatus,
    errorCode: string,
    startedMs: number,
    resolved: ResolvedMapping,
): ConnectorResult {
    const callLogId = writeAttempt({
        erpSystemSysId: erpSystemSysId,
        object: object,
        startedMs: startedMs,
        durationMs: nowMs() - startedMs,
        status: status,
        httpCode: null,
        errorCode: errorCode,
        errorDetail: null,
        rowsReturned: null,
        objectMapSysId: resolved.objectMapSysId,
        mappingVerified: resolved.mappingVerified,
    })

    const result = emptyResult(status, errorCode, composeError(errorCode, null), resolved)
    result.durationMs = nowMs() - startedMs
    result.callLogId = callLogId
    return result
}

/**
 * Count the array at `response_root`. LENGTH ONLY — the one place L2 touches response shape.
 *
 * On ANY failure this returns null and the caller records errorCode RESPONSE_UNPARSEABLE WITH
 * NO DETAIL. That is not laziness: a JSON parse error message quotes the offending fragment,
 * that fragment is a payload, and that is a C1 breach (I3). T2-3 asserts specifically that no
 * fragment of the body appears in `error`.
 */
function countRows(body: string | null, responseRoot: string): { rows: number | null; errorCode: string | null } {
    if (!responseRoot || responseRoot.trim() === '') {
        return { rows: null, errorCode: null }
    }
    if (body === null || body === undefined || body === '') {
        return { rows: null, errorCode: 'RESPONSE_UNPARSEABLE' }
    }

    try {
        let node: any = JSON.parse(body)
        const parts = responseRoot.split('.')
        for (let i = 0; i < parts.length; i++) {
            if (node === null || node === undefined) {
                return { rows: null, errorCode: 'RESPONSE_UNPARSEABLE' }
            }
            node = node[parts[i]]
        }
        if (Object.prototype.toString.call(node) === '[object Array]') {
            return { rows: node.length, errorCode: null }
        }
        return { rows: null, errorCode: 'RESPONSE_UNPARSEABLE' }
    } catch (e) {
        // Deliberately swallowing the message. See the note above — it would quote the payload.
        return { rows: null, errorCode: 'RESPONSE_UNPARSEABLE' }
    }
}

export function fetch(erpSystemSysId: string, object: string, params?: FetchParams): ConnectorResult {
    const t0 = nowMs()
    const p: FetchParams = params || {}

    // ---- Pre-flight, in §4.2's order. Each refusal logs one row and returns without dialling.

    const loaded = loadSystem(erpSystemSysId)
    const system: SystemConfig | null = loaded.config

    // §4.2 row 1. NOT a `failure`: a system that is absent or switched off is a configuration
    // fact, and at L4 it must render "Not configured", not "ERP did not answer" (L2-D1).
    if (!system || !system.active) {
        return refuse(erpSystemSysId, object, 'not_configured', 'SYSTEM_INACTIVE', t0, NO_MAPPING)
    }

    const map: ObjectMapConfig | null = loadMap(erpSystemSysId, object)

    // §4.2 row 2.
    if (!map) {
        return refuse(erpSystemSysId, object, 'not_configured', 'MAP_MISSING', t0, NO_MAPPING)
    }

    const resolved = mappingOf(map)

    // §4.2 row 3.
    if (!map.active) {
        return refuse(erpSystemSysId, object, 'not_configured', 'MAP_INACTIVE', t0, resolved)
    }

    // §4.2 row 4 — L1-D6's other half. An ACTIVE map with ZERO field_map rows must never yield
    // `success, rows_fetched = 0`. Story L2-2 AC4: the outcome is reported as a configuration
    // error naming the object, not as zero rows. This is also what makes L2-D2's "no silent
    // template fallback" true by construction: empty -> MAP_UNMAPPED, never a borrowed template.
    if (map.fields.length === 0) {
        return refuse(erpSystemSysId, object, 'not_configured', 'MAP_UNMAPPED', t0, resolved)
    }

    // §4.2 row 5 — base_url empty after a successful load. If field read ACLs blank the
    // connection fields for a non-admin caller we would otherwise dial "". Loud and logged,
    // never silent. This IS a `failure`: the row is configured, we simply could not read it.
    if (loaded.errorCode === CONFIG_UNREADABLE) {
        return refuse(erpSystemSysId, object, 'failure', CONFIG_UNREADABLE, t0, resolved)
    }

    // §4.2 row 6.
    if (system.authType === 'mutual') {
        return refuse(erpSystemSysId, object, 'failure', 'AUTH_UNSUPPORTED', t0, resolved)
    }

    // §4.2 row 7.
    const state = readState(system)
    if (state === 'OPEN') {
        // C7: refusals are logged with their own status so they neither drown the real errors
        // in the Failed Calls module nor poison the derived failure counter.
        return refuse(erpSystemSysId, object, 'circuit_open', 'CIRCUIT_OPEN', t0, resolved)
    }

    // Claim the probe BEFORE dialling so concurrent callers fail fast.
    if (state === 'HALF_OPEN') {
        takeProbeLease(system)
    }

    // ---- Main loop ---------------------------------------------------------------------------

    let attempt = 0
    let lastHttpCode: number | null = null
    let lastErrorCode = ''
    let lastErrorDetail: string | null = null
    let lastStatus: CallStatus = 'failure'

    for (;;) {
        attempt++

        const attemptStarted = nowMs()
        const r = sendOnce(system, map, p)
        const c = classify(r)

        lastHttpCode = r.httpCode
        lastStatus = c.status
        lastErrorCode = c.errorCode
        // errorDetail may ONLY ever be a platform transport message. Never getBody(). (C1/I3)
        lastErrorDetail = c.status === 'success' ? null : r.transportError

        if (c.status === 'success') {
            // THE SINGLE getBody() CALL SITE IN THE LAYER. In memory only — the value below is
            // returned to the caller and is never passed to writeAttempt().
            let body: string | null = null
            try {
                body = r.response ? r.response.getBody() : null
            } catch (e) {
                body = null
            }

            const counted = countRows(body, map.responseRoot)

            const callLogId = writeAttempt({
                erpSystemSysId: system.sysId,
                object: map.object,
                startedMs: attemptStarted,
                // Attempt-level duration is the HTTP attempt only, excluding any sleep that
                // follows. The logical call's total wall clock is returned, not persisted.
                durationMs: r.durationMs,
                status: 'success',
                httpCode: r.httpCode,
                errorCode: counted.errorCode,
                errorDetail: null,
                rowsReturned: counted.rows,
                objectMapSysId: resolved.objectMapSysId,
                mappingVerified: resolved.mappingVerified,
            })

            recordSuccess(system)

            return {
                ok: true,
                status: 'success',
                httpCode: r.httpCode,
                durationMs: nowMs() - t0,
                attempts: attempt,
                rowsReturned: counted.rows,
                body: body,
                errorCode: counted.errorCode,
                errorMessage: counted.errorCode ? composeError(counted.errorCode, null) : null,
                callLogId: callLogId,
                resolvedMapping: resolved,
            }
        }

        writeAttempt({
            erpSystemSysId: system.sysId,
            object: map.object,
            startedMs: attemptStarted,
            durationMs: r.durationMs,
            status: c.status,
            httpCode: r.httpCode,
            errorCode: c.errorCode,
            errorDetail: r.transportError,
            rowsReturned: null,
            objectMapSysId: resolved.objectMapSysId,
            mappingVerified: resolved.mappingVerified,
        })

        if (!c.retryable) {
            break
        }
        if (attempt > system.maxRetries) {
            break
        }

        const elapsed = nowMs() - t0
        const delay = computeDelayMs(
            attempt,
            system.backoffMs,
            r.retryAfterMs,
            CONNECTOR_CONSTANTS.MAX_TOTAL_CALL_MS - elapsed,
        )

        // C9 BUDGET GUARD — NOT OPTIONAL. This is what makes an admin-set
        // `timeout_ms = 120000, max_retries = 5` (a 12-minute worst case on paper) impossible in
        // practice. A call cannot outlive MAX_TOTAL_CALL_MS however the row is configured.
        // L3 does NOT get a longer budget by editing this constant (R2-3).
        if (elapsed + delay + system.timeoutMs > CONNECTOR_CONSTANTS.MAX_TOTAL_CALL_MS) {
            break
        }

        sleepMs(delay)
    }

    // Every attempt failed. This may trip the breaker.
    recordFailure(system)

    return {
        ok: false,
        status: lastStatus,
        httpCode: lastHttpCode,
        durationMs: nowMs() - t0,
        attempts: attempt,
        rowsReturned: null,
        body: null,
        errorCode: lastErrorCode,
        errorMessage: composeError(lastErrorCode, lastErrorDetail),
        callLogId: null,
        resolvedMapping: resolved,
    }
}

/** Facade helper: is the breaker currently refusing calls for this system? */
export function isCircuitOpen(erpSystemSysId: string): boolean {
    const loaded = loadSystem(erpSystemSysId)
    if (!loaded.config) {
        return false
    }
    return readState(loaded.config) === 'OPEN'
}

/** Facade helper: admin utility clearing `circuit_open_until`. */
export { resetCircuit }
