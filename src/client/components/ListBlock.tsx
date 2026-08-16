/**
 * A list. THREE RULES, ALL OF THEM LOAD-BEARING:
 *
 * 1. COLUMNS COME FROM `cols`, NEVER FROM A HARDCODED SET (trap T18). A `finance_viewer`-gated
 *    column is dropped from `cols` itself for a caller without the role, so the header never
 *    advertises a figure that is not in the body.
 * 2. `r` IS ABSENT under not_configured / failed / restricted, and this component then renders
 *    NO TABLE. An empty table with "No records" reads as "no overdue invoices" and is a FAIL.
 * 3. THE CAVEAT RENDERS IN EVERY STATE (story L5-5 AC6/AC7/AC8), above the list, verbatim from
 *    the payload -- including when there is no list, and including when no deep link can be
 *    drawn. It is the honest state even when the escape route is missing.
 *
 * D3: NO Approve control and NO Reject control is rendered anywhere, in any state, for any role.
 * There is no component, no handler and no dead branch here -- the code to draw one does not
 * exist. A disabled or hidden one would also fail story L5-5 AC4.
 */

import React from 'react'
import { Card } from '@servicenow/react-components/Card'
import { TextLink } from '@servicenow/react-components/TextLink'
import { Col, ListTile, Row } from '../types'
import { figure } from '../format'
import { mayDrawData, renderState } from '../state-renderer'
import { StateBlock } from './StateBlock'

function cell(row: Row, col: Col): string {
    const raw = row[col.k]
    if (raw === undefined || raw === null || raw === '') {
        // An absent cell says so. A blank cell in a numeric column reads as zero.
        return '—'
    }
    if (col.fmt === 'number' || col.fmt === 'currency' || col.fmt === 'percent') {
        const n = parseFloat(String(raw))
        return isNaN(n) ? String(raw) : figure(n, col.fmt)
    }
    return String(raw)
}

export function ListBlock({ l }: { l: ListTile }) {
    const r = renderState(l)
    const rows = mayDrawData(l) && l.r ? l.r : null

    return (
        <Card size="md">
            <h3 className="hub-tile__label">{l.lab}</h3>
            {l.caveat ? <p className="hub-list__caveat">{l.caveat}</p> : null}
            <StateBlock r={r} headlineTag="none" />
            {rows ? (
                <div className="hub-scroll">
                    <table className="hub-table">
                        <thead>
                            <tr>
                                {l.cols.map((c) => (
                                    <th scope="col" key={c.k}>
                                        {c.lab}
                                    </th>
                                ))}
                                <th scope="col">Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i}>
                                    {l.cols.map((c) => (
                                        <td key={c.k}>{cell(row, c)}</td>
                                    ))}
                                    <td>
                                        {/* L5 §4.5 / story L5-10 AC2 -- NO ANCHOR ELEMENT AT ALL when `link`
                                            is absent. A styled-as-disabled anchor fails the story. The URL is
                                            joined server-side, so `link` present means the link is complete. */}
                                        {row.link ? <TextLink label="View in ERP" href={row.link} opensWindow={true} /> : <span>—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </Card>
    )
}
