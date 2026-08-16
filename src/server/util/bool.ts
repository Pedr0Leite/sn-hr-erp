// The single Boolean reader for this application. Ported from the sibling's
// src/server/connector/util.ts and mandated by docs/l1-control-tower-design.md §3.3.
//
// WHY THIS FILE EXISTS AT ALL:
// GlideRecord.getValue() on a Boolean column returns the STRING '1' or '0' -- never
// 'true' or 'false'. The sibling project shipped the L1 config-validation rule with
// `getValue('use_mid_server') === 'true'`, which is ALWAYS false. Three of its four
// branches were silently dead: clean build, clean deploy, passing happy-path smoke test,
// and a validation rule that validated nothing.
//
// Note the implementation deliberately avoids the literal `=== 'true'` even though it
// would be correct inside a normalising helper: test T1-6 greps all of src/ for
// `=== 'true'` and `!== 'true'` and requires ZERO hits. A helper that trips its own
// guard-rail teaches the next contributor that the guard-rail is noise.

var TRUTHY = ['true', '1', 'yes', 'y', 'on']

/**
 * True for every representation the platform may hand back for a Boolean column:
 * the string '1' (GlideRecord.getValue), a real boolean true (Table API JSON, a
 * GlideElement coerced by the caller), or 'true' (a Table API payload echoed as text).
 */
export function isTrue(value: unknown): boolean {
    if (value === true) {
        return true
    }
    if (value === false || value === null || value === undefined) {
        return false
    }
    return TRUTHY.indexOf(String(value).toLowerCase()) !== -1
}

/** True when a reference / string column holds no usable value. */
export function isEmpty(value: unknown): boolean {
    return value === null || value === undefined || String(value) === ''
}
