import { Record } from '@servicenow/sdk/core'

// L1-11. Seeded vendor mapping templates. docs/l1-control-tower-design.md §5.2, story L1-4.
//
// 43 rows. EVERY ONE SHIPS `verified: 'false'` -- test T1-16 queries verified=true
// immediately after deploy and requires ZERO rows. Spec §5.2: "Every shipped default mapping
// is a guess about someone else's API." Each row's source_note says which convention the
// guess came from and states that it is unconfirmed.
//
// KNOWN GAPS, DECLARED RATHER THAN FABRICATED (L1-D5):
//   * The five ASSETS and MANUFACTURING objects (fixed_asset, asset_depreciation,
//     maintenance_schedule, work_order, production_output, machine_downtime) have NO vendor
//     template for ANY vendor. Nobody on this project has seen a real fixed-asset or MES
//     payload. A `verified: false` flag on an invented mapping is still an invented mapping
//     that an admin may apply and half-trust -- an unfounded guess is worse than an absent
//     one. Those objects are mapped by hand until OD3 supplies a real endpoint.
//   * netsuite, infor and workday carry ONE row each -- enough to prove the mechanism.
//     Declared as a gap in docs/l1-build-report.md, not silently absent.
//   * employee_profile and payroll_record are never templated: they are live-only (D2) and
//     are single-record lookups, not staged collections.
//
// 2026-08-16 -- OD37. The 8 `sap_s4` and 4 `unit4` rows were re-derived from vendor
// documentation read live. Their structural hints were not merely unconfirmed, they were
// DEMONSTRABLY WRONG (invented API_* service names; a Unit4 shape -- /api/v1/<object>, a `data`
// root, page/per_page -- that the ObjectAPI does not have anywhere). Six SAP endpoints and three
// Unit4 endpoints are now verified against published documentation and cited in `source_note`.
//
// Their `field_map` payloads are now EMPTY. Not one property name for either vendor is reachable
// in public documentation, and the guessed names were of the same provenance as the service names
// that turned out invented. An object_map with zero field_map rows resolves to MAP_UNMAPPED ->
// `not_configured`, so the tile NAMES the map to create. A template that carries correct plumbing
// and no invented field names is worth more than one that carries invented field names, because
// the second renders a confident wrong number and nobody investigates a number.
//
// EVERY `data` VALUE BELOW IS A PLAIN STRING LITERAL. No .join(), no .map(), no template
// literal, no JSON.stringify() call, no computed expression of any kind. A computed
// expression in a Fluent `data` value writes `Symbol(CallExpressionShape)` into the column
// on a CLEAN, SUCCESSFUL build (kickoff §9). The design permitted a literal JSON.stringify()
// as a known-working exception; a pre-serialised string literal removes the call expression
// altogether and needs no exception. This file is generated-once and checked in as literals.

Record({
    $id: Now.ID['tmpl-sap-s4-balance'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_s4',
        logical_object: 'balance',
        field_map: '{}',
        endpoint_path_hint: '',
        response_root_hint: 'd.results',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). The previous endpoint API_BALANCE_SRV/Balance was invented. S/4HANA has no verified API_* balance service: balances come either from the Trial Balance CDS service (C_TRIALBALANCE_CDS, path shape unverified) or by aggregating API_JOURNALENTRYITEMBASIC_SRV line items. Supply the endpoint by hand. Field names were unverified guesses and have been removed rather than left to render a confident wrong figure.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-s4-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_s4',
        logical_object: 'invoice',
        field_map: '{}',
        endpoint_path_hint: '/sap/opu/odata/sap/API_BILLING_DOCUMENT_SRV/A_BillingDocument',
        response_root_hint: 'd.results',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). The previous endpoint API_INVOICE_SRV/Invoice was invented. Service and entity set VERIFIED from SAP documentation: sandbox base https://sandbox.api.sap.com/s4hanacloud/sap/opu/odata/sap/API_BILLING_DOCUMENT_SRV, entity /A_BillingDocument. This is the SD billing document; an AR open-item view is a different service. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-s4-vendor-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_s4',
        logical_object: 'vendor_invoice',
        field_map: '{}',
        endpoint_path_hint: '/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice',
        response_root_hint: 'd.results',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). The previous endpoint API_VENDOR_INVOICE_SRV/VendorInvoice was invented. Service and entity set VERIFIED from public SAP integration write-ups. Note the A_ prefix on every S/4 entity set. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-s4-gl-summary'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_s4',
        logical_object: 'gl_summary',
        field_map: '{}',
        endpoint_path_hint: '/sap/opu/odata/sap/API_JOURNALENTRYITEMBASIC_SRV/A_JournalEntryItemBasic',
        response_root_hint: 'd.results',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). The previous endpoint API_GL_SUMMARY_SRV/GlSummary was invented. Service path VERIFIED from SAP Cloud SDK documentation (/sap/opu/odata/sap/API_JOURNALENTRYITEMBASIC_SRV) and the A_JournalEntryItemBasic entity is in documented use. This returns journal entry ITEMS, not a summary: the tile aggregates. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-s4-purchase-order'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_s4',
        logical_object: 'purchase_order',
        field_map: '{}',
        endpoint_path_hint: '/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder',
        response_root_hint: 'd.results',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). The previous endpoint API_PURCHASE_ORDER_SRV/PurchaseOrder was invented. Service and entity set VERIFIED from an SAP Community example API call. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-s4-requisition'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_s4',
        logical_object: 'requisition',
        field_map: '{}',
        endpoint_path_hint: '/sap/opu/odata/sap/API_PURCHASEREQ_PROCESS_SRV/A_PurchaseRequisitionHeader',
        response_root_hint: 'd.results',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). API_REQUISITION_SRV/Requisition was invented. Service and entity VERIFIED from SAP Community and SAP KBA 3366726. TWO WARNINGS: (1) SAP has deprecated API_PURCHASEREQ_PROCESS_SRV -- check your release for a successor. (2) KBA 3366726: $format=json on this service returns HTTP 500, so never put it in query_template; the connector already sends Accept: application/json. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-s4-stock-item'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_s4',
        logical_object: 'stock_item',
        field_map: '{}',
        endpoint_path_hint: '/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock',
        response_root_hint: 'd.results',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). The previous endpoint API_STOCK_ITEM_SRV/StockItem was invented. VERIFIED from SAP documentation, which prints the endpoint literally: https://sandbox.api.sap.com/s4hanacloud/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock. The service is read-only by design. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-s4-backorder'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_s4',
        logical_object: 'backorder',
        field_map: '{}',
        endpoint_path_hint: '',
        response_root_hint: 'd.results',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). The previous endpoint API_BACKORDER_SRV/Backorder was invented and no verified S/4HANA backorder service was found. Left blank deliberately: an empty hint makes the admin supply one, a wrong hint gives them a 404 they will blame on their own configuration. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-ecc-balance'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_ecc',
        logical_object: 'balance',
        field_map: '{"amount":{"source":"DMBTR","transform":"none"},"account":{"source":"HKONT","transform":"none"},"account_code":{"source":"SAKNR","transform":"none"},"account_name":{"source":"TXT50","transform":"none"},"as_of":{"source":"BUDAT","transform":"none"},"currency":{"source":"WAERS","transform":"none"},"erp_id":{"source":"OBJKY","transform":"none"}}',
        endpoint_path_hint: '/sap/bc/rest/balance',
        response_root_hint: 'ENTRIES',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyyMMdd',
        verified: false,
        source_note: 'Guess from classic SAP ECC table/field abbreviations (DMBTR, MENGE, MATNR, WERKS). NOT confirmed against a real ECC system.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-ecc-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_ecc',
        logical_object: 'invoice',
        field_map: '{"amount":{"source":"DMBTR","transform":"none"},"customer":{"source":"KUNNR","transform":"none"},"customer_name":{"source":"NAME1","transform":"none"},"number":{"source":"BELNR","transform":"none"},"due_on":{"source":"ZFBDT","transform":"none"},"status":{"source":"BSTAT","transform":"none"},"currency":{"source":"WAERS","transform":"none"},"erp_id":{"source":"OBJKY","transform":"none"}}',
        endpoint_path_hint: '/sap/bc/rest/invoice',
        response_root_hint: 'ENTRIES',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyyMMdd',
        verified: false,
        source_note: 'Guess from classic SAP ECC table/field abbreviations (DMBTR, MENGE, MATNR, WERKS). NOT confirmed against a real ECC system.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-ecc-vendor-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_ecc',
        logical_object: 'vendor_invoice',
        field_map: '{"amount":{"source":"DMBTR","transform":"none"},"vendor":{"source":"LIFNR","transform":"none"},"number":{"source":"BELNR","transform":"none"},"due_on":{"source":"ZFBDT","transform":"none"},"status":{"source":"BSTAT","transform":"none"},"currency":{"source":"WAERS","transform":"none"},"erp_id":{"source":"OBJKY","transform":"none"}}',
        endpoint_path_hint: '/sap/bc/rest/vendor_invoice',
        response_root_hint: 'ENTRIES',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyyMMdd',
        verified: false,
        source_note: 'Guess from classic SAP ECC table/field abbreviations (DMBTR, MENGE, MATNR, WERKS). NOT confirmed against a real ECC system.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-ecc-gl-summary'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_ecc',
        logical_object: 'gl_summary',
        field_map: '{"revenue":{"source":"HSLVT","transform":"none"},"expense":{"source":"HSLVT","transform":"none"},"period":{"source":"MONAT","transform":"none"},"period_end":{"source":"BLDAT","transform":"none"},"currency":{"source":"WAERS","transform":"none"},"erp_id":{"source":"OBJKY","transform":"none"}}',
        endpoint_path_hint: '/sap/bc/rest/gl_summary',
        response_root_hint: 'ENTRIES',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyyMMdd',
        verified: false,
        source_note: 'Guess from classic SAP ECC table/field abbreviations (DMBTR, MENGE, MATNR, WERKS). NOT confirmed against a real ECC system.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-ecc-purchase-order'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_ecc',
        logical_object: 'purchase_order',
        field_map: '{"amount":{"source":"DMBTR","transform":"none"},"supplier":{"source":"LIFNR","transform":"none"},"supplier_category":{"source":"KTOKK","transform":"none"},"number":{"source":"BELNR","transform":"none"},"ordered_on":{"source":"BEDAT","transform":"none"},"status":{"source":"BSTAT","transform":"none"},"currency":{"source":"WAERS","transform":"none"},"erp_id":{"source":"OBJKY","transform":"none"}}',
        endpoint_path_hint: '/sap/bc/rest/purchase_order',
        response_root_hint: 'ENTRIES',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyyMMdd',
        verified: false,
        source_note: 'Guess from classic SAP ECC table/field abbreviations (DMBTR, MENGE, MATNR, WERKS). NOT confirmed against a real ECC system.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-ecc-requisition'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_ecc',
        logical_object: 'requisition',
        field_map: '{"amount":{"source":"DMBTR","transform":"none"},"department":{"source":"KOSTL","transform":"none"},"requester":{"source":"ERNAM","transform":"none"},"number":{"source":"BELNR","transform":"none"},"opened_on":{"source":"ERDAT","transform":"none"},"status":{"source":"BSTAT","transform":"none"},"currency":{"source":"WAERS","transform":"none"},"erp_id":{"source":"OBJKY","transform":"none"}}',
        endpoint_path_hint: '/sap/bc/rest/requisition',
        response_root_hint: 'ENTRIES',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyyMMdd',
        verified: false,
        source_note: 'Guess from classic SAP ECC table/field abbreviations (DMBTR, MENGE, MATNR, WERKS). NOT confirmed against a real ECC system.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-ecc-stock-item'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_ecc',
        logical_object: 'stock_item',
        field_map: '{"qty":{"source":"MENGE","transform":"none"},"safety_stock":{"source":"EISBE","transform":"none"},"location":{"source":"WERKS","transform":"none"},"sku":{"source":"MATNR","transform":"none"},"name":{"source":"MAKTX","transform":"none"},"erp_id":{"source":"OBJKY","transform":"none"}}',
        endpoint_path_hint: '/sap/bc/rest/stock_item',
        response_root_hint: 'ENTRIES',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyyMMdd',
        verified: false,
        source_note: 'Guess from classic SAP ECC table/field abbreviations (DMBTR, MENGE, MATNR, WERKS). NOT confirmed against a real ECC system.',
    },
})

Record({
    $id: Now.ID['tmpl-sap-ecc-backorder'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'sap_ecc',
        logical_object: 'backorder',
        field_map: '{"qty":{"source":"MENGE","transform":"none"},"location":{"source":"WERKS","transform":"none"},"sku":{"source":"MATNR","transform":"none"},"name":{"source":"MAKTX","transform":"none"},"promised_on":{"source":"EINDT","transform":"none"},"status":{"source":"BSTAT","transform":"none"},"erp_id":{"source":"OBJKY","transform":"none"}}',
        endpoint_path_hint: '/sap/bc/rest/backorder',
        response_root_hint: 'ENTRIES',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyyMMdd',
        verified: false,
        source_note: 'Guess from classic SAP ECC table/field abbreviations (DMBTR, MENGE, MATNR, WERKS). NOT confirmed against a real ECC system.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-fusion-balance'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_fusion',
        logical_object: 'balance',
        field_map: '{"amount":{"source":"InvoiceAmount","transform":"none"},"account":{"source":"AccountCombination","transform":"none"},"account_code":{"source":"AccountSegment","transform":"none"},"account_name":{"source":"AccountDescription","transform":"none"},"as_of":{"source":"AccountingDate","transform":"none"},"currency":{"source":"InvoiceCurrency","transform":"none"},"erp_id":{"source":"ObjectId","transform":"none"}}',
        endpoint_path_hint: '/fscmRestApi/resources/11.13.18.05/balances',
        response_root_hint: 'items',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Guess from Oracle Fusion Financials Cloud REST conventions (fscmRestApi, items envelope, UpperCamelCase). NOT confirmed against a real Fusion pod.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-fusion-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_fusion',
        logical_object: 'invoice',
        field_map: '{"amount":{"source":"InvoiceAmount","transform":"none"},"customer":{"source":"CustomerPartyNumber","transform":"none"},"customer_name":{"source":"CustomerPartyName","transform":"none"},"number":{"source":"InvoiceNumber","transform":"none"},"due_on":{"source":"DueDate","transform":"none"},"status":{"source":"InvoiceStatus","transform":"none"},"currency":{"source":"InvoiceCurrency","transform":"none"},"erp_id":{"source":"ObjectId","transform":"none"}}',
        endpoint_path_hint: '/fscmRestApi/resources/11.13.18.05/invoices',
        response_root_hint: 'items',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Guess from Oracle Fusion Financials Cloud REST conventions (fscmRestApi, items envelope, UpperCamelCase). NOT confirmed against a real Fusion pod.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-fusion-vendor-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_fusion',
        logical_object: 'vendor_invoice',
        field_map: '{"amount":{"source":"InvoiceAmount","transform":"none"},"vendor":{"source":"SupplierNumber","transform":"none"},"number":{"source":"InvoiceNumber","transform":"none"},"due_on":{"source":"DueDate","transform":"none"},"status":{"source":"InvoiceStatus","transform":"none"},"currency":{"source":"InvoiceCurrency","transform":"none"},"erp_id":{"source":"ObjectId","transform":"none"}}',
        endpoint_path_hint: '/fscmRestApi/resources/11.13.18.05/vendor_invoices',
        response_root_hint: 'items',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Guess from Oracle Fusion Financials Cloud REST conventions (fscmRestApi, items envelope, UpperCamelCase). NOT confirmed against a real Fusion pod.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-fusion-gl-summary'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_fusion',
        logical_object: 'gl_summary',
        field_map: '{"revenue":{"source":"PeriodNetCredit","transform":"none"},"expense":{"source":"PeriodNetDebit","transform":"none"},"period":{"source":"PeriodName","transform":"none"},"period_end":{"source":"PeriodEndDate","transform":"none"},"currency":{"source":"InvoiceCurrency","transform":"none"},"erp_id":{"source":"ObjectId","transform":"none"}}',
        endpoint_path_hint: '/fscmRestApi/resources/11.13.18.05/gl_summarys',
        response_root_hint: 'items',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Guess from Oracle Fusion Financials Cloud REST conventions (fscmRestApi, items envelope, UpperCamelCase). NOT confirmed against a real Fusion pod.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-fusion-purchase-order'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_fusion',
        logical_object: 'purchase_order',
        field_map: '{"amount":{"source":"InvoiceAmount","transform":"none"},"supplier":{"source":"SupplierNumber","transform":"none"},"supplier_category":{"source":"SupplierType","transform":"none"},"number":{"source":"InvoiceNumber","transform":"none"},"ordered_on":{"source":"CreationDate","transform":"none"},"status":{"source":"InvoiceStatus","transform":"none"},"currency":{"source":"InvoiceCurrency","transform":"none"},"erp_id":{"source":"ObjectId","transform":"none"}}',
        endpoint_path_hint: '/fscmRestApi/resources/11.13.18.05/purchase_orders',
        response_root_hint: 'items',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Guess from Oracle Fusion Financials Cloud REST conventions (fscmRestApi, items envelope, UpperCamelCase). NOT confirmed against a real Fusion pod.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-fusion-requisition'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_fusion',
        logical_object: 'requisition',
        field_map: '{"amount":{"source":"InvoiceAmount","transform":"none"},"department":{"source":"RequisitioningBU","transform":"none"},"requester":{"source":"RequesterDisplayName","transform":"none"},"number":{"source":"InvoiceNumber","transform":"none"},"opened_on":{"source":"SubmittedDate","transform":"none"},"status":{"source":"InvoiceStatus","transform":"none"},"currency":{"source":"InvoiceCurrency","transform":"none"},"erp_id":{"source":"ObjectId","transform":"none"}}',
        endpoint_path_hint: '/fscmRestApi/resources/11.13.18.05/requisitions',
        response_root_hint: 'items',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Guess from Oracle Fusion Financials Cloud REST conventions (fscmRestApi, items envelope, UpperCamelCase). NOT confirmed against a real Fusion pod.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-ebs-balance'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_ebs',
        logical_object: 'balance',
        field_map: '{"amount":{"source":"INVOICE_AMOUNT","transform":"none"},"account":{"source":"CODE_COMBINATION_ID","transform":"none"},"account_code":{"source":"SEGMENT1","transform":"none"},"account_name":{"source":"DESCRIPTION","transform":"none"},"as_of":{"source":"GL_DATE","transform":"none"},"currency":{"source":"INVOICE_CURRENCY_CODE","transform":"none"},"erp_id":{"source":"ROWID","transform":"none"}}',
        endpoint_path_hint: '/OA_HTML/RF.jsp/balance',
        response_root_hint: 'Response.Rows',
        pagination_style_hint: 'page',
        date_format_hint: 'dd-MMM-yyyy',
        verified: false,
        source_note: 'Guess from Oracle E-Business Suite interface-table column naming (UPPER_SNAKE_CASE). NOT confirmed against a real EBS instance.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-ebs-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_ebs',
        logical_object: 'invoice',
        field_map: '{"amount":{"source":"INVOICE_AMOUNT","transform":"none"},"customer":{"source":"CUSTOMER_NUMBER","transform":"none"},"customer_name":{"source":"CUSTOMER_NAME","transform":"none"},"number":{"source":"INVOICE_NUM","transform":"none"},"due_on":{"source":"DUE_DATE","transform":"none"},"status":{"source":"APPROVAL_STATUS","transform":"none"},"currency":{"source":"INVOICE_CURRENCY_CODE","transform":"none"},"erp_id":{"source":"ROWID","transform":"none"}}',
        endpoint_path_hint: '/OA_HTML/RF.jsp/invoice',
        response_root_hint: 'Response.Rows',
        pagination_style_hint: 'page',
        date_format_hint: 'dd-MMM-yyyy',
        verified: false,
        source_note: 'Guess from Oracle E-Business Suite interface-table column naming (UPPER_SNAKE_CASE). NOT confirmed against a real EBS instance.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-ebs-vendor-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_ebs',
        logical_object: 'vendor_invoice',
        field_map: '{"amount":{"source":"INVOICE_AMOUNT","transform":"none"},"vendor":{"source":"VENDOR_ID","transform":"none"},"number":{"source":"INVOICE_NUM","transform":"none"},"due_on":{"source":"DUE_DATE","transform":"none"},"status":{"source":"APPROVAL_STATUS","transform":"none"},"currency":{"source":"INVOICE_CURRENCY_CODE","transform":"none"},"erp_id":{"source":"ROWID","transform":"none"}}',
        endpoint_path_hint: '/OA_HTML/RF.jsp/vendor_invoice',
        response_root_hint: 'Response.Rows',
        pagination_style_hint: 'page',
        date_format_hint: 'dd-MMM-yyyy',
        verified: false,
        source_note: 'Guess from Oracle E-Business Suite interface-table column naming (UPPER_SNAKE_CASE). NOT confirmed against a real EBS instance.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-ebs-gl-summary'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_ebs',
        logical_object: 'gl_summary',
        field_map: '{"revenue":{"source":"PERIOD_NET_CR","transform":"none"},"expense":{"source":"PERIOD_NET_DR","transform":"none"},"period":{"source":"PERIOD_NAME","transform":"none"},"period_end":{"source":"END_DATE","transform":"none"},"currency":{"source":"INVOICE_CURRENCY_CODE","transform":"none"},"erp_id":{"source":"ROWID","transform":"none"}}',
        endpoint_path_hint: '/OA_HTML/RF.jsp/gl_summary',
        response_root_hint: 'Response.Rows',
        pagination_style_hint: 'page',
        date_format_hint: 'dd-MMM-yyyy',
        verified: false,
        source_note: 'Guess from Oracle E-Business Suite interface-table column naming (UPPER_SNAKE_CASE). NOT confirmed against a real EBS instance.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-ebs-purchase-order'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_ebs',
        logical_object: 'purchase_order',
        field_map: '{"amount":{"source":"INVOICE_AMOUNT","transform":"none"},"supplier":{"source":"VENDOR_ID","transform":"none"},"supplier_category":{"source":"VENDOR_TYPE_LOOKUP_CODE","transform":"none"},"number":{"source":"INVOICE_NUM","transform":"none"},"ordered_on":{"source":"CREATION_DATE","transform":"none"},"status":{"source":"APPROVAL_STATUS","transform":"none"},"currency":{"source":"INVOICE_CURRENCY_CODE","transform":"none"},"erp_id":{"source":"ROWID","transform":"none"}}',
        endpoint_path_hint: '/OA_HTML/RF.jsp/purchase_order',
        response_root_hint: 'Response.Rows',
        pagination_style_hint: 'page',
        date_format_hint: 'dd-MMM-yyyy',
        verified: false,
        source_note: 'Guess from Oracle E-Business Suite interface-table column naming (UPPER_SNAKE_CASE). NOT confirmed against a real EBS instance.',
    },
})

Record({
    $id: Now.ID['tmpl-oracle-ebs-requisition'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'oracle_ebs',
        logical_object: 'requisition',
        field_map: '{"amount":{"source":"INVOICE_AMOUNT","transform":"none"},"department":{"source":"ORG_ID","transform":"none"},"requester":{"source":"PREPARER_ID","transform":"none"},"number":{"source":"INVOICE_NUM","transform":"none"},"opened_on":{"source":"CREATION_DATE","transform":"none"},"status":{"source":"APPROVAL_STATUS","transform":"none"},"currency":{"source":"INVOICE_CURRENCY_CODE","transform":"none"},"erp_id":{"source":"ROWID","transform":"none"}}',
        endpoint_path_hint: '/OA_HTML/RF.jsp/requisition',
        response_root_hint: 'Response.Rows',
        pagination_style_hint: 'page',
        date_format_hint: 'dd-MMM-yyyy',
        verified: false,
        source_note: 'Guess from Oracle E-Business Suite interface-table column naming (UPPER_SNAKE_CASE). NOT confirmed against a real EBS instance.',
    },
})

Record({
    $id: Now.ID['tmpl-dynamics-365-fo-balance'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'dynamics_365_fo',
        logical_object: 'balance',
        field_map: '{"amount":{"source":"AmountCur","transform":"none"},"account":{"source":"MainAccountId","transform":"none"},"account_code":{"source":"MainAccountId","transform":"none"},"account_name":{"source":"MainAccountName","transform":"none"},"as_of":{"source":"TransDate","transform":"none"},"currency":{"source":"CurrencyCode","transform":"none"},"erp_id":{"source":"RecId","transform":"none"}}',
        endpoint_path_hint: '/data/Balances',
        response_root_hint: 'value',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
        verified: false,
        source_note: 'Guess from Dynamics 365 Finance & Operations data-entity naming (/data/<Entity>, OData value envelope). NOT confirmed against a real D365 environment.',
    },
})

Record({
    $id: Now.ID['tmpl-dynamics-365-fo-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'dynamics_365_fo',
        logical_object: 'invoice',
        field_map: '{"amount":{"source":"AmountCur","transform":"none"},"customer":{"source":"CustomerAccount","transform":"none"},"customer_name":{"source":"OrganizationName","transform":"none"},"number":{"source":"InvoiceNumber","transform":"none"},"due_on":{"source":"DueDate","transform":"none"},"status":{"source":"InvoiceStatus","transform":"none"},"currency":{"source":"CurrencyCode","transform":"none"},"erp_id":{"source":"RecId","transform":"none"}}',
        endpoint_path_hint: '/data/Invoices',
        response_root_hint: 'value',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
        verified: false,
        source_note: 'Guess from Dynamics 365 Finance & Operations data-entity naming (/data/<Entity>, OData value envelope). NOT confirmed against a real D365 environment.',
    },
})

Record({
    $id: Now.ID['tmpl-dynamics-365-fo-vendor-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'dynamics_365_fo',
        logical_object: 'vendor_invoice',
        field_map: '{"amount":{"source":"AmountCur","transform":"none"},"vendor":{"source":"VendorAccount","transform":"none"},"number":{"source":"InvoiceNumber","transform":"none"},"due_on":{"source":"DueDate","transform":"none"},"status":{"source":"InvoiceStatus","transform":"none"},"currency":{"source":"CurrencyCode","transform":"none"},"erp_id":{"source":"RecId","transform":"none"}}',
        endpoint_path_hint: '/data/VendorInvoices',
        response_root_hint: 'value',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
        verified: false,
        source_note: 'Guess from Dynamics 365 Finance & Operations data-entity naming (/data/<Entity>, OData value envelope). NOT confirmed against a real D365 environment.',
    },
})

Record({
    $id: Now.ID['tmpl-dynamics-365-fo-gl-summary'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'dynamics_365_fo',
        logical_object: 'gl_summary',
        field_map: '{"revenue":{"source":"AmountCurCredit","transform":"none"},"expense":{"source":"AmountCurDebit","transform":"none"},"period":{"source":"FiscalPeriodName","transform":"none"},"period_end":{"source":"FiscalPeriodEndDate","transform":"none"},"currency":{"source":"CurrencyCode","transform":"none"},"erp_id":{"source":"RecId","transform":"none"}}',
        endpoint_path_hint: '/data/GlSummarys',
        response_root_hint: 'value',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
        verified: false,
        source_note: 'Guess from Dynamics 365 Finance & Operations data-entity naming (/data/<Entity>, OData value envelope). NOT confirmed against a real D365 environment.',
    },
})

Record({
    $id: Now.ID['tmpl-dynamics-365-fo-stock-item'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'dynamics_365_fo',
        logical_object: 'stock_item',
        field_map: '{"qty":{"source":"AvailablePhysical","transform":"none"},"safety_stock":{"source":"MinimumInventoryQuantity","transform":"none"},"location":{"source":"InventorySiteId","transform":"none"},"sku":{"source":"ItemNumber","transform":"none"},"name":{"source":"ProductName","transform":"none"},"erp_id":{"source":"RecId","transform":"none"}}',
        endpoint_path_hint: '/data/StockItems',
        response_root_hint: 'value',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
        verified: false,
        source_note: 'Guess from Dynamics 365 Finance & Operations data-entity naming (/data/<Entity>, OData value envelope). NOT confirmed against a real D365 environment.',
    },
})

Record({
    $id: Now.ID['tmpl-dynamics-365-fo-backorder'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'dynamics_365_fo',
        logical_object: 'backorder',
        field_map: '{"qty":{"source":"AvailablePhysical","transform":"none"},"location":{"source":"InventorySiteId","transform":"none"},"sku":{"source":"ItemNumber","transform":"none"},"name":{"source":"ProductName","transform":"none"},"promised_on":{"source":"ConfirmedShipDate","transform":"none"},"status":{"source":"InvoiceStatus","transform":"none"},"erp_id":{"source":"RecId","transform":"none"}}',
        endpoint_path_hint: '/data/Backorders',
        response_root_hint: 'value',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
        verified: false,
        source_note: 'Guess from Dynamics 365 Finance & Operations data-entity naming (/data/<Entity>, OData value envelope). NOT confirmed against a real D365 environment.',
    },
})

Record({
    $id: Now.ID['tmpl-unit4-balance'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'unit4',
        logical_object: 'balance',
        field_map: '{}',
        endpoint_path_hint: '',
        response_root_hint: '',
        pagination_style_hint: 'offset',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). All four previous hints were wrong: /api/v1/balance, a "data" response root and page/per_page pagination do not exist in the Unit4 ERPx ObjectAPI. Plumbing VERIFIED from the Unit4 Developer Portal: /v1/objects/<kebab-case-plural>, the body IS the array (empty response root), limit + offset. No Unit4 Enterprise Document was found that serves a balance directly -- supply the endpoint by hand. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-unit4-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'unit4',
        logical_object: 'invoice',
        field_map: '{}',
        endpoint_path_hint: '/v1/objects/customer-invoices',
        response_root_hint: '',
        pagination_style_hint: 'offset',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). Endpoint VERIFIED on the Unit4 Developer Portal (Accounting > Customer Invoices). Note kebab-case, not camelCase. The body IS the array, so response_root stays empty; limit + offset match the connector byte for byte. Set query_template to companyId=<your company> -- most ObjectAPI endpoints scope by it. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-unit4-vendor-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'unit4',
        logical_object: 'vendor_invoice',
        field_map: '{}',
        endpoint_path_hint: '/v1/objects/supplier-invoices',
        response_root_hint: '',
        pagination_style_hint: 'offset',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). Endpoint VERIFIED on the Unit4 Developer Portal (Accounting > Supplier Invoices). Note kebab-case, not camelCase. The body IS the array, so response_root stays empty; limit + offset match the connector byte for byte. Set query_template to companyId=<your company>. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-unit4-gl-summary'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'unit4',
        logical_object: 'gl_summary',
        field_map: '{}',
        endpoint_path_hint: '/v1/objects/general-ledger-transactions',
        response_root_hint: '',
        pagination_style_hint: 'offset',
        date_format_hint: '',
        verified: false,
        source_note: 'CORRECTED 2026-08-16 (OD37). Endpoint VERIFIED on the Unit4 Developer Portal; a /v2/objects/general-ledger-transactions also exists, so check which your tenant serves. MANDATORY: requires at least one of registered=true / posted=true / historical=true or it returns HTTP 400 (error 1020). Put it in query_template, e.g. posted=true&companyId=<your company> -- without it every sync of this object fails. Field names were unverified guesses and have been removed.',
    },
})

Record({
    $id: Now.ID['tmpl-netsuite-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'netsuite',
        logical_object: 'invoice',
        field_map: '{"amount":{"source":"total","transform":"none"},"customer":{"source":"entity","transform":"none"},"customer_name":{"source":"entityname","transform":"none"},"number":{"source":"tranid","transform":"none"},"due_on":{"source":"duedate","transform":"none"},"status":{"source":"status","transform":"none"},"currency":{"source":"currency","transform":"none"},"erp_id":{"source":"id","transform":"none"}}',
        endpoint_path_hint: '/services/rest/record/v1/invoice',
        response_root_hint: 'items',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
        verified: false,
        source_note: 'Single mechanism-proving row. NetSuite coverage is a DECLARED GAP -- see the L1 build report.',
    },
})

Record({
    $id: Now.ID['tmpl-infor-invoice'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'infor',
        logical_object: 'invoice',
        field_map: '{"amount":{"source":"InvoiceAmount","transform":"none"},"customer":{"source":"CustomerCode","transform":"none"},"customer_name":{"source":"CustomerName","transform":"none"},"number":{"source":"InvoiceNumber","transform":"none"},"due_on":{"source":"DueDate","transform":"none"},"status":{"source":"InvoiceStatus","transform":"none"},"currency":{"source":"CurrencyCode","transform":"none"},"erp_id":{"source":"RecordId","transform":"none"}}',
        endpoint_path_hint: '/IONAPI/erp/v1/invoices',
        response_root_hint: 'records',
        pagination_style_hint: 'cursor',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Single mechanism-proving row. Infor coverage is a DECLARED GAP -- see the L1 build report.',
    },
})

Record({
    $id: Now.ID['tmpl-workday-requisition'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'workday',
        logical_object: 'requisition',
        field_map: '{"amount":{"source":"totalAmount","transform":"none"},"department":{"source":"costCenter","transform":"none"},"requester":{"source":"requestedBy","transform":"none"},"number":{"source":"requisitionNumber","transform":"none"},"opened_on":{"source":"creationDate","transform":"none"},"status":{"source":"requisitionStatus","transform":"none"},"currency":{"source":"currency","transform":"none"},"erp_id":{"source":"id","transform":"none"}}',
        endpoint_path_hint: '/ccx/api/v1/requisitions',
        response_root_hint: 'data',
        pagination_style_hint: 'next_url',
        date_format_hint: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSZ',
        verified: false,
        source_note: 'Single mechanism-proving row. Workday coverage is a DECLARED GAP -- see the L1 build report.',
    },
})

Record({
    $id: Now.ID['tmpl-generic-rest-stock-item'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'generic_rest',
        logical_object: 'stock_item',
        field_map: '{"qty":{"source":"qty","transform":"none"},"safety_stock":{"source":"safety_stock","transform":"none"},"location":{"source":"location","transform":"none"},"sku":{"source":"sku","transform":"none"},"name":{"source":"name","transform":"none"},"erp_id":{"source":"erp_id","transform":"none"}}',
        endpoint_path_hint: '/stock_item',
        response_root_hint: 'result',
        pagination_style_hint: 'offset',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Identity mapping (qty -> qty). The escape hatch for an ERP that already speaks this contract, or a starting point an admin edits field by field.',
    },
})

Record({
    $id: Now.ID['tmpl-generic-odata-stock-item'],
    table: 'x_335329_sn_hr_erp_map_tmpl',
    data: {
        vendor: 'generic_odata',
        logical_object: 'stock_item',
        field_map: '{"qty":{"source":"qty","transform":"none"},"safety_stock":{"source":"safety_stock","transform":"none"},"location":{"source":"location","transform":"none"},"sku":{"source":"sku","transform":"none"},"name":{"source":"name","transform":"none"},"erp_id":{"source":"erp_id","transform":"none"}}',
        endpoint_path_hint: '/stock_item',
        response_root_hint: 'value',
        pagination_style_hint: 'odata_skiptop',
        date_format_hint: 'yyyy-MM-dd',
        verified: false,
        source_note: 'Identity mapping (qty -> qty). The escape hatch for an ERP that already speaks this contract, or a starting point an admin edits field by field.',
    },
})

