/**
 * ONE layout serves all five tabs, because the payload already declares each tab's KPIs, charts
 * and lists in render order. A per-tab hand-written layout would be five places for a tile to
 * drift into its own interpretation of "no data" -- exactly risk R5-2.
 *
 * Tab 4's OD6 disclosure and Tab 2's caveat both arrive IN THE PAYLOAD and therefore render in
 * every state without this component knowing which tab it is looking at.
 */

import React from 'react'
import { Button } from '@servicenow/react-components/Button'
import { TabPayload } from '../types'
import { stamp } from '../format'
import { KpiTile } from './KpiTile'
import { ChartBlock } from './ChartBlock'
import { ListBlock } from './ListBlock'

/**
 * At-a-glance state census for the tab. This is the portal-design idea that actually applies to a
 * data hub: put the answer to "can I trust this screen?" above the fold, before the reader starts
 * reading individual figures.
 *
 * It is DERIVED, never fetched — it counts the `st` already present on every tile in the payload,
 * so it cannot disagree with the tiles below it. A state with a count of zero is not rendered:
 * "Failed 0" is noise, and worse, it invites the reader to skim the row instead of reading it.
 */
const CENSUS_ORDER = ['live', 'stale', 'partial', 'failed', 'not_configured', 'restricted']
const CENSUS_WORD: { [k: string]: string } = {
    live: 'live',
    stale: 'stale',
    partial: 'partial',
    failed: 'failed',
    not_configured: 'not configured',
    restricted: 'restricted',
}

function StateCensus({ payload }: { payload: TabPayload }) {
    const counts: { [k: string]: number } = {}
    const all: { st?: string }[] = ([] as { st?: string }[])
        .concat(payload.k as any)
        .concat(payload.c as any)
        .concat(payload.l as any)
    for (let i = 0; i < all.length; i++) {
        const st = all[i] && all[i].st ? String(all[i].st) : 'unknown'
        counts[st] = (counts[st] || 0) + 1
    }
    const shown = CENSUS_ORDER.filter((s) => counts[s] > 0)
    if (shown.length === 0) {
        return null
    }
    return (
        <div className="hub-census" aria-label="State of this tab">
            {shown.map((s) => (
                <span key={s} className={'hub-census__item hub-census__item--' + s}>
                    <span className="hub-census__count">{counts[s]}</span>
                    <span className="hub-census__word">{CENSUS_WORD[s]}</span>
                </span>
            ))}
        </div>
    )
}

export function TabView({
    payload,
    onRefresh,
    refreshNote,
    busy,
}: {
    payload: TabPayload
    onRefresh: () => void
    refreshNote: string
    busy: boolean
}) {
    return (
        <section className="hub-tab" aria-label={payload.lab}>
            <header className="hub-tab__head">
                <h2 className="hub-tab__title">{payload.lab}</h2>
                <div className="hub-tab__meta">
                    <span>Payload built {stamp(payload.gen)}</span>
                    <span>Figures older than {payload.stale_h} h are marked stale</span>
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    label="Queue refresh"
                    disabled={busy}
                    onClicked={onRefresh}
                />
            </header>
            {/* T16 -- the queue is drained by a job that ships disarmed. The wording says
                "queued", never "refreshing" and never "refreshed": the figures will not move
                until a human runs that job, and implying otherwise is the support call. */}
            {refreshNote ? <p className="hub-tab__refresh">{refreshNote}</p> : null}
            {payload.note ? <p className="hub-tab__note">{payload.note}</p> : null}

            <StateCensus payload={payload} />

            {/* Three named sections instead of one undifferentiated scroll. The headings are
                structural, not decorative: they give the reader somewhere to stop, and they let a
                section be empty without the page looking broken. */}
            {payload.k.length > 0 ? (
                <>
                    <h3 className="hub-section">Key figures</h3>
                    <div className="hub-grid">
                        {payload.k.map((t) => (
                            <KpiTile key={t.id} t={t} />
                        ))}
                    </div>
                </>
            ) : null}

            {payload.c.length > 0 ? (
                <>
                    <h3 className="hub-section">Trends</h3>
                    {payload.c.map((c) => (
                        <ChartBlock key={c.id} c={c} />
                    ))}
                </>
            ) : null}

            {payload.l.length > 0 ? (
                <>
                    <h3 className="hub-section">Details</h3>
                    {payload.l.map((l) => (
                        <ListBlock key={l.id} l={l} />
                    ))}
                </>
            ) : null}
        </section>
    )
}
