import { GlideRecord } from '@servicenow/glide'
import { classify } from '../connector/classify.ts'
import type { AttemptResult } from '../connector/types.ts'

/**
 * NV-12 -- the HR exception queue. TRD §2 error semantics, BRD §7 error handling.
 *
 * REUSES connector/classify.ts. There is no second classifier in this application: RETRYABLE_STATUS
 * (408/425/429/500/502/503/504), the backoff and the circuit breaker are already the app's
 * strongest area (`docs/noviq-brd-trd-alignment.md` §2 scores it beyond-compliant). A second
 * classifier would drift from the first and the drift would surface as a retry storm.
 *
 * THE CATEGORY LIST IS CLOSED, AND THAT IS THE STORY. `erp_exception.category` is one of eight.
 * A generic `Error` value is what makes a queue unworked -- an agent opening the list cannot tell
 * a wrong password from an ERP outage, so nobody picks either up.
 */

/** HTTP status to one of the eight. The mapping is the whole judgement in this module. */
export function categoryForStatus(status: number, transportError: string): string {
    if (transportError) {
        // No HTTP status at all: the request never completed. Timeout and unreachable are
        // different findings -- one may succeed on retry, the other needs someone to look.
        return /timeout|timed out/i.test(transportError) ? 'timeout' : 'erp_unavailable'
    }
    if (status === 400 || status === 422) {
        return 'validation_failure'
    }
    if (status === 401 || status === 403) {
        return 'permission_denied'
    }
    if (status === 404) {
        return 'record_not_found'
    }
    if (status === 409) {
        return 'conflict_duplicate'
    }
    if (status === 429) {
        return 'rate_limited'
    }
    if (status >= 500) {
        return 'erp_unavailable'
    }
    return 'unexpected_format'
}

export interface RaiseParams {
    systemId: string
    status: number
    transportError: string
    /** Plain language, for an HR agent. Never a stack trace, never the raw body. */
    shortDescription: string
    /** The vendor's own field-level message where it carried one. Never a payload value. */
    erpMessage: string
    writeId: string
    sourceTable: string
    sourceRecord: string
    assignmentGroup: string
    callLogIds: string
}

/**
 * Raise an exception row. Returns its sys_id, or '' when nothing was raised.
 *
 * A RETRIABLE FAILURE THAT LATER SUCCEEDED RAISES NOTHING (NV-12 AC3): a queue containing every
 * transient blip is a queue nobody reads. Only an exhausted retry or a non-retriable failure
 * reaches here.
 */
export function raiseException(p: RaiseParams): string {
    if (!p.assignmentGroup) {
        // An exception with no owner is an exception nobody works. Refusing to create it is worse
        // than useless, so this is a configuration failure that must be loud at build time --
        // the mandatory column on the table refuses the insert regardless.
        return ''
    }
    const gr = new GlideRecord('x_335329_sn_hr_erp_erp_exception')
    gr.initialize()
    gr.setValue('erp_system', p.systemId)
    gr.setValue('category', categoryForStatus(p.status, p.transportError))
    gr.setValue('short_description', p.shortDescription)
    gr.setValue('erp_message', p.erpMessage)
    if (p.writeId) {
        gr.setValue('erp_write', p.writeId)
    }
    gr.setValue('source_table', p.sourceTable)
    gr.setValue('source_record', p.sourceRecord)
    gr.setValue('assignment_group', p.assignmentGroup)
    gr.setValue('state', 'open')
    gr.setValue('call_log_ids', p.callLogIds)
    return String(gr.insert() || '')
}

/**
 * Should this failure be retried at all?
 *
 * Delegates to the existing classifier rather than restating the status list. NV-12 AC2 asserts
 * `call_log` shows exactly ONE attempt for a 422 -- proving the non-retriable path never entered
 * the retry loop.
 */
export function isRetriable(attempt: AttemptResult): boolean {
    // `retryable`, not `retriable` -- the existing Classification spells it with the y.
    return classify(attempt).retryable
}
