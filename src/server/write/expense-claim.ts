import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { loadMap, loadSystem } from '../connector/config-loader.ts'
import { buildEndpoint } from '../connector/rest-client.ts'
import { uploadBinary } from '../connector/binary-client.ts'
import { readForEmployee } from '../ess/read-service.ts'
import { resolveIdentity } from './identity.ts'
import { dispatch, extractAck } from './dispatcher.ts'
import { createWrite } from './create-write.ts'
import type { DispatchResult } from './dispatcher.ts'

/**
 * NV-34 and NV-35 -- submit an expense claim with receipts, and read its status back.
 *
 * THE RECEIPTS ARE UPLOADED AFTER THE CLAIM IS CONFIRMED, NEVER BEFORE. NV-34 AC6 asks for
 * orphaned receipts to be cleaned up or the claim retried; ordering removes the failure instead
 * of compensating for it -- a receipt cannot be orphaned by a claim that does not exist yet if no
 * receipt is sent until the claim's identifier comes back. The cheaper fix is the correct one.
 *
 * EVERY AMOUNT CARRIES AN EXPLICIT CURRENCY. A bare number in an expenses system is a number in
 * whichever currency the reader assumes, and the two readers are the employee and Finance.
 */

export const CLAIM_POLICY_KEY = 'expense_claim.create'

export interface ClaimLine {
    amount: string
    currency: string
    category: string
    vatAmount: string
    vatCode: string
    /** sys_attachment sys_id of the receipt, or '' where policy does not require one. */
    receiptAttachmentId: string
    receiptFileName: string
    receiptContentType: string
}

export interface ValidationResult {
    ok: boolean
    /** Plain language and specific. Renders against the LINE it concerns where a line is at fault. */
    message: string
    /** 1-based line number, or 0 for a header-level problem. */
    line: number
}

function ok(): ValidationResult {
    return { ok: true, message: '', line: 0 }
}

function bad(message: string, line: number): ValidationResult {
    return { ok: false, message: message, line: line }
}

/** Cents, to avoid the float comparison that makes 0.1 + 0.2 !== 0.3 refuse a valid claim. */
function cents(raw: string): number {
    const n = Number(String(raw || '').replace(',', '.'))
    if (isNaN(n)) {
        return NaN
    }
    return Math.round(n * 100)
}

/**
 * NV-34 AC4 (NV-20). The header total must equal the sum of the lines, and a mismatch NAMES BOTH
 * FIGURES -- "the totals do not match" leaves the employee guessing which one to correct.
 *
 * A mixed-currency claim is refused rather than summed. Adding 50 EUR to 50 USD produces 100 of
 * nothing, and an expenses system that does it will reimburse one of those numbers.
 */
export function totalsMatch(headerTotal: string, headerCurrency: string, lines: ClaimLine[]): ValidationResult {
    if (!lines || lines.length === 0) {
        return bad('A claim must have at least one line.', 0)
    }
    if (!String(headerCurrency || '')) {
        return bad('The claim has no currency. An amount with no currency cannot be submitted.', 0)
    }
    let sum = 0
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!String(line.currency || '')) {
            return bad('This line has no currency. Every amount needs an explicit currency.', i + 1)
        }
        if (String(line.currency) !== String(headerCurrency)) {
            return bad(
                'This line is in ' +
                    String(line.currency) +
                    ' but the claim is in ' +
                    String(headerCurrency) +
                    '. Submit one claim per currency.',
                i + 1,
            )
        }
        const amount = cents(line.amount)
        if (isNaN(amount)) {
            return bad('This line has no readable amount.', i + 1)
        }
        sum += amount
    }
    const total = cents(headerTotal)
    if (isNaN(total)) {
        return bad('The claim total is not a readable amount.', 0)
    }
    if (total !== sum) {
        return bad(
            'The claim total (' +
                String(headerTotal) +
                ' ' +
                String(headerCurrency) +
                ') does not equal the sum of its lines (' +
                (sum / 100).toFixed(2) +
                ' ' +
                String(headerCurrency) +
                ').',
            0,
        )
    }
    return ok()
}

/**
 * NV-34 AC2 -- receipts are validated against the ERP's OWN stated limits, server-side.
 *
 * With limits unconfigured the answer is not "allow it": it is that attachments are unavailable
 * and the item is not orderable. A guessed ceiling is repo rule 5 wearing a different hat.
 */
export function validateReceipts(systemId: string, lines: ClaimLine[], receiptRequired: boolean): ValidationResult {
    const system = loadSystem(systemId).config
    if (!system) {
        return bad('Not configured -- no active ERP system.', 0)
    }
    const maxBytes = Number((system as { maxAttachmentBytes?: number }).maxAttachmentBytes || 0)
    const allowed = String((system as { allowedMimeTypes?: string }).allowedMimeTypes || '')
    if (!maxBytes || !allowed) {
        return bad(
            'Not configured -- this ERP has no stated attachment limits, so receipts cannot be submitted.',
            0,
        )
    }
    for (let i = 0; i < lines.length; i++) {
        const id = String(lines[i].receiptAttachmentId || '')
        if (!id) {
            if (receiptRequired) {
                return bad('This line needs a receipt.', i + 1)
            }
            continue
        }
        const gr = new GlideRecord('sys_attachment')
        if (!gr.get('sys_id', id)) {
            return bad('The receipt on this line could not be read.', i + 1)
        }
        const size = parseInt(String(gr.getValue('size_bytes') || '0'), 10)
        if (size > maxBytes) {
            return bad(
                'The receipt on this line exceeds the ERP\'s stated limit of ' +
                    Math.floor(maxBytes / 1048576) +
                    ' MB.',
                i + 1,
            )
        }
        const type = String(gr.getValue('content_type') || '').split(';')[0].toLowerCase().trim()
        if (allowed.toLowerCase().indexOf(type) === -1) {
            return bad('This ERP does not accept ' + type + ' receipts.', i + 1)
        }
    }
    return ok()
}

export interface ClaimResult {
    dispatch: DispatchResult
    /** One entry per line that carried a receipt. Empty until the claim is confirmed. */
    receiptErrors: string[]
}

/**
 * NV-34 end to end.
 *
 * `approvalRef` is the HR/Finance policy approval (OQ-4 records that the BRD does not say whether
 * this is a formal approval record; it is implemented as one so the gate is testable).
 */
export function submitClaim(
    userSysId: string,
    systemId: string,
    sourceTable: string,
    sourceRecord: string,
    headerTotal: string,
    headerCurrency: string,
    lines: ClaimLine[],
    receiptRequired: boolean,
    approvalRef: string,
): ClaimResult {
    const fail = (message: string): ClaimResult => {
        return {
            dispatch: { ok: false, state: 'failed', message: message, writeId: '', ackRef: '' },
            receiptErrors: [],
        }
    }

    const identity = resolveIdentity(userSysId, systemId)
    if (!identity.ok) {
        return fail(identity.message)
    }
    const totals = totalsMatch(headerTotal, headerCurrency, lines)
    if (!totals.ok) {
        return fail(totals.line ? 'Line ' + totals.line + ': ' + totals.message : totals.message)
    }
    const receipts = validateReceipts(systemId, lines, receiptRequired)
    if (!receipts.ok) {
        return fail(receipts.line ? 'Line ' + receipts.line + ': ' + receipts.message : receipts.message)
    }

    const writeId = createWrite({
        systemId: systemId,
        logicalObject: 'expense_claim',
        operation: 'create',
        externalId: identity.employeeKey,
        sourceTable: sourceTable,
        sourceRecord: sourceRecord,
        requestedBy: userSysId,
        approvalRef: approvalRef,
        policyKey: CLAIM_POLICY_KEY,
    })
    if (!writeId) {
        return fail('The claim could not be queued.')
    }

    const payload = JSON.stringify({
        total: headerTotal,
        currency: headerCurrency,
        employee: identity.employeeKey,
        lines: lines.map(function (l) {
            return {
                amount: l.amount,
                currency: l.currency,
                category: l.category,
                vat_amount: l.vatAmount,
                vat_code: l.vatCode,
            }
        }),
    })
    const result = dispatch(writeId, payload, new GlideDateTime().getValue().substring(0, 10))
    if (!result.ok || result.state !== 'confirmed' || !result.ackRef) {
        // NO RECEIPTS ARE SENT. There is no claim to attach them to, so there is nothing to orphan.
        return { dispatch: result, receiptErrors: [] }
    }

    return { dispatch: result, receiptErrors: uploadReceipts(systemId, identity.employeeKey, result.ackRef, lines, sourceTable, sourceRecord, userSysId) }
}

/**
 * Upload each line's receipt against the confirmed claim.
 *
 * A failure here does NOT undo the claim: the claim is real and Finance can see it. The receipt
 * is retried, and the employee is told which line is missing one -- silently reporting a complete
 * claim with a missing receipt is what makes a reimbursement stall with nobody knowing why.
 */
function uploadReceipts(
    systemId: string,
    employeeKey: string,
    claimRef: string,
    lines: ClaimLine[],
    sourceTable: string,
    sourceRecord: string,
    userSysId: string,
): string[] {
    const errors: string[] = []
    const system = loadSystem(systemId).config
    // OD51: the CREATE map. A receipt is uploaded, not read.
    const map = loadMap(systemId, 'erp_attachment', 'create')
    if (!system || !map) {
        return ['Receipts could not be sent -- create an Object Map for erp_attachment with operation create.']
    }
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!String(line.receiptAttachmentId || '')) {
            continue
        }
        // The qualifier is the claim reference and the line number, so one receipt per line is
        // unique and a retry of the same line is the SAME key -- which is what the unique index on
        // (erp_system, idempotency_key) can now actually enforce.
        const writeId = createWrite({
            systemId: systemId,
            logicalObject: 'erp_attachment',
            operation: 'create',
            externalId: employeeKey,
            sourceTable: sourceTable,
            sourceRecord: sourceRecord,
            requestedBy: userSysId,
            qualifier: claimRef + '#' + (i + 1),
        })
        if (!writeId) {
            // The unique index on (erp_system, idempotency_key) refuses the second insert, which
            // is exactly the duplicate-receipt case NV-34 AC5 tests. Not an error to report.
            continue
        }
        const url = buildEndpoint(system, map, { externalId: claimRef })
        const upload = uploadBinary(
            system,
            url,
            line.receiptAttachmentId,
            line.receiptFileName,
            line.receiptContentType,
            'erp_attachment',
        )
        const gr = new GlideRecord('x_335329_sn_hr_erp_erp_write')
        if (gr.get('sys_id', writeId)) {
            const ack = upload.ok ? extractAck(upload.body) : ''
            gr.setValue('attempts', 1)
            gr.setValue('first_sent_at', new GlideDateTime().getValue())
            gr.setValue('state', ack ? 'confirmed' : 'failed')
            if (ack) {
                gr.setValue('erp_ack_ref', ack)
                gr.setValue('confirmed_at', new GlideDateTime().getValue())
            } else {
                gr.setValue('error_message', upload.error || 'Upload returned no confirmable reference.')
            }
            if (upload.callLogId) {
                gr.setValue('call_log_ids', upload.callLogId)
            }
            gr.update()
            if (!ack) {
                errors.push('Line ' + (i + 1) + ': the receipt did not reach the ERP and will be retried.')
            }
        }
    }
    return errors
}

// ===========================================================================================
// NV-35 -- status read-back.
// ===========================================================================================

/** The four statuses the BRD names. Anything else is shown RAW, never coerced to the nearest one. */
const KNOWN_STATUS: { [raw: string]: string } = {
    submitted: 'Submitted',
    approved: 'Approved',
    paid: 'Paid',
    rejected: 'Rejected',
}

/**
 * Map the ERP's own claim status.
 *
 * An unrecognised value renders as itself. Coercing an unknown status to the nearest known one is
 * how `PENDING_TREASURY` becomes `Paid` on an employee's screen.
 */
export function mapClaimStatus(raw: string): string {
    const key = String(raw || '').toLowerCase().trim()
    if (key === '') {
        return 'Status not supplied by the ERP'
    }
    return KNOWN_STATUS[key] || 'Status not recognised (' + String(raw) + ')'
}

export interface ClaimStatus {
    state: string
    status: string
    message: string
    /** Rendered only when the ERP supplied BOTH, with an explicit currency. */
    paidAmount: string
    paidCurrency: string
    paidOn: string
    rejectionReason: string
}

/**
 * NV-35. `claimRef` empty means the write never confirmed, and NO status call is issued: asking
 * the ERP about a claim it was never told about produces a 404 that reads like an outage.
 */
export function claimStatus(userSysId: string, systemId: string, claimRef: string): ClaimStatus {
    const blank: ClaimStatus = {
        state: 'not_configured',
        status: '',
        message: '',
        paidAmount: '',
        paidCurrency: '',
        paidOn: '',
        rejectionReason: '',
    }
    if (!String(claimRef || '')) {
        blank.message = 'Not yet recorded in the ERP'
        return blank
    }

    const read = readForEmployee(userSysId, systemId, 'expense_claim')
    if (read.state !== 'live') {
        blank.state = read.state
        blank.message = read.message || 'Claim status could not be retrieved from the ERP'
        return blank
    }

    for (let i = 0; i < read.rows.length; i++) {
        const row = read.rows[i] as { [k: string]: string }
        if (String(row['erp_id'] || row['claim_reference'] || '') !== String(claimRef)) {
            continue
        }
        const amount = String(row['amount'] || '')
        const currency = String(row['currency'] || '')
        const status = mapClaimStatus(String(row['status'] || ''))
        return {
            state: 'live',
            status: status,
            message: '',
            // BOTH or NEITHER. An amount with no currency is a number nobody can act on, and
            // rendering it as `0` for an unmapped field is the failure repo rule 3 forbids.
            paidAmount: amount && currency ? amount : '',
            paidCurrency: amount && currency ? currency : '',
            paidOn: String(row['payment_date'] || ''),
            rejectionReason:
                status === 'Rejected'
                    ? String(row['rejection_reason'] || '') || 'Rejected -- no reason supplied by the ERP'
                    : '',
        }
    }
    blank.state = 'failed'
    blank.message = 'Claim status could not be retrieved from the ERP'
    return blank
}
