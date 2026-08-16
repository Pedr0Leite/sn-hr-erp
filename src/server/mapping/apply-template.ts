import { gs, GlideRecord } from '@servicenow/glide'

// L1-12. "Apply vendor defaults". docs/l1-control-tower-design.md §5.3, story L1-4, T1-17/18/21.
//
// THIS IS A UI ACTION, NEVER A BUSINESS RULE. Story L1-4 AC4 / test T1-17: inserting an
// object_map through the Table API and re-reading its children must show ZERO field_map rows.
// A business rule that populated them on insert would make every new map silently a guess,
// and would fail that test. The admin has to ask for the guess.
//
// OVERWRITE PROTECTION IS THE POINT (AC5 / T1-18). The sibling's field-sync pattern: skip
// anything already present, skip empty template sources, never blank an existing value.
// An action that silently overwrote an admin's hand-verified mapping would be worse than no
// action at all -- the admin would have no way to know their work had been replaced by a guess.
//
// BATCHED, NOT LOOPED (T1-21). Existing children are read in ONE query keyed by logical_field,
// not one query per template field. Query count is independent of how many fields the template
// carries.

interface TemplateEntry {
    source?: string
    transform?: string
}

/** Result of an apply run, so the UI Action and any future caller report identically. */
export interface ApplyResult {
    applied: number
    skipped: number
    message: string
    ok: boolean
}

export function applyVendorDefaults(objectMapId: string): ApplyResult {
    const map = new GlideRecord('x_335329_sn_hr_erp_object_map')
    if (!map.get(objectMapId)) {
        return { applied: 0, skipped: 0, ok: false, message: 'Object mapping not found.' }
    }

    const logicalObject = String(map.getValue('logical_object') || '')

    const system = new GlideRecord('x_335329_sn_hr_erp_erp_system')
    if (!system.get(String(map.getValue('erp_system') || ''))) {
        return { applied: 0, skipped: 0, ok: false, message: 'The parent ERP system no longer exists.' }
    }
    const vendor = String(system.getValue('vendor') || '')

    // 1. Find the template for this (vendor, logical object). No template is a normal,
    //    expected outcome for the five assets/manufacturing objects, which ship untemplated
    //    on purpose (L1-D5). Say so and stop -- do not invent one.
    const tmpl = new GlideRecord('x_335329_sn_hr_erp_map_tmpl')
    tmpl.addQuery('vendor', vendor)
    tmpl.addQuery('logical_object', logicalObject)
    tmpl.setLimit(1)
    tmpl.query()
    if (!tmpl.next()) {
        return {
            applied: 0,
            skipped: 0,
            ok: false,
            message:
                'No vendor default exists for ' + vendor + ' / ' + logicalObject + '. Map by hand.',
        }
    }

    let entries: { [field: string]: TemplateEntry } = {}
    try {
        const raw = tmpl.getValue('field_map')
        entries = raw ? JSON.parse(String(raw)) : {}
    } catch (e) {
        return {
            applied: 0,
            skipped: 0,
            ok: false,
            message: 'The vendor template for ' + vendor + ' / ' + logicalObject + ' is not readable.',
        }
    }

    // 2. ONE query for every existing child. Spec §9 "batch, never loop".
    const existing: { [field: string]: boolean } = {}
    const kids = new GlideRecord('x_335329_sn_hr_erp_field_map')
    kids.addQuery('object_map', objectMapId)
    kids.query()
    while (kids.next()) {
        existing[String(kids.getValue('logical_field'))] = true
    }

    // 3. Insert only what is genuinely missing.
    let applied = 0
    let skipped = 0
    const fields = Object.keys(entries)
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        if (existing[field]) {
            skipped++ // already edited by an admin -- their value wins, always
            continue
        }
        const entry = entries[field] || {}
        const source = entry.source ? String(entry.source) : ''
        if (!source) {
            continue // an empty template source must never blank or create anything
        }
        const row = new GlideRecord('x_335329_sn_hr_erp_field_map')
        row.initialize()
        row.setValue('object_map', objectMapId)
        row.setValue('logical_field', field)
        row.setValue('source_field', source)
        row.setValue('transform', entry.transform ? String(entry.transform) : 'none')
        row.setValue(
            'note',
            'From the ' + vendor + ' vendor template. Unverified until confirmed against a real endpoint.',
        )
        if (row.insert()) {
            applied++
        }
    }

    // 4. Copy the *_hint values ONLY where the target is still empty. A hint never overwrites
    //    something an admin typed.
    copyHintIfEmpty(map, 'endpoint_path', tmpl.getValue('endpoint_path_hint'))
    copyHintIfEmpty(map, 'response_root', tmpl.getValue('response_root_hint'))
    copyHintIfEmpty(map, 'pagination_style', tmpl.getValue('pagination_style_hint'))
    copyHintIfEmpty(map, 'date_format', tmpl.getValue('date_format_hint'))

    // 5. Provenance. Both columns carry a Shape A hard deny-write ACL (adminOverrides: false),
    //    so a human cannot type them. See docs/l1-build-report.md for the live result of this
    //    write -- whether a scoped GlideRecord update from a UI Action is itself subject to
    //    that ACL is a fact about the instance, not something to assume.
    map.setValue('mapping_source', 'template')
    map.setValue('mapping_verified', tmpl.getValue('verified'))
    map.update()

    return {
        applied: applied,
        skipped: skipped,
        ok: true,
        message:
            'Applied ' +
            applied +
            ' default mappings, skipped ' +
            skipped +
            ' already edited by an admin.',
    }
}

function copyHintIfEmpty(map: any, column: string, hint: unknown): void {
    const current = map.getValue(column)
    if (!current && hint) {
        map.setValue(column, String(hint))
    }
}

/** UI Action entry point. */
export function applyVendorDefaultsAction(current: any): void {
    const result = applyVendorDefaults(String(current.getUniqueValue()))
    if (result.ok) {
        gs.addInfoMessage(result.message)
    } else {
        gs.addErrorMessage(result.message)
    }
}
