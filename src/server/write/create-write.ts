import { GlideRecord } from '@servicenow/glide'
import { idempotencyKey } from './idempotency.ts'

/**
 * THE ONE PLACE AN `erp_write` ROW IS CREATED.
 *
 * It exists because four modules had a private near-copy of this function, and every one of them
 * inserted the row with an EMPTY `idempotency_key` -- the key was only stamped later, inside the
 * dispatcher's pre-flight. `erp_write` carries a unique index on
 * `(erp_system, idempotency_key)`, so every queued row for one ERP system shared the key `''`:
 * the second insert collides with the first and the caller reports "could not be queued" for a
 * write nothing is wrong with. Two expense receipts on one claim hit it immediately.
 *
 * It also made a comment in `expense-claim.ts` false: the index cannot deduplicate receipts by
 * claim and line while the column it indexes is blank.
 *
 * THE KEY IS COMPUTED AT INSERT. The row is unique from the moment it exists, the index means
 * what its name says, and the pre-flight now reads a key rather than inventing one.
 */

export interface NewWrite {
    systemId: string
    logicalObject: string
    operation: string
    externalId: string
    sourceTable: string
    sourceRecord: string
    requestedBy: string
    /** sysapproval_approver sys_id, where the write is gated. */
    approvalRef?: string
    /** Overrides the derived `<object>.<operation>` policy key (OD48). */
    policyKey?: string
    /** What distinguishes two otherwise-identical writes: a period, a claim line, a doc type. */
    qualifier?: string
}

/** Returns the new row's sys_id, or '' when the insert was refused. */
export function createWrite(w: NewWrite): string {
    const gr = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    gr.initialize()
    gr.setValue('erp_system', w.systemId)
    gr.setValue('logical_object', w.logicalObject)
    gr.setValue('operation', w.operation)
    gr.setValue('external_id', w.externalId)
    // NV-8: a write always carries the case that raised it. A polymorphic pair rather than a
    // reference, so swapping sc_req_item for an HRSD case later is a data change, not a schema one.
    gr.setValue('source_table', w.sourceTable)
    gr.setValue('source_record', w.sourceRecord)
    gr.setValue('requested_by', w.requestedBy)
    if (w.approvalRef) {
        gr.setValue('approval_ref', w.approvalRef)
    }
    if (w.policyKey) {
        gr.setValue('policy_key', w.policyKey)
    }
    if (w.qualifier) {
        gr.setValue('effective_cycle', w.qualifier)
    }
    gr.setValue(
        'idempotency_key',
        idempotencyKey({
            logicalObject: w.logicalObject,
            operation: w.operation,
            externalId: w.externalId,
            sourceRecord: w.sourceRecord,
            qualifier: String(w.qualifier || ''),
        }),
    )
    gr.setValue('state', 'queued')
    const id = gr.insert()
    return id ? String(id) : ''
}
