// L1-2. Choice literals for the L1 tables.
//
// These are PLAIN OBJECT LITERALS, kept in step with src/server/contract/objects.ts by hand
// and by scripts/check-contract.mjs. They are deliberately NOT generated at build time:
// kickoff §9 records that a computed expression in a Fluent value can write
// `Symbol(CallExpressionShape)` into a column on a clean, successful build. No .map(),
// no .join(), no template literal, no spread anywhere in this file.
//
// ADD, NEVER RENAME (story L1-1 AC6). A renamed choice value orphans call_log telemetry,
// sync_run history and every field_map row keyed on it. A rename is a governance failure,
// not a refactor.

/** erp_system.vendor and mapping_template.vendor. Spec §5.1's eleven. */
export const VENDOR_CHOICES = {
    sap_s4: 'SAP S/4HANA',
    sap_ecc: 'SAP ECC',
    oracle_ebs: 'Oracle E-Business Suite',
    oracle_fusion: 'Oracle Fusion / Financials Cloud',
    dynamics_365_fo: 'Microsoft Dynamics 365 Finance & Operations',
    unit4: 'Unit4 ERP',
    infor: 'Infor',
    netsuite: 'NetSuite',
    workday: 'Workday',
    generic_rest: 'Generic REST',
    generic_odata: 'Generic OData',
}

/** The 16 logical objects of §2.1. Mirrors LOGICAL_OBJECTS key-for-key. */
export const OBJECT_CHOICES = {
    balance: 'Balance (finance)',
    invoice: 'Invoice (finance)',
    vendor_invoice: 'Vendor invoice (finance)',
    gl_summary: 'GL summary (finance)',
    purchase_order: 'Purchase order (procurement)',
    requisition: 'Requisition (procurement)',
    stock_item: 'Stock item (inventory)',
    backorder: 'Backorder (inventory)',
    fixed_asset: 'Fixed asset (assets)',
    asset_depreciation: 'Asset depreciation (assets)',
    maintenance_schedule: 'Maintenance schedule (assets)',
    work_order: 'Work order (manufacturing)',
    production_output: 'Production output (manufacturing)',
    machine_downtime: 'Machine downtime (manufacturing)',
    employee_profile: 'Employee profile (live only, never staged)',
    payroll_record: 'Payroll record (live only, never staged)',
}

/**
 * L3. The five ERP categories. `hr` IS DELIBERATELY NOT ONE OF THEM (D2, l3 §3.5 guard 1).
 * Adding an `hr` entry here would make payroll staging selectable in one keystroke.
 */
export const CATEGORY_CHOICES = {
    finance: 'Finance',
    procurement: 'Procurement',
    inventory: 'Inventory',
    assets: 'Assets',
    manufacturing: 'Manufacturing',
}

/**
 * L3. The 14 STAGED logical objects -- OBJECT_CHOICES minus `employee_profile` and
 * `payroll_record` (l3 §3.5 guard 2). Written out longhand rather than derived: kickoff §9
 * records that a computed expression in a Fluent value can write Symbol(CallExpressionShape)
 * into a column on a clean build. scripts/check-contract.mjs keeps it honest.
 */
export const STAGED_OBJECT_CHOICES = {
    balance: 'Balance (finance)',
    invoice: 'Invoice (finance)',
    vendor_invoice: 'Vendor invoice (finance)',
    gl_summary: 'GL summary (finance)',
    purchase_order: 'Purchase order (procurement)',
    requisition: 'Requisition (procurement)',
    stock_item: 'Stock item (inventory)',
    backorder: 'Backorder (inventory)',
    fixed_asset: 'Fixed asset (assets)',
    asset_depreciation: 'Asset depreciation (assets)',
    maintenance_schedule: 'Maintenance schedule (assets)',
    work_order: 'Work order (manufacturing)',
    production_output: 'Production output (manufacturing)',
    machine_downtime: 'Machine downtime (manufacturing)',
}

/**
 * Every distinct logical field name across all 16 objects, as one flat choice list.
 *
 * R1-1 / L1-D8: this list is NOT filtered to the parent object's contract. The platform's
 * dependent-choice mechanism filters on a field of the SAME record, and field_map does not
 * know its parent's logical_object until it is saved -- so a dependent choice would be empty
 * on the New form, which is worse than an unfiltered one. Correctness is enforced instead by
 * the `before` business rule of L1-8, which rejects a field that is not in the parent
 * object's contract on EVERY path including the Table API (T1-12). The admin still types no
 * JSON brace (T1-11); the dropdown is simply longer than it would ideally be.
 */
export const LOGICAL_FIELD_CHOICES = {
    account: 'account',
    account_code: 'account_code',
    account_name: 'account_name',
    amount: 'amount',
    annual_gross_salary: 'annual_gross_salary',
    as_of: 'as_of',
    asset: 'asset',
    asset_name: 'asset_name',
    asset_tag: 'asset_tag',
    availability: 'availability',
    currency: 'currency',
    customer: 'customer',
    customer_name: 'customer_name',
    day: 'day',
    day_date: 'day_date',
    department: 'department',
    due_on: 'due_on',
    duration_min: 'duration_min',
    effective_on: 'effective_on',
    employee_id: 'employee_id',
    eol_on: 'eol_on',
    erp_id: 'erp_id',
    expense: 'expense',
    employee_full_name: 'employee_full_name',
    employment_start_date: 'employment_start_date',
    employment_status: 'employment_status',
    job_title: 'job_title',
    lifecycle_stage: 'lifecycle_stage',
    line: 'line',
    line_name: 'line_name',
    location: 'location',
    name: 'name',
    next_service_on: 'next_service_on',
    number: 'number',
    oee: 'oee',
    opened_on: 'opened_on',
    ordered_on: 'ordered_on',
    output: 'output',
    pay_period: 'pay_period',
    salary_currency: 'salary_currency',
    performance: 'performance',
    period: 'period',
    period_end: 'period_end',
    product: 'product',
    promised_on: 'promised_on',
    // RECONCILED 2026-08-13. `qty` was MISSING from this list while being the single
    // most-used field in the contract (stock_item.qty, backorder.qty). The previous session
    // was stopped mid-write. Without it an admin literally could not map stock quantity.
    qty: 'qty',
    quality: 'quality',
    reason: 'reason',
    requester: 'requester',
    revenue: 'revenue',
    safety_stock: 'safety_stock',
    severity: 'severity',
    sku: 'sku',
    // RECONCILED 2026-08-13. Also missing: machine_downtime.started_on.
    started_on: 'started_on',
    status: 'status',
    supplier: 'supplier',
    supplier_category: 'supplier_category',
    target: 'target',
    value: 'value',
    vendor: 'vendor',
}
