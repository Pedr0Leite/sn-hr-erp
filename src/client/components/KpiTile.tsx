/**
 * A KPI tile. IT CONTAINS NO STATE LOGIC AND MUST NOT GROW ANY -- it receives `renderState()`'s
 * output and draws it (story L5-3 AC1, T5-4).
 *
 * D7: the Financial tab's cash tile is labelled `Cash balance` by the SERVER (tabs.ts). The word
 * "real-time" appears nowhere in this app: under D2 the figure is as old as its last sync, and
 * the `as of` stamp beside it says so.
 */

import React from 'react'
import { Card } from '@servicenow/react-components/Card'
import { Tile } from '../types'
import { oeeProvenance, renderState, thresholdEcho } from '../state-renderer'
import { StateBlock } from './StateBlock'

export function KpiTile({ t }: { t: Tile }) {
    const r = renderState(t)
    const thr = thresholdEcho(t)
    const oee = oeeProvenance(t)
    return (
        <Card size="md">
            <h3 className="hub-tile__label">{t.lab}</h3>
            <StateBlock r={r} />
            {t.note ? <p className="hub-tile__note">{t.note}</p> : null}
            {thr ? <p className="hub-tile__note">{thr}</p> : null}
            {oee ? <p className="hub-tile__note">{oee}</p> : null}
            {t.sys && t.sys.length > 0 ? (
                <p className="hub-tile__sys">
                    <span className="hub-tile__sys-label">Systems</span>
                    {t.sys.map((s) => (
                        <span key={s} className="hub-pill">
                            {s}
                        </span>
                    ))}
                </p>
            ) : null}
        </Card>
    )
}
