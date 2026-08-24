# Noviq NV-21…NV-30 — build log

**Session:** 2026-08-24 · **Build: clean** after every step below.

Third in the series: `BUILD-LOG.md` (NV-1…10), `BUILD-LOG-11-20.md`, this one.

---

## What I did first, and why it was not NV-21

NV-22…NV-30 all resolve their employee through **NV-10**, which had been skipped entirely, and
every write among them needs the **NV-3 dispatcher**, which did not exist. `erp_write` — the audit
trail for every change pushed into a payroll system — had **no ACLs at all**. Building 21–30 on
that would have produced nine stories that compile and cannot run.

So the foundation was closed first. That was the right call and it is where most of this session
went.

### Three bugs found while closing it

1. **New `auth_type` values sent no authentication.** OD45 added `oauth2_client_credentials` and
   `oauth2_jwt` to the choice list; `rest-client.ts` still branched on `oauth2` alone, so a system
   saved with either fell through with **no auth profile set** — a 401 indistinguishable from bad
   credentials. Now CLAUDE.md trap 17.
2. **`rest-client` could not express a write.** It spoke `get`/`post` only. `patch` and `put`
   added; **`delete` deliberately left out of the choice list**, which makes NV-45's
   "termination must be a status change, never a hard delete" unsaveable rather than merely
   discouraged — the schema refuses it, not a business rule someone can deactivate.
3. **The dispatcher's first draft was wrong twice** and I rewrote it rather than shipping it: the
   payroll-country expression was nonsense, and the request body was always empty. The fix is the
   interesting part — `erp_write` deliberately does not store the payload, so the body is **passed
   in and never persisted**. The row keeps `request_hash` instead, which proves two attempts
   carried the same content without the content being there to leak.

---

## Delivered this session

### Foundation (NV-3, NV-8, NV-10)

- **`emp_xref` extended, not duplicated** — `payroll_country` (resolved *from the ERP*, never from
  the ServiceNow user's location: a secondee's payroll jurisdiction and their desk are routinely
  different places), `terminated`, `identity_mismatch`, `linked_on`, `linked_by`. Second unique
  index on `(erp_system, erp_employee_key)` so one ERP employee cannot bind to two users.
- **`write/identity.ts`** — the only way an employee is resolved. An identity mismatch **blocks
  reads as well as writes**: a read against the wrong employee shows one person another person's
  payroll, which is worse than showing nothing.
- **`security/noviq-acls.now.ts`, 21 rules.** Every deny is Shape A with `adminOverrides: false`
  written explicitly. Six hard denies on `erp_write` provenance (`state`, `erp_ack_ref`,
  `approval_ref`, `first_sent_at`, `idempotency_key`) and on `write_approval_policy.approval_required`
  — flipping that last one to false removes a payroll-fraud control BRD §7 and §9 both mandate,
  silently and with no trace.
- **`write/dispatcher.ts`** — composes identity, gate, cut-off, idempotency and throttle, and
  dispatches **through `erp-connector.fetch()`** so retry, breaker and `call_log` survive (OD42).
  Pre-flight order is the design: read-only → approval → cut-off → idempotency → throttle, each
  with its own distinct state.

### NV-21…NV-30

| Story | State |
|---|---|
| NV-21 entity model | **Done** last session (contract, choices, parity check) |
| NV-22 employee lookup | **Partial** — `bindIdentity()` with all four refusals; the lookup UI is outstanding |
| NV-23 create employee | **Partial** — dispatcher + idempotency carry it; the onboarding flow is outstanding |
| NV-24 payslip list | **Partial** — served by `ess/read-service.ts`; widget outstanding |
| NV-25 payslip retrieval | **Partial** — `binary-client.ts` built last session; the streaming REST endpoint is outstanding |
| NV-26 tax statement | **Partial** — same read path; widget outstanding |
| NV-27 leave balance | **Partial** — same read path; widget outstanding |
| NV-28 leave types cache | **Not started** — needs the reference-data cache |
| NV-29 write leave request | **Partial** — dispatcher + gate + cut-off carry it end to end; the catalog item is outstanding |
| NV-30 status read-back / cancel | **Not started** |

### `ess/read-service.ts` — one read path, not one per widget

Every story in Epics C–J renders the same states. Six copies of that logic would drift until one
rendered `0` for an absence. Two properties worth naming:

- **`null` from `mapResponse` is not an empty list.** It means `response_root` did not resolve —
  "the configured path is wrong" and "there are no rows" are different answers, and rendering the
  first as the second is exactly how a misconfiguration becomes an innocent `0`.
- **A sixth state, `throttled`.** Found during story validation: a queued read that burns its
  timeout budget would otherwise render `failed`, reporting an ERP that *would* have answered as
  one that did not.

---

## Also this session

`CLAUDE.md` and `README.md` improved on request: three new traps (15–17), the write path's five
rules, the NV layout, and honest current-state paragraphs in both.

---

## Next

1. **Business rules** — NV-1 auth validation (including the OD46 exception expiry), NV-2
   elevated-sensitivity distinctness, NV-3 no-write-without-case, NV-4 idempotency-before-create,
   NV-9 gate layer one.
2. **Seeds** — `write_approval_policy` for the BRD-mandated gates (banking, compensation,
   termination, D2/D6/D7/D8/D9), `vendor_onboarding` with Cegid and PHC entirely unconfirmed.
3. **Surfaces** — the widgets and catalog items for NV-22, NV-24…NV-30, plus the streaming REST
   endpoint for NV-25. This is the largest remaining block and it is gated on the OQ-16 / OD40
   surface decision, which is still a human call.

**Nothing has executed.** `call_log` is 0 rows, the credential store is empty, no test has run.
