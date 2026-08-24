import { GlideDateTime, GlideRecord } from '@servicenow/glide'

/**
 * NV-16 -- client-side throttling from VENDOR-STATED figures only.
 *
 * WHY THE DEFAULT IS 80% AND NOT 100%. The Unit4 compendium §12.1 documents the behaviour on
 * breach: "when exceeded, subsequent requests are suspended for one minute". Not queued --
 * SUSPENDED, for the whole environment. So a breach is not a slow request for one caller, it is a
 * one-minute outage for every employee on that tenant. Throttling at the exact published limit
 * means the first burst of concurrent traffic takes everyone down. 80% is a margin, and it is
 * configurable per system because only the vendor knows how they count.
 *
 * WITH NO STATED LIMIT, NOTHING IS THROTTLED. A guessed throttle is the invented-field-name
 * failure in another costume: it looks like protection and is actually a made-up number that
 * silently caps a tenant which could have gone faster. The control tower renders
 * "Rate limit not stated by vendor" instead.
 */

export interface ThrottleDecision {
    /** May the call go now? */
    allow: boolean
    /** How long the caller would have to wait, in ms. 0 when allow is true. */
    waitMs: number
    /**
     * Employee-facing reads must NOT render this as `failed` -- that would report an ERP which
     * would have answered as one that did not. NV-16 renders this exact string instead.
     */
    message: string
}

const WINDOW_MS = 60000

/** Effective ceiling after the safety margin. Returns 0 when the vendor stated no limit. */
export function effectiveLimit(rateLimitPerMin: number, safetyPct: number): number {
    const limit = Number(rateLimitPerMin || 0)
    if (!limit) {
        return 0
    }
    const pct = Number(safetyPct || 80)
    const effective = Math.floor((limit * pct) / 100)
    // A safety percentage so low it forbids all traffic is a configuration error, not a policy.
    return effective > 0 ? effective : 1
}

/**
 * Count calls to this system in the trailing minute and decide.
 *
 * Counts from `call_log`, which every outbound attempt already writes -- so the throttle observes
 * real traffic including retries, rather than a counter that drifts from reality the first time
 * a call path forgets to increment it.
 */
export function checkThrottle(systemId: string, rateLimitPerMin: number, safetyPct: number): ThrottleDecision {
    const effective = effectiveLimit(rateLimitPerMin, safetyPct)
    if (!effective) {
        return { allow: true, waitMs: 0, message: '' }
    }

    const since = new GlideDateTime()
    since.subtract(WINDOW_MS)

    const gr = new GlideRecord('x_335329_sn_hr_erp_call_log')
    gr.addQuery('erp_system', systemId)
    // Business fields only. Filtering an app table on sys_created_on returns 403 even as full
    // admin -- field-level read ACLs gate the QUERY, not just the response (CLAUDE.md, Commands).
    gr.addQuery('started', '>=', since.getValue())
    gr.query()
    const used = gr.getRowCount()

    if (used < effective) {
        return { allow: true, waitMs: 0, message: '' }
    }
    return {
        allow: false,
        waitMs: WINDOW_MS,
        message: 'Too many requests right now -- try again shortly',
    }
}

/**
 * Does a queued call still fit inside the caller's read budget?
 *
 * NV-13 gives every employee-facing read a synchronous timeout; NV-16 queues calls above the
 * limit. Left alone those two fight: a queued READ burns its budget waiting and then renders
 * `failed`. Queue time counts against the budget, and a read that cannot dispatch inside it gets
 * the throttle message -- a fifth thing, distinct from live/failed/not configured/stale.
 */
export function fitsReadBudget(waitMs: number, readTimeoutMs: number): boolean {
    return Number(waitMs || 0) < Number(readTimeoutMs || 0)
}
