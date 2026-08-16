import { Record } from '@servicenow/sdk/core'

// L6-3 and L6-5. The two document types and their templates.
//
// EVERY VALUE BELOW IS A LITERAL. `Record()` data values are BUILD-TIME strings, not executed
// JavaScript: a `.join()`, a `+` or a template literal writes the literal expression -- or
// `Symbol(CallExpressionShape)` -- into the column on a clean, successful build (kickoff §9).
//
// THE FIELD NAMES ARE THE DELIVERABLE (spec §8.1, story L6-2 AC5, T6-4). They read as template
// variables a human would pick from a list -- `employee_full_name`, `annual_gross_salary`,
// `employment_start_date` -- never `field_1` or `u_val3`, and they are the same strings as the
// logical field names in src/server/contract/objects.ts, so an admin maps PERNR ->
// employee_full_name in the same L1 surface as everything else.
//
// BOTH TYPES SHIP `active: true`. Their required_fields are non-empty, so the L6-4 rule permits
// it, and an inactive type is refused at submission -- a catalogue of types nobody may request
// is not a shipped feature.

export const l6TypeEmploymentVerification = Record({
    $id: Now.ID['l6-doc-type-employment-verification'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_type',
    data: {
        name: 'Employment Verification Letter',
        code: 'employment_verification',
        required_objects: 'employee_profile',
        required_fields:
            'employee_profile.employee_full_name,employee_profile.employment_start_date,employee_profile.job_title,employee_profile.employment_status',
        optional_fields: 'employee_profile.department',
        active: true,
    },
})

export const l6TypeSalaryCertificate = Record({
    $id: Now.ID['l6-doc-type-salary-certificate'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_type',
    data: {
        name: 'Salary Certificate',
        code: 'salary_certificate',
        required_objects: 'employee_profile,payroll_record',
        required_fields:
            'employee_profile.employee_full_name,employee_profile.employment_start_date,employee_profile.job_title,payroll_record.annual_gross_salary,payroll_record.salary_currency,payroll_record.pay_period',
        optional_fields: '',
        active: true,
    },
})

// ---------------------------------------------------------------------------------------
// The templates. `${placeholder}` names match the FIELD half of the required_fields above --
// which is exactly the seam L6-D1 preserves: `DocumentContext` is an in-memory object whose
// keys are these names, and `required_fields` is the machine-readable declaration a platform
// Document Template would bind to if one existed on this instance.
//
// EVERY PLACEHOLDER MUST RESOLVE OR NO DOCUMENT IS PRODUCED. There is no default, no "N/A" and
// no empty line: a blank on a salary certificate is a document someone applies for a mortgage
// with. The optional `department` sentence is omitted WITH its sentence when absent, which is
// why it lives in its own paragraph rather than inside another one.
// ---------------------------------------------------------------------------------------

export const l6TmplEmploymentVerification = Record({
    $id: Now.ID['l6-doc-tmpl-employment-verification'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_tmpl',
    data: {
        document_type: l6TypeEmploymentVerification,
        placeholders: 'employee_full_name,employment_start_date,job_title,employment_status',
        active: true,
        body: '<h1>Employment Verification Letter</h1><p>This letter confirms that <strong>${employee_full_name}</strong> is recorded in our employer of record system.</p><ul><li>Job title: ${job_title}</li><li>Employment start date: ${employment_start_date}</li><li>Employment status: ${employment_status}</li></ul><p>The figures above were read from the employer of record system at the moment this letter was produced and were not stored in ServiceNow.</p>',
    },
})

export const l6TmplSalaryCertificate = Record({
    $id: Now.ID['l6-doc-tmpl-salary-certificate'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_tmpl',
    data: {
        document_type: l6TypeSalaryCertificate,
        placeholders: 'employee_full_name,employment_start_date,job_title,annual_gross_salary,salary_currency,pay_period',
        active: true,
        body: '<h1>Salary Certificate</h1><p>This certificate confirms the remuneration of <strong>${employee_full_name}</strong>, ${job_title}, employed since ${employment_start_date}.</p><ul><li>Annual gross salary: ${salary_currency} ${annual_gross_salary}</li><li>Pay period: ${pay_period}</li></ul><p>The figures above were read from the payroll system at the moment this certificate was produced and were not stored in ServiceNow. A certificate is never issued with a figure missing.</p>',
    },
})
