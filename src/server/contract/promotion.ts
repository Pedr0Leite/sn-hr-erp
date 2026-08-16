// L3-7. The promotion table -- docs/l3-staging-design.md §3.2.
//
// WHICH LOGICAL FIELD FILLS WHICH OF THE NINE GENERIC STAGING COLUMNS, per logical object.
// This is CODE, not configuration, for the same reason src/server/contract/objects.ts is: a
// 15th logical object is a config change, but WHAT ITS AMOUNT MEANS is a design statement, and
// a design statement belongs in a reviewable file with a diff.
//
// It is the ONLY mapping authority (R3-2). Nothing else may decide that `stock_item.qty` lands
// in `qty` -- if a second place ever does, the two will disagree and a tile will be wrong with
// no way to tell which half lied.
//
// EVERY TARGET IS ONE OF THE NINE SLOTS AND EVERY OBJECT HAS AT LEAST ONE. Asserted by
// assertPromotionTable() at the bottom, which the sync engine calls once per run.

/** The nine promoted typed columns on erp_staging. */
export type PromotedSlot =
    | 'amount'
    | 'qty'
    | 'threshold'
    | 'ratio'
    | 'status'
    | 'dim'
    | 'label'
    | 'code'
    | 'occurred_on'

export const PROMOTED_SLOTS: PromotedSlot[] = [
    'amount',
    'qty',
    'threshold',
    'ratio',
    'status',
    'dim',
    'label',
    'code',
    'occurred_on',
]

/** Slots whose column is a Decimal and whose value must therefore parse as a number. */
export const NUMERIC_SLOTS: PromotedSlot[] = ['amount', 'qty', 'threshold', 'ratio']

/** Slots whose column is a DateTime. */
export const DATE_SLOTS: PromotedSlot[] = ['occurred_on']

/** slot -> logical field name, per logical object. A slot absent here stays empty on the row. */
export interface PromotionMap {
    [slot: string]: string
}

export const PROMOTION: { [logicalObject: string]: PromotionMap } = {
    // --- finance ---------------------------------------------------------------------
    balance: { amount: 'amount', dim: 'account', code: 'account_code', label: 'account_name', occurred_on: 'as_of' },
    invoice: { amount: 'amount', dim: 'customer', code: 'number', label: 'customer_name', occurred_on: 'due_on', status: 'status' },
    vendor_invoice: { amount: 'amount', dim: 'vendor', code: 'number', label: 'vendor', occurred_on: 'due_on', status: 'status' },
    // THE DESIGN'S ONE ACKNOWLEDGED IMPURITY (§3.2): gl_summary uses `threshold` to carry
    // `expense`, i.e. a second SERIES rather than a comparison partner. The alternative is a
    // tenth column used by exactly one object. Tab 1's revenue-vs-expenses chart reads
    // amount = revenue, threshold = expense -- and l4's tabs.ts is the only reader.
    gl_summary: { amount: 'revenue', threshold: 'expense', dim: 'period', occurred_on: 'period_end' },

    // --- procurement -----------------------------------------------------------------
    purchase_order: { amount: 'amount', dim: 'supplier_category', code: 'number', label: 'supplier', occurred_on: 'ordered_on', status: 'status' },
    requisition: { amount: 'amount', dim: 'department', code: 'number', label: 'requester', occurred_on: 'opened_on', status: 'status' },

    // --- inventory -------------------------------------------------------------------
    // `threshold` carries EACH ITEM'S OWN safety_stock. Story L5-6 AC7: the low-stock
    // comparison is per row, never against a global constant. That is why this is a promoted
    // column and not a sys_property (D5's hard limit).
    stock_item: { qty: 'qty', threshold: 'safety_stock', dim: 'location', code: 'sku', label: 'name' },
    backorder: { qty: 'qty', dim: 'location', code: 'sku', label: 'name', occurred_on: 'promised_on', status: 'status' },

    // --- assets ----------------------------------------------------------------------
    fixed_asset: { amount: 'value', dim: 'lifecycle_stage', code: 'asset_tag', label: 'name', occurred_on: 'eol_on', status: 'status' },
    asset_depreciation: { amount: 'amount', dim: 'period', code: 'asset_tag', label: 'asset_name', occurred_on: 'period_end' },
    maintenance_schedule: { dim: 'asset_tag', code: 'asset_tag', label: 'asset_name', occurred_on: 'next_service_on', status: 'status' },

    // --- manufacturing ---------------------------------------------------------------
    work_order: { dim: 'line', code: 'number', label: 'product', occurred_on: 'due_on', status: 'status' },
    // `oee`, `availability`, `performance` and `quality` are mapped into `payload` like every
    // other field; the RESOLVED OEE is promoted to `ratio` by the sync engine per OD7's
    // precedence. `target` is the per-row comparison partner for the output-vs-target chart.
    production_output: { qty: 'output', threshold: 'target', dim: 'day', code: 'line', label: 'line_name', occurred_on: 'day_date' },
    machine_downtime: { qty: 'duration_min', dim: 'asset', code: 'asset', label: 'reason', occurred_on: 'started_on', status: 'severity' },
}

/**
 * The build-order L3-7 check, run at the top of every sync so a bad edit fails loudly on the
 * first run rather than producing quietly mis-promoted rows for a week.
 *
 * Returns a list of problems; empty means the table is well-formed.
 */
export function assertPromotionTable(): string[] {
    const problems: string[] = []
    const objects = Object.keys(PROMOTION)

    for (let i = 0; i < objects.length; i++) {
        const object = objects[i]
        const map = PROMOTION[object]
        const slots = Object.keys(map)

        if (slots.length === 0) {
            problems.push('Object ' + object + ' promotes nothing.')
            continue
        }
        for (let j = 0; j < slots.length; j++) {
            if (PROMOTED_SLOTS.indexOf(slots[j] as PromotedSlot) === -1) {
                problems.push('Object ' + object + ' promotes to unknown slot ' + slots[j] + '.')
            }
        }
    }

    return problems
}

/** The promotion map for one object, or an empty map for an unknown one. */
export function promotionFor(logicalObject: string): PromotionMap {
    return PROMOTION[logicalObject] || {}
}
