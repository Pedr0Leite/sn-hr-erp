import { Table, StringColumn, ChoiceColumn, ReferenceColumn, BooleanColumn, IntegerColumn } from '@servicenow/sdk/core'
import { OBJECT_CHOICES, IDEMPOTENCY_MODE_CHOICES, WRITE_OPERATION_CHOICES } from './choices'

// L1-6. object_map -- one row per (system x logical object). §4.1.
//
// THERE IS NO `field_map` COLUMN. OD4 deleted it entirely, and a generated JSON mirror was
// rejected: two representations of one truth make a wrong figure unattributable, which story
// L2-2's last criterion fails. Mapping rows are records in the child field_map table (§4.3).

export const x_335329_sn_hr_erp_object_map = Table({
    name: 'x_335329_sn_hr_erp_object_map',
    label: 'Object Mapping',
    display: 'logical_object',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        erp_system: ReferenceColumn({
            label: 'ERP system',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
            mandatory: true,
            cascadeRule: 'restrict',
        }),
        logical_object: ChoiceColumn({
            label: 'Logical object',
            mandatory: true,
            dropdown: 'none',
            choices: OBJECT_CHOICES,
            hint: 'ADD, NEVER RENAME. A renamed value orphans call_log telemetry, sync_run history and every field_map row keyed on it (story L1-1 AC6).',
        }),
        // ---- OD51 -------------------------------------------------------------------------
        // THE OPERATION QUALIFIER. A read and a write of the same logical object are DIFFERENT
        // endpoints with DIFFERENT verbs, and before this column existed they had to share one
        // row: `employee_profile` was `get` because the prefill and the read-back need it, so
        // every banking update dispatched as a GET with the body dropped and the read response's
        // `id` mistaken for an acknowledgement. The write was reported `confirmed` having never
        // been sent.
        //
        // Blank means `read`, so every map configured before this column exists keeps working.
        operation: ChoiceColumn({
            label: 'Operation',
            default: 'read',
            dropdown: 'none',
            choices: WRITE_OPERATION_CHOICES,
            hint: 'Which direction this map serves. A write needs its OWN row: the same object is read from one endpoint and written to another, with a different verb. Blank is treated as read.',
        }),
        // NV-51. Blank = the jurisdiction-neutral default. Resolution is `country.ts`'s rule and
        // NOTHING ELSE: this country's row, then the blank row, then not configured. A row written
        // for another country is never reached.
        country: StringColumn({
            label: 'Country',
            maxLength: 2,
            hint: 'ISO-3166 alpha-2, resolved from the ERP record (emp_xref.payroll_country), never from the ServiceNow user. Blank = applies to every country that has no row of its own.',
        }),
        endpoint_path: StringColumn({ label: 'Endpoint path', maxLength: 255, mandatory: true }),
        // NV-3 / NV-45. `patch` and `put` added for the write path (OD42).
        //
        // `delete` IS DELIBERATELY ABSENT AND MUST STAY ABSENT. TRD §5 requires offboarding to be
        // a status change, never a hard delete, so that payroll and audit history survive. A
        // choice list that cannot express DELETE makes the wrong binding UNSAVEABLE rather than
        // merely discouraged -- NV-45's AC is satisfied by the schema, not by a business rule
        // somebody can deactivate.
        http_method: ChoiceColumn({
            label: 'HTTP method',
            default: 'get',
            dropdown: 'none',
            choices: { get: 'GET', post: 'POST', patch: 'PATCH', put: 'PUT' },
        }),
        // ---- NV-4 --------------------------------------------------------------------------
        // Both ship blank. A create-capable map with no idempotency mechanism is REFUSED at save
        // rather than allowed through: shipping a create with no retry safety is exactly how the
        // duplicate employee reaches production.
        idempotency_mode: ChoiceColumn({
            label: 'Idempotency mode',
            default: 'none',
            dropdown: 'none',
            choices: IDEMPOTENCY_MODE_CHOICES,
        }),
        existence_check_path: StringColumn({
            label: 'Existence check path',
            maxLength: 255,
            hint: 'Endpoint that answers "does this record already exist?". Required when idempotency_mode is existence_check.',
        }),
        idempotency_header_name: StringColumn({
            label: 'Idempotency header',
            maxLength: 80,
            hint: 'Vendor-documented header name. Required when idempotency_mode is header -- never guessed (repo rule 5).',
        }),
        response_root: StringColumn({
            label: 'Response root',
            maxLength: 255,
            hint: 'Dotted path to the record array in the response body. Empty = the body is the array.',
        }),
        query_template: StringColumn({
            label: 'Query template',
            maxLength: 500,
            hint: 'Supports the {external_id} placeholder. Stored verbatim, never substituted at save time.',
        }),
        pagination_style: ChoiceColumn({
            label: 'Pagination style',
            default: 'none',
            dropdown: 'none',
            choices: {
                none: 'None',
                offset: 'Offset / limit',
                page: 'Page number',
                cursor: 'Cursor token',
                odata_skiptop: 'OData $skip / $top',
                next_url: 'Next URL in body',
            },
        }),
        page_size: IntegerColumn({ label: 'Page size', default: 100 }),
        date_format: StringColumn({
            label: 'Date format',
            maxLength: 40,
            hint: 'Per-ERP parse hint for date fields on this object.',
        }),
        deep_link_path: StringColumn({
            label: 'Deep link path',
            maxLength: 120,
            hint: 'Per-object path segment for row deep links. EMPTY MEANS NO LINK IS DRAWN -- never a broken link.',
        }),
        // L3/L4 addition (OD7 / L5-D6). NO DEFAULT, DELIBERATELY. 0.85 x 0.90 x 0.95 = 0.727
        // and 85 x 90 x 95 = 726,750 both look plausible, and inferring the scale from the
        // magnitude is a heuristic standing between an executive and a wrong OEE. Mandatory
        // only when the three OEE components are mapped and `oee` itself is not; unset in that
        // situation the Tab 5 tile renders `not_configured` NAMING THIS COLUMN.
        oee_input_scale: ChoiceColumn({
            label: 'OEE input scale',
            dropdown: 'none',
            choices: { ratio_0_1: 'Ratio (0-1)', percent_0_100: 'Percent (0-100)' },
            hint: 'The unit of availability / performance / quality on this ERP. No default: a guess here produces a silently wrong OEE.',
        }),
        // Both of the next two are set by the "Apply vendor defaults" action and are under
        // HARD DENY-WRITE (Shape A, adminOverrides: false). Nobody, admin included, may
        // hand-set a mapping to "verified" without having verified anything. §6.
        mapping_source: ChoiceColumn({
            label: 'Mapping source',
            readOnly: true,
            dropdown: 'none',
            choices: { manual: 'Manual', template: 'Vendor template' },
        }),
        mapping_verified: BooleanColumn({
            label: 'Mapping verified',
            default: false,
            readOnly: true,
            hint: 'Mirrors the applied template\'s verified flag. Drives the unverified-mapping banner.',
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    index: [
        {
            name: 'idx_object_map_system_object',
            unique: true,
            element: ['erp_system', 'logical_object', 'operation', 'country'],
        },
    ],
})
