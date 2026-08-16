/**
 * L4-1. The five tab definitions. docs/l4-api-design.md §9, docs/l5-ui-design.md §7.
 *
 * DATA ONLY. NO LOGIC. Every `if` about a tile lives in state-resolver.ts or hub-data.ts; this
 * file says WHAT a tile is and never WHAT STATE it is in. That separation is why story L4-1
 * AC4 -- "requesting ?tab=inventory executes NO query against finance objects" -- is structural
 * rather than a filter someone can forget: each tab NAMES its objects, and every query
 * hub-data.ts builds is built from that list. There is no code path that reads an object the
 * requested tab does not declare.
 *
 * `gated: true` means finance_viewer (D6). It is on EVERY currency-formatted figure in the app,
 * including Tab 2's donut and Tab 4's list column -- not only the KPIs. R4-5: a tab that hides
 * the KPI but still plots the spend donut has leaked the figure.
 *
 * D7 IS ENFORCED IN THE LABELS. Tab 1's first tile is `Cash balance`, because
 * under D2 the figure is as old as its last sync and the `as of` stamp says so. T5-8 greps the
 * built bundle for it and expects zero hits.
 */

export type Fmt = 'number' | 'currency' | 'percent'

/**
 * One filter clause.
 *
 * THERE IS NO `otherField` OPERATOR, and the designs assume there is. ServiceNow's field
 * comparison offers [is same] / [is different] and two DATE-only range operators -- no numeric
 * field-to-field `<`. Story L5-6 AC7's per-row comparison is met by `delta`, precomputed at
 * stage time (L3-D12), not by a two-column filter.
 *
 * `propertyValue` names a sys_property to compare against (D5): a threshold property makes a
 * COMPARISON configurable; it never invents a FIELD.
 *
 * `withinDays` compares a date column against now + N days, N coming from a property.
 */
export interface Where {
    field: string
    op: string
    value?: string
    propertyValue?: string
    withinDays?: string
    /** Field that MUST be mapped for this clause to mean anything. Unmapped => not_configured. */
    requiresMapped?: string
}

export interface Thr {
    name: string
    kind: 'property' | 'per_row'
}

export interface KpiDef {
    id: string
    lab: string
    note?: string
    fmt: Fmt
    obj: string
    agg: 'count' | 'sum'
    /** Promoted column summed when agg is 'sum'. */
    field?: string
    where?: Where[]
    gated?: boolean
    thr?: Thr
    /** OD7 / L5-D6. The only tile whose value is not a plain aggregate. */
    special?: 'oee'
}

export interface SeriesDef {
    lab: string
    /** Promoted column, or 'count'. */
    field: string
}

export interface ChartDef {
    id: string
    lab: string
    type: 'bar' | 'grouped_bar' | 'donut' | 'pie' | 'line'
    obj: string
    series: SeriesDef[]
    where?: Where[]
    gated?: boolean
}

export interface ColDef {
    k: string
    lab: string
    fmt?: Fmt
    /** A gated COLUMN on an ungated list. Tab 2 and Tab 4 both need this (R4-5). */
    gated?: boolean
}

export interface ListDef {
    id: string
    lab: string
    obj: string
    orderBy: string
    desc: boolean
    limit: number
    cols: ColDef[]
    where?: Where[]
    gated?: boolean
    /** D3 / story L5-5 AC8. Rendered in EVERY state, including not_configured and failed. */
    caveat?: string
}

export interface TabDef {
    tab: string
    lab: string
    /** The ONLY objects this tab may query. AC4's structural guard. */
    objects: string[]
    k: KpiDef[]
    c: ChartDef[]
    l: ListDef[]
    /** A standing note rendered in every state (Tab 4's OD6 disclosure). */
    note?: string
}

const PROC_CAVEAT =
    'Approve and Reject are not shown. These requisitions live in the ERP and are not mirrored into ServiceNow approvals, so a decision made here could not be written back. Use the ERP link on each row.'

export const TABS: { [tab: string]: TabDef } = {
    // ---------------------------------------------------------------------------------------
    // Tab 1 -- Financial Health & Ledger. ENTIRELY finance_viewer-gated (D6).
    // ---------------------------------------------------------------------------------------
    financial: {
        tab: 'financial',
        lab: 'Financial Health & Ledger',
        objects: ['balance', 'invoice', 'vendor_invoice', 'gl_summary'],
        k: [
            {
                id: 'fin_cash',
                // D7: `Cash balance`, and the spec's "live" adjective is deliberately dropped. The figure is as old as its
                // last sync and `as_of` says so.
                lab: 'Cash balance',
                note: 'Staged from the ERP at the time shown. Not a live ledger read.',
                fmt: 'currency',
                obj: 'balance',
                agg: 'sum',
                field: 'amount',
                gated: true,
            },
            {
                id: 'fin_ar',
                lab: 'Open accounts receivable',
                fmt: 'currency',
                obj: 'invoice',
                agg: 'sum',
                field: 'amount',
                where: [{ field: 'status', op: '!=', value: 'paid' }],
                gated: true,
            },
            {
                id: 'fin_ap',
                lab: 'Open accounts payable',
                fmt: 'currency',
                obj: 'vendor_invoice',
                agg: 'sum',
                field: 'amount',
                where: [{ field: 'status', op: '!=', value: 'paid' }],
                gated: true,
            },
        ],
        c: [
            {
                id: 'fin_rev_exp',
                lab: 'Monthly revenue vs expenses',
                type: 'grouped_bar',
                obj: 'gl_summary',
                // `threshold` carries `expense` here -- the promotion table's one acknowledged
                // impurity (l3 §3.2), a slot reused for a second series. This is its only reader.
                series: [{ lab: 'Revenue', field: 'amount' }, { lab: 'Expenses', field: 'threshold' }],
                gated: true,
            },
        ],
        l: [
            {
                id: 'fin_overdue',
                lab: 'Top overdue vendor invoices',
                obj: 'vendor_invoice',
                orderBy: 'amount',
                desc: true,
                limit: 10,
                where: [{ field: 'status', op: '!=', value: 'paid' }],
                cols: [
                    { k: 'label', lab: 'Vendor' },
                    { k: 'code', lab: 'Invoice' },
                    { k: 'amount', lab: 'Amount', fmt: 'currency', gated: true },
                    { k: 'occurred_on', lab: 'Due' },
                ],
                gated: true,
            },
        ],
    },

    // ---------------------------------------------------------------------------------------
    // Tab 2 -- Procurement & Sourcing. READ-ONLY (D3). No Approve control and no Reject control
    // is rendered anywhere, in any state, for any role including admin -- and there is no
    // component, no handler and no dead branch here to draw one from.
    // ---------------------------------------------------------------------------------------
    procurement: {
        tab: 'procurement',
        lab: 'Procurement & Sourcing',
        objects: ['purchase_order', 'requisition'],
        k: [
            {
                id: 'proc_open_po',
                lab: 'Total open purchase orders',
                fmt: 'number',
                obj: 'purchase_order',
                agg: 'count',
                where: [{ field: 'status', op: '!=', value: 'closed' }],
            },
            {
                id: 'proc_pending_req',
                lab: 'Requisitions pending approval',
                fmt: 'number',
                obj: 'requisition',
                agg: 'count',
                where: [{ field: 'status', op: '=', value: 'pending' }],
            },
            {
                id: 'proc_ytd_spend',
                lab: 'Year-to-date procurement spend',
                fmt: 'currency',
                obj: 'purchase_order',
                agg: 'sum',
                field: 'amount',
                // withinDays is signed and relative to now: -365 is "in the last year".
                where: [{ field: 'occurred_on', op: '>=', withinDays: '-365' }],
                gated: true,
            },
        ],
        c: [
            {
                id: 'proc_supplier_donut',
                lab: 'Spend by supplier category',
                type: 'donut',
                obj: 'purchase_order',
                series: [{ lab: 'Spend', field: 'amount' }],
                // GATED. R4-5: gating the KPI and not the donut leaks the same figure.
                gated: true,
            },
        ],
        l: [
            {
                id: 'proc_approvals',
                lab: 'Requisitions awaiting a decision',
                obj: 'requisition',
                orderBy: 'occurred_on',
                desc: false,
                limit: 20,
                where: [{ field: 'status', op: '=', value: 'pending' }],
                cols: [
                    { k: 'label', lab: 'Requester' },
                    { k: 'code', lab: 'Requisition' },
                    { k: 'amount', lab: 'Amount', fmt: 'currency', gated: true },
                    { k: 'dim', lab: 'Department' },
                    { k: 'occurred_on', lab: 'Opened' },
                ],
                caveat: PROC_CAVEAT,
            },
        ],
    },

    // ---------------------------------------------------------------------------------------
    // Tab 3 -- Inventory & Supply Chain. Nothing here is currency, so nothing here is gated.
    //
    // THE FOUNDING CASE (story L5-6 AC4): with the warehouse system unreachable, the low-stock
    // tile reads "ERP did not answer" and NEVER "0 low stock alerts".
    // ---------------------------------------------------------------------------------------
    inventory: {
        tab: 'inventory',
        lab: 'Inventory & Supply Chain',
        objects: ['stock_item', 'backorder'],
        k: [
            { id: 'inv_sku_count', lab: 'Total SKU count', fmt: 'number', obj: 'stock_item', agg: 'count' },
            {
                id: 'inv_low_stock',
                lab: 'Low stock alerts',
                note: "Items below their own safety-stock threshold.",
                fmt: 'number',
                obj: 'stock_item',
                agg: 'count',
                // PER-ROW comparison, never a global constant. `requiresMapped` is D5's hard
                // limit made executable: with `safety_stock` unmapped the tile is
                // not_configured NAMING THE FIELD -- not a comparison against an implicit zero,
                // and not `0` (T4-24).
                // `delta` is qty - threshold PRECOMPUTED PER ROW at stage time (L3-D12).
                // ServiceNow has no numeric field-to-field encoded-query operator, so the
                // design's "expressible in one encoded query" is only true against this column.
                // Empty delta (safety_stock unmapped) matches nothing, and `requiresMapped`
                // turns that into not_configured naming the field rather than a silent 0.
                where: [{ field: 'delta', op: '<', value: '0', requiresMapped: 'safety_stock' }],
                thr: { name: 'safety_stock', kind: 'per_row' },
            },
            { id: 'inv_backorder', lab: 'Backordered items', fmt: 'number', obj: 'backorder', agg: 'count' },
        ],
        c: [
            {
                id: 'inv_by_location',
                lab: 'Stock by warehouse location',
                type: 'bar',
                obj: 'stock_item',
                series: [{ lab: 'Units', field: 'qty' }],
            },
        ],
        l: [
            {
                id: 'inv_reorder',
                lab: 'Critical reorder list',
                obj: 'stock_item',
                orderBy: 'qty',
                desc: false,
                limit: 25,
                // `delta` is qty - threshold PRECOMPUTED PER ROW at stage time (L3-D12).
                // ServiceNow has no numeric field-to-field encoded-query operator, so the
                // design's "expressible in one encoded query" is only true against this column.
                // Empty delta (safety_stock unmapped) matches nothing, and `requiresMapped`
                // turns that into not_configured naming the field rather than a silent 0.
                where: [{ field: 'delta', op: '<', value: '0', requiresMapped: 'safety_stock' }],
                cols: [
                    { k: 'code', lab: 'SKU' },
                    { k: 'label', lab: 'Item' },
                    { k: 'qty', lab: 'On hand' },
                    { k: 'threshold', lab: 'Safety stock' },
                    { k: 'dim', lab: 'Location' },
                ],
            },
        ],
    },

    // ---------------------------------------------------------------------------------------
    // Tab 4 -- Fixed Assets & Equipment. OD6: DISPLAY-ONLY. Zero references to alm_asset or
    // cmdb_ci anywhere in src/, and the note below renders in every state.
    // ---------------------------------------------------------------------------------------
    assets: {
        tab: 'assets',
        lab: 'Fixed Assets & Equipment',
        note: 'Figures are from the ERP and are not reconciled against ServiceNow asset or CMDB records.',
        objects: ['fixed_asset', 'asset_depreciation', 'maintenance_schedule'],
        k: [
            {
                id: 'ast_valuation',
                lab: 'Total asset valuation',
                fmt: 'currency',
                obj: 'fixed_asset',
                agg: 'sum',
                field: 'amount',
                gated: true,
            },
            {
                id: 'ast_depreciated',
                lab: 'Assets depreciated this quarter',
                // L4-D6: read as a COUNT of assets, fmt number, UNGATED, because §6 Tab 4 lists
                // it beside two other counts. FLAGGED: if the product owner means a monetary
                // total it moves under finance_viewer and fmt becomes currency -- one line here.
                fmt: 'number',
                obj: 'asset_depreciation',
                agg: 'count',
                where: [{ field: 'occurred_on', op: '>=', withinDays: '-90' }],
            },
            {
                id: 'ast_maint_due',
                lab: 'Assets due for maintenance',
                fmt: 'number',
                obj: 'maintenance_schedule',
                agg: 'count',
                where: [
                    { field: 'occurred_on', op: '<=', withinDays: 'x_335329_sn_hr_erp.asset_maintenance_due_days' },
                ],
                thr: { name: 'asset_maintenance_due_days', kind: 'property' },
            },
        ],
        c: [
            {
                id: 'ast_lifecycle_pie',
                lab: 'Assets by lifecycle stage',
                type: 'pie',
                obj: 'fixed_asset',
                series: [{ lab: 'Assets', field: 'count' }],
            },
        ],
        l: [
            {
                id: 'ast_high_value_eol',
                lab: 'High-value assets nearing end of life',
                obj: 'fixed_asset',
                orderBy: 'amount',
                desc: true,
                limit: 20,
                where: [
                    { field: 'amount', op: '>=', propertyValue: 'x_335329_sn_hr_erp.asset_high_value_amount' },
                    { field: 'occurred_on', op: '<=', withinDays: 'x_335329_sn_hr_erp.asset_eol_within_days' },
                ],
                cols: [
                    { k: 'code', lab: 'Asset tag' },
                    { k: 'label', lab: 'Asset' },
                    { k: 'amount', lab: 'Value', fmt: 'currency', gated: true },
                    { k: 'dim', lab: 'Lifecycle stage' },
                    { k: 'occurred_on', lab: 'End of life' },
                ],
            },
        ],
    },

    // ---------------------------------------------------------------------------------------
    // Tab 5 -- Manufacturing & Production. Nothing currency, nothing gated.
    // ---------------------------------------------------------------------------------------
    manufacturing: {
        tab: 'manufacturing',
        lab: 'Manufacturing & Production',
        objects: ['work_order', 'production_output', 'machine_downtime'],
        k: [
            {
                id: 'mfg_oee',
                lab: 'Overall Equipment Effectiveness',
                note: 'Supplied by the ERP where mapped; otherwise computed from availability x performance x quality.',
                fmt: 'percent',
                obj: 'production_output',
                agg: 'sum',
                field: 'ratio',
                // OD7 / L5-D6. The only tile whose value is not a plain aggregate: precedence,
                // the weighted mean, the unit scale and the "which input is missing" sentence
                // all live in state-resolver.ts. A silently-wrong OEE is a number executives
                // act on, so it never falls back to a partial product.
                special: 'oee',
            },
            {
                id: 'mfg_active_wo',
                lab: 'Active work orders',
                fmt: 'number',
                obj: 'work_order',
                agg: 'count',
                where: [{ field: 'status', op: '!=', value: 'closed' }],
            },
            {
                id: 'mfg_delayed_wo',
                lab: 'Delayed orders',
                fmt: 'number',
                obj: 'work_order',
                agg: 'count',
                where: [{ field: 'status', op: '=', value: 'delayed' }],
            },
        ],
        c: [
            {
                id: 'mfg_output_target',
                lab: 'Daily output vs target',
                type: 'line',
                obj: 'production_output',
                // `target` unmapped returns ONE series plus miss: ["Target not mapped"].
                // It NEVER returns a target series of zeros (story L5-8, §4.2's `miss`).
                series: [{ lab: 'Output', field: 'qty' }, { lab: 'Target', field: 'threshold' }],
            },
        ],
        l: [
            {
                id: 'mfg_downtime',
                lab: 'Machine downtime',
                obj: 'machine_downtime',
                orderBy: 'occurred_on',
                desc: true,
                limit: 25,
                cols: [
                    { k: 'occurred_on', lab: 'Started' },
                    { k: 'dim', lab: 'Machine' },
                    { k: 'label', lab: 'Reason' },
                    { k: 'qty', lab: 'Minutes' },
                    // Severity badge text is the SEVERITY WORD, never colour alone (L5 §4.4).
                    { k: 'status', lab: 'Severity' },
                ],
            },
        ],
    },
}

export function tabNames(): string[] {
    return Object.keys(TABS)
}
