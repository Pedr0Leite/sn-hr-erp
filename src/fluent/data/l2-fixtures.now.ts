import { Record } from '@servicenow/sdk/core'

// L2-11. The gate fixtures. docs/l2-connector-design.md §7 step L2-11, §8.
//
// THESE FIXTURES *ARE* THE L2 GATE -- "one successful live call and a forced-failure call, both
// logged, with the breaker demonstrably opening."
//
// FIXTURE CHANGES ARE SOURCE CHANGES, ALWAYS (R2-4). `installMethod: 'demo'` records ignore a
// redeploy for their `active` field ONLY; a redeploy DOES restore every other field from source.
// Repointing one by Table API PATCH survives exactly until the next deploy -- that is what
// turned a green run into nine failures thirteen minutes later on the sibling project.
//
// THE SIX erp_system ROWS ARE NOT DECLARED HERE. They were created directly on the instance at
// L1 and are referenced below by the sys_id a live query returned -- which is the one case
// kickoff §9 permits a raw sys_id string. Declaring them here would collide with the unique
// index on `name` and create a second set. Their sys_ids are:
//   540bdfeb47260b100739b71f316d43a1  ECHO-PRIMARY        (System A, basic, postman-echo.com)
//   523bd72f47260b100739b71f316d43e6  ECHO-SAP-DE         (System B, basic, postman-echo.com)
//   240bdfeb47260b100739b71f316d43b7  BROKEN-FIXTURE      (System C, erp-invalid.invalid)
//
// BROKEN-FIXTURE IS BROKEN ON PURPOSE. It is the forced-failure and breaker-opening path. Do
// not "fix" its base_url.
//
// Every system answers from postman-echo.com or an invalid host (D12). That proves the
// connector carries no vendor knowledge. It does NOT prove L1-b, which stays open on OD3/OD15.

const SYSTEM_A = '540bdfeb47260b100739b71f316d43a1'
const SYSTEM_B = '523bd72f47260b100739b71f316d43e6'
const SYSTEM_C = '240bdfeb47260b100739b71f316d43b7'

/**
 * Basic-auth credentials matching postman-echo's /basic-auth endpoint, which accepts exactly
 * postman/password.
 *
 * NOT A SECRET. These are the public, documented credentials of a public echo service and grant
 * access to nothing. They exist so the auth half of T15 proves that basic auth resolves through
 * the `sys_auth_profile_basic` REFERENCE rather than through credentials embedded in the
 * connector. A 401 on that call is a configuration failure, not a network problem.
 */
export const l2TestAuthProfile = Record({
    $id: Now.ID['l2-auth-profile-basic'],
    $meta: { installMethod: 'demo' },
    table: 'sys_auth_profile_basic',
    data: {
        name: 'HRERP L2 Test Credentials',
        username: 'postman',
        password: 'password',
    },
})

// ==========================================================================================
// SYSTEM A -- the workhorse. Every failure-mode case runs against this row.
//
// Its shipped max_retries is 2 -> 3 attempts per exhausted call -> 2 exhausted calls = 6
// attempt rows = exactly CB_FAILURE_THRESHOLD. That is what makes "run balance twice, the
// breaker opens" deterministic rather than approximate.
//
// EVERY MAP USED FOR A LIVE CALL CARRIES AT LEAST ONE field_map ROW. An active map with zero
// rows is MAP_UNMAPPED (§4.2) and never dials -- which is `backorder`'s job, below, and would
// otherwise silently disable half this suite.
// ==========================================================================================

/**
 * T15 / T2-19 (the gate's successful call), T2-11 (mapping resolution) and T2-12 (the mapper).
 *
 * THE QUERY STRING IS THE T2-12 FIXTURE and its shape is deliberate: THREE mapped source fields
 * that are present (InvoiceNo, GrossAmount, Curr), FOUR unmapped ones (Ignored1..4), and the
 * field_map below names a FOURTH mapped field, `due_on` <- DueDate, that the response does NOT
 * carry. Expected: 3 logical fields produced, 4 ignored silently, due_on ABSENT -- not zero --
 * and the record still produced.
 *
 * THE SOURCE FIELD NAMES ARE DELIBERATELY UNLIKE THE LOGICAL NAMES. A mapper that ignored
 * field_map and copied keys straight across would pass a fixture that used `number`/`amount`
 * directly, and fail only against a real ERP.
 */
export const l2MapInvoiceA = Record({
    $id: Now.ID['l2-map-a-invoice'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'invoice',
        endpoint_path: '/get?InvoiceNo=INV-000123&GrossAmount=1450.75&Curr=EUR&Ignored1=a&Ignored2=b&Ignored3=c&Ignored4=d',
        http_method: 'get',
        response_root: 'args',
        pagination_style: 'none',
        page_size: 100,
        date_format: 'yyyy-MM-dd',
        active: true,
    },
})

export const l2FieldInvoiceNumber = Record({
    $id: Now.ID['l2-field-a-invoice-number'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapInvoiceA, logical_field: 'number', source_field: 'InvoiceNo', transform: 'none', zero_is_meaningful: false },
})

export const l2FieldInvoiceAmount = Record({
    $id: Now.ID['l2-field-a-invoice-amount'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapInvoiceA, logical_field: 'amount', source_field: 'GrossAmount', transform: 'none', zero_is_meaningful: false },
})

export const l2FieldInvoiceCurrency = Record({
    $id: Now.ID['l2-field-a-invoice-currency'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapInvoiceA, logical_field: 'currency', source_field: 'Curr', transform: 'none', zero_is_meaningful: false },
})

/** Mapped, and DELIBERATELY ABSENT from the response. T2-12's "empty, not zero" assertion. */
export const l2FieldInvoiceDueOn = Record({
    $id: Now.ID['l2-field-a-invoice-due-on'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapInvoiceA, logical_field: 'due_on', source_field: 'DueDate', transform: 'none', zero_is_meaningful: false },
})

/** T21 (retry on a retryable 5xx), T24 (breaker trip), and the gate's System A close path. */
export const l2MapBalanceA = Record({
    $id: Now.ID['l2-map-a-balance'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'balance',
        endpoint_path: '/status/503',
        http_method: 'get',
        pagination_style: 'none',
        page_size: 100,
        active: true,
    },
})

export const l2FieldBalanceAmount = Record({
    $id: Now.ID['l2-field-a-balance-amount'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapBalanceA, logical_field: 'amount', source_field: 'Bal', transform: 'none', zero_is_meaningful: false },
})

/** T22 -- a 10 s server delay against a client timeout the driver lowers to 2 s. */
export const l2MapPurchaseOrderA = Record({
    $id: Now.ID['l2-map-a-purchase-order'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'purchase_order',
        endpoint_path: '/delay/10',
        http_method: 'get',
        pagination_style: 'none',
        page_size: 100,
        active: true,
    },
})

export const l2FieldPurchaseOrderAmount = Record({
    $id: Now.ID['l2-field-a-purchase-order-amount'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapPurchaseOrderA, logical_field: 'amount', source_field: 'Amt', transform: 'none', zero_is_meaningful: false },
})

/**
 * T17 / T2-6 -- a non-retryable 4xx. EXACTLY ONE attempt row; more than one means a real HTTP
 * status is losing to the transport message, and every 404 is being retried max_retries + 1
 * times (I10). This carries the sibling's `receipt` fixture: OD9 dropped that object from this
 * app's 16, so `vendor_invoice` carries the case instead. The assertions are unchanged.
 */
export const l2MapVendorInvoiceA = Record({
    $id: Now.ID['l2-map-a-vendor-invoice'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'vendor_invoice',
        endpoint_path: '/status/404',
        http_method: 'get',
        pagination_style: 'none',
        page_size: 100,
        active: true,
    },
})

export const l2FieldVendorInvoiceAmount = Record({
    $id: Now.ID['l2-field-a-vendor-invoice-amount'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapVendorInvoiceA, logical_field: 'amount', source_field: 'Amt', transform: 'none', zero_is_meaningful: false },
})

/**
 * T16 -- rows_returned. postman-echo's /get?a=1&a=2 echoes `args.a` as a deterministic
 * 2-element array. This carries the sibling's `credit_status` fixture; OD9 dropped that object.
 */
export const l2MapGlSummaryA = Record({
    $id: Now.ID['l2-map-a-gl-summary'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'gl_summary',
        endpoint_path: '/get?a=1&a=2',
        http_method: 'get',
        response_root: 'args.a',
        pagination_style: 'none',
        page_size: 100,
        active: true,
    },
})

export const l2FieldGlSummaryRevenue = Record({
    $id: Now.ID['l2-field-a-gl-summary-revenue'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapGlSummaryA, logical_field: 'revenue', source_field: 'Rev', transform: 'none', zero_is_meaningful: false },
})

/**
 * T2-7 -- a 302. setFollowRedirect(false) means the redirect is NOT followed, so no
 * `Authorization` header can leave the configured host, and 3xx is a NON-RETRYABLE failure.
 */
export const l2MapWorkOrderA = Record({
    $id: Now.ID['l2-map-a-work-order'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'work_order',
        endpoint_path: '/redirect-to?url=https%3A%2F%2Fpostman-echo.com%2Fget&status_code=302',
        http_method: 'get',
        pagination_style: 'none',
        page_size: 100,
        active: true,
    },
})

export const l2FieldWorkOrderNumber = Record({
    $id: Now.ID['l2-field-a-work-order-number'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapWorkOrderA, logical_field: 'number', source_field: 'No', transform: 'none', zero_is_meaningful: false },
})

/** T15's auth half -- /basic-auth answers 200 only when the auth profile actually resolved. */
export const l2MapRequisitionA = Record({
    $id: Now.ID['l2-map-a-requisition'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'requisition',
        endpoint_path: '/basic-auth',
        http_method: 'get',
        pagination_style: 'none',
        page_size: 100,
        active: true,
    },
})

export const l2FieldRequisitionNumber = Record({
    $id: Now.ID['l2-field-a-requisition-number'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapRequisitionA, logical_field: 'number', source_field: 'No', transform: 'none', zero_is_meaningful: false },
})

/**
 * T19b / T2-2 branch 3 -- MAP_INACTIVE. SHIPS active: false ON PURPOSE.
 *
 * `installMethod: 'demo'` ignores `active` on redeploy, so this row's inactive state survives
 * exactly one install and must not be "corrected" by a later session.
 */
export const l2MapFixedAssetA = Record({
    $id: Now.ID['l2-map-a-fixed-asset'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'fixed_asset',
        endpoint_path: '/get',
        http_method: 'get',
        pagination_style: 'none',
        page_size: 100,
        active: false,
    },
})

export const l2FieldFixedAssetValue = Record({
    $id: Now.ID['l2-field-a-fixed-asset-value'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapFixedAssetA, logical_field: 'value', source_field: 'Val', transform: 'none', zero_is_meaningful: false },
})

/**
 * T2-8 -- `disableForcedVariableSubstitution`. The query template carries a LITERAL `${x}`.
 * It must arrive at the endpoint unaltered; postman-echo echoes it back so the proof is direct.
 */
export const l2MapMaintenanceA = Record({
    $id: Now.ID['l2-map-a-maintenance'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_A,
        logical_object: 'maintenance_schedule',
        endpoint_path: '/get',
        http_method: 'get',
        response_root: 'args',
        query_template: 'probe=${x}',
        pagination_style: 'none',
        page_size: 100,
        active: true,
    },
})

export const l2FieldMaintenanceTag = Record({
    $id: Now.ID['l2-field-a-maintenance-tag'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapMaintenanceA, logical_field: 'asset_tag', source_field: 'Tag', transform: 'none', zero_is_meaningful: false },
})

// ==========================================================================================
// SYSTEM B -- a second ERP row, added as DATA ONLY. T32 / AC24.
// ==========================================================================================

export const l2MapInvoiceB = Record({
    $id: Now.ID['l2-map-b-invoice'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_B,
        logical_object: 'invoice',
        endpoint_path: '/get?InvoiceNo=SAP-000777&GrossAmount=99.50',
        http_method: 'get',
        response_root: 'args',
        pagination_style: 'offset',
        page_size: 250,
        date_format: 'dd.MM.yyyy',
        active: true,
    },
})

export const l2FieldInvoiceBNumber = Record({
    $id: Now.ID['l2-field-b-invoice-number'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapInvoiceB, logical_field: 'number', source_field: 'InvoiceNo', transform: 'none', zero_is_meaningful: false },
})

export const l2FieldInvoiceBAmount = Record({
    $id: Now.ID['l2-field-b-invoice-amount'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapInvoiceB, logical_field: 'amount', source_field: 'GrossAmount', transform: 'none', zero_is_meaningful: false },
})

// ==========================================================================================
// SYSTEM C -- BROKEN-FIXTURE. base_url is erp-invalid.invalid and that is DELIBERATE.
// This is the gate's forced-failure and breaker-opening path (§8 step 2). It can never close,
// because nothing at an invalid host will ever answer -- so the close half of the gate is
// demonstrated on System A, and the build report says so rather than implying otherwise.
// ==========================================================================================

export const l2MapInvoiceC = Record({
    $id: Now.ID['l2-map-c-invoice'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_object_map',
    data: {
        erp_system: SYSTEM_C,
        logical_object: 'invoice',
        endpoint_path: '/get',
        http_method: 'get',
        response_root: 'args',
        pagination_style: 'none',
        page_size: 100,
        active: true,
    },
})

export const l2FieldInvoiceCNumber = Record({
    $id: Now.ID['l2-field-c-invoice-number'],
    $meta: { installMethod: 'demo' },
    table: 'x_335329_sn_hr_erp_field_map',
    data: { object_map: l2MapInvoiceC, logical_field: 'number', source_field: 'InvoiceNo', transform: 'none', zero_is_meaningful: false },
})
