import { Table, StringColumn, ChoiceColumn, ReferenceColumn, BooleanColumn } from '@servicenow/sdk/core'
import { LOGICAL_FIELD_CHOICES, OBJECT_CHOICES } from './choices'

// L1-7. field_map -- ONE ROW PER MAPPED FIELD. This table is the whole of OD4's answer. §4.2.
//
// The admin experience, end to end, with no JSON brace typed (T1-11 / story L1-3 AC5):
//   1. Open the object_map record.
//   2. Related list "Field Mappings".
//   3. New -> pick logical_field -> type source_field -> optional transform -> Submit.
//   4. Or copy a whole set from a vendor template with the "Apply vendor defaults" UI Action.

export const x_335329_sn_hr_erp_field_map = Table({
    name: 'x_335329_sn_hr_erp_field_map',
    label: 'Field Mapping',
    display: 'logical_field',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        object_map: ReferenceColumn({
            label: 'Object mapping',
            referenceTable: 'x_335329_sn_hr_erp_object_map',
            mandatory: true,
            cascadeRule: 'delete',
        }),
        logical_field: ChoiceColumn({
            label: 'Logical field',
            mandatory: true,
            dropdown: 'none',
            choices: LOGICAL_FIELD_CHOICES,
            hint: 'Must be a field of the parent map\'s logical object. Enforced by business rule on every path, including the Table API.',
        }),
        // Denormalised from the parent, set by the before business rule. It exists so the
        // list view of ~90 rows is readable and so the rejection message can name the object
        // (T1-12's verbatim wording). It is NOT admin-entered.
        logical_object: ChoiceColumn({
            label: 'Logical object',
            readOnly: true,
            dropdown: 'none',
            choices: OBJECT_CHOICES,
            hint: 'Copied from the parent object mapping. Derived, not entered.',
        }),
        source_field: StringColumn({
            label: 'Source field',
            maxLength: 200,
            mandatory: true,
            hint: 'The ERP\'s own field name, e.g. MENGE or QuantityOnHand. Dotted paths permitted for nested JSON.',
        }),
        transform: ChoiceColumn({
            label: 'Transform',
            default: 'none',
            dropdown: 'none',
            choices: {
                none: 'None',
                trim: 'Trim whitespace',
                upper: 'Uppercase',
                lower: 'Lowercase',
                abs: 'Absolute value',
                negate: 'Negate',
                percent_to_ratio: 'Percent to ratio (85 -> 0.85)',
                ratio_to_percent: 'Ratio to percent (0.85 -> 85)',
                date_only: 'Date only (drop time)',
            },
        }),
        // §4.4. LOAD-BEARING FOR L6. Story L6-4: a figure arriving as '', null or 0 is
        // treated as UNAVAILABLE unless the mapping explicitly declares zero meaningful for
        // that field. A 0 on stock_item.qty means the shelf is empty and is meaningful; a 0
        // on payroll_record.annual_gross_salary means the call went wrong and must fail the
        // document. Default false is the safe direction -- an unset flag produces a loud
        // failure rather than a mortgage application with a zero on it.
        zero_is_meaningful: BooleanColumn({
            label: 'Zero is meaningful',
            default: false,
            hint: 'When false, a 0 / empty / null value from the ERP is treated as UNAVAILABLE, not as zero (story L6-4).',
        }),
        note: StringColumn({
            label: 'Note',
            maxLength: 255,
            hint: 'e.g. "confirmed against SAP sandbox 2026-08".',
        }),
    },
    index: [
        {
            name: 'idx_field_map_map_field',
            unique: true,
            element: ['object_map', 'logical_field'],
        },
    ],
})
