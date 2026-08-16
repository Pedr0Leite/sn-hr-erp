/**
 * L5 §6 / L5-D4. Four hand-drawn SVG shapes. NO CHART LIBRARY IS BUNDLED.
 *
 * The decisive reason is not size: no mainstream library has a concept of "draw no axes because
 * this data does not exist", and story L5-4 AC8 requires exactly that -- an empty chart frame
 * reads as "zero revenue". This module is never reached unless the caller has already checked
 * `mayDrawData()`, and it draws axes only when it has categories to put on them.
 */

import React from 'react'
import { Series } from './types'

const W = 640
const H = 240
const PAD = 36

const PALETTE = ['#2e6f9e', '#8a5cb8', '#3f8f6b', '#b5732e', '#8d3b4a']
/** Distinguishable without colour (§4.4): each series also carries its own dash signature. */
const DASHES = ['', '6 3', '2 3', '10 4', '1 4']

/**
 * The drawing domain, tracking BOTH bounds.
 *
 * A negative value is real data — a loss-making month, a credit note, a reversal. Seeding only an
 * upper bound at 0 makes a negative bar's height negative, and a negative `height` is an SVG error
 * value, so the element is not rendered at all: the reader sees a populated chart with nothing
 * where the loss is. That reads as an absence for a figure that exists, which is the same class of
 * lie as showing `0`. See BUG-007.
 */
function domainOf(series: Series[]): { min: number; max: number } {
    let min = 0
    let max = 0
    for (let s = 0; s < series.length; s++) {
        for (let i = 0; i < series[s].d.length; i++) {
            const v = series[s].d[i]
            // `null` is the absence marker (see the payload contract). It is not a data point and
            // must not influence the scale.
            if (v === null) {
                continue
            }
            if (v > max) {
                max = v
            }
            if (v < min) {
                min = v
            }
        }
    }
    return { min: min, max: max === min ? min + 1 : max }
}

function maxOf(series: Series[]): number {
    const d = domainOf(series)
    return d.max || 1
}

function Axes({ cat }: { cat: string[] }) {
    return (
        <g className="hub-chart__axes">
            <line x1={PAD} y1={H - PAD} x2={W - 8} y2={H - PAD} />
            <line x1={PAD} y1={8} x2={PAD} y2={H - PAD} />
            {cat.map((c, i) => (
                <text key={c + i} x={PAD + ((i + 0.5) * (W - PAD - 8)) / cat.length} y={H - PAD + 14} textAnchor="middle">
                    {c}
                </text>
            ))}
        </g>
    )
}

function Bars({ cat, series }: { cat: string[]; series: Series[] }) {
    const { min, max } = domainOf(series)
    const slot = (W - PAD - 8) / Math.max(cat.length, 1)
    const bw = (slot * 0.7) / series.length
    const plot = H - PAD - 8
    // Where value 0 sits vertically. With no negatives this is the axis, and the chart is
    // unchanged; with negatives the baseline lifts and losses draw downward from it.
    const zeroY = 8 + (max / (max - min)) * plot
    return (
        <g>
            {min < 0 ? <line className="hub-chart__zero" x1={PAD} y1={zeroY} x2={W - 8} y2={zeroY} /> : null}
            {series.map((s, si) =>
                s.d.map((v, i) => {
                    // No bar at all for an absence. A zero-height bar and a genuine zero look
                    // identical, and the reader would take the gap as "nothing sold that day".
                    if (v === null) {
                        return null
                    }
                    const vy = 8 + ((max - v) / (max - min)) * plot
                    return (
                        <rect
                            key={s.lab + i}
                            x={PAD + i * slot + slot * 0.15 + si * bw}
                            y={Math.min(vy, zeroY)}
                            width={Math.max(bw - 2, 1)}
                            height={Math.max(Math.abs(zeroY - vy), 1)}
                            fill={PALETTE[si % PALETTE.length]}
                        >
                            <title>{s.lab + ' · ' + cat[i] + ' · ' + v}</title>
                        </rect>
                    )
                }),
            )}
        </g>
    )
}

function Lines({ cat, series }: { cat: string[]; series: Series[] }) {
    const { min, max } = domainOf(series)
    const step = (W - PAD - 8) / Math.max(cat.length - 1, 1)
    const plot = H - PAD - 8
    const zeroY = 8 + (max / (max - min)) * plot
    return (
        <g fill="none">
            {min < 0 ? <line className="hub-chart__zero" x1={PAD} y1={zeroY} x2={W - 8} y2={zeroY} /> : null}
            {series.map((s, si) => {
                // A `null` BREAKS the line rather than interpolating across it. Joining the two
                // neighbours would draw a confident straight edge over days with no data, which
                // is an invented trend. One polyline per unbroken run; an isolated point draws
                // a run of one and is simply not visible, which is honest.
                const runs: string[][] = []
                let run: string[] = []
                for (let i = 0; i < s.d.length; i++) {
                    const v = s.d[i]
                    if (v === null) {
                        if (run.length > 0) {
                            runs.push(run)
                            run = []
                        }
                        continue
                    }
                    run.push(PAD + i * step + ',' + (8 + ((max - v) / (max - min)) * plot))
                }
                if (run.length > 0) {
                    runs.push(run)
                }
                return runs.map((points, ri) => (
                    <polyline
                        key={s.lab + '-' + ri}
                        stroke={PALETTE[si % PALETTE.length]}
                        strokeWidth={2}
                        strokeDasharray={DASHES[si % DASHES.length]}
                        points={points.join(' ')}
                    />
                ))
            })}
        </g>
    )
}

function Slices({ cat, series, donut }: { cat: string[]; series: Series[]; donut: boolean }) {
    const d = series.length > 0 ? series[0].d : []
    let total = 0
    for (let i = 0; i < d.length; i++) {
        // An absent category contributes nothing to the ring rather than a zero slice.
        if (d[i] !== null) {
            total += d[i] as number
        }
    }
    if (total <= 0) {
        // Every slice is zero. A full ring here would read as "one category owns everything".
        return <text x={W / 2} y={H / 2} textAnchor="middle">All categories are zero</text>
    }
    const cx = H / 2
    const cy = H / 2
    const r = H / 2 - 12
    let angle = -Math.PI / 2
    return (
        <g>
            {d.map((v, i) => {
                // An absent category gets no slice and consumes no angle — the ring is drawn
                // from what is actually known, not padded to a full circle.
                if (v === null) {
                    return null
                }
                const sweep = (v / total) * Math.PI * 2
                const x1 = cx + r * Math.cos(angle)
                const y1 = cy + r * Math.sin(angle)
                angle += sweep
                const x2 = cx + r * Math.cos(angle)
                const y2 = cy + r * Math.sin(angle)
                const large = sweep > Math.PI ? 1 : 0
                return (
                    <path
                        key={cat[i] + i}
                        d={'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + ' Z'}
                        fill={PALETTE[i % PALETTE.length]}
                    >
                        <title>{cat[i] + ' · ' + v}</title>
                    </path>
                )
            })}
            {donut ? <circle cx={cx} cy={cy} r={r * 0.55} className="hub-chart__hole" /> : null}
            {cat.map((c, i) => (
                <text key={'lg' + c + i} x={H + 8} y={20 + i * 18} className="hub-chart__legend">
                    {c + ' — ' + d[i]}
                </text>
            ))}
        </g>
    )
}

/** The four shapes. `type` comes from the payload; an unknown one draws bars, never nothing. */
export function ChartSvg({ type, cat, series }: { type: string; cat: string[]; series: Series[] }) {
    const round = type === 'donut' || type === 'pie'
    return (
        <svg className="hub-chart__svg" viewBox={'0 0 ' + W + ' ' + H} role="img" aria-label="Chart. A data table follows.">
            {round ? null : <Axes cat={cat} />}
            {round ? (
                <Slices cat={cat} series={series} donut={type === 'donut'} />
            ) : type === 'line' ? (
                <Lines cat={cat} series={series} />
            ) : (
                <Bars cat={cat} series={series} />
            )}
        </svg>
    )
}
