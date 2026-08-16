import { Table, StringColumn, ChoiceColumn, BooleanColumn, JsonColumn } from '@servicenow/sdk/core'
import { OBJECT_CHOICES, VENDOR_CHOICES } from './choices'

// L1-10. mapping_template -- seeded vendor defaults, keyed on (vendor, logical_object). §5.
//
// Physical name is x_335329_sn_hr_erp_map_tmpl, NOT mapping_template: the SDK enforces a
// 30-character table-name limit and the scope prefix eats 19 of them (D13, C4). Canonical
// names come from docs/l0-scaffold-design.md §2.2, never from docs/stories.md.
//
// field_map is a JsonColumn HERE and only here (§5.1). It is a SEED PAYLOAD, never read at
// call time -- the apply action expands it into field_map rows and the connector only ever
// sees rows. OD4's prohibition is about the editing experience for live config; it does not
// reach data-at-rest an admin never hand-edits.

export const x_335329_sn_hr_erp_map_tmpl = Table({
    name: 'x_335329_sn_hr_erp_map_tmpl',
    label: 'Mapping Template',
    display: 'logical_object',
    audit: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        vendor: ChoiceColumn({
            label: 'Vendor',
            mandatory: true,
            dropdown: 'none',
            choices: VENDOR_CHOICES,
        }),
        logical_object: ChoiceColumn({
            label: 'Logical object',
            mandatory: true,
            dropdown: 'none',
            choices: OBJECT_CHOICES,
        }),
        field_map: JsonColumn({
            label: 'Field map',
            hint: 'Seed payload: {"<logical_field>":{"source":"<ERP field>","transform":"none"}}. Expanded into field_map rows by the apply action. Never read at call time.',
        }),
        endpoint_path_hint: StringColumn({ label: 'Endpoint path hint', maxLength: 255 }),
        response_root_hint: StringColumn({ label: 'Response root hint', maxLength: 255 }),
        pagination_style_hint: ChoiceColumn({
            label: 'Pagination style hint',
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
        date_format_hint: StringColumn({ label: 'Date format hint', maxLength: 40 }),
        // Story L1-4 AC3: ZERO rows have verified=true after deploy. Every shipped default
        // mapping is a guess about someone else's API (spec §5.2).
        verified: BooleanColumn({
            label: 'Verified',
            default: false,
            hint: 'False on every shipped row. Set true only after confirming against a real endpoint.',
        }),
        source_note: StringColumn({ label: 'Source note', maxLength: 500 }),
    },
    index: [
        {
            name: 'idx_map_tmpl_vendor_object',
            unique: true,
            element: ['vendor', 'logical_object'],
        },
    ],
})
