import { GlideAggregate, GlideDateTime, GlideRecord, gs } from '@servicenow/glide'

/**
 * L3-14. The retention cleaner. docs/l3-staging-design.md §6, OD1 / L3-D5.
 *
 * A SCOPED ScheduledScript, NOT `sys_auto_flush` (L3-D6). Table Cleanup is genuinely the
 * native mechanism and would normally win the ponytail ladder outright. It loses here for four
 * reasons, the first being decisive: `sys_auto_flush` rows live in GLOBAL SCOPE, and this app
 * otherwise creates zero Global records. Spending that on a cleaner is a poor trade in an app
 * whose governance note tells reviewers to scrutinise Global usage. Second: its "Age in
 * seconds" is a number in a Global record rather than this app's governance-approved property,
 * and two sources of truth for a data-protection decision is exactly the wrong number.
 *
 * NOTHING HERE IS ARMED. The job ships `active: false` (story L3-5 AC2) and arming it is a
 * recorded human step.
 *
 * TWO GUARDS THE WINDOW DOES NOT GET TO OVERRIDE (§6.2):
 *
 *  1. THE LATEST `sync_run` FOR A (system x object) IS NEVER DELETED, AT ANY AGE. If it goes,
 *     the tile loses its state and falls back to "not configured" — telling a user that a
 *     correctly-configured object was never set up. Built from ONE GlideAggregate max-per-group
 *     query, not from a query per group.
 *  2. NOTHING OUTSIDE `erp_staging` AND `sync_run` IS TOUCHED. Story L3-5 AC5. The only two
 *     table names in this file are those two; `document_request`, `document_template`,
 *     `document_type`, `employee_xref` and `sys_attachment` do not appear, and T3-18 counts
 *     their rows either side of a run.
 */

const T_STAGING = 'x_335329_sn_hr_erp_staging'
const T_SYNC_RUN = 'x_335329_sn_hr_erp_sync_run'

/** Chunked so one cycle cannot become a 300-second transaction. */
const CHUNK = 500

const PROP_BASE = 'x_335329_sn_hr_erp.staging_retention_days'
const PROP_SYNC_RUN = 'x_335329_sn_hr_erp.sync_run_retention_days'

/**
 * The per-category override property, or the base window when the override is empty.
 *
 * The two overrides ship EMPTY on purpose (§6.1): governance approves ONE number now, and
 * per-category tuning becomes an admin decision later with no redeploy. Publishing three
 * numbers for approval turns a data-protection sign-off into a debate about inventory.
 */
export function retentionDaysFor(category: string): number {
    const override = String(gs.getProperty('x_335329_sn_hr_erp.staging_retention_' + category + '_days', '') || '')
    const base = String(gs.getProperty(PROP_BASE, '90') || '90')
    const chosen = override.trim() === '' ? base : override
    const n = parseInt(chosen, 10)
    return isNaN(n) || n <= 0 ? 90 : n
}

/** `days` ago, as a platform datetime string. gs.nowDateTime() is not allowed in scoped apps. */
export function cutoff(days: number): string {
    const gdt = new GlideDateTime()
    gdt.addDaysUTC(-days)
    return gdt.getValue()
}

/**
 * Guard 1. `erp_system|logical_object` -> the `started` value of that pair's latest run.
 * ONE query, whatever the number of pairs.
 */
export function latestRunPerPair(): { [pair: string]: string } {
    const out: { [pair: string]: string } = {}
    const ga = new GlideAggregate(T_SYNC_RUN)
    ga.addAggregate('MAX', 'started')
    ga.groupBy('erp_system')
    ga.groupBy('logical_object')
    ga.query()
    while (ga.next()) {
        const key = String(ga.getValue('erp_system') || '') + '|' + String(ga.getValue('logical_object') || '')
        out[key] = String(ga.getAggregate('MAX', 'started') || '')
    }
    return out
}

export interface CleanerReport {
    stagingDeleted: number
    runsDeleted: number
    runsProtected: number
    categories: string[]
}

/**
 * One cleaning cycle. Called by the `RetentionCleaner` ScheduledScript, which ships DISARMED.
 *
 * Staged rows age out on `fetched_at`, NOT `sys_updated_on`: an unrelated edit must not extend
 * a row's life any more than it may reset its displayed age (story L3-4 AC5).
 */
export function runRetention(): CleanerReport {
    const report: CleanerReport = { stagingDeleted: 0, runsDeleted: 0, runsProtected: 0, categories: [] }
    const categories = ['finance', 'procurement', 'inventory', 'assets', 'manufacturing']

    for (let c = 0; c < categories.length; c++) {
        const category = categories[c]
        const before = cutoff(retentionDaysFor(category))
        report.categories.push(category + '=' + retentionDaysFor(category) + 'd')

        for (;;) {
            const gr = new GlideRecord(T_STAGING)
            gr.addQuery('erp_category', category)
            gr.addQuery('fetched_at', '<', before)
            gr.setLimit(CHUNK)
            gr.query()
            let n = 0
            while (gr.next()) {
                gr.deleteRecord()
                n++
            }
            report.stagingDeleted += n
            if (n < CHUNK) {
                break
            }
        }
    }

    // sync_run: a window DELIBERATELY longer than the longest staging window, by more than 2x.
    // Deleting the audit spine before the data it explains fails story L3-5 AC4.
    const runDays = parseInt(String(gs.getProperty(PROP_SYNC_RUN, '730') || '730'), 10)
    const runBefore = cutoff(isNaN(runDays) || runDays <= 0 ? 730 : runDays)
    const latest = latestRunPerPair()

    const runs = new GlideRecord(T_SYNC_RUN)
    runs.addQuery('started', '<', runBefore)
    runs.query()
    while (runs.next()) {
        const key = String(runs.getValue('erp_system') || '') + '|' + String(runs.getValue('logical_object') || '')
        // GUARD 1, applied per row against the in-memory map. Never a query inside this loop.
        if (latest[key] && latest[key] === String(runs.getValue('started') || '')) {
            report.runsProtected++
            continue
        }
        runs.deleteRecord()
        report.runsDeleted++
    }

    return report
}
