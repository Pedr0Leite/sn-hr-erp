// NV-49 verify step: `node scripts/check-store-readiness.mjs`.
//
// The Store technical and security review criteria that can be checked from source, checked from
// source. NV-49 asks for certification to be "a checklist run rather than a rebuild"; a checklist
// that only runs at submission time is a rebuild with extra steps.
//
// Each rule below has already cost this repo something. Rule 3 is CLAUDE.md trap 3 (an
// `adminOverrides` left unset is a deny rule an admin walks through); rule 4 is trap 1 (a
// relative import without `.ts` builds clean, installs clean and is DEAD at runtime); rule 5 is
// repo rule 4 (a test driver shipped armed).
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'

function walk(dir) {
    const out = []
    for (const entry of readdirSync(dir)) {
        const path = `${dir}/${entry}`
        if (statSync(path).isDirectory()) out.push(...walk(path))
        else if (path.endsWith('.ts') || path.endsWith('.tsx')) out.push(path)
    }
    return out
}

const all = walk('src')
const fluent = all.filter((p) => p.endsWith('.now.ts'))
const server = all.filter((p) => p.startsWith('src/server/'))
const read = (p) => readFileSync(p, 'utf8')
const fail = []

// --- 1. No `var` in Fluent files (the SDK rejects it; catching it here is faster). ------------
for (const path of fluent) {
    if (/^\s*var\s+\w/m.test(read(path))) fail.push(`${path}: uses \`var\` in a Fluent file`)
}

// --- 2. No `gs.nowDateTime()` anywhere -- not allowed in a scoped app. ------------------------
for (const path of all) {
    const src = read(path)
    // A mention inside a comment explaining the ban is not a use.
    for (const line of src.split('\n')) {
        const t = line.trimStart()
        const isComment = t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')
        if (line.includes('gs.nowDateTime()') && !isComment) {
            fail.push(`${path}: calls gs.nowDateTime(), which scoped apps may not use`)
        }
    }
}

// --- 3. Every deny ACL sets `adminOverrides` EXPLICITLY (trap 3). -----------------------------
// The default is `true`, so a deny rule that omits it is silently admin-overridable -- and every
// admin-run test passes against it.
for (const path of fluent.filter((p) => p.includes('/security/'))) {
    const src = read(path)
    // Split on the Acl( constructor so each rule is checked on its own.
    const rules = src.split(/\bAcl\(/).slice(1)
    for (const rule of rules) {
        const block = rule.slice(0, rule.indexOf('\n})') === -1 ? rule.length : rule.indexOf('\n})'))
        if (/decisionType:\s*'deny'/.test(block) && !/adminOverrides:/.test(block)) {
            const name = (block.match(/name:\s*'([^']+)'/) || [])[1] || '(unnamed)'
            fail.push(`${path}: deny ACL '${name}' does not set adminOverrides (trap 3)`)
        }
    }
}

// --- 4. Every relative import under src/server/ carries `.ts` (trap 1, DL-D19). ---------------
for (const path of server) {
    for (const m of read(path).matchAll(/from\s+'(\.[^']+)'/g)) {
        if (!m[1].endsWith('.ts')) fail.push(`${path}: relative import '${m[1]}' has no .ts extension (trap 1)`)
    }
}

// --- 5. Every scheduled job ships disarmed: `active: false` AND `runType`/on-demand. ----------
// "Nothing happened" must be the designed default. A job shipping armed runs against a customer's
// production ERP the moment the app installs.
for (const path of fluent.filter((p) => p.includes('scheduled-scripts'))) {
    const src = read(path)
    const jobs = src.split(/\bScheduledScript\(/).slice(1)
    for (const job of jobs) {
        const block = job.slice(0, job.indexOf('\n})') === -1 ? job.length : job.indexOf('\n})'))
        const name = (block.match(/name:\s*'([^']+)'/) || [])[1] || '(unnamed)'
        if (!/active:\s*false/.test(block)) fail.push(`${path}: scheduled job '${name}' does not ship active: false`)
        if (!/on_demand/.test(block)) fail.push(`${path}: scheduled job '${name}' does not ship on_demand`)
    }
}

// --- 6. No `eval`. ---------------------------------------------------------------------------
for (const path of all) {
    if (/\beval\s*\(/.test(read(path))) fail.push(`${path}: uses eval()`)
}

// --- 7. No credential, token or secret in any app record (NV-49 AC2). ------------------------
// Credentials resolve through Connection & Credential Aliases; an `auth_profile_*` column holds a
// REFERENCE to one. A literal password, token or key in a seed would ship to every customer.
const SECRET_PATTERNS = [
    /\b(password|passwd|pwd)\s*[:=]\s*'[^']{3,}'/i,
    /\b(secret|api[_-]?key|access[_-]?token|bearer)\s*[:=]\s*'[^']{8,}'/i,
    /'(Bearer|Basic)\s+[A-Za-z0-9+/=._-]{16,}'/,
]
//
// ONE KNOWN BLOCKER, NAMED RATHER THAN SUPPRESSED (OD50). `l2-fixtures.now.ts` seeds a
// `sys_auth_profile_basic` record with a literal `postman`/`password` against the public
// postman-echo service. It is not a secret — the credentials are published by the service — but it
// IS a credential stored in an app record, which is what NV-49 AC2 forbids and what a Store
// reviewer will read it as. Deleting it would disarm the L2 gate driver this repo calls its
// highest-value unblock, so it is reported as a BLOCKER on every run instead of being silenced by
// a pattern-level exception. A suppression nobody sees is how it ships.
const KNOWN_BLOCKERS = ['src/fluent/data/l2-fixtures.now.ts']
const blockers = []
for (const path of all) {
    const src = read(path)
    for (const pattern of SECRET_PATTERNS) {
        const hit = src.match(pattern)
        if (!hit) continue
        const finding = `${path}: literal credential — ${hit[0].slice(0, 40)}`
        if (KNOWN_BLOCKERS.includes(path)) blockers.push(finding)
        else fail.push(finding)
    }
}

// --- 8. WRITE-PATH INTEGRITY. Two regressions that no other check can see. --------------------
//
// 8a. A `fetch()` carrying a body MUST also carry an operation (OD51). Without it the READ map is
// resolved, `rest-client` sends the read verb, the body is dropped by
// `if (verb !== 'get' && params.body)`, and `extractAck()` turns the read's own response into a
// false acknowledgement. The write is reported `confirmed` having never been sent — the worst
// outcome this application can produce, and it type-checks perfectly.
for (const path of server) {
    const src = read(path)
    for (const m of src.matchAll(/fetch\([^)]*\{[^}]*\}/gs)) {
        if (m[0].includes('body:') && !m[0].includes('operation:')) {
            fail.push(`${path}: fetch() passes a body with no operation — it will resolve the read map (OD51)`)
        }
    }
}

// 8b. Only `create-write.ts` may insert an `erp_write` row. Four modules used to have a private
// copy, and every one of them inserted with an EMPTY `idempotency_key` under a unique index on
// (erp_system, idempotency_key) — so the second queued write for a system collided with the first
// and reported "could not be queued" for a write nothing was wrong with.
for (const path of server) {
    const src = read(path)
    if (!src.includes("'x_335329_sn_hr_erp_erp_write'")) continue
    if (path.endsWith('create-write.ts')) continue
    // `initialize()` is the tell: reading and updating an existing row is fine, creating one is not.
    if (/\.initialize\(\)/.test(src) && /erp_write/.test(src)) {
        fail.push(`${path}: creates an erp_write row directly — use createWrite() so the idempotency key is set at insert`)
    }
}

// 8c. NV-51 AC3: ONE country fallback rule, not five. Any module that resolves a row by `country`
// must use `countryOrder()` from `country.ts`. The story fails explicitly on three different
// fallback rules, and before this check there were three — an exact match here, a three-step
// ladder there, and no fallback at all in the payroll calendar. Each was defensible alone; the set
// of them meant "what does this app do for a country it has no row for?" had three answers.
for (const path of server) {
    const src = read(path)
    if (path.endsWith('/country.ts')) continue
    if (src.includes("addQuery('country'") && !src.includes('countryOrder')) {
        fail.push(`${path}: resolves by country without countryOrder() — NV-51 AC3 allows one rule`)
    }
}

// --- Reported, not failed: instance-bound literal sys_ids. ------------------------------------
// Trap 12 bans INVENTING a sys_id. The ones below were observed on dev296062 and belong to
// fixtures and test drivers, so they are correct today and portable to nowhere. That is a
// portability finding for the evidence pack, not a build failure — and making it fail would mean
// adding a suppression list, which is how a check stops being read.
const instanceBound = []
for (const path of all.filter((p) => !p.includes('/generated/'))) {
    for (const [i, line] of read(path).split('\n').entries()) {
        const m = line.match(/'[0-9a-f]{32}'/)
        if (m) instanceBound.push(`${path}:${i + 1}`)
    }
}

if (fail.length) {
    for (const f of fail) console.error(`  ✗ ${f}`)
    assert.fail(`${fail.length} Store-readiness problem(s)`)
}
for (const b of blockers) console.error(`  ! CERTIFICATION BLOCKER (OD50): ${b}`)
console.log(`store-readiness OK: ${all.length} files, ${fluent.length} Fluent, ${server.length} server modules`)
console.log(`instance-bound sys_id literals (evidence pack, not a failure): ${instanceBound.length}`)
for (const location of instanceBound) console.log(`  - ${location}`)
