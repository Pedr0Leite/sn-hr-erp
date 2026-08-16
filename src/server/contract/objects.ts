// L1-1. The logical-object contract (docs/l1-control-tower-design.md §2.4).
//
// THIS FILE IS THE SINGLE SOURCE OF TRUTH for what a logical object is and which logical
// field names it permits. It is CODE, not configuration -- adding a 17th object is a code
// change, honestly declared, and that is L1-D1's accepted cost.
//
// ADD, NEVER RENAME. A renamed logical object silently orphans call_log telemetry,
// sync_run history and every field_map row keyed on it (story L1-1 AC6).
//
// Field names are vendor-neutral by construction. SAP calls it MENGE, Dynamics calls it
// QuantityOnHand; this file only ever says `qty`. A vendor field name appearing anywhere
// in src/server/connector/ or src/server/sync/ is a design failure (T1-25).
//
// The per-object field lists are the union of docs/l3-staging-design.md §3.2's promotion
// table (which names the field that fills each of the nine typed staging columns) plus
// `erp_id`, the deep-link value every object carries.

export type ErpCategory = 'finance' | 'procurement' | 'inventory' | 'assets' | 'manufacturing'

export interface LogicalObjectDef {
    /** erp_category, or null for the two live-only objects that are never staged (D2). */
    category: ErpCategory | null
    /** Permitted logical field names. Nothing outside this list may be mapped. */
    fields: string[]
}

export const LOGICAL_OBJECTS: { [name: string]: LogicalObjectDef } = {
    // --- finance -------------------------------------------------------------------
    balance: {
        category: 'finance',
        fields: ['amount', 'account', 'account_code', 'account_name', 'as_of', 'currency', 'erp_id'],
    },
    invoice: {
        category: 'finance',
        fields: ['amount', 'customer', 'customer_name', 'number', 'due_on', 'status', 'currency', 'erp_id'],
    },
    vendor_invoice: {
        category: 'finance',
        fields: ['amount', 'vendor', 'number', 'due_on', 'status', 'currency', 'erp_id'],
    },
    gl_summary: {
        category: 'finance',
        fields: ['revenue', 'expense', 'period', 'period_end', 'currency', 'erp_id'],
    },

    // --- procurement ---------------------------------------------------------------
    purchase_order: {
        category: 'procurement',
        fields: [
            'amount',
            'supplier',
            'supplier_category',
            'number',
            'ordered_on',
            'status',
            'currency',
            'erp_id',
        ],
    },
    requisition: {
        category: 'procurement',
        fields: ['amount', 'department', 'requester', 'number', 'opened_on', 'status', 'currency', 'erp_id'],
    },

    // --- inventory -----------------------------------------------------------------
    stock_item: {
        category: 'inventory',
        fields: ['qty', 'safety_stock', 'location', 'sku', 'name', 'erp_id'],
    },
    // L1-D2 / §2.3. New object. A threshold property makes a comparison configurable;
    // it does not invent a field (D5). Unmapped by default -- the Tab 3 tile renders
    // not-configured until an admin maps it, which is §7 working as intended.
    backorder: {
        category: 'inventory',
        fields: ['qty', 'location', 'sku', 'name', 'promised_on', 'status', 'erp_id'],
    },

    // --- assets --------------------------------------------------------------------
    fixed_asset: {
        category: 'assets',
        fields: ['value', 'lifecycle_stage', 'asset_tag', 'name', 'eol_on', 'status', 'currency', 'erp_id'],
    },
    asset_depreciation: {
        category: 'assets',
        fields: ['amount', 'period', 'asset_tag', 'asset_name', 'period_end', 'currency', 'erp_id'],
    },
    maintenance_schedule: {
        category: 'assets',
        fields: ['asset_tag', 'asset_name', 'next_service_on', 'status', 'erp_id'],
    },

    // --- manufacturing -------------------------------------------------------------
    work_order: {
        category: 'manufacturing',
        fields: ['line', 'number', 'product', 'due_on', 'status', 'erp_id'],
    },
    // OD7: `oee` is used if mapped; otherwise availability x performance x quality is
    // computed; otherwise not-configured, naming each missing input.
    production_output: {
        category: 'manufacturing',
        fields: [
            'output',
            'target',
            'day',
            'day_date',
            'line',
            'line_name',
            'oee',
            'availability',
            'performance',
            'quality',
            'erp_id',
        ],
    },
    machine_downtime: {
        category: 'manufacturing',
        fields: ['duration_min', 'asset', 'reason', 'started_on', 'severity', 'erp_id'],
    },

    // --- live-only, NEVER staged (D2) ----------------------------------------------
    // These two have no erp_category and cannot be selected for staging. L6 assembles
    // them live, per request, and stores nothing. An estate-wide employee roster staged
    // in ServiceNow is exactly the shadow HR database D2 exists to prevent.
    // L6 AMENDMENT (L6-D9), and it is a RENAME, which this file's own header forbids -- so it
    // is justified here rather than done quietly.
    //
    // docs/l6-document-design.md §3.2 states that `employee_full_name`,
    // `employment_start_date` and `annual_gross_salary` "are also the logical field names in
    // src/server/contract/objects.ts", and spec §8.1 makes that naming THE DELIVERABLE:
    // "naming is load-bearing here, not cosmetic". They must read as template variables a human
    // picks from a list. `full_name` and `hire_date` did not match, so either the contract or
    // the document design was wrong; the design wins, because a placeholder name is what an
    // admin sees.
    //
    // ADD-NEVER-RENAME EXISTS TO STOP A RENAME ORPHANING call_log TELEMETRY, sync_run HISTORY
    // AND field_map ROWS. Verified before renaming: `object_map` where
    // logical_object IN (employee_profile, payroll_record) returned ZERO ROWS on dev296062, so
    // there are no field_map children and no history to orphan. These two objects are also
    // live-only and can never appear in erp_staging. Adding the new names ALONGSIDE the old
    // ones was rejected: it would offer an admin `full_name` and `employee_full_name` in the
    // same picker, which is a guess waiting to happen on a salary certificate.
    employee_profile: {
        category: null,
        fields: [
            'employee_id',
            'employee_full_name',
            'department',
            'job_title',
            'employment_start_date',
            'employment_status',
            'erp_id',
        ],
    },
    payroll_record: {
        category: null,
        fields: [
            'employee_id',
            'annual_gross_salary',
            'salary_currency',
            'pay_period',
            'effective_on',
            'erp_id',
        ],
    },
}

/** Every logical object name. */
export function objectNames(): string[] {
    return Object.keys(LOGICAL_OBJECTS)
}

/** True when `field` is a permitted logical field of `object`. Unknown object => false. */
export function isLogicalField(object: string, field: string): boolean {
    var def = LOGICAL_OBJECTS[object]
    if (!def) {
        return false
    }
    return def.fields.indexOf(field) !== -1
}

/** The 14 staged objects -- those carrying an erp_category. */
export function stagedObjectNames(): string[] {
    var out: string[] = []
    var names = Object.keys(LOGICAL_OBJECTS)
    for (var i = 0; i < names.length; i++) {
        if (LOGICAL_OBJECTS[names[i]].category) {
            out.push(names[i])
        }
    }
    return out
}
