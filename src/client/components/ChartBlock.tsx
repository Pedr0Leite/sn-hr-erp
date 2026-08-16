/**
 * L5 §6. A chart draws ONLY under live / stale / partial.
 *
 * Under not_configured / failed / restricted the payload omits `cat` and `s` ENTIRELY -- absent
 * keys, not empty arrays -- so there is nothing to plot, and this component renders the state
 * sentence and NO SVG AT ALL: no axes, no gridlines, no empty frame (story L5-4 AC8).
 *
 * `miss` names a declared series whose field is unmapped. It is NEVER drawn as a series of
 * zeros: a target line at zero is a target somebody will act on.
 *
 * Every chart carries a table alternative -- a chart with no text equivalent is invisible to a
 * screen reader, and this app's rules are about text carrying meaning.
 */

import React, { useState } from 'react'
import { Card } from '@servicenow/react-components/Card'
import { Button } from '@servicenow/react-components/Button'
import { ChartTile } from '../types'
import { mayDrawData, renderState } from '../state-renderer'
import { StateBlock } from './StateBlock'
import { ChartSvg } from '../charts'

export function ChartBlock({ c }: { c: ChartTile }) {
    const [asData, setAsData] = useState(false)
    const r = renderState(c)
    const drawable = mayDrawData(c) && !!c.cat && !!c.s && c.cat.length > 0 && c.s.length > 0

    return (
        <Card size="md">
            <h3 className="hub-tile__label">{c.lab}</h3>
            <StateBlock r={r} headlineTag="none" />
            {c.miss && c.miss.length > 0 ? <p className="hub-tile__note">{c.miss.join('. ') + '.'}</p> : null}
            {drawable ? (
                <>
                    <Button
                        size="sm"
                        variant="tertiary"
                        label={asData ? 'View as chart' : 'View as data'}
                        onClicked={() => setAsData(!asData)}
                    />
                    {asData ? (
                        <div className="hub-scroll">
                            <table className="hub-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Category</th>
                                        {(c.s || []).map((s) => (
                                            <th scope="col" key={s.lab}>
                                                {s.lab}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(c.cat || []).map((cat, i) => (
                                        <tr key={cat + i}>
                                            <th scope="row">{cat}</th>
                                            {(c.s || []).map((s) => (
                                                <td key={s.lab}>{s.d[i]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <ChartSvg type={c.type} cat={c.cat || []} series={c.s || []} />
                    )}
                </>
            ) : null}
        </Card>
    )
}
