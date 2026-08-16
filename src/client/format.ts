/**
 * L5 §4.2. ONE helper formats every timestamp and ONE formats every figure.
 *
 * TIMESTAMPS CARRY A DATE AND A TIME. `as of 14:32` alone fails: a figure from last Tuesday at
 * 14:32 reads as current. Format: `d MMM yyyy HH:mm`.
 *
 * The payload's stamps are instance-local `YYYY-MM-DD HH:MM:SS` strings. They are re-formatted
 * TEXTUALLY, never through `new Date(...)`: parsing that string in the browser applies the
 * BROWSER's timezone and silently shifts a figure's age by up to a day.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `2026-08-12 14:32:07` -> `12 Aug 2026 14:32`. Anything unparseable is returned verbatim. */
export function stamp(raw: string | undefined): string {
    if (!raw) {
        return ''
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(raw)
    if (!m) {
        return raw
    }
    const month = MONTHS[parseInt(m[2], 10) - 1] || m[2]
    return String(parseInt(m[3], 10)) + ' ' + month + ' ' + m[1] + ' ' + m[4] + ':' + m[5]
}

/** `73` -> `3 days old`; `5` -> `5 hours old`. Stale data always shows its age (§0 R3). */
export function age(hours: number | undefined): string {
    if (hours === undefined || hours === null) {
        return 'age unknown'
    }
    const h = Math.floor(hours)
    if (h < 24) {
        return h === 1 ? '1 hour old' : h + ' hours old'
    }
    const d = Math.floor(h / 24)
    return d === 1 ? '1 day old' : d + ' days old'
}

/** Thousands separators, up to one decimal place. Never a currency symbol -- see figure(). */
function grouped(n: number): string {
    const rounded = Math.abs(n % 1) < 0.05 ? Math.round(n) : Math.round(n * 10) / 10
    const parts = String(rounded).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
}

/**
 * The one figure formatter.
 *
 * NO CURRENCY SYMBOL IS EVER PRINTED. The payload carries a currency code only inside `sub`
 * (D11's per-currency subtotals); a single-currency `v` carries none, and inventing "£" for a
 * figure whose ERP reported EUR is precisely the class of confident wrong number this app
 * exists to prevent. Recorded as L5-D10.
 */
export function figure(v: number, fmt: string | undefined): string {
    if (fmt === 'percent') {
        return grouped(v) + '%'
    }
    return grouped(v)
}

/** D11 -- `sub` renders as `GBP 1,204 · EUR 900`, each subtotal owning its code. */
export function subtotals(sub: { cur: string; v: number }[]): string {
    const out: string[] = []
    for (let i = 0; i < sub.length; i++) {
        out.push(sub[i].cur + ' ' + grouped(sub[i].v))
    }
    return out.join(' · ')
}
