/**
 * NV — the employee-services surface.
 *
 * ONE `GET /me` FOR THE WHOLE PAGE, for the same reason a tab takes one call: a surface assembled
 * from six requests renders six different moments, and an employee comparing a payslip against a
 * leave balance is entitled to assume they were read together.
 *
 * EVERY ABSENCE IS READ FROM THE KEY, NEVER FROM THE VALUE. `'n' in area`, never `area.n || 0`.
 * A tile that renders `0` because a field was never mapped is worse than one that errors, because
 * nobody investigates a number. The server omits `n` for any state that is not live or stale, and
 * this file has no branch that could invent one.
 */

import React, { useEffect, useState } from 'react'
import './ess.css'

interface AreaPayload {
    id: string
    label: string
    obj: string
    st?: string
    msg?: string
    n?: number
    rows?: Record<string, string>[]
    as_of?: string
    empty?: boolean
}

const STATE_CHIP: Record<string, string> = {
    live: 'Live',
    stale: 'Stale',
    failed: 'Not available',
    not_configured: 'Not set up',
    partial: 'Incomplete',
    throttled: 'Rate limited',
}

/** What each area counts, so a bare figure never appears without its unit. */
const UNIT: Record<string, [string, string]> = {
    payslips: ['payslip', 'payslips'],
    tax: ['statement', 'statements'],
    leave: ['balance', 'balances'],
    benefits: ['enrolment', 'enrolments'],
    profile: ['record', 'records'],
}

function unitFor(id: string, n: number): string {
    const pair = UNIT[id]
    if (!pair) {
        return ''
    }
    return n === 1 ? pair[0] : pair[1]
}

/**
 * The sentence shown where a figure cannot be. It is ALWAYS the server's own message when there
 * is one: that message names the object map an admin has to create, and replacing it with a
 * friendlier generic sentence would discard the only actionable part.
 */
function absenceText(area: AreaPayload): string {
    if (area.msg) {
        return area.msg
    }
    if (area.st === 'not_configured') {
        return 'Not set up yet. An administrator needs to map ' + area.obj + '.'
    }
    if (area.st === 'failed') {
        return 'The system holding this did not answer. No figure is shown, because an old one would be worse than none.'
    }
    return 'No figure is available for this yet.'
}

function Row({ area, row }: { area: AreaPayload; row: Record<string, string> }): JSX.Element {
    if (area.id === 'leave') {
        // NV-19: a balance with no unit renders NO figure. "5" that does not say days or hours is
        // a number nobody can act on, so the unit is a precondition for showing the value at all.
        const hasUnit = !!row.balance_unit
        return (
            <li className="ess-row">
                <span className="ess-row-main">{row.leave_type || 'Leave'}</span>
                <span className="ess-row-meta">
                    {hasUnit ? row.balance_value + ' ' + row.balance_unit : 'Unit not mapped — no figure shown'}
                </span>
            </li>
        )
    }
    if (area.id === 'benefits') {
        return (
            <li className="ess-row">
                <span className="ess-row-main">{row.benefit_type || 'Benefit'}</span>
                <span className="ess-row-meta">{row.plan_option || ''}</span>
            </li>
        )
    }
    if (area.id === 'profile') {
        return (
            <li className="ess-row">
                <span className="ess-row-main">{row.job_title || row.employee_full_name || 'Details'}</span>
                <span className="ess-row-meta">{row.department || ''}</span>
            </li>
        )
    }
    return (
        <li className="ess-row">
            <span className="ess-row-main">{row.period_label || row.document_reference || 'Document'}</span>
            <span className="ess-row-meta">{row.issue_date || row.period_end || ''}</span>
        </li>
    )
}

function Card({ area }: { area: AreaPayload }): JSX.Element {
    const st = area.st || 'failed'
    // THE ONLY TEST FOR A FIGURE. `'n' in area` — a present key with the value 0 is a real count
    // from a successful read and renders as 0; an absent key renders the sentence instead.
    const hasFigure = Object.prototype.hasOwnProperty.call(area, 'n') && typeof area.n === 'number'
    const rows = area.rows || []

    return (
        <section className="ess-card" data-st={st} aria-labelledby={'ess-h-' + area.id}>
            <div className="ess-card-head">
                <h2 className="ess-card-title" id={'ess-h-' + area.id}>
                    {area.label}
                </h2>
                <span className="ess-chip">{STATE_CHIP[st] || st}</span>
            </div>

            {hasFigure ? (
                <p className="ess-figure">
                    {area.n}
                    <span className="ess-unit">{unitFor(area.id, area.n as number)}</span>
                </p>
            ) : (
                <p className="ess-absent">{absenceText(area)}</p>
            )}

            {hasFigure && area.empty ? (
                <p className="ess-detail">Nothing here yet. The system answered, and had none to send.</p>
            ) : null}

            {hasFigure && area.msg ? <p className="ess-detail">{area.msg}</p> : null}

            {area.as_of ? <span className="ess-age">Read {area.as_of}</span> : null}

            {rows.length > 0 ? (
                <ul className="ess-list">
                    {rows.slice(0, 6).map((row, i) => (
                        <Row area={area} row={row} key={i} />
                    ))}
                </ul>
            ) : null}

            {rows.length > 6 ? <p className="ess-more">Showing 6 of {rows.length}.</p> : null}
        </section>
    )
}

export function EssView(): JSX.Element {
    const [areas, setAreas] = useState<AreaPayload[] | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let live = true
        const w = window as unknown as { g_ck?: string }
        fetch('/api/x_335329_sn_hr_erp/hub/me', {
            headers: { Accept: 'application/json', 'X-UserToken': w.g_ck || '' },
        })
            .then((r) => r.json().then((b) => ({ ok: r.ok, body: b })))
            .then(({ ok, body }) => {
                if (!live) {
                    return
                }
                // A Scripted REST API wraps EVERY body in `{"result": …}`, error bodies included.
                const parsed = body && typeof body === 'object' && 'result' in body ? body.result : body
                if (!ok) {
                    setError((parsed && parsed.error) || 'Your details could not be loaded.')
                    return
                }
                setAreas((parsed && parsed.areas) || [])
            })
            .catch(() => {
                if (live) {
                    setError('Your details could not be loaded. The page reached no answer at all.')
                }
            })
        return () => {
            live = false
        }
    }, [])

    return (
        <div className="ess">
            <a className="ess-back" href="?tab=financial">
                ← Back to the hub
            </a>

            <header className="ess-head">
                <p className="ess-eyebrow">Read live from your ERP</p>
                <h1 className="ess-title">Your pay, leave and documents</h1>
                <p className="ess-sub">
                    Nothing on this page is stored in ServiceNow. Each area is fetched from the system that holds it,
                    at the moment you open this page — so where a system cannot answer, this page says so instead of
                    showing you an old number.
                </p>
            </header>

            {error ? (
                <section className="ess-card" data-st="failed">
                    <div className="ess-card-head">
                        <h2 className="ess-card-title">Nothing could be loaded</h2>
                        <span className="ess-chip">Not available</span>
                    </div>
                    <p className="ess-absent">{error}</p>
                </section>
            ) : null}

            {!areas && !error ? (
                <div className="ess-grid" aria-busy="true" aria-live="polite">
                    <div className="ess-skeleton" />
                    <div className="ess-skeleton" />
                    <div className="ess-skeleton" />
                </div>
            ) : null}

            {areas ? (
                <div className="ess-grid">
                    {areas.map((a) => (
                        <Card area={a} key={a.id} />
                    ))}
                </div>
            ) : null}

            {areas ? (
                <p className="ess-note">
                    Changing your bank details, submitting a claim or requesting leave is not available here yet. The
                    server side is built, but no change has yet been proved to reach an ERP end to end — so no button
                    is drawn that cannot yet commit its decision.
                </p>
            ) : null}
        </div>
    )
}
