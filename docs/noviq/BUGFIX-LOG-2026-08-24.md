# Full-application bug pass — six defects, all fixed

**2026-08-24.** Triggered by "run the checks for bugs for the entire application". The four
scripts passed; reading the code found six defects the scripts could not see. Four were mine, from
the NV-21…NV-50 batches.

**Build clean. `npm run check` green. Nothing deployed — none of this ever ran.**

---

## 1 · Every write dispatched with the read verb — CRITICAL

`object_map` was unique on `(erp_system, logical_object)`. One row, one verb, one endpoint. So a
banking update resolved the map that the NV-31 prefill needs to be a `get`; `rest-client` sent GET,
its `if (verb !== 'get' && params.body)` guard dropped the body, and `extractAck()` found `id` in
the **read's own response** and marked the write `confirmed`.

The employee is told their IBAN changed. Nothing was sent.

**Fixed** by OD51: `object_map.operation`, a widened unique index, an operation-aware `loadMap()`,
`FetchParams.operation`, and a dispatcher pre-flight that refuses a missing write map (`not
configured`, naming the map to create) or one whose verb is `get`. The binary paths
(`archive.ts`, expense receipts) now resolve the `create` map; `offboarding.assertNotDelete()` now
inspects the `update` map, which is the only map where a delete binding could ever appear.

**Guard:** `check-store-readiness.mjs` 8a fails any `fetch()` passing a `body` with no
`operation`. Verified to fire on the pre-fix shape and pass on the fixed one.

## 2 · The banking gate could fail OPEN — CRITICAL

`approvalRequired()` resolved its policy with
`addQuery('country', 'IN', country ? country + ',' : '')`. Every one of the three call sites passed
`''`, so the IN list was **empty**. An IN against an empty list is not documented to match a blank
column — and if it matches nothing, the function returns `false`, which this codebase reads as *no
approval required*. That is the one control BRD §9 risk 2 exists for, silently absent.

It also made every country-specific policy row unreachable, since no caller ever passed a country.

**Fixed** on both halves: the lookup is now two explicit queries (country row, then agnostic row) —
one extra round trip, no ambiguity — and all three call sites pass a real country
(`gateWrite` resolves it from `emp_xref`, `releaseAllowed` from the subject employee,
`submitBankingUpdate` from the resolved identity).

## 3 · Every `erp_write` row inserted with an empty idempotency key — HIGH

Four modules had a private `createWrite()`, and all four inserted with `idempotency_key` blank; the
key was only stamped later inside `preflight()`. The table carries a **unique index on
`(erp_system, idempotency_key)`**, so every queued row for one system shared the key `''` and the
second insert collided — reporting "could not be queued" for a write nothing was wrong with. Two
receipts on one expense claim hit it immediately.

It also made a comment in `expense-claim.ts` false: an index cannot deduplicate receipts by claim
and line while the column it indexes is blank.

**Fixed** by `src/server/write/create-write.ts` — one creator, key computed **at insert**, five
callers migrated. **Guard:** rule 8b fails any server module that creates an `erp_write` row
directly.

## 4 · A failed archival raised no exception — MEDIUM

`archive.ts` passed `assignmentGroup: ''`; `raiseException()` returns `''` on a falsy group. NV-37's
"an `erp_exception` is raised" never happened, so a document that never reached the ERP left no
queue item for anyone to work. **Fixed** — `defaultAssignmentGroup()` exported from the dispatcher
and used.

## 5 · The compensation approval chain could never complete — MEDIUM

`approvalChainComplete()` read the stage from `sysapproval_approver.source_table`, which holds a
**table name**. Nothing ever writes `manager` or `finance` there, so the chain never completed and
every compensation change would have sat in `blocked_approval` for ever. It failed closed — the
right direction — and was unusable.

**Fixed** by making the stage what the organisation already configures: **group membership**.
`write_approval_policy.required_groups` names the groups in order; a stage is satisfied by an
approved approval for that case whose approver belongs to that group. Salary uses its own policy
key (`compensation_change.update.salary`) naming the extra Finance group, so "Finance only for
salary" is two rows rather than a branch. A group name that does not resolve satisfies nothing —
a typo in the policy cannot read as an approval.

The seeded group names are **placeholders and the gate fails closed until they are real**, which is
correct: an organisation that has not named its approvers has not authorised anything.

## 6 · An address change needed a payroll calendar — LOW

`employee_profile` was payroll-affecting as a whole, so a phone-number correction was refused
wherever no calendar covered the date. **Fixed** by OD52: the cut-off applies to
`employee_profile` only under the banking or termination policy key. The refusal stays absolute for
writes that do reach payroll.

---

## What this says about the checks

The four scripts test **structure** — ACL flags, import extensions, disarmed jobs, unstageable
objects. Not one of them could see that a request carried no body, or that a policy query matched
nothing. Both new rules (8a, 8b) are narrow and behavioural for exactly that reason, and both were
proved to fire before being trusted.

`check-nv-logic.mjs` grew twelve assertions covering the cut-off split, the salary policy key, and
idempotency keys being distinct per receipt line and stable across a retry.
