import { GlideRecord } from '@servicenow/glide'
import { CONNECTOR_CONSTANTS } from './constants.ts'
import { toGlideDateTime, truncate } from './util.ts'
import type { CallLogEntry } from './types.ts'

/**
 * The C1 chokepoint.
 *
 * PORTED from the sibling app. Changes: the table constant (§2.1), the `object` ->
 * `logical_object` column rename (L1 §4.1), and §4.3's two new columns
 * (`object_map`, `mapping_verified`).
 *
 * THIS IS THE ONLY FILE THAT MAY INSERT INTO `x_335329_sn_hr_erp_call_log`.
 *
 * C1 (inherited, non-negotiable): never store ERP financial data in ServiceNow. An ERP error
 * response routinely quotes the offending record — an invoice total, a salary — so a single
 * well-meaning `error: response.getBody()` would import financial data through the back door.
 * This file is where it would actually happen.
 *
 * Three defences, in order of strength:
 *   1. `CallLogEntry` has NO field that could hold a response body. The type signature is the
 *      enforcement mechanism — you cannot pass a body to this function (I2).
 *   2. `getBody()` has exactly ONE call site in the entire layer (erp-connector.ts), and its
 *      value is returned to the caller in memory, never handed to this writer (I1).
 *   3. Build-order step L2-12 greps for `getBody` across src/server/ and fails if the count != 1.
 *
 * `errorDetail` may only ever be `RESTResponseV2.getErrorMessage()` (a platform transport
 * message such as "Read timed out") or a synthesised `HTTP <code>` line (I3).
 */

const T_CALL_LOG = 'x_335329_sn_hr_erp_call_log'

/**
 * Compose the `error` column value: code plus optional detail, capped at ERROR_MAX_CHARS.
 * Exported for the orchestrator's in-memory result message so the two never drift.
 */
export function composeError(errorCode: string | null, errorDetail: string | null): string {
    const code = errorCode || ''
    const detail = errorDetail || ''
    const composed = detail ? code + ' — ' + detail : code
    return truncate(composed, CONNECTOR_CONSTANTS.ERROR_MAX_CHARS)
}

/**
 * Insert exactly one attempt row. Returns the new sys_id, or null if the insert failed.
 *
 * C7: every attempt produces exactly one row. Success, failure, timeout, breaker refusal and
 * every pre-flight rejection all log. One logical call with 2 retries produces 3 rows.
 *
 * The insert is wrapped so that a logging failure can never take down the call itself — but it
 * is NOT silently swallowed: the caller gets null and can surface it. A viewer whose `create`
 * ACL is missing would land here (L2-4 grants `call_log.create` to `viewer` for exactly this
 * reason; T2-14 is its test).
 */
export function writeAttempt(entry: CallLogEntry): string | null {
    try {
        const gr = new GlideRecord(T_CALL_LOG)
        gr.initialize()

        gr.setValue('erp_system', entry.erpSystemSysId)
        // The column is `logical_object` in this app, for consistency with erp_staging and
        // sync_run (L1 §4.1). The entry property keeps the sibling's name.
        gr.setValue('logical_object', entry.object)
        gr.setValue('started', toGlideDateTime(entry.startedMs))
        gr.setValue('duration_ms', entry.durationMs)
        gr.setValue('status', entry.status)

        if (entry.httpCode !== null && entry.httpCode !== undefined) {
            gr.setValue('http_code', entry.httpCode)
        }

        const error = composeError(entry.errorCode, entry.errorDetail)
        if (error !== '') {
            gr.setValue('error', error)
        }

        if (entry.rowsReturned !== null && entry.rowsReturned !== undefined) {
            gr.setValue('rows_returned', entry.rowsReturned)
        }

        // §4.3 — a wrong figure is traced: tile -> sync_run -> call_log -> the object_map row
        // -> its field_map rows. Written on every row that resolved a map; left empty when no
        // map resolved, which is itself the evidence for a MAP_MISSING outcome.
        if (entry.objectMapSysId) {
            gr.setValue('object_map', entry.objectMapSysId)
        }
        gr.setValue('mapping_verified', entry.mappingVerified)

        // Written false explicitly on every row. There is no cache in this app, and an explicit
        // false is more honest than a column that means "we don't know".
        gr.setValue('cache_hit', false)

        const sysId = gr.insert()
        return sysId ? String(sysId) : null
    } catch (e) {
        return null
    }
}
