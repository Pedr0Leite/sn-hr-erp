/**
 * L4-2. THE STATE RESOLVER -- the single place kickoff §7 is decided.
 *
 * NO PLATFORM DEPENDENCY. Not one import. Every function here is pure: plain inputs in, a state
 * out. That is L4-D7 and it is not stylistic -- the four-state rule IS the product, and the
 * product's core logic must not require an ERP outage, a fixture or a browser to exercise.
 * L5's renderer turns a state into a sentence; it never works out which state applies, which is
 * why L5 has no state logic at all.
 *
 * THE RULE, restated because everything below is an implementation of it:
 *
 *   live            an ERP answered and this is what it said      -> the figure + "as of"
 *   not configured  no active object map for this object          -> "create an Object Map for X"
 *   failed          a map exists, a call was made, no answer      -> "ERP did not answer" + last good figure
 *   stale           the last successful sync is past a threshold  -> the figure, flagged with its age
 *
 *   `0` IS ONLY EVER PRODUCED WHEN AN ERP ACTUALLY RETURNED ZERO. Every other path leaves `v`
 *   ABSENT -- not null, not 0. `null` is a value a careless client renders as blank or zero;
 *   an absent key makes `'v' in tile` the only way to read it and makes a mistake a crash
 *   rather than a wrong number (L4-D2).
 */

export type TileState = 'live' | 'stale' | 'failed' | 'not_configured' | 'partial' | 'restricted'

/** D11 -- one currency's honest subtotal. */
export interface CurrencyAmount {
    cur: string
    v: number
}

/** What ONE contributing (system x object) pair looks like to the resolver. */
export interface SystemContribution {
    sysId: string
    name: string
    /** An ACTIVE object_map on an ACTIVE system. False => not_configured, whatever else is true. */
    hasActiveMap: boolean
    /** 'success' | 'partial' | 'failed' | 'not_configured', or null when no run has ever happened. */
    runStatus: string | null
    /** Epoch ms of the data's fetched time. null when there is no run. */
    fetchedAtMs: number | null
    /** Display string for the same instant, formatted by the caller (this file stays pure). */
    fetchedAt: string
    /** Epoch ms of the most recent SUCCESS run, or null when there has never been one. */
    lastSuccessMs: number | null
    lastSuccessAt: string
    /** This system's contribution to the figure. null means it produced none. */
    value: number | null
    /** Per-currency split. More than one non-empty code triggers D11's subtotal contract. */
    byCurrency: CurrencyAmount[]
    /**
     * A logical field this tile REQUIRES that is not mapped on this system -- `safety_stock` on
     * `stock_item`, `target` on `production_output`. D5's hard limit: a threshold property makes
     * a COMPARISON configurable, it never invents a FIELD. Unmapped => not_configured naming
     * the field, NEVER a comparison against an implicit zero and never `0`.
     */
    missingField: string
}

export interface Resolution {
    st: TileState
    v?: number
    /** D11. Present INSTEAD of `v` when contributing rows carry more than one currency. */
    sub?: CurrencyAmount[]
    as_of?: string
    age_h?: number
    /** Which system (or which currencies) degraded this tile. */
    deg?: string
    prev?: { v: number; as_of: string; age_h: number }
    no_prev?: boolean
    /** The unmapped field name, so L5 can name it in the not-configured sentence. */
    missing?: string
}

const MS_PER_HOUR = 3600000

export function ageHours(fromMs: number, nowMs: number): number {
    return Math.floor((nowMs - fromMs) / MS_PER_HOUR)
}

/** The per-system state, before any aggregation. */
export function stateOf(c: SystemContribution, staleAfterHours: number, nowMs: number): TileState {
    if (!c.hasActiveMap) {
        return 'not_configured'
    }
    if (c.missingField) {
        return 'not_configured'
    }
    if (c.runStatus === null || c.runStatus === 'not_configured') {
        return 'not_configured'
    }
    if (c.runStatus === 'failed') {
        return 'failed'
    }
    if (c.runStatus === 'partial') {
        return 'partial'
    }
    // success
    if (c.fetchedAtMs !== null && ageHours(c.fetchedAtMs, nowMs) >= staleAfterHours) {
        return 'stale'
    }
    return 'live'
}

/** Distinct non-empty currency codes across every contributing system. */
export function currenciesOf(contributions: SystemContribution[]): string[] {
    const seen: { [code: string]: boolean } = {}
    const out: string[] = []
    for (let i = 0; i < contributions.length; i++) {
        const list = contributions[i].byCurrency || []
        for (let j = 0; j < list.length; j++) {
            const code = String(list[j].cur || '')
            if (code !== '' && !seen[code]) {
                seen[code] = true
                out.push(code)
            }
        }
    }
    return out
}

/** Per-currency subtotals summed across the answering systems (D11). */
export function subtotalsOf(contributions: SystemContribution[]): CurrencyAmount[] {
    const totals: { [code: string]: number } = {}
    const order: string[] = []
    for (let i = 0; i < contributions.length; i++) {
        const list = contributions[i].byCurrency || []
        for (let j = 0; j < list.length; j++) {
            const code = String(list[j].cur || '')
            if (totals[code] === undefined) {
                totals[code] = 0
                order.push(code)
            }
            totals[code] += list[j].v
        }
    }
    const out: CurrencyAmount[] = []
    for (let i = 0; i < order.length; i++) {
        out.push({ cur: order[i], v: totals[order[i]] })
    }
    return out
}

/**
 * §5.3 / §0 R4 -- the tile's state is the WORST state among contributing systems, and the tile
 * names which system degraded it.
 *
 *   not_configured > failed > partial > stale > live
 *
 * `not_configured` outranks `failed` DELIBERATELY (L4-D3): an object mapped on system A and not
 * mapped at all on system B is showing a number for part of the estate while silently omitting
 * the rest, and "B was never configured" is a more accurate and more actionable sentence than
 * "we could not reach B".
 *
 * THE EXCEPTION, AND IT MATTERS: if at least one system is live/stale and another is
 * failed/partial, the tile is PARTIAL -- it carries `v` from the systems that answered and
 * names the one that did not. Otherwise a single broken system in a ten-system estate would
 * blank a figure nine systems answered. Only when NO system produced a figure does the tile go
 * to `failed` and drop `v`.
 */
export function resolveTile(
    contributions: SystemContribution[],
    staleAfterHours: number,
    nowMs: number,
    isCurrency: boolean,
): Resolution {
    // No contributing system at all: nothing is mapped anywhere.
    if (!contributions || contributions.length === 0) {
        return { st: 'not_configured' }
    }

    const notConfigured: SystemContribution[] = []
    const failed: SystemContribution[] = []
    const degraded: SystemContribution[] = []
    const answered: SystemContribution[] = []
    let worstAnsweredStale = false
    let missing = ''

    for (let i = 0; i < contributions.length; i++) {
        const c = contributions[i]
        const st = stateOf(c, staleAfterHours, nowMs)
        if (st === 'not_configured') {
            notConfigured.push(c)
            if (!missing && c.missingField) {
                missing = c.missingField
            }
        } else if (st === 'failed') {
            failed.push(c)
        } else if (st === 'partial') {
            degraded.push(c)
            if (c.value !== null) {
                answered.push(c)
            }
        } else {
            answered.push(c)
            if (st === 'stale') {
                worstAnsweredStale = true
            }
        }
    }

    if (notConfigured.length > 0) {
        const out: Resolution = { st: 'not_configured', deg: notConfigured[0].name }
        if (missing) {
            out.missing = missing
        }
        return out
    }

    // Nobody produced a figure, but the only reason is an incomplete fetch. `partial` with NO
    // `v` -- honest about both halves: the run happened, and it does not add up to a number.
    if (answered.length === 0 && failed.length === 0 && degraded.length > 0) {
        return { st: 'partial', deg: degraded[0].name }
    }

    // Nobody answered. `failed`, and it carries EITHER prev OR no_prev -- never neither (P5).
    if (answered.length === 0) {
        const out: Resolution = { st: 'failed', deg: (failed[0] || degraded[0] || contributions[0]).name }
        const withHistory = pickLastSuccess(contributions)
        if (withHistory && withHistory.lastSuccessMs !== null) {
            // The staged rows ARE the last good figures: a failed run never deletes (L3-D2), so
            // the aggregate the caller computed is exactly what the last success left behind.
            out.prev = {
                v: sumValues(contributions),
                as_of: withHistory.lastSuccessAt,
                age_h: ageHours(withHistory.lastSuccessMs, nowMs),
            }
            out.as_of = withHistory.lastSuccessAt
        } else {
            out.no_prev = true
        }
        return out
    }

    const newest = newestAnswer(answered)
    const out: Resolution = { st: 'live' }

    if (failed.length > 0 || degraded.length > 0) {
        out.st = 'partial'
        out.deg = (failed[0] || degraded[0]).name
    } else if (worstAnsweredStale) {
        out.st = 'stale'
    } else {
        out.st = 'live'
    }

    if (newest) {
        out.as_of = newest.fetchedAt
        if (newest.fetchedAtMs !== null && out.st === 'stale') {
            out.age_h = ageHours(newest.fetchedAtMs, nowMs)
        }
    }

    // D11 -- MIXED CURRENCY. No code path silently adds GBP to EUR. Rather than blanking the
    // tile (the original design's answer, rejected by the product owner as honest but blunt),
    // the tile carries the per-currency subtotals it can honestly state and names the
    // currencies as the degrading factor.
    if (isCurrency) {
        const codes = currenciesOf(answered)
        if (codes.length > 1) {
            out.st = 'partial'
            out.sub = subtotalsOf(answered)
            out.deg = codes.join(' / ')
            // `v` DELIBERATELY ABSENT. A scalar here would be a meaningless total.
            return out
        }
    }

    out.v = sumValues(answered)
    return out
}

function sumValues(contributions: SystemContribution[]): number {
    let total = 0
    for (let i = 0; i < contributions.length; i++) {
        if (contributions[i].value !== null) {
            total += contributions[i].value as number
        }
    }
    return total
}

function newestAnswer(answered: SystemContribution[]): SystemContribution | null {
    let best: SystemContribution | null = null
    for (let i = 0; i < answered.length; i++) {
        const c = answered[i]
        if (c.fetchedAtMs === null) {
            continue
        }
        if (best === null || (best.fetchedAtMs as number) < c.fetchedAtMs) {
            best = c
        }
    }
    return best
}

function pickLastSuccess(contributions: SystemContribution[]): SystemContribution | null {
    let best: SystemContribution | null = null
    for (let i = 0; i < contributions.length; i++) {
        const c = contributions[i]
        if (c.lastSuccessMs === null) {
            continue
        }
        if (best === null || (best.lastSuccessMs as number) < c.lastSuccessMs) {
            best = c
        }
    }
    return best
}

/**
 * OD7 / L5-D6 -- the OEE precedence, as a pure function.
 *
 *  1. `oee` mapped and present            -> the figure, "Supplied by <system>"
 *  2. all three components mapped         -> availability x performance x quality
 *  3. any component unmapped              -> not_configured NAMING EACH MISSING INPUT
 *  4. the three mapped but scale unset    -> not_configured naming `oee_input_scale`
 *
 * NEVER substitutes 1.0 for a missing factor, never treats it as neutral, never renders a
 * partial product. A two-factor product looks like a plausible OEE and is wrong by the whole
 * third factor -- and a silently-wrong OEE is a number executives act on.
 *
 * Aggregation across lines is a WEIGHTED mean, weighted by output: a line that ran for an hour
 * and a line that ran all week must not count equally. With `output` unmapped a plain mean is
 * used AND the caller states so.
 */
export interface OeeInputs {
    /** Supplied per-row oee values, already normalised to 0-1 by the sync engine. */
    supplied: number[]
    /** Component triples, already normalised to 0-1. */
    components: { availability: number; performance: number; quality: number }[]
    /** Weights (output) parallel to whichever list is used; empty means unweighted. */
    weights: number[]
    /** Logical field names declared by the tile but not mapped on this system. */
    unmapped: string[]
    /** '' when the three components are mapped and `oee_input_scale` is unset. */
    scale: string
}

export interface OeeResult {
    value: number | null
    /** '' when value is non-null. Otherwise the field(s) to name in the sentence. */
    missing: string
    /** 'supplied' | 'computed' | '' -- L5 renders which was used. */
    origin: string
    /** True when `output` was unmapped and a plain mean was used instead. */
    unweighted: boolean
    /** Set when the result falls outside 0-1: "OEE out of range". */
    outOfRange: boolean
}

export function resolveOee(inputs: OeeInputs): OeeResult {
    const out: OeeResult = { value: null, missing: '', origin: '', unweighted: false, outOfRange: false }

    let values: number[] = []
    if (inputs.supplied && inputs.supplied.length > 0) {
        values = inputs.supplied
        out.origin = 'supplied'
    } else {
        if (inputs.unmapped && inputs.unmapped.length > 0) {
            out.missing = inputs.unmapped.join(', ')
            return out
        }
        if (!inputs.scale) {
            // The unit trap: 0.85 x 0.90 x 0.95 = 0.727 and 85 x 90 x 95 = 726,750 both look
            // plausible. Inferring the scale is a heuristic standing between an executive and a
            // wrong number, so an unset scale is not_configured naming the column.
            out.missing = 'oee_input_scale'
            return out
        }
        const rows = inputs.components || []
        for (let i = 0; i < rows.length; i++) {
            values.push(rows[i].availability * rows[i].performance * rows[i].quality)
        }
        out.origin = 'computed'
    }

    if (values.length === 0) {
        out.missing = 'production_output'
        out.origin = ''
        return out
    }

    const weights = inputs.weights || []
    out.unweighted = weights.length !== values.length
    let numerator = 0
    let denominator = 0
    for (let i = 0; i < values.length; i++) {
        const w = out.unweighted ? 1 : weights[i]
        numerator += values[i] * w
        denominator += w
    }
    if (denominator === 0) {
        out.missing = 'production_output'
        out.origin = ''
        return out
    }

    const result = numerator / denominator
    out.value = result
    out.outOfRange = result < 0 || result > 1
    return out
}
