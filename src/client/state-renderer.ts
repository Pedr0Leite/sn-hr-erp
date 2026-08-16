/**
 * L5 §4.2 -- ONE FUNCTION PRODUCES EVERY TILE'S TEXT. A tile with its own inline state handling
 * fails story L5-3 AC1, so no component in this app may branch on `st` itself: components
 * receive this function's OUTPUT, never the raw tile.
 *
 * THE DEFAULT BRANCH IS THE IMPORTANT ONE (story L5-3 AC7). An unrecognised or absent state
 * must never fall back to displaying the raw value. Defaulting to `live` fails the story, so
 * the switch has no fall-through and the default returns the untrusted sentence with NO
 * numeral.
 *
 * THE ABSENT-KEY CONTRACT (trap T17) IS READ EXPLICITLY. `hasFigure()` tests `'v' in tile`.
 * `tile.v || 0` renders `0` for an absence -- the single failure mode this whole app exists to
 * prevent -- and it passes a happy-path smoke test.
 */

import { Tile } from './types'
import { age, figure, stamp, subtotals } from './format'

export type Tone = 'live' | 'stale' | 'failed' | 'not_configured' | 'partial' | 'restricted' | 'unknown'

export interface Rendered {
    /** The formatted figure, or NULL when no numeral may be shown. Never '0' for an absence. */
    headline: string | null
    /** The state sentence. Always present -- a blank region is a FAIL (story L5-9 AC7). */
    sub: string
    /** A second line, currently only the last-good figure under `failed`. */
    detail: string
    /** Text and glyph carry the meaning; tone is applied only after both (story L5-3 AC8). */
    tone: Tone
    icon: string
}

/** Explicit presence test. The ONLY place the payload's absent-key contract is interpreted. */
function hasFigure(t: Tile): boolean {
    return Object.prototype.hasOwnProperty.call(t, 'v') && typeof t.v === 'number'
}

function headlineOf(t: Tile): string | null {
    if (t.sub && t.sub.length > 0) {
        return subtotals(t.sub)
    }
    if (hasFigure(t)) {
        return figure(t.v as number, t.fmt)
    }
    return null
}

/** D5 -- the number on screen is always attributable to the threshold that produced it. */
export function thresholdEcho(t: Tile): string {
    if (!t.thr) {
        return ''
    }
    const pretty = t.thr.name.replace(/_/g, ' ')
    if (t.thr.kind === 'per_row') {
        return "Compared per row against each row's own " + pretty + '.'
    }
    if (typeof t.thr.value === 'number') {
        return /_days$/.test(t.thr.name) ? 'Within ' + t.thr.value + ' days.' : 'Threshold ' + pretty + ' = ' + t.thr.value + '.'
    }
    return 'Threshold ' + pretty + ' applied.'
}

/** OD7 / L5-D6 -- the OEE tile ALWAYS states where its number came from. */
export function oeeProvenance(t: Tile): string {
    const parts: string[] = []
    if (t.origin === 'supplied') {
        parts.push('Supplied by ' + (t.sys && t.sys.length > 0 ? t.sys.join(', ') : 'the ERP') + '.')
    } else if (t.origin === 'computed') {
        parts.push('Computed from availability × performance × quality.')
    }
    if (t.unweighted) {
        parts.push("Unweighted mean — 'output' is not mapped.")
    }
    if (t.out_of_range) {
        parts.push('OEE out of range — check the mapping.')
    }
    return parts.join(' ')
}

export function renderState(t: Tile): Rendered {
    const state = t && typeof t.st === 'string' ? t.st : ''

    switch (state) {
        case 'live':
            // `0` IS SHOWN HERE AND ONLY HERE. A live zero means a success run returned an
            // empty set or rows summing to zero, which is a real answer.
            return {
                headline: headlineOf(t),
                sub: 'as of ' + stamp(t.as_of),
                detail: '',
                tone: 'live',
                icon: '●',
            }

        case 'stale':
            return {
                headline: headlineOf(t),
                sub: 'Stale — as of ' + stamp(t.as_of) + ' (' + age(t.age_h) + ')',
                detail: '',
                tone: 'stale',
                icon: '◑',
            }

        case 'failed':
            // NO NUMERAL AT ALL. This is the founding case: a warehouse that did not answer
            // reads "ERP did not answer", never "0 low stock alerts" (story L5-6 AC4).
            if (t.prev) {
                return {
                    headline: null,
                    sub: 'ERP did not answer',
                    detail:
                        'Last good figure: ' +
                        figure(t.prev.v, t.fmt) +
                        ' (as of ' +
                        stamp(t.prev.as_of) +
                        ', ' +
                        age(t.prev.age_h) +
                        ')',
                    tone: 'failed',
                    icon: '⚠',
                }
            }
            return {
                headline: null,
                sub: 'ERP did not answer — no previous figure',
                detail: '',
                tone: 'failed',
                icon: '⚠',
            }

        case 'not_configured':
            // P4 -- the sentence NAMES WHAT TO CREATE. "No data" is not an instruction.
            return {
                headline: null,
                sub: t.missing
                    ? "Not configured — '" + t.missing + "' is not mapped"
                    : 'Not configured — create an Object Map for `' + t.obj + '`',
                detail: '',
                tone: 'not_configured',
                icon: '○',
            }

        case 'partial':
            // Mixed currency (D11) is a `partial` carrying `sub` instead of `v`; `deg` then
            // names the CURRENCIES rather than a system, so the sentence must differ.
            if (t.sub && t.sub.length > 0) {
                return {
                    headline: headlineOf(t),
                    sub: 'Partial — mixed currencies (' + (t.deg || 'multiple') + '). No combined total is shown.',
                    detail: t.as_of ? 'as of ' + stamp(t.as_of) : '',
                    tone: 'partial',
                    icon: '◐',
                }
            }
            return {
                headline: headlineOf(t),
                sub: 'Partial — ' + (t.deg || 'a contributing system') + ' did not answer',
                detail: t.as_of ? 'as of ' + stamp(t.as_of) : '',
                tone: 'partial',
                icon: '◐',
            }

        case 'restricted':
            // L5-D8 -- a refusal states itself. Never blank, never zero, never a hidden tile:
            // a missing tile reads as zero and changes the tab's shape by role.
            return {
                headline: null,
                sub: 'Restricted — this figure requires the finance_viewer role',
                detail: '',
                tone: 'restricted',
                icon: '⊘',
            }

        default:
            // Story L5-3 AC7. An unrecognised state NEVER falls back to the raw value.
            return {
                headline: null,
                sub: 'State unavailable — this tile cannot be trusted',
                detail: '',
                tone: 'unknown',
                icon: '✕',
            }
    }
}

/** Charts and lists draw their data ONLY in these three states (§6, api-contract §Charts). */
export function mayDrawData(t: Tile): boolean {
    return t.st === 'live' || t.st === 'stale' || t.st === 'partial'
}
