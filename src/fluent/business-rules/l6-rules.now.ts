import { BusinessRule } from '@servicenow/sdk/core'
import { enforceRequestBoundary, validateDocTemplate, validateDocType } from '../../server/hr/rules'

// L6-4, L6-5, L6-7. Bodies are MODULE FUNCTIONS, matching l1-rules.now.ts and l3-rules.now.ts.

// L6-4 / story L6-2 AC2. T6-5.
BusinessRule({
    $id: Now.ID['br-doc-type-activation'],
    name: 'A document type cannot be activated with no requirements',
    table: 'x_335329_sn_hr_erp_doc_type',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    description:
        'Refuses active=true while required_fields is empty. A type that requires nothing produces a document that verified nothing -- the blank certificate arriving by configuration instead of by a missing figure.',
    script: validateDocType,
})

// L6-5 / story L6-2 AC7. T6-6.
BusinessRule({
    $id: Now.ID['br-doc-template-placeholders'],
    name: 'A template may only use placeholders its type provides',
    table: 'x_335329_sn_hr_erp_doc_tmpl',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    description:
        "Refuses a ${placeholder} the document type does not declare, naming both sides: \"Template references 'annual_gross_salary', which Employment Verification Letter does not provide.\" -- because \"invalid template\" is not something an admin can act on.",
    script: validateDocTemplate,
})

// L6-7 / story L6-3 AC3, AC4, AC5, AC6. THE SELF-SERVICE BOUNDARY. T6-8, T6-9, T6-10.
//
// A BUSINESS RULE, NOT A PRODUCER SCRIPT, AND THAT IS THE WHOLE POINT. Story L6-3 AC3 posts a
// doc_req through the Table API naming somebody else, bypassing the form entirely. A boundary
// enforced by hiding a field on the record producer is not in that path and fails the story.
BusinessRule({
    $id: Now.ID['br-doc-request-boundary'],
    name: 'Document request self-service boundary',
    table: 'x_335329_sn_hr_erp_doc_req',
    when: 'before',
    action: ['insert'],
    order: 100,
    active: true,
    description:
        'Overwrites requester from gs.getUserID() unconditionally; defaults an empty subject to the caller; refuses a subject other than the caller without hr_viewer; refuses a subject that is not an active sys_user; refuses an inactive document type. Enforced server-side so a Table API POST is refused identically to a form submission.',
    script: enforceRequestBoundary,
})
