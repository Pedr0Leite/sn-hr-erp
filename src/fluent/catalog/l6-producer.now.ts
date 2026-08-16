import { CatalogItemRecordProducer, ReferenceVariable } from '@servicenow/sdk/core'

// L6-8. Intake. docs/l6-document-design.md §4.
//
// ON THE BASE SERVICE CATALOG, BY SYS_ID. There is NO Employee Center dependency:
// `com.snc.employee_center` is absent from this instance. The catalog and category sys_ids
// below were resolved by live query and are hard-coded here per the SDK's own rule -- a
// reference to a Global record, never a Global record of our own.
//
// ===========================================================================================
// THE SELF-SERVICE BOUNDARY IS NOT HERE. It is the `before insert` business rule
// (enforceRequestBoundary, l6-rules.now.ts), and that placement is the whole point of story
// L6-3 AC3: a request POSTed through the Table API, bypassing this form entirely, must be
// refused identically. A boundary enforced by hiding a field on this producer is not in that
// path and fails the story. Nothing here is load-bearing for security.
// ===========================================================================================

const SERVICE_CATALOG = 'e0d08b13c3330100c8b837659bba8fb4'
const USER_REQUESTS_CATEGORY = '3eeeb63c71e1495aaab1fd597b597ccc'

export const l6DocumentRequestProducer = CatalogItemRecordProducer({
    $id: Now.ID['l6-doc-request-producer'],
    name: 'Request an HR document',
    shortDescription:
        'Request an Employment Verification Letter or a Salary Certificate. Figures are read live from the employer of record system at generation time and are never stored in ServiceNow.',
    description:
        'Submitting this form creates a request in Pending. The document is produced by a background job that reads the required figures live from the ERP. If any required figure is missing or the ERP does not answer, NO document is produced and the request states exactly why. You may request only for yourself unless you hold the hr_viewer role.',
    table: 'x_335329_sn_hr_erp_doc_req',
    catalogs: [SERVICE_CATALOG],
    categories: [USER_REQUESTS_CATEGORY],
    active: true,
    redirectUrl: 'generatedRecord',
    allowEdit: false,
    variables: {
        document_type: ReferenceVariable({
            question: 'Document type',
            referenceTable: 'x_335329_sn_hr_erp_doc_type',
            referenceQual: 'active=true',
            mandatory: true,
            mapToField: true,
            field: 'document_type',
            order: 100,
        }),
        // LEFT EMPTY MEANS "ME". The rule defaults an empty subject to the caller, so the
        // ordinary self-service path needs no entry here at all -- and a non-hr_viewer who
        // names somebody else is refused server-side with a sentence that says so.
        subject_employee: ReferenceVariable({
            question: 'Subject employee (leave empty for yourself)',
            referenceTable: 'sys_user',
            mandatory: false,
            mapToField: true,
            field: 'subject_employee',
            order: 200,
        }),
    },
})
