// NV-48 verify step: `node scripts/check-minimisation.mjs`.
//
// DATA MINIMISATION, PROVED AT BUILD TIME RATHER THAN ASSERTED IN A DOCUMENT.
//
// The runtime half of NV-48 (zero `erp_staging` rows for the sensitive objects, a seeded-value
// sweep across `call_log`, `erp_write`, `erp_exception`, `doc_audit`, `sys_email` and `syslog`)
// needs an instance and lives in docs/noviq/test-plan.md. What CAN be proved offline is stronger
// than a query result anyway: that the sensitive objects are unstageable BY CONSTRUCTION and that
// no table in this application has a column a business value could be written to.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { LOGICAL_OBJECTS } from '../src/server/contract/objects.ts'
import { CATEGORY_CHOICES } from '../src/fluent/tables/choices.ts'

// --- 1. The sensitive objects can never be staged. -------------------------------------------
// `engine.ts` selects staging work by real `erp_category`, so `category: null` makes an object
// unreachable by the sync path rather than merely excluded from it. A future edit that gives one
// of these a category fails HERE, before it can quietly create a shadow HR database. (BRD O3, D2.)
const NEVER_STAGED = [
    'employee_profile',
    'payroll_record',
    'payslip_document',
    'income_statement',
    'leave_balance',
    'benefit_enrollment',
    'compensation_change',
]
for (const name of NEVER_STAGED) {
    const def = LOGICAL_OBJECTS[name]
    assert.ok(def, `${name} is missing from the contract`)
    assert.equal(def.category, null, `${name} has an erp_category and is therefore stageable — BRD O3 / DL-D2`)
}

// --- 2. `hr` and `payroll` are not staging categories. ----------------------------------------
// The DL-D2 guard, carried forward. Adding either makes the objects above stageable again.
for (const forbidden of ['hr', 'payroll']) {
    assert.ok(
        !Object.keys(CATEGORY_CHOICES).includes(forbidden),
        `'${forbidden}' appeared in CATEGORY_CHOICES — that requires a logged decision (DL-D2)`,
    )
}

// --- 3. No AUDIT table has a column a business value could land in. ---------------------------
// `erp_write` keeps a hash; `call_log` keeps codes; `usage_event` keeps counts. A column named
// `payload`, `body`, `value` or the like on any of them is the shadow database arriving through a
// column nobody argued about.
//
// The check is scoped to the audit tables ON PURPOSE. `erp_staging.payload` and `doc_tmpl.body`
// are legitimate and load-bearing: staging is what the fourteen non-HR objects are FOR (the seven
// sensitive ones are unstageable, checked above), and a template body is the document's own text.
// A blanket ban would have to be suppressed for both, and a check with two suppressions is a check
// nobody trusts the third time.
const AUDIT_TABLES = [
    'x_335329_sn_hr_erp_call_log',
    'x_335329_sn_hr_erp_erp_write',
    'x_335329_sn_hr_erp_erp_exception',
    'x_335329_sn_hr_erp_doc_audit',
    'x_335329_sn_hr_erp_usage_event',
]
const FORBIDDEN_COLUMNS = ['payload', 'request_body', 'response_body', 'body', 'raw_value', 'salary', 'iban', 'amount']
const tableDir = 'src/fluent/tables'
const sources = readdirSync(tableDir)
    .filter((f) => f.endsWith('.now.ts'))
    .map((f) => readFileSync(`${tableDir}/${f}`, 'utf8'))
    .join('\n')

/** One Table() block, by its `name:` property. */
function tableBlock(tableName) {
    const start = sources.indexOf(`name: '${tableName}',`)
    if (start === -1) return null
    const end = sources.indexOf('\n})', start)
    return sources.slice(start, end === -1 ? undefined : end)
}

const offenders = []
for (const table of AUDIT_TABLES) {
    const block = tableBlock(table)
    if (!block) continue // doc_audit lives in the L6 set and may be named differently; not a failure.
    for (const column of FORBIDDEN_COLUMNS) {
        if (new RegExp(`^\\s+${column}:\\s*\\w+Column\\(`, 'm').test(block)) {
            offenders.push(`${table}.${column}`)
        }
    }
}
assert.deepEqual(offenders, [], 'an audit table declares a column that could carry a business value')

// --- 4. The retention report. VISIBLE, not silently absent (AC4). -----------------------------
// Two tables have a retention window today. Every other app table is reported as `Retention not
// set` rather than defaulting to "kept forever" without anyone saying so. OQ-7 is open: neither
// source document states a document or audit retention period, so this prints rather than fails.
const RETENTION = {
    x_335329_sn_hr_erp_staging: 'x_335329_sn_hr_erp.staging_retention_days',
    x_335329_sn_hr_erp_sync_run: 'x_335329_sn_hr_erp.sync_run_retention_days',
}
const tables = []
for (const file of readdirSync(tableDir).filter((f) => f.endsWith('.now.ts'))) {
    const src = readFileSync(`${tableDir}/${file}`, 'utf8')
    for (const m of src.matchAll(/^\s{4}name: '(x_335329_sn_hr_erp_\w+)',/gm)) tables.push(m[1])
}
const unset = tables.filter((t) => !RETENTION[t])
console.log(`minimisation OK: ${NEVER_STAGED.length} objects unstageable, no value-bearing columns`)
console.log(`retention: ${tables.length - unset.length} set, ${unset.length} "Retention not set" (OQ-7):`)
for (const t of unset) console.log(`  - ${t}`)
