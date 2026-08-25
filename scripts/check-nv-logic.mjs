// NV-31..NV-40 verify step: `node scripts/check-nv-logic.mjs`.
//
// Covers the pure decision logic only -- the parts that decide whether an employee is shown a
// figure, whether a claim is refusable, and whether a field is sent to a payroll system. Anything
// touching GlideRecord is not testable off-instance and is covered by docs/noviq/test-plan.md.
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// `@servicenow/glide` is CommonJS and its classes only exist on an instance. Every module under
// test imports it at the top even where the function under test never touches it, so the import
// is redirected to a stub that throws on USE. A test that accidentally exercises a Glide path
// therefore fails loudly instead of passing against a fake platform.
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '@servicenow/glide' || specifier.indexOf('@servicenow/glide/') === 0) {
            return { url: 'data:text/javascript,' + encodeURIComponent(STUB), shortCircuit: true }
        }
        return next(specifier, context)
    },
})

const STUB = [
    'const die = (name) => { throw new Error(name + ' + JSON.stringify(' is only available on an instance') + ') }',
    'export class GlideRecord { constructor() { die("GlideRecord") } }',
    'export class GlideDateTime { constructor() { die("GlideDateTime") } }',
    'export class GlideSysAttachment { constructor() { die("GlideSysAttachment") } }',
    'export class GlideTextReader { constructor() { die("GlideTextReader") } }',
    'export class GlideAggregate { constructor() { die("GlideAggregate") } }',
    'export class RESTMessageV2 { constructor() { die("RESTMessageV2") } }',
    'export const gs = new Proxy({}, { get: () => () => die("gs") })',
].join('\n')

const { maskTail, NOT_RETURNED } = await import('../src/server/ess/prefill.ts')
const { changedFields, buildPersonalUpdate, priorOfRecordChannel, BANKING_POLICY_KEY } = await import('../src/server/write/personal-update.ts')
const { totalsMatch, mapClaimStatus } = await import('../src/server/write/expense-claim.ts')
const { policyKeyFor } = await import('../src/server/hr/release-gate.ts')
const { outcomeFor, areaForObject } = await import('../src/server/telemetry.ts')
const { isPayrollAffecting } = await import('../src/server/write/cutoff.ts')
const { policyKeyFor: compensationPolicyKeyFor } = await import('../src/server/write/compensation-change.ts')
const { idempotencyKey } = await import('../src/server/write/idempotency.ts')
const { countryOrder, notConfiguredFor } = await import('../src/server/country.ts')
const { missingMandatory } = await import('../src/server/ess/read-service.ts')
const { REQUIREMENT_AREAS } = await import('../src/server/governance/landscape.ts')

// --- Masking. The mask must not leak the length of a short value. ---------------------------
assert.equal(maskTail('GB29NWBK60161331926819'), '****6819')
assert.equal(maskTail('12'), '****12')
assert.equal(maskTail(''), '', 'an absent value masks to nothing, never to asterisks')
assert.ok(!maskTail('GB29NWBK60161331926819').includes('NWBK'), 'the mask leaked the body of the IBAN')

// --- The diff. An unchanged field must NOT be sent (NV-32 AC1). ------------------------------
const current = { address: 'Rua A 1', phone: '911', work_email: 'old@example.com' }
assert.deepEqual(changedFields(current, { address: 'Rua A 1' }), {}, 'an unchanged field was sent')
assert.deepEqual(changedFields(current, { address: 'Rua B 2' }), { address: 'Rua B 2' })
// Clearing a field IS a change -- refusing to send the empty string would make a value
// impossible to remove.
assert.deepEqual(changedFields(current, { phone: '' }), { phone: '' })
// A field the ERP never returned, submitted with a value, is a change.
assert.deepEqual(changedFields(current, { emergency_contact: 'X' }), { emergency_contact: 'X' })

// --- Banking is refused on the general item, not silently filtered (NV-32 AC8). --------------
const refused = buildPersonalUpdate(current, { address: 'Rua B 2', bank_account_iban: 'GB29' })
assert.equal(refused.ok, false)
assert.match(refused.message, /approval-gated item/)
assert.deepEqual(refused.changed, {}, 'a refused submission must send nothing at all')
assert.equal(BANKING_POLICY_KEY, 'employee_profile.bank_account_iban',
    'the banking gate must be field-level: employee_profile.update is also NV-32, which is ungated')

// --- Prior-of-record: the OLD channel, never the submitted one (NV-33 AC4). ------------------
assert.equal(priorOfRecordChannel(current), 'old@example.com')
assert.equal(priorOfRecordChannel({}), '', 'no prior channel must be reported as absent, not guessed')

// --- Claim totals. Cents, so 0.1 + 0.2 does not refuse a valid claim. ------------------------
const line = (amount, currency) => ({ amount, currency, category: 'travel', vatAmount: '', vatCode: '', receiptAttachmentId: '', receiptFileName: '', receiptContentType: '' })
assert.equal(totalsMatch('0.30', 'EUR', [line('0.10', 'EUR'), line('0.20', 'EUR')]).ok, true,
    'float addition refused a valid claim')
const mismatch = totalsMatch('100.00', 'EUR', [line('40.00', 'EUR')])
assert.equal(mismatch.ok, false)
assert.match(mismatch.message, /100\.00 EUR/)
assert.match(mismatch.message, /40\.00 EUR/, 'a mismatch must name BOTH figures')
// Mixed currencies are refused, never summed.
const mixed = totalsMatch('100.00', 'EUR', [line('50.00', 'EUR'), line('50.00', 'USD')])
assert.equal(mixed.ok, false)
assert.equal(mixed.line, 2, 'the message must render against the line at fault')
assert.equal(totalsMatch('0.00', 'EUR', []).ok, false, 'an empty claim is not a valid claim')
assert.equal(totalsMatch('10.00', '', [line('10.00', 'EUR')]).ok, false, 'a claim needs an explicit currency')

// --- Status mapping. An unknown status is shown RAW, never coerced (NV-35 AC1). --------------
assert.equal(mapClaimStatus('PAID'), 'Paid')
assert.equal(mapClaimStatus('paid'), 'Paid')
assert.equal(mapClaimStatus('PENDING_TREASURY'), 'Status not recognised (PENDING_TREASURY)')
assert.equal(mapClaimStatus(''), 'Status not supplied by the ERP',
    'an absent status must never render as a known one')

// --- The document release policy key resolves against a doc_type code that exists. -----------
assert.equal(policyKeyFor('salary_certificate'), 'document.salary_certificate')

// --- The absent-value label is a rendered string, not a comment. -----------------------------
assert.equal(NOT_RETURNED, 'Not returned by the ERP')

// --- NV-50 telemetry. The three blocked states must NOT collapse into `failed`. -------------
assert.equal(outcomeFor('live'), 'success')
assert.equal(outcomeFor('confirmed'), 'success')
assert.equal(outcomeFor('blocked_cutoff'), 'blocked_cutoff')
assert.equal(outcomeFor('blocked_approval'), 'blocked_approval')
assert.equal(outcomeFor('not_configured'), 'not_configured')
// `sent` is NOT a success: the ERP has not confirmed it recorded anything.
assert.equal(outcomeFor('sent'), 'failed')
assert.equal(outcomeFor('throttled'), 'failed')
// An unmapped object records NOTHING rather than being filed under a guessed area.
assert.equal(areaForObject('payslip_document'), 'R1')
assert.equal(areaForObject('expense_claim'), 'R4')
assert.equal(areaForObject('purchase_order'), '', 'a non-Noviq object must not be filed under an area')

// --- OD52. The cut-off splits employee_profile by policy key. --------------------------------
// Banking and termination reach a pay run; an address does not, and an absent calendar must not
// refuse a phone-number correction.
assert.equal(isPayrollAffecting('employee_profile', 'employee_profile.bank_account_iban'), true)
assert.equal(isPayrollAffecting('employee_profile', 'employee_profile.terminate'), true)
assert.equal(isPayrollAffecting('employee_profile', ''), false, 'an address change must not need a payroll calendar')
assert.equal(isPayrollAffecting('leave_request'), true)
assert.equal(isPayrollAffecting('compensation_change'), true)
assert.equal(isPayrollAffecting('benefit_enrollment'), true)
assert.equal(isPayrollAffecting('expense_claim'), false)

// --- NV-44. Salary is judged against its own policy key, which names the Finance group. -------
assert.equal(compensationPolicyKeyFor('salary'), 'compensation_change.update.salary')
assert.equal(compensationPolicyKeyFor('role'), 'compensation_change.update')
assert.notEqual(compensationPolicyKeyFor('salary'), compensationPolicyKeyFor('role'))

// --- The idempotency key is distinct per line and identical on a retry. ----------------------
const receipt = (line) => idempotencyKey({ logicalObject: 'erp_attachment', operation: 'create', externalId: 'E1', sourceRecord: 'R1', qualifier: 'CLAIM9#' + line })
assert.notEqual(receipt(1), receipt(2), 'two receipt lines must not share an idempotency key')
assert.equal(receipt(1), receipt(1), 'a retry of one line must produce the same key')
assert.ok(receipt(1).length > 0, 'the key must never be empty — the unique index is on it')

// --- NV-51. ONE country rule, and it has exactly two steps. ---------------------------------
assert.deepEqual(countryOrder('PT'), ['PT', ''], 'this country, then the agnostic default')
assert.deepEqual(countryOrder(''), [''], 'an unknown country resolves the agnostic row and nothing else')
assert.equal(countryOrder('PT').length, 2, 'there must be no third step — never another country')
assert.ok(!countryOrder('PT').includes('ES'), 'another country must be unreachable by construction')
assert.match(notConfiguredFor('PT', 'Object Map for leave_balance'), /Not configured for PT/)

// --- NV-51 AC2. A jurisdiction-mandatory field absent from every row makes the read partial. --
const field = (logicalField, mandatory) => ({ logicalField, sourceField: 'X', transform: 'none', zeroIsMeaningful: false, country: 'PT', mandatory })
assert.equal(missingMandatory([field('tax_id', true)], [{ tax_id: '12345' }]), '')
assert.equal(missingMandatory([field('tax_id', true)], [{ other: 'x' }]), 'tax_id', 'must name the missing field')
assert.equal(missingMandatory([field('tax_id', false)], [{ other: 'x' }]), '', 'an optional field absent is not partial')
// An empty result set cannot be missing anything — that is `live` and genuinely empty.
assert.equal(missingMandatory([field('tax_id', true)], []), '')
// Present on one row of several is enough: a list is not partial because one period lacks a value.
assert.equal(missingMandatory([field('tax_id', true)], [{ other: 'x' }, { tax_id: '9' }]), '')

// --- NV-52. Ten requirement areas gate publication; documents are not areas. ------------------
assert.equal(REQUIREMENT_AREAS.length, 10)
assert.ok(REQUIREMENT_AREAS.includes('R10'))
assert.ok(!REQUIREMENT_AREAS.includes('D1'), 'D1-D10 are documents, not requirement areas')

console.log('nv-logic OK: masking, diff, banking refusal, claim totals, status mapping, release key, telemetry outcomes, cut-off scope, idempotency keys, country fallback, mandatory fields')
