---
title: SN HR&ERP — master build spec (source of truth)
app: SN HR&ERP · npm sn-hr-erp · scoped · x_335329_sn_hr_erp
status: normative. Committed 2026-08-12 from the pasted kickoff prompt so that fresh agent
        sessions (which start with zero memory) can read it by path.
---

# 0. What is being built

| | |
|---|---|
| App name | `SN HR&ERP` |
| NPM package | `sn-hr-erp` |
| Type | Scoped |
| Scope | `x_335329_sn_hr_erp` |
| Build tooling | ServiceNow Fluent / `now-sdk` (TypeScript, source-controlled) |

Two things in one app:

1. **A vendor-neutral multi-ERP integration layer** — connect to any ERP over REST, map its fields
   onto a stable internal contract, pull data into ServiceNow staging tables tagged with their
   source, and render it in a **5-tab consolidated hub UI**.
2. **An HR document generation layer** — turn ERP employee/payroll data into generated documents
   (employment verification letters, salary certificates, and other letter/certificate types),
   built to slot into ServiceNow's HR document machinery **which is not installed on the target
   instance** and must therefore be hand-rolled to the same contract.

**Explicitly out of scope: all CRM and sales-pipeline content.** No opportunity funnels, no lead or
deal tiles, no account-360 panels. If a tab or tile smells like CRM, it does not belong here.

**Ampersand check.** The app name contains `&`. Verify at L0 that it survives scaffolding intact —
in the app record label, the generated update-set name, any `sys_app` display value, and anywhere a
name is interpolated into a URL or XML payload. If it breaks anything, report it and use
`SN HR and ERP` as the display name while keeping the scope and package name as specified.

---

# 1. Prior art that must be read before designing

## 1.1 `sn-erp-crm-360` — the ERP connector prior art

Sibling scoped app `x_335329_erpcrm`, local path
`/mnt/c/Users/pedro/Documents/Programacao/Github/ServiceNowApps/sn-erp-crm-360`.
Read `docs/SESSION-RESUME.md`, the phase design docs, and the change manifests. It provides:

- A working hand-rolled REST connector: retries, exponential backoff, timeouts, circuit breaker,
  per-attempt telemetry. ~1,200 lines, 21/21 tests passing. Source under `src/server/connector/`.
  **Do not rewrite from scratch.**
- A config-driven "control tower" data model: `erp_system` (connection registry) + `object_map`
  (one row per system × logical object, with `field_map`, `response_root`, `query_template`,
  `pagination_style`, `page_size`, `date_format`). Design promise it proves: **a second ERP is pure
  data, zero new code.**
- A 5-tab configuration-driven dashboard spec at `src/server/agent/command-center-spec.ts`
  covering 17 logical ERP objects. Its header comment states the three-state rendering contract
  reproduced in §7.
- An evidence/grading layer that judges whether a number can be trusted.
- The platform traps in §9.

## 1.2 The Capacity Planner — the UI prior art

Scoped app `x_u4bsh_capmgmt` ("Capacity Management Overview"). Documentation:
`/home/pedro/vaults/obsidian-servicenow-docs/Applications/capacity-planner/capacity-planner.md`.
Local source: `/mnt/c/Users/pedro/Documents/Programacao/Github/ServiceNowApps/capacitymanagementoverview`.

**This is the UI pattern to copy:**

```
sys_ui_page  (BYOUI static page, served at <scope>_planner.do)
      │  loads a built JS asset registered as sys_ux_lib_asset
      ▼
vanilla-JS SPA  (single file, view state machine, no framework)
      │  fetch()
      ▼
Scripted REST API  (/api/<scope>/<service>)
      │  one GET /data call returns the entire dataset in one payload
      ▼
GlideRecord against the app's own tables, batched IN queries, never N+1
```

Properties to copy deliberately:

- **One fat `GET /data` call**, not one per widget. Compact, short-keyed response shape.
- **A client-side view state machine** (`switchView()`) toggling named views — analogous to tabs.
- **Batched `IN` queries everywhere.** Both hot paths in that app were originally N+1 and were
  rewritten. New per-row logic collects ids first, then batch-fetches.
- **`sys_property`-driven UI configuration** so behaviour is tunable without a redeploy.
- **Role-gated editing**: nested `viewer ⊂ planner ⊂ admin`, table ACLs plus field ACLs, and hard
  deny-write ACLs (`adminOverrides: false`) on system-derived fields so nobody, not even admin, can
  hand-edit a computed value.
- **Client-side XLSX export bundled locally** — a CDN-loaded library is blocked by CSP.
- Known trap: `sys_properties` declared via the Fluent `Record()` pattern with a placeholder sys_id
  are **silently skipped on deploy**. Create the property in the browser, copy the real sys_id back
  into the generated keys file.

---

# 2. The four architecture decisions — ALL RESOLVED 2026-08-12

Recorded in full in `docs/decision-log.md`. Summary of what was decided and what it binds:

| # | Decision | Outcome |
|---|---|---|
| D1 | UI Builder vs BYOUI | **BYOUI SPA + a written UIB spec document.** Agent builds the Fluent Workspace API shell + UiPage + Scripted REST API + vanilla-JS SPA. Additionally delivers `docs/uib-page-spec.md` (Page Component Tree + Data Binding Schema) so a human can assemble a native UIB page later. |
| D2 | Staging table vs never-persist | **Stage ERP data; payroll live-only.** finance / procurement / inventory / assets / manufacturing are staged with full provenance and `fetched_at`. `payroll_record` and `employee_profile` are fetched live at document-generation time and **never stored**. No queryable table of salaries exists. |
| D3 | Requisition Approve/Reject write-back | **Deferred to L7**, its own design and its own governance gate. Tab 2 ships read-only with a visible caveat and an ERP deep link. |
| D4 | Connector reuse vs port | **Port into this scope**, keeping structure and tests. No cross-scope runtime dependency on `x_335329_erpcrm`. |

Binding consequences of D2, all of which the design must answer:

1. **Staleness is first-class.** Every staged row carries `fetched_at`; the UI renders
   **"as of <time>"** on every figure. A stale number shown as current is this app's own failure mode.
2. **Provenance is more than a category.** Every row carries source system, logical object,
   category, source-side record id, and sync run. See §5.3.
3. **Retention.** Financial staging needs a retention policy. Payroll is exempt by not being stored.
4. **An empty sync must never look like a zero.** See §7.

Binding consequence of D3: **never draw a button that cannot commit its decision.**

---

# 3. Instance verification — findings as of 2026-08-12, `dev296062`

| Check | Actual result |
|---|---|
| `now-sdk` auth | Present. Alias `dev`, basic, `admin`, default. `npx now-sdk query <table> -a dev` reads the Table API with no separate password |
| App `x_335329_sn_hr_erp` on instance | **Not present.** Local scaffold only. Sibling `x_335329_erpcrm` v0.0.8 is live |
| `com.sn_hr_core` (HRSD) | **Absent.** `sn_hr_core_case` and `sn_hr_core_profile` do not exist |
| `com.snc.employee_center` | **Absent** as a plugin id. `com.sn_hr_service_portal` (Employee Service Center) is active and scope `sn_hr_sp` exists — a portal shell with no HR core behind it |
| `com.sn_employee_document_management` | **Absent** |
| **`com.snc.document_templates`** | **ABSENT.** No `sys_document_template`, no `document_template` table. The cheap path in §8.1 is closed; the renderer is hand-rolled |
| PDF capability | `com.snc.apppdfgenerator` (ServiceNow PDF Generation Utilities) and `com.snc.whtp` (WebKit HTML to PDF) are **both active**, but no `sn_pdfgeneratorutils` scope and no `PDFGenerationAPI` script include were found. **PDF is unproven — probe at runtime before L6 design closes. Until proven, output labelled HTML.** |
| `sn_aia_*` | **Absent** — AI Agent Studio not installed |
| IntegrationHub | Runtime plugin active; spokes/licence unverified. Connector is hand-rolled regardless |
| `alm_asset` / `cmdb_ci` | **Both present** — Tab 4 reconciliation is technically possible (but see §6 Tab 4: default to display-only) |

Still needed from the human: **which real ERP system(s) to target, with endpoint and credentials.**
Until a real endpoint exists, everything is fixtures. The sibling app used `postman-echo.com` as its
approved test host after `httpbin.org` went down.

---

# 4. Architecture

## 4.1 Connector

**D4: port it.** Copy the sibling's connector source into this scope, keeping its structure and its
tests. The retry / backoff / circuit-breaker / telemetry behaviour is **not to be reinvented** — it
is tested, and its tests come with it. This app then grows it with vendor default mappings and a
sync engine the sibling has no use for.

## 4.2 Layer map and build order

Build strictly in order. Each gate must be met **with live evidence** before the next layer starts.

| Layer | What | Gate |
|---|---|---|
| **L0** | App scaffold, scope, roles, ACL skeleton, `&`-in-name check | Deploys clean; roles exist; ampersand verified |
| **L1** | Control tower: connection registry, object map, field mapping, vendor mapping templates | A second ERP can be added as pure data, demonstrated |
| **L2** | Connector runtime (ported) + vendor default-mapping resolution | One successful live call **and** one forced-failure call, both logged, breaker demonstrably opening |
| **L3** | Staging tables + sync engine + provenance + staleness | A sync run populates rows with full provenance; a failed run is distinguishable from an empty one, proven by query |
| **L4** | Scripted REST API — the single `GET /data` per tab | Returns correct four-state payload for every tile, including not-configured and failed |
| **L5** | BYOUI 5-tab SPA + workspace shell + ACLs | All five tabs render live, not-configured, stale and failed states correctly, verified in a browser as a genuine non-admin user |
| **L6** | HR document generation | Both document types generate end to end; the failure path produces no document and a stated reason |
| **L7** | *Separate gate:* approval mirror + ERP write-back | Deferred per D3. Its own design and governance gate |

Produced alongside: `docs/uib-page-spec.md` — the UIB Page Component Tree + Data Binding Schema.

---

# 5. Data model

Tables carry the `x_335329_sn_hr_erp_` prefix implicitly. Field names are indicative; the architect
step owns the final schema.

## 5.1 `erp_system` — connection registry

One row per ERP instance. Metadata and connection config only.

Carried over from the sibling app: `name`, `vendor` (choice), `legal_entity` (disambiguates two
systems of the same vendor), `base_url`, `auth_type` (`basic` / `oauth2` / `mutual`), matching auth
profile references, `use_mid_server` + `mid_server`, `timeout_ms`, `max_retries`, `backoff_ms`,
`circuit_open_until`, `read_only` (default **true**), `active`. Keep `audit: true`.

**Vendor choice list** — drives default mappings. Seed at minimum: SAP S/4HANA, SAP ECC, Oracle
E-Business Suite, Oracle Fusion/Financials Cloud, Microsoft Dynamics 365 Finance & Operations,
**Unit4 ERP**, Infor, NetSuite, Workday, plus `generic_rest` / `generic_odata` as escape hatches.
Rule inherited from the sibling: **add, never rename** — a renamed value silently orphans historical
telemetry keyed on it.

**Config validation business rule**: reject internally contradictory rows at save time (OAuth2
combined with MID Server; an auth profile that doesn't match the declared auth type; MID enabled
with no MID server). Validate contradictions, **never reachability** — an outbound call from a
business rule makes a deliberately-broken test fixture unsavable.

## 5.2 `object_map` + field mapping + vendor default mapping templates

`object_map` is one row per (system × logical object): `endpoint_path`, `http_method`,
`response_root`, `query_template` (with an `{external_id}`-style placeholder), `pagination_style`
(`none` / `offset` / `page` / `cursor` / `odata_skiptop` / **`next_url`** — add this last one),
`page_size`, `date_format`, `field_map`, `active`. Unique index on (system, object).

Two requirements the sibling does not meet and this app must:

1. **Field mapping must be usable, not just storable.** A raw JSON blob is fine as storage and
   miserable as an admin experience across 17+ objects. Choose deliberately: a related child table
   of mapping rows (one row per source field → logical field, with an optional transform), or a
   JSON blob plus a genuinely usable editing surface. **Do not default to "admin hand-writes JSON"
   without a decision** — the config-driven promise dies if mapping a new ERP is unpleasant.
2. **Default mappings per known vendor.** Seeded `mapping_template` rows keyed on
   (vendor, logical_object), applied by an explicit "apply defaults" action — **not** silently on
   insert, and **never** overwriting a mapping an admin has edited. Pattern to copy: the sibling's
   field-sync business rule (named transform maps applied per source field, skipping empty source
   values so a sync never blanks existing data).

Every shipped default mapping is a **guess about someone else's API** and must be labelled as such
in the UI. Include a `verified` flag defaulting to false; surface unverified mappings.

## 5.3 `erp_staging` — provenance contract

| Field | Purpose |
|---|---|
| `erp_system` | Reference. **Which** system — the category alone is not provenance |
| `erp_category` | Choice: `finance`, `procurement`, `inventory`, `assets`, `manufacturing`. (`hr` is NOT staged — see D2) |
| `logical_object` | Choice. The specific object within the category |
| `source_record_id` | The ERP-side primary key. Enables idempotent upsert instead of duplicate-on-resync |
| `fetched_at` | When the ERP actually answered. **Drives every "as of" label** |
| `sync_run` | Reference to the sync run that produced this row. The audit spine |
| `payload` / typed columns | The mapped data |

**Shape decision the architect must make explicitly:** one wide staging table with a JSON payload
(flexible, weak querying) versus one table per logical object or category (strong querying, more
schema). Defensible middle path: a common header table with all provenance fields plus a JSON
payload, with typed columns promoted only for fields the tabs actually aggregate, sort or filter on.
Decide explicitly; record the rejected alternative.

## 5.4 `sync_run` — the audit and state spine

One row per sync execution per (system × object): started, finished, `status`
(`success` / `partial` / `failed` / `not_configured`), rows fetched, rows upserted, rows deleted,
http status, error message, duration.

**This table is what makes §7 possible.** Zero staging rows + a `success` run = the ERP genuinely
returned nothing. Zero rows + a `failed` run = the ERP did not answer. Zero rows + no run at all =
nobody ever configured it. Three different sentences on screen; without this table they are
indistinguishable.

## 5.5 HR side

- `employee_xref` — reference to `sys_user` + the ERP-side employee key + the source system.
  Join key only, never a copy of the person's HR data.
- `document_type` — the catalogue of generatable documents, each declaring which logical objects and
  fields it needs, so a missing mapping produces "this document cannot be generated because X is not
  configured" rather than a document with holes in it.
- `document_template` — template body plus placeholder contract, per document type. Shaped to be
  swappable for a real platform Document Template (§8).
- `document_request` — who requested, for whom, which type, status (`pending` / `generated` /
  `failed`), failure reason, generated timestamp, the rendered output as an attachment, and **which
  `sync_run`s / live call ids the figures came from**.

## 5.6 Roles

Nested model, copied from the Capacity Planner, plus separately-granted sensitive roles:

- `viewer` — read the operational tabs.
- `finance_viewer` — financial figures. **Never implied by any other role.**
- `hr_viewer` — employee and payroll data. Never implied by any other role, and specifically **not**
  implied by `finance_viewer`. Payroll access is not a superset of finance access.
- `admin` — configuration: systems, object maps, mapping templates, templates.

Hand-write every ACL (`createAccessControls: false`). Use hard deny-write field ACLs
(`adminOverrides: false`) on every system-derived field — `fetched_at`, `sync_run`, provenance
columns — so no one, admin included, can hand-edit provenance.

Self-service rule: an employee may request documents **only for themselves**, enforced server-side,
not hidden in a form. Requesting on behalf of another person requires the HR-admin role explicitly.

---

# 6. The 5-tab consolidated hub

No CRM, no sales pipeline, in any tab.

**Cross-cutting requirements:**

- **Lazy loading is mandatory, not an optimisation.** Only the active tab's data resources execute.
  A "refresh" action must not fan out to every system at once.
- **Every figure carries an "as of" timestamp**, drawn from `fetched_at`.
- **Every tile obeys §7.** No tile ever displays `0` for an absence.
- **Row actions deep-link to the source ERP** via `erp_system.base_url` plus a per-object path.
  If the deep-link field is not mapped, **draw no link** — a link that 404s is worse than none.

### Tab 1 — Financial Health & Ledger
- 3 KPI scorecards: real-time cash balance; open accounts receivable; open accounts payable.
- Bar chart: monthly revenue vs. operating expenses.
- List: top 10 overdue vendor invoices, with a row action to the ERP record.

### Tab 2 — Procurement & Sourcing
- 3 KPI scorecards: total open purchase orders; requisitions pending approval; year-to-date
  procurement spend.
- Donut chart: spend distribution by supplier / vendor category.
- Approvals list. **Per D3 this ships read-only with a visible caveat and an ERP deep link.**
  Approve/Reject is L7.

### Tab 3 — Inventory & Supply Chain
- 3 KPI scorecards: total SKU count; low-stock alerts; backordered items.
- Bar chart: stock distribution by warehouse location.
- List: critical reorder list, filtered to items below safety-stock threshold.

### Tab 4 — Fixed Assets & Equipment
- KPI scorecards: total asset valuation; assets depreciated this quarter; assets due for maintenance.
- Pie chart: enterprise assets by lifecycle stage (Active / In Maintenance / Retired).
- List: high-value capital assets nearing end-of-life.
- `alm_asset` and `cmdb_ci` both exist on this instance, so reconciliation is possible. **Default to
  display-only** and record the decision. Reconciliation is a much bigger problem than display.

### Tab 5 — Manufacturing & Production
- KPI scorecards: Overall Equipment Effectiveness (OEE %); active work orders; delayed orders.
- Line chart: daily production output volume vs. target.
- List: machine downtime logs with severity badges.
- **OEE** is a computed ratio (availability × performance × quality). Decide whether the ERP supplies
  it directly or this app computes it — and if computed, from which mapped fields. A silently-wrong
  OEE is a number executives act on. If the inputs aren't mapped, the tile renders not-configured.

**New logical objects required** (additive to the sibling's 17): `fixed_asset`,
`asset_depreciation`, `maintenance_schedule`, `employee_profile` (single-employee lookup),
`payroll_record` (single-employee, single-period).

---

# 7. The three-state rule (four rendered states) — the most important behaviour in this app

| State | Meaning | Renders as |
|---|---|---|
| **live** | An ERP answered and this is what it said | The figure, plus "as of <time>" |
| **not configured** | No object map exists for this object on any active system | *"Not configured — create an Object Map for `stock_item`"* |
| **failed** | A map exists, a call was made, the ERP did not answer | *"ERP did not answer"* + last successful figure and its age, if any |
| **stale** | Data exists but the last successful sync is older than a threshold | The figure, visibly flagged with its age |

**`0` is only ever displayed when an ERP actually returned zero.** Not for a missing map, not for a
failed call, not for a stale sync, not for an empty table.

"0 low-stock alerts" and "we could not reach the warehouse system" look identical on every dashboard
that treats absence as zero, and they mean opposite things. **That distinction is the product.**

`sync_run` is what makes these states distinguishable. The REST payload carries every tile's state
**explicitly** — the client never infers state from an absent or zero value.

---

# 8. HR document generation

## 8.1 The seam

ServiceNow's **Document Templates** feature is its own plugin (`com.snc.document_templates`),
distinct from HRSD. **It is absent on this instance** (verified §3), so the renderer is hand-rolled.
The seam still pays:

> **This app's job is to produce a correctly-shaped, well-named row.** Document generation —
> platform-native or hand-rolled — is a consumer of that row.

A platform document template is bound to a table and its available variables are that table's
fields. So the document source row must be designed with **field names that read well as template
variables**, because on a licensed instance an admin points a real Document Template at that exact
table and picks those exact fields from a list. Naming is load-bearing here, not cosmetic. The
hand-rolled renderer consumes the **same** row and the **same** placeholder names, so swapping in
the platform feature later changes the renderer, not the data contract.

## 8.2 What to build

- **Intake without Employee Center:** a Record Producer against `document_request`. Base platform,
  not licence-gated. Enforce the self-service boundary server-side.
- **Assembly:** resolve the requester to an ERP employee via `employee_xref`, fetch payroll live
  (D2), gather the fields the requested `document_type` declares it needs, and fail loudly and
  specifically if any are unavailable or unmapped.
- **Render:** probe the PDF capability at runtime first. If a real PDF API is confirmed, produce a
  PDF. If not, produce clean HTML and **label it HTML** — `document_request` must never claim "PDF"
  for something that isn't one.
- **Attach and audit:** output on the request record, with the ERP responses it drew from recorded.

## 8.3 Non-negotiables

1. **No shadow HR database.** Persist the xref join key, the generated document, its audit metadata,
   and the templates. Payroll is fetched live and never staged (D2).
2. **Never generate a document with a placeholder standing in for a real figure.** A blank or a zero
   on a salary certificate is a document someone applies for a mortgage with. If a figure is
   unavailable, the request fails with a stated reason and produces nothing.
3. **Self-service is scoped to self**, enforced server-side.
4. **Read-only against the ERP.** The HR half never writes to the ERP.
5. **Every generated document is audited** — who, for whom, when, which type, which ERP responses.
6. **Hand-roll to the licensed contract, not around it.** Document where each hand-rolled piece maps
   to the platform feature it stands in for.

---

# 9. Traps already paid for. Do not relearn them.

**Platform**

- `GlideRecord.getValue()` on a **Boolean** column returns the string `'1'` / `'0'`, **not**
  `'true'` / `'false'`, despite being typed as a generic string. A business rule shipped with 3 of 4
  validation branches silently dead because of `=== 'true'`. It built clean and passed a happy-path
  smoke test.
- **`gs.hasRole()` lies under `runAs`.** Every security-relevant check must query
  `sys_user_has_role`.
- **`require()` throws inside a remote-table script.** Every module reaches the platform through a
  Script Include bridge.
- **`sys_script_vtable.cache_empty_query_results` defaults to `true`.** If any remote table is used,
  set it `false` explicitly and keep `cache_ttl: 0`. This default alone would have cached an ERP
  outage's zero rows and reported that a customer owed nothing.
- A followed HTTP redirect can carry the `Authorization` header to a host outside your
  configuration. Do not follow redirects; treat 3xx as a non-retryable failure.
- Call `disableForcedVariableSubstitution()` on outbound REST messages when endpoints are assembled
  from configuration that may legitimately contain `${...}`.
- `setMIDServer()` takes the MID server's **name**, not its sys_id. A sys_id silently never routes.
- `RESTMessageV2.execute()` may **either** throw **or** return a response with `haveError()` true
  for the same underlying condition. Handle both paths.
- `sys_module.sys_updated_on` does not move on deploy. Read the `content` field to verify a module
  change actually landed.
- `GlideDigest` returns **UPPERCASE** — `.toLowerCase()` is mandatory when comparing.

**Tooling / Fluent / now-sdk**

- **`now-sdk install` does not build.** Always `now-sdk build && now-sdk install`. A source edit plus
  a bare install silently deploys the *previous* build and reports success.
- **A failed build empties the output directory**, and the next install fails with "No files found".
  Always rebuild after a failed build.
- A computed expression in a Fluent `data` field — for example a `.join('\n')` — can write the
  literal expression's string result (`Symbol(CallExpressionShape)`) into the column on a clean,
  successful build. **Root cause, confirmed against the SDK's own docs (`now-include-guide`,
  `data-helpers-guide`): `Record()` data values are strings, evaluated at build time from the source
  expression, not executed JavaScript.** The supported way to put multi-line HTML, CSS or script
  content into a record field is **`Now.include('./relative/path')`**, which inlines a real file at
  build time. Use that for every UI Page `html`, every broker/handler `script`, and any long text —
  never string concatenation, never `.join()`. Plain literals and `JSON.stringify` also work.
  **When something looks wrong, query the instance before theorising about the source.**
- **Never invent a sys_id.** `Now.ID['descriptive-key']` is the only correct way to create a record
  identity; the build generates and tracks the sys_id in `src/fluent/generated/keys.ts`. A
  model-fabricated sys_id (the docs call out `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6` specifically, which
  is exactly the placeholder that broke the Capacity Planner's `sys_properties`) bypasses key
  tracking and collides across projects. The only acceptable raw sys_id strings are ones returned by
  a query or transform against a real instance.
- **Never delete a `Table()` / `BusinessRule()` / `Record()` call from a `.now.ts` file to "remove"
  something without asking first.** A `keys.ts` entry with no matching Fluent code is read as an
  intentional deletion and generates a delete record that ships in the app and removes it from every
  instance on upgrade. Whether that is right depends on install history, which the source cannot
  reveal.
- `gs.nowDateTime()` is not allowed in scoped apps — use `new GlideDateTime()`.
- In **module** files (`src/server/**`) Glide APIs are NOT global: `import { gs, GlideRecord } from
  '@servicenow/glide'`. In **Script Include class** files (`Class.create`) they ARE global and must
  NOT be imported. Cross-scope Script Include classes come from `'@servicenow/glide/<scope>'` —
  `new x_myapp.MyUtils()` throws `x_myapp is not defined` inside a module.
- `ScriptInclude` and `ClientScript` `script` properties are **string-only** — use `Now.include()`.
  `BusinessRule`, `ScheduledScript`, `UiAction`, RestApi route handlers and record-producer scripts
  accept **module functions** — use those.
- `installMethod: 'demo'` records ignore redeploys for their `active` field, but a redeploy **does**
  restore every other field from source. Repointing a fixture by Table API `PATCH` alone survives
  exactly until the next deploy.
- `sys_properties` declared via the Fluent `Record()` pattern with a placeholder sys_id are silently
  skipped on deploy. Create the property in the browser, copy the real sys_id back into keys.
- `sys_ux_*` tables *are* authorable from Fluent but demand their mandatory fields (for example
  `schema_version` on a macroponent).
- `now-sdk query` takes the table as a **positional** argument, and its JSON output is preceded by a
  banner — slice from the first `{`.
- If a `now-sdk` subcommand dies on a missing native rollup module, install the platform-specific
  rollup package with `--no-save` (e.g. `npm i --no-save @rollup/rollup-linux-x64-gnu`).
- Use `_list.do` / `.do` URL suffixes, not `.list`, which fails in the Next Experience shell.
- After deploying a BYOUI page, **hard-refresh**. The JS asset is aggressively cached.
- A CDN-loaded JS library is blocked by ServiceNow's CSP. Bundle it locally.

**Method**

- **A clean build proves nothing. A passing happy-path fixture proves nothing.** Test the reject and
  failure paths live, via the Table API or a real browser session, before calling anything done.
- **Test as a genuine non-admin user.** Admin does not count for any access-control assertion.
- **Batch, never loop.** Collect ids, then one `IN` query.
- Ship test drivers `active: false`. A driver left armed on a prior instance fired every three
  minutes for days and was reported four times before it got disarmed.

---

# 10. How this build runs

## 10.1 Agent pipeline

**BA → Architect → *human resolves open decisions* → Governance → *explicit human YES* → Developer →
Tester**, with `bug-hunter` as an independent audit pass before sign-off.

- Each agent invocation is a **fresh, self-contained prompt** with explicit file paths.
- `architect` and `governance` are design-only / read-only. Only `developer` (or the main session
  directly) writes to the instance or the codebase.
- `tester` does not trust the developer's log and verifies independently against the requirements.
- Track phase progress with a task list.

Governance should expect **higher-than-typical risk**: a new scope, staged financial data, live
payroll PII, a self-service access boundary. Do not accept "Low risk, 0 violations" by default.

## 10.2 Deliverables

- The deployed `x_335329_sn_hr_erp` scoped app, layers L0–L6.
- A working 5-tab BYOUI consolidated hub, all four tile states verified live.
- Working document generation for the employment verification letter and the salary certificate,
  including a verified failure path.
- Seeded vendor default mapping templates for every vendor in the choice list, each flagged
  unverified until proven against a real endpoint.
- `docs/uib-page-spec.md` — the UI Builder Page Component Tree and Data Binding Schema, in correct
  UIB vocabulary: **data resources** (not "data brokers"), `@data.<resource_id>.<output>`,
  `@context.props.<name>`, `@state.<name>`, `@elements.<component_id>.<property>`, per-tab lazy
  loading, and the inherited-vs-local data resource distinction. Note also that only one GlideForm
  is supported per UIB page.
- Design docs, change manifests, decision log, build report, session-resume document.

## 10.3 Definition of done

Nothing is "done" on a clean build. A layer is done when its failure path has been exercised live
and produced the right *sentence on screen* — not the right absence of an error:

- A tile with no object map says so, and names the map to create.
- A tile whose ERP did not answer says so, and does not show `0`.
- A tile with stale data shows its age.
- A document that cannot be generated correctly is not generated at all, and says why.
- Every one of the above verified as a genuine non-admin user holding only the intended role.

**Never:** draw a button that can't commit its decision, label HTML as PDF, display `0` for an
absence, or ship a test driver armed.
