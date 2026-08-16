import { BusinessRule } from '@servicenow/sdk/core'
import { validateStaging, validateSyncRun } from '../../server/business-rules/validate-staging'

// L3-3 and L3-6. Bodies are MODULE FUNCTIONS, matching l1-rules.now.ts.
//
// A choice list is NOT evaluated on a Table API insert. erp_staging offers five categories and
// fourteen objects in its dropdowns, and a POST can still carry `hr` and `payroll_record` past
// both. These two rules are the enforcement; the choice lists are the convenience.

// L3-6 / story L3-1 AC2, AC3, AC6. T3-6, T3-7.
BusinessRule({
    $id: Now.ID['br-staging-validate'],
    name: 'Validate staged ERP row',
    table: 'x_335329_sn_hr_erp_staging',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    description:
        'Refuses erp_category=hr, refuses any logical object with no erp_category (payroll_record, employee_profile) with the verbatim message "Payroll and employee data are never staged (decision D2).", and refuses a row with no sync_run reference. The choice lists do not constrain a Table API insert; this rule does.',
    script: validateStaging,
})

// L3-3 / story L3-2 AC4. T3-5.
BusinessRule({
    $id: Now.ID['br-sync-run-validate'],
    name: 'A failed sync run must record why',
    table: 'x_335329_sn_hr_erp_sync_run',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    description:
        'Aborts a sync_run saved with status=failed and an empty error_message. The engine always supplies one, so this is a backstop against a future caller: "the ERP did not answer" with no recorded reason is an unattributable failure, and attribution is the product.',
    script: validateSyncRun,
})
