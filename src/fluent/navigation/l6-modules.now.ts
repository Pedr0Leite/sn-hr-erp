import { Record } from '@servicenow/sdk/core'
import { appMenu } from './app-menu.now'

// L6-12. Navigator modules for the document surfaces. Links use `_list.do` -- never `.list`,
// which fails in the Next Experience shell (kickoff §9).

const ADMIN = 'x_335329_sn_hr_erp.admin'
const HR_VIEWER = 'x_335329_sn_hr_erp.hr_viewer'

Record({
    $id: Now.ID['module-doc-requests'],
    table: 'sys_app_module',
    data: {
        title: 'HR Document Requests',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_335329_sn_hr_erp_doc_req',
        hint: 'Every request, successful or failed, with its stated reason and the call ids that produced it.',
        roles: [HR_VIEWER],
        active: true,
        order: 200,
    },
})

Record({
    $id: Now.ID['module-emp-xref'],
    table: 'sys_app_module',
    data: {
        title: 'Employee Cross-Reference',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_335329_sn_hr_erp_emp_xref',
        hint: 'ServiceNow user to ERP employee key. A join key and nothing more -- no HR content is stored here.',
        roles: [ADMIN],
        active: true,
        order: 210,
    },
})

Record({
    $id: Now.ID['module-doc-types'],
    table: 'sys_app_module',
    data: {
        title: 'HR Document Types',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_335329_sn_hr_erp_doc_type',
        hint: 'What each document requires. A type cannot be activated with an empty requirement list.',
        roles: [ADMIN],
        active: true,
        order: 220,
    },
})

Record({
    $id: Now.ID['module-doc-templates'],
    table: 'sys_app_module',
    data: {
        title: 'HR Document Templates',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_335329_sn_hr_erp_doc_tmpl',
        hint: 'Template bodies. A placeholder the type does not provide is refused on save.',
        roles: [ADMIN],
        active: true,
        order: 230,
    },
})
