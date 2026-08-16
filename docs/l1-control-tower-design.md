---
title: L1 — Control tower — erp_system, object_map, field_map, mapping_template
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-12
status: design-only. Resolves OD4, OD9 and OD10.
grounding: |
  Fluent API shapes read from `@servicenow/sdk` 4.9.0 via `npx @servicenow/sdk explain`
  (table-api, table-guide, choiceset-guide, businessrule-api, business-rule-guide,
  uiaction-api, acl-api, now-id-guide, module-guide). Instance facts verified live on
  `dev296062` with `npx now-sdk query`. Table names follow `docs/l0-scaffold-design.md` §2.2.
---

# 1. What L1 is for

L1 is the whole config-driven promise made concrete: **a second ERP is data, not code.** Every
later layer reads its behaviour out of these four tables and holds no vendor knowledge of its own.

Its gate — *"A second ERP can be added as pure data, demonstrated"* — is **half-meetable today**.
§8 splits it honestly (OD10) rather than rewording it to pass.

---

# 2. OD9 — this app's logical-object list

**Resolved.** The sibling's 17 objects are **not** inherited wholesale. Spec §0 puts CRM and
sales-pipeline content explicitly out of scope, and D2 forbids a queryable HR dataset — between
them they disqualify six of the seventeen.

## 2.1 The list — 16 objects

| # | Logical object | Category | Justification — the §6 tile that needs it |
|---|---|---|---|
| 1 | `balance` | finance | Tab 1 KPI "Cash balance" (D7: never labelled real-time) |
| 2 | `invoice` | finance | Tab 1 KPI "Open accounts receivable" |
| 3 | `vendor_invoice` | finance | Tab 1 KPI "Open accounts payable" **and** the overdue-invoice list |
| 4 | `gl_summary` | finance | Tab 1 bar chart, revenue vs operating expenses by period |
| 5 | `purchase_order` | procurement | Tab 2 KPI "Total open purchase orders", KPI "YTD procurement spend", supplier donut |
| 6 | `requisition` | procurement | Tab 2 KPI "Requisitions pending approval" **and** the read-only approvals list (D3) |
| 7 | `stock_item` | inventory | Tab 3 KPIs "Total SKU count" + "Low-stock alerts", warehouse chart, reorder list |
| 8 | **`backorder`** | inventory | Tab 3 KPI "Backordered items" — **new, see §2.3** |
| 9 | **`fixed_asset`** | assets | Tab 4 KPI "Total asset valuation", lifecycle pie, high-value EOL list. Spec §6 additive |
| 10 | **`asset_depreciation`** | assets | Tab 4 KPI "Assets depreciated this quarter". Spec §6 additive |
| 11 | **`maintenance_schedule`** | assets | Tab 4 KPI "Assets due for maintenance". Spec §6 additive |
| 12 | `work_order` | manufacturing | Tab 5 KPIs "Active work orders" + "Delayed orders" |
| 13 | `production_output` | manufacturing | Tab 5 line chart output vs target, **and** OEE (OD7, §2.4 of `docs/l5-ui-design.md`) |
| 14 | `machine_downtime` | manufacturing | Tab 5 downtime list with severity badges |
| 15 | **`employee_profile`** | *(none — never staged)* | L6 assembly. Spec §6 additive; D2 live-only |
| 16 | **`payroll_record`** | *(none — never staged)* | L6 salary certificate. Spec §6 additive; D2 live-only |

**14 staged** (categories `finance`, `procurement`, `inventory`, `assets`, `manufacturing`) +
**2 live-only**. `hr` is not an `erp_category` value and cannot be selected — story L3-1 AC2.

## 2.2 The six dropped from the sibling's 17, each with its reason

| Dropped | Reason |
|---|---|
| `opportunity` | Sales pipeline. Spec §0: *"no opportunity funnels, no lead or deal tiles"*. The sibling's `commercial` tab funnel chart has no counterpart here |
| `sales_order` | Sales pipeline. The sibling's tab was "Procurement **& Sales**"; this app's Tab 2 is "Procurement **& Sourcing**". No §6 tile consumes it |
| `job_requisition` | Recruiting — HR content the spec never asks for, and it collides conceptually with procurement `requisition` in every list view and every `call_log` grouping |
| `employee` | The sibling's estate-wide headcount object. There is **no Workforce Analytics tab in §6**, and an estate-wide employee roster staged in ServiceNow is exactly the shadow HR database D2 exists to prevent. Replaced by `employee_profile` — single-employee, live, never stored |
| `labor_cost` | Workforce analytics; no §6 tile. Payroll-adjacent, so staging it would breach D2 by a side door |
| `credit_status` | A customer-credit / CSM concept from the sibling's account-360 work. No §6 tile |
| `receipt` | Goods receipt. No §6 tile. Tab 2's "open purchase orders" is answered from `purchase_order.status`, not by differencing receipts |

That is seven entries covering the sibling's 17 minus the 10 kept — `receipt` is the seventh, and
the phrase "six dropped" in earlier drafts undercounted it. **Seven dropped, ten kept, six new,
sixteen total.**

## 2.3 `backorder` — a new object, because a threshold cannot invent a field

`docs/stories.md` gap #2: *"'Backordered items' KPI. No logical object in §5/§6 supplies a
backorder status."* D5's hard limit: *"a threshold property makes a comparison configurable. It
does not invent a field."*

Two wrong answers were available: derive backorders from `stock_item.qty < 0` (a vendor-specific
convention this app must not encode), or drop the tile (§6 asks for it). The right answer is a
named logical object with a declared contract, unmapped by default, rendering **not configured**
until an admin maps it — which is the §7 behaviour working exactly as intended.

**Logical field contract:** `code` (SKU/item ref), `label` (item name), `qty` (units
backordered), `occurred_on` (promised/expected date), `status`, `erp_id` (deep link).

## 2.4 The logical-field contract is code, not configuration

The 16 objects and, for each, its permitted **logical field names** live in one TypeScript module
(`src/server/contract/objects.ts`) and are the single source of truth consumed by:

- the `logical_object` choice list on `object_map`, `field_map`, `erp_staging`, `sync_run`, `call_log`;
- the `logical_field` choice list on `field_map`, **filtered to the parent object** (§4.2);
- the L3 promotion table (`docs/l3-staging-design.md` §3.2);
- the L4 tile definitions.

Field names are short and vendor-neutral, exactly as the sibling's `command-center-spec.ts` header
argues: *"SAP calls it `MENGE`, Dynamics calls it `QuantityOnHand`, and this file only ever says
`qty`."*

**Add, never rename.** A renamed logical object silently orphans `call_log` telemetry, `sync_run`
history and every `field_map` row keyed on it. Enforced by convention plus the note on the choice
list (story L1-1 AC6).

---

# 3. `erp_system` — connection registry

## 3.0 `accessibleFrom` — changed to `package_private` (governance condition C1)

**Changed 2026-08-12 at L0 by the developer, closing condition C1 of `docs/change-manifest.md`.**

This table shipped `accessibleFrom: 'public'` in the first draft of this document, carried over
verbatim from `x_335329_erpcrm`. It is now **`package_private`**.

- `erp_system` holds `base_url`, three auth-profile references and MID-server config. SDK 4.9.0's
  `table-api` states the default is `public` and that `public` means *"other application scopes can
  access the table"* — so `public` would let any other scoped app on `dev296062` read this app's
  connection configuration.
- **D4 removed every cross-scope consumer.** The connector is ported into this scope rather than
  called across scopes, and `docs/l0-scaffold-design.md` §11 states no cross-scope call exists in
  any layer L0–L6. `l2-connector-design.md:280` already applied exactly this reasoning to
  `ErpConnector` (`accessibleFrom: 'package_private'`); this table was the one place it was not
  applied. **No consumer justifying `public` exists or is planned.**
- **Cost, and it is accepted:** `table-api` warns `package_private` *"will prevent the table from
  being selectable in some platform features such as Business Rules"* — meaning from **other**
  scopes. This app's own L1 config-validation business rule is in-scope and is unaffected. If a
  future layer needs an out-of-scope platform feature to select this table, that is a design change
  with its own gate, not a flag to quietly widen.

**Applies to `erp_system` only.** Every other table in this app inherits the same posture: declare
`accessibleFrom: 'package_private'` explicitly on every `Table()` at every layer, because the SDK
default is `public` and an omitted flag is a silent widening.

---

Table `x_335329_sn_hr_erp_erp_system`. Ported from the sibling with four changes.

```ts
Table({
  name: 'x_335329_sn_hr_erp_erp_system',
  label: 'ERP System',
  display: 'name',
  audit: true,                    // spec §5.1: keep audit
  accessibleFrom: 'package_private',  // governance C1 — see §3.0

  callerAccess: 'tracking',
  actions: ['read'],              // L0 F2 — array, not { read: true }
  allowWebServiceAccess: true,    // L0 F3 — REST verification depends on it
  createAccessControls: false,
  schema: { /* §3.1 */ },
  index: [
    { name: 'idx_erp_system_name', unique: true, element: 'name' },
  ],
})
```

## 3.1 Schema

| Column | Type | Notes |
|---|---|---|
| `name` | String(100), mandatory | unique index |
| `vendor` | Choice, mandatory | §3.2 |
| `legal_entity` | String(100) | disambiguates two systems of one vendor (story L1-1 AC5) |
| `base_url` | Url, mandatory | field-read `admin` |
| `auth_type` | Choice, mandatory | `basic` / `oauth2` / `mutual` |
| `auth_profile_basic` | Reference `sys_auth_profile_basic` | field-read `admin` |
| `auth_profile_oauth` | Reference `oauth_entity_profile` | field-read `admin` |
| `auth_profile_mutual` | String(32) | **String, not Reference** — the sibling proved `sys_auth_profile_mutual` does not exist on this instance, and a reference to a nonexistent table fails the build |
| `use_mid_server` | Boolean, default `false` | |
| `mid_server` | Reference `ecc_agent` | field-read `admin`. Read at runtime with `getDisplayValue()` — `setMIDServer()` takes the **name** (§9) |
| `timeout_ms` | Integer, default 30000, 1000–120000 | |
| `max_retries` | Integer, default 2, 0–5 | |
| `backoff_ms` | Integer, default 500, 0–60000 | |
| `circuit_open_until` | DateTime | empty = closed; future = open; **past = half-open**. Three states, one column |
| `read_only` | Boolean, **default `true`** | story L1-1 AC2 |
| `active` | Boolean, default `true` | |

## 3.2 Vendor choice list

Spec §5.1 names eleven. The sibling shipped six with different keys — **these are new choices in a
new scope, so there is no rename risk**, but the "add, never rename" rule binds from now on.

| Value | Label |
|---|---|
| `sap_s4` | SAP S/4HANA |
| `sap_ecc` | SAP ECC |
| `oracle_ebs` | Oracle E-Business Suite |
| `oracle_fusion` | Oracle Fusion / Financials Cloud |
| `dynamics_365_fo` | Microsoft Dynamics 365 Finance & Operations |
| `unit4` | Unit4 ERP |
| `infor` | Infor |
| `netsuite` | NetSuite |
| `workday` | Workday |
| `generic_rest` | Generic REST |
| `generic_odata` | Generic OData |

## 3.3 Config-validation Business Rule

`before` insert + update. **Validates contradictions, never reachability** — story L1-2 AC6: a
fixture pointing at `https://erp-invalid.invalid` must save, because L2 and L3 need a
deliberately-broken system to prove the failed state.

| # | Condition | Message |
|---|---|---|
| 1 | `auth_type == 'oauth2' && use_mid_server` | `OAuth2 cannot be combined with a MID Server. Choose one.` |
| 2 | `auth_type == 'basic' && auth_profile_oauth` non-empty | `Auth profile does not match the declared auth type (basic).` |
| 3 | `auth_type == 'oauth2' && auth_profile_basic` non-empty | `Auth profile does not match the declared auth type (oauth2).` |
| 4 | `use_mid_server && !mid_server` | `MID Server is enabled but no MID Server is selected.` |

Each aborts with `current.setAbortAction(true)` + `gs.addErrorMessage(...)`.

**Every Boolean read goes through `isTrue()`** — ported verbatim from the sibling's
`src/server/connector/util.ts`. §9: `getValue()` on a Boolean returns `'1'`/`'0'`, not
`'true'`/`'false'`, and the sibling shipped this exact rule with three of four branches dead.
Story L1-2 AC5 tests the mechanism, not just the outcome, and T1-4 greps for `=== 'true'`.

`business-rule-guide` / `module-guide` confirm `BusinessRule.script` **accepts a module function**,
so the rule body is a typed module under `src/server/business-rules/`, not an inline string.

---

# 4. OD4 — the field-mapping admin surface

**Resolved: a child mapping-row table, and `object_map` carries no `field_map` column at all.**

OD4's prohibition — *"You may not default to 'the admin hand-writes JSON'"* — and story L1-3's
criterion — *"can create a complete field mapping … **without typing a JSON brace**, timed and
observed by the tester"* — are met by making mapping rows first-class records.

## 4.1 `object_map` — one row per (system × logical object)

Table `x_335329_sn_hr_erp_object_map`.

| Column | Type | Notes |
|---|---|---|
| `erp_system` | Reference `…_erp_system`, mandatory, `cascadeRule: 'restrict'` | |
| `logical_object` | Choice, mandatory | the 16 of §2.1 |
| `endpoint_path` | String(255), mandatory | |
| `http_method` | Choice, default `get` | `get` / `post` |
| `response_root` | String(255) | dotted path to the record array |
| `query_template` | String(500) | `{external_id}` placeholder; field-read `admin` |
| `pagination_style` | Choice, default `none` | `none`/`offset`/`page`/`cursor`/`odata_skiptop`/**`next_url`** |
| `page_size` | Integer, default 100, 1–1000 | |
| `date_format` | String(40) | per-ERP parse hint |
| `deep_link_path` | String(120) | the per-object path segment for row deep links (§6 cross-cutting). Empty ⇒ **no link is drawn** |
| `mapping_source` | Choice, read-only | `manual` / `template` — set by the apply action, §5.3 |
| `mapping_verified` | Boolean, default `false` | mirrors the applied template's `verified`; drives the warning banner |
| `active` | Boolean, default `true` | |

`index: [{ name: 'idx_object_map_system_object', unique: true, element: ['erp_system', 'logical_object'] }]`
— story L1-3 AC3.

**There is no `field_map` column.** See §4.3.

## 4.2 `field_map` — the child mapping row

Table `x_335329_sn_hr_erp_field_map`. **One row per mapped field.** This is the whole of OD4's answer.

| Column | Type | Notes |
|---|---|---|
| `object_map` | Reference `…_object_map`, mandatory, `cascadeRule: 'delete'` | deleting the map deletes its rows |
| `logical_field` | Choice, mandatory | **filtered to the parent map's `logical_object`** via a reference-qualifier / dependent choice sourced from the §2.4 contract |
| `source_field` | String(200), mandatory | the ERP's own field name, e.g. `MENGE`, `QuantityOnHand`. Dotted paths permitted for nested JSON |
| `transform` | Choice, default `none` | `none` / `trim` / `upper` / `lower` / `abs` / `negate` / `percent_to_ratio` / `ratio_to_percent` / `date_only` |
| `zero_is_meaningful` | Boolean, default `false` | **§4.4 — this column is load-bearing for L6** |
| `note` | String(255) | free text, e.g. "confirmed against SAP sandbox 2026-08" |

`index: [{ name: 'idx_field_map_map_field', unique: true, element: ['object_map', 'logical_field'] }]`
— one logical field cannot be mapped twice on one object map.

**The admin experience, end to end, with no JSON:**

1. Open the `object_map` record.
2. Related list **Field Mappings**.
3. **New** → `logical_field` dropdown already filtered to that object's contract → `source_field`
   typed → optional `transform` → Submit.
4. Repeat per field. Copy a whole set from a vendor template with one UI Action (§5.3).

Story L1-3 AC6 — *"Mapping a source field to a logical field that does not exist in the contract
is refused with `Unknown logical field '<name>' for object '<object>'.`"* — is enforced twice: the
choice list cannot offer an invalid value, **and** a `before` Business Rule re-checks it, because
the choice list does not constrain a Table API insert.

## 4.3 Why `object_map.field_map` is deleted rather than kept as a generated mirror

The obvious middle path — keep the JSON column, regenerate it from the child rows with an `after`
Business Rule, and let the connector read one blob — was designed, then rejected.

**Rejected — generated JSON mirror on `object_map`.** It creates two representations of one truth.
The moment they disagree — a failed after-rule, a direct Table API insert into `field_map`, a
restored backup — the connector uses one and the admin screen shows the other, and the resulting
wrong figure is *unattributable*, which is precisely what story L2-2's last criterion forbids
(*"a figure whose provenance cannot name the mapping that produced it fails this story"*).

**Cost of deleting it:** `config-loader.loadMap()` gains one `GlideRecord` query against
`field_map` per (system × object). That is **bounded by the number of configured objects, not by
row count** — it is not an N+1 over data and does not touch L4-4's query budget, which counts
queries per `GET /data`, not per sync.

**Rejected — JSON blob plus a purpose-built editing UI.** A second SPA to build, style and test at
L1, months before L5 exists to reuse any of it.

**Rejected — raw JSON textarea.** OD4's explicit prohibition.

## 4.4 `zero_is_meaningful` — one column that prevents a wrong salary certificate

Story L6-4: *"A figure that arrives as an empty string, `null`, or `0` from the ERP is treated as
**unavailable** unless the mapping explicitly declares zero to be meaningful for that field."*

There is nowhere else for that declaration to live. It is per (object × field): a `0` on
`stock_item.qty` means the shelf is empty and is meaningful; a `0` on
`payroll_record.annual_gross_salary` means the call went wrong and must fail the document.

**Default `false`** — the safe direction. An unset flag makes a zero unavailable, which produces
a loud failure rather than a mortgage application with a zero on it.

---

# 5. `mapping_template` — seeded vendor defaults

Table `x_335329_sn_hr_erp_map_tmpl`, keyed on (`vendor`, `logical_object`).

| Column | Type | Notes |
|---|---|---|
| `vendor` | Choice, mandatory | same list as `erp_system.vendor` |
| `logical_object` | Choice, mandatory | the 16 of §2.1 |
| `field_map` | Json | **the one place JSON is the right storage** — see §5.1 |
| `endpoint_path_hint` | String(255) | suggested path, copied to `object_map` on apply |
| `response_root_hint` | String(255) | |
| `pagination_style_hint` | Choice | |
| `date_format_hint` | String(40) | |
| `verified` | Boolean, **default `false`** | story L1-4 AC3: zero rows have `verified=true` after deploy |
| `source_note` | String(500) | where the guess came from |

`index: [{ name: 'idx_map_tmpl_vendor_object', unique: true, element: ['vendor', 'logical_object'] }]`

## 5.1 Why JSON is correct here and wrong on `object_map`

`mapping_template.field_map` is a **seed payload**, never read at call time. Nothing resolves a
figure through it; the apply action expands it into `field_map` rows and the connector only ever
sees rows. It is data-at-rest that an admin never hand-edits, so OD4's prohibition does not reach
it — OD4 is about the *editing experience for live config*.

Shape: `{"<logical_field>": {"source": "<ERP field>", "transform": "none"}}`. Authored as a
literal `JSON.stringify(...)` in the Fluent seed — §9 records that a computed expression in a
Fluent `data` field can write `Symbol(CallExpressionShape)` into the column on a clean build, and
names `JSON.stringify` as the known-working exception. **No `.join()`, no template literal, no
`.map()` anywhere in a seed `data` value.**

## 5.2 Seeding coverage

Story L1-4 AC2: every vendor in the choice list has at least one template row; a vendor with zero
is **listed as a known gap**, not silently absent.

Realistic coverage, and it is deliberately uneven — pretending otherwise would be its own lie:

| Vendor | Objects templated | Basis |
|---|---|---|
| `sap_s4`, `sap_ecc` | finance 4, procurement 2, inventory 2 | OData naming conventions, public S/4 API field names |
| `oracle_fusion`, `oracle_ebs` | finance 4, procurement 2 | REST API conventions |
| `dynamics_365_fo` | finance 4, inventory 2 | Data-entity naming |
| `unit4` | finance 4 | |
| `netsuite`, `infor`, `workday` | 1 each — enough to prove the mechanism | **declared as a known gap** |
| `generic_rest`, `generic_odata` | 1 each, identity mapping (`qty` → `qty`) | the escape hatch |

**Assets and manufacturing objects have no vendor templates at all**, for every vendor. Stated in
the build report as a known gap: nobody on this project has seen a real fixed-asset or MES payload,
and a fabricated template flagged `verified: false` is still a fabrication that an admin might
apply and half-trust. Those five objects are mapped by hand until a real endpoint exists (OD3).

## 5.3 "Apply vendor defaults" — a UI Action, never a Business Rule

Story L1-4 AC4: inserting an `object_map` and re-reading it must show **no** mapping populated.
So the apply path is a **UI Action** on the `object_map` form, `admin`-gated, plus the same logic
exposed as a Script Include method for the Table API path.

Algorithm — the sibling's field-sync pattern (skip empty sources so a re-apply never blanks
existing data), adapted to rows:

```
1. tmpl = mapping_template[vendor = map.erp_system.vendor, logical_object = map.logical_object]
   none  → "No vendor default exists for <vendor> / <object>. Map by hand." and stop.
2. existing = one batched query of field_map rows for this object_map, keyed by logical_field.
3. for each logical_field in tmpl.field_map:
     if existing[logical_field] exists      → SKIP. Count as "already edited by an admin".
     if template source is empty            → SKIP.
     else insert a field_map row (mapping_source = 'template').
4. Copy *_hint values onto object_map ONLY where the target column is empty.
5. map.mapping_source = 'template'; map.mapping_verified = tmpl.verified.
6. Report: "Applied 6 default mappings, skipped 2 already edited by an admin."
```

Step 2 is a single query, not one per field — spec §9 *"Batch, never loop"*, story L4-4's spirit.

## 5.4 The unverified warning

Story L1-4 AC6. Where `object_map.mapping_verified == false && mapping_source == 'template'`, an
annotation on the form reads:

> **Unverified default mapping — this is a guess about `<vendor>`'s API. Confirm it against a real
> endpoint before trusting these figures.**

A module `Unverified Mappings` (`…_object_map_list.do?sysparm_query=mapping_verified=false^mapping_source=template`)
gives the one-step navigation of AC7. Clearing `mapping_verified` restores the banner (AC8) —
it is derived at render time, never cached.

## 5.5 An active map with no rows

Story L1-3 AC7 permits refuse-or-surface. **Chosen: surface, do not refuse.**

An `object_map` with `active=true` and zero `field_map` rows saves, and appears in the unverified
surface as:

> **No field mapping — this object will return no usable rows.**

**Rejected — refuse the save.** An admin legitimately creates the map first and adds rows to it
second; refusing makes the natural order impossible and pushes people to `active=false`-then-forget.
The story's real prohibition is *"silently accepting it and returning empty rows at L3"* — and
L3 does not do that: a run over a map with no rows is recorded `status = not_configured` with the
object named, never `success, rows_fetched = 0` (`docs/l3-staging-design.md` §4.3).

---

# 6. ACLs

Per `docs/l0-scaffold-design.md` §5.2, using the deny shape L0-7 proves.

| Table | R | C | W | D |
|---|---|---|---|---|
| `erp_system` | `viewer` | `admin` | `admin` | `admin` |
| `object_map` | `admin` | `admin` | `admin` | `admin` |
| `field_map` | `admin` | `admin` | `admin` | `admin` |
| `mapping_template` | `admin` | `admin` | `admin` | `admin` |

Field-read `admin` only: `erp_system.base_url`, `.auth_profile_basic`, `.auth_profile_oauth`,
`.auth_profile_mutual`, `.mid_server`, `object_map.query_template`.

Hard deny-write (`adminOverrides: false`): `object_map.mapping_source`,
`object_map.mapping_verified` — both are set by the apply action and must not be hand-set to
"verified" by someone who has not verified anything.

**`erp_system.circuit_open_until` is deliberately NOT deny-write.** The breaker writes it, and
spec §5.1 calls it *"admin-editable for manual reset"*. It is operational state, not provenance.

---

# 7. Build order

| # | Step | Depends on | Verify |
|---|---|---|---|
| **L1-1** | `src/server/contract/objects.ts` — the 16 objects, their categories, their logical fields (§2.4) | L0 | build clean; unit check asserts 16 objects and no duplicate field name within an object |
| **L1-2** | `src/fluent/tables/choices.ts` — `OBJECT_CHOICES`, `VENDOR_CHOICES`, `CATEGORY_CHOICES`, generated from L1-1 as **plain literals** | L1-1 | build clean. §9: no computed expression in a Fluent `data` value |
| **L1-3** | `erp_system` table + indexes | L1-2 | `now-sdk query sys_db_object -a dev -q "name=x_335329_sn_hr_erp_erp_system" -f name,ws_access,read_access` → `ws_access=true` |
| **L1-4** | `erp_system` ACLs (table + 5 field-read) | L1-3, L0-7 | T1-11 |
| **L1-5** | Config-validation Business Rule (§3.3) as a module | L1-3 | T1-2 … T1-5 |
| **L1-6** | `object_map` table + unique index | L1-3 | T1-6 |
| **L1-7** | `field_map` table + unique index + `logical_field` dependent choice | L1-6, L1-1 | T1-7 |
| **L1-8** | `before` BR on `field_map` validating `logical_field` against the contract | L1-7 | T1-8 |
| **L1-9** | `object_map` + `field_map` ACLs | L1-6, L1-7 | T1-12 |
| **L1-10** | `mapping_template` table + unique index | L1-2 | build clean |
| **L1-11** | Seed template rows (§5.2), `verified: false`, `JSON.stringify` literals only | L1-10 | T1-9 |
| **L1-12** | "Apply vendor defaults" UI Action + Script Include (§5.3) | L1-11, L1-7 | T1-10 |
| **L1-13** | Form layouts, the unverified annotation, the `Unverified Mappings` module | L1-12 | T1-13 |
| **L1-14** | **Gate demonstration L1-a** (§8) | all above | T1-14 |

---

# 8. OD10 — the L1 gate, split

The gate: *"A second ERP can be added as pure data, demonstrated."*

**It is not reworded.** The sibling weakened its T32b to make it pass and recorded that as a
mistake. This splits the gate into the half that can be demonstrated now and the half that cannot,
and reports the second half as **NOT MET**.

## 8.1 L1-a — MEETABLE NOW. "Pure data" = zero application files change.

Demonstration, in one recorded sitting:

1. Snapshot `now-sdk query sys_metadata -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f sys_id,sys_class_name,sys_updated_on --limit 500`. Record the time as **T₀**.
2. Through the **Table API and forms only** — no source edit, no build, no install — create:
   - a second `erp_system` row, **`generic_odata`** vendor, distinct `legal_entity`;
   - an `object_map` for `stock_item` whose `pagination_style` is **`odata_skiptop`** (the first system uses `none`), whose `date_format` differs, whose `response_root` differs, and whose `auth_type` on the parent system differs;
   - its `field_map` rows, created **through the related list**, no JSON typed.
3. Run a sync (L3) against it. Confirm staged rows with correct provenance naming the second system.
4. Re-query `sys_metadata` for this scope with `sys_updated_on > T₀`. **Expected: zero rows.**

**The `sys_metadata` delta is the gate evidence.** Not "it seemed to work" — a query that returns
nothing.

The second fixture is deliberately configured to differ in *pagination style, date format,
response root and auth type*, not merely in name and URL. Two identical fixtures pointed at the
same host prove only that the row count can go up.

## 8.2 L1-b — NOT MET. Blocked on OD3.

*"A genuinely different vendor API."*

Cannot be demonstrated. It requires a second real endpoint whose JSON shape, paging semantics and
date encoding are **not under our control**. `postman-echo.com` responds however we ask it to,
so a second fixture there tests our configuration surface against our own assumptions. That is
worth something — it is L1-a — and it is not this.

**What would close it:** OD3 supplies one real ERP endpoint. Then a *third* system against a
*second* real vendor closes L1-b, at which point the claim "a second ERP is pure data" has been
tested against an API nobody here designed.

**Until then, L1-b is recorded NOT MET in `docs/decision-log.md` and the build report.** L1 is
declared complete on L1-a **only if L1-b is recorded open in the same document.** Passing L1 with
L1-b silently absent is the failure mode this split exists to prevent.

## 8.3 What must not happen

- Do not add a second fixture on the same host with a different path and call it a different vendor.
- Do not reword the gate to "a second ERP *system* can be added as pure data" — that is L1-a
  wearing L1-b's name.
- Do not mark L1-b "N/A because no ERP exists". It is **blocked**, and blocked items get revisited.

---

# 9. Test plan

Every case traces to `docs/stories.md`. **NON-ADMIN** cases run in a real session as the named user.

| ID | Test | Precondition | Steps | Expected | Validates |
|---|---|---|---|---|---|
| **T1-1** | `erp_system` schema + `read_only` default | L1-3 | insert a row via Table API with no `read_only`; re-read | `read_only = true` | L1-1 AC1, AC2 |
| **T1-2** | Audit on `base_url` | T1-1 | `PATCH` `base_url`; query `sys_audit` | a row naming old and new value | L1-1 AC3 |
| **T1-3** | Vendor list complete | L1-2 | query `sys_choice` for `vendor` | all 11 of §3.2 | L1-1 AC4 |
| **T1-4** | Two systems, one vendor, different `legal_entity` | T1-1 | insert both | both save; both distinguishable in list views | L1-1 AC5 |
| **T1-5** | **All four validation branches, individually** | L1-5 | four separate Table API inserts, one per §3.3 row | four distinct messages, verbatim. **A single happy-path save is not evidence** | L1-2 AC1–AC4 |
| **T1-6** | Boolean branch is not dead | L1-5 | insert `use_mid_server=true`, `mid_server` empty | branch 4 fires. Also `grep -rn "=== 'true'\|!== 'true'" src/` → zero hits | L1-2 AC5 |
| **T1-7** | **No outbound call at save time** | L1-5 | insert `base_url = https://erp-invalid.invalid` | **saves successfully.** A rule that refuses an unreachable host fails this test | L1-2 AC6 |
| **T1-8** | Valid row saves silently | L1-5 | insert a coherent row | no message | L1-2 AC7 |
| **T1-9** | `object_map` uniqueness | L1-6 | insert a duplicate (`erp_system`, `logical_object`) | refused; the message names **both** values | L1-3 AC3 |
| **T1-10** | `{external_id}` round-trips | L1-6 | save `query_template = $filter=Customer eq '{external_id}'`; re-read | byte-identical, no substitution | L1-3 AC4 |
| **T1-11** | **No JSON brace typed** | L1-13 | tester, holding **only** `admin`, maps `stock_item` end to end through the UI, observed and timed | a complete mapping exists; **zero `{` characters typed.** If the only path is a raw JSON textarea, this is a FAIL and OD4 is unresolved | **L1-3 AC5 — OD4's gate criterion** |
| **T1-12** | Unknown logical field refused via **Table API** | L1-8 | `POST` a `field_map` row with `logical_field = 'nonsense'` | `Unknown logical field 'nonsense' for object 'stock_item'.` The choice list alone does not satisfy this — the API path must be covered | L1-3 AC6 |
| **T1-13** | Active map, zero rows, surfaced not silent | L1-13 | create `object_map` active with no `field_map` rows | appears in the unverified surface as `No field mapping — this object will return no usable rows.` | L1-3 AC7 |
| **T1-14** **NON-ADMIN** | Viewer cannot read `object_map` | L1-9 | as `hrerp_viewer_only`, `GET /api/now/table/x_335329_sn_hr_erp_object_map` | refused. **Not an empty 200** | L1-3 AC8 |
| **T1-15** | Every vendor has ≥1 template | L1-11 | `now-sdk query x_335329_sn_hr_erp_map_tmpl -a dev -q "" -f vendor,logical_object` | ≥1 per vendor; gaps of §5.2 listed in the build report | L1-4 AC2 |
| **T1-16** | Nothing ships verified | L1-11 | `-q "verified=true"` immediately after deploy | **zero rows** | L1-4 AC3 |
| **T1-17** | No silent auto-apply on insert | L1-12 | insert an `object_map` via Table API; query its `field_map` children | **zero rows.** A BR that populated them fails this | L1-4 AC4 |
| **T1-18** | **Overwrite protection** | T1-17 | map 8 fields; hand-edit 2; run "Apply vendor defaults" again | the 2 edits survive; message reads `Applied 6 default mappings, skipped 2 already edited by an admin.` | L1-4 AC5 |
| **T1-19** | Unverified banner renders and clears | L1-13 | apply an unverified template; read the form. Then set `mapping_verified=true`; then back to false | banner present → absent → present | L1-4 AC6, AC8 |
| **T1-20** | Unverified list one click away | L1-13 | as `admin`, open the module | filtered list renders | L1-4 AC7 |
| **T1-21** | Apply action batches | L1-12 | apply a 20-field template; count queries | bounded, independent of field count | §9 "batch, never loop" |
| **T1-22** | **GATE L1-a** | L1-14 | §8.1's four steps | `sys_metadata` delta for this scope since T₀ is **empty**; staged rows carry the second system's provenance | L1 gate, meetable half; `docs/stories.md` gap #1 |
| **T1-23** | **GATE L1-b** | — | none possible | recorded **NOT MET — blocked on OD3** in the decision log and build report. **Not rewritten to pass** | L1 gate, blocked half; OD10 |
| **T1-24** | Deny-write on `mapping_verified` | L1-9 | **as admin**, `PATCH` `object_map.mapping_verified`; re-read | refused, unchanged | L0-4 AC3 applied at L1 |
| **T1-25** | No hardcoded vendor field name in runtime code | any build | grep `src/server/connector/` and `src/server/sync/` for the source field names used in T1-11 | zero hits. A vendor field name as a string literal in runtime code is a design failure, exactly as a hardcoded URL would be | spec §5.2, sibling `field-mapper.ts` header |

---

# 10. Decision log — L1

### L1-D1 (OD9) — 16 logical objects; seven of the sibling's 17 dropped
**Chosen:** §2.1. Ten kept, seven dropped, six new (five from spec §6 plus `backorder`).
**Rejected — inherit all 17 additively, as spec §6's wording implies.** It would carry
`opportunity` and `job_requisition`, which spec §0 puts explicitly out of scope, and `employee` /
`labor_cost`, which stage exactly the HR dataset D2 forbids. The spec's own §0 and D2 override its
§6 arithmetic.
**Rejected — keep the dropped objects as inactive choices "for later".** A selectable
`opportunity` on an app that forbids CRM content is an invitation, and choice values cannot be
renamed away later without orphaning telemetry.
**Binds:** L3 `erp_category` has five values and no `hr`. L4 has exactly 15 KPI tiles, 5 charts
and 5 lists. Adding a 17th object is a `contract/objects.ts` edit plus a choice-list addition —
a code change, honestly declared, not a config change.

### L1-D2 — `backorder` is a new logical object
**Chosen:** §2.3. Unmapped by default; the tile renders not-configured until mapped.
**Rejected — derive from `stock_item.qty < 0`.** Encodes one vendor's convention in this app's
runtime, which is the failure `field-mapper.ts` exists to prevent.
**Rejected — drop the tile.** §6 Tab 3 asks for it.
**Rejected — a `backorder_qty` field on `stock_item`.** Backorders are their own records with
their own promised dates; folding them into stock rows loses the date the reorder list needs.

### L1-D3 (OD4) — child `field_map` table; `object_map.field_map` does not exist
**Chosen:** §4.2. Mapping rows are records, edited in a related list with a filtered choice list.
**Rejected — JSON blob + generated mirror.** Two representations of one truth; on divergence the
resulting wrong figure is unattributable (story L2-2's last criterion).
**Rejected — JSON blob + custom editor UI.** A second SPA at L1, before L5 exists to reuse it.
**Rejected — raw JSON textarea.** OD4's explicit prohibition.
**Cost accepted:** one extra bounded query per (system × object) in `loadMap()`. Not an N+1 over
data; does not enter L4-4's per-request budget.
**Binds:** the ported `config-loader.loadMap()` is modified — the one substantive change D4's
"do not rewrite from scratch" permits, recorded in `docs/l2-connector-design.md` §4.

### L1-D4 — `mapping_template.field_map` stays JSON
**Chosen:** §5.1. It is a seed payload, never read at call time, never hand-edited.
**Rejected — child rows for templates too.** ~200 seed records to author as Fluent literals for
data an admin never edits in place; the apply action would become a row-copy across two tables
for no gain in usability.
**Guarded:** authored only as `JSON.stringify(...)` literals — §9's `Symbol(CallExpressionShape)` trap.

### L1-D5 — Vendor defaults apply by explicit action only; assets and manufacturing ship untemplated
**Chosen:** §5.2, §5.3.
**Rejected — populate on insert.** Story L1-4 AC4 forbids it, and it would make every new map
silently a guess.
**Rejected — fabricate asset/MES templates so every object has one.** A `verified: false` flag on
an invented mapping is still an invented mapping that an admin may apply and half-trust. Declared
as a gap instead. Spec §5.2: *"Every shipped default mapping is a guess about someone else's API."*
An unfounded guess is worse than an absent one.

### L1-D6 — An active map with no field rows is surfaced, not refused
**Chosen:** §5.5. **Rejected — refuse the save.** It makes create-map-then-add-rows impossible.
The story's actual prohibition — silently returning empty rows at L3 — is honoured by L3
recording `not_configured`, not `success, rows_fetched = 0`.

### L1-D7 (OD10) — The L1 gate splits into L1-a (met) and L1-b (NOT MET, blocked on OD3)
**Chosen:** §8. **Rejected — reword the gate so a second fixture passes it.** Named in OD10 as
the sibling's recorded mistake.
**Rejected — declare the gate met because "pure data" is literally demonstrated.** True of L1-a
only; the gate says *"a second ERP"*, and an ERP is a vendor API, not a config row.
**Binds:** L2 may start on L1-a. The build report carries L1-b as an open gate until OD3 lands.

---

# 11. Risks and flags

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1-1 | `logical_field` dependent choice cannot be filtered by the parent map's `logical_object` in the platform's choice mechanism | The admin sees all ~90 logical fields, and T1-11 degrades from "no JSON" to "no JSON but confusing" | The `before` BR of L1-8 enforces correctness regardless. If the dependent choice will not filter, fall back to a reference-qualified reference field against a seeded `logical_field` catalogue table — **decide at L1-7, not at test time**, and record it |
| R1-2 | `field_map` row count grows large (16 objects × ~8 fields × N systems) | Admin fatigue; the thing OD4 exists to prevent | The apply action is the answer; T1-18 proves it does not destroy manual work |
| R1-3 | Seeded templates are guesses | An admin trusts an unverified mapping and a wrong figure reaches a tile | `verified: false` default, the form banner, the one-click list, and §5.2's refusal to fabricate asset/MES templates |
| R1-4 | Vendor choice values renamed later | Orphans `call_log`, `sync_run` and `field_map` history | Story L1-1 AC6's note on the table; a rename is a governance failure, not a refactor |
| R1-5 | L1-b stays open indefinitely | The app's central design claim remains untested against a real foreign API | Carried as an open gate in every build report until OD3 resolves. It is not allowed to quietly become "done" |

**Cross-scope:** none. All four tables, both business rules, the UI Action and the Script Include
live entirely in `x_335329_sn_hr_erp`. Reference columns point at `sys_auth_profile_basic`,
`oauth_entity_profile` and `ecc_agent`, which are reads of platform tables, not cross-scope calls
to another application.
