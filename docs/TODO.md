# TODO — what is left, and what it is worth

**Last updated:** 2026-08-25 · Companion to `docs/DEFERRED.md`, not a replacement for it.
`DEFERRED.md` records *why* something is blocked and who has to unblock it. This file records
*what is left to do* and in what order it is worth doing.

All 52 `NV` stories and all 38 L0–L6 stories are **built or explicitly deferred**. Nothing below is
story work. That sounds like the end of the project. It is not, for one reason:

> **Almost none of this code has ever executed.** `call_log` is 0 rows. `erp_staging` and
> `sync_run` are empty. No layer gate has been run. No test has been run. A clean build proves
> nothing and a passing happy-path fixture proves nothing.

Everything in §1 is worth more than everything in §2–§5 combined.

---

# 1. Run it

Nothing here is hard. It is blocked on a terminal and about a minute of somebody's attention.

### 1.1 ~~Repopulate the SDK credential store~~ — **done**

`now-sdk auth --list` returns the `dev` alias (basic, `admin`). **This no longer blocks anything.**

If it is ever empty again, re-adding it needs a **real interactive terminal** — the masked prompt
defeats both `printf` piping and a `script` pseudo-TTY:

```bash
npx now-sdk auth --add https://dev296062.service-now.com --type basic --alias dev
```

**Live instance state, verified 2026-08-25:** 6 `erp_system` rows with the three L2 gate fixtures
intact and their sys_ids matching `l2-fixtures.now.ts`; 14 `object_map`; 22 `field_map`; `sync_run`
and `call_log` both **0 rows**. The control tower is configured and has never dialled.

### 1.2 Clear the deploy backlog

Everything since the `payload.k` envelope fix — the styling and theme pass, nine bug fixes, the
OD37 seed corrections, and now the entire `NV` increment — is built clean and **not installed**.

```bash
npm run build && npx now-sdk install -a dev     # install does NOT build
```

### 1.3 Run the L2 gate driver once

`HRERP L2 GATE (temporary)`. It is the first real proof the connector works and takes about a
minute. See `docs/DEFERRED.md` §1. **Disarm it again afterwards** — repo rule 4.

### 1.4 Confirm the two write-path fixes against a real call

These are the highest-risk repairs in the repo and **static checks cannot confirm either one**:

| Fix | What a real call would prove |
|---|---|
| **OD51** — a write resolves its own `object_map` row | Before this, a write resolved the *read* map, was sent with the read's verb, had its body dropped by `rest-client`, and `extractAck()` read an `id` out of the read's own response — reporting `confirmed` for a request that never left the instance |
| **`create-write.ts`** — idempotency key set at insert | Before this, every `erp_write` row was inserted with a blank key under a unique index on `(erp_system, idempotency_key)`. Every blank collides with every other blank |

`npm run check` rules 8a and 8b guard against regression. Neither proves the fix works.

### 1.5 The runtime half of NV-48

`scripts/check-minimisation.mjs` is the build-time half and passes. The runtime sweep — proving no
payload value reached `erp_write`, `call_log` or `erp_staging` — needs rows to sweep, so it needs
§1.1–§1.3 first.

---

# 2. Business rules outstanding from NV-1…NV-20

Five rules. The server modules they belong to are built and compile clean; the rule layer that
fires them on record events does not exist. There is no `src/fluent/business-rules/nv-rules.now.ts`.

| Story | Rule | Note |
|---|---|---|
| **NV-1** | Auth validation on `erp_system` | Must include the **OD46** production Basic-auth exception expiry — an exception that never expires is not an exception |
| **NV-2** | Elevated-sensitivity distinctness on `erp_scope_grant` | |
| **NV-3** | No write without a case | |
| **NV-4** | Idempotency check before create | The dispatcher already re-checks. This layer is the *message*, not the enforcement |
| **NV-9** | Approval gate, layer one | Layer two is the dispatcher re-check and already exists |

> **Read trap 5 before writing any of these.** A `before` business rule that throws is **silently
> swallowed and the record saves**. A crashed rule is indistinguishable from an approving one. This
> is exactly why OD44 made the approval gate two-layer with the second layer outside the rule
> engine. Never let one of these rules become the only thing standing between a write and an ERP.

---

# 3. UI surfaces — all gated on one human decision

**OQ-16 / OD40 is ANSWERED — see OD54.** The surface is the existing BYOUI SPA at `?view=me`; the
five read areas are built and deployed. What remains below is the rest. HRSD is not installed on
dev296062, so the surface these stories render into is undecided: HRSD catalog items, plain Service
Catalog, or the existing BYOUI hub. Building against the wrong one is a rewrite, not a refactor.

Every story below has its **server logic complete and its UI outstanding**:

| Story | Outstanding surface |
|---|---|
| NV-13 | Widget |
| NV-22 | Employee lookup UI (`bindIdentity()` with all four refusals is built) |
| NV-23 | Onboarding flow |
| NV-24, NV-26, NV-27 | Payslip list, tax statement, leave balance widgets — all three served by `ess/read-service.ts` |
| **NV-25** | **Streaming REST endpoint.** Also blocks NV-39's D3 |
| NV-29 | Catalog item (dispatcher + gate + cut-off carry it end to end) |
| NV-31 | Catalog client script / Scripted REST prefill surface |
| NV-32 | Catalog item + flow |
| NV-33 | Approval subflow + notification record |
| NV-34 | Multi-row variable set |
| NV-35 | RITM view |
| NV-36 | Catalog category |
| NV-38 | HR-facing reconciliation view |
| NV-40 | Approval subflow |
| NV-44 | HRSD case type + approval flow |
| NV-45 | Case type + task |
| NV-46 | Widget + catalog item |
| NV-50 | Telemetry dashboard |
| NV-52 | Control-tower rendering of `publicationAllowed()`'s four distinct refusals |

**Not started, and correctly so:**

- **NV-28** leave types cache — needs the reference-data cache, which needs the surface decision
- **NV-30** status read-back / cancel

> **The rule that governs all of this: never draw a button that can't commit its decision.** Tab
> 2's requisition write-back stays deferred and stays unrendered. OD42 reversed D3 for the Noviq
> scope only — un-deferring the *capability* was not permission to draw that button.

---

# 4. Blocked on somebody else's answer

### NV-47 timesheet — unblocked in mechanism, still not started

The gate exists (`timesheetBuildAllowed()` in `src/server/governance/landscape.ts`). It stays
closed until a deployment answers **R10** in a `landscape_discovery` row.
`native_timesheet_workflow` is deliberately three-state — `not_answered` / `yes` / `no` — so that
"nobody has asked" cannot be mistaken for "no". `not_answered` blocks the build.

**No `landscape_discovery` row is seeded, and none should be.** A row asserting who owns R3 for a
customer nobody has met is an invented answer to the one question the table exists to force.

### `vendor_onboarding` seeds

The table is built (NV-15); the rows are not. **Cegid and PHC are entirely unconfirmed** — no
endpoint, no auth flow, no field name. Rule five applies without exception:

> **Never seed an invented endpoint or field name. Blank beats wrong.**

A blank `endpoint_path_hint` makes an admin supply one. A plausible wrong one gives them a 404 they
blame on their own configuration — or worse, a 200 full of nulls. OD37 emptied twelve rows for
exactly this reason.

### The three BRD/TRD conflicts

`docs/noviq-brd-trd-alignment.md` §6 carries three conflicts that must be settled before either
document goes to v2. Not a developer's call.

---

# 5. Store readiness and known blockers

### The OD50 fixture credential — a standing certification blocker

`src/fluent/data/l2-fixtures.now.ts` ships a real credential (`postman` / `password`). It is a
published test credential, not a secret, but it is still a credential in an app record and the
ServiceNow Store will reject it.

**It is named by `npm run check` on every run rather than suppressed**, because deleting it would
disarm the L2 gate driver — the single highest-value unblock in §1. Remove it *after* §1.3, not
before.

### Outstanding

- **NV-49** evidence-pack generator. The lint half is done and passing.
- **`docs/unit4-integration.md`** derives from internal **TLP Green** material. Fine in a private
  repo. Settle it before this reaches anywhere public.

---

# 6. The four checks that have to keep passing

```bash
npm run check      # contract + NV logic + data minimisation + Store readiness
```

| Script | What it fails on |
|---|---|
| `check-contract.mjs` | L4↔L5 payload drift against `docs/api-contract.md` |
| `check-nv-logic.mjs` | 60+ assertions over the write path, run against stubbed Glide |
| `check-minimisation.mjs` | A payload value reaching an audit table |
| `check-store-readiness.mjs` | Scoped-app violations, plus rules 8a/8b/8c below |

Three regression rules exist because each one caught a real, shipped defect:

- **8a** — a `fetch()` passing a `body` without an `operation` (OD51)
- **8b** — an `erp_write` row created anywhere but `write/create-write.ts`
- **8c** — a country query that does not go through `country.ts`'s `countryOrder()` (OD53)

None of them are style rules. Do not suppress one to make a build pass.
