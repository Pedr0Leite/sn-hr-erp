import { GlideDateTime } from '@servicenow/glide'

/**
 * Shared helpers for the L2 connector layer.
 *
 * PORTED VERBATIM from the sibling app (repo `sn-erp-crm-360`), src/server/connector/util.ts, comments included
 * (docs/l2-connector-design.md §2: "`isTrue` is ported verbatim, comment included").
 *
 * NOTE FOR THE ARCHITECT — recorded as OD16, not silently resolved: this app ALREADY has an
 * `isTrue` in `src/server/util/bool.ts`, written at L1 for the same reason. The design orders
 * this file ported verbatim, so there are now two implementations of the single most
 * safety-critical predicate in the app. They agree on every value GlideRecord can return, but
 * "two representations of one truth" is exactly what OD4 rejected elsewhere. Consolidating
 * them is an architect decision, not a developer one, so the design is implemented as written.
 */

/**
 * THE Boolean read helper. Every Boolean column this layer reads goes through it.
 *
 * WHY THIS EXISTS — the sibling shipped a business rule with three of four validation branches
 * silently dead because `GlideRecord#getValue()` on a Boolean column returns the RAW STORED
 * value, which in this module-backed server runtime is the string '1' / '0' — NOT 'true' /
 * 'false', despite `@servicenow/glide` typing the return as a generic `string`. The code
 * compared `=== 'true'`, which is always false. It compiled, deployed, and passed a happy-path
 * smoke test; it was only caught by live-testing the reject path.
 *
 * L2 reads four Boolean columns (`erp_system.active`, `erp_system.use_mid_server`,
 * `object_map.active`, `object_map.mapping_verified`) plus `field_map.zero_is_meaningful`, so
 * the fix is centralised rather than repeated. A `=== 'true'` comparison anywhere in
 * `src/server/connector/` is a build-blocking defect, not a nit — build-order step L2-12 greps
 * for it (I4).
 *
 * Accepts every representation the platform is known to hand back, case-insensitively, so it
 * is correct regardless of which layer (server GlideRecord, Table API, display value) produced
 * the value. Everything else — including empty, null, undefined and '0' — is false.
 */
export function isTrue(raw: string | null | undefined): boolean {
    if (raw === null || raw === undefined) {
        return false
    }
    const v = String(raw).trim().toLowerCase()
    return v === '1' || v === 'true' || v === 'on' || v === 'yes'
}

/**
 * Truncate to `max` characters. Used on the composed `call_log.error` string (C1) so we control
 * exactly what lands in the column rather than letting the platform silently clip it.
 */
export function truncate(s: string | null | undefined, max: number): string {
    if (s === null || s === undefined) {
        return ''
    }
    const str = String(s)
    return str.length <= max ? str : str.substring(0, max)
}

/**
 * Current time in epoch milliseconds.
 *
 * `gs.nowDateTime()` is not allowed in scoped applications, and `Date.now()` is not a reliable
 * platform clock in this runtime — `GlideDateTime` is the documented source of truth.
 */
export function nowMs(): number {
    return new GlideDateTime().getNumericValue()
}

/**
 * Epoch milliseconds -> the platform's internal datetime string, for writing
 * `erp_system.circuit_open_until` and `call_log.started`.
 */
export function toGlideDateTime(ms: number): string {
    const gdt = new GlideDateTime()
    gdt.setNumericValue(ms)
    return gdt.getValue()
}
