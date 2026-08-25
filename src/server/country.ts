/**
 * NV-51 -- THE country-resolution rule.
 *
 * THIS FILE IMPORTS NOTHING, DELIBERATELY. `config-loader` needs the rule, the dispatcher needs
 * `config-loader`, and the mismatch check needs the dispatcher's assignment-group resolver -- so
 * putting the check in here would close a cycle (country -> dispatcher -> config-loader ->
 * country) that a bundler resolves to `undefined` at module-init time rather than to an error.
 * The side-effecting half lives in `write/country-check.ts`. One definition, used by all five country-aware tables.
 *
 * NV-51 AC3 is explicit that `object_map`, `field_map`, `payroll_calendar`, `doc_tmpl` and
 * `write_approval_policy` must resolve by the SAME rule, and that three different fallback rules
 * fail the story. Before this file there were three: the approval policy did an exact match after
 * a fix, the template resolver had its own three-step ladder, and the payroll calendar did an
 * exact match with no fallback at all. Each was defensible alone; together they meant "what does
 * this app do for a country it has no row for?" had three answers.
 *
 * THE RULE, IN FULL:
 *
 *   1. the row whose `country` equals the employee's payroll country
 *   2. the row whose `country` is blank -- the deliberate, jurisdiction-neutral default
 *   3. nothing. NOT another country's row, ever.
 *
 * Step 3 is the substance. A configuration written for another jurisdiction is not a fallback, it
 * is a wrong answer wearing the shape of a right one: the wrong legal wording on a certificate,
 * the wrong cut-off on a pay run, the wrong approver on a banking change. An item with no
 * configuration for the employee's country is NOT ORDERABLE and says so.
 */

/**
 * The countries to try, in order. Never longer than two entries, and the last is always the
 * agnostic default.
 *
 * `''` in, `['']` out: an employee whose payroll country the ERP did not give us resolves the
 * agnostic row and nothing else. That is not a fallback from a known country -- there was no
 * country to fall back from, which is a different and honest situation.
 */
export function countryOrder(country: string): string[] {
    const c = String(country || '')
    return c ? [c, ''] : ['']
}

/** Rendered when neither the country row nor the agnostic row exists (NV-51 AC5). */
export function notConfiguredFor(country: string, what: string): string {
    return country
        ? 'Not configured for ' + country + ' -- no ' + what + ' exists for this country or as a default.'
        : 'Not configured -- no ' + what + ' exists.'
}
