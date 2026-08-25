import { GlideRecord } from '@servicenow/glide'

/**
 * NV-4 -- deterministic idempotency keys.
 *
 * The failure this prevents is specific and it is the worst one in the backlog: a create that
 * TIMED OUT WITH NO RESPONSE. The record may or may not exist ERP-side. A blind retry produces a
 * second employee, a second leave request, or a second archived salary certificate -- and none
 * of those announce themselves. BRD §7 names idempotency for exactly this reason.
 *
 * The key is a pure function of the logical write. Same write, same key, forever -- so the unique
 * index on (erp_system, idempotency_key) refuses the duplicate AT THE DATABASE. A script-only
 * guard loses the race that idempotency exists to win.
 */

export interface WriteIdentity {
    logicalObject: string
    operation: string
    externalId: string
    sourceRecord: string
    /** Document type or pay period -- what distinguishes two otherwise-identical writes. */
    qualifier: string
}

/**
 * Stable, printable, collision-resistant enough for a per-system unique index.
 *
 * Deliberately NOT a hash: a readable key is one an HR agent can match against an ERP record
 * while working an exception. Nothing secret is in it -- ids and codes only, never a value.
 */
export function idempotencyKey(id: WriteIdentity): string {
    const parts = [
        String(id.logicalObject || ''),
        String(id.operation || ''),
        String(id.externalId || ''),
        String(id.sourceRecord || ''),
        String(id.qualifier || ''),
    ]
    for (let i = 0; i < parts.length; i++) {
        // Separator collision: without this, ('a.b','c') and ('a','b.c') produce one key.
        parts[i] = parts[i].replace(/[|]/g, '_')
    }
    return parts.join('|')
}

/** Two dispatch attempts of the same logical write must produce a byte-identical key. */
export function keysMatch(a: WriteIdentity, b: WriteIdentity): boolean {
    return idempotencyKey(a) === idempotencyKey(b)
}

/**
 * Has this logical write already been confirmed?
 *
 * Consulted before EVERY create, not only after a timeout: the ambiguous case is precisely the
 * one where the caller does not know a retry is happening.
 */
export function alreadyConfirmed(systemId: string, key: string): string {
    const gr = new GlideRecord('x_335329_sn_hr_erp_erp_write')
    gr.addQuery('erp_system', systemId)
    gr.addQuery('idempotency_key', key)
    gr.addQuery('state', 'confirmed')
    gr.setLimit(1)
    gr.query()
    return gr.next() ? String(gr.getValue('erp_ack_ref') || 'confirmed') : ''
}

/**
 * NV-4 AC5 -- a vendor supporting NEITHER an idempotency header NOR an existence check is a
 * RECORDED GAP, not something to work around.
 *
 * Returning false here makes the object map unsavable for a create. That is the intended
 * outcome: shipping a create with no retry safety is how the duplicate reaches production.
 */
export function idempotencyConfigured(mode: string, existenceCheckPath: string): boolean {
    if (mode === 'header' || mode === 'natural_key') {
        return true
    }
    if (mode === 'existence_check') {
        return !!String(existenceCheckPath || '')
    }
    return false
}
