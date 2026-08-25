import { Record } from '@servicenow/sdk/core'

// NV-33, NV-34 and NV-40. The write approval policies the BRD mandates by name.
//
// A SEEDED POLICY IS THE ENFORCEMENT, NOT A SUGGESTION. `approvalRequired()` returns FALSE when
// no row matches -- which is safe ONLY because every gate the BRD mandates ships as a row here
// and its deactivation is ACL-denied (noviq-acls.now.ts denies write on `approval_required` to
// everyone, Shape A, adminOverrides false). Deleting a row from this file removes a payroll-fraud
// control silently.
//
// EVERY VALUE IS A LITERAL. `Record()` data values are build-time strings, not executed
// JavaScript -- a `+` writes the literal expression into the column (trap 7).
//
// ONLY POLICIES WHOSE KEY EXISTS IN THIS REPO ARE SEEDED. The BRD also gates D6-D9, and NV-45
// gates termination; those document codes and that operation do not exist yet, and a policy row
// naming a key nothing ever writes is a control that looks present and enforces nothing. Blank
// beats wrong (repo rule 5). They are listed as outstanding in docs/noviq/BUILD-LOG-31-40.md.

/**
 * NV-33. Field-level, NOT `employee_profile.update` -- an address change and a banking change are
 * both that key, and gating the object would gate every address change in the company.
 */
export const nvPolicyBankingIban = Record({
    $id: Now.ID['nv-policy-banking-iban'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    data: {
        policy_key: 'employee_profile.bank_account_iban',
        logical_object: 'employee_profile',
        operation: 'update',
        country: '',
        approval_required: true,
        active: true,
        source_note:
            'BRD R2 key requirement: every banking/IBAN change requires human approval before it reaches payroll, and the employee is notified on the prior-of-record channel. BRD section 9 risk 2 names unapproved banking change as the payroll-fraud scenario this gate exists to stop. Field-level key because NV-32 (address, phone, emergency contact) is explicitly ungated and shares the object and operation.',
    },
})

/**
 * NV-34. OQ-4 is recorded on this row deliberately: the BRD says HR/Finance "validates against
 * policy" without saying whether that is an approval record or an agent action. It is implemented
 * as a formal approval record because a gate nobody can point at is a gate nobody can test.
 */
export const nvPolicyExpenseClaim = Record({
    $id: Now.ID['nv-policy-expense-claim'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    data: {
        policy_key: 'expense_claim.create',
        logical_object: 'expense_claim',
        operation: 'create',
        country: '',
        approval_required: true,
        active: true,
        source_note:
            'BRD R4: HR/Finance validates the claim against policy before it reaches the ERP. OQ-4 records that the BRD does not state whether that validation is a formal approval record or an agent action; implemented as a formal approval record so the gate is testable and auditable rather than procedural.',
    },
})

/**
 * NV-40, D2. `document.<code>` where the code is `doc_type.code` -- the same string the L6 seeds
 * already use, so the key resolves against a document type that actually exists.
 */
export const nvPolicyDocSalaryCertificate = Record({
    $id: Now.ID['nv-policy-doc-salary-certificate'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    data: {
        policy_key: 'document.salary_certificate',
        // No logical_object and no operation: a document release is not an ERP object write, and
        // a blank choice value is not a valid choice. The key alone resolves it.
        country: '',
        approval_required: true,
        active: true,
        source_note:
            'BRD section 6.1a D2 Salary / Income Certificate: an income figure leaves the organisation only when someone accountable released it. The gate runs at GENERATION, not at delivery (NV-40 AC2) -- before approval the PDF does not exist at all, rather than existing and being hidden.',
    },
})

/**
 * NV-42, D9. Visa / immigration letters carry legal and immigration consequence, so they are not
 * auto-issued. D6, D7 and D8 have no policy row because they have no document type -- see
 * nv-doc-seeds.now.ts for why each is absent.
 */
export const nvPolicyDocVisaSupport = Record({
    $id: Now.ID['nv-policy-doc-visa-support'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    data: {
        policy_key: 'document.visa_support_letter',
        country: '',
        approval_required: true,
        active: true,
        source_note:
            'BRD section 6.1a D9 Visa / Immigration Support Letter: documents with legal or immigration consequence are not auto-issued. Gated at generation like D2, so the PDF does not exist before release rather than existing and being hidden.',
    },
})

/**
 * NV-44. The compensation gate. The multi-stage chain (manager, HR, and Finance for salary) is
 * enforced in `write/compensation-change.ts`; THIS row is what makes the dispatcher's own gate
 * refuse a write that somehow reached it without one.
 */
export const nvPolicyCompensationChange = Record({
    $id: Now.ID['nv-policy-compensation-change'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    data: {
        policy_key: 'compensation_change.update',
        logical_object: 'compensation_change',
        operation: 'update',
        country: '',
        approval_required: true,
        active: true,
        // THESE GROUP NAMES ARE PLACEHOLDERS AND THE GATE FAILS CLOSED UNTIL THEY ARE REAL. A
        // group that does not exist cannot have approved anything, so `approvalFromGroup()`
        // returns nothing and the change stays `blocked_approval` naming the missing stage. That
        // is the correct direction to fail: an organisation that has not named its approvers has
        // not authorised anything.
        required_groups: 'HR ERP Managers,HR Business Partners',
        source_note:
            'BRD R6 and section 7 Approval integrity: a contract, role or compensation change reaches payroll only after the approval chain completes. Finance is additionally required for salary changes (NV-44 AC1). Section 9 risk 2 names an unapproved compensation write as a payroll-fraud path.',
    },
})

/**
 * NV-45 phase 2. Seeded now, though no surface can reach the phase-2 write yet: the gate must
 * exist BEFORE the path does, not be added alongside it.
 */
export const nvPolicyTermination = Record({
    $id: Now.ID['nv-policy-termination'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    data: {
        policy_key: 'employee_profile.terminate',
        country: '',
        approval_required: true,
        active: true,
        source_note:
            'BRD R8 and section 7: an automatic termination write requires approval and passes the payroll cut-off gate. Phase 1 ships orchestration-only per the BRD recommendation, so this policy guards a path no surface can currently reach -- deliberately, because a gate added alongside its write is a gate nobody tested without it.',
    },
})


/**
 * NV-44 AC1 -- the salary variant. Finance is required for salary changes AND ONLY FOR THOSE, so
 * the two chains are two policy rows rather than a branch in code: `policyKeyFor()` picks
 * `compensation_change.update.salary` when the change type is salary.
 */
export const nvPolicyCompensationSalary = Record({
    $id: Now.ID['nv-policy-compensation-salary'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_write_approval_policy',
    data: {
        policy_key: 'compensation_change.update.salary',
        logical_object: 'compensation_change',
        operation: 'update',
        country: '',
        approval_required: true,
        active: true,
        required_groups: 'HR ERP Managers,HR Business Partners,Finance Approvers',
        source_note:
            'BRD R6 and section 7: a salary change additionally requires Finance. NV-44 AC6 asserts that manager and HR approval alone produce zero outbound requests. The group names ship as placeholders and the gate fails closed until they name real sys_user_group records.',
    },
})
