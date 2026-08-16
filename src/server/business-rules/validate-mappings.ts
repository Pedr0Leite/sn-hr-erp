import { gs, GlideRecord } from '@servicenow/glide'
import { isLogicalField, LOGICAL_OBJECTS } from '../contract/objects.ts'

// L1-8 and the object_map uniqueness message. Tests T1-9 and T1-12.

/**
 * `before` insert/update on object_map.
 *
 * Story L1-3 AC3 / T1-9: inserting a duplicate (erp_system, logical_object) is refused AND
 * "the refusal message names both values". The unique index idx_object_map_system_object
 * already refuses the write, but the platform's index-violation text names the index, not
 * the pair -- an admin reading it learns nothing about which mapping already exists. So the
 * index stays (it is the real constraint, and it holds against paths this rule never sees)
 * and this rule exists only to produce the readable message ahead of it.
 */
export function validateObjectMap(current: any): void {
    var system = current.getValue('erp_system')
    var logicalObject = current.getValue('logical_object')

    if (!system || !logicalObject) {
        return // mandatory-field enforcement is the dictionary's job, not this rule's
    }

    var dup = new GlideRecord('x_335329_sn_hr_erp_object_map')
    dup.addQuery('erp_system', system)
    dup.addQuery('logical_object', logicalObject)
    if (!current.isNewRecord()) {
        dup.addQuery('sys_id', '!=', current.getUniqueValue())
    }
    dup.setLimit(1)
    dup.query()

    if (dup.next()) {
        // Name BOTH values, and name the system by its display name rather than its sys_id:
        // a 32-character hex string is not something an admin can act on.
        var systemGr = new GlideRecord('x_335329_sn_hr_erp_erp_system')
        var systemName = systemGr.get(system) ? systemGr.getValue('name') : system
        gs.addErrorMessage(
            "An object mapping already exists for ERP system '" +
                systemName +
                "' and logical object '" +
                logicalObject +
                "'.",
        )
        current.setAbortAction(true)
    }
}

/**
 * `before` insert/update on field_map.
 *
 * Two jobs:
 *
 * 1. Reject a logical_field that is not in the parent object's contract, with the verbatim
 *    message story L1-3 AC6 specifies. THE CHOICE LIST IS NOT SUFFICIENT: T1-12 posts
 *    `logical_field = 'nonsense'` through the Table API, which does not evaluate a choice
 *    list at all. It also is not sufficient in the UI -- L1-D8 records that
 *    LOGICAL_FIELD_CHOICES is a flat list of every field across all 16 objects, because the
 *    platform's dependent-choice mechanism filters on a field of the SAME record and a new
 *    field_map row does not know its parent's logical_object until it is saved. So the
 *    dropdown offers `annual_gross_salary` on a `stock_item` map, and this rule is what
 *    stops it landing.
 *
 * 2. Denormalise the parent's logical_object onto the child, so the list view of ~90 rows is
 *    readable and so the message above can name the object. Derived, never admin-entered --
 *    the column is readOnly on the dictionary.
 */
export function validateFieldMap(current: any): void {
    var parentId = current.getValue('object_map')
    var field = String(current.getValue('logical_field') || '')

    if (!parentId) {
        return
    }

    var parent = new GlideRecord('x_335329_sn_hr_erp_object_map')
    if (!parent.get(parentId)) {
        gs.addErrorMessage('The parent object mapping no longer exists.')
        current.setAbortAction(true)
        return
    }

    var logicalObject = String(parent.getValue('logical_object') || '')
    current.setValue('logical_object', logicalObject)

    if (!isLogicalField(logicalObject, field)) {
        gs.addErrorMessage(
            "Unknown logical field '" + field + "' for object '" + logicalObject + "'.",
        )
        current.setAbortAction(true)
    }
}

/**
 * Exported for the "Apply vendor defaults" path and for any future caller that needs the
 * contract at runtime without importing the whole module graph.
 */
export function contractFieldsFor(logicalObject: string): string[] {
    var def = LOGICAL_OBJECTS[logicalObject]
    return def ? def.fields : []
}
