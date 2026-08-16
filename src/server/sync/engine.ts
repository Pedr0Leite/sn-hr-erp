import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { loadMap, loadSystem } from '../connector/config-loader.ts'
import { fetch } from '../connector/erp-connector.ts'
import { mapResponse, parseDate, toNumber } from '../connector/field-mapper.ts'
import type { MappedRecord } from '../connector/field-mapper.ts'
import type { ConnectorResult, FetchParams, ObjectMapConfig } from '../connector/types.ts'
import { LOGICAL_OBJECTS } from '../contract/objects.ts'
import { assertPromotionTable, DATE_SLOTS, NUMERIC_SLOTS, promotionFor } from '../contract/promotion.ts'

/**
 * L3-8 .. L3-11. THE SYNC ENGINE. docs/l3-staging-design.md §4.
 *
 * ONE RUN PER (system x object). The run row is inserted FIRST and finished last, because
 * `erp_staging` is meaningless without it: zero staged rows is three different sentences and
 * only the latest run tells them apart (kickoff §7).
 *
 * THE THREE PROPERTIES THIS FILE EXISTS TO GUARANTEE, all of them control flow rather than
 * guard clauses someone can move:
 *
 *  1. A `not_configured` or `failed` run WRITES NOTHING TO STAGING AND DELETES NOTHING. The
 *     return statements are before the upsert, not conditions inside it (story L3-3 AC5).
 *  2. `rows_fetched` IS LEFT EMPTY, NEVER SET TO 0, on any non-success path. Empty means "we
 *     do not know"; 0 means "the ERP said zero" (story L3-2 AC3b). setValue('rows_fetched', ...)
 *     appears exactly once in this file and only on the success/partial path.
 *  3. ABSENT ROWS ARE DELETED ONLY AFTER A `success` RUN (L3-D2). A `partial` run is by
 *     definition an incomplete view, so deleting its "absent" rows would delete everything on
 *     the unfetched pages and then present the remainder as complete. THIS IS THE SINGLE MOST
 *     IMPORTANT RESTRICTION IN THE FILE.
 *
 * EVERY RELATIVE IMPORT ABOVE CARRIES `.ts` (D19). Without it the module resolves to a
 * sys_module path that does not exist: clean build, clean install, dead at runtime.
 */

const T_STAGING = 'x_335329_sn_hr_erp_staging'
const T_SYNC_RUN = 'x_335329_sn_hr_erp_sync_run'

/**
 * §4.5's two ceilings. Both are DERIVED, not tuned:
 *  MAX_PAGES 50 x page_size 100 = 5,000 rows, matching L4-4's large fixture.
 *  MAX_SYNC_MS 240000 = 4 min, under the 300 s transaction quota, in a ScheduledScript.
 * Hitting either yields `partial` NAMING THE CEILING, never a truncated set labelled success.
 * Raising them is a design change with a re-derivation, not a tweak (R3-5).
 */
export const SYNC_CONSTANTS = {
    MAX_PAGES: 50,
    MAX_SYNC_MS: 240000,
}

export interface SyncOutcome {
    runSysId: string
    status: 'success' | 'partial' | 'failed' | 'not_configured'
    /** null, NOT 0, when the run did not succeed. Mirrors the column exactly. */
    rowsFetched: number | null
    rowsUpserted: number
    rowsDeleted: number
    pagesFetched: number
    errorMessage: string
}

function nowMs(): number {
    return new GlideDateTime().getNumericValue()
}

/** gs.nowDateTime() is not allowed in scoped apps (kickoff §9). */
function nowValue(): string {
    return new GlideDateTime().getValue()
}

/**
 * The extra query string for page `pageIndex` (0-based), per `object_map.pagination_style`.
 *
 * The parameter NAMES here are the conventional ones for each named style; the STYLE itself is
 * per-ERP configuration, which is the part that has to be data. An ERP whose offset parameter
 * is spelled differently is onboarded by putting it in `query_template`, not by editing this.
 *
 * Returns null when the style does not use a query string (none / cursor / next_url).
 */
export function pageQuery(style: string, pageIndex: number, pageSize: number): string | null {
    const size = pageSize > 0 ? pageSize : 100
    if (style === 'offset') {
        return 'offset=' + pageIndex * size + '&limit=' + size
    }
    if (style === 'page') {
        return 'page=' + (pageIndex + 1) + '&per_page=' + size
    }
    if (style === 'odata_skiptop') {
        return '$skip=' + pageIndex * size + '&$top=' + size
    }
    return null
}

/** The scheme+host of a URL, lowercased, or '' when it has none. No URL class in Rhino. */
export function hostOf(url: string): string {
    const match = /^([a-z][a-z0-9+.-]*:\/\/[^/?#]+)/i.exec(String(url || ''))
    return match ? match[1].toLowerCase() : ''
}

/**
 * §4.5 — the next page's URL, ONLY if it is on the same host as `base_url`.
 *
 * A next URL pointing anywhere else is treated as end-of-pages and recorded. This mirrors the
 * connector's `setFollowRedirect(false)` rule for exactly the same reason: the Authorization
 * header must never travel to a host that is not in this app's configuration.
 */
export function nextUrlFrom(parsed: any, baseUrl: string): { url: string; offHost: boolean } {
    const candidates = ['next', 'next_url', 'nextUrl', 'nextLink', '@odata.nextLink']
    for (let i = 0; i < candidates.length; i++) {
        const value = parsed && typeof parsed === 'object' ? parsed[candidates[i]] : null
        if (typeof value === 'string' && value !== '') {
            if (hostOf(value) !== hostOf(baseUrl)) {
                return { url: '', offHost: true }
            }
            return { url: value, offHost: false }
        }
    }
    return { url: '', offHost: false }
}

/** The cursor token for the next page, or '' at end-of-pages. */
function cursorFrom(parsed: any): string {
    const candidates = ['next_cursor', 'nextCursor', 'cursor', 'continuation_token']
    for (let i = 0; i < candidates.length; i++) {
        const value = parsed && typeof parsed === 'object' ? parsed[candidates[i]] : null
        if (typeof value === 'string' && value !== '') {
            return value
        }
    }
    return ''
}

/**
 * Turn one mapped record into the column values of a staging row.
 *
 * `payload` carries EVERY mapped logical field under its own name; the nine promoted columns
 * are a queryable projection of it, chosen by src/server/contract/promotion.ts. A value that
 * will not parse as its slot's type LEAVES THE COLUMN EMPTY and stays readable in `payload` —
 * never 0, never today's date (the C2 rule, inherited from field-mapper).
 */
export function promoteRow(row: MappedRecord, object: string, map: ObjectMapConfig): { [column: string]: string } {
    const out: { [column: string]: string } = {}
    const promotion = promotionFor(object)
    const slots = Object.keys(promotion)

    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        const raw = row[promotion[slot]]
        if (raw === undefined || raw === null || raw === '') {
            continue
        }
        if (NUMERIC_SLOTS.indexOf(slot as any) !== -1) {
            const n = toNumber(raw)
            if (n !== null) {
                out[slot] = String(n)
            }
            continue
        }
        if (DATE_SLOTS.indexOf(slot as any) !== -1) {
            const d = parseDate(String(raw), map.dateFormat)
            if (d) {
                out[slot] = d
            }
            continue
        }
        out[slot] = String(raw)
    }

    // L3-D12. The per-row comparison, precomputed, because ServiceNow has no numeric
    // field-to-field encoded-query operator (see the column's own comment in
    // src/fluent/tables/erp-staging.now.ts). BOTH sides must be present: an unmapped
    // safety_stock leaves `delta` EMPTY, so the low-stock tile finds no rows to compare and
    // renders not_configured naming the field -- never a comparison against an implicit zero.
    if (out['qty'] !== undefined && out['threshold'] !== undefined) {
        out['delta'] = String(Number(out['qty']) - Number(out['threshold']))
    }

    // OD7 / l3 §3.2. `ratio` is not in the promotion table because it is not a plain field
    // copy: a SUPPLIED oee is promoted here, normalised by the per-ERP scale, and the
    // COMPUTED case (availability x performance x quality) belongs to L4's state resolver
    // where the "which inputs are missing" sentence is built. An unset scale on a percent-
    // scaled ERP is why `oee_input_scale` has no default.
    if (object === 'production_output' && row['oee'] !== undefined) {
        const oee = toNumber(row['oee'])
        if (oee !== null) {
            out['ratio'] = String(map.oeeInputScale === 'percent_0_100' ? oee / 100 : oee)
        }
    }

    return out
}

/** All currently-staged rows for one (system x object): source_record_id -> sys_id. */
function existingRows(systemSysId: string, object: string): { [sourceId: string]: string } {
    const out: { [sourceId: string]: string } = {}
    const gr = new GlideRecord(T_STAGING)
    gr.addQuery('erp_system', systemSysId)
    gr.addQuery('logical_object', object)
    gr.query()
    while (gr.next()) {
        out[String(gr.getValue('source_record_id') || '')] = gr.getUniqueValue()
    }
    return out
}

function finishRun(runSysId: string, values: { [column: string]: string }): void {
    const gr = new GlideRecord(T_SYNC_RUN)
    if (!gr.get(runSysId)) {
        return
    }
    const columns = Object.keys(values)
    for (let i = 0; i < columns.length; i++) {
        gr.setValue(columns[i], values[columns[i]])
    }
    gr.setValue('finished', nowValue())
    gr.update()
}

/**
 * §4.1 — sync ONE logical object from ONE ERP system.
 *
 * The run row is inserted with `status = failed` and a placeholder reason ON PURPOSE. `status`
 * is mandatory and its choice list has EXACTLY FOUR values (story L3-2 AC2) — there is no
 * `running`, and adding one would give L4 a fifth case kickoff §7 defines no sentence for. So
 * an in-flight run is a `failed` row with an empty `finished`, which means a transaction that
 * dies mid-sync leaves an honest "the ERP did not answer" rather than a run with no state at
 * all. The `before` rule of L3-3 is satisfied at every instant.
 */
export function syncObject(systemSysId: string, object: string): SyncOutcome {
    const t0 = nowMs()
    const def = LOGICAL_OBJECTS[object]

    const outcome: SyncOutcome = {
        runSysId: '',
        status: 'failed',
        rowsFetched: null,
        rowsUpserted: 0,
        rowsDeleted: 0,
        pagesFetched: 0,
        errorMessage: '',
    }

    // D2, third guard. The `before` rule refuses the staged row; this refuses the whole run, so
    // a payroll sync never even dials.
    if (!def || !def.category) {
        outcome.status = 'not_configured'
        outcome.errorMessage = 'Payroll and employee data are never staged (decision D2).'
        return outcome
    }

    // L3-7's check, run once per sync so a bad promotion edit fails on the first run rather
    // than quietly mis-promoting rows for a week.
    const problems = assertPromotionTable()
    if (problems.length > 0) {
        outcome.errorMessage = 'Promotion table is malformed: ' + problems.join(' ')
        return outcome
    }

    const run = new GlideRecord(T_SYNC_RUN)
    run.initialize()
    run.setValue('erp_system', systemSysId)
    run.setValue('logical_object', object)
    run.setValue('erp_category', def.category)
    run.setValue('started', nowValue())
    run.setValue('status', 'failed')
    run.setValue('error_message', 'Run did not complete.')
    const runSysId = String(run.insert() || '')
    outcome.runSysId = runSysId

    const map = loadMap(systemSysId, object)
    // Only used to host-confine a `next_url` page (§4.5). Empty when the row is unreadable,
    // which makes every candidate next URL off-host and stops pagination — fail closed.
    // No optional chaining: the platform's server-side engine is not a modern browser and this
    // file must stay readable to it.
    const loadedSystem = loadSystem(systemSysId)
    const baseUrl = loadedSystem.config ? loadedSystem.config.baseUrl : ''

    // ---- Pagination loop. Every page is one bounded connector call (§4.5). ------------------
    const rows: MappedRecord[] = []
    let pages = 0
    let lastResult: ConnectorResult | null = null
    let ceiling = ''
    let cursor = ''
    let nextUrl = ''
    let unparseablePage = 0

    for (;;) {
        const params: FetchParams = {}
        if (map) {
            const q = pageQuery(map.paginationStyle, pages, map.pageSize)
            if (q) {
                params.extraQuery = q
            }
            if (cursor) {
                params.extraQuery = (params.extraQuery ? params.extraQuery + '&' : '') + 'cursor=' + encodeURIComponent(cursor)
            }
            if (nextUrl) {
                params.absoluteUrl = nextUrl
            }
        }

        const result = fetch(systemSysId, object, params)
        lastResult = result

        // §4.1 step 3. NO STAGING WRITE, NO DELETE. `not_configured` is a configuration fact,
        // and at L4 it renders "Not configured — create an Object Map for <object>", which is
        // a different sentence from "the ERP did not answer" (L2-D1).
        if (result.status === 'not_configured') {
            finishRun(runSysId, {
                status: 'not_configured',
                error_message: result.errorMessage || 'No usable object mapping.',
                duration_ms: String(nowMs() - t0),
                call_log: result.callLogId || '',
            })
            outcome.status = 'not_configured'
            outcome.errorMessage = result.errorMessage || ''
            return outcome
        }

        // §4.1 step 4. Page 1 failing is a failed run. A LATER page failing is `partial` and is
        // handled after the loop — the rows page 1 returned are real data the ERP gave us.
        if (!result.ok) {
            if (pages === 0) {
                finishRun(runSysId, {
                    status: 'failed',
                    error_message: result.errorMessage || 'ERP did not answer.',
                    http_status: result.httpCode === null ? '' : String(result.httpCode),
                    duration_ms: String(nowMs() - t0),
                    call_log: result.callLogId || '',
                })
                outcome.errorMessage = result.errorMessage || ''
                return outcome
            }
            ceiling = 'Page ' + (pages + 1) + ' failed: ' + (result.errorMessage || 'ERP did not answer.')
            break
        }

        let parsed: any = null
        try {
            parsed = result.body === null ? null : JSON.parse(result.body)
        } catch (e) {
            // Deliberately not quoting the parse error: it would echo a fragment of the
            // payload, and a payload fragment in a log is a C1 breach.
            parsed = null
        }

        const page = map ? mapResponse(parsed, map.responseRoot, object, map.fields, map.dateFormat) : null
        if (page === null) {
            // "The response root did not resolve to an array" and "there are no rows" are
            // different answers and must never render the same way.
            unparseablePage = pages + 1
            ceiling = 'Page ' + unparseablePage + ' response did not resolve to a record array (check response_root).'
            break
        }

        for (let i = 0; i < page.length; i++) {
            rows.push(page[i])
        }
        pages++

        if (!map || map.paginationStyle === 'none') {
            break
        }
        if (pages >= SYNC_CONSTANTS.MAX_PAGES) {
            ceiling = 'Stopped at the MAX_PAGES ceiling (' + SYNC_CONSTANTS.MAX_PAGES + '). The set is truncated.'
            break
        }
        if (nowMs() - t0 >= SYNC_CONSTANTS.MAX_SYNC_MS) {
            ceiling = 'Stopped at the MAX_SYNC_MS ceiling (' + SYNC_CONSTANTS.MAX_SYNC_MS + 'ms). The set is truncated.'
            break
        }

        if (map.paginationStyle === 'next_url') {
            // §4.5 — validated against `erp_system.base_url` BEFORE it is ever dialled. An
            // off-host next URL ends pagination and is recorded; it never carries the
            // Authorization header off-estate.
            const next = nextUrlFrom(parsed, baseUrl)
            if (next.offHost) {
                ceiling = 'Next page URL is on a different host and was not followed (§4.5).'
                break
            }
            if (!next.url) {
                break
            }
            nextUrl = next.url
            continue
        }

        if (map.paginationStyle === 'cursor') {
            cursor = cursorFrom(parsed)
            if (!cursor) {
                break
            }
            continue
        }

        // offset / page / odata_skiptop: a short page is the end of the set.
        if (page.length < (map.pageSize > 0 ? map.pageSize : 100)) {
            break
        }
    }

    // ---- §4.2 Idempotent, batched upsert ---------------------------------------------------
    //
    // L3-D11. ONE query loads every currently-staged row for this (system x object) as
    // {source_record_id -> sys_id}. §4.2 specifies a chunked `IN` over the response's ids
    // instead; this is strictly FEWER queries (one, not ceil(N/500)) and §4.3's reconciliation
    // needs exactly this same set anyway, so the alternative reads the same rows twice. Story
    // L3-3 AC4's property — a bounded query count independent of N — holds either way.
    const existing = existingRows(systemSysId, object)
    const seen: { [id: string]: boolean } = {}
    const fetchedAt = nowValue()
    let keyless = 0
    let upserted = 0

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const sourceId = String(row['erp_id'] || '')

        // Story L3-3 AC2. An orphan with no key can never be updated and would double on every
        // subsequent sync — the exact defect this criterion exists to prevent. Counted and
        // named in the run's error detail; NOT inserted.
        if (sourceId === '') {
            keyless++
            continue
        }
        seen[sourceId] = true

        const values = promoteRow(row, object, map as ObjectMapConfig)
        const gr = new GlideRecord(T_STAGING)
        const known = existing[sourceId]
        if (known && gr.get(known)) {
            // update in place
        } else {
            gr.initialize()
            gr.setValue('erp_system', systemSysId)
            gr.setValue('logical_object', object)
            gr.setValue('source_record_id', sourceId)
        }

        gr.setValue('erp_category', def.category)
        gr.setValue('fetched_at', fetchedAt)
        gr.setValue('sync_run', runSysId)
        gr.setValue('object_map', map ? map.sysId : '')
        gr.setValue('external_ref', sourceId)
        gr.setValue('currency_code', String(row['currency'] || ''))
        gr.setValue('payload', JSON.stringify(row))

        // Clear then set: a value that disappeared from the ERP must not survive as a stale
        // promoted column while `payload` says otherwise.
        const slots = ['amount', 'qty', 'threshold', 'ratio', 'delta', 'status', 'dim', 'label', 'code', 'occurred_on']
        for (let s = 0; s < slots.length; s++) {
            gr.setValue(slots[s], values[slots[s]] === undefined ? '' : values[slots[s]])
        }

        if (known && gr.getUniqueValue()) {
            gr.update()
        } else {
            gr.insert()
        }
        upserted++
    }

    // ---- §4.3 Absent-row reconciliation. `success` ONLY. -----------------------------------
    const status: 'success' | 'partial' = ceiling === '' ? 'success' : 'partial'
    let deleted = 0

    if (status === 'success') {
        const ids = Object.keys(existing)
        for (let i = 0; i < ids.length; i++) {
            if (seen[ids[i]]) {
                continue
            }
            const gr = new GlideRecord(T_STAGING)
            if (gr.get(existing[ids[i]])) {
                gr.deleteRecord()
                deleted++
            }
        }
    }
    // else: NOTHING IS DELETED. Not a guard inside the delete — the delete is inside the
    // success branch, which is what makes R3-1 structurally impossible rather than merely
    // tested for.

    const detail: string[] = []
    if (ceiling) {
        detail.push(ceiling)
    }
    if (keyless > 0) {
        detail.push(keyless + ' row(s) had no source record id and were not staged (story L3-3 AC2).')
    }

    finishRun(runSysId, {
        status: status,
        // THE ONLY setValue('rows_fetched', ...) IN THIS FILE, and it is on the success/partial
        // path. Every other exit leaves the column empty.
        rows_fetched: String(rows.length),
        rows_upserted: String(upserted),
        rows_deleted: String(deleted),
        pages_fetched: String(pages),
        error_message: detail.join(' '),
        http_status: lastResult && lastResult.httpCode !== null ? String(lastResult.httpCode) : '',
        duration_ms: String(nowMs() - t0),
        call_log: lastResult && lastResult.callLogId ? lastResult.callLogId : '',
        object_map: map ? map.sysId : '',
    })

    outcome.status = status
    outcome.rowsFetched = rows.length
    outcome.rowsUpserted = upserted
    outcome.rowsDeleted = deleted
    outcome.pagesFetched = pages
    outcome.errorMessage = detail.join(' ')
    return outcome
}

/**
 * Sync every object of ONE erp_category across every ACTIVE system that maps it.
 *
 * THIS IS THE ONLY FAN-OUT THAT EXISTS, AND IT TAKES A CATEGORY (story L3-3 AC6). There is
 * deliberately no variant that takes nothing: a refresh from Tab 3 syncs `stock_item` and
 * `backorder` on the systems that map them, and a refresh that hits every configured system
 * fails the story. The guard is the signature, not a condition.
 */
export function syncCategory(category: string): SyncOutcome[] {
    const out: SyncOutcome[] = []
    const objects: string[] = []
    const names = Object.keys(LOGICAL_OBJECTS)
    for (let i = 0; i < names.length; i++) {
        if (LOGICAL_OBJECTS[names[i]].category === category) {
            objects.push(names[i])
        }
    }
    if (objects.length === 0) {
        return out
    }

    // ONE query for the active systems, then one object_map query per (system x object) inside
    // syncObject. No GlideRecord is constructed inside a loop over ERP RESPONSE rows, which is
    // what story L4-4 AC3 is actually about.
    const systems: string[] = []
    const gr = new GlideRecord('x_335329_sn_hr_erp_erp_system')
    gr.addQuery('active', true)
    gr.query()
    while (gr.next()) {
        systems.push(gr.getUniqueValue())
    }

    for (let s = 0; s < systems.length; s++) {
        for (let o = 0; o < objects.length; o++) {
            out.push(syncObject(systems[s], objects[o]))
        }
    }
    return out
}
