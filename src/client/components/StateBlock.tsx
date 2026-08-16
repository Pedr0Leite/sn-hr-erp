/**
 * The single presentation of `renderState()`'s output. Tiles, charts and lists all render their
 * state through THIS component, so there is exactly one place a state sentence can be drawn and
 * exactly one place it could go wrong.
 *
 * Distinguishable without colour (story L5-3 AC8): sentence first, glyph second, tone last.
 * Removing every colour from the stylesheet leaves every state readable.
 */

import React from 'react'
import { Rendered } from '../state-renderer'

/**
 * The chip's WORD, not its colour, is what names the state. The colour is redundant encoding on
 * top of a word that is already there — remove the stylesheet and the chip still reads "Not
 * configured". This is the same rule as the border tone, applied one level in.
 */
const TONE_WORD: { [tone: string]: string } = {
    live: 'Live',
    stale: 'Stale',
    partial: 'Partial',
    failed: 'Failed',
    not_configured: 'Not configured',
    restricted: 'Restricted',
    unknown: 'Unknown',
}

export function StateBlock({ r, headlineTag }: { r: Rendered; headlineTag?: 'big' | 'none' }) {
    return (
        <div className={'hub-state hub-state--' + r.tone} aria-live="polite">
            <span className={'hub-chip hub-chip--' + r.tone}>
                <span className="hub-chip__dot" aria-hidden="true" />
                {TONE_WORD[r.tone] || r.tone}
            </span>
            {r.headline !== null && headlineTag !== 'none' ? <p className="hub-state__figure">{r.headline}</p> : null}
            <p className="hub-state__line">
                <span className="hub-state__glyph" aria-hidden="true">
                    {r.icon}
                </span>
                {r.sub}
            </p>
            {r.detail ? <p className="hub-state__detail">{r.detail}</p> : null}
        </div>
    )
}
