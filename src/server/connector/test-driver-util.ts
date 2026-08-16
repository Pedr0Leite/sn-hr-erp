import { GlideDateTime, GlideRecord, gs } from '@servicenow/glide'
import { nowMs, toGlideDateTime } from './util.ts'

/**
 * Shared helpers for the L2 test drivers.
 *
 * PORTED from the sibling app's test-driver-util.ts with the table constants swapped and the
 * `object` -> `logical_object` column rename applied.
 *
 * WHY THESE EXIST (documented deviation from the design's test plan, inherited from the
 * sibling): the plan assumes an operator with a browser -- clicking *Execute Now*, editing
 * fixture rows between cases, and using UI impersonation for T30/T31. This build environment
 * has NO browser session, so the plan is executed by deployed scheduled scripts that perform
 * their own setup, assertions and teardown and report structured results to
 * `syslog_app_scope`, read back with `now-sdk query`.
 *
 * The admin drivers run as `system`, which is admin-equivalent -- that is exactly why T30/T31
 * are run by a SEPARATE script whose `runAs` is `hrerp_viewer_only`. Do not fold them in here.
 *
 * NOTHING IN THIS FILE MAY EVER LOG `ConnectorResult.body`. It is the single most likely place
 * in the app for a payload to reach a log, which breaches C1 just as surely as persisting it
 * would.
 */

export const T_ERP_SYSTEM = 'x_335329_sn_hr_erp_erp_system'
export const T_OBJECT_MAP = 'x_335329_sn_hr_erp_object_map'
export const T_FIELD_MAP = 'x_335329_sn_hr_erp_field_map'
export const T_CALL_LOG = 'x_335329_sn_hr_erp_call_log'

/** Every driver line starts with this prefix so §8's one query finds all of them. */
export const MARK_ADMIN = '[HRERP-L2-T]'
export const MARK_VIEWER = '[HRERP-L2-TV]'
export const MARK_GATE = '[HRERP-L2-GATE]'

export function log(marker: string, msg: string): void {
    gs.info(marker + ' ' + msg)
}

/** Report one assertion. The PASS/FAIL line IS the evidence -- table state is not (§8). */
export function assert(marker: string, testId: string, label: string, passed: boolean, observed: string): boolean {
    log(marker, (passed ? 'PASS ' : 'FAIL ') + testId + ' | ' + label + ' | observed: ' + observed)
    return passed
}

/** For cases that can only be reviewed, never executed. Never reported as PASS (T2-9 / OD14). */
export function review(marker: string, testId: string, label: string, observed: string): void {
    log(marker, 'REVIEWED ' + testId + ' | ' + label + ' | observed: ' + observed)
}

/** Set arbitrary fields on the system row. Returns false if the update did not stick. */
export function setSystemFields(sysId: string, fields: { [k: string]: any }, bypassBusinessRules?: boolean): boolean {
    const gr = new GlideRecord(T_ERP_SYSTEM)
    if (!gr.get(sysId)) {
        return false
    }
    for (const k in fields) {
        if (Object.prototype.hasOwnProperty.call(fields, k)) {
            gr.setValue(k, fields[k])
        }
    }
    // Only used where L1's `Validate ERP system configuration` rule would legitimately reject a
    // state a test needs (e.g. use_mid_server = true with no MID server on the instance).
    if (bypassBusinessRules) {
        gr.setWorkflow(false)
    }
    return !!gr.update()
}

export function getSystemField(sysId: string, field: string): string {
    const gr = new GlideRecord(T_ERP_SYSTEM)
    if (!gr.get(sysId)) {
        return ''
    }
    return gr.getValue(field) || ''
}

export function setMapFields(systemSysId: string, object: string, fields: { [k: string]: any }): boolean {
    const gr = new GlideRecord(T_OBJECT_MAP)
    gr.addQuery('erp_system', systemSysId)
    gr.addQuery('logical_object', object)
    gr.setLimit(1)
    gr.query()
    if (!gr.next()) {
        return false
    }
    for (const k in fields) {
        if (Object.prototype.hasOwnProperty.call(fields, k)) {
            gr.setValue(k, fields[k])
        }
    }
    return !!gr.update()
}

export function getMapSysId(systemSysId: string, object: string): string {
    const gr = new GlideRecord(T_OBJECT_MAP)
    gr.addQuery('erp_system', systemSysId)
    gr.addQuery('logical_object', object)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? gr.getUniqueValue() : ''
}

/** Execution rule 1: reset the breaker between cases unless the case says otherwise. */
export function clearBreaker(systemSysId: string): void {
    setSystemFields(systemSysId, { circuit_open_until: '' })
}

/** Force HALF_OPEN by setting circuit_open_until into the past (T26/T27). */
export function forceHalfOpen(systemSysId: string, msInPast: number): void {
    setSystemFields(systemSysId, { circuit_open_until: toGlideDateTime(nowMs() - msInPast) })
}

/** Execution rule 3: delete call_log rows between cases so the derived counter is not polluted. */
export function clearCallLog(systemSysId: string): number {
    const gr = new GlideRecord(T_CALL_LOG)
    gr.addQuery('erp_system', systemSysId)
    gr.query()
    let n = 0
    while (gr.next()) {
        gr.deleteRecord()
        n++
    }
    return n
}

export interface LoggedRow {
    sysId: string
    object: string
    status: string
    httpCode: string
    error: string
    durationMs: number
    rowsReturned: string
    cacheHit: string
    objectMap: string
    mappingVerified: string
    startedMs: number
    started: string
}

/** Read this system's call_log rows, oldest first. */
export function readCallLog(systemSysId: string): LoggedRow[] {
    const gr = new GlideRecord(T_CALL_LOG)
    gr.addQuery('erp_system', systemSysId)
    gr.orderBy('sys_created_on')
    gr.query()

    const rows: LoggedRow[] = []
    while (gr.next()) {
        const startedRaw = gr.getValue('started') || ''
        rows.push({
            sysId: gr.getUniqueValue(),
            object: gr.getValue('logical_object') || '',
            status: gr.getValue('status') || '',
            httpCode: gr.getValue('http_code') || '',
            error: gr.getValue('error') || '',
            durationMs: parseInt(gr.getValue('duration_ms') || '0', 10),
            rowsReturned: gr.getValue('rows_returned') || '',
            cacheHit: gr.getValue('cache_hit') || '',
            objectMap: gr.getValue('object_map') || '',
            mappingVerified: gr.getValue('mapping_verified') || '',
            startedMs: startedRaw ? new GlideDateTime(startedRaw).getNumericValue() : 0,
            started: startedRaw,
        })
    }
    return rows
}

export function summarise(rows: LoggedRow[]): string {
    const parts: string[] = []
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        parts.push(
            '#' +
                (i + 1) +
                '{obj=' +
                r.object +
                ',status=' +
                r.status +
                ',http=' +
                (r.httpCode || '-') +
                ',dur=' +
                r.durationMs +
                ',rows=' +
                (r.rowsReturned === '' ? '-' : r.rowsReturned) +
                ',map=' +
                (r.objectMap ? 'set' : '-') +
                ',verified=' +
                r.mappingVerified +
                ',err=' +
                (r.error || '-') +
                '}',
        )
    }
    return rows.length + ' row(s): ' + parts.join(' ')
}

/**
 * C1 scan (T28): does this `error` value look like it contains a payload rather than a status
 * line? Deliberately conservative -- any JSON/HTML structure is treated as a breach.
 */
export function looksLikePayload(error: string): boolean {
    if (!error) {
        return false
    }
    return (
        error.indexOf('{') !== -1 ||
        error.indexOf('[') !== -1 ||
        error.indexOf('<') !== -1 ||
        error.indexOf('"') !== -1
    )
}

export function isFutureDateTime(raw: string): boolean {
    if (!raw) {
        return false
    }
    return new GlideDateTime(raw).getNumericValue() > nowMs()
}
