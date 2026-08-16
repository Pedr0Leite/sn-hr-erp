import { gs, GlideRecord } from '@servicenow/glide'
import { isTrue } from '../util/bool.ts'

// L1-13. The two form annotations of §5.4 and §5.5, story L1-4 AC6/AC8 and story L1-3 AC7.
//
// A `display` business rule, not a cached column and not a UI Policy. §5.4: the banner is
// "derived at render time, never cached" -- so clearing the verified flag restores it
// immediately (AC8) with nothing to invalidate.
//
// Both messages are deliberately blunt. §7's whole discipline is that the app never lets a
// figure look more trustworthy than it is, and an unverified vendor template is the single
// largest source of quietly-wrong figures in this application.

export function annotateObjectMap(current: any): void {
    const source = String(current.getValue('mapping_source') || '')
    const verified = isTrue(current.getValue('mapping_verified'))

    // §5.4 / AC6. An applied template that nobody has confirmed against a real endpoint.
    if (source === 'template' && !verified) {
        const system = new GlideRecord('x_335329_sn_hr_erp_erp_system')
        const vendor = system.get(String(current.getValue('erp_system') || ''))
            ? String(system.getValue('vendor'))
            : 'this vendor'
        gs.addInfoMessage(
            'Unverified default mapping — this is a guess about ' +
                vendor +
                "'s API. Confirm it against a real endpoint before trusting these figures.",
        )
    }

    // §5.5 / story L1-3 AC7. An active map with no child rows SURFACES, it does not refuse.
    // Refusing would make the natural order -- create the map, then add rows to it --
    // impossible, and would push admins to active=false-then-forget. The story's actual
    // prohibition is SILENTLY returning empty rows at L3, and L3 records `not_configured`
    // with the object named rather than `success, rows_fetched = 0`.
    if (isTrue(current.getValue('active')) && !current.isNewRecord()) {
        const kids = new GlideRecord('x_335329_sn_hr_erp_field_map')
        kids.addQuery('object_map', current.getUniqueValue())
        kids.setLimit(1)
        kids.query()
        if (!kids.hasNext()) {
            gs.addErrorMessage('No field mapping — this object will return no usable rows.')
        }
    }
}
