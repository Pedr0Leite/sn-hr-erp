# Noviq NV-11…NV-20 — build log

**Session:** 2026-08-24 · **Build: clean.** `npm run build` succeeds and
`node scripts/check-contract.mjs` reports `contract OK: 27 objects, 14 staged`.

Companion to `docs/noviq/BUILD-LOG.md` (NV-1…NV-10). That session ended with the build
unverified; **it is now verified** — the schema work from 2026-08-23 compiles.

---

## Second brain — used, and it changed the code twice

Two constraints came out of the vault that would otherwise have been found at runtime, on the
instance, by a user:

1. **`getBody()` is unusable on a response saved as an attachment.** The `RESTResponseV2` docs say
   so explicitly. This is why `binary-client.ts` exists as a separate file rather than as a branch
   inside `rest-client.ts` — the two paths cannot share a response reader without one being wrong.
2. **Scoped `getContent()` supports CSV, JSON and TXT only.** It is *not* a way to read PDF bytes.
   The `%PDF-` magic-byte check therefore reads `getContentStream()` through `GlideTextReader`.
   Had this been written the obvious way, the check would have silently mis-read every PDF —
   and a magic-byte check that always fails open is worse than none, because it is *trusted*.

`saveResponseBodyAsAttachment(table, sysId, fileName)` and
`RESTResponseV2.getResponseAttachmentSysid()` confirmed as the real API names, and scoped
`GlideSysAttachment.deleteAttachment()` confirmed to exist — which is what makes OD43's shred
buildable at all.

---

## Delivered

### Tables — `src/fluent/tables/noviq-tables.now.ts` (new, 412 lines)

| Table | Story | The decision inside it |
|---|---|---|
| `erp_scope_grant` | NV-2 | Least privilege asserted **by this integration**, not promised by an ERP admin. Unique on (system, object, operation). `source_note` mandatory. |
| `erp_write` | NV-3, NV-4, NV-8 | **`source_table`/`source_record` is a polymorphic pair, not a reference** — the one choice that keeps a later HRSD swap a data change (V1/OD40). Unique index on (system, idempotency_key) refuses the duplicate **at the database**. `request_hash` proves two attempts carried the same content *without the content being stored*. |
| `erp_exception` | NV-12 | `assignment_group` mandatory — an exception with no owner is one nobody works. |
| `payroll_calendar` | NV-7 | Unique on (system, country, period). |
| `write_approval_policy` | NV-9 | Gate resolves from **data**, never a code branch per flow. |
| `vendor_onboarding` | NV-15 | **Three-state status**: `not_confirmed` is the default and a *finding*, never `No`. Cegid/PHC ship entirely unconfirmed — a true statement where `No` would be false. |

### Server modules

- **`connector/binary-client.ts`** (NV-5, NV-11) — spool-and-shred per OD43. `shred()` returns
  `boolean` and **proves** the row is gone rather than trusting the delete; the return is
  deliberately not `void` so a caller cannot ignore it. Magic-byte check catches the realistic
  failure — an expired session returning HTTP 200, `Content-Type: application/pdf`, and a **login
  page** in the body. Size is checked before *and* after transfer.
- **`write/idempotency.ts`** (NV-4) — deterministic, readable (not a hash, so an HR agent can
  match it against an ERP record while working an exception), with `|` escaped to prevent
  separator collision.
- **`write/approval-gate.ts`** (NV-9, OD44) — **layer two of two.** Layer one is a business rule;
  this is the dispatcher's independent re-check, because CLAUDE.md trap 5 means a `before` rule
  that throws is swallowed and the record saves. Compares approval `sys_updated_on` against
  `first_sent_at` so a **retroactive approval cannot satisfy the gate**.
- **`write/cutoff.ts`** (NV-7) — **an absent calendar REFUSES.** Treating "no calendar configured"
  as "no cut-off applies" is the four-state rule's failure in a new costume: an absence read as a
  permission.
- **`write/exception-queue.ts`** (NV-12) — reuses the existing `classify.ts`; no second classifier
  exists in this app. Closed list of eight categories.
- **`connector/throttle.ts`** (NV-16) — **80% default margin**, because Unit4 *suspends the whole
  environment* for a minute on breach rather than queueing. Counts real traffic from `call_log`
  rather than a counter that drifts. `fitsReadBudget()` resolves the NV-13/NV-16 conflict found in
  validation: queue time counts against the read budget, and a throttled read renders
  `Too many requests right now` — never `failed`.

### Contract — NV-17 to NV-21 complete

`src/server/contract/objects.ts` + `choices.ts`: Employee completed to the TRD §3 minimum
(6 fields added, **7 existing names unchanged** — renaming orphans every `field_map` row), plus
11 new entities. **Every one carries `category: null`**, which is the enforcement, not a
placeholder: `engine.ts:528` selects staging objects by matching a real ERP category, so a
null-category object *cannot be reached by that query*. BRD O3 and DL-D2 are held by the schema.

`scripts/check-contract.mjs` updated 16 → 27 with the count asserted rather than derived, so
adding an object stays a deliberate edit.

---

## Status against stories 11–20

| Story | State |
|---|---|
| NV-11 attachment limits | **Done** — columns + enforcement in `binary-client.ts` |
| NV-12 exception queue | **Done** — table + module |
| NV-13 synchronous reads | **Partial** — contract and throttle interplay done; widget work belongs to the UI stories |
| NV-14 dates / currency | **Pre-existing** — `parseDate` already shape-detects; no new code needed |
| NV-15 sandbox + onboarding | **Table done**; seed rows outstanding |
| NV-16 rate limits | **Done** — columns + `throttle.ts` |
| NV-17–NV-20 entity model | **Done** — contract, choices, parity check |

## Next

1. ACLs for the six new tables — **Shape A deny with `adminOverrides` explicit** (trap 3), and
   every test must **re-read the value** (trap 4). Not yet written; this is the largest gap.
2. The write dispatcher itself — must route through `rest-client.ts` (OD42) so retry, breaker and
   `call_log` survive. The modules it composes now all exist.
3. Business rules: NV-1 auth validation, NV-2 elevated-sensitivity distinctness, NV-3 no-write-
   without-case, NV-4 idempotency-configured-before-create.
4. Seeds: `write_approval_policy` (BRD-mandated gates), `vendor_onboarding` (Cegid/PHC unconfirmed).

**Nothing has executed.** `call_log` is 0 rows, the credential store is still empty, and no test
in `docs/noviq/test-plan.md` has run.
