import { GlideRecord } from '@servicenow/glide'

/**
 * NV-52 -- landscape discovery as a GATE, not a questionnaire.
 *
 * BRD §9 risk 3 is a fragmented HR/Finance estate discovered during the build. The failure it
 * describes is specific and expensive: catalog items published against an ERP that is not the
 * record of authority for that requirement area. Employees then file leave in a system that does
 * not hold their leave, and the finding arrives as a support queue rather than a scoping note.
 *
 * SO THE GATE IS ON PUBLICATION, NOT ON A WARNING BANNER. An area whose discovery is incomplete,
 * or whose authority is another system, publishes NOTHING. An empty HR Document Center is a
 * visible, answerable state; a partially-correct one is not (AC6).
 *
 * NOTHING HERE INVENTS A DEPLOYMENT'S ANSWER. The two ServiceNow-shipped products below are
 * FACTS about the platform, stated so a delivery lead can decide; the decision itself is theirs
 * and lives in the record.
 */

const T_DISCOVERY = 'x_335329_sn_hr_erp_landscape_discovery'

/** The ten requirement areas BRD §6 defines. D1-D10 are documents, not areas, and are not gated here. */
export const REQUIREMENT_AREAS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10']

export interface AreaDecision {
    /** False => publish nothing for this area. */
    allowed: boolean
    /** Rendered on the control tower. Always says WHY, and names the system where one is named. */
    reason: string
}

function row(systemId: string, area: string): GlideRecord<'x_335329_sn_hr_erp_landscape_discovery'> | null {
    const gr = new GlideRecord(T_DISCOVERY)
    gr.addQuery('erp_system', systemId)
    gr.addQuery('requirement_area', area)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? gr : null
}

/**
 * May the catalog items for this requirement area be published?
 *
 * Four refusals, each with its own sentence, because they need four different actions from four
 * different people: finish the discovery, name the system, re-scope, or proceed.
 */
export function publicationAllowed(systemId: string, area: string): AreaDecision {
    const gr = row(systemId, area)
    if (!gr) {
        return {
            allowed: false,
            reason: 'Landscape discovery is not complete for ' + area + ' -- nothing is published for this area.',
        }
    }
    const authority = String(gr.getValue('authority') || '')
    if (!authority) {
        // Belt and braces: the column is mandatory, and a blank must still refuse rather than read
        // as "the core ERP, presumably".
        return {
            allowed: false,
            reason: 'No system of authority recorded for ' + area + ' -- nothing is published for this area.',
        }
    }
    if (authority === 'core_erp') {
        return { allowed: true, reason: '' }
    }
    if (authority === 'none_identified') {
        return {
            allowed: false,
            reason:
                area +
                ' has no identified system of authority. Publishing against the configured ERP would point employees at a system that does not hold this data.',
        }
    }
    const named = String(gr.getValue('authority_system_name') || '')
    return {
        allowed: false,
        reason:
            area +
            ' is out of scope -- authority is ' +
            (named || 'another system that has not been named') +
            '.',
    }
}

export interface DiscoveryStatus {
    complete: boolean
    /** The areas still unanswered. Empty when complete. */
    missing: string[]
    /** BRD §4.2. Set when more than one authoritative system appears across the ten areas. */
    multiSystem: boolean
    message: string
}

/**
 * Is the deployment's discovery complete, and does it describe a landscape this product's scope
 * boundary actually covers?
 *
 * MULTI-ERP ORCHESTRATION IS OUT OF BRD SCOPE (§4.2). Finding two authoritative systems is not a
 * build instruction — it raises a scoping decision, and saying so is more useful than quietly
 * building half a solution for each.
 */
export function discoveryStatus(systemId: string): DiscoveryStatus {
    const missing: string[] = []
    const systems: string[] = []

    for (let i = 0; i < REQUIREMENT_AREAS.length; i++) {
        const gr = row(systemId, REQUIREMENT_AREAS[i])
        if (!gr || !String(gr.getValue('authority') || '')) {
            missing.push(REQUIREMENT_AREAS[i])
            continue
        }
        const authority = String(gr.getValue('authority'))
        if (authority === 'core_erp' || authority === 'none_identified') {
            continue
        }
        const named = String(gr.getValue('authority_system_name') || authority)
        if (systems.indexOf(named) === -1) {
            systems.push(named)
        }
    }

    if (missing.length > 0) {
        return {
            complete: false,
            missing: missing,
            multiSystem: false,
            message:
                'Landscape discovery is incomplete: ' +
                missing.join(', ') +
                '. No catalog item is published for this deployment until every area is answered.',
        }
    }
    if (systems.length > 1) {
        return {
            complete: true,
            missing: [],
            multiSystem: true,
            message: 'Multi-system landscape -- out of the current scope boundary (BRD §4.2). Systems named: ' + systems.join(', ') + '.',
        }
    }
    return { complete: true, missing: [], multiSystem: false, message: '' }
}

/**
 * NV-47's gate. R10 must record whether the organisation already runs a native ERP timesheet
 * workflow before a ServiceNow timesheet is built.
 *
 * `not_answered` BLOCKS. That is the whole mechanism: BRD R10 warns this area frequently
 * duplicates capability the organisation already has, and a three-state answer is what keeps
 * "nobody asked" from reading as "no".
 */
export function timesheetBuildAllowed(systemId: string): AreaDecision {
    const gr = row(systemId, 'R10')
    if (!gr) {
        return {
            allowed: false,
            reason: 'R10 landscape discovery has not been recorded -- the timesheet build is blocked (NV-47 AC8).',
        }
    }
    const answer = String(gr.getValue('native_timesheet_workflow') || 'not_answered')
    if (answer === 'not_answered') {
        return {
            allowed: false,
            reason:
                'R10 discovery does not say whether a native ERP timesheet workflow is already in use -- the timesheet build is blocked until it does (BRD R10).',
        }
    }
    if (answer === 'yes') {
        return {
            allowed: false,
            reason:
                'The organisation already runs a native ERP timesheet workflow. Building R10 here would duplicate it (BRD R10).',
        }
    }
    return publicationAllowed(systemId, 'R10')
}

/**
 * NV-52's build-vs-buy AC: both ServiceNow-shipped overlaps must be assessed, with a citation.
 *
 * `not_assessed` on either one means the question was never asked, which is the finding this AC
 * exists to prevent — committing to a custom build without recording why the shipped product was
 * not used.
 */
export function buildVsBuyAssessed(systemId: string): AreaDecision {
    const gr = row(systemId, 'R1')
    if (!gr) {
        return { allowed: false, reason: 'No landscape discovery record exists for this deployment.' }
    }
    const zero = String(gr.getValue('zero_copy_connector') || 'not_assessed')
    const hrsd = String(gr.getValue('hrsd_advanced_integration') || 'not_assessed')
    const note = String(gr.getValue('build_vs_buy_note') || '')

    if (zero === 'not_assessed' || hrsd === 'not_assessed') {
        return {
            allowed: false,
            reason:
                'Build-vs-buy is not assessed. Zero Copy Connector for ERP (SAP ECC / S4HANA only through the Australia release) and HRSD Advanced Integration (Workday / Oracle HCM / SuccessFactors) both overlap this scope and must each be adopted, rejected or ruled not applicable.',
        }
    }
    if (!note) {
        return { allowed: false, reason: 'Build-vs-buy decisions carry no citation. A decision with no citation is a preference.' }
    }
    return { allowed: true, reason: '' }
}
