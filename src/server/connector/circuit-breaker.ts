import { GlideRecord } from '@servicenow/glide'
import { CONNECTOR_CONSTANTS } from './constants.ts'
import { nowMs, toGlideDateTime } from './util.ts'
import type { SystemConfig } from './types.ts'

/**
 * Three states, one column.
 *
 * PORTED from the sibling app. Changes: the two table constants (§2.1), and the ONE line in
 * recordFailure() that §4.2 requires — the failure counter must exclude `not_configured` as
 * well as `circuit_open`.
 *
 * The breaker's ENTIRE state lives in `erp_system.circuit_open_until`. No counter column, no
 * system property, no cache entry.
 *
 *   | circuit_open_until      | State     | Behaviour                                  |
 *   |-------------------------|-----------|--------------------------------------------|
 *   | empty                   | CLOSED    | Call normally.                             |
 *   | in the FUTURE           | OPEN      | Refuse before dialling; log a refusal row. |
 *   | populated, in the PAST  | HALF_OPEN | Cooldown elapsed; this caller is the trial.|
 *
 * THAT THIRD ROW IS NOT A BUG. A reviewer will assume "expired means closed" and try to
 * simplify it away. "Populated but expired" is an unambiguous third state that costs no extra
 * column, needs no L1 schema change, and self-heals if a node dies mid-probe (the probe lease
 * simply expires). Deleting it would leave the breaker able to reset only via a call it is
 * itself refusing, or an admin clearing the field by hand.
 */

const T_ERP_SYSTEM = 'x_335329_sn_hr_erp_erp_system'
const T_CALL_LOG = 'x_335329_sn_hr_erp_call_log'

export type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export function readState(system: SystemConfig): BreakerState {
    const until = system.circuitOpenUntilMs
    if (until === null || until === undefined) {
        return 'CLOSED'
    }
    return until > nowMs() ? 'OPEN' : 'HALF_OPEN'
}

/**
 * Write `circuit_open_until` on the system row.
 *
 * `setWorkflow(false)` is deliberately NOT used. `erp_system` has `audit: true`, and the audit
 * trail of breaker trips, probe leases and resets is exactly the history that flag exists for.
 * Suppressing workflow would suppress the audit too.
 *
 * Returns false if the write did not stick — which, under a non-admin invoking user, is the
 * failure mode `erp_system.write` being admin-only would produce.
 */
function writeCircuitOpenUntil(sysId: string, value: string): boolean {
    try {
        const gr = new GlideRecord(T_ERP_SYSTEM)
        if (!gr.get(sysId)) {
            return false
        }
        gr.setValue('circuit_open_until', value)
        const updated = gr.update()
        return !!updated
    } catch (e) {
        return false
    }
}

/**
 * Claim the half-open probe: push `circuit_open_until` out by CB_PROBE_LEASE_MS BEFORE dialling,
 * so concurrent callers read OPEN and fail fast instead of all probing a host that is down.
 *
 * Residual race, accepted and documented: two nodes can both read HALF_OPEN before either
 * writes the lease, costing one extra request against a host we were about to call anyway. A
 * real lock (sys_mutex / GlideNativeRecordMutex) inside a user-facing transaction has deadlock
 * and lock-leak failure modes far worse than the duplicate probe it would prevent.
 */
export function takeProbeLease(system: SystemConfig): boolean {
    return writeCircuitOpenUntil(system.sysId, toGlideDateTime(nowMs() + CONNECTOR_CONSTANTS.CB_PROBE_LEASE_MS))
}

/**
 * Clear the breaker after a success.
 *
 * Writes ONLY IF the field is currently non-empty. A healthy system must never be written to —
 * `erp_system` is audited, and a write per successful call would bury the connection-config
 * history the audit flag exists for. `system.circuitOpenUntilMs` was read at the start of this
 * call, which is the correct thing to test: it is what decided we were probing.
 */
export function recordSuccess(system: SystemConfig): boolean {
    if (system.circuitOpenUntilMs === null || system.circuitOpenUntilMs === undefined) {
        return false
    }
    return writeCircuitOpenUntil(system.sysId, '')
}

/**
 * Count the most recent attempt rows and trip the breaker if ALL of them are non-success.
 *
 * Failure counting is DERIVED from `call_log`, not stored. Rejected alternative: a
 * `consecutive_failures` column on `erp_system` — that table is audited, so a per-call counter
 * would emit a sys_audit row per attempt on a governance table and contend on a hot config row.
 * `call_log` is already written, already indexed on (erp_system, started), and volume-tuned.
 *
 * Query shape matters:
 *   - orders by `started` DESC, aligning with idx_call_log_system_started
 *   - limits to CB_FAILURE_THRESHOLD
 *   - EXCLUDES `circuit_open` AND `not_configured` rows — see below.
 *
 * A success anywhere in the window means flaky, not down, so the breaker does not trip.
 *
 * Ordering ties are possible because `started` has second granularity. The check is "are all N
 * non-success", so a tie only matters at the exact boundary — a benign, documented imprecision.
 *
 * Returns true if THIS call opened the breaker.
 */
export function recordFailure(system: SystemConfig): boolean {
    const threshold = CONNECTOR_CONSTANTS.CB_FAILURE_THRESHOLD

    const gr = new GlideRecord(T_CALL_LOG)
    gr.addQuery('erp_system', system.sysId)

    // ---------------------------------------------------------------------------------------
    // THE SINGLE MOST DANGEROUS LINE IN THE PORT (§4.2, R2-1). It is one word away from being
    // right and it fails SILENTLY.
    //
    // The counter must count evidence about the ERP, not evidence about US.
    //   - `circuit_open` rows are our own refusals. An open breaker can generate hundreds per
    //     minute; letting them in would keep it latched open forever.
    //   - `not_configured` rows are a MISSING OR EMPTY OBJECT MAP. That is a fact about our
    //     configuration and says nothing about whether the ERP is up. If they counted, one
    //     unmapped object would trip the breaker on a perfectly healthy ERP and take the other
    //     13 objects down with it.
    //
    // The sibling's form was `addQuery('status', '!=', 'circuit_open')`. Rewriting it that way
    // here is R2-1 exactly. T2-13 exists solely for this line.
    // ---------------------------------------------------------------------------------------
    gr.addQuery('status', 'NOT IN', 'circuit_open,not_configured')

    gr.orderByDesc('started')
    gr.setLimit(threshold)
    gr.query()

    let rows = 0
    let sawSuccess = false
    while (gr.next()) {
        rows++
        if (gr.getValue('status') === 'success') {
            sawSuccess = true
        }
    }

    if (rows < threshold || sawSuccess) {
        return false
    }

    return writeCircuitOpenUntil(system.sysId, toGlideDateTime(nowMs() + CONNECTOR_CONSTANTS.CB_COOLDOWN_MS))
}

/** Admin utility: clear the breaker. Bypasses nothing an admin could not do by editing the field. */
export function resetCircuit(erpSystemSysId: string): boolean {
    return writeCircuitOpenUntil(erpSystemSysId, '')
}
