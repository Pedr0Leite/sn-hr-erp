import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { fetch } from '../connector/erp-connector.ts'
import { loadMap } from '../connector/config-loader.ts'
import { checkThrottle } from '../connector/throttle.ts'
import { gateWrite } from './approval-gate.ts'
import { resolveCutoff } from './cutoff.ts'
import { alreadyConfirmed, idempotencyKey } from './idempotency.ts'
import type { WriteIdentity } from './idempotency.ts'
import { raiseException } from './exception-queue.ts'
import { recordForObject } from '../telemetry.ts'

/**
 * NV-3 -- the write dispatcher. The single governed path from ServiceNow to any ERP.
 *
 * OD42: EVERY WRITE GOES THROUGH `erp-connector.fetch()`, which is where retry classification,
 * exponential backoff, the circuit breaker, `Retry-After` handling and per-attempt `call_log`
 * telemetry already live. A dispatcher issuing its own RESTMessageV2 would have been shorter and
 * would have forfeited the entire TRD §2 error-semantics pass -- the one area this application
 * already scores as beyond-compliant. A second HTTP path in this app is a defect, not a shortcut.
 *
 * THE ORDER OF THE PRE-FLIGHT CHECKS IS THE DESIGN. Each refusal happens BEFORE the request is
 * built, each writes its own distinct state, and none of them is reachable by accident:
 *
 *   1. read_only        -> blocked_readonly   (a configuration choice)
 *   2. approval gate    -> blocked_approval   (a governance outcome)   <- OD44 layer two
 *   3. payroll cut-off  -> blocked_cutoff     (a timing outcome)
 *   4. idempotency      -> confirmed, no call (already done, don't repeat it)
 *   5. throttle         -> stays queued       (the ERP would suspend the tenant)
 *
 * Collapsing any two of those into one `blocked` destroys the reason a write did not happen,
 * which is the only thing the employee and the auditor actually need to know.
 */

export interface DispatchResult {
    ok: boolean
    state: string
    /** Plain language, safe to render on a case or RITM. */
    message: string
    writeId: string
    ackRef: string
}

function setState(writeId: string, state: string, message: string): void {
    const gr = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    if (!gr.get('sys_id', writeId)) {
        return
    }
    gr.setValue('state', state)
    if (message) {
        gr.setValue('error_message', message)
    }
    gr.update()
}

function out(ok: boolean, state: string, message: string, writeId: string, ackRef: string): DispatchResult {
    return { ok: ok, state: state, message: message, writeId: writeId, ackRef: ackRef }
}

/**
 * Dispatch one write.
 *
 * `writeId` must already exist in state `queued` -- the row is created by the calling flow so
 * that a write always has a case behind it before anything is attempted (NV-8).
 *
 * `payload` IS PASSED IN AND NEVER STORED. erp_write records that a write happened, to which
 * external id, under which approval -- never what the value was. Persisting the body so the
 * dispatcher could read it back would put a salary and an IBAN in the audit table and recreate
 * the shadow database D2 exists to prevent. The row keeps `request_hash` instead, which proves
 * two attempts carried the same content without the content being there to leak.
 *
 * `effectiveDate` drives the payroll cut-off and is the CHANGE's date, not today's -- a leave
 * request booked for next month is judged against next month's calendar.
 */
export interface PreflightResult {
    /** True only when every gate cleared and the caller may now transport the payload. */
    proceed: boolean
    /** The state already written to the row when `proceed` is false. */
    state: string
    message: string
    key: string
    /** Set when a prior confirmed write already carries this key. */
    priorAck: string
    systemId: string
    logicalObject: string
    operation: string
    externalId: string
    /** NV-51. The country the write map was resolved with; the dispatch must use the same one. */
    country: string
}

function refuse(state: string, message: string, priorAck: string): PreflightResult {
    return {
        proceed: false,
        state: state,
        message: message,
        key: '',
        priorAck: priorAck,
        systemId: '',
        logicalObject: '',
        operation: '',
        externalId: '',
        country: '',
    }
}

/**
 * The five pre-flight gates, in order, EXTRACTED SO THE BINARY PATH CANNOT SKIP THEM.
 *
 * NV-37 archives a PDF, which `erp-connector.fetch()` cannot carry (trap 15: `getBody()` is
 * unusable on a response saved as an attachment, so the binary transport is a separate file by
 * necessity -- NV-5, OD43). That is a transport exception, and it must not become a GOVERNANCE
 * exception: an archival that skipped the approval gate or the cut-off would be exactly the
 * second uncontrolled write path OD42 forbids. Both dispatch() and archiveDocument() therefore
 * call THIS function, and the split is transport-only.
 */
export function preflight(writeId: string, effectiveDate: string): PreflightResult {
    const w = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    if (!w.get('sys_id', writeId)) {
        return refuse('failed', 'Write record not found.', '')
    }

    const systemId = String(w.getValue('erp_system') || '')
    const logicalObject = String(w.getValue('logical_object') || '')
    const operation = String(w.getValue('operation') || '')
    const externalId = String(w.getValue('external_id') || '')

    const sys = new GlideRecord('x_335329_sn_hr_erp_erp_system')
    if (!sys.get('sys_id', systemId)) {
        setState(writeId, 'failed', 'ERP system not found.')
        return refuse('failed', 'ERP system not found.', '')
    }

    // ---- 1. read_only. OD42 kept this refusal structural; it is checked FIRST and never
    // collapsed into a generic failure. A read-only system is a decision someone recorded.
    if (String(sys.getValue('read_only')) === '1') {
        const msg = 'System is marked read-only; write refused.'
        setState(writeId, 'blocked_readonly', msg)
        return refuse('blocked_readonly', msg, '')
    }

    // The payroll country, resolved from the ERP link. Needed by the map lookup below AND by the
    // cut-off, so it is resolved once rather than twice with two chances to disagree.
    const country = resolvePayrollCountry(externalId, systemId)

    // ---- 1b. OD51. THE WRITE MUST HAVE ITS OWN MAP, AND THAT MAP MUST SPEAK A WRITE VERB.
    //
    // Before the `operation` qualifier existed, a write resolved the READ map: `rest-client` then
    // sent GET, dropped the body (`if (verb !== 'get' && params.body)`), and `extractAck()` read
    // an `id` out of the read response and marked the write `confirmed`. Nothing had been sent.
    // That is the worst failure this application can produce -- an employee told their banking
    // details changed when no request ever left the instance.
    //
    // `not configured` NAMES THE MAP TO CREATE, exactly as a tile does.
    const writeMap = loadMap(systemId, logicalObject, operation, country)
    if (!writeMap || !writeMap.active) {
        const msg =
            'Not configured -- create an Object Map for ' + logicalObject + ' with operation ' + operation
        setState(writeId, 'failed', msg)
        return refuse('failed', msg, '')
    }
    if (String(writeMap.httpMethod || 'get').toLowerCase() === 'get') {
        const msg =
            'Not configured -- the Object Map for ' +
            logicalObject +
            '.' +
            operation +
            ' is set to GET. A write needs POST, PATCH or PUT.'
        setState(writeId, 'failed', msg)
        return refuse('failed', msg, '')
    }

    // ---- 2. The approval gate, OD44 LAYER TWO. This is not a business rule, so a rule that
    // throws (trap 5 -- swallowed, record saves) cannot lift it.
    const gate = gateWrite(writeId)
    if (!gate.allowed) {
        setState(writeId, 'blocked_approval', gate.reason)
        return refuse('blocked_approval', gate.reason, '')
    }

    // ---- 3. Payroll cut-off. An absent calendar REFUSES (NV-7): an absence must never be read
    // as a permission.
    const cutoff = resolveCutoff(
        systemId,
        country,
        String(effectiveDate || '').substring(0, 10),
        logicalObject,
        String(w.getValue('policy_key') || ''),
    )
    if (!cutoff.clear) {
        setState(writeId, 'blocked_cutoff', cutoff.message)
        if (cutoff.effectiveCycle) {
            const q = new GlideRecord('x_335329_sn_hr_erp_erp_write')
            if (q.get('sys_id', writeId)) {
                q.setValue('effective_cycle', cutoff.effectiveCycle)
                q.update()
            }
        }
        return refuse('blocked_cutoff', cutoff.message, '')
    }

    // ---- 4. Idempotency. Checked before EVERY create, not only after a timeout: the ambiguous
    // case is precisely the one where the caller does not know a retry is happening.
    const identity: WriteIdentity = {
        logicalObject: logicalObject,
        operation: operation,
        externalId: externalId,
        sourceRecord: String(w.getValue('source_record') || ''),
        qualifier: String(w.getValue('effective_cycle') || ''),
    }
    const key = String(w.getValue('idempotency_key') || idempotencyKey(identity))
    const priorAck = alreadyConfirmed(systemId, key)
    if (priorAck && operation === 'create') {
        const msg = 'Already recorded in the ERP.'
        setState(writeId, 'confirmed', msg)
        return refuse('confirmed', msg, priorAck)
    }

    // ---- 5. Throttle. On some vendors a breach SUSPENDS the whole environment for a minute, so
    // a write that would breach waits rather than taking every employee down with it.
    const throttle = checkThrottle(
        systemId,
        parseInt(String(sys.getValue('rate_limit_per_min') || '0'), 10),
        parseInt(String(sys.getValue('rate_limit_safety_pct') || '80'), 10),
    )
    if (!throttle.allow) {
        setState(writeId, 'queued', throttle.message)
        return refuse('queued', throttle.message, '')
    }

    return {
        proceed: true,
        state: '',
        message: '',
        key: key,
        priorAck: '',
        systemId: systemId,
        logicalObject: logicalObject,
        operation: operation,
        externalId: externalId,
        country: country,
    }
}

export function dispatch(writeId: string, payload: string, effectiveDate: string): DispatchResult {
    const result = dispatchInner(writeId, payload, effectiveDate)
    // NV-50. The write half of the shared instrumentation hook. `blocked_cutoff` and
    // `blocked_approval` reach the dashboard as themselves, so "employees are blocked by cut-off"
    // never gets counted as "employees do not use this".
    const w = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    if (w.get('sys_id', writeId)) {
        recordForObject(
            String(w.getValue('logical_object') || ''),
            'submit',
            result.state,
            String(w.getValue('erp_system') || ''),
        )
    }
    return result
}

function dispatchInner(writeId: string, payload: string, effectiveDate: string): DispatchResult {
    const pre = preflight(writeId, effectiveDate)
    if (!pre.proceed) {
        // `confirmed` is the one refusal that is a SUCCESS: the ERP already holds this change.
        return out(pre.state === 'confirmed', pre.state, pre.message, writeId, pre.priorAck)
    }

    const w = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    if (!w.get('sys_id', writeId)) {
        return out(false, 'failed', 'Write record not found.', writeId, '')
    }
    const systemId = pre.systemId
    const logicalObject = pre.logicalObject
    const operation = pre.operation
    const externalId = pre.externalId
    const key = pre.key

    // ---- Dispatch. first_sent_at is stamped BEFORE the call: the gate compares an approval's
    // timestamp against it, so a value written afterwards would let a late approval look prior.
    const stamp = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    if (stamp.get('sys_id', writeId)) {
        if (!String(stamp.getValue('first_sent_at') || '')) {
            stamp.setValue('first_sent_at', new GlideDateTime().getValue())
        }
        stamp.setValue('idempotency_key', key)
        // The hash, never the body. Two attempts of the same logical write must be provably
        // identical without the payload being readable from the audit trail.
        stamp.setValue('request_hash', hashPayload(payload))
        stamp.setValue('attempts', parseInt(String(stamp.getValue('attempts') || '0'), 10) + 1)
        stamp.setValue('state', 'sent')
        stamp.update()
    }

    const result = fetch(systemId, logicalObject, {
        externalId: externalId,
        body: payload,
        // OD51. Without this the read map is resolved and the body is silently dropped.
        operation: operation,
        // NV-51. The same country the pre-flight resolved the map with.
        country: pre.country,
    })

    // Append the call_log id AS THE CALL HAPPENS, so a failure still has its trail (L6-D7).
    if (result.callLogId) {
        const t = new GlideRecord('x_335329_sn_hr_erp_erp_write')
        if (t.get('sys_id', writeId)) {
            const existing = String(t.getValue('call_log_ids') || '')
            t.setValue('call_log_ids', existing ? existing + ',' + result.callLogId : result.callLogId)
            t.update()
        }
    }

    if (!result.ok) {
        const msg = result.errorMessage || 'ERP did not answer'
        setState(writeId, 'failed', msg)
        raiseException({
            systemId: systemId,
            status: result.httpCode || 0,
            transportError: result.errorCode === 'TIMEOUT' ? 'timed out' : '',
            shortDescription: 'Write to the ERP failed for ' + logicalObject + '.' + operation,
            erpMessage: msg,
            writeId: writeId,
            sourceTable: String(w.getValue('source_table') || ''),
            sourceRecord: String(w.getValue('source_record') || ''),
            assignmentGroup: defaultAssignmentGroup(),
            callLogIds: String(result.callLogId || ''),
        })
        return out(false, 'failed', msg, writeId, '')
    }

    // A 2xx IS NOT SUCCESS ON ITS OWN. TRD §2: a write returning no confirmable identifier is
    // `failed`, never `confirmed`. "The ERP accepted my request" and "the ERP recorded my change"
    // are different claims, and only the second one is worth telling an employee.
    const ack = extractAck(result.body)
    if (!ack) {
        const msg = 'Write returned no confirmable status (TRD §2 Write pattern).'
        setState(writeId, 'failed', msg)
        return out(false, 'failed', msg, writeId, '')
    }

    const done = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    if (done.get('sys_id', writeId)) {
        done.setValue('state', 'confirmed')
        done.setValue('erp_ack_ref', ack)
        done.setValue('confirmed_at', new GlideDateTime().getValue())
        done.update()
    }
    return out(true, 'confirmed', 'Recorded in the ERP as ' + ack, writeId, ack)
}

/**
 * A stable fingerprint of the dispatched payload.
 *
 * Not a cryptographic hash and does not need to be: it answers "did the retry send the same thing
 * as the first attempt?", where the alternative being guarded against is an accident, not an
 * attacker. GlideDigest is unavailable to this scope for SHA-256 over a string in every release,
 * so a deterministic checksum is used rather than a dependency that may not resolve at runtime.
 */
export function hashPayload(payload: string): string {
    const text = String(payload || '')
    let h1 = 0x811c9dc5
    let h2 = 0x01000193
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i)
        h1 = (h1 ^ c) >>> 0
        h1 = (h1 * 0x01000193) >>> 0
        h2 = (h2 + c * (i + 1)) >>> 0
    }
    return ('00000000' + h1.toString(16)).slice(-8) + ('00000000' + h2.toString(16)).slice(-8) + ':' + text.length
}

/** The employee's payroll country comes FROM THE ERP LINK, never from the user's location. */
function resolvePayrollCountry(employeeKey: string, systemId: string): string {
    if (!employeeKey) {
        return ''
    }
    const gr = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    gr.addQuery('erp_system', systemId)
    gr.addQuery('erp_employee_key', employeeKey)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? String(gr.getValue('payroll_country') || '') : ''
}

/**
 * The confirmable identifier from a write response.
 *
 * Deliberately conservative: anything not recognised returns '' and the write becomes `failed`.
 * Guessing an acknowledgement is how a write that never landed gets reported as confirmed.
 */
export function extractAck(body: string | null): string {
    if (!body) {
        return ''
    }
    let parsed: { [k: string]: unknown }
    try {
        parsed = JSON.parse(String(body))
    } catch (e) {
        return ''
    }
    if (!parsed || typeof parsed !== 'object') {
        return ''
    }
    // A Scripted REST response is wrapped in {"result": ...} -- including error bodies (trap 2).
    const root = (parsed as { result?: { [k: string]: unknown } }).result || parsed
    const candidates = ['id', 'Id', 'ID', 'documentId', 'requestId', 'reference', 'number', 'key']
    for (let i = 0; i < candidates.length; i++) {
        const v = (root as { [k: string]: unknown })[candidates[i]]
        if (typeof v === 'string' && v !== '') {
            return v
        }
        if (typeof v === 'number') {
            return String(v)
        }
    }
    return ''
}

/** Configurable rather than hard-coded; an exception with no group is refused at insert. */
export function defaultAssignmentGroup(): string {
    const gr = new GlideRecord('sys_user_group')
    gr.addQuery('name', 'HR ERP Exceptions')
    gr.setLimit(1)
    gr.query()
    return gr.next() ? String(gr.getUniqueValue()) : ''
}
