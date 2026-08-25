import {
    Table,
    StringColumn,
    ChoiceColumn,
    BooleanColumn,
    ReferenceColumn,
    DateTimeColumn,
    HtmlColumn,
} from '@servicenow/sdk/core'

// L6-1, L6-3, L6-5, L6-6. The four HR-document tables. docs/l6-document-design.md §3.
//
// D2 GOVERNS EVERY LINE HERE: payroll and employee profile are fetched LIVE at generation and
// NEVER stored. The enforcement is the schema itself -- there is no column on any of these four
// tables that could hold a name, a salary, a grade, an address, a contract or a start date.
// T6-15 proves it by generating a Salary Certificate and then querying every table in the scope
// for the salary figure that appeared on it, expecting zero hits.
//
// Each variable name equals its table name (TS213).

// ---------------------------------------------------------------------------------------
// L6-1 -- emp_xref. A JOIN KEY AND NOTHING MORE. Four columns is the WHOLE table, and that is
// the point: the schema is the enforcement, not a convention someone can drift from.
// Story L6-1 AC2 is a dictionary scan at sign-off returning no column that could hold HR
// content. Never populated by a sync -- no code path under src/server/sync/ or
// src/server/connector/ names this table (story L6-1 AC6).
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_emp_xref = Table({
    name: 'x_335329_sn_hr_erp_emp_xref',
    label: 'ERP Employee Cross-Reference',
    display: 'erp_employee_key',
    audit: true,
    textIndex: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        user: ReferenceColumn({
            label: 'User',
            referenceTable: 'sys_user',
            mandatory: true,
            hint: 'The ServiceNow user this ERP employee key belongs to. The join key -- nothing about the person is stored here.',
        }),
        erp_system: ReferenceColumn({
            label: 'ERP system',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
            mandatory: true,
        }),
        erp_employee_key: StringColumn({
            label: 'ERP employee key',
            maxLength: 120,
            mandatory: true,
            hint: 'The ERP-side employee id (PERNR, EmployeeNumber, ...). An identifier, not a profile.',
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
        // ---- NV-10 -------------------------------------------------------------------------
        // EXTENDED, NOT REPLACED. The Noviq backlog originally specified a new
        // `x_..._employee_link` table; this one already existed with the right unique index
        // (architect finding V3). Two identity tables would have produced no error and no
        // warning -- just two answers to "which ERP employee is this user?".
        //
        // Still a join key and nothing more. Not one column below could hold HR content: the
        // story L6-1 dictionary scan must keep returning nothing.
        payroll_country: StringColumn({
            label: 'Payroll country',
            maxLength: 2,
            hint: 'ISO 3166-1 alpha-2, resolved FROM THE ERP -- never from the ServiceNow user location (NV-51). A secondee\'s payroll jurisdiction and their desk are routinely different places. Drives payroll_calendar and template resolution.',
        }),
        // NV-10 AC6: a terminated employee's key is RETAINED and never reassigned. Reuse would
        // silently point a new joiner at a leaver's payroll record.
        terminated: BooleanColumn({
            label: 'Terminated',
            default: false,
            hint: 'Set at offboarding. The row and its key are kept -- reassignment to another user is refused.',
        }),
        // NV-10 AC5: an identity mismatch BLOCKS reads as well as writes. A read against the
        // wrong employee is a data-protection incident, not a cosmetic error.
        identity_mismatch: BooleanColumn({
            label: 'Identity mismatch',
            default: false,
            hint: 'Set when the ERP returns a different key for this user. Blocks every read and write until an hr_admin resolves it.',
        }),
        linked_on: DateTimeColumn({ label: 'Linked on' }),
        linked_by: ReferenceColumn({ label: 'Linked by', referenceTable: 'sys_user' }),
    },
    index: [
        { name: 'idx_emp_xref_user_system', unique: true, element: ['user', 'erp_system'] },
        // NV-10: the key must be unique PER SYSTEM in the other direction too, so one ERP
        // employee cannot be bound to two ServiceNow users. Enforced at the database -- a script
        // guard loses the race.
        { name: 'idx_emp_xref_key_system', unique: true, element: ['erp_system', 'erp_employee_key'] },
    ],
})

// ---------------------------------------------------------------------------------------
// L6-3 -- doc_type. DECLARES WHAT A DOCUMENT NEEDS.
//
// `required_fields` names logical `object.field` pairs from src/server/contract/objects.ts, so
// an admin maps PERNR -> employee_full_name in the same L1 surface as everything else. THE
// NAMES ARE THE DELIVERABLE (spec §8.1) -- they read as template variables a human would pick
// from a list, never `field_1` or `u_val3`.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_doc_type = Table({
    name: 'x_335329_sn_hr_erp_doc_type',
    label: 'HR Document Type',
    display: 'name',
    audit: true,
    textIndex: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        name: StringColumn({ label: 'Name', maxLength: 120, mandatory: true }),
        code: StringColumn({ label: 'Code', maxLength: 60, mandatory: true }),
        required_objects: StringColumn({
            label: 'Required objects',
            maxLength: 200,
            hint: 'Comma-separated logical objects, e.g. employee_profile,payroll_record.',
        }),
        required_fields: StringColumn({
            label: 'Required fields',
            maxLength: 1000,
            mandatory: true,
            hint: 'Comma-separated object.logical_field pairs. Every one must resolve or NO document is produced.',
        }),
        optional_fields: StringColumn({
            label: 'Optional fields',
            maxLength: 1000,
            hint: 'Rendered when present, omitted WITH their surrounding sentence when not -- never left as a blank line.',
        }),
        optional_defaults: StringColumn({
            label: 'Optional field defaults',
            maxLength: 1000,
            hint:
                'NV-42 D9. Comma-separated `field=literal` pairs used ONLY for fields listed in optional_fields, and ONLY when the ERP returned nothing. Lets a permanent contract print "Permanent -- no end date" instead of a blank. NEVER applies to a required field: a defaulted salary is a fabricated figure.',
        }),
        active: BooleanColumn({
            label: 'Active',
            default: false,
            hint: 'Cannot be set true while required_fields is empty (story L6-2 AC2) -- a type that requires nothing would generate a document with nothing verified.',
        }),
    },
    index: [{ name: 'idx_doc_type_code', unique: true, element: ['code'] }],
})

// ---------------------------------------------------------------------------------------
// L6-5 -- doc_tmpl. `body` carries ${placeholder} names identical to required_fields' field
// halves. L6-D1: THE PLATFORM SEAM IS PRESERVED AT PLACEHOLDER-NAME LEVEL, NOT TABLE LEVEL.
// A platform Document Template binds to a TABLE, and D2 forbids any table carrying
// annual_gross_salary -- so a table-level seam and D2 cannot both hold for the Salary
// Certificate. §3.3 flags this for a human; option (a) is what is built.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_doc_tmpl = Table({
    name: 'x_335329_sn_hr_erp_doc_tmpl',
    label: 'HR Document Template',
    display: 'document_type',
    audit: true,
    textIndex: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        document_type: ReferenceColumn({
            label: 'Document type',
            referenceTable: 'x_335329_sn_hr_erp_doc_type',
            mandatory: true,
        }),
        body: HtmlColumn({
            label: 'Body',
            mandatory: true,
            hint: 'Placeholders as ${employee_full_name}. Every placeholder must resolve at render time or the request fails with NO attachment.',
        }),
        placeholders: StringColumn({
            label: 'Placeholders',
            maxLength: 1000,
            hint: 'The declared contract, validated against `body` and against the document type in both directions.',
        }),
        // NV-43. A SECOND JURISDICTION MUST BE A ROW, NOT A RELEASE. Both are blank on the
        // country-agnostic default; resolution order is documented in hr/template-resolver.ts and
        // NEVER falls back to another country's row -- the wrong legal wording is worse than no
        // document.
        country: StringColumn({
            label: 'Country',
            maxLength: 2,
            hint: 'ISO-3166 alpha-2, resolved FROM THE ERP (emp_xref.payroll_country), never from the ServiceNow user. Blank = the country-agnostic default.',
        }),
        language: StringColumn({
            label: 'Language',
            maxLength: 5,
            hint: 'ISO-639-1, optionally with a region (pt, pt-BR). Blank = applies to every language for this country.',
        }),
        required_fields_override: StringColumn({
            label: 'Required fields override',
            maxLength: 1000,
            hint: 'NV-43 AC4. Comma-separated object.field pairs. When set, this REPLACES doc_type.required_fields for this template, so a field mandatory in one jurisdiction and absent in another is data rather than code. Blank = use the document type.',
        }),
        active: BooleanColumn({ label: 'Active', default: false }),
    },
    index: [
        {
            name: 'idx_doc_tmpl_type_country_lang',
            unique: true,
            element: ['document_type', 'country', 'language'],
        },
    ],
})

// ---------------------------------------------------------------------------------------
// L6-6 -- doc_req. Seven of its columns are DENY-WRITE (Shape A, adminOverrides false) in
// l6-acls.now.ts: an admin cannot retro-edit who requested what (story L6-6 AC5).
//
// `status` has EXACTLY three values (story L6-3 AC7). There is no `generating`: a request that
// has not produced a document is `pending`, honestly, because the document genuinely does not
// exist yet.
// ---------------------------------------------------------------------------------------
export const x_335329_sn_hr_erp_doc_req = Table({
    name: 'x_335329_sn_hr_erp_doc_req',
    label: 'HR Document Request',
    display: 'number',
    audit: true,
    textIndex: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['create', 'read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    autoNumber: { prefix: 'HRDOC', number: 1000, numberOfDigits: 7 },
    schema: {
        number: StringColumn({ label: 'Number', maxLength: 40 }),
        requester: ReferenceColumn({
            label: 'Requester',
            referenceTable: 'sys_user',
            mandatory: true,
            hint: 'ALWAYS overwritten server-side from gs.getUserID() by the before-insert rule. Never trusted from the payload (L6-D4).',
        }),
        subject_employee: ReferenceColumn({
            label: 'Subject employee',
            referenceTable: 'sys_user',
            mandatory: true,
        }),
        document_type: ReferenceColumn({
            label: 'Document type',
            referenceTable: 'x_335329_sn_hr_erp_doc_type',
            mandatory: true,
        }),
        status: ChoiceColumn({
            label: 'Status',
            dropdown: 'none',
            default: 'pending',
            choices: { pending: 'Pending', generated: 'Generated', failed: 'Failed' },
        }),
        failure_reason: StringColumn({
            label: 'Failure reason',
            maxLength: 1000,
            hint: 'Names the missing figure or the failed call. Composed from FIELD NAMES ONLY -- never a value (R6-2). "Document generation failed" alone is a FAIL (story L6-4 AC8).',
        }),
        generated_on: DateTimeColumn({ label: 'Generated on' }),
        output_format: ChoiceColumn({
            label: 'Output format',
            dropdown: 'none',
            choices: { HTML: 'HTML', PDF: 'PDF' },
            hint: 'Set by the renderer from what it ACTUALLY produced. A record claiming PDF for an HTML file fails T6-17.',
        }),
        source_call_ids: StringColumn({
            label: 'Source call log ids',
            maxLength: 1000,
            hint: 'Comma-separated call_log sys_ids, written AS CALLS HAPPEN so a failure still has its trail (L6-D7). Ids only -- an audit row quoting the salary reintroduces the shadow database.',
        }),
        pdf_probe_result: StringColumn({
            label: 'PDF probe result',
            maxLength: 200,
            hint: 'What the RUNTIME probe found, recorded per generation. OD2 is closed with instance evidence, not with a plugin list.',
        }),
        // NV-43 AC1 and AC5 -- WHICH template produced this document, recorded on the request.
        // Without it, "why does this letter say that?" has no answer six months later.
        template_country: StringColumn({
            label: 'Template country',
            maxLength: 2,
            hint: 'The country whose template was resolved. Blank means the country-agnostic default was used -- which is different from "no country was known".',
        }),
        template_language: StringColumn({ label: 'Template language', maxLength: 5 }),
    },
    index: [{ name: 'idx_doc_req_status', unique: false, element: ['status'] }],
})
