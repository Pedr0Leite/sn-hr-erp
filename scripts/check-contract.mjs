// L1-1 verify step: `node scripts/check-contract.mjs`.
// Node 24 strips TypeScript types natively, so the contract module is imported directly --
// no second copy of the object list can drift from the real one.
import assert from 'node:assert/strict'
import { LOGICAL_OBJECTS, isLogicalField, stagedObjectNames } from '../src/server/contract/objects.ts'
import { LOGICAL_FIELD_CHOICES, OBJECT_CHOICES } from '../src/fluent/tables/choices.ts'

const names = Object.keys(LOGICAL_OBJECTS)
// 16 shipped at L1 (spec §2.1); 11 added by Noviq NV-18..NV-21, all `category: null` and so
// unstageable by construction. The count is asserted rather than derived so that ADDING an object
// is a deliberate edit here, not a side effect of editing objects.ts.
assert.equal(names.length, 27, `expected 27 logical objects, got ${names.length}`)
assert.equal(stagedObjectNames().length, 14, 'expected 14 staged objects (2 are live-only, D2)')

// No duplicate field name within an object.
for (const [name, def] of Object.entries(LOGICAL_OBJECTS)) {
    assert.equal(new Set(def.fields).size, def.fields.length, `${name} has a duplicate logical field`)
    assert.ok(def.fields.includes('erp_id'), `${name} is missing erp_id (deep link)`)
}

// The seven objects dropped at L1-D1 must not have crept back in.
for (const gone of [
    'opportunity',
    'sales_order',
    'job_requisition',
    'employee',
    'labor_cost',
    'credit_status',
    'receipt',
]) {
    assert.ok(!(gone in LOGICAL_OBJECTS), `${gone} was dropped at L1-D1 and must stay dropped`)
}

// The choice lists must mirror the contract EXACTLY, both directions. Added 2026-08-13 after
// the L1 reconciliation found `qty` and `started_on` in the contract but absent from
// LOGICAL_FIELD_CHOICES, and `occurred_on` in the choice list but in no object's contract.
// A missing choice makes a contract field unmappable through the UI; a surplus choice offers
// the admin a value the L1-8 business rule rejects on every object. Both build clean.
const contractFields = new Set()
for (const def of Object.values(LOGICAL_OBJECTS)) def.fields.forEach((f) => contractFields.add(f))
const choiceFields = new Set(Object.keys(LOGICAL_FIELD_CHOICES))
assert.deepEqual(
    [...contractFields].filter((f) => !choiceFields.has(f)),
    [],
    'contract logical fields missing from LOGICAL_FIELD_CHOICES',
)
assert.deepEqual(
    [...choiceFields].filter((f) => !contractFields.has(f)),
    [],
    'LOGICAL_FIELD_CHOICES offers a field no object permits',
)
assert.deepEqual(
    Object.keys(OBJECT_CHOICES),
    Object.keys(LOGICAL_OBJECTS),
    'OBJECT_CHOICES must mirror LOGICAL_OBJECTS key-for-key and in order',
)

assert.equal(isLogicalField('stock_item', 'qty'), true)
assert.equal(isLogicalField('stock_item', 'nonsense'), false)
assert.equal(isLogicalField('nonsense', 'qty'), false)

console.log(`contract OK: ${names.length} objects, ${stagedObjectNames().length} staged`)
