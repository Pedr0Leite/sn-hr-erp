import { GlideRecord, gs } from '@servicenow/glide'
import { readForEmployee, ReadResult, ReadState } from './read-service.ts'

// NV — the employee-services read route. ONE fat GET for the whole surface, for the same reason
// L4-1 AC1 requires it of a tab: a surface that needs six calls renders six different moments.
//
// THE EMPLOYEE IS THE SESSION USER AND IS NEVER A PARAMETER. `gs.getUserID()` is read here and
// nowhere else in this file, and it is the only value passed to `readForEmployee`. Accepting an
// employee id from the client is how one employee reads another's payslip; there is deliberately
// no parameter that could carry one, so the mistake cannot be made by editing a query string.

export interface Area {
    id: string
    label: string
    logicalObject: string
    /** Rendered when the area resolves to `not_configured`. Names the map an admin must create. */
    unit: string
}

/**
 * The five read areas. Each maps to exactly one logical object in `contract/objects.ts`.
 *
 * WRITE AREAS ARE ABSENT ON PURPOSE. Banking, expense claims, leave submission and personal
 * updates all have working server modules, but the write path has never completed a real call:
 * OD51's map resolution and `create-write.ts`'s idempotency key are guarded by `npm run check`
 * rules 8a/8b and confirmed by nothing. Drawing "Update my bank account" before Scenario 5 of
 * docs/MANUAL-TEST-SCENARIOS.md passes would be a button whose decision has never been shown to
 * commit — the first of the five rules, and the one most expensive to get wrong.
 */
export const AREAS: Area[] = [
    { id: 'payslips', label: 'Payslips', logicalObject: 'payslip_document', unit: 'payslip' },
    { id: 'tax', label: 'Tax statements', logicalObject: 'tax_statement', unit: 'tax statement' },
    { id: 'leave', label: 'Leave balance', logicalObject: 'leave_balance', unit: 'leave balance' },
    { id: 'benefits', label: 'Benefits', logicalObject: 'benefit_enrollment', unit: 'benefit enrolment' },
    { id: 'profile', label: 'My details', logicalObject: 'employee_profile', unit: 'employee profile' },
]

function activeSystems(): string[] {
    const out: string[] = []
    const gr = new GlideRecord('x_335329_sn_hr_erp_erp_system')
    gr.addQuery('active', true)
    gr.query()
    while (gr.next()) {
        out.push(String(gr.getUniqueValue()))
    }
    return out
}

/**
 * Merge one area's results across every active system into ONE state.
 *
 * THE PRECEDENCE IS THE CONTRACT, NOT A CONVENIENCE. `not_configured` outranks everything because
 * an unmapped object is an admin action and no amount of data from a second system makes it go
 * away; `partial` exists so "two systems, one answered" never renders as a whole truth.
 */
function merge(area: Area, results: ReadResult[]): any {
    const out: any = { id: area.id, label: area.label, obj: area.logicalObject }

    if (results.length === 0) {
        out.st = 'not_configured'
        out.msg = 'No ERP system is active. Create one, then map ' + area.unit + '.'
        return out
    }

    const configured = []
    for (let i = 0; i < results.length; i++) {
        if (results[i].state !== 'not_configured') {
            configured.push(results[i])
        }
    }
    if (configured.length === 0) {
        out.st = 'not_configured'
        // The message from the read service already names the object map to create. Rendering our
        // own sentence here would lose the specific one and replace it with a vaguer one.
        out.msg = results[0].message
        return out
    }

    const live = []
    const failed = []
    for (let i = 0; i < configured.length; i++) {
        const s: ReadState = configured[i].state
        if (s === 'live' || s === 'stale' || s === 'partial') {
            live.push(configured[i])
        } else {
            failed.push(configured[i])
        }
    }

    if (live.length === 0) {
        out.st = 'failed'
        out.msg = failed[0].message
        return out
    }

    let rows: any[] = []
    let asOf = ''
    let anyStale = false
    let anyPartial = false
    let genuinelyEmpty = true
    for (let i = 0; i < live.length; i++) {
        rows = rows.concat(live[i].rows)
        if (live[i].asOf && live[i].asOf > asOf) {
            asOf = live[i].asOf
        }
        if (live[i].state === 'stale') {
            anyStale = true
        }
        if (live[i].state === 'partial') {
            anyPartial = true
        }
        if (!live[i].genuinelyEmpty) {
            genuinelyEmpty = false
        }
    }

    out.st = failed.length > 0 || anyPartial ? 'partial' : anyStale ? 'stale' : 'live'
    out.rows = rows
    // `n` IS OMITTED UNLESS IT IS A REAL COUNT FROM A SUCCESSFUL READ. A `0` written here for an
    // area that failed is the one thing this application exists to prevent, and the client reads
    // this with `'n' in area`, never with `area.n || 0`.
    if (out.st === 'live' || out.st === 'stale') {
        out.n = rows.length
    }
    if (asOf) {
        out.as_of = asOf
    }
    if (genuinelyEmpty && rows.length === 0) {
        out.empty = true
    }
    if (failed.length > 0) {
        out.msg = failed[0].message
    } else if (anyPartial) {
        for (let i = 0; i < live.length; i++) {
            if (live[i].state === 'partial') {
                out.msg = live[i].message
                break
            }
        }
    }
    return out
}

/** GET /api/x_335329_sn_hr_erp/hub/me */
export function getEss(request: any, response: any): void {
    const user = String(gs.getUserID())
    const systems = activeSystems()
    const areas: any[] = []

    for (let a = 0; a < AREAS.length; a++) {
        const results: ReadResult[] = []
        for (let s = 0; s < systems.length; s++) {
            results.push(readForEmployee(user, systems[s], AREAS[a].logicalObject))
        }
        areas.push(merge(AREAS[a], results))
    }

    response.setStatus(200)
    response.setBody({ areas: areas })
}
