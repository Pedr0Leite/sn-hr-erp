import { GlideDateTime } from '@servicenow/glide'
import { fetch } from '../connector/erp-connector.ts'
import { mapResponse } from '../connector/field-mapper.ts'
import type { MappedRecord } from '../connector/field-mapper.ts'
import type { FieldMapEntry } from '../connector/types.ts'
import { loadMap, loadSystem } from '../connector/config-loader.ts'
import { checkThrottle, fitsReadBudget } from '../connector/throttle.ts'
import { notConfiguredFor } from '../country.ts'
import { recordForObject } from '../telemetry.ts'
import { payrollCountryChecked } from '../write/country-check.ts'
import { resolveIdentity } from '../write/identity.ts'

/**
 * NV-13, NV-22, NV-24, NV-26, NV-27, NV-28 -- the shared read path for every employee-facing
 * widget in the Noviq backlog.
 *
 * ONE READ PATH, NOT ONE PER WIDGET. Every story in Epics C-J renders the same six states, and
 * six copies of that logic would drift until one of them rendered `0` for an absence -- which is
 * the single failure this whole application exists to prevent.
 *
 * NOTHING HERE IS EVER STAGED. All eleven Noviq entities carry `category: null`, so the staging
 * query cannot reach them (DL-D2, BRD O3). These reads are synchronous and on-demand: a balance
 * an employee acts on must be the ERP's current truth, not last night's batch.
 */

/**
 * The six states. `throttled` is the fifth thing found during story validation: a queued read
 * that burns its timeout budget would otherwise render `failed`, reporting an ERP that WOULD have
 * answered as one that did not.
 */
export type ReadState = 'live' | 'not_configured' | 'failed' | 'stale' | 'partial' | 'throttled'

export interface ReadResult {
    state: ReadState
    rows: MappedRecord[]
    /** Rendered verbatim by the widget. Never assembled client-side. */
    message: string
    /** Present only with state `live`. */
    asOf: string
    /** True only when a successful call returned an empty set -- the ONLY time `0` may render. */
    genuinelyEmpty: boolean
}

function state(s: ReadState, message: string): ReadResult {
    return { state: s, rows: [], message: message, asOf: '', genuinelyEmpty: false }
}

/**
 * Read one logical object for the signed-in employee.
 *
 * `userSysId` is the SESSION user. A widget must never accept an employee id from the client --
 * that is how one employee reads another's payslip.
 */
export function readForEmployee(userSysId: string, systemId: string, logicalObject: string): ReadResult {
    const result = readInner(userSysId, systemId, logicalObject)
    // NV-50. ONE instrumentation point for every employee-facing read in the application, so an
    // area cannot look unused because a widget author forgot to instrument it. Best-effort: the
    // return value is ignored deliberately -- telemetry never changes what the employee is shown.
    recordForObject(logicalObject, 'view', result.state, systemId)
    return result
}

function readInner(userSysId: string, systemId: string, logicalObject: string): ReadResult {
    // 1. Identity first. An unlinked user gets a named remedy and NO FIGURE OF ANY KIND.
    const identity = resolveIdentity(userSysId, systemId)
    if (!identity.ok) {
        return state('not_configured', identity.message)
    }

    // NV-51 AC4. The ERP's country wins, and a disagreement with the ServiceNow user record is
    // RAISED rather than resolved silently. Checked on the identity-bearing read only: it is the
    // one object whose response is about the employee themselves, and running it on every payslip
    // list would add two queries per widget for the same answer.
    if (logicalObject === 'employee_profile') {
        payrollCountryChecked(userSysId, systemId)
    }

    // 2. Configuration. `not configured` NAMES THE MAP TO CREATE rather than saying "no data" --
    // an admin who is told what is missing fixes it; one who sees an empty tile investigates
    // nothing.
    const system = loadSystem(systemId).config
    if (!system || !system.active) {
        return state('not_configured', 'Not configured -- no active ERP system.')
    }
    // NV-51. The employee's payroll country selects the map, and a country with no map of its own
    // falls back to the agnostic row -- never to another country's.
    const map = loadMap(systemId, logicalObject, 'read', identity.payrollCountry)
    if (!map) {
        return state(
            'not_configured',
            identity.payrollCountry
                ? notConfiguredFor(identity.payrollCountry, 'Object Map for ' + logicalObject)
                : 'Not configured -- create an Object Map for ' + logicalObject,
        )
    }

    // 3. Throttle, measured against the read budget rather than applied blindly.
    const throttle = checkThrottle(
        systemId,
        Number((system as { rateLimitPerMin?: number }).rateLimitPerMin || 0),
        Number((system as { rateLimitSafetyPct?: number }).rateLimitSafetyPct || 80),
    )
    if (!throttle.allow && !fitsReadBudget(throttle.waitMs, Number(system.timeoutMs || 30000))) {
        return state('throttled', throttle.message)
    }

    // 4. The call.
    const result = fetch(systemId, logicalObject, {
        externalId: identity.employeeKey,
        country: identity.payrollCountry,
    })

    if (result.status === 'not_configured') {
        return state('not_configured', 'Not configured -- create an Object Map for ' + logicalObject)
    }
    if (!result.ok) {
        // NEVER `0`, never an empty list, never a blank tile. The employee is told the ERP did
        // not answer, which is a different fact from "you have nothing".
        return state('failed', 'ERP did not answer')
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(String(result.body || ''))
    } catch (e) {
        return state('failed', 'Document could not be read -- the ERP returned an unexpected format')
    }

    const rows = mapResponse(parsed, map.responseRoot, logicalObject, map.fields, map.dateFormat)
    // NULL IS NOT AN EMPTY LIST. mapResponse returns null when `response_root` did not resolve to
    // an array -- "the configured path is wrong" and "there are no rows" are different answers,
    // and rendering the first as the second is how a misconfiguration becomes an innocent `0`.
    if (rows === null) {
        return state('failed', 'Not configured -- response root did not resolve for ' + logicalObject)
    }
    // NV-51 AC2. A field this jurisdiction declares mandatory, absent from the response, makes the
    // read `partial` AND NAMES THE FIELD. Rendering it as a blank cell is how a country-specific
    // requirement quietly stops being met -- the row looks complete because nothing says otherwise.
    const missing = missingMandatory(map.fields, rows)
    if (missing) {
        return {
            state: 'partial',
            rows: rows,
            message: 'The ERP did not return ' + missing + ', which is required for this employee\'s country.',
            asOf: new GlideDateTime().getValue(),
            genuinelyEmpty: false,
        }
    }

    return {
        state: 'live',
        rows: rows,
        message: '',
        asOf: new GlideDateTime().getValue(),
        // The ONLY route to a rendered zero in this application: a call that succeeded and
        // genuinely contained nothing.
        genuinelyEmpty: rows.length === 0,
    }
}


/**
 * The first jurisdiction-mandatory field missing from EVERY returned row, or ''.
 *
 * Checked across rows rather than per row: a list of payslips where one period lacks an optional
 * figure is not a partial read, but a mandatory field absent from all of them is a mapping or a
 * jurisdiction problem. An empty result set cannot be missing anything -- that is `live` and
 * genuinely empty, which is a different finding.
 */
export function missingMandatory(fields: FieldMapEntry[], rows: MappedRecord[]): string {
    if (rows.length === 0) {
        return ''
    }
    for (let f = 0; f < fields.length; f++) {
        if (!fields[f].mandatory) {
            continue
        }
        let seen = false
        for (let r = 0; r < rows.length && !seen; r++) {
            const value = (rows[r] as { [k: string]: string })[fields[f].logicalField]
            if (value !== undefined && value !== null && String(value) !== '') {
                seen = true
            }
        }
        if (!seen) {
            return fields[f].logicalField
        }
    }
    return ''
}
