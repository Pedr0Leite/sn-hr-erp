import { GlideAggregate, GlideDateTime, GlideRecord, gs } from '@servicenow/glide'
import { isTrue } from '../util/bool.ts'
import { canSeeMoney, resetRoleCache } from './role-check.ts'
import { resolveOee, resolveTile } from './state-resolver.ts'
import type { CurrencyAmount, SystemContribution } from './state-resolver.ts'
import { TABS, tabNames } from './tabs.ts'
import type { ChartDef, KpiDef, ListDef, TabDef, Where } from './tabs.ts'

/**
 * L4-4 / L4-5. HubData -- everything the route needs, batched.
 *
 * THE PAYLOAD CONTRACT LIVES IN docs/api-contract.md. This file produces it; L5 and
 * docs/uib-page-spec.md bind against the written contract, not against observed output.
 *
 * THE SIX INVARIANTS, and they are the whole layer:
 *
 *   P1  `st` is present on EVERY tile object, in `k`, `c` and `l`.
 *   P2  `v` is present ONLY when st is live | stale | partial. ABSENT otherwise -- not null,
 *       not 0. Built by one function every tile passes through, so a tile added later cannot
 *       quietly skip it.
 *   P3  `v: 0` occurs ONLY with st: "live", and only when a `success` run returned an empty
 *       set or rows summing to zero.
 *   P4  `obj` is present on every tile, in every state -- without it L5 cannot build the
 *       not-configured sentence.
 *   P5  st: "failed" carries EITHER `prev` OR `no_prev: true`. Never neither.
 *   P6  `error_message` from sync_run NEVER appears in the payload. Not for admins either --
 *       it is simply not read here, which is a stronger guarantee than a role check.
 *
 * QUERY BUDGET: recorded per tab in docs/l3-l4-build-report.md. It is INDEPENDENT OF ROW COUNT
 * and of the number of contributing systems -- which is the property story L4-4 actually tests.
 * It is NOT independent of tile count, and the design's §7.1 claim of "one GlideAggregate for
 * all KPIs" is not reachable when the KPIs carry different filters. Recorded as OD20 rather
 * than quietly restated.
 *
 * NO GlideRecord AND NO GlideAggregate IS CONSTRUCTED INSIDE A LOOP OVER RESULT ROWS (story
 * L4-4 AC3). Reference display values come from the systems map built by query 1, never from
 * getDisplayValue() per row (AC4).
 */

const T_STAGING = 'x_335329_sn_hr_erp_staging'
const T_SYNC_RUN = 'x_335329_sn_hr_erp_sync_run'
const T_ERP_SYSTEM = 'x_335329_sn_hr_erp_erp_system'
const T_OBJECT_MAP = 'x_335329_sn_hr_erp_object_map'
const T_FIELD_MAP = 'x_335329_sn_hr_erp_field_map'

interface SystemRow {
    sysId: string
    name: string
    baseUrl: string
}

interface MapRow {
    mapSysId: string
    active: boolean
    deepLinkPath: string
    oeeInputScale: string
}

interface RunRow {
    status: string
    startedMs: number
    started: string
}

interface Ctx {
    systems: SystemRow[]
    systemName: { [sysId: string]: string }
    /** key: sysId|object */
    maps: { [key: string]: MapRow }
    /** key: mapSysId|logicalField */
    mapped: { [key: string]: boolean }
    /** key: sysId|object */
    latestRun: { [key: string]: RunRow }
    /** key: sysId|object -> the most recent SUCCESS run */
    lastSuccess: { [key: string]: RunRow }
    staleAfterHours: number
    nowMs: number
    canMoney: boolean
}

function ms(value: string): number {
    if (!value) {
        return 0
    }
    return new GlideDateTime(value).getNumericValue()
}

function nowValue(): string {
    return new GlideDateTime().getValue()
}

/** now + days, as a platform datetime string. Negative days looks backwards. */
function shiftedDate(days: number): string {
    const gdt = new GlideDateTime()
    gdt.addDaysUTC(days)
    return gdt.getValue()
}

function intProperty(name: string, fallback: number): number {
    const n = parseInt(String(gs.getProperty(name, String(fallback)) || fallback), 10)
    return isNaN(n) ? fallback : n
}

/**
 * Turn one Where clause into an encoded-query fragment.
 *
 * `propertyValue` and `withinDays` are how D5 works: a threshold property makes a COMPARISON
 * configurable and never invents a FIELD. Changing `asset_high_value_amount` re-shapes the
 * high-value list with no redeploy, and the tile echoes the number it actually compared against.
 */
export function encodeWhere(w: Where): string {
    if (w.propertyValue) {
        return w.field + w.op + String(gs.getProperty(w.propertyValue, '0') || '0')
    }
    if (w.withinDays !== undefined) {
        // A bare number is literal; anything else is a property name (D5).
        const raw = /^-?\d+$/.test(w.withinDays)
            ? w.withinDays
            : String(gs.getProperty(w.withinDays, '0') || '0')
        const days = parseInt(raw, 10)
        return w.field + w.op + shiftedDate(isNaN(days) ? 0 : days)
    }
    return w.field + w.op + String(w.value === undefined ? '' : w.value)
}

function applyWhere(gr: any, where: Where[] | undefined): void {
    if (!where) {
        return
    }
    for (let i = 0; i < where.length; i++) {
        gr.addEncodedQuery(encodeWhere(where[i]))
    }
}

/** Which logical field, if any, this tile needs mapped but is not. '' when nothing is missing. */
function missingFieldFor(ctx: Ctx, mapSysId: string, where: Where[] | undefined): string {
    if (!where || !mapSysId) {
        return ''
    }
    for (let i = 0; i < where.length; i++) {
        const needed = where[i].requiresMapped
        if (needed && !ctx.mapped[mapSysId + '|' + needed]) {
            return needed
        }
    }
    return ''
}

// ---------------------------------------------------------------------------------------
// Queries 1-6: everything that is per-TAB rather than per-tile. Six queries, whatever the
// tab declares.
// ---------------------------------------------------------------------------------------

function loadContext(def: TabDef): Ctx {
    const ctx: Ctx = {
        systems: [],
        systemName: {},
        maps: {},
        mapped: {},
        latestRun: {},
        lastSuccess: {},
        staleAfterHours: intProperty('x_335329_sn_hr_erp.stale_after_hours', 24),
        nowMs: new GlideDateTime().getNumericValue(),
        canMoney: canSeeMoney(),
    }

    // Query 1 -- active systems. Also the ONLY source of a system's display name in this file.
    const sys = new GlideRecord(T_ERP_SYSTEM)
    sys.addQuery('active', true)
    sys.query()
    while (sys.next()) {
        if (!isTrue(sys.getValue('active'))) {
            continue
        }
        const row: SystemRow = {
            sysId: sys.getUniqueValue(),
            name: sys.getValue('name') || '',
            baseUrl: sys.getValue('base_url') || '',
        }
        ctx.systems.push(row)
        ctx.systemName[row.sysId] = row.name
    }
    if (ctx.systems.length === 0) {
        return ctx
    }

    const systemIds: string[] = []
    for (let i = 0; i < ctx.systems.length; i++) {
        systemIds.push(ctx.systems[i].sysId)
    }

    // Query 2 -- every object_map for THIS TAB'S OBJECTS ONLY. This is story L4-1 AC4's
    // structural guard: the object list comes from the tab definition, so no code path can
    // read an object the tab does not declare.
    const mapIds: string[] = []
    const maps = new GlideRecord(T_OBJECT_MAP)
    maps.addQuery('erp_system', 'IN', systemIds.join(','))
    maps.addQuery('logical_object', 'IN', def.objects.join(','))
    maps.query()
    while (maps.next()) {
        const key = String(maps.getValue('erp_system') || '') + '|' + String(maps.getValue('logical_object') || '')
        const mapSysId = maps.getUniqueValue()
        mapIds.push(mapSysId)
        ctx.maps[key] = {
            mapSysId: mapSysId,
            active: isTrue(maps.getValue('active')),
            deepLinkPath: maps.getValue('deep_link_path') || '',
            oeeInputScale: maps.getValue('oee_input_scale') || '',
        }
    }

    // Query 3 -- which logical fields are actually mapped. Needed because L2 T10 made an active
    // map with zero field rows refuse to dial, and because D5's hard limit turns an unmapped
    // comparison field into not_configured NAMING THE FIELD rather than a comparison with zero.
    if (mapIds.length > 0) {
        const fields = new GlideRecord(T_FIELD_MAP)
        fields.addQuery('object_map', 'IN', mapIds.join(','))
        fields.query()
        while (fields.next()) {
            ctx.mapped[String(fields.getValue('object_map') || '') + '|' + String(fields.getValue('logical_field') || '')] = true
        }
    }

    // Query 4 -- the latest run per (system x object), as ONE GlideAggregate max-per-group.
    const startedValues: string[] = []
    const latest = new GlideAggregate(T_SYNC_RUN)
    latest.addQuery('logical_object', 'IN', def.objects.join(','))
    latest.addAggregate('MAX', 'started')
    latest.groupBy('erp_system')
    latest.groupBy('logical_object')
    latest.query()
    const latestStarted: { [key: string]: string } = {}
    while (latest.next()) {
        const key = String(latest.getValue('erp_system') || '') + '|' + String(latest.getValue('logical_object') || '')
        const started = String(latest.getAggregate('MAX', 'started') || '')
        latestStarted[key] = started
        if (started) {
            startedValues.push(started)
        }
    }

    // Query 5 -- those run rows, by their `started` values, in one IN. `error_message` is NOT
    // read (P6): it is not in this projection at all, which is stronger than filtering it out.
    if (startedValues.length > 0) {
        const runs = new GlideRecord(T_SYNC_RUN)
        runs.addQuery('logical_object', 'IN', def.objects.join(','))
        runs.addQuery('started', 'IN', startedValues.join(','))
        runs.query()
        while (runs.next()) {
            const key = String(runs.getValue('erp_system') || '') + '|' + String(runs.getValue('logical_object') || '')
            const started = String(runs.getValue('started') || '')
            if (latestStarted[key] !== started) {
                continue
            }
            ctx.latestRun[key] = { status: String(runs.getValue('status') || ''), startedMs: ms(started), started: started }
        }
    }

    // Query 6 -- the latest SUCCESS run per pair, for the "last good figure" a failed tile
    // carries. The staged rows themselves ARE that figure: a failed run never deletes (L3-D2).
    const good = new GlideAggregate(T_SYNC_RUN)
    good.addQuery('logical_object', 'IN', def.objects.join(','))
    good.addQuery('status', '=', 'success')
    good.addAggregate('MAX', 'started')
    good.groupBy('erp_system')
    good.groupBy('logical_object')
    good.query()
    while (good.next()) {
        const key = String(good.getValue('erp_system') || '') + '|' + String(good.getValue('logical_object') || '')
        const started = String(good.getAggregate('MAX', 'started') || '')
        ctx.lastSuccess[key] = { status: 'success', startedMs: ms(started), started: started }
    }

    return ctx
}

// ---------------------------------------------------------------------------------------
// The per-tile contribution list. ONE aggregate per tile, grouped by system and currency.
// ---------------------------------------------------------------------------------------

interface Agg {
    total: number
    byCurrency: CurrencyAmount[]
    /** A non-numeric SUM was seen for this system: the whole contribution is untrustworthy. */
    bad: boolean
}

function aggregateFor(def: TabDef, tile: KpiDef, ctx: Ctx): { [sysId: string]: Agg } {
    const out: { [sysId: string]: Agg } = {}
    const systemIds: string[] = []
    for (let i = 0; i < ctx.systems.length; i++) {
        systemIds.push(ctx.systems[i].sysId)
    }
    if (systemIds.length === 0) {
        return out
    }

    const ga = new GlideAggregate(T_STAGING)
    // GlideAggregate.addQuery is typed as (field, operator, value) -- the two-argument
    // GlideRecord shorthand does not type-check here, so the operator is always written out.
    ga.addQuery('logical_object', '=', tile.obj)
    ga.addQuery('erp_system', 'IN', systemIds.join(','))
    applyWhere(ga, tile.where)
    if (tile.agg === 'count') {
        // COUNT over sys_id: sys_id is never null, so this is the row count, and the typed
        // signature requires a field.
        ga.addAggregate('COUNT', 'sys_id')
    } else {
        ga.addAggregate('SUM', tile.field as string)
    }
    ga.groupBy('erp_system')
    ga.groupBy('currency_code')
    ga.query()

    while (ga.next()) {
        const sysId = String(ga.getValue('erp_system') || '')
        const cur = String(ga.getValue('currency_code') || '')
        // P3. A COUNT of zero rows is a genuine zero, so `|| '0'` is correct there. A SUM is NOT:
        // an empty or non-numeric aggregate means the column was never mapped or never parsed,
        // and coercing that to 0 renders "Cash balance / 0" as `live` — the exact failure the
        // four-state rule exists to prevent. A bad SUM poisons the whole system contribution,
        // because dropping just the offending currency row would silently understate the total.
        let value: number
        if (tile.agg === 'count') {
            value = parseFloat(String(ga.getAggregate('COUNT', 'sys_id') || '0'))
        } else {
            const raw = String(ga.getAggregate('SUM', tile.field as string) || '')
            value = raw === '' ? NaN : parseFloat(raw)
        }
        if (!out[sysId]) {
            out[sysId] = { total: 0, byCurrency: [], bad: false }
        }
        if (isNaN(value)) {
            out[sysId].bad = true
            continue
        }
        out[sysId].total += value
        out[sysId].byCurrency.push({ cur: cur, v: value })
    }
    // A poisoned system contributes nothing rather than a wrong number: with no entry, the caller
    // reads `null` at line ~348 and the tile resolves to an absence, not to zero.
    for (const sysId in out) {
        if (out[sysId].bad) {
            delete out[sysId]
        }
    }
    return out
}

function contributionsFor(
    def: TabDef,
    object: string,
    where: Where[] | undefined,
    ctx: Ctx,
    aggregates: { [sysId: string]: Agg },
): SystemContribution[] {
    const out: SystemContribution[] = []

    for (let i = 0; i < ctx.systems.length; i++) {
        const system = ctx.systems[i]
        const key = system.sysId + '|' + object
        const map = ctx.maps[key]
        const run = ctx.latestRun[key]
        const success = ctx.lastSuccess[key]
        const agg = aggregates[system.sysId]

        // P3 IN ONE PLACE. A `success` run with no staged rows means the ERP GENUINELY
        // RETURNED ZERO, and that is the one and only path to `v: 0`. Every other absence
        // leaves the value null, which the resolver turns into an absent key.
        let value: number | null = agg === undefined ? null : agg.total
        if (value === null && run && run.status === 'success') {
            value = 0
        }

        out.push({
            sysId: system.sysId,
            name: system.name,
            hasActiveMap: map !== undefined && map.active,
            runStatus: run ? run.status : null,
            fetchedAtMs: run ? run.startedMs : null,
            fetchedAt: run ? run.started : '',
            lastSuccessMs: success ? success.startedMs : null,
            lastSuccessAt: success ? success.started : '',
            value: value,
            byCurrency: agg ? agg.byCurrency : [],
            missingField: missingFieldFor(ctx, map ? map.mapSysId : '', where),
        })
    }

    return out
}

// ---------------------------------------------------------------------------------------
// Tile envelopes. EVERY tile passes through one of these three functions, which is why R4-1
// -- "a tile is added later without `st`" -- is a build error rather than a silent regression.
// ---------------------------------------------------------------------------------------

function kpiTile(def: TabDef, tile: KpiDef, ctx: Ctx): any {
    const out: any = { id: tile.id, lab: tile.lab, fmt: tile.fmt, obj: tile.obj }
    if (tile.note) {
        out.note = tile.note
    }
    if (tile.thr) {
        out.thr = { name: tile.thr.name, kind: tile.thr.kind }
        if (tile.thr.kind === 'property') {
            out.thr.value = intProperty('x_335329_sn_hr_erp.' + tile.thr.name, 0)
        }
    }

    // §6.2 -- a gated tile the caller may not see. `v`, `as_of`, `prev` and `sub` are ABSENT:
    // the figure is not in the response body AT ALL, not merely flagged for the client to hide
    // (story L5-4 AC12 verifies this by reading the network payload). No query is issued for
    // it either, so it cannot leak through a chart or a list column by accident.
    if (tile.gated && !ctx.canMoney) {
        out.st = 'restricted'
        // `sys` is marked ALWAYS present in docs/api-contract.md, and a `restricted` tile is no
        // exception: naming the contributing systems leaks nothing the tab's other tiles do not
        // already name, and a consumer reading the contract table rather than the example is
        // entitled to find it here. See BUG-010.
        out.sys = systemNames(ctx)
        return out
    }

    if (tile.special === 'oee') {
        return oeeTile(def, tile, ctx, out)
    }

    const aggregates = aggregateFor(def, tile, ctx)
    const contributions = contributionsFor(def, tile.obj, tile.where, ctx, aggregates)
    const resolution = resolveTile(contributions, ctx.staleAfterHours, ctx.nowMs, tile.fmt === 'currency')

    return merge(out, resolution, contributions)
}

/**
 * OD7 / L5-D6. One extra query -- the production_output rows themselves, because a weighted
 * mean over per-row products is not a GlideAggregate.
 */
function oeeTile(def: TabDef, tile: KpiDef, ctx: Ctx, out: any): any {
    const systemIds: string[] = []
    for (let i = 0; i < ctx.systems.length; i++) {
        systemIds.push(ctx.systems[i].sysId)
    }

    const supplied: number[] = []
    const components: { availability: number; performance: number; quality: number }[] = []
    const weights: number[] = []

    if (systemIds.length > 0) {
        const rows = new GlideRecord(T_STAGING)
        rows.addQuery('logical_object', 'production_output')
        rows.addQuery('erp_system', 'IN', systemIds.join(','))
        rows.query()
        while (rows.next()) {
            const ratio = String(rows.getValue('ratio') || '')
            const qty = parseFloat(String(rows.getValue('qty') || '0'))
            let payload: any = null
            try {
                payload = JSON.parse(String(rows.getValue('payload') || 'null'))
            } catch (e) {
                payload = null
            }
            if (ratio !== '') {
                supplied.push(parseFloat(ratio))
                weights.push(isNaN(qty) ? 1 : qty)
            } else if (payload) {
                // A truthiness test here silently DROPS any line that was genuinely down —
                // `availability: 0` is falsy — and the survivors then average higher, producing
                // a quietly inflated OEE presented as `live`. Presence, not truthiness: a line
                // reporting zero is real data and must pull the mean down.
                // `Number(null)` is 0, so an explicit JSON null would sneak in as a real zero —
                // it means "no value", which is an absence. Test presence before converting.
                const present = payload.availability != null && payload.performance != null && payload.quality != null
                const a = Number(payload.availability)
                const p = Number(payload.performance)
                const q = Number(payload.quality)
                if (present && !isNaN(a) && !isNaN(p) && !isNaN(q)) {
                    components.push({ availability: a, performance: p, quality: q })
                    weights.push(isNaN(qty) ? 1 : qty)
                }
            }
        }
    }

    // Which of the three inputs are not mapped anywhere. Named INDIVIDUALLY, because
    // "Not configured — 'quality' is not mapped for OEE" is actionable and "OEE not
    // configured" is not.
    const unmapped: string[] = []
    if (supplied.length === 0) {
        const needed = ['availability', 'performance', 'quality']
        for (let n = 0; n < needed.length; n++) {
            let anywhere = false
            for (let i = 0; i < ctx.systems.length; i++) {
                const map = ctx.maps[ctx.systems[i].sysId + '|production_output']
                if (map && ctx.mapped[map.mapSysId + '|' + needed[n]]) {
                    anywhere = true
                }
            }
            if (!anywhere) {
                unmapped.push(needed[n])
            }
        }
    }

    let scale = ''
    for (let i = 0; i < ctx.systems.length; i++) {
        const map = ctx.maps[ctx.systems[i].sysId + '|production_output']
        if (map && map.oeeInputScale) {
            scale = map.oeeInputScale
        }
    }

    const oee = resolveOee({ supplied: supplied, components: components, weights: weights, unmapped: unmapped, scale: scale })

    if (oee.value === null) {
        out.st = 'not_configured'
        out.missing = oee.missing
        return out
    }

    // The tile ALWAYS says which route produced the number, and says when the mean was
    // unweighted -- a line that ran for an hour and a line that ran all week must not count
    // equally, and where `output` is unmapped the user is told so rather than guessing.
    out.origin = oee.origin
    if (oee.unweighted) {
        out.unweighted = true
    }
    if (oee.outOfRange) {
        out.out_of_range = true
    }

    const contributions = contributionsFor(def, 'production_output', undefined, ctx, {})
    const resolution = resolveTile(contributions, ctx.staleAfterHours, ctx.nowMs, false)
    const merged = merge(out, resolution, contributions)
    // The resolver's aggregate value is meaningless for OEE; the weighted mean replaces it,
    // and ONLY where the state permits a figure at all (P2).
    if (merged.st === 'live' || merged.st === 'stale' || merged.st === 'partial') {
        merged.v = oee.value
    } else {
        delete merged.v
    }
    return merged
}

function chartTile(def: TabDef, chart: ChartDef, ctx: Ctx): any {
    const out: any = { id: chart.id, lab: chart.lab, type: chart.type, obj: chart.obj }

    if (chart.gated && !ctx.canMoney) {
        out.st = 'restricted'
        // `sys` is marked ALWAYS present in docs/api-contract.md, and a `restricted` tile is no
        // exception: naming the contributing systems leaks nothing the tab's other tiles do not
        // already name, and a consumer reading the contract table rather than the example is
        // entitled to find it here. See BUG-010.
        out.sys = systemNames(ctx)
        return out
    }

    const systemIds: string[] = []
    for (let i = 0; i < ctx.systems.length; i++) {
        systemIds.push(ctx.systems[i].sysId)
    }

    const categories: string[] = []
    const seen: { [dim: string]: boolean } = {}
    const data: { [seriesIndex: string]: { [dim: string]: number } } = {}
    const missing: string[] = []

    if (systemIds.length > 0) {
        const ga = new GlideAggregate(T_STAGING)
        ga.addQuery('logical_object', '=', chart.obj)
        ga.addQuery('erp_system', 'IN', systemIds.join(','))
        applyWhere(ga, chart.where)
        for (let s = 0; s < chart.series.length; s++) {
            if (chart.series[s].field === 'count') {
                ga.addAggregate('COUNT', 'sys_id')
            } else {
                ga.addAggregate('SUM', chart.series[s].field)
            }
        }
        ga.groupBy('dim')
        ga.orderBy('dim')
        ga.query()
        while (ga.next()) {
            const dim = String(ga.getValue('dim') || '')
            if (!seen[dim]) {
                seen[dim] = true
                categories.push(dim)
            }
            for (let s = 0; s < chart.series.length; s++) {
                const field = chart.series[s].field
                const raw = field === 'count' ? ga.getAggregate('COUNT', 'sys_id') : ga.getAggregate('SUM', field)
                const n = parseFloat(String(raw || ''))
                if (!data[String(s)]) {
                    data[String(s)] = {}
                }
                // NaN means the column is empty for every row in the group, i.e. the field is
                // not mapped. It is LEFT OUT, not written as 0.
                if (!isNaN(n)) {
                    data[String(s)][dim] = n
                }
            }
        }
    }

    const contributions = contributionsFor(def, chart.obj, chart.where, ctx, {})
    // A chart's own state comes from the run, not from its aggregate: a `success` run with no
    // rows is a genuinely empty chart, which is different from an unconfigured one.
    for (let i = 0; i < contributions.length; i++) {
        if (contributions[i].runStatus === 'success') {
            contributions[i].value = 0
        }
    }
    const resolution = resolveTile(contributions, ctx.staleAfterHours, ctx.nowMs, false)
    const merged = merge(out, resolution, contributions)
    delete merged.v
    delete merged.sub

    // §4.2 -- `cat` and `s` are present ONLY under live / stale / partial. Under
    // not_configured or failed they are ABSENT ENTIRELY, because an empty array lets a chart
    // library draw an empty frame and an empty frame reads as "zero revenue" (story L5-4 AC8).
    if (merged.st === 'live' || merged.st === 'stale' || merged.st === 'partial') {
        merged.cat = categories
        merged.s = []
        for (let s = 0; s < chart.series.length; s++) {
            const values: (number | null)[] = []
            let anyPresent = false
            for (let c = 0; c < categories.length; c++) {
                const v = data[String(s)] ? data[String(s)][categories[c]] : undefined
                // P3 again, per category. A category the series has no value for is a GAP, not a
                // zero: zero-filling drops a target line to the axis on any day without data and
                // reads as "output collapsed". `null` is the absence marker; the renderer breaks
                // the line and draws no bar. Only `miss` (below) covers a series absent entirely.
                values.push(v === undefined ? null : v)
                if (v !== undefined) {
                    anyPresent = true
                }
            }
            if (anyPresent) {
                merged.s.push({ lab: chart.series[s].lab, d: values })
            } else {
                // A DECLARED SERIES WITH NO MAPPED FIELD IS NAMED, NOT DRAWN AS ZEROS. Story
                // L5-8's last criterion: an output-vs-target chart with `target` unmapped
                // returns one series and `miss: ["Target not mapped"]`.
                missing.push(chart.series[s].lab + ' not mapped')
            }
        }
        if (missing.length > 0) {
            merged.miss = missing
        }
    }

    return merged
}

function listTile(def: TabDef, list: ListDef, ctx: Ctx): any {
    const out: any = { id: list.id, lab: list.lab, obj: list.obj, cols: [] }
    // The caveat is on the list object IN EVERY STATE, including not_configured and failed --
    // it is the honest state even when the escape route is missing (story L5-5 AC7, AC8).
    if (list.caveat) {
        out.caveat = list.caveat
    }

    for (let c = 0; c < list.cols.length; c++) {
        const col = list.cols[c]
        // A gated COLUMN drops out of `cols` entirely for a caller without finance_viewer, so
        // the header does not advertise a figure that is not in the body (R4-5).
        if (col.gated && !ctx.canMoney) {
            continue
        }
        out.cols.push(col.fmt ? { k: col.k, lab: col.lab, fmt: col.fmt } : { k: col.k, lab: col.lab })
    }

    if (list.gated && !ctx.canMoney) {
        out.st = 'restricted'
        // `sys` is marked ALWAYS present in docs/api-contract.md, and a `restricted` tile is no
        // exception: naming the contributing systems leaks nothing the tab's other tiles do not
        // already name, and a consumer reading the contract table rather than the example is
        // entitled to find it here. See BUG-010.
        out.sys = systemNames(ctx)
        return out
    }

    const contributions = contributionsFor(def, list.obj, list.where, ctx, {})
    for (let i = 0; i < contributions.length; i++) {
        if (contributions[i].runStatus === 'success') {
            contributions[i].value = 0
        }
    }
    const resolution = resolveTile(contributions, ctx.staleAfterHours, ctx.nowMs, false)
    const merged = merge(out, resolution, contributions)
    delete merged.v
    delete merged.sub

    // Under not_configured / failed, `r` is ABSENT. An empty table with a "No records" message
    // reads as "no overdue invoices" and is a FAIL (story L5-4 AC9).
    if (merged.st !== 'live' && merged.st !== 'stale' && merged.st !== 'partial') {
        return merged
    }

    const systemIds: string[] = []
    const baseUrl: { [sysId: string]: string } = {}
    const deepLink: { [sysId: string]: string } = {}
    for (let i = 0; i < ctx.systems.length; i++) {
        systemIds.push(ctx.systems[i].sysId)
        baseUrl[ctx.systems[i].sysId] = ctx.systems[i].baseUrl
        const map = ctx.maps[ctx.systems[i].sysId + '|' + list.obj]
        deepLink[ctx.systems[i].sysId] = map ? map.deepLinkPath : ''
    }

    const rows: any[] = []
    if (systemIds.length > 0) {
        const gr = new GlideRecord(T_STAGING)
        gr.addQuery('logical_object', list.obj)
        gr.addQuery('erp_system', 'IN', systemIds.join(','))
        applyWhere(gr, list.where)
        gr.orderBy(list.orderBy)
        if (list.desc) {
            gr.orderByDesc(list.orderBy)
        }
        gr.setLimit(list.limit)
        gr.query()
        while (gr.next()) {
            const row: any = {}
            for (let c = 0; c < out.cols.length; c++) {
                const value = gr.getValue(out.cols[c].k)
                if (value !== null && value !== '') {
                    row[out.cols[c].k] = value
                }
            }
            // L4-D4 -- THE URL IS BUILT SERVER-SIDE, where base_url and deep_link_path both
            // live. `link` present means the link is COMPLETE. The client never has to decide
            // whether it has enough to draw one, which is how a dead anchor gets drawn.
            const sysId = String(gr.getValue('erp_system') || '')
            const ref = String(gr.getValue('external_ref') || '')
            const path = deepLink[sysId] || ''
            if (ref && path && baseUrl[sysId]) {
                row.link = joinUrl(baseUrl[sysId], path, ref)
            }
            rows.push(row)
        }
    }
    merged.r = rows
    return merged
}

/** base + path + ref, joined on exactly one '/' each (story L5-10 AC4's trailing slash). */
export function joinUrl(base: string, path: string, ref: string): string {
    let b = String(base)
    while (b.length > 0 && b.charAt(b.length - 1) === '/') {
        b = b.substring(0, b.length - 1)
    }
    let p = String(path)
    while (p.length > 0 && p.charAt(0) === '/') {
        p = p.substring(1)
    }
    while (p.length > 0 && p.charAt(p.length - 1) === '/') {
        p = p.substring(0, p.length - 1)
    }
    return b + '/' + p + '/' + encodeURIComponent(ref)
}

/**
 * THE ONE FUNCTION EVERY TILE PASSES THROUGH. P1 and P2 are enforced here and nowhere else.
 *
 * `v` and `sub` are copied ONLY under live / stale / partial. There is no branch that writes
 * `v: null` and no branch that writes `v: 0` as a fallback -- absence is the contract, because
 * a null is a value a careless client renders as blank or zero and an absent key makes a
 * mistake a crash (L4-D2).
 */
/**
 * The contributing systems' display names, for tiles that return before `merge()` runs — the
 * gated `restricted` early-returns. `merge()` derives the same list from the contributions it
 * already holds; this derives it from the context, because a restricted tile issues no query.
 */
function systemNames(ctx: Ctx): string[] {
    const names: string[] = []
    for (let i = 0; i < ctx.systems.length; i++) {
        names.push(ctx.systems[i].name)
    }
    return names
}

function merge(out: any, resolution: any, contributions: SystemContribution[]): any {
    out.st = resolution.st
    out.sys = []
    for (let i = 0; i < contributions.length; i++) {
        out.sys.push(contributions[i].name)
    }

    if (resolution.st === 'live' || resolution.st === 'stale' || resolution.st === 'partial') {
        if (resolution.sub !== undefined) {
            out.sub = resolution.sub
        } else if (resolution.v !== undefined) {
            out.v = resolution.v
        }
    }
    if (resolution.as_of) {
        out.as_of = resolution.as_of
    }
    if (resolution.age_h !== undefined) {
        out.age_h = resolution.age_h
    }
    if (resolution.deg) {
        out.deg = resolution.deg
    }
    if (resolution.missing) {
        out.missing = resolution.missing
    }
    // P5 -- failed carries EITHER prev OR no_prev. Never neither.
    if (resolution.prev) {
        out.prev = resolution.prev
    }
    if (resolution.no_prev) {
        out.no_prev = true
    }
    return out
}

export interface HubResponse {
    status: number
    body: any
}

/**
 * `GET /data?tab=<name>`. One call renders a whole tab (story L4-1 AC1) -- a tab needing two
 * calls fails T4-1.
 */
export function buildTab(tab: string): HubResponse {
    resetRoleCache()

    if (!tab) {
        return { status: 400, body: { error: "Missing required parameter 'tab'." } }
    }
    const def = TABS[tab]
    if (!def) {
        // A 400 NAMING THE VALUE, not a 200 with an empty body and not a 500. "That tab does
        // not exist" and "this API does not exist" are different sentences (L4-D5).
        return { status: 400, body: { error: "Unknown tab '" + tab + "'.", tabs: tabNames() } }
    }

    const ctx = loadContext(def)

    const body: any = {
        tab: def.tab,
        lab: def.lab,
        // When THIS PAYLOAD was built. NOT a data timestamp -- every data timestamp is `as_of`,
        // and conflating the two is how a stale figure gets a fresh-looking clock beside it.
        gen: nowValue(),
        stale_h: ctx.staleAfterHours,
        k: [],
        c: [],
        l: [],
    }
    if (def.note) {
        body.note = def.note
    }

    for (let i = 0; i < def.k.length; i++) {
        body.k.push(kpiTile(def, def.k[i], ctx))
    }
    for (let i = 0; i < def.c.length; i++) {
        body.c.push(chartTile(def, def.c[i], ctx))
    }
    for (let i = 0; i < def.l.length; i++) {
        body.l.push(listTile(def, def.l[i], ctx))
    }

    return { status: 200, body: body }
}

/**
 * `POST /refresh`. Enqueues a sync for ONLY the active tab's objects and returns immediately.
 *
 * NOT A GET, because it has an effect. NOT SYNCHRONOUS, because a tab open must not block on an
 * ERP that may be timing out. This is the one route that could fan out, so the guard is in the
 * signature: it takes a tab and there is no variant that takes nothing (story L3-3 AC6).
 */
export function queueRefresh(tab: string): HubResponse {
    if (!tab) {
        return { status: 400, body: { error: "Missing required parameter 'tab'." } }
    }
    const def = TABS[tab]
    if (!def) {
        return { status: 400, body: { error: "Unknown tab '" + tab + "'.", tabs: tabNames() } }
    }

    // The category is derived from the tab's own objects, so a refresh can never reach an
    // object the tab does not declare.
    const category = categoryOfTab(def)
    if (!category) {
        return { status: 400, body: { error: "Tab '" + tab + "' declares no staged objects." } }
    }

    const gr = new GlideRecord('x_335329_sn_hr_erp_sync_request')
    gr.initialize()
    gr.setValue('erp_category', category)
    gr.setValue('requested_at', nowValue())
    gr.setValue('drained', false)
    // "Never draw a button that can't commit its decision." `insert()` returns null when the write
    // is refused, and a scoped GlideRecord runs security-aware in the CALLER's session — so a user
    // without the create ACL would otherwise get HTTP 200 `{queued: true}` with nothing queued, and
    // the UI would print the full success sentence. Report the refusal instead of asserting success.
    const queuedId = gr.insert()
    if (!queuedId) {
        return {
            status: 500,
            body: { error: 'The refresh could not be queued. Nothing was scheduled — your role may not permit it.' },
        }
    }

    let systems = 0
    const sys = new GlideRecord(T_ERP_SYSTEM)
    sys.addQuery('active', true)
    sys.query()
    while (sys.next()) {
        systems++
    }

    return { status: 200, body: { queued: true, objects: def.objects, systems: systems } }
}

/** Each tab maps 1:1 onto an erp_category by construction; this reads it off the tab name. */
function categoryOfTab(def: TabDef): string {
    const byTab: { [tab: string]: string } = {
        financial: 'finance',
        procurement: 'procurement',
        inventory: 'inventory',
        assets: 'assets',
        manufacturing: 'manufacturing',
    }
    return byTab[def.tab] || ''
}
