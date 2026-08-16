import { Role } from '@servicenow/sdk/core'

// L0 §4. All four containsRoles lists are empty. This is the design, not an omission.
// Spec §5.6 / story L0-3: finance_viewer and hr_viewer are never implied by any other
// role, including each other. sys_user_role_contains must return zero rows for this scope.
// See docs/l0-scaffold-design.md §4 and decision L0-D2.

export const viewer = Role({
    name: 'x_335329_sn_hr_erp.viewer',
    description: 'Read-only access to the SN HR&ERP hub and its non-sensitive staged data.',
})

export const financeViewer = Role({
    name: 'x_335329_sn_hr_erp.finance_viewer',
    description:
        'Grants monetary figures across every tab (D6). Never implied by any other role, including hr_viewer.',
})

export const hrViewer = Role({
    name: 'x_335329_sn_hr_erp.hr_viewer',
    description:
        'Employee and payroll data, and the on-behalf-of document request privilege (L0-D3). Never implied by any other role, including finance_viewer.',
})

export const admin = Role({
    name: 'x_335329_sn_hr_erp.admin',
    description: 'Configuration of ERP systems, object and field mappings, templates and properties.',
})
