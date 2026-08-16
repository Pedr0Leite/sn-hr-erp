import { CONNECTOR_CONSTANTS } from './constants.ts'
import { nowMs } from './util.ts'

/**
 * Exponential backoff with full jitter, hard-capped (design §4.4).
 *
 * FORMULA — k is the retry number, 1-based:
 *
 *   base(k)   = backoff_ms * BACKOFF_MULTIPLIER^(k-1)
 *   capped(k) = min(base(k), MAX_BACKOFF_SLEEP_MS)
 *   delay(k)  = floor(random() * capped(k))                       // full jitter
 *   if Retry-After: delay = min(max(delay, retryAfterMs), MAX_BACKOFF_SLEEP_MS)
 *
 * WHY FULL JITTER (D12): fixed-interval retry synchronises. When an ERP hiccups, every agent
 * with a 360-view open retries at the same instant, and the recovering host is hit by the herd
 * that just knocked it over. Full jitter — random(0, cap) — is the standard de-correlation for
 * one Math.random(). Equal and decorrelated jitter need more state for no benefit at
 * max_retries <= 5.
 *
 * At platform defaults (backoff_ms 500, max_retries 2) the two sleeps are random(0,500) and
 * random(0,1000): at most 1.5 s of added latency on a fully failed call. That matters because
 * the eventual caller (Phase 3's virtual table) is synchronous and user-facing.
 */

/**
 * Compute the delay before retry number `k` (1-based).
 *
 * `remainingBudgetMs` is passed for symmetry with the design signature; the authoritative
 * budget enforcement is the orchestrator's C9 guard (elapsed + delay + timeoutMs), which can
 * decide to abandon the call entirely rather than merely shorten the nap.
 */
export function computeDelayMs(
    retryNumber: number,
    backoffMs: number,
    retryAfterMs: number | null,
    remainingBudgetMs: number,
): number {
    const k = retryNumber < 1 ? 1 : retryNumber
    const safeBackoff = backoffMs > 0 ? backoffMs : 0

    const base = safeBackoff * Math.pow(CONNECTOR_CONSTANTS.BACKOFF_MULTIPLIER, k - 1)
    const capped = Math.min(base, CONNECTOR_CONSTANTS.MAX_BACKOFF_SLEEP_MS)

    let delay = Math.floor(Math.random() * capped)

    // D15: Retry-After is the ERP telling us exactly when to come back; ignoring it is the
    // fastest way to get rate-limit-banned. Clamped because a server may say "3600" and we
    // cannot hold a user-facing transaction for an hour.
    if (retryAfterMs !== null && retryAfterMs !== undefined && retryAfterMs > 0) {
        delay = Math.min(Math.max(delay, retryAfterMs), CONNECTOR_CONSTANTS.MAX_BACKOFF_SLEEP_MS)
    }

    if (remainingBudgetMs !== null && remainingBudgetMs !== undefined && remainingBudgetMs >= 0) {
        delay = Math.min(delay, remainingBudgetMs)
    }

    return delay < 0 ? 0 : delay
}

/**
 * Sleep primitive — BOUNDED BUSY-WAIT.
 *
 * WHY NOT gs.sleep: the sibling app's build-order spike 0.3 executed it live on THIS SAME
 * instance (dev296062) inside a scoped module on 2026-08-10 and it THREW:
 *
 *     com.glide.script.fencing.MethodNotAllowedException:
 *     Function sleep is not allowed in scope <the sibling scope>
 *
 * The scope name in that message was the sibling's, not this app's — the fence is per-scope and
 * the observation has NOT been repeated under x_335329_sn_hr_erp. It is not repeated here either,
 * because the design forbids writing both primitives and branching (D27) and because the busy
 * wait is correct regardless of whether gs.sleep would have worked.
 *
 * `gs.sleep` is declared in @servicenow/glide's typings, so it type-checks perfectly and a
 * clean build proves nothing about it — the exact shape of the Phase 1 defect. OD10 is
 * therefore RESOLVED as "unavailable", and per D27 we implement ONLY the proven primitive
 * rather than writing both and branching at runtime.
 *
 * THIS BURNS A WORKER THREAD. It occupies a semaphore-limited platform worker doing nothing but
 * checking a clock. That is precisely why MAX_BACKOFF_SLEEP_MS is aggressive at 5 s and why the
 * orchestrator's C9 budget guard is not optional: the cap is the only thing standing between
 * this function and a thread-pool exhaustion incident.
 *
 * Do not "improve" this into an unbounded wait, and do not raise the cap without re-deriving it.
 */
export function sleepMs(ms: number): void {
    if (!ms || ms <= 0) {
        return
    }

    // Hard cap, defensively re-applied here as well as in computeDelayMs. This function is the
    // last line of defence, so it does not trust its caller.
    const target = Math.min(ms, CONNECTOR_CONSTANTS.MAX_BACKOFF_SLEEP_MS)
    const deadline = nowMs() + target

    // The loop body must stay empty of platform calls other than the clock read: anything else
    // multiplies the cost of an already-wasteful wait.
    while (nowMs() < deadline) {
        /* intentionally empty — bounded by `deadline` above */
    }
}
