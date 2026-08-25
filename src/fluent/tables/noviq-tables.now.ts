import {
    Table,
    StringColumn,
    ChoiceColumn,
    BooleanColumn,
    ReferenceColumn,
    DateTimeColumn,
    DateColumn,
    IntegerColumn,
} from '@servicenow/sdk/core'
import {
    AUTHORITY_CHOICES,
    BUILD_VS_BUY_CHOICES,
    DISCOVERY_ANSWER_CHOICES,
    REQUIREMENT_AREA_CHOICES,
    TELEMETRY_ACTION_CHOICES,
    TELEMETRY_OUTCOME_CHOICES,
    WRITE_STATE_CHOICES,
    WRITE_OPERATION_CHOICES,
    OBJECT_CHOICES,
    CALENDAR_SOURCE_CHOICES,
    EXCEPTION_CATEGORY_CHOICES,
} from './choices'

// Noviq NV-2, NV-3, NV-7, NV-8, NV-9, NV-12, NV-15. The six tables the Noviq employee-services
// increment adds. docs/noviq/stories.md; decisions OD42-OD46 in docs/decision-log.md.
//
// GOVERNANCE: these tables exist because OD42 reversed DL-D3 for this scope. `read_only` on
// erp_system survives that reversal -- a write against a read-only system is refused BEFORE
// dispatch with its own state value, never collapsed into a generic failure.
//
// D2 STILL GOVERNS. No column on any table here can hold a salary, an IBAN, a name, an address
// or a date of birth. erp_write records that a write happened, to which external id, under which
// approval -- never what the value was. An audit row quoting the salary reintroduces the shadow
// database the whole app exists to avoid (L6-1 precedent).
//
// Each variable name equals its table name (TS213). `var` is rejected; ES6 shorthand is rejected.

// ---------------------------------------------------------------------------------------
// NV-2 -- erp_scope_grant. TRD §2 Authorization scope, TRD §5 field-level permission clarity.
// Least privilege asserted by THIS integration rather than promised by an ERP admin: a call for
// an (object, operation) with no active grant is refused client-side, before the request leaves
// ServiceNow, and renders `not configured` naming the grant to create.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_scope_grant = Table({
    name: 'x_335329_sn_hr_erp_scope_grant',
    label: 'ERP Scope Grant',
    display: 'erp_role_or_scope',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        erp_system: ReferenceColumn({
            label: 'ERP system',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
            mandatory: true,
        }),
        logical_object: ChoiceColumn({
            label: 'Logical object',
            mandatory: true,
            dropdown: 'none',
            choices: OBJECT_CHOICES,
        }),
        operation: ChoiceColumn({
            label: 'Operation',
            mandatory: true,
            dropdown: 'none',
            choices: WRITE_OPERATION_CHOICES,
        }),
        erp_role_or_scope: StringColumn({
            label: 'ERP role or scope',
            maxLength: 200,
            mandatory: true,
            hint: 'The ERP-side role/scope this credential actually holds for this object and operation.',
        }),
        // Elevated-sensitivity fields (banking, compensation) must name a DIFFERENT ERP role from
        // the general employee-update grant -- TRD §5. Enforced by business rule, not convention.
        elevated_sensitivity: BooleanColumn({
            label: 'Elevated sensitivity',
            default: false,
            hint: 'Banking or compensation. Requires an erp_role_or_scope distinct from the general update grant.',
        }),
        source_note: StringColumn({
            label: 'Source note',
            maxLength: 500,
            mandatory: true,
            hint: 'Citation for the role/scope name. Repo rule 5 -- a seeded grant with a blank citation fails the build.',
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    index: [
        {
            name: 'idx_scope_grant_sys_obj_op',
            unique: true,
            element: ['erp_system', 'logical_object', 'operation'],
        },
    ],
})

// ---------------------------------------------------------------------------------------
// NV-3, NV-4, NV-8 -- erp_write. One row per attempted write. THE governed write path.
//
// A 2xx is NEVER by itself success (TRD §2 Write pattern): a response with no confirmable
// identifier sets `failed`, not `confirmed`. The distinction is the whole point -- "the ERP
// accepted my request" and "the ERP recorded my change" are different claims.
//
// NO PAYLOAD VALUE IS STORED. `request_hash` proves two attempts carried the same content
// without the content being here to leak.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_erp_write = Table({
    name: 'x_335329_sn_hr_erp_erp_write',
    label: 'ERP Write',
    display: 'idempotency_key',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        erp_system: ReferenceColumn({
            label: 'ERP system',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
            mandatory: true,
        }),
        logical_object: ChoiceColumn({
            label: 'Logical object',
            mandatory: true,
            dropdown: 'none',
            choices: OBJECT_CHOICES,
        }),
        operation: ChoiceColumn({
            label: 'Operation',
            mandatory: true,
            dropdown: 'none',
            choices: WRITE_OPERATION_CHOICES,
        }),
        external_id: StringColumn({
            label: 'External employee/record id',
            maxLength: 120,
            hint: 'The ERP-side identifier addressed. An identifier, never a profile.',
        }),
        idempotency_key: StringColumn({
            label: 'Idempotency key',
            maxLength: 200,
            mandatory: true,
            hint: 'Deterministic. Stable across retries of the same logical write (NV-4).',
        }),
        // NV-8: BRD §7 auditability. A write with no originating case is refused at insert.
        source_table: StringColumn({
            label: 'Source table',
            maxLength: 80,
            mandatory: true,
            hint: 'Polymorphic pair with source_record, NOT a reference -- so the HRSD surface swap stays a data change (OD40/V1).',
        }),
        source_record: StringColumn({
            label: 'Source record',
            maxLength: 32,
            mandatory: true,
            hint: 'sys_id of the originating case/RITM. Polymorphic by design.',
        }),
        approval_ref: StringColumn({
            label: 'Approval record',
            maxLength: 32,
            hint: 'sysapproval_approver sys_id. Mandatory where write_approval_policy requires approval (NV-9).',
        }),
        policy_key: StringColumn({
            label: 'Policy key',
            maxLength: 120,
            hint: 'The write_approval_policy key this write is judged against. Blank falls back to "<logical_object>.<operation>". Needed because a banking change and an address change are both employee_profile.update and only one of them is gated (NV-32 vs NV-33).',
        }),
        request_hash: StringColumn({
            label: 'Request hash',
            maxLength: 64,
            hint: 'Hash of the dispatched payload. Proves two attempts carried the same content WITHOUT storing the content.',
        }),
        state: ChoiceColumn({
            label: 'State',
            mandatory: true,
            dropdown: 'none',
            choices: WRITE_STATE_CHOICES,
        }),
        error_message: StringColumn({ label: 'Error message', maxLength: 1000 }),
        erp_ack_ref: StringColumn({
            label: 'ERP acknowledgement',
            maxLength: 200,
            hint: 'The confirmable identifier the ERP returned. Empty with a 2xx means `failed`, never `confirmed`.',
        }),
        effective_cycle: StringColumn({
            label: 'Effective payroll cycle',
            maxLength: 60,
            hint: 'Set when a write is queued past a cut-off (NV-7). Names the cycle it will land in.',
        }),
        requested_by: ReferenceColumn({ label: 'Requested by', referenceTable: 'sys_user' }),
        approved_by: ReferenceColumn({ label: 'Approved by', referenceTable: 'sys_user' }),
        attempts: IntegerColumn({ label: 'Attempts', default: 0 }),
        first_sent_at: DateTimeColumn({
            label: 'First sent at',
            hint: 'The approval gate compares this to the approval sys_updated_on -- a retroactive approval must not satisfy the gate (NV-9).',
        }),
        confirmed_at: DateTimeColumn({ label: 'Confirmed at' }),
        call_log_ids: StringColumn({
            label: 'Call log ids',
            maxLength: 1000,
            hint: 'Comma-separated call_log sys_ids, written AS CALLS HAPPEN so a failure still has its trail. Ids only.',
        }),
    },
    // NV-4: the duplicate is refused AT THE DATABASE, not by script. A script-only guard loses
    // the race that idempotency exists to win.
    index: [
        { name: 'idx_erp_write_idem', unique: true, element: ['erp_system', 'idempotency_key'] },
        { name: 'idx_erp_write_state', unique: false, element: ['state'] },
    ],
})

// ---------------------------------------------------------------------------------------
// NV-12 -- erp_exception. The HR-facing actionable queue. TRD §2 error semantics.
// `category` is a CLOSED list of eight. A generic `Error` value is what makes a queue unworked.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_erp_exception = Table({
    name: 'x_335329_sn_hr_erp_erp_exception',
    label: 'ERP Exception',
    display: 'short_description',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        erp_system: ReferenceColumn({
            label: 'ERP system',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
        }),
        category: ChoiceColumn({
            label: 'Category',
            mandatory: true,
            dropdown: 'none',
            choices: EXCEPTION_CATEGORY_CHOICES,
        }),
        short_description: StringColumn({
            label: 'Short description',
            maxLength: 200,
            mandatory: true,
            hint: 'Plain language, for an HR agent. Never the raw stack or the ERP body verbatim.',
        }),
        erp_message: StringColumn({
            label: 'ERP message',
            maxLength: 1000,
            hint: "The vendor's own field-level message, where it carried one. No payload values.",
        }),
        erp_write: ReferenceColumn({
            label: 'ERP write',
            referenceTable: 'x_335329_sn_hr_erp_erp_write',
        }),
        source_table: StringColumn({ label: 'Source table', maxLength: 80 }),
        source_record: StringColumn({ label: 'Source record', maxLength: 32 }),
        // An exception with no assignment group is an exception nobody works. Refused at insert.
        assignment_group: ReferenceColumn({
            label: 'Assignment group',
            referenceTable: 'sys_user_group',
            mandatory: true,
        }),
        state: ChoiceColumn({
            label: 'State',
            mandatory: true,
            dropdown: 'none',
            choices: { open: 'Open', in_progress: 'In progress', resolved: 'Resolved' },
        }),
        call_log_ids: StringColumn({ label: 'Call log ids', maxLength: 1000 }),
    },
    index: [{ name: 'idx_erp_exception_state', unique: false, element: ['state'] }],
})

// ---------------------------------------------------------------------------------------
// NV-7 -- payroll_calendar. BRD §7 and TRD §5.
//
// NO CALENDAR ROW MEANS REFUSE, NOT ALLOW. Treating an absent calendar as "no cut-off applies"
// is the four-state rule's failure mode in a new costume: an absence read as a permission.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_payroll_calendar = Table({
    name: 'x_335329_sn_hr_erp_payroll_calendar',
    label: 'Payroll Calendar',
    display: 'pay_period_label',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        erp_system: ReferenceColumn({
            label: 'ERP system',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
            mandatory: true,
        }),
        country: StringColumn({
            label: 'Country',
            maxLength: 2,
            mandatory: true,
            hint: 'ISO 3166-1 alpha-2. Payroll cut-offs are jurisdictional (NV-51).',
        }),
        pay_period_label: StringColumn({ label: 'Pay period', maxLength: 60, mandatory: true }),
        period_start: DateColumn({ label: 'Period start', mandatory: true }),
        period_end: DateColumn({ label: 'Period end', mandatory: true }),
        cutoff_datetime: DateTimeColumn({ label: 'Cut-off', mandatory: true }),
        pay_date: DateColumn({ label: 'Pay date', mandatory: true }),
        next_period_label: StringColumn({
            label: 'Next period',
            maxLength: 60,
            hint: 'Named on the queued-for-next-cycle message so the employee is told where the change landed.',
        }),
        source: ChoiceColumn({
            label: 'Source',
            mandatory: true,
            dropdown: 'none',
            choices: CALENDAR_SOURCE_CHOICES,
        }),
        source_note: StringColumn({ label: 'Source note', maxLength: 500 }),
    },
    index: [
        {
            name: 'idx_payroll_cal_sys_country_period',
            unique: true,
            element: ['erp_system', 'country', 'pay_period_label'],
        },
    ],
})

// ---------------------------------------------------------------------------------------
// NV-9 -- write_approval_policy. The gate resolves from DATA, not from a code branch per flow.
// Approval integrity becomes a property of the platform rather than of every flow being written
// correctly by every future developer.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_write_approval_policy = Table({
    name: 'x_335329_sn_hr_erp_write_approval_policy',
    label: 'Write Approval Policy',
    display: 'policy_key',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        policy_key: StringColumn({
            label: 'Policy key',
            maxLength: 120,
            mandatory: true,
            hint: 'Either "<logical_object>.<operation>" or "document.<D-code>". One key, one policy.',
        }),
        logical_object: ChoiceColumn({
            label: 'Logical object',
            dropdown: 'none',
            choices: OBJECT_CHOICES,
        }),
        operation: ChoiceColumn({
            label: 'Operation',
            dropdown: 'none',
            choices: WRITE_OPERATION_CHOICES,
        }),
        country: StringColumn({ label: 'Country', maxLength: 2, hint: 'Blank = applies to all (NV-51 fallback).' }),
        approval_required: BooleanColumn({ label: 'Approval required', default: true }),
        required_groups: StringColumn({
            label: 'Required approver groups',
            maxLength: 500,
            hint:
                'NV-44. Comma-separated sys_user_group NAMES, in order. A multi-stage chain is complete only when each named group has an approved approval for the case. Blank = a single approval from anyone satisfies the gate.',
        }),
        source_note: StringColumn({
            label: 'Source note',
            maxLength: 500,
            mandatory: true,
            hint: 'The BRD section mandating this gate. A policy with no citation is a policy nobody can defend.',
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    index: [{ name: 'idx_write_policy_key', unique: true, element: ['policy_key', 'country'] }],
})

// ---------------------------------------------------------------------------------------
// NV-15 -- vendor_onboarding. TRD §8, and TRD §9 step 2: "do not assume absence from silence in
// public documentation."
//
// THE THREE-STATE FIELD IS THE POINT. An unconfirmed item renders `Not confirmed`, never `No`.
// Cegid and PHC ship every item unconfirmed with a citation saying no research exists -- which
// is a true statement, where `No` would be a false one.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_vendor_onboarding = Table({
    name: 'x_335329_sn_hr_erp_vendor_onboarding',
    label: 'Vendor Onboarding Checklist',
    display: 'vendor',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        vendor: StringColumn({ label: 'Vendor', maxLength: 60, mandatory: true }),
        checklist_item: StringColumn({
            label: 'Checklist item',
            maxLength: 120,
            mandatory: true,
            hint: 'One of the TRD §8 items: developer portal, sandbox tenant, developer access, production access, marketplace certification.',
        }),
        // Three states, never two. `not_confirmed` is the default and is a FINDING, not a gap.
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            dropdown: 'none',
            choices: {
                not_confirmed: 'Not confirmed',
                confirmed: 'Confirmed',
                confirmed_absent: 'Confirmed absent',
            },
        }),
        source_note: StringColumn({
            label: 'Source note',
            maxLength: 500,
            mandatory: true,
            hint: 'A URL for `confirmed`. For `not_confirmed`, the reason -- e.g. "No research exists".',
        }),
    },
    index: [{ name: 'idx_vendor_onboarding', unique: true, element: ['vendor', 'checklist_item'] }],
})


// ===========================================================================================
// NV-50 -- usage_event. WHAT WAS DONE, NEVER WHAT IT SAID.
//
// There is no payload column, no employee reference and no business value on this table, and that
// is the design rather than an omission: BRD O5 wants to know which of the ten requirement areas
// are used and at what volume, which needs none of those things. A telemetry table carrying a
// salary is the shadow database D2 exists to prevent, arriving through the analytics door.
//
// `persona_role` is a ROLE NAME, not a user. "Employees use R3 and HRBPs do not" is the finding
// BRD section 10 asks for; "pedro.leite used R3" is a different table with a different lawful
// basis.
// ===========================================================================================
export const x_335329_sn_hr_erp_usage_event = Table({
    name: 'x_335329_sn_hr_erp_usage_event',
    label: 'Usage Event',
    display: 'requirement_area',
    audit: false,
    textIndex: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        requirement_area: ChoiceColumn({
            label: 'Requirement area',
            dropdown: 'none',
            mandatory: true,
            choices: REQUIREMENT_AREA_CHOICES,
        }),
        action: ChoiceColumn({
            label: 'Action',
            dropdown: 'none',
            mandatory: true,
            choices: TELEMETRY_ACTION_CHOICES,
        }),
        outcome: ChoiceColumn({
            label: 'Outcome',
            dropdown: 'none',
            mandatory: true,
            choices: TELEMETRY_OUTCOME_CHOICES,
        }),
        persona_role: StringColumn({
            label: 'Persona role',
            maxLength: 100,
            hint: 'The app role the actor held. NOT a user reference -- the question is which persona uses an area, not who.',
        }),
        occurred: DateTimeColumn({ label: 'Occurred', mandatory: true }),
        erp_system: ReferenceColumn({
            label: 'ERP system',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
        }),
    },
    index: [
        { name: 'idx_usage_event_area', unique: false, element: ['requirement_area'] },
        { name: 'idx_usage_event_outcome', unique: false, element: ['outcome'] },
    ],
})


// ===========================================================================================
// NV-52 -- landscape_discovery. THE GATE BEFORE ANY DEPLOYMENT BUILD.
//
// One row per requirement area per deployment. BRD section 9 risk 3 is a fragmented HR/Finance
// estate found during BUILD rather than during scoping; this table is where it gets found first.
//
// EVERY COLUMN THAT MATTERS IS MANDATORY, and `authority` has an explicit `none_identified` value
// so that "nobody owns this" is recordable. A blank is not an answer, and an area nobody answered
// for publishes nothing (AC6).
// ===========================================================================================
export const x_335329_sn_hr_erp_landscape_discovery = Table({
    name: 'x_335329_sn_hr_erp_landscape_discovery',
    label: 'Landscape Discovery',
    display: 'requirement_area',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        erp_system: ReferenceColumn({
            label: 'Configured ERP system',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
            mandatory: true,
        }),
        requirement_area: ChoiceColumn({
            label: 'Requirement area',
            dropdown: 'none',
            mandatory: true,
            choices: REQUIREMENT_AREA_CHOICES,
        }),
        authority: ChoiceColumn({
            label: 'System of authority',
            dropdown: 'none',
            mandatory: true,
            choices: AUTHORITY_CHOICES,
            hint: 'Which system is the record of authority for this area. `None identified` is a real answer; leaving it blank is not, and blocks publication.',
        }),
        authority_system_name: StringColumn({
            label: 'Authority system name',
            maxLength: 120,
            hint: 'Required in practice whenever the authority is not the configured core ERP -- an area owned by "another system" that nobody can name has not been discovered.',
        }),
        native_timesheet_workflow: ChoiceColumn({
            label: 'Native ERP timesheet workflow in use',
            dropdown: 'none',
            default: 'not_answered',
            choices: DISCOVERY_ANSWER_CHOICES,
            hint: 'R10 ONLY (BRD R10 note). NV-47 does not start until this is answered: BRD R10 warns that a ServiceNow timesheet frequently duplicates capability the organisation already runs natively.',
        }),
        zero_copy_connector: ChoiceColumn({
            label: 'Zero Copy Connector for ERP',
            dropdown: 'none',
            default: 'not_assessed',
            choices: BUILD_VS_BUY_CHOICES,
            hint: 'ServiceNow ships this: it queries the ERP system of record through remote tables, serving BRD O3 natively. Supported for SAP ECC and S/4HANA ONLY through the Australia release, so it cannot serve an ERP-agnostic product -- but for a SAP-only deployment it may already be most of the read path.',
        }),
        hrsd_advanced_integration: ChoiceColumn({
            label: 'HRSD Advanced Integration (Workday / Oracle HCM / SuccessFactors)',
            dropdown: 'none',
            default: 'not_assessed',
            choices: BUILD_VS_BUY_CHOICES,
            hint: 'ServiceNow ships these, including a Get Time Off Balance capability that is R3/INT-11 by another name. Irrelevant to Unit4, Cegid and PHC; decisive if the landscape holds one of those HCMs.',
        }),
        build_vs_buy_note: StringColumn({
            label: 'Build-vs-buy citation',
            maxLength: 1000,
            hint: 'WHY each product above was adopted, rejected or ruled not applicable, with its citation. A decision with no citation is a preference.',
        }),
        completed_by: ReferenceColumn({ label: 'Completed by', referenceTable: 'sys_user' }),
        completed_on: DateTimeColumn({ label: 'Completed on' }),
    },
    index: [
        {
            name: 'idx_landscape_system_area',
            unique: true,
            element: ['erp_system', 'requirement_area'],
        },
    ],
})
