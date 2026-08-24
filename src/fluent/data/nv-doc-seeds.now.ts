import { Record } from '@servicenow/sdk/core'

// NV-41 and NV-42. The document types whose fields EXIST in this repo's contract.
//
// WHAT IS DELIBERATELY ABSENT MATTERS AS MUCH AS WHAT IS HERE:
//   D6 Work Certificate    -- needs a `position_history` collection the model does not carry.
//                             NV-42 AC2 permits it to be unpublished with a stated reason, and
//                             explicitly FAILS a flattened single-position substitute.
//   D7 Final Settlement    -- needs `final_pay_calculation` and `leave_payout`, neither modelled
//                             by the TRD (OQ-6). A template referencing them would name fields
//                             nothing can map (repo rule 5).
//   D8 Contract Copy       -- the signed contract is RETRIEVED from the ERP, never regenerated
//                             (NV-42 AC4). It is an NV-25 retrieval item, not a template.
// None of the three is seeded, and none has an approval policy: a policy naming a document code
// nothing generates is a control that looks present and enforces nothing.
//
// EVERY VALUE IS A LITERAL (trap 7).

// ---------------------------------------------------------------------------------------
// D4 -- Annual Income & Tax Statement. Sources income_statement via the NV-26 read path.
// `tax_withheld` is REQUIRED: a zero withheld figure on a tax statement is acted on by a tax
// authority, so it must come from a live read that genuinely returned it, never from an absence.
// ---------------------------------------------------------------------------------------
export const nvTypeAnnualTaxStatement = Record({
    $id: Now.ID['nv-doc-type-annual-tax-statement'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_type',
    data: {
        name: 'Annual Income & Tax Statement',
        code: 'annual_income_tax_statement',
        required_objects: 'employee_profile,income_statement',
        required_fields:
            'employee_profile.employee_full_name,income_statement.tax_year,income_statement.gross_annual,income_statement.net_annual,income_statement.tax_withheld,income_statement.currency',
        optional_fields: 'income_statement.statutory_contributions',
        optional_defaults: '',
        active: true,
    },
})

export const nvTmplAnnualTaxStatement = Record({
    $id: Now.ID['nv-doc-tmpl-annual-tax-statement'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_tmpl',
    data: {
        document_type: nvTypeAnnualTaxStatement,
        placeholders: 'employee_full_name,tax_year,gross_annual,net_annual,tax_withheld,currency',
        country: '',
        language: '',
        required_fields_override: '',
        active: true,
        body: '<h1>Annual Income &amp; Tax Statement</h1><p>This statement covers <strong>${employee_full_name}</strong> for the tax year ${tax_year}.</p><ul><li>Gross annual income: ${gross_annual} ${currency}</li><li>Net annual income: ${net_annual} ${currency}</li><li>Tax withheld: ${tax_withheld} ${currency}</li></ul><p>Every figure above was read from the employer of record system at the moment this statement was produced and was not stored in ServiceNow.</p>',
    },
})

// ---------------------------------------------------------------------------------------
// D5 -- Leave Balance Certificate. THE SHARPEST `0` IN THE BACKLOG: a certified zero balance is
// acted on by a new employer.
//
// `balance_unit` and `as_of_date` are BOTH required, so a bare number can never be certified --
// "12" is not a leave balance, "12 days as of 2026-08-24" is.
//
// CONFIGURATION NOTE FOR WHOEVER MAPS THIS: `balance_value` must have `zero_is_meaningful` set on
// its field_map row. Without it the shared mapper OMITS a zero (L1 §4.4), the required-field
// check aborts, and a genuine zero balance reads as "the ERP did not return it". That is the SAFE
// failure -- a refusal rather than a false certificate -- but it is still the wrong answer, and
// the fix is one checkbox on the mapping, not a code change here.
// ---------------------------------------------------------------------------------------
export const nvTypeLeaveBalanceCertificate = Record({
    $id: Now.ID['nv-doc-type-leave-balance-certificate'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_type',
    data: {
        name: 'Leave Balance Certificate',
        code: 'leave_balance_certificate',
        required_objects: 'employee_profile,leave_balance',
        required_fields:
            'employee_profile.employee_full_name,leave_balance.leave_type,leave_balance.balance_value,leave_balance.balance_unit,leave_balance.as_of_date',
        optional_fields: '',
        optional_defaults: '',
        active: true,
    },
})

export const nvTmplLeaveBalanceCertificate = Record({
    $id: Now.ID['nv-doc-tmpl-leave-balance-certificate'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_tmpl',
    data: {
        document_type: nvTypeLeaveBalanceCertificate,
        placeholders: 'employee_full_name,leave_type,balance_value,balance_unit,as_of_date',
        country: '',
        language: '',
        required_fields_override: '',
        active: true,
        body: '<h1>Leave Balance Certificate</h1><p>This certificate confirms the leave balance recorded for <strong>${employee_full_name}</strong> in the employer of record system.</p><ul><li>Leave type: ${leave_type}</li><li>Balance: ${balance_value} ${balance_unit}</li><li>As of: ${as_of_date}</li></ul><p>The balance above is the figure held at the as-of date shown. It was read live and was not stored in ServiceNow.</p>',
    },
})

// ---------------------------------------------------------------------------------------
// D9 -- Visa / Immigration Support Letter. APPROVAL-GATED (NV-42 AC1).
//
// `employment_end_date` is OPTIONAL with a literal default: a permanent contract genuinely has no
// end date, and the letter must say so in words rather than print a blank an immigration officer
// has to interpret. The default reaches the context ONLY through the optional path, so no
// required figure can ever be defaulted into existence.
// ---------------------------------------------------------------------------------------
export const nvTypeVisaSupportLetter = Record({
    $id: Now.ID['nv-doc-type-visa-support-letter'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_type',
    data: {
        name: 'Visa / Immigration Support Letter',
        code: 'visa_support_letter',
        required_objects: 'employee_profile,payroll_record',
        required_fields:
            'employee_profile.employee_full_name,employee_profile.employment_status,employee_profile.contract_type,payroll_record.annual_gross_salary,payroll_record.salary_currency',
        optional_fields: 'employee_profile.employment_end_date',
        optional_defaults: 'employment_end_date=Permanent -- no end date',
        active: true,
    },
})

export const nvTmplVisaSupportLetter = Record({
    $id: Now.ID['nv-doc-tmpl-visa-support-letter'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_tmpl',
    data: {
        document_type: nvTypeVisaSupportLetter,
        placeholders: 'employee_full_name,employment_status,contract_type,annual_gross_salary,salary_currency,employment_end_date',
        country: '',
        language: '',
        required_fields_override: '',
        active: true,
        body: '<h1>Immigration Support Letter</h1><p>This letter is issued in support of an immigration application by <strong>${employee_full_name}</strong>.</p><ul><li>Employment status: ${employment_status}</li><li>Contract type: ${contract_type}</li><li>Annual gross salary: ${annual_gross_salary} ${salary_currency}</li><li>Contract end date: ${employment_end_date}</li></ul><p>The figures above were read from the employer of record system at the moment this letter was produced.</p>',
    },
})

// ---------------------------------------------------------------------------------------
// D10 -- Pension / Benefits Contribution Statement. SHIPS UNPUBLISHED (active: false).
//
// NV-41 AC3: D10 is not published until `benefit_enrollment` has a configured object_map, and it
// is NEVER published with an empty statement. `active: false` is exactly that state -- the L6
// rule refuses an inactive type at submission, so the item cannot be ordered until an
// administrator has mapped the entity and activated it deliberately.
// ---------------------------------------------------------------------------------------
export const nvTypePensionStatement = Record({
    $id: Now.ID['nv-doc-type-pension-statement'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_type',
    data: {
        name: 'Pension / Benefits Contribution Statement',
        code: 'pension_contribution_statement',
        required_objects: 'employee_profile,benefit_enrollment',
        required_fields:
            'employee_profile.employee_full_name,benefit_enrollment.benefit_type,benefit_enrollment.plan_option,benefit_enrollment.contribution_amount,benefit_enrollment.currency,benefit_enrollment.effective_date',
        optional_fields: '',
        optional_defaults: '',
        active: false,
    },
})

export const nvTmplPensionStatement = Record({
    $id: Now.ID['nv-doc-tmpl-pension-statement'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_doc_tmpl',
    data: {
        document_type: nvTypePensionStatement,
        placeholders: 'employee_full_name,benefit_type,plan_option,contribution_amount,currency,effective_date',
        country: '',
        language: '',
        required_fields_override: '',
        active: false,
        body: '<h1>Pension / Benefits Contribution Statement</h1><p>This statement records the benefit enrollment held for <strong>${employee_full_name}</strong> in the employer of record system.</p><ul><li>Benefit type: ${benefit_type}</li><li>Plan / option: ${plan_option}</li><li>Contribution: ${contribution_amount} ${currency}</li><li>Effective from: ${effective_date}</li></ul>',
    },
})
