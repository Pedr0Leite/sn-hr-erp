import {
    Table,
    StringColumn,
    ChoiceColumn,
    DecimalColumn,
    JsonColumn,
    ReferenceColumn,
    DateTimeColumn,
} from '@servicenow/sdk/core'
import { CATEGORY_CHOICES, STAGED_OBJECT_CHOICES } from './choices'

// L3-4. erp_staging -- one header table: provenance + nine generic typed columns + JSON payload
// (OD5 / L3-D1, docs/l3-staging-design.md §3).
//
// WHY GENERIC COLUMNS. Per-object tables would type honestly and would make a 15th logical
// object a schema change and a deploy, killing the "a second ERP is pure data" promise at the
// layer where it matters most. JSON-only would kill GlideAggregate and make the unique upsert
// index impossible, because source_record_id would live inside the blob. The accepted cost is
// that `amount` means different things on different rows: ALWAYS FILTER A LIST VIEW BY
// logical_object, and read `payload` for the properly-named fields.
//
// erp_category has FIVE choices and `hr` is not one of them; logical_object offers only the 14
// staged objects. Neither constrains a Table API insert -- the `before` rule of L3-6 does
// (l3 §3.5, three guards).
//
// NO CREATE / WRITE / DELETE ACL EXISTS FOR ANY APP ROLE (L0 §5.6). The sync engine inserts as
// `system` from a scheduled job. Read is `viewer`.

export const x_335329_sn_hr_erp_staging = Table({
    name: 'x_335329_sn_hr_erp_staging',
    label: 'ERP Staged Data',
    display: 'code',
    audit: false,
    textIndex: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    // ~20 acceptance criteria read this table through the Table API.
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        // ---- Provenance. Every column in this block is hard deny-write (L0 §5.3, L3-5). ----
        erp_system: ReferenceColumn({
            label: 'ERP System',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
            mandatory: true,
            cascadeRule: 'none',
            hint: 'WHICH system said this. Category alone is not provenance.',
        }),
        erp_category: ChoiceColumn({
            label: 'ERP category',
            mandatory: true,
            dropdown: 'none',
            choices: CATEGORY_CHOICES,
        }),
        logical_object: ChoiceColumn({
            label: 'Logical object',
            mandatory: true,
            dropdown: 'none',
            choices: STAGED_OBJECT_CHOICES,
        }),
        source_record_id: StringColumn({
            label: 'Source record ID',
            maxLength: 200,
            mandatory: true,
            hint: "The ERP's own primary key. The upsert match key -- a row without one can never be updated and would double on every sync, so the engine refuses it rather than inserting an orphan.",
        }),
        fetched_at: DateTimeColumn({
            label: 'Fetched at',
            mandatory: true,
            hint: 'When the ERP ANSWERED. Every "as of" and every staleness calculation reads this and never sys_updated_on (story L3-4 AC5).',
        }),
        sync_run: ReferenceColumn({
            label: 'Sync run',
            referenceTable: 'x_335329_sn_hr_erp_sync_run',
            mandatory: true,
            cascadeRule: 'none',
            hint: 'Story L3-1 AC6: a staged row with no run is impossible.',
        }),
        object_map: ReferenceColumn({
            label: 'Object mapping',
            referenceTable: 'x_335329_sn_hr_erp_object_map',
            cascadeRule: 'none',
        }),

        // ---- Nine promoted typed slots, filled per src/server/contract/promotion.ts. ----
        amount: DecimalColumn({ label: 'Amount', hint: 'Any monetary figure. A plain Decimal, NOT a Currency column (L3-D3) -- currency_code sits beside it and no FX conversion is ever applied, because a converted figure is not what the ERP said.' }),
        qty: DecimalColumn({ label: 'Quantity' }),
        threshold: DecimalColumn({ label: 'Threshold', hint: "The per-row comparison partner: safety_stock, target, reorder point. Story L5-6 AC7 compares against EACH ITEM'S OWN value, never a global constant." }),
        ratio: DecimalColumn({ label: 'Ratio', hint: '0-1 ratios. OEE and its three components (OD7).' }),
        // L3-D12 -- A TENTH PROMOTED COLUMN THE DESIGN DID NOT ANTICIPATE, and it exists
        // because the design's stated mechanism does not exist on this platform.
        //
        // docs/l4-api-design.md §7.2 and docs/l3-staging-design.md §3.1 both assert that the
        // promoted columns make `qty < threshold` "expressible in one encoded query". They do
        // not. ServiceNow's field-comparison operators are [is same] / [is different] plus two
        // DATE-only range operators (ServiceNowOfficialDocs/platform-user-interface/
        // r_ComparingFieldValues.md, "Available operators"). There is no numeric field-to-field
        // `<`. The alternatives were: compare in script over every row -- the N+1 that story
        // L4-4 exists to forbid -- or precompute at stage time. This is precompute.
        //
        // STILL PER-ROW, which is the actual requirement (story L5-6 AC7): the value is
        // qty - threshold FOR THAT ITEM, never against a global constant. Empty when either
        // input is absent, so an unmapped safety_stock produces no comparison at all rather
        // than a comparison against zero (D5's hard limit).
        delta: DecimalColumn({
            label: 'Delta',
            hint: 'qty - threshold for this row, precomputed at stage time. Empty when either side is absent. Low-stock and reorder query `delta < 0`.',
        }),
        status: StringColumn({ label: 'Status', maxLength: 80, hint: "The ROW's own state: paid, pending, active, delayed, retired. Not the sync run's status." }),
        dim: StringColumn({ label: 'Dimension', maxLength: 200, hint: 'The single group-by dimension: period, warehouse, supplier category, lifecycle stage, day.' }),
        label: StringColumn({ label: 'Label', maxLength: 300 }),
        code: StringColumn({ label: 'Code', maxLength: 120, hint: 'The ERP-side business key shown to users: invoice number, SKU, WO number.' }),
        occurred_on: DateTimeColumn({ label: 'Occurred on' }),

        // ---- Payload and currency ----
        payload: JsonColumn({
            label: 'Payload',
            hint: 'Every mapped logical field, keyed by LOGICAL field name, including the nine promoted. The row-detail source. C1 still applies: this holds MAPPED values, never a raw response body, and it must never be copied into call_log or any log line.',
        }),
        currency_code: StringColumn({
            label: 'Currency code',
            maxLength: 3,
            hint: 'ISO code beside `amount`. L4 REFUSES to sum across distinct codes and renders per-currency subtotals instead (D11).',
        }),
        external_ref: StringColumn({
            label: 'External reference',
            maxLength: 200,
            hint: 'The deep-link value. EMPTY MEANS NO LINK IS DRAWN -- a link that 404s is worse than none.',
        }),
    },
    index: [
        // The upsert match key. UNIQUE is what makes the upsert idempotent rather than hopeful.
        { name: 'idx_staging_upsert', unique: true, element: ['erp_system', 'logical_object', 'source_record_id'] },
        // L4's tab query.
        { name: 'idx_staging_obj_cat', unique: false, element: ['erp_category', 'logical_object', 'fetched_at'] },
        // Retention + rollback.
        { name: 'idx_staging_run', unique: false, element: 'sync_run' },
        // Chart group-by (l4 §7.1 query 7 / R4-4).
        { name: 'idx_staging_dim', unique: false, element: ['logical_object', 'dim'] },
    ],
})
