import { Table, StringColumn, ChoiceColumn, ReferenceColumn, BooleanColumn, IntegerColumn } from '@servicenow/sdk/core'
import { OBJECT_CHOICES } from './choices'

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
        endpoint_path: StringColumn({ label: 'Endpoint path', maxLength: 255, mandatory: true }),
        http_method: ChoiceColumn({
            label: 'HTTP method',
            default: 'get',
            dropdown: 'none',
            choices: { get: 'GET', post: 'POST' },
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
            element: ['erp_system', 'logical_object'],
        },
    ],
})
