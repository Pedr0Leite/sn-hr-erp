---
title: SN HR&ERP — decision log
app: x_335329_sn_hr_erp
---

Every decision that shaped this app, with the alternative that was rejected and why. Append only.
A decision reversed later gets a new entry, not an edit.

---

## D1 — UI: BYOUI SPA, plus a written UIB specification

**Decided** 2026-08-12 by the product owner.

**Chosen:** the Capacity Planner pattern — Fluent Workspace API shell + `sys_ui_page` + Scripted
REST API + vanilla-JS SPA, 100% authorable from source. Additionally, `docs/uib-page-spec.md` as a
real deliverable: the UIB Page Component Tree and Data Binding Schema, written in correct UIB
vocabulary, so a human can assemble a native workspace page from it later without redesigning.

**Rejected — native UIB authored by the agent.** A single blank-page macroponent is roughly 61,000
characters of generated composition. The sibling project burned several build cycles proving this is
not hand-authorable. The Fluent Workspace API builds a list-and-navigation workspace, not an
arbitrary tabbed analytics composition with scorecards and charts. The realistic UIB flow is a human
assembling the page in the browser, then `now-sdk transform` capturing it — which blocks L5 on
browser time.

**Rejected — BYOUI with no spec document.** Drops an explicitly-requested deliverable.

**Binds:** L4 must return a payload shaped for a client-side view state machine, not for UIB data
resources. L5 is a single bundled JS asset with a hard-refresh step after every deploy.

---

## D2 — Staging: stage ERP data, but never stage payroll

**Decided** 2026-08-12 by the product owner.

**Chosen:** `finance`, `procurement`, `inventory`, `assets` and `manufacturing` are staged in
`erp_staging` with full provenance and `fetched_at`. `payroll_record` and `employee_profile` are
fetched **live at document-generation time and never stored**. No queryable table of salaries exists
in ServiceNow.

**Rejected — stage everything including payroll, with a retention window.** Creates a queryable
salary table. That is a data-protection decision, not a technical one, and it is not needed: payroll
is read once, at generation time, for one employee.

**Rejected — stage nothing, live-fetch every tab.** This was the sibling app's founding rule. With
five tabs it means every configured endpoint in the estate is hit on every page open, tripping
circuit breakers on systems nobody asked about.

**Costs accepted:**
- Document generation depends on a live ERP call and **fails loudly** when the ERP is down. It does
  not fall back to a stored figure, because a stored figure would be exactly the shadow HR database
  this decision exists to prevent.
- Staged financial data needs a retention policy. **Open item OD1** — propose and get approved.
- Absence of rows is now ambiguous, which is why `sync_run` (§5.4) is mandatory, not optional.

---

## D3 — Requisition Approve/Reject write-back: deferred to L7

**Decided** 2026-08-12 by the product owner.

**Chosen:** L0–L6 build Tabs 1, 3, 4, 5 and a **read-only** Tab 2 with a visible caveat and an ERP
deep link. The approval mirror (real ServiceNow approval records per pending ERP requisition) and
the outbound write-back become L7, with their own design and their own governance gate.

**Rejected — build write-back inside L5.** Puts an outbound write path to a system of record inside
the same governance gate as read-only work, and needs a live ERP that accepts writes in order to be
tested at all.

**Rejected — declare it permanently out of scope.** The §6 Tab 2 requirement is real; deferring is
honest, dropping is not.

**Binds:** **never draw a button that cannot commit its decision.** Until L7 exists, no Approve or
Reject control is rendered anywhere.

---

## D4 — Connector: port into this scope

**Decided** 2026-08-12 by the product owner.

**Chosen:** port the `ErpConnector` source and its 21 tests from `x_335329_erpcrm` into
`x_335329_sn_hr_erp`, keeping structure and tests intact. This app then grows it: vendor default
mapping resolution and a sync engine the sibling has no use for.

**Rejected — cross-scope reuse of `x_335329_erpcrm.ErpConnector`.** Zero duplication, but it couples
this app's uptime to a CSM-facing app's release cycle, and the cross-scope caller shape is unproven:
the sibling's evidence layer runs in the *same* scope as the connector, this app would not. Proving
it would cost a live verification that the port does not need.

**Binds:** the retry / backoff / circuit-breaker / telemetry behaviour is **not to be reinvented**.
It is ported with its tests, and its tests must pass here before L2's gate is claimed.

---

## D5 — Every unquantified threshold becomes a `sys_property` with a published default

**Decided** 2026-08-12 by the main session, after `ba-agent` reported seven requirements it could
not write a testable acceptance criterion for.

The spec asks for "low-stock alerts", "assets due for maintenance", "high-value capital assets
nearing end-of-life", "backordered items" and a staleness threshold, without quantifying any of
them. Picking a number inside a test hides a product decision in the test suite; refusing to pick
one blocks the build.

**Chosen:** each threshold is a `sys_property` in this app's scope with a documented default, read
by the L4 API and echoed into the tile payload. **The tile renders the threshold it actually used**
("below safety stock", "over £50,000", "within 90 days"), so the number on screen is always
attributable and an admin can change it without a redeploy. Acceptance criteria then test the
mechanism against a known property value rather than asserting a magic number.

Defaults to publish (all overridable, all to be confirmed at governance):

| Property | Default | Drives |
|---|---|---|
| `stale_after_hours` | 24 | The `stale` state in §7 |
| `asset_maintenance_due_days` | 30 | Tab 4 "assets due for maintenance" |
| `asset_high_value_amount` | 50000 | Tab 4 "high-value capital assets" |
| `asset_eol_within_days` | 180 | Tab 4 "nearing end-of-life" |
| `staging_retention_days` | *no default — OD1, needs approval* | L3 retention |

**Hard limit on this decision:** a threshold property makes a *comparison* configurable. It does not
invent a *field*. Where the underlying logical field is not mapped — notably Tab 3 "backordered
items", for which the spec names no field at all — the tile renders **not configured** and names the
mapping to create. It never guesses, and it never shows `0`.

**Rejected — hardcode the thresholds.** Ships a business rule as a constant and requires a redeploy
to change a number a finance lead will want to change in week one.

**Rejected — leave the tiles out until a human specifies each number.** Blocks four tiles on a
conversation that a sensible default plus a visible label makes unnecessary.

---

## D6 — `finance_viewer` gates every monetary figure, on every tab

**Decided** 2026-08-12 by the main session. `ba-agent` flagged that the spec names
`finance_viewer` as gating "financial figures" without saying whether that includes Tab 2's
year-to-date procurement spend and Tab 4's total asset valuation.

**Chosen:** it does. Every currency-formatted figure in the app — Tab 1 in full, Tab 2 YTD spend and
the supplier spend donut, Tab 4 total asset valuation and the high-value asset list — requires
`finance_viewer`. Non-holders see those specific tiles rendered as access-restricted, and the rest
of the tab renders normally.

Enforced at the L4 API against `sys_user_has_role`, **never** `gs.hasRole()` (§9: it lies under
`runAs`), and not merely hidden in the client.

**Rejected — `finance_viewer` gates Tab 1 only.** Splits the same sensitivity across two rules and
leaks procurement spend and asset valuation to anyone with plain `viewer`.

---

## D7 — "Real-time cash balance" is labelled as staged, not real-time

**Decided** 2026-08-12 by the main session.

§6 Tab 1 asks for a "real-time cash balance". Under D2 that figure is served from `erp_staging` and
is as old as its last sync. **The tile is labelled "Cash balance" with the mandatory "as of <time>"
stamp, and never the word "real-time".** Same honesty rule as §7 and §8.2, applied to a label.

If a genuinely live figure is wanted later, it is a per-tile live-fetch path with its own design —
not a relabelling.

---

## D8 — XLSX export is out of scope

**Decided** 2026-08-12 by the main session. §6 never asks for export; the Capacity Planner's bundled
XLSX export is prior art for *how* to do it (bundle locally, CSP blocks CDN), not a requirement to
carry over. If added later, bundle the library locally.

---

## D9 — The BYOUI page is React, not vanilla JS

**Decided** 2026-08-12 by the product owner, after the architect found SDK 4.9.0's `ui-page-guide`
states *"Always use React 18.2.0. Never use vanilla JavaScript."*

**Chosen:** React 18.2.0 with `@servicenow/react-components` inside the BYOUI UI Page.

D1 rejected **native UI Builder macroponent authoring**; it did not rule on the framework used
inside a BYOUI page. The vanilla detail was inherited from the Capacity Planner as prior art, not
chosen on its merits. This changes L5 only — the L4 payload contract is identical either way, and
every other layer was written framework-agnostic.

**Rejected — vanilla JS as the Capacity Planner does it.** Proven in this estate, but it contradicts
explicit SDK guidance, and if the SDK's bundling path assumes React we would discover that at L5
instead of now.

**Note:** `sys_ux_lib_asset` — the Capacity Planner's asset-registration mechanism — appears nowhere
in SDK 4.9.0's UI Page docs. The documented path is an imported `index.html` entry point with
`direct: true` and the build system bundling. L5 follows the documented path.

---

## D10 — The salary certificate honours D2: rendered from memory, never persisted

**Decided** 2026-08-12 by the product owner, resolving a genuine collision between §8.1 and D2.

§8.1 asks for a document-data row whose fields a native Document Template could bind to. D2 forbids
any table carrying a salary figure. Both are binding and both were written without the other in
view. Only the salary certificate is affected; the employment verification letter is not.

**Chosen: D2 wins.** The salary figure is fetched live, held in memory, rendered into the document,
and never written to a column. The generated document is the only artifact that contains it.

**Cost accepted, and it must be written into the L6 design as a stated limitation:** on a licensed
instance, the §8.1 platform-swap seam covers the employment verification letter but **not** the
salary certificate — a native Document Template cannot bind to a field that does not exist. Swapping
that one document to the platform feature would require revisiting D2, which is a data-protection
decision, not an engineering one.

**Rejected — a short-lived salary column purged after generation.** A queryable salary column would
exist in ServiceNow, briefly. "Briefly" is not a property the GDPR cares about.

**Rejected — dropping the salary certificate.** Removes a named deliverable to avoid a conflict that
has an honest answer.

---

## D11 — Mixed-currency tiles render per-currency subtotals, not a blank

**Decided** 2026-08-12 by the product owner.

Staging keeps `amount` as a plain Decimal so a tile shows exactly what the ERP said (no FX
conversion — a converted figure is no longer what the ERP said, and provenance is the point of this
app). The architect's design rendered a mixed-currency tile as `partial` with **no figure**.

**Chosen:** `partial` renders the per-currency subtotals it can honestly state —
`£1.2M · €840k, as of 09:14` — rather than nothing.

This is a **payload-contract change at L4**: a tile's value becomes a list of (currency, amount)
pairs rather than a scalar. Make it now, not later.

**Rejected — `partial` with no figure.** Honest but blunt; a finance lead with two legal entities
sees a blank tile on day one and reads the app as broken.

**Rejected — convert to a single reporting currency.** Needs an FX source nobody has specified and
breaks the provenance rule.

---

## D12 — Fixtures on `postman-echo.com` until a real ERP is named (OD3)

**Decided** 2026-08-12 by the product owner.

The sibling app's approved test host after `httpbin.org` went down. Sufficient to prove the
connector, the sync engine, and all four tile states.

**Explicitly still unmet:** the L1-b half of the gate — that a *genuinely different vendor API* is
pure data — which needs a real ERP endpoint. Per OD10 that gate is **not reworded to make it
passable**; it is recorded open. Seeded vendor mapping templates stay `verified: false` until proven
against a real endpoint, and the UI surfaces them as unverified.

---

## D13 — Canonical table names are the architect's, not the BA's

SDK 4.9.0 enforces a **30-character table-name limit**. The scope prefix `x_335329_sn_hr_erp_` is 19
characters, leaving 11. Five table names written into `docs/stories.md` exceed it and **will not
build**: `mapping_template` (35), `document_template` (36), `document_request` (35),
`employee_xref` (32), `document_type` (32).

The canonical short names are published in `docs/l0-scaffold-design.md` §2.2 and **those are the
names that get built**. Where `docs/stories.md` names a table, read the L0 document instead. This is
an SDK-build constraint, not a platform one — the platform allows 80, and this instance carries a
36-character table.

---

## D17 — Hard deny-write ACLs use Shape A. Proven live against a full admin.

**Decided** 2026-08-12 by the main session, executing L0-7 / T0-11 with a real Table API write.
This closes H2, which blocked every deny-write ACL in the app starting with L1's `object_map`.

**Shape A is confirmed.** All ~24 hard deny-write rules use it:

```ts
Acl({
  $id: Now.ID['acl-<table>-field-<field>-write'],
  type: 'record', table: '<table>', field: '<field>', operation: 'write',
  decisionType: 'deny',
  script: 'answer = false;',
  adminOverrides: false,          // MUST be explicit — it defaults to true
})
```

### The evidence

A throwaway `x_335329_sn_hr_erp_acltest` was deployed with two String columns — `probe_open`
(unprotected control) and `probe_protected` (Shape A deny-write) — then written to as **full
admin** via the Table API.

| Step | `probe_open` | `probe_protected` |
|---|---|---|
| POST create, both fields supplied | `open-initial` | **`""` — refused at insert** |
| PATCH, both fields in **one** request | `open-changed` | **`""` — refused** |
| Independent re-read | `open-changed` | **`""`** |

The control field moving in the same request is what makes this interpretable: the ACL denied the
protected field specifically, not the write as a whole. **A full admin cannot write a Shape A
field.** That is exactly the property the provenance columns need.

**Shape B was never needed** and is not built.

### The part that changes how every test must be written

**The refusal is silent.** The Table API returned HTTP 200 with a normal response body. Nothing
errored, nothing warned — the field simply did not change. Any test that asserts on status code
instead of on the re-read value will pass against a completely broken deny ACL.

**Every deny-write assertion in L1–L6 must re-read the value. Never trust the response.**

---

## D18 — Deleting a Fluent `Table()` does not drop the table

Discovered while cleaning up the L0-7 probe. Recorded because it changes what "cleanup" and
"uninstall" mean in this app, and it compounds C2.

Removing `acltest-probe.now.ts` and redeploying **did** remove the ACL (`sys_security_acl` → 0 rows)
and **did** remove the declared columns (`sys_dictionary` retains only the `sys_*` columns). It did
**not** remove the table: `sys_db_object` still carries `x_335329_sn_hr_erp_acltest`, plus an
auto-created `np$x_335329_sn_hr_erp_acltest` shadow view.

`DELETE /api/now/table/sys_db_object/<sys_id>` as full admin returns **HTTP 403**. Dropping a table
requires the browser.

**Consequences:**

1. **Cleanup of any throwaway table is a human, browser-only step.** It cannot be scripted from
   here. The L0 probe table is currently an empty shell awaiting exactly that — recorded as OD12.
2. **It sharpens C2.** Governance asked what happens to staged data on uninstall; the L0 developer
   found ServiceNow's uninstall dialog defaults to *"Retain tables and data"*. This is the same
   behaviour one level down: the platform's consistent bias is to **keep** tables. An app carrying
   90 days of staged ERP financial data must treat table removal as a deliberate, documented,
   human-executed act — never as something a deploy or an uninstall does for you.

---

## L1-D8 — `field_map.logical_field` is a flat choice list; the business rule does the filtering

**Decided** 2026-08-13 by the developer at L1, closing risk **R1-1**, which required this be decided
at L1-7 "not at test time, and record it". The previous session made the decision, cited it in
`src/fluent/tables/choices.ts` as "L1-D8", and was stopped before writing it down. This is that entry.

`docs/l1-control-tower-design.md` §4.2 specifies `logical_field` **"filtered to the parent map's
`logical_object`"**.

**Chosen: an unfiltered flat list of all 58 logical field names, with correctness enforced by the
`before` business rule of L1-8 on every path.**

**Rejected — a platform dependent choice.** The platform filters a dependent choice on a field of the
**same record**. A new `field_map` row does not know its parent's `logical_object` until it is saved,
so the dropdown would be **empty on the New form** — strictly worse than an unfiltered one, and it
would fail T1-11 outright rather than merely making it untidy.

**Rejected — a reference-qualified reference field against a seeded `logical_field` catalogue table**
(R1-1's own fallback). It works, but it adds a fifth table and ~58 seed records at L1 to improve a
dropdown, and the business rule is still required regardless because the Table API evaluates neither
a choice list nor a reference qualifier.

**Cost accepted, and it is real:** an admin mapping `stock_item` is offered `annual_gross_salary`.
They can pick it, and they are refused with
`Unknown logical field 'annual_gross_salary' for object 'stock_item'.` **Verified live via the Table
API on 2026-08-13** — HTTP 403, zero rows created (`docs/l1-build-report.md` §4.4).

**T1-11 is unaffected.** The criterion is *"without typing a JSON brace"*, not *"with a short
dropdown"*. `object_map` carries no JSON column at all.

**Binds:** if L5 ever renders a mapping editor, it should filter the list client-side from
`src/server/contract/objects.ts` — the contract is already the single source of truth.

---

## D19 — Every relative import between `src/server/` modules MUST carry the `.ts` extension

**Discovered** 2026-08-13 by the developer at L1, on the first live execution of a module-backed
business rule. **This is the first real execution of the `require()` bridge D15 deliberately left
unproven, and D15's stated caveat was correct.**

`now-sdk build` and `now-sdk install` both succeeded. All four branches of the L1 config-validation
rule then **did nothing**: four internally-contradictory `erp_system` rows were created with HTTP 201.

**Root cause, from `syslog`, not inference:**

```
ModuleResolutionException: No module with path
  "x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/util/bool" found in sys_module table
```

Modules register in `sys_module` under a path **including `.ts`**
(`<path>…/src/server/util/bool.ts</path>`). The SDK rewrites the **top-level** `.now.ts` → module
import into an extension-bearing `require()`, so that one resolves. A **module-to-module relative
import is emitted verbatim** (`from '../util/bool'`) and the runtime loader looks up a path with no
`.ts` — which does not exist.

TypeScript resolves it fine on disk, so **the build cannot catch it.** `src/server/tsconfig.json`
has carried `"allowImportingTsExtensions": true` since L0; the reason was never recorded.

**Two properties make this the worst class of bug in this application:**

1. **A `before` business rule that throws is SWALLOWED and the record saves.** The Table API returned
   HTTP 201. **A validation rule that crashes is indistinguishable, from the API, from a validation
   rule that approved the record.** Every guard written as a module function in L2–L6 inherits this.
2. It is invisible outside `syslog`. Nothing in the deploy output, the REST response or the record
   indicates a problem.

**Chosen:** every relative import under `src/server/` ends in `.ts`. Guard before deploy:

```bash
grep -rn "from '\./\|from '\.\./" src/server/ | grep -v "\.ts'"     # must be empty
```

and after the first exercise of any module-backed rule:

```
syslog?sysparm_query=messageLIKE@fluent-module^sys_created_on>javascript:gs.minutesAgoStart(30)
  -> must be zero rows
```

**Rejected — abandon module functions for `Now.include()` + IIFE strings.** It dodges the resolver
but discards type checking on the sync engine, the largest body of logic in the app, and `.ts` on an
import is a one-character fix.

**Rejected — inline the shared helper into each consumer.** Three copies of `isTrue()` is how the
sibling's Boolean bug spread in the first place.

**Binds:** L2 ports 12 modules with a dense internal import graph and will hit this on every one.
**And it binds every test in every layer: a clean build, a clean install and an HTTP 2xx together
prove nothing about whether a business rule ran at all.**


# Open items

| ID | Item | Owner | Status |
|---|---|---|---|
| OD1 | Retention for staged data | architect → governance | **Resolved.** `staging_retention_days = 90`, `sync_run_retention_days = 730` — the audit spine deliberately outlives the data it describes. Per-category overrides published but shipped empty. Scoped `ScheduledScript`, ships `active: false`. **Governance approves the number** |
| OD2 | PDF capability | human | **Resolved (a) — labelled HTML.** Re-probed 2026-08-12, unchanged: `sn_pdfgeneratorutils`, `PDFGenerationAPI`, `sys_document_template`, `sn_hr_core_case` all return 0 rows. Detail below. Option (b) remains available any time you install the store app |
| OD3 | Real ERP target | human | **Resolved — see D12.** `postman-echo.com` fixtures. L1-b stays open and unmet |
| OD4 | `field_map` admin surface | architect | **Resolved.** Child `field_map` table, one row per mapped field, edited in a related list with an object-filtered choice list. `object_map.field_map` (the JSON blob) is **deleted entirely** — a generated JSON mirror was rejected because two representations of one truth make a wrong figure unattributable, which story L2-2 fails |
| OD5 | `erp_staging` shape | architect | **Resolved.** One header table: provenance + nine generic typed columns (`amount`, `qty`, `threshold`, `ratio`, `status`, `dim`, `label`, `code`, `occurred_on`) + JSON `payload`. JSON-only rejected (kills `GlideAggregate` and the unique upsert index); per-object tables rejected (a 15th object would become a deploy, killing the config-driven promise) |
| OD6 | Tab 4 reconciliation | architect | **Resolved — display-only.** No match key exists in any mapping, and a partial "12 of 40 matched" hint is the §7 failure mode in a new costume. Zero references to `alm_asset` / `cmdb_ci` anywhere in `src/`, asserted by test |
| OD7 | OEE | architect | **Resolved.** Use supplied `oee` if mapped; else compute `availability × performance × quality` from `production_output`; else not-configured, naming each missing input. Adds `object_map.oee_input_scale` with **no default**, because `0.85×0.90×0.95` and `85×90×95` both look plausible and inferring the scale would silently produce a wrong OEE |
| OD8 | Ampersand in `SN HR&ERP` | developer at L0 | **CLOSED — verified intact, 2026-08-12, on the API-verifiable criteria. No fallback applied.** Two of story L0-2's five criteria are browser-only and remain unexecuted. See OD8 detail below |
| OD9 | This app's logical-object list | architect | **Resolved — 16 objects.** 10 kept from the sibling, **7 dropped** (`opportunity`, `sales_order`, `job_requisition`, `employee`, `labor_cost`, `credit_status`, `receipt`), 5 spec-additive, plus **`backorder`** as new — because D5 forbids a threshold inventing a field and Tab 3 asks for the tile |
| OD10 | L1 gate split | architect | **Resolved, not reworded.** **L1-a met now**: zero application files change when a second ERP is added, proven by an empty `sys_metadata` delta since T₀, with the second fixture differing in pagination style, date format, response root and auth type. **L1-b NOT MET**, blocked on a real vendor API. L1 may only be declared complete if L1-b is recorded open in the same document |
| OD11 | `sys_user_has_role` read is ACL-restricted | main session | **CONFIRMED REAL by live query 2026-08-12. Resolved by D14.** See below |
| OD12 | The L0-7 probe table `x_335329_sn_hr_erp_acltest` is an empty shell left on the instance. Its ACL and its declared columns are gone; the table row and its `np$` shadow view remain. Table API `DELETE` on `sys_db_object` returns 403 — see D18. **Drop it in the browser** at `sys_db_object_list.do`. Until then, §9's "zero throwaway artefacts" is not met | human, browser | **Open** |
| **OD14** | **UNRESOLVED COLLISION between `l1-control-tower-design.md` §6 and §5.3.** §6 puts `object_map.mapping_source` / `.mapping_verified` under Shape A hard deny-write (`adminOverrides: false`) — **verified live 2026-08-13: a full admin cannot write either.** §5.3 step 5 has the "Apply vendor defaults" UI Action write both. Whether a scoped `GlideRecord.update()` inside a UI Action is subject to the same field-level write ACL **has not been established on this instance** — the UI Action cannot be invoked from the Table API. **If it is subject to it, the failure is silent and is the §7 failure mode exactly:** the action inserts the `field_map` rows and reports success, `mapping_source` stays empty, and **the unverified-mapping banner never appears**, because the display rule keys on `mapping_source === 'template'`. Two candidate fixes in `docs/l1-build-report.md` §9.3.1, both architect decisions. **First test to run at L1 sign-off: apply a template, then re-read `mapping_source`.** | architect + tester | **Open** |
| **OD15** | **L1-b is OPEN and NOT MET.** A *genuinely different vendor API* has not been proven to be pure data, and cannot be until OD3 supplies a real ERP endpoint. Both fixtures point at `postman-echo.com`, which answers however it is asked. **L1-a is met** (`sys_metadata` delta = 0 rows, 2026-08-13). L1 is declared complete on L1-a **only because this row exists**. Not reworded, not marked N/A — **blocked**, and blocked items get revisited | human (OD3) | **Open** |
| OD13 | H3 — ampersand AC3/AC4 in a real browser session (Next Experience app picker label, and a `.do` link carrying the name as a parameter). The record-level ampersand is already verified intact | human, browser | **Open** |
| **OD16** | **Two implementations of `isTrue` now exist in this app.** `src/server/util/bool.ts` (L1) and `src/server/connector/util.ts` (L2). `l2-connector-design.md` §2 orders the connector's ported **verbatim, comment included**, and §1 makes any diff outside §4 a defect — so it was ported as written rather than being pointed at the L1 helper. They agree on every value `GlideRecord.getValue()` returns, and they differ in style: L1's deliberately avoids the literal `=== 'true'` so it does not trip I4's own grep, the sibling's contains it. **Two representations of one truth on the single most safety-critical predicate in the app is exactly what OD4 rejected elsewhere.** Consolidation is an architect decision, not a developer one | architect | **Open** |
| **OD17** | **`l2-connector-design.md` §4.4 is self-contradictory.** It restates the sibling's typed C2 rules (*"a non-numeric amount leaves the column empty"*, *"an unparseable date leaves the column empty"*) **and** its own last paragraph defers typed promotion to L3. Both cannot happen at L2: the sibling knew a column was decimal because it had a fixed six-column table, and this app's logical contract (`src/server/contract/objects.ts`) declares field **names**, not types. **Built as:** numeric/date handling applies only where the mapping declares it (`abs`/`negate`/`percent_to_ratio`/`ratio_to_percent` are numeric, `date_only` is a date); everything else passes through as a string, and `parseDate()` / `toNumber()` are exported so L3 uses the same primitives. **The architect should decide** whether the logical contract gains per-field types, or whether L3's promotion table stays the only place types live | architect | **Open** |
| **OD18** | **The L2 gate is NOT MET because nothing in this environment can start an `on_demand` scheduled script.** The gate driver is deployed, disarmed and correct; *Execute Now* is a `sys_trigger` insert, i.e. a **write**, and `now-sdk` has no execute verb. The three refused workarounds — shipping the driver `periodically`+`active`, shipping a `sys_trigger` `Record()` that fires on every install, and rewording the gate — are each the failure this estate has already paid for. **Needs: the admin password supplied inline (never to a file), or a human clicking *Execute Now*.** Procedure in `docs/l2-build-report.md` §1. **This blocks every later layer's live evidence too, not just L2's** | human | **Open** |
| **OD19** | **The six `erp_system` fixture rows exist only on the instance, not in source.** They were created directly via the Table API at L1, and `erp_system.name` is uniquely indexed, so declaring them as `Record()` would collide and create a second set. L2's 11 `object_map` and 15 `field_map` fixtures reference them by the sys_id a live query returned. Consequence: **a source-only deployment to a fresh instance ships the connector, the maps and the field mappings, and dangling `erp_system` references.** R2-4 ("every fixture change is a source change") is therefore only half true today | architect | **Open** |

## OD11 detail — the role check may fail closed while passing every admin test

Found by the architect in design, not in test. The platform's jump-start ACL restricts read on
`sys_user_has_role` to the `itil` role. Every story in this app mandates querying that table for
role checks, because §9 records that `gs.hasRole()` lies under `runAs`.

If that ACL is active, a `finance_viewer`'s scoped query against `sys_user_has_role` returns **zero
rows** — so **D6 fails closed**: the user holds the role, the check says they do not, the monetary
tiles render access-restricted to exactly the people entitled to see them. And it passes every test
run as admin, because admin can read the table.

This is the worst bug class in this app: a silently wrong answer on a role check.

### Live verification, `dev296062`, 2026-08-12 — the ACL is active. Spike A is not needed; it is answered.

Three **active** read ACLs exist on `sys_user_has_role`:

| ACL sys_id | `admin_overrides` | Roles granted read |
|---|---|---|
| `8bb1de220a0a0b4400b22b63058d1810` | **true** | `role_delegator`, `user_admin`, `itil` |
| `937ff319ff072210459effffffffffba` | false | `role_delegator_admin` |
| `bb332892ff5322103ad8ffffffffff0c` | false | `ai_user_admin` |

A user passes if they hold **any** of those five roles. A plain `x_335329_sn_hr_erp.finance_viewer`
or `hr_viewer` holds **none** of them.

Scoped `GlideRecord` is security-aware — unlike global-scope `GlideRecord`, it enforces ACLs. So a
scoped query against `sys_user_has_role`, running as a genuine `finance_viewer`, returns **zero
rows**. The role check answers "this user does not hold the role" about a user who does.

And `admin_overrides: true` on the first ACL is precisely why this would have shipped: **every test
run as admin passes.** The architect found this by reading, not by testing, which is the only way it
was ever going to be found before production.

---

## D14 — Role checks use `gs.hasRole()` in user-session context; the platform's own ACLs do the enforcing

**Decided** 2026-08-12 by the main session, resolving OD11 against live evidence.

§9's trap is narrower than the stories generalised it to. `gs.hasRole()` lies **under `runAs`** —
that is, inside scheduled jobs executing as an impersonated user. It is accurate in a genuine user
session. The stories turned that specific caveat into a blanket "always query `sys_user_has_role`",
and that blanket rule is **unrunnable on this instance** for exactly the roles it was meant to
protect.

**Chosen, in three parts:**

1. **Record access is enforced by ACLs, not by application code.** The platform evaluates the
   hand-written table and field ACLs on this app's own tables. No scoped code needs to ask "does
   this user hold `finance_viewer`" in order to make a record readable or not.
2. **Payload shaping in the L4 REST API uses `gs.hasRole()`.** A Scripted REST API executes in the
   caller's real session — the one context where `gs.hasRole()` is reliable — and the only thing it
   decides is whether a monetary tile is rendered as a figure or as access-restricted (D6).
   Belt-and-braces, not the security boundary: if it were ever wrong, the ACLs still hold.
3. **Scheduled sync jobs make no role checks at all.** They run as system, fetch from ERPs, and
   write staging rows. There is no user whose entitlements matter in that path — which is why the
   `runAs` caveat never applies to it.

**Rejected — query `sys_user_has_role` from scoped code.** Verified impossible for the intended
roles on this instance, and it fails **closed and silently**.

**Rejected — grant `itil` (or any of the five) to `viewer`.** Fixes the symptom by handing this
app's users a broad platform role. That is a far larger privilege grant than anything this app
otherwise makes.

**Rejected — a Global-scope Script Include with elevated read.** Would work, but the app creates no
Global-scope records by design, and this would be the single exception — a standing
privilege-escalation surface, added to dodge a check that ACLs already perform.

**Binds the tester:** the assertion "verified as a genuine non-admin user holding only the intended
role" is now doing double duty. It proves D6, and it proves this decision. **Admin does not count,
and on this specific check admin is actively misleading** — `admin_overrides: true` means admin
passes the very ACL that denies everyone else.

## OD2 detail — PDF generation on `dev296062`

Probed by read-only Table API queries on 2026-08-12. Findings:

| Probe | Result |
|---|---|
| `sys_plugins` `com.snc.apppdfgenerator` (PDF Generation Utilities) | **active** |
| `sys_plugins` `com.snc.whtp` (WebKit HTML to PDF) | **active** |
| `sys_scope` `sn_pdfgeneratorutils` | **absent** |
| `sys_script_include` `PDFGenerationAPI` (any scope) | **absent**. Only `PDFtoTable*` (`sn_pdf_table_bldr`, a PDF *extractor*) and `PDFlow*` (global, unrelated) |
| `sys_processor` PDF entries | `PDFProcessor` / `ReportPDFProcessor` / `SaPdfProcessor` exist — these are the classic **URL-driven form/list/report "print to PDF"** processors, not a scoped scriptable API |

**Conclusion: there is no confirmed scoped API for generating a PDF from arbitrary HTML on this
instance.** The active plugins provide the platform's own print-to-PDF surfaces, which are bound to
a form/list/report rendering path, not to a document assembled by this app.

Two ways forward, and this is a human choice:

- **(a) Ship labelled HTML.** `document_request` states `HTML` as the output format and never claims
  PDF. Zero licence dependency, no store install, honest. **This is the default the design assumes.**
- **(b) Install the "PDF Generator Utilities" store app** (`sn_pdfgeneratorutils`), which supplies
  `PDFGenerationAPI.convertToPDF()` / `.convertToPDFWithHeaderFooter()`. Requires a human to install
  it from the ServiceNow Store on `dev296062`. If installed, L6 produces real PDFs and the design
  changes only in the renderer, not in the data contract.

Until (b) happens, **(a) is what gets built**. §8.3 non-negotiable: a file is never labelled PDF
unless it is one.

---

## OD8 detail — the ampersand in `SN HR&ERP`, closed at L0 on 2026-08-12

**Verdict: intact. The display name stays `SN HR&ERP`. The `SN HR and ERP` fallback was not
needed and was not applied.**

Evidence, all read back from `dev296062` via the Table API after `now-sdk build && now-sdk install`:

| Story L0-2 criterion | Result |
|---|---|
| AC1 — `sys_app.name` reads back as the literal `SN HR&ERP` | **PASS.** `now-sdk query sys_app -q "scope=x_335329_sn_hr_erp"` returns `"name": "SN HR&ERP"` — not `&amp;`, not `&#38;`, not truncated at `SN HR`. `sys_scope.name` returns the same |
| AC2 — the generated update-set / application-file name contains the literal `&` | **N/A, and the reason matters.** `now-sdk install` ships a scoped application, not a captured update set. `now-sdk query sys_update_set -q "nameLIKESN HR"` returns **zero rows** — there is no update-set artefact to inspect. The equivalent name-carrying artefacts that *do* exist — `sys_app.name`, `sys_scope.name`, `sys_app_application.title` / `.name` / `.hint` — all read back with the literal `&`. `docs/change-manifest.md` §1 already anticipated this ("`now-sdk install` ships a scoped application, not a captured update set") |
| AC3 — the app opens from the Next Experience picker and the label reads `SN HR&ERP` | **NOT EXECUTED — browser required.** The `sys_app_application` record carries `title = SN HR&ERP` and `name = SN HR&ERP` verified by query, so the label *stored* is correct; whether the shell *renders* it correctly is unverified |
| AC4 — a URL interpolating the app name loads without truncating at `&` | **NOT EXECUTED — browser required.** Mitigated structurally rather than tested: `docs/l0-scaffold-design.md` §6.3 already mandates that **no** document, table label, property name or URL in any layer interpolates the app name, so no such URL is generated by this app in L0–L6 |
| AC5 — failure path | Not triggered. Nothing failed |
| AC6 — OD8 closed either way | **Closed here** |

**Extra evidence beyond the story.** The ampersand also round-tripped intact inside a *field value*
rather than a record name: `sys_user_role.description` for `x_335329_sn_hr_erp.viewer` contains
"the SN HR&ERP hub" and reads back with the literal `&`. And in the build output the SDK correctly
XML-escapes to `SN HR&amp;ERP` inside the `.xml` payload, which the instance then un-escapes on
import — escaping in the artefact is correct behaviour, not the corruption AC1 is looking for.

**Residual risk, stated rather than hidden:** AC3 and AC4 need a human with a browser. They are the
two criteria most likely to expose a rendering or query-string defect, and they are the two that
were not run. OD8 is closed as *"verified intact on every criterion a Table API can reach"*, and the
two browser criteria are handed to the tester. If either fails, reopen OD8 — the fallback is a
one-line change to `now.config.json` `name` with `scope` and the npm package name unchanged.

---

## D15 — F7 resolved by build: `ScheduledScript.script` DOES accept a module function

**Decided** 2026-08-12 by the developer at L0, step L0-9, resolving `docs/l0-scaffold-design.md` F7.

The two SDK documents genuinely contradict each other, and **`module-guide` is the correct one**:

- `scheduled-script-guide` instruction 2: *"The ScheduledScript API only accepts strings, so
  reference an external `.js` file with `Now.include(...)`. The script must use an IIFE"*, and later
  *"Unlike BusinessRule and ScriptAction, the ScheduledScript API does not accept function types.
  Module imports will produce a TypeScript error."*
- `scheduledscript-api`'s own type signature: `script?: string | (...args: any[]) => void`.

**Settled empirically, not by reading.** A throwaway `ScheduledScript` was declared with
`script: f7SpikeJob` (a function imported from `src/server/spike-job.ts`), `active: false`,
`frequency: 'on_demand'`, and built. **The build succeeded**, and the generated
`sysauto_script_*.xml` contains the SDK's own module bridge:

```
// @fluent-module f7SpikeJob;false;x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/spike-job.ts
// WARNING: This code is generated by the ServiceNow SDK in order to provide
// support for modular JavaScript. …
const { f7SpikeJob } = require('x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/spike-job.ts');
f7SpikeJob();
```

No TypeScript error, no diagnostic. The `scheduled-script-guide` text is stale for SDK 4.9.0.

**Chosen:** L3's sync engine, L3's `RetentionCleaner` and every test driver write their bodies as
**module functions** in `src/server/`, not as `Now.include()` + IIFE strings. This keeps them
type-checked and unit-testable, which the string form does not.

**Rejected — `Now.include()` + IIFE.** Still works and is still what the guide says; it costs the
type checking on the largest single body of logic in the app (the sync engine) for no benefit now
that the module form is proven to build.

**Scope of this decision, stated honestly:** this proves the **build** form. The spike was
deliberately **never installed**, so the `require()` bridge has **not been executed on the
instance**. §9 records that `require()` throws inside a *remote-table* script; a `sysauto_script` is
not a remote table, and `module-guide` documents this exact bridge as supported — but the first L3
job to actually run is the proof, and if it throws, the fallback is `Now.include()` + IIFE and this
decision gets a superseding entry.

---

## D16 — Four Global-scope records are created by the platform when this app's roles deploy

**Recorded** 2026-08-12 by the developer at L0, step L0-12 / test T0-4.

`docs/l0-scaffold-design.md` L0-12 and `docs/change-manifest.md` §2.1 both assert **zero** Global
records. Verified after deploy:

```
now-sdk query sys_metadata -q "sys_scope=global^sys_created_on>javascript:gs.beginningOfToday()"
→ 4 rows, all sys_class_name = sys_embedded_help_role, all sys_created_by = "system"

now-sdk query sys_embedded_help_role -q "sys_created_on>javascript:gs.beginningOfToday()"
→ role = 0d725b70d93647d1af7c843fa8da56ec  (x_335329_sn_hr_erp.hr_viewer)
  role = 76615979f2574cae8243969c09518e1c  (x_335329_sn_hr_erp.finance_viewer)
  role = 11031a92b26c4e7ab34910721c4d2504  (x_335329_sn_hr_erp.viewer)
  role = 875163d8147a4574bccc6c8814c8211f  (x_335329_sn_hr_erp.admin)
```

Four Global rows, one per app role, pointing at exactly this app's four role sys_ids.

**They are not in this app's source and not in its deploy payload.** `dist/app/` contains
`sys_app`, 2 × `sys_module`, 4 × `sys_user_role`, 6 × `sys_properties`, 1 × `sys_app_application`
and nothing else. `sys_embedded_help_role` is an automatic platform side-effect of creating any
`sys_user_role`, written by `system`.

**Chosen:** the criterion is **reworded, not waived**. L0-12 / T0-4 now reads:

> No Global-scope record is created **by this application's source or deploy payload**. Platform
> side-effects of creating in-scope records are enumerated and attributed. As of L0 the complete
> list is four `sys_embedded_help_role` rows, one per app role.

**Rejected — declare the criterion met and say "zero".** It is not zero, and a later reviewer
running the same query would find four rows and have no way to tell an automatic side-effect from
an accidental Global write. Enumerating them is what makes the *next* unexplained row a finding.

**Rejected — treat this as a violation and stop.** The records are `system`-authored metadata about
roles that legitimately exist; there is no Global *code*, no Global business rule, no Global script
include, and nothing this app can do to suppress them short of not having roles.

**Binds the tester:** the Global-scope query is expected to return exactly these four rows and no
others. **A fifth row is a finding.**

---

# L2 — connector runtime. Decisions taken or confirmed at build time, 2026-08-13

L2-D1 … L2-D6 were taken by the architect in `docs/l2-connector-design.md` §10 and are restated
here **only where the build changed or sharpened them**. L2-D7, OD16 and OD17 are new.

## L2-D1 (confirmed at build) — `not_configured` is a first-class `CallStatus` and `call_log` choice

Built exactly as designed: four pre-flight branches (`SYSTEM_INACTIVE`, `MAP_MISSING`,
`MAP_INACTIVE`, `MAP_UNMAPPED`) all return `status: 'not_configured'`, each with its own
`errorCode`.

**Behaviour change from the sibling that L4 must not inherit blindly:** the sibling returned
`failure` / `SYSTEM_INACTIVE` and `failure` / `MAP_INACTIVE`. Any L4 error-rendering code copied
from the sibling will render "ERP did not answer" for what is now a configuration state. Kickoff
§7 makes that distinction the product.

**Binds:** `recordFailure()` excludes `not_configured` as well as `circuit_open`. The shipped line
is `gr.addQuery('status', 'NOT IN', 'circuit_open,not_configured')`. **This is the single most
dangerous line in the port.** Reverting it to the sibling's `!= 'circuit_open'` makes one unmapped
object trip the breaker on a healthy ERP and take the other 13 objects down, silently.

## L2-D4 (confirmed live) — `accessibleFrom: 'package_private'` on `ErpConnector`

Deployed and verified: `sys_script_include` reads `access = package_private`,
`api_name = x_335329_sn_hr_erp.ErpConnector`, `active = true`.

**Consequence, recorded because it cost this layer its gate:** a Global-scope background script
cannot call the connector, which is why the drivers are in-scope scheduled scripts — and an
`on_demand` scheduled script can only be started by a **write** to the instance. `now-sdk` has no
execute verb, so **every live proof from L2 onwards needs either the admin password or a browser.**
Plan for that at the start of a layer, not at its gate.

## L2-D7 — `zero_is_meaningful` is applied in `field-mapper.mapRecord`, not deferred

**Decided** 2026-08-13 by the developer, because `l2-connector-design.md` §4.4 says the flag is
carried but never says where it is applied.

**Chosen:** `mapRecord` drops a value that is `''`, `null` or `0` unless the field's mapping
declares zero meaningful (L1 §4.4, story L6-4). An **absent key** is how this mapper spells
UNAVAILABLE, and `field-mapper` is the only place that holds both the value and the flag.

**Rejected — carry the raw value through and let L6 decide.** It puts the decision in the layer
furthest from the mapping row, and L6 is where the consequence is a salary certificate printed
with a `0` on it. Deciding late means deciding in three places.

**Rejected — apply it in L3's promotion step.** Same objection, plus L3 would need the
`field_map` rows a second time.

**Exposed rather than hidden:** the predicate is exported as `isUnavailable(raw, zeroIsMeaningful)`
so L3 and L6 can assert on it instead of re-implementing it.

## L2-D8 — the 19 ported cases keep their identifiers; the design's "21" is not made true by inventing two

`l2-connector-design.md` §1/§9 says "21 ported cases" and names the range **T15–T33**, which is
19 identifiers. The sibling's own build report lists 19 — T15–T28, T29 (review-only), T30–T32, and
T33 (a grep).

**Chosen:** port 19, keeping every original identifier, and record the discrepancy.
**Rejected — split or duplicate cases to reach 21.** R2-2's whole mechanism is that a gap in a
numbered sequence is visible; padding the sequence destroys it.
**Rejected — quietly report "21/21".** That is the sibling's recorded T32b mistake repeated.

## L2-D9 — the gate's CLOSE path is demonstrated on System A, not on System C

`l2-connector-design.md` §8 implies all three `circuit_open_until` reads happen on System C.
System C is `BROKEN-FIXTURE` at `erp-invalid.invalid`; **nothing there will ever answer**, so its
breaker can open but can never close, and repointing it is the fixture edit R2-4 forbids.

**Chosen:** System C provides reads 1 and 2 (the forced failure and the breaker OPENING against a
genuinely unreachable host). System A — tripped by real HTTP 503s — provides the full
empty → future → empty sequence including the CLOSE. Both are logged and labelled.
**Rejected — repoint System C so it can succeed.** R2-4, and it destroys the only fixture that
proves an unreachable host.
**Rejected — omit the close path.** The sibling initially missed it and the design calls that out
by name.


---

# L3 / L4 — staging, sync and API. Decisions taken at build time, 2026-08-13

Scope note: the product owner's standing instruction for this build is **ship code, defer
testing**. Neither gate is claimed. Every item below is a design/build decision, not evidence.

## L3-D8 — every job ships `on_demand` + `active: false`, overriding the designs' `daily`

`l3-staging-design.md` §4.6 and §6.3 specify `frequency: 'daily'` + `active: false` for the
scheduled sync and the retention cleaner. **Shipped `on_demand` + `active: false` on all four L3
jobs**, per the product owner's standing constraint.

This is strictly stronger, not a reword: `on_demand` has no interval to fire on even if `active`
is flipped, so it is two independent locks. Arming for production is a **source** change to both
fields with a diff, which is what OD1's approval should leave behind.
**Rejected — ship `daily` + `active: false` as designed.** One lock, and `installMethod: 'demo'`
records ignore a redeploy for `active`, so a later mistake would be unrecoverable from source.

## L3-D9 — a `sync_request` table is the refresh queue

§4.6 says the L4 API "enqueues" and a drainer "drains the queue" without saying what the queue is.
It cannot be `erp_staging` (no create ACL, by design), cannot be a fifth `sync_run` status (story
L3-2 AC2 fixes that list at exactly four), and cannot be a `sys_property` (write is admin-only and
a viewer must be able to press Refresh). **Chosen: a three-column table, create granted to
`viewer`** — the same reasoning as `call_log`'s create ACL. The row holds a **category** and there
is no encoding for "everything", so a fan-out is inexpressible rather than merely forbidden.

## L3-D10 — `FetchParams.absoluteUrl`, added to the L2 connector

`pagination_style = next_url` cannot be expressed as an extra query string. Added one optional
field to `FetchParams` and three lines to `buildEndpoint`; every existing caller is unchanged.
The L3 loop validates the candidate URL's scheme+host against `erp_system.base_url` **before**
passing it, mirroring the connector's `setFollowRedirect(false)` reasoning. An off-host next URL
is end-of-pages and is recorded.
**Noted against L2-D6** ("a diff beyond §4 is a defect"): this is an additive L3 requirement from
`l3 §4.5`, not a change to ported behaviour, and it is recorded rather than made quietly.

## L3-D11 — one query loads the existing staged rows for a pair; §4.2's chunked `IN` is not used

§4.2 specifies a chunked `IN` over the response's `source_record_id`s. **Chosen: one query for the
whole (system × object) pair**, reused for both the upsert match and §4.3's reconciliation.
Strictly fewer queries — one, not `ceil(N/500)` — and §4.3 needs exactly the same set anyway, so
the specified approach reads the same rows twice. Story L3-3 AC4's property (a bounded count
independent of N) holds either way.

## L3-D12 — a tenth promoted column, `delta`, because the designs' comparison mechanism does not exist

`l4-api-design.md` §7.2 and `l3-staging-design.md` §3.1 both assert that the promoted columns make
`qty < threshold` *"expressible in one encoded query"*. **They do not.** ServiceNow's field
comparison offers `[is same]` / `[is different]` plus two **date-only** range operators
(`ServiceNowOfficialDocs/platform-user-interface/r_ComparingFieldValues.md`, "Available
operators"). There is no numeric field-to-field `<`.

The alternatives were: compare in script over every row — the N+1 story L4-4 exists to forbid — or
precompute. **Chosen: `delta` = `qty - threshold`, computed per row at stage time**, empty when
either side is absent. Story L5-6 AC7's requirement is unchanged and still met: the comparison is
against **each item's own** safety stock. `safety_stock` unmapped ⇒ `delta` empty ⇒ the tile is
`not_configured` naming the field, never a comparison against zero.
**Binds L5:** the reorder list orders by `delta`, and `threshold` is still on the row for display.

## L4-D8 (D11) — mixed currency renders per-currency subtotals, not a blank

`l4-api-design.md` §5.4 renders a mixed-currency tile as `partial` with **no figure**. D11 (product
owner) overrides that: the tile carries the subtotals it can honestly state.
**Contract:** `st: "partial"`, **`sub: [{cur, v}]` present**, **`v` absent**, `deg` naming the
currencies. `v` stays absent deliberately — a scalar there would be a meaningless total, and D11
changed the shape of the value, not the honesty rule. Recorded in `docs/api-contract.md`.

## L4-D9 — `gs.hasRole()` is the payload-shaping check, and T4-19 is superseded

T4-19 greps for `gs.hasRole` and expects zero hits. **That test predates OD11's live verification
and D14's resolution and is recorded as superseded, not worked around.** Querying
`sys_user_has_role` from scoped code is verified impossible on this instance for exactly the roles
it was meant to protect, and it fails **closed and silently** while passing every admin test.
`src/server/api/role-check.ts` is the single call site; the platform's own ACLs remain the
security boundary and this only decides figure-vs-`restricted`. **Scheduled jobs make no role
check at all**, so the `runAs` caveat never reaches them.

## OD20 — the design's "8 queries per request" is not reachable with per-tile filters

| ID | Item | Owner | Status |
|---|---|---|---|
| **OD20** | `l4-api-design.md` §7.1 budgets **one** `GlideAggregate` for **all** KPIs on a tab (query 6) and one for all charts (query 7). That is only true if every KPI shares a filter, and they do not — `fin_ar` filters `status != paid`, `inv_low_stock` filters `delta < 0`, `proc_ytd_spend` filters a date window. **Built as one aggregate per tile.** The measured budget is 6 per-tab queries + 1 per KPI + 1 per chart + 1 per list (+1 for the OEE tile's row read): **11 for Tab 1, 10 for Tab 2, 9 for Tab 3, 10 for Tab 4, 10 for Tab 5.** It is independent of row count and of system count — the property story L4-4 AC1/AC2 actually tests — and NOT independent of tile count. The architect should either re-budget §7.1 to the real numbers or state a different aggregation strategy | architect | **Open** |
| **OD21** | **The L3 and L4 gates are NOT MET and were NOT ATTEMPTED**, per the product owner's scope change. Both drivers/endpoints are deployed. The L3 gate driver is disarmed and needs the same *Execute Now* trigger OD18 is blocked on; the L4 gate needs 20 payload captures against manipulated fixtures. Neither is reworded | human + tester | **Open** |
| **OD22** | **`x_335329_sn_hr_erp_staging` carries no fixtures.** L3-15 (50-row / 5,000-row / empty-array / back-dated sets) was **not built** — it is test material and testing is deferred. Consequence: `GET /data` currently returns `not_configured` or `failed` on every tile, which is correct behaviour for an unsynced instance but is not evidence of anything. T3-9, T4-20 and T4-22 are all blocked on it | tester | **Open** |
| **OD23** | **Whether the engine's inserts survive the seventeen Shape A deny-write field ACLs was reasoned, not executed.** `KB0677278 - ACL evaluation for server-side and client-side scripts` states that server-side scripts using the GlideRecord API are **not subject to ACLs** (`GlideRecordSecure` being the exception), so a `system`-context insert should write every provenance column while a Table API `PATCH` is still refused (T3-2). **That is a citation, not a run.** If it is wrong, L3 is dead on arrival and the symptom is silent (a Shape A refusal is HTTP 200, field unchanged). **First thing to run in the test pass** | tester | **Open** |

---

# L5 + L6 — decisions and open items (2026-08-13)

## L5-D9 — the application menu gains `viewer`, so the hub module is reachable

`app-menu.now.ts` shipped `roles: [admin]` at L0, correctly, because every module it carried was a
configuration surface. L5 adds the **ERP Hub** module, and story L5-2 AC2 requires a `viewer`-only
user to reach the hub **in one click**. An admin-gated *menu* hides a viewer-gated *module* inside
it, so the criterion would have failed on the container rather than the link.
**Chosen:** `roles: [admin, viewer]` on the menu; every config module keeps its own `[admin]` list,
so a viewer sees the menu with exactly one entry in it.
**Rejected — a second application menu for viewers.** Two navigator entries with the same name is a
support question, and the module-level role list already does the work.

## L5-D10 — a currency tile prints no currency symbol

`fmt: 'currency'` arrives with **no currency code** unless the tile is mixed-currency, in which case
D11's `sub: [{cur, v}]` carries one code per subtotal. A single-currency `v` carries none.
**Chosen:** grouped digits, no symbol; `sub` renders `GBP 1,204 · EUR 900`, each subtotal owning its
own code.
**Rejected — take the symbol from a property or the instance default.** Printing "£" beside a figure
an ERP reported in EUR is exactly the class of confident wrong number this app exists to prevent.
**Open for the human:** if a symbol is wanted, the honest fix is a `currency` key on the tile
envelope, which is a one-line L4 change, not a client-side guess.

## L5-D11 — `TextLink` has no `target` / `rel`; `opensWindow` is the supported prop

`l5-ui-design.md` §4.5 writes `<TextLink href target="_blank" rel="noopener noreferrer">`.
`@servicenow/react-components@0.1.8` exposes neither prop; the documented equivalent is
`opensWindow`, which also announces "link opens in new window" to assistive technology.
**Chosen:** `opensWindow={true}`. The AC5 substance — the deep link carries no ServiceNow session
artefact — is a property of the URL, which is joined server-side, not of the anchor's attributes.
**Unchanged:** when `link` is absent there is **no anchor element at all**, not a disabled one.

## L5-D12 — one generic tab layout, not five hand-written ones

The payload already declares each tab's KPIs, charts and lists in render order, plus Tab 4's
standing note and Tab 2's caveat. **Chosen:** a single `TabView` over `k` / `c` / `l`.
**Rejected — five per-tab layout components.** Five places for a tile to acquire its own
interpretation of "no data" is risk R5-2 written into the file tree.

## L6-D8 — `hasHrViewer()` uses `gs.hasRole()`, and story L6-3 AC4 is superseded

`l6-document-design.md` §4.1 says the boundary must use "the same single mechanism L4 uses" **and**
"never `gs.hasRole()`". Those are now contradictory: L4-D9 established that querying
`sys_user_has_role` from scoped code returns **zero rows** on this instance for exactly the roles it
protects, so the check would refuse an `hr_viewer` their own privilege, fail closed and silently,
and pass every admin-run test. **Chosen:** `gs.hasRole()`, in `src/server/api/role-check.ts`, the
app's one role-decision file. The `runAs` caveat does not reach it — a `before insert` rule runs in
the submitter's real session, never in a scheduled job.

## L6-D9 — the two live-only objects' logical field names are RENAMED to the document names

`objects.ts` had `employee_profile.full_name` / `.hire_date` and `payroll_record.currency`;
`l6-document-design.md` §3.2 requires `employee_full_name`, `employment_start_date`,
`salary_currency` (plus a new `employment_status`) and states that these ARE the contract's names.
Spec §8.1 makes the naming the deliverable.
**Chosen:** rename, and add `employment_status`. **Verified first:** `object_map` where
`logical_object IN (employee_profile, payroll_record)` returned **zero rows** on dev296062, so there
are no `field_map` children and no `sync_run` / `call_log` history to orphan — and both objects are
live-only and can never appear in `erp_staging`. `scripts/check-contract.mjs` passes.
**Rejected — add the new names alongside the old.** It would offer an admin `full_name` **and**
`employee_full_name` in the same picker: a guess waiting to happen on a salary certificate.

## L6-D10 — the PDF probe reports PRESENCE; callability is proven by the bytes

The design's probe is a `sys_script_include` lookup **plus** a guarded `typeof` on the class. The
`typeof` half **cannot be written**: the platform build rejects `global` / `globalThis` in a scoped
module (`no-unsupported-node-builtins`) and the symbol is not declared, so there is nothing to test.
**Chosen:** the record lookup alone sets `pdf_probe_result`, and `resolveFormat()` refuses to label
anything PDF unless the converter returned real `%PDF-` bytes (L6-D6). A present-but-uncallable API
therefore yields HTML, correctly labelled — not a crash and not a lie.

| ID | Item | Owner | Status |
|---|---|---|---|
| **OD24** | **The L5 gate and the L6 gate are NOT MET and were NOT ATTEMPTED**, per the product owner's standing scope. Nothing in `src/client/`, `src/server/hr/` or the three L6 business rules has executed. A clean build, a clean install and a rendering page prove none of them | human + tester | **Open** |
| **OD25** | **§4.3's `state-renderer` assertion harness was not written** (8 exact sentences). It is test material and testing is deferred. Consequence: T5-5 and T5-6 have nothing to run, and the eight sentences — which the design calls the deliverable — are unverified. It is ~40 lines against an already-pure function | tester | **Open** |
| **OD26** | **`docs/l6-platform-seam.md` (build step L6-14, story L6-2 AC6) was not written.** Every hand-rolled piece and the platform feature it stands in for. §3.3's three options are recorded in the design and unresolved | architect | **Open** |
| **OD27** | **§3.3's seam conflict is still unresolved by a human.** Option (a) is what shipped: `DocumentContext` is in-memory, `required_fields` is the machine-readable declaration, placeholder names are identical. Option (b) reverses D2; option (c) splits the catalogue across two mechanisms | human | **Open** |
| **OD28** | **The record producer does not hide `subject_employee` from non-`hr_viewer` callers.** The design asks for it hidden and defaulted; the *boundary* is the `before insert` rule and holds on every path including the Table API, so this is UX, not security — a non-`hr_viewer` who names somebody else is refused with a stated sentence. A catalog client script would add the hide | architect | **Open** |
| **OD29** | **The producer's optional `purpose` variable was dropped.** It maps to no column on `doc_req`, so it would persist free text about an HR request in `question_answer` with no retention story. Add the column first if it is wanted | human | **Open** |
| **OD30** | **`POST /refresh` still queues into a void.** The L3 refresh drainer and the new L6 document drainer both ship `on_demand` + `active: false`. The hub's refresh control says **"Refresh QUEUED … these figures will not move until an administrator runs it"**, verbatim and deliberately. Arming either job is a source diff | human | **Open** |

## Vendor connector profiles — raised 2026-08-14 by `docs/vendor-integration-research.md`

Research and design only. **Nothing in that document has been built, deployed or executed**, and
**OD18 still governs it**: no connector call has ever run on this instance, so every vendor profile
is theory. `docs/DEFERRED.md` is deliberately not edited.

| ID | Item | Owner | Status |
|---|---|---|---|
| **OD31** | **Four vendors' seeded `mapping_template` rows are now KNOWN wrong, not merely unconfirmed** — `unit4` (endpoint, response root, pagination style all wrong), `sap_s4` (six invented service names, and `date_format` guaranteed to miss on OData V2), `oracle_fusion` (two invented resource names), `dynamics_365_fo` (missing `cross-company=true`, so it silently reports one legal entity as the estate). Their `source_note` says "NOT confirmed", which was honest then and is stale now. **Decide: correct the structural hints and BLANK the unverifiable `field_map` payloads (recommended), or correct the hints and leave the guessed payloads standing.** L1-D5's logic — an unfounded guess is worse than an absent one — argues for blanking | architect + human | **Open** |
| **OD32** | **BLOCKS making a Salesforce system `active`.** `src/server/api/tabs.ts` filters every tile by logical object and **never by `erp_system`**. A `salesforce` system mapped to `fixed_asset` therefore has its rows counted inside the existing Tab 4 asset tiles, blended with real ERP fixed assets in a single KPI. Provenance survives in `erp_staging.erp_system` and in the row list; the *number* does not. Is one blended estate figure right (the app's premise), or is a CRM `Asset` a different kind of thing that must not be summed with an ERP fixed asset? **This is a UI decision, not an architecture one.** Until answered, the Salesforce `erp_system` row ships `active = false` | human | **Open** |
| **OD33** | **An empty `response_root` plus a vendor that returns a top-level JSON ARRAY on error renders a failure as one valid record.** `mapResponse` accepts any array at the configured root; Salesforce's error body **is** a top-level array (`[{"message":…,"errorCode":…}]`). Salesforce itself is safe because its `response_root` is `records`, and Unit4 is safe because its error body is an object — but `generic_rest` with an empty `response_root` is not, and that is the escape-hatch profile most likely to meet an unknown API. This is the four-state rule leaking through a door it does not watch. **Decide: leave it, or have `mapResponse` reject an array whose first element carries no mapped source field** | architect | **Open** |
| **OD34** | **Salesforce `User` as an `employee_profile` source is refused by default, and that refusal should be confirmed.** `Id`/`EmployeeNumber`, `Name`, `Department`, `Title`, `IsActive` map cleanly to four of seven logical fields — but `employment_start_date` has no source on `User`, `payroll_record` has none at all, and this object exists to render **salary certificates** (L6). A certificate built from a CRM user record with a blank start date is what D2 and L6-D9 exist to prevent. If the owner wants it as a live-only demo target anyway, that is a decision, not a default | human | **Open** |
| **OD35** | **NetSuite's REST shape fits the connector; its authentication cannot be performed by it.** NetSuite OAuth 2.0 M2M is client credentials with a **signed JWT client assertion**; the legacy alternative is OAuth 1.0a request signing. `rest-client.ts` has exactly one branch per `auth_type` (`basic` / `oauth2` / `mutual`) and neither is expressible. Building it means a new `auth_type`, a new profile column on `erp_system`, key material management and a signing step. **Recommendation: do not build it** — NetSuite is not a named customer system and this would be a signing flow nothing exercises. Recorded so it is a visible decision, not an omission | architect | **Open** |
| **OD36** | **`mapping_template` has no `query_template_hint` column**, so a query string that belongs to the *vendor profile* rather than to customer data cannot be templated. Three vendors need one: D365 `cross-company=true` (**silent wrong-scope figure without it**), Unit4 `generalLedgerTransactions` `posted=true` (error 1020 without it), SAP V2 `$format=json`. This is the **only new column** the vendor research asks for. Adding it is a String(500) on a `package_private`, unaudited table plus a two-line change to L1 §5.3's copy-hints-where-empty loop — but D18 applies and it is still a schema change | architect + governance | **Open** |

## OD37 — the `sap_s4` and `unit4` seeds corrected. Raised and closed 2026-08-16.

**This resolves OD31 for two of its four vendors** by taking its recommended option (b): correct
the structural hints against documentation read live, and **blank the unverifiable `field_map`
payloads**. `oracle_fusion` and `dynamics_365_fo` are untouched and OD31 stays open for them.

### What was actually wrong, and what replaced it

Every endpoint below was read from vendor documentation on **2026-08-16** and is cited in the
row's own `source_note`, so the citation travels with the record rather than living only here.

| Vendor / object | Was | Now | Basis |
|---|---|---|---|
| `sap_s4` / `invoice` | `API_INVOICE_SRV/Invoice` | `/sap/opu/odata/sap/API_BILLING_DOCUMENT_SRV/A_BillingDocument` | verified |
| `sap_s4` / `vendor_invoice` | `API_VENDOR_INVOICE_SRV/VendorInvoice` | `…/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice` | verified |
| `sap_s4` / `gl_summary` | `API_GL_SUMMARY_SRV/GlSummary` | `…/API_JOURNALENTRYITEMBASIC_SRV/A_JournalEntryItemBasic` | verified |
| `sap_s4` / `purchase_order` | `API_PURCHASE_ORDER_SRV/PurchaseOrder` | `…/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder` | verified |
| `sap_s4` / `requisition` | `API_REQUISITION_SRV/Requisition` | `…/API_PURCHASEREQ_PROCESS_SRV/A_PurchaseRequisitionHeader` | verified, **deprecated by SAP** |
| `sap_s4` / `stock_item` | `API_STOCK_ITEM_SRV/StockItem` | `…/API_MATERIAL_STOCK_SRV/A_MaterialStock` | verified |
| `sap_s4` / `balance` | `API_BALANCE_SRV/Balance` | **blank** | no verified S/4 balance service exists |
| `sap_s4` / `backorder` | `API_BACKORDER_SRV/Backorder` | **blank** | none found |
| `unit4` / `invoice` | `/api/v1/invoice` | `/v1/objects/customer-invoices` | verified |
| `unit4` / `vendor_invoice` | `/api/v1/vendor_invoice` | `/v1/objects/supplier-invoices` | verified |
| `unit4` / `gl_summary` | `/api/v1/gl_summary` | `/v1/objects/general-ledger-transactions` | verified |
| `unit4` / `balance` | `/api/v1/balance` | **blank** | no Enterprise Document serves it |

All four `unit4` rows also move `response_root_hint` `data` → **empty** (the ObjectAPI body *is*
the array) and `pagination_style_hint` `page` → **`offset`**, which emits `offset=N&limit=M` —
the exact parameter names in Unit4's own documented example. `date_format_hint` is blanked on all
twelve rows.

**A correction to `docs/vendor-integration-research.md` §2.2.6.** That section inferred *camelCase*
plurals (`supplierInvoices`) from the `customers` / `relations` examples. The object reference
pages print **kebab-case**: `/v1/objects/supplier-invoices`, `/v1/objects/frequency-codes`. The
inference was wrong, which is the argument for the rest of this decision in miniature. The pages
are reachable on `develop.unit4rd.com`, not the `develop.unit4cloud.com` host that 404'd.

### Why the field maps are now empty rather than corrected

Not one property name for either vendor is reachable in public documentation. SAP's are behind
the Business Accelerator Hub login and the SDK javadoc renders client-side; Unit4's require an
authenticated `Accept: application/schema+json` call against a live tenant.

The guessed names were of **exactly the same provenance** as the eight service names that turned
out invented. Leaving them would let an admin apply a template, get a row that looks configured,
and read a tile that is confidently wrong. Empty means `MAP_UNMAPPED` → `not_configured` → the
tile **names the map to create**. That is L1-D5 applied to its own seed data.

**Rejected:** correcting the hints and leaving the payloads. It is the smaller diff and it keeps
the templates looking useful. It also preserves the one failure mode this product exists to
prevent — a number nobody investigates.

### The connector change this forced

`parseDate` (`field-mapper.ts`) now recognises an OData V2 `Edm.DateTime` — `/Date(1492098664000)/`,
with or without a `+0060` suffix — **by shape, not by configuration**, and converts it through
`GlideDateTime.setNumericValue`. This is §4.2 of the research document, built.

Detecting it by shape rather than by a new `date_format` value is deliberate: SAP ships most
`API_*` services as OData V2, so the wrapper arrives whatever the admin typed, and requiring them
to recognise it first is precisely how it stayed invisible. Before this, every date in an S/4 set
parsed to empty. `rows_fetched` was healthy, the run was `success`, and an "invoices due within N
days" tile read **0** — where 0 meant "no date could be read", not "nothing is due". No other
format in circulation has that shape, so the detection cannot collide.

### Still open

`OD36` (no `query_template_hint` column) is now **load-bearing for Unit4**:
`general-ledger-transactions` returns HTTP 400 / error 1020 unless the query carries one of
`registered=true` / `posted=true` / `historical=true`. Until that column exists the requirement
lives in `source_note` prose, which the apply action cannot act on. Same for the SAP requisition
row's warning that `$format=json` returns HTTP 500 on that service (SAP KBA 3366726).

**None of this has executed.** OD18 still governs: no connector call has ever run on this
instance. Nine verified endpoints are nine better guesses, not nine working syncs.
