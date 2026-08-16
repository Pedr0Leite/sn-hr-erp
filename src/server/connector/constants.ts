/**
 * L2 Connector Runtime — tuning constants (design companion §7).
 *
 * Every number here is DERIVED, not chosen. The derivation comment is part of the constant:
 * a future reader who cannot see why 5000 is 5000 will "improve" it. Do not delete the comments.
 */
export const CONNECTOR_CONSTANTS = {
    /**
     * Hard wall-clock budget for one logical call (all attempts + all sleeps).
     *
     * Derivation: the platform cancels a synchronous transaction at the instance quota
     * (default 300 000 ms). 60 000 leaves a 5x safety margin. It is also 2x the effective
     * per-attempt HTTP ceiling implied by `glide.http.outbound.max_timeout` (30 s default, OD11).
     *
     * This is what makes an admin-configured `timeout_ms = 120000, max_retries = 5` — a
     * 12-minute worst case on paper — impossible in practice (C9).
     */
    MAX_TOTAL_CALL_MS: 60000,

    /**
     * Ceiling on any single backoff sleep.
     *
     * Derivation: user patience. The eventual caller (Phase 3's virtual table) is synchronous
     * and user-facing — an agent is watching a form section spin. Beyond ~5 s of pure waiting
     * between attempts, failing fast beats succeeding late.
     *
     * It is also why the busy-wait fallback for `sleepMs` (§4.4) is tolerable: the worst case
     * CPU burn is bounded by this number.
     */
    MAX_BACKOFF_SLEEP_MS: 5000,

    /**
     * Exponential doubling factor: base(k) = backoff_ms * MULTIPLIER^(k-1).
     *
     * Derivation: standard exponential backoff, and it matches the platform's own
     * `exponential_backoff` semantics so the behaviour is unsurprising to a ServiceNow reader.
     */
    BACKOFF_MULTIPLIER: 2,

    /**
     * Number of consecutive non-success `call_log` ATTEMPT rows that trips the breaker.
     *
     * Derivation: at the default `max_retries = 2` (3 attempts per logical call), 6 attempt rows
     * is exactly TWO fully-exhausted logical calls — enough evidence the ERP is down rather than
     * momentarily flaky, short enough to stop hammering a dead host.
     *
     * Documented consequence: a system configured `max_retries = 0` trips after 6 single-attempt
     * failures instead. That is accepted (D18) — the alternative needs a column only the
     * connector understands.
     */
    CB_FAILURE_THRESHOLD: 6,

    /**
     * How long the breaker stays OPEN before a probe is allowed.
     *
     * Derivation: 2 x MAX_TOTAL_CALL_MS, so a half-open probe can never still be running when
     * the next cooldown expires. Business sign-off: OD13 — RESOLVED yes, 2 minutes.
     */
    CB_COOLDOWN_MS: 120000,

    /**
     * How far into the future `circuit_open_until` is pushed when a caller claims the HALF_OPEN
     * probe, so concurrent callers read OPEN and fail fast instead of all probing at once.
     *
     * Derivation: = MAX_TOTAL_CALL_MS, the longest a probe can possibly run. If the probing
     * thread dies, the lease expires on its own and the breaker self-heals.
     */
    CB_PROBE_LEASE_MS: 60000,

    /**
     * Retryable HTTP statuses — an explicit ALLOW-LIST, deliberately not `code >= 500` (D14).
     *
     * 501 and 505 are deterministic: they return the same answer to every retry, so retrying
     * them is pure waste. 429 is the deliberate 4xx exception — a 4xx that explicitly means
     * "try again later", and the status where `Retry-After` matters most.
     *
     * DO NOT "simplify" this to a range check. That is a D14 regression and T17/T21 will catch it.
     */
    RETRYABLE_STATUS: [408, 425, 429, 500, 502, 503, 504],

    /**
     * Cap on the composed `call_log.error` string.
     *
     * Derivation: the Phase 1 `call_log.error` column is `maxLength: 1000`. Truncating here
     * rather than letting the platform silently clip is part of the C1 story — we control
     * exactly what lands in the column.
     */
    ERROR_MAX_CHARS: 1000,
} as const
