import { GlideRecord } from '@servicenow/glide'
import { countryOrder } from '../country.ts'

/**
 * NV-43 -- resolve the template for (document type, country, language).
 *
 * THE FALLBACK ORDER IS THE STORY, AND IT DELIBERATELY STOPS SHORT.
 *
 *   1. exact           (type, country, language)
 *   2. country, any language   (type, country, '')
 *   3. the country-agnostic default (type, '', '')  -- and NOTHING after that.
 *
 * There is no step 4. A template written for another country is NEVER used: the wrong legal
 * wording on an employment document is worse than no document, because a document that does not
 * exist is noticed and a document that cites the wrong jurisdiction's law is filed and relied on.
 * NV-43 AC3 fails the build that adds that step.
 *
 * A country-agnostic row is not "another country's row" -- it is a template written to be
 * jurisdiction-neutral, which is a deliberate authoring choice someone made. Step 3 is therefore
 * a real fallback and step 4 would not be.
 *
 * THE COUNTRY COMES FROM `emp_xref.payroll_country`, resolved from the ERP (NV-51 AC4). A
 * secondee's payroll jurisdiction and their ServiceNow user location are routinely different
 * places, and it is the payroll jurisdiction whose law the letter must cite.
 */

export interface ResolvedTemplate {
    ok: boolean
    templateSysId: string
    body: string
    /** The country actually resolved. '' means the country-agnostic default was used. */
    country: string
    language: string
    /** Replaces doc_type.required_fields when non-empty (NV-43 AC4). */
    requiredFieldsOverride: string
    /** Set when ok is false. Already safe to render. */
    message: string
}

function none(message: string): ResolvedTemplate {
    return {
        ok: false,
        templateSysId: '',
        body: '',
        country: '',
        language: '',
        requiredFieldsOverride: '',
        message: message,
    }
}

function lookup(typeSysId: string, country: string, language: string): ResolvedTemplate | null {
    const gr = new GlideRecord('x_335329_sn_hr_erp_doc_tmpl')
    gr.addQuery('document_type', typeSysId)
    gr.addQuery('country', country)
    gr.addQuery('language', language)
    gr.addQuery('active', true)
    gr.setLimit(1)
    gr.query()
    if (!gr.next()) {
        return null
    }
    return {
        ok: true,
        templateSysId: String(gr.getUniqueValue()),
        body: String(gr.getValue('body') || ''),
        country: country,
        language: language,
        requiredFieldsOverride: String(gr.getValue('required_fields_override') || ''),
        message: '',
    }
}

/**
 * `country` and `language` may both be blank -- an ERP that does not tell us the payroll country
 * resolves the agnostic template, which is honest: we did not fall back to a guess, there was
 * nothing to guess between.
 */
export function resolveTemplate(
    typeSysId: string,
    typeName: string,
    country: string,
    language: string,
): ResolvedTemplate {
    const l = String(language || '')

    // NV-51 AC3. The country half is `countryOrder()` -- the same rule the object map, the payroll
    // calendar and the approval policy use. Language is a second, narrower axis WITHIN a country:
    // an exact language match wins, and a template with no language applies to every language for
    // that country. There is still no step that reaches another country's row.
    const order = countryOrder(String(country || ''))
    for (let i = 0; i < order.length; i++) {
        if (l) {
            const exact = lookup(typeSysId, order[i], l)
            if (exact) {
                return exact
            }
        }
        const anyLanguage = lookup(typeSysId, order[i], '')
        if (anyLanguage) {
            return anyLanguage
        }
    }

    // NV-43 AC3's exact sentence. `notConfiguredFor()` is the generic form used by orderability
    // checks; a document request says which DOCUMENT is unavailable, which is what the employee
    // asked for.
    return none(
        country
            ? typeName + ' is not available for ' + country + ' yet.'
            : 'No active template exists for ' + typeName + '.',
    )
}

/** The payroll country for a subject employee, from the ERP link. Blank when unknown. */
export function payrollCountryOf(userSysId: string): string {
    const gr = new GlideRecord('x_335329_sn_hr_erp_emp_xref')
    gr.addQuery('user', userSysId)
    gr.addQuery('active', true)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? String(gr.getValue('payroll_country') || '') : ''
}
