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
    // ADD, not a rename (2026-08-18, OD39). Salesforce is a CRM, not an ERP: it is supported as
    // a DATA SOURCE for the asset estate only. Research §2.1 -- no GL, no vendor invoices, no
    // requisitions, no MES, and `employee_profile` is refused on purpose (OD34).
    salesforce: 'Salesforce',
}

/**
 * erp_system.auth_type. ADD, NEVER RENAME (story L1-1 AC6) -- OD45.
 *
 * The first three shipped at L1. The last three are NV-1 / TRD §2, which names OAuth 2.0 client
 * credentials specifically. `oauth2_client_credentials` and `oauth2_jwt` resolve to the SAME
 * OAuth profile branch in rest-client.ts as `oauth2`, and `mutual_tls` to the same branch as
 * `mutual`: the new values carry more information for a human reading the record and behave
 * identically. Renaming the old three would orphan every call_log row keyed on them.
 */
export const AUTH_TYPE_CHOICES = {
    basic: 'Basic',
    oauth2: 'OAuth 2.0',
    mutual: 'Mutual TLS',
    oauth2_client_credentials: 'OAuth 2.0 -- client credentials',
    oauth2_jwt: 'OAuth 2.0 -- JWT bearer',
    mutual_tls: 'Mutual TLS (mTLS)',
}

/**
 * erp_system.environment. NV-1 and NV-15.
 * Unit4 states non-production <-> production mapping as "not supported or allowed", so this is a
 * contractual constraint expressed as data, not a convenience label.
 */
export const ENVIRONMENT_CHOICES = {
    sandbox: 'Sandbox / non-production',
    production: 'Production',
}

/** erp_write.state. NV-3. The three `blocked_*` values stay DISTINCT on purpose: read-only is a
 * configuration choice, cut-off is a timing outcome and approval is a governance outcome.
 * Collapsing them into one `blocked` destroys the reason a write did not happen. */
export const WRITE_STATE_CHOICES = {
    queued: 'Queued',
    sent: 'Sent -- awaiting confirmation',
    confirmed: 'Confirmed by the ERP',
    failed: 'Failed',
    blocked_readonly: 'Blocked -- system is read-only',
    blocked_cutoff: 'Blocked -- payroll cut-off',
    blocked_approval: 'Blocked -- approval missing',
}

/** erp_write.operation and erp_scope_grant.operation. NV-2, NV-3. */
export const WRITE_OPERATION_CHOICES = {
    read: 'Read',
    create: 'Create',
    update: 'Update',
}

/**
 * object_map.idempotency_mode. NV-4.
 * `none` is NOT a permissive default -- NV-4 refuses to save a create-capable map with it.
 */
export const IDEMPOTENCY_MODE_CHOICES = {
    none: 'Not configured',
    header: 'Client-supplied idempotency header',
    existence_check: 'Existence check before create',
    natural_key: 'Deterministic natural key',
}

/**
 * erp_exception.category. NV-12 / TRD §2 error semantics.
 * A CLOSED list of eight. A generic `Error` value is what makes an exception queue unworked --
 * the agent cannot tell which of these it is, so nobody picks it up.
 */
export const EXCEPTION_CATEGORY_CHOICES = {
    validation_failure: 'Validation failure',
    permission_denied: 'Permission denied',
    record_not_found: 'Record not found',
    conflict_duplicate: 'Conflict / duplicate',
    rate_limited: 'Rate limited',
    erp_unavailable: 'ERP unavailable',
    timeout: 'Timeout',
    unexpected_format: 'Unexpected format',
}

/** payroll_calendar.source. NV-7. */
export const CALENDAR_SOURCE_CHOICES = {
    erp: 'Read from the ERP',
    manual: 'Maintained in ServiceNow',
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
    // NV-18 to NV-21. Every one is live-only: none carries an ERP category, so none can be
    // reached by the staging query. Mirrors LOGICAL_OBJECTS key-for-key -- scripts/check-contract
    // compares the two.
    payslip_document: 'Payslip document (live only, never staged)',
    income_statement: 'Income / tax statement (live only, never staged)',
    leave_balance: 'Leave balance (live only, never staged)',
    leave_request: 'Leave request (live only, never staged)',
    leave_type_ref: 'Leave type reference data (cacheable)',
    expense_claim: 'Expense claim (live only, never staged)',
    erp_attachment: 'ERP-side attachment (live only, never staged)',
    compensation_change: 'Compensation change (live only, never staged)',
    benefit_enrollment: 'Benefit enrollment (live only, never staged)',
    timesheet_entry: 'Timesheet entry (live only, never staged)',
    cost_centre_project_ref: 'Cost centre / project reference data (cacheable)',
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
    // ---- NV-17 to NV-21 -------------------------------------------------------------
    // Logical field names for the six Employee additions and the eleven new entities.
    // VENDOR-NEUTRAL BY CONSTRUCTION: SAP calls it PERNR and Unit4 calls it personId;
    // this list only ever says `employee_id`. A vendor field name appearing here is a bug.
    active: 'Active',
    address: 'Address',
    approval_reference: 'Approval reference',
    approver: 'Approver',
    as_of_date: 'As of date',
    balance_unit: 'Balance unit',
    balance_value: 'Balance value',
    bank_account_iban: 'Bank account iban',
    benefit_type: 'Benefit type',
    change_type: 'Change type',
    claim_date: 'Claim date',
    code: 'Code',
    contract_type: 'Contract type',
    contribution_amount: 'Contribution amount',
    cost_centre: 'Cost centre',
    cost_centre_or_project_ref: 'Cost centre or project ref',
    document_available: 'Document available',
    document_reference: 'Document reference',
    document_type_category: 'Document type category',
    effective_date: 'Effective date',
    emergency_contact: 'Emergency contact',
    employment_end_date: 'Employment end date',
    end_date: 'End date',
    entry_date: 'Entry date',
    entry_status: 'Entry status',
    erp_attachment_reference: 'Erp attachment reference',
    erp_claim_reference: 'Erp claim reference',
    erp_request_reference: 'Erp request reference',
    file_name: 'File name',
    gross_annual: 'Gross annual',
    hours: 'Hours',
    issue_date: 'Issue date',
    label: 'Label',
    leave_type: 'Leave type',
    mime_type: 'Mime type',
    net_annual: 'Net annual',
    new_value: 'New value',
    old_value: 'Old value',
    parent_entity_type: 'Parent entity type',
    parent_external_id: 'Parent external id',
    period_label: 'Period label',
    period_start: 'Period start',
    phone: 'Phone',
    plan_option: 'Plan option',
    retrieval_path: 'Retrieval path',
    start_date: 'Start date',
    statutory_contributions: 'Statutory contributions',
    submitted_date: 'Submitted date',
    tax_withheld: 'Tax withheld',
    tax_year: 'Tax year',
    total_amount: 'Total amount',
    unit: 'Unit',
    uploaded_by: 'Uploaded by',
    uploaded_date: 'Uploaded date',

}

// ===========================================================================================
// NV-50 -- usage telemetry. THE VOCABULARY IS CLOSED ON PURPOSE.
//
// A free-text `requirement_area` would let two instrumentation points spell the same area
// differently, and the dashboard would then report two half-used features instead of one used
// one -- which is exactly the decision BRD O5 wants this data to inform.
// ===========================================================================================

/** R1-R10 and D1-D10, exactly as the BRD numbers them. */
export const REQUIREMENT_AREA_CHOICES = {
    R1: 'R1 -- Payslip & document access',
    R2: 'R2 -- Personal data & banking details',
    R3: 'R3 -- Leave & absence',
    R4: 'R4 -- Expense claim & reimbursement',
    R5: 'R5 -- ERP-sourced document generation',
    R6: 'R6 -- Contract, role & compensation change',
    R7: 'R7 -- Onboarding',
    R8: 'R8 -- Offboarding',
    R9: 'R9 -- Benefits & pension',
    R10: 'R10 -- Time & attendance',
    D1: 'D1 -- Employment Verification Letter',
    D2: 'D2 -- Salary / Income Certificate',
    D3: 'D3 -- Payslip Reissue',
    D4: 'D4 -- Annual Income & Tax Statement',
    D5: 'D5 -- Leave Balance Certificate',
    D6: 'D6 -- Work Certificate',
    D7: 'D7 -- Final Settlement Statement',
    D8: 'D8 -- Contract Copy / Amendment Letter',
    D9: 'D9 -- Visa / Immigration Support Letter',
    D10: 'D10 -- Pension / Benefits Contribution Statement',
}

export const TELEMETRY_ACTION_CHOICES = {
    view: 'View',
    submit: 'Submit',
    download: 'Download',
}

/**
 * The outcomes. `not_configured`, `blocked_approval` and `blocked_cutoff` are separate values for
 * the same reason they are separate write states: an area that looks unused because nobody mapped
 * it is a different finding from one nobody wants (NV-50 AC3).
 */
export const TELEMETRY_OUTCOME_CHOICES = {
    success: 'Success',
    failed: 'Failed',
    not_configured: 'Not configured',
    blocked_approval: 'Blocked -- approval',
    blocked_cutoff: 'Blocked -- payroll cut-off',
}

// ===========================================================================================
// NV-52 -- landscape discovery.
// ===========================================================================================

/**
 * Which system is the authority for a requirement area.
 *
 * `none_identified` IS A VALID ANSWER AND A BLANK IS NOT (NV-52 AC1). "Nobody owns this today" is
 * a finding a delivery lead can act on; an empty field is a question nobody asked.
 */
export const AUTHORITY_CHOICES = {
    core_erp: 'The configured core ERP',
    separate_hcm: 'A separate cloud HCM',
    separate_expense: 'A separate expense system',
    other_system: 'Another system',
    none_identified: 'None identified',
}

/**
 * A three-state answer where "nobody has answered yet" must be distinguishable from "no".
 *
 * The whole point of NV-52 is that an unanswered question blocks a build. A Boolean would make
 * `false` and "unanswered" the same value -- which is the absence-read-as-an-answer failure this
 * application refuses everywhere else.
 */
export const DISCOVERY_ANSWER_CHOICES = {
    not_answered: 'Not answered',
    yes: 'Yes',
    no: 'No',
}

/** What the deployment decided about a ServiceNow-shipped product that overlaps this scope. */
export const BUILD_VS_BUY_CHOICES = {
    not_assessed: 'Not assessed',
    adopted: 'Adopted for this deployment',
    rejected: 'Rejected for this deployment',
    not_applicable: 'Not applicable to this landscape',
}
