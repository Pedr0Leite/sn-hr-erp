import { gs } from '@servicenow/glide'
import { fetch } from './erp-connector.ts'
import {
    MARK_VIEWER,
    assert,
    clearBreaker,
    clearCallLog,
    getSystemField,
    isFutureDateTime,
    log,
    readCallLog,
    summarise,
} from './test-driver-util.ts'

/**
 * T30 / T31 -- and T2-14, this layer's only NON-ADMIN case.
 *
 * THE QUESTION: does an in-scope GlideRecord, running as a genuine non-admin `viewer`, read the
 * admin-field-ACL'd connection columns on `erp_system` and write `circuit_open_until`? If ACLs
 * apply to scoped server-side GlideRecord, a viewer-invoked connector reads base_url and
 * auth_profile_* as EMPTY and cannot write the breaker field. Neither failure throws; both are
 * silent. This is an L3 blocker as much as an L2 one.
 *
 * HOW THIS IS RUN, AND ITS LIMIT -- STATED, NOT GLOSSED: no browser session is available, so UI
 * impersonation is impossible, and L1 recorded that basic-auth login as a programmatically
 * created user returns an instance-level 401. This runs instead as a Scheduled Script whose
 * `runAs` is `hrerp_viewer_only`, which needs no password and routes around that 401.
 *
 * `runAs` sets the session user for the job, but scheduled-job execution context is NOT
 * identical to an interactive session. A PASS here is good evidence that scoped GlideRecord
 * does not silently blank these fields for a non-admin; it is NOT the browser verification C5
 * still requires, and it must never be reported as such.
 *
 * ALSO: kickoff §9 records that `gs.hasRole()` LIES under `runAs`. The role line below is
 * therefore logged as an observation, not used as a gate.
 */

const M = MARK_VIEWER
const SYS_A = 'x_335329_sn_hr_erp.test.system_a'

export function runViewerTests(): void {
    const a = gs.getProperty(SYS_A, '') || ''
    if (!a) {
        gs.error(M + ' property ' + SYS_A + ' not set')
        return
    }

    log(M, '===== VIEWER DRIVER BEGIN =====')
    log(M, 'running as user=' + gs.getUserName() + ' hasAdmin=' + gs.hasRole('admin') +
        ' hasViewer=' + gs.hasRole('x_335329_sn_hr_erp.viewer') +
        ' (gs.hasRole is unreliable under runAs -- observation only, kickoff §9)')

    // If this is running as admin, the test proves nothing. Say so loudly rather than reporting
    // a meaningless PASS.
    if (gs.getUserName() === 'admin' || gs.getUserName() === 'system') {
        log(M, 'WARNING: NOT running as hrerp_viewer_only. T30/T31/T2-14 below are NOT valid non-admin evidence.')
    }

    try {
        // ---- T30 / T2-14: a viewer-invoked call succeeds AND logs -------------------------
        clearBreaker(a)
        clearCallLog(a)

        const r = fetch(a, 'invoice')
        const rows = readCallLog(a)
        log(M, 'T30 ok=' + r.ok + ' status=' + r.status + ' http=' + r.httpCode + ' errorCode=' + String(r.errorCode) + ' | ' + summarise(rows))

        if (r.errorCode === 'CONFIG_UNREADABLE') {
            log(M, 'FAIL T30 | CONFIG_UNREADABLE -- scoped GlideRecord IS enforcing the admin-only field read ACLs.')
            log(M, 'That resolves the open question the BAD way and is an L3 BLOCKER. Route to the architect.')
            log(M, 'Do NOT work around it by loosening the field ACLs, and do NOT build a Plan B here.')
            log(M, '===== VIEWER DRIVER END =====')
            return
        }

        assert(M, 'T30', 'viewer-invoked call succeeds', r.ok === true, 'ok=' + r.ok + ' code=' + String(r.errorCode))
        // >= 1, not === 1: C7 logs one row PER ATTEMPT, so a legitimately retried call produces
        // 2-3 rows. This assertion is about the create grant working at all.
        assert(M, 'T2-14', 'NON-ADMIN: viewer can INSERT call_log (L2-4 create grant works)', rows.length >= 1, String(rows.length))
        log(M, 'T2-14 NOTE: zero rows here would mean telemetry is invisible to exactly the users who generate it, AND that the breaker could never see enough failures to trip.')

        // ---- T31: a viewer trips the breaker ---------------------------------------------
        clearBreaker(a)
        clearCallLog(a)

        fetch(a, 'balance')
        fetch(a, 'balance')

        const rows31 = readCallLog(a)
        const until = getSystemField(a, 'circuit_open_until')
        log(M, 'T31 circuit_open_until="' + until + '" | ' + summarise(rows31))

        assert(M, 'T31', 'viewer logged 6 attempt rows', rows31.length === 6, String(rows31.length))

        const wrote = until !== '' && isFutureDateTime(until)
        assert(M, 'T31', 'viewer WROTE circuit_open_until (erp_system write permitted)', wrote, '"' + until + '"')

        if (!wrote && rows31.length === 6) {
            // A silent no-write here leaves the breaker permanently disabled for every non-admin
            // caller -- which is the entire population from L4 onwards.
            log(M, 'FAIL T31 | rows logged but circuit_open_until did NOT change: the viewer cannot write erp_system.')
            log(M, 'STOP and route to the architect. Do not build a workaround here.')
        }

        clearBreaker(a)
        clearCallLog(a)
    } catch (e) {
        gs.error(M + ' VIEWER DRIVER THREW: ' + (e && (e as Error).message ? (e as Error).message : String(e)))
    }
    log(M, '===== VIEWER DRIVER END =====')
}
