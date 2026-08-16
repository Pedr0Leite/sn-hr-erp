---
title: L3 — Staging, sync runs, provenance, staleness, retention
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-12
status: design-only. Resolves OD5 and proposes OD1 for human approval.
grounding: |
  Fluent shapes from `@servicenow/sdk` 4.9.0 `explain` (table-api, table-guide,
  scheduledscript-api, scheduled-script-guide, businessrule-api, acl-api, property-api).
  Table-cleaner facts cited to the ServiceNow corpus via `sn-rag`. Table names per
  `docs/l0-scaffold-design.md` §2.2; objects per `docs/l1-control-tower-design.md` §2.
---

# 1. Build `sync_run` first

Spec §7: *"`sync_run` is what makes the states distinguishable — design it first, not last."*
This document does, and so does §7's build order: `sync_run` is step L3-1, before `erp_staging`.

The reason is not sequencing hygiene. **`erp_staging` is meaningless without `sync_run`.** Zero
staged rows is three different sentences:

| Staging rows | Latest `sync_run` | Sentence on screen |
|---|---|---|
| 0 | `status = success` | `0` + `as of <date time>` — the ERP genuinely returned nothing |
| 0 or N | `status = failed` | `ERP did not answer` (+ last good figure, if any) — **never `0`** |
| 0 | **no run at all**, or `not_configured` | `Not configured — create an Object Map for <object>` |

A staging table designed before the run table gets a `fetched_at` and no way to tell those apart.

---

# 2. `sync_run` — the audit spine

Table `x_335329_sn_hr_erp_sync_run`. **One row per (system × object) per execution**
(`docs/stories.md` assumption 4).

| Column | Type | Notes |
|---|---|---|
| `erp_system` | Reference, mandatory, `cascadeRule: 'none'` | keep history if the system row goes |
| `logical_object` | Choice, mandatory | the 16 |
| `erp_category` | Choice | denormalised from the object contract so L4 can filter one tab's runs in one query |
| `started` | DateTime, mandatory | |
| `finished` | DateTime | empty while running |
| `status` | Choice, mandatory | `success` / `partial` / `failed` / `not_configured` — **exactly four** (story L3-2 AC2) |
| `rows_fetched` | Integer | **left empty, not 0, on a failed run** (story L3-2 AC3b) |
| `rows_upserted` | Integer | |
| `rows_deleted` | Integer | |
| `http_status` | Integer | |
| `error_message` | String(1000) | **field-read `admin` only** (L0 §5.4) |
| `duration_ms` | Integer | |
| `call_log` | Reference `…_call_log`, `cascadeRule: 'none'` | the last attempt this run made |
| `object_map` | Reference `…_object_map`, `cascadeRule: 'none'` | which mapping produced these rows |
| `pages_fetched` | Integer | `partial` names the page that failed |

```
index:
  idx_sync_run_sys_obj_started   (erp_system, logical_object, started)   — the state resolver's query
  idx_sync_run_status_started    (status, started)
  idx_sync_run_cat_started       (erp_category, started)                 — one tab's runs in one query
```

`audit: false`, `textIndex: false` — volume tuning, deliberate, matching the sibling's `call_log`
reasoning. `allowWebServiceAccess: true`.

## 2.1 `rows_fetched` empty vs zero — the whole rule in one column

Story L3-2 AC3b requires a failed run to carry `rows_fetched` **empty, not `0`**. This is the §7
rule applied to the audit table itself: `0` means *the ERP said zero*; empty means *we do not
know*. Enforced by the engine never calling `setValue('rows_fetched', 0)` on a non-success path,
and asserted by T3-4 reading the raw value back — `''`, not `'0'`.

## 2.2 Every `failed` run has an `error_message`

Story L3-2 AC4. Enforced by a `before` Business Rule: `status == 'failed'` with an empty
`error_message` aborts. The engine always has one — the connector's `ConnectorResult.errorMessage`
is never null on a failure — so the rule is a backstop against a future caller, not routine flow.

---

# 3. OD5 — the `erp_staging` shape

**Resolved: one header table carrying full provenance, a small fixed set of typed promoted
columns, and a JSON `payload` for everything else.**

Table `x_335329_sn_hr_erp_staging`.

## 3.1 Schema

**Provenance block** — every column here is hard deny-write (L0 §5.3):

| Column | Type | Notes |
|---|---|---|
| `erp_system` | Reference, mandatory, `cascadeRule: 'none'` | *which* system. Category alone is not provenance |
| `erp_category` | Choice, mandatory | `finance`/`procurement`/`inventory`/`assets`/`manufacturing`. **No `hr`** |
| `logical_object` | Choice, mandatory | one of the 14 staged |
| `source_record_id` | String(200), mandatory | the ERP's primary key — enables idempotent upsert |
| `fetched_at` | DateTime, mandatory | when the **ERP answered**. Drives every "as of" |
| `sync_run` | Reference, **mandatory** | story L3-1 AC6: a row with no run is impossible |
| `object_map` | Reference, `cascadeRule: 'none'` | which mapping produced this row |

**Promoted typed columns** — nine generic slots, filled from logical fields per §3.2:

| Column | Type | Carries |
|---|---|---|
| `amount` | Decimal | any monetary figure — invoice amount, PO value, asset valuation, depreciation |
| `qty` | Decimal | any count/quantity — units on hand, units backordered, output volume |
| `threshold` | Decimal | the per-row comparison partner — `safety_stock`, `target`, `reorder_point` |
| `ratio` | Decimal | 0–1 ratios — OEE and its three components |
| `status` | String(80) | the row's own state — `paid`, `pending`, `active`, `delayed`, `retired` |
| `dim` | String(200) | the single group-by dimension — period, warehouse, supplier category, lifecycle stage, day |
| `label` | String(300) | human display name — vendor, item name, asset name, machine |
| `code` | String(120) | the ERP-side business key shown to users — invoice number, SKU, WO number |
| `occurred_on` | DateTime | the row's own date — due, opened, started, period end, next-service |

**Payload and currency:**

| Column | Type | Notes |
|---|---|---|
| `payload` | Json | every mapped logical field, including the nine promoted, keyed by logical field name. The row-detail source and the deep-link value source |
| `currency_code` | String(3) | ISO code alongside `amount`. **Not a Currency column** — see §3.4 |
| `external_ref` | String(200) | the deep-link value. Empty ⇒ **no link is drawn** |

```
index:
  idx_staging_upsert  UNIQUE (erp_system, logical_object, source_record_id)   — §4.2
  idx_staging_obj_cat (erp_category, logical_object, fetched_at)              — L4's tab query
  idx_staging_run     (sync_run)                                              — retention + rollback
  idx_staging_dim     (logical_object, dim)                                   — chart group-by
```

`audit: false`. `allowWebServiceAccess: true` — ~20 acceptance criteria read this table via the
Table API. No create/write/delete ACL (L0 §5.6); read is `viewer`.

## 3.2 The promotion table — code, not configuration

`src/server/contract/promotion.ts`, derived from the object contract (L1 §2.4). Excerpt:

| Object | → `amount` | → `qty` | → `threshold` | → `dim` | → `code` | → `label` | → `occurred_on` | → `status` |
|---|---|---|---|---|---|---|---|---|
| `balance` | `amount` | — | — | `account` | `account_code` | `account_name` | `as_of` | — |
| `invoice` | `amount` | — | — | `customer` | `number` | `customer_name` | `due_on` | `status` |
| `vendor_invoice` | `amount` | — | — | `vendor` | `number` | `vendor` | `due_on` | `status` |
| `gl_summary` | `revenue` | — | `expense` | `period` | — | — | `period_end` | — |
| `purchase_order` | `amount` | — | — | `supplier_category` | `number` | `supplier` | `ordered_on` | `status` |
| `requisition` | `amount` | — | — | `department` | `number` | `requester` | `opened_on` | `status` |
| `stock_item` | — | `qty` | `safety_stock` | `location` | `sku` | `name` | — | — |
| `backorder` | — | `qty` | — | `location` | `sku` | `name` | `promised_on` | `status` |
| `fixed_asset` | `value` | — | — | `lifecycle_stage` | `asset_tag` | `name` | `eol_on` | `status` |
| `asset_depreciation` | `amount` | — | — | `period` | `asset_tag` | `asset_name` | `period_end` | — |
| `maintenance_schedule` | — | — | — | `asset_tag` | `asset_tag` | `asset_name` | `next_service_on` | `status` |
| `work_order` | — | — | — | `line` | `number` | `product` | `due_on` | `status` |
| `production_output` | — | `output` | `target` | `day` | `line` | `line_name` | `day_date` | — |
| `machine_downtime` | — | `duration_min` | — | `asset` | `asset` | `reason` | `started_on` | `severity` |

`gl_summary` uses `threshold` for `expense`, which is a slot reused for a second series rather
than a comparison partner. Flagged as the design's one impure use; the alternative is a tenth
column used by one object.

`production_output` also maps `oee`, `availability`, `performance`, `quality` into `payload` and
promotes the resolved OEE to `ratio` (OD7 — `docs/l5-ui-design.md` §5).

## 3.3 Why this shape

**Rejected — one wide table, JSON payload only, no typed columns.**
Every KPI becomes: read every row for the object, `JSON.parse` each, sum in script. That is a
full-table scan plus N parses per tile, **fifteen times per page open**, and it makes
`GlideAggregate` impossible. It fails story L4-4 outright — *"query count is independent of row
count … proven by running each tab against a 50-row and a 5,000-row staging fixture"* — because
while the *query count* stays constant, the work does not, and the sibling's own N+1 post-mortem
is about exactly this shape of mistake. It also makes the unique upsert index (§4.2) impossible,
since `source_record_id` would live inside the JSON.

**Rejected — one table per logical object, or per category.**
Strong querying, honest typing. Costs 14 (or 5) tables, 14 ACL sets, 14 sets of deny-write field
ACLs, and — fatally — **adding a 15th logical object becomes a schema change and a deploy**, which
kills the "second ERP is pure data" promise at the layer where it matters most. It also breaks
L4's cross-object tab query: Tab 4 aggregates three objects and would need three queries where the
chosen shape needs one `IN`.

**Rejected — a hybrid: typed tables for the four highest-volume objects, JSON for the rest.**
Two code paths through the state resolver, two upsert implementations, and the §7 four-state logic
written twice. §7 is the product; it gets exactly one implementation.

**Chosen — header + provenance + nine promoted typed columns + JSON payload**, which is the
spec's own "defensible middle path" (§5.3), made specific: the promoted set is *exactly* what
`command-center-spec.ts` proved the tabs aggregate, sort, filter and group by — `agg`+`field`,
`where.field`/`where.otherField`, `groupBy`, `sortBy`, `columns`. Nine slots cover all fifteen
KPIs, five charts and five lists.

**The cost, stated plainly:** the promoted columns are generic, so `amount` means different things
on different rows and a raw list view of `erp_staging` reads poorly. Mitigated by always filtering
list views by `logical_object`, and by `payload` holding the properly-named fields for row detail.
This is the price of keeping a 15th object a config change.

## 3.4 `amount` is a Decimal, not a Currency

`currency_code` is a plain 3-character string beside it.

**Rejected — a Currency/FX-Currency column.** It binds the value to the instance's currency
configuration and applies conversion at read time, which would mean a figure displayed on a tile
is not the figure the ERP returned. Spec §7's contract is *"an ERP answered and this is what it
said"*. A converted number is not what it said.

**Consequence, and it is a real limitation:** a tile summing `amount` across two systems reporting
in different currencies produces a meaningless total. **The L4 resolver must refuse to sum across
distinct `currency_code` values** and render the multi-currency tile as `partial` naming the
currencies — `docs/l4-api-design.md` §6.3. Discovered here, handled there.

## 3.5 `hr` cannot be staged — enforced three ways

1. `erp_category` has five choices; `hr` is not one.
2. `logical_object` on this table is restricted to the 14 staged objects; `payroll_record` and
   `employee_profile` are not selectable.
3. A `before` Business Rule aborts an insert naming either, with the exact message story L3-1 AC3
   requires: `Payroll and employee data are never staged (decision D2).` The choice list does not
   constrain a Table API insert; the rule does.

Story L3-1 AC4 — *"No column anywhere in the app stores a salary, a pay rate, or a payroll
amount"* — is asserted by a dictionary scan at sign-off (T3-20), not by inspection.

---

# 4. The sync engine

`src/server/sync/` — modules, bridged through a Script Include (`SyncEngine`), invoked by a
`ScheduledScript`.

## 4.1 One run per (system × object)

```
syncObject(systemSysId, logicalObject):
  1. run = insert sync_run { erp_system, logical_object, erp_category, started = now }
  2. result = ErpConnector.fetch(systemSysId, logicalObject)
  3. if result.status == 'not_configured':
        run.status = 'not_configured'; error_message = result.errorMessage
        rows_fetched LEFT EMPTY; finish; return          // NO staging write
  4. if !result.ok:
        run.status = 'failed'; error_message = ...; http_status = ...
        rows_fetched LEFT EMPTY; finish; return          // NO staging write, NO delete
  5. rows = mapResponse(result.body, map)                // L2 §4.4
  6. upsert(rows, run)                                   // §4.2
  7. reconcile absent rows                               // §4.3
  8. run.status = 'success' | 'partial'; counts; finish
```

**Step 4 writes nothing to staging and deletes nothing.** Story L3-3 AC5 — *"A failed run never
deletes staged rows"* — is a property of the control flow, not a guard clause someone can move.

## 4.2 Idempotent, batched upsert

Match key: (`erp_system`, `logical_object`, `source_record_id`), backed by the unique index.

```
1. ids = [r.source_record_id for r in rows if r.source_record_id]      // collect first
2. rows with an empty source_record_id → run.error_message detail, NOT inserted
3. existing = {}                                                       // ONE query
   gr = GlideRecord(staging)
   gr.addQuery('erp_system', sys); gr.addQuery('logical_object', obj)
   gr.addQuery('source_record_id', 'IN', ids)                          // batched IN
   while gr.next(): existing[gr.source_record_id] = gr.sys_id
4. for each row: update existing[id] or insert
5. seen = set(ids)   → step §4.3
```

**One query regardless of row count.** Story L3-3 AC4: *"a sync of N rows issues a bounded number
of queries independent of N. Proven by running a 200-row fixture and counting queries."*

`ids` is chunked at 500 per `IN` for very large responses — bounded by
`ceil(N/500)`, still independent of N in the sense the story tests (T3-9 runs 50 and 5,000).

**Empty `source_record_id` is rejected, not inserted** (story L3-3 AC2): an orphan with no key can
never be updated and would double on every subsequent sync — the exact defect the story exists to
prevent. It is counted and named in the run's error detail.

## 4.3 Rows present in staging but absent from the response — the explicit rule

Story L3-3 AC3 requires an explicitly-decided rule, recorded.

**Chosen: DELETE, and only after a `success` run — never after `partial` or `failed`.**

```
if run.status == 'success':
    delete staging rows where (erp_system, logical_object) matches
                        and source_record_id NOT IN seen     // batched, chunked
    rows_deleted = count
else:
    delete nothing; rows_deleted = 0
```

**Rejected — mark stale, retain.** A paid invoice, a retired asset and a received PO stay on the
tab forever. "Open accounts payable" would only ever grow, which is a wrong number presented
confidently — the failure mode this whole app exists to prevent.

**Rejected — retain everything, never delete.** Same defect, plus unbounded growth.

**Rejected — delete after `partial` too.** A `partial` run is *by definition* an incomplete view
of the source; every row on the unfetched pages would be deleted as absent, and the next tab open
would show a fraction of reality with a `success`-looking state. This restriction is the single
most important line in §4.3.

## 4.4 `partial`

A paginated fetch that succeeds on page 1 and fails on page 2:
- `status = 'partial'`, `pages_fetched = 1`, `error_message` **names the failing page**;
- page-1 rows **are** upserted (they are real data the ERP returned);
- **no deletion** (§4.3);
- **L4 never presents a `partial` run's rows as a complete set** (story L3-2 AC5). A tile fed by a
  `partial` run renders the `partial` state naming the system, per §0 R4 of `docs/stories.md`.

## 4.5 Pagination

`object_map.pagination_style` drives a loop of **bounded connector calls**. Each page is one
`ErpConnector.fetch()` with its own `MAX_TOTAL_CALL_MS` budget (L2 §2.2 — that constant is not
raised). The loop has its own ceiling:

| Guard | Value | Why |
|---|---|---|
| `MAX_PAGES` | 50 | 50 × `page_size` 100 = 5,000 rows, matching L4-4's large fixture |
| `MAX_SYNC_MS` | 240000 | 4 min, under the 300 s transaction quota, in a `ScheduledScript` not a user transaction |

Hitting either ceiling yields **`partial`**, not `success`, with `error_message` naming the ceiling.
A truncated set silently labelled `success` is a wrong number.

`next_url` (added per spec §5.2) follows the response-supplied URL. **It is validated to share the
host of `erp_system.base_url` before being called.** A `next_url` pointing elsewhere is treated as
end-of-pages and recorded — the same host-confinement reasoning as §9's redirect rule, which the
connector already enforces with `setFollowRedirect(false)`.

## 4.6 Where the engine runs, and the refresh path

Per L0 §5.6, `erp_staging` has no create ACL, so the engine's inserts must run as `system`.

| Trigger | Mechanism | Ships |
|---|---|---|
| Scheduled sync | `ScheduledScript`, `frequency: 'daily'` | **`active: false`** until armed |
| UI "Refresh this tab" | The L4 API enqueues; a `ScheduledScript` with `frequency: 'on_demand'` drains the queue | `active: false` until armed |
| Test drivers | `frequency: 'on_demand'` | `active: false` |

**The UI refresh syncs only the objects the active tab needs** (story L3-3 AC6). Tab 3 refreshes
`stock_item` and `backorder` on the systems that map them. **A refresh that fans out to every
configured system fails the story** — and the guard is structural: the enqueue call takes an
`erp_category`, and there is no method that takes none.

`scheduled-script-guide`: `executionInterval` is exclusive to `periodically` and setting it on any
other frequency is a build error. `on_demand` takes no timing fields at all — which is why it is
the right frequency for anything that must never fire unattended. The sibling shipped a
`periodically` driver `active: true` that fired every three minutes for days and was reported four
times. `on_demand` + `active: false` is two independent locks.

Per L0 F7, whether the script body is a module function or `Now.include()` + IIFE is decided by
step L0-9, not guessed here.

---

# 5. Staleness

`x_335329_sn_hr_erp.stale_after_hours`, default **24** (D5).

Computed **at read time, in the L4 state resolver, from `fetched_at`** — never stored, never from
`sys_updated_on`. Story L3-4 AC5 proves it: edit an unrelated field on a staged row and the
displayed age must not reset.

There is no `is_stale` column, deliberately. A stored flag is wrong the moment the property
changes, and story L3-4 AC1 requires that changing the property and reloading a tab flips a tile
between live and stale **with no code change** — impossible against a stored flag without a
back-fill job.

The threshold used is echoed into the payload so the tile can render what it actually compared
against (D5).

---

# 6. OD1 — retention proposal, for human approval

**Nothing here is armed until a human approves it** (story L3-5 AC2). The mechanism ships
`active: false` and the build report records the arming step explicitly.

## 6.1 Proposed windows

| Property | Proposed | Applies to | Reasoning |
|---|---|---|---|
| `staging_retention_days` | **90** | the base window, all five categories | One quarter. Long enough that Tab 1's "monthly revenue vs expenses" chart has a full quarter of `gl_summary` periods after a gap in syncing; short enough that this app is not a durable copy of another system's finances. It is also the shortest window that survives a two-week outage plus an end-of-quarter close without losing the comparison period |
| `staging_retention_inventory_days` | *(empty; recommended 30)* | `inventory` override | Stock levels older than a month have no analytical value — a low-stock alert from March is noise — and `stock_item` is the highest-volume object |
| `staging_retention_assets_days` | *(empty; recommended 365)* | `assets` override | "Assets depreciated this quarter" and "due for maintenance within 180 days" are annual-cycle figures. A 90-day window makes a quarterly figure un-recomputable after a sync gap |
| `sync_run_retention_days` | **730** | `sync_run` | **Deliberately longer than the longest staging window**, by more than 2×. Story L3-5 AC4: deleting the audit spine before the data it explains fails the story |

**Only `staging_retention_days` and `sync_run_retention_days` carry a value.** The two category
overrides ship **empty** and fall through to the base. That way governance approves **one number
now**, and per-category tuning is an admin decision later with no redeploy. Publishing three
numbers for approval invites a debate about inventory in a meeting about data protection.

## 6.2 Two guards the window does not get to override

1. **Never delete the latest `sync_run` for a (system × object), at any age.** If it goes, the
   tile loses its state and falls back to "not configured", which would tell a user that a
   correctly-configured object was never set up. Implemented as an exclusion set built from one
   `GlideAggregate` max-per-group query.
2. **Never touch `document_request`, `document_template`, `document_type`, `employee_xref` or any
   `sys_attachment`.** Story L3-5 AC5. The cleaner's queries name `erp_staging` and `sync_run`
   only, and T3-18 asserts the row counts of all five other tables are unchanged across a run.

## 6.3 Mechanism — a scoped `ScheduledScript`, not `sys_auto_flush`

**Chosen:** `ScheduledScript` `RetentionCleaner`, `frequency: 'daily'`, **`active: false`**, in
this scope, reading the properties at run time, deleting in chunks of 500.

**Rejected — `sys_auto_flush` (Table Cleanup), the platform-native mechanism.** It is genuinely
the native feature and would normally win. Four reasons it does not here:

1. **`sys_auto_flush` rows live in Global scope.** Spec §10.1 tells governance to expect
   higher-than-typical risk and to scrutinise Global usage; this app otherwise creates **zero**
   Global records, and spending that on a cleaner is a poor trade.
2. **Its `Age in seconds` is a number in a Global record, not this app's approved property.**
   OD1's whole point is an approved, auditable, in-scope window. Two sources of truth for a
   data-protection decision is exactly the wrong number of sources.
3. **It cannot ship disarmed in a way governance can see in this app's scope.**
4. **The two guards of §6.2 need a script anyway.** The corpus confirms `sys_auto_flush` supports
   a `Condition` field
   (`ServiceNowOfficialDocs/employee-service-management/hr-service-delivery/display-todos.md`:
   *"To specify a different condition in the retention policy, add a script in the Condition
   field"*), so guard 1 is expressible — but at that point it is a script in a Global record
   instead of a script in this scope, which is strictly worse.

**If governance prefers the native mechanism**, the swap is one `sys_auto_flush` row per category
plus the condition script, and it changes nothing else in this design. Recorded so the choice
stays open.

---

# 6a. What happens to staged data when the app is uninstalled (governance condition C2)

**Added 2026-08-12 at L0 by the developer, closing condition C2 of `docs/change-manifest.md`.**
The word "uninstall" appeared in none of the eight design documents. G-2 recorded the assumption
that *"scoped tables drop with the app, so staged financial data goes with it"*. **That assumption
is wrong, and it is wrong in the unsafe direction.**

## 6a.1 The documented behaviour

Grounded in `ServiceNowOfficialDocs/platform-administration/t_UninstallApplications.md`
("Uninstall an application > Procedure"), read via the `sn-rag` corpus on 2026-08-12:

> 4. … The following information is displayed in the pop-up window: … **Option to retain the
>    application tables and data.**
> 6. **To delete all data associated with this application, clear the `Retain tables and data`
>    check box. Leave this check box selected to remove only application files.**

And, in `.../application-manager/uninstall-application-app-mgr.md`:

> 4. If you want to delete fields and metadata associated with the application from your instance,
>    clear the check box labeled **Retain fields and data**.

**The retain option is presented as the thing you must actively clear.** An administrator who
uninstalls this app by clicking through the dialog removes the application *files* and **leaves
`x_335329_sn_hr_erp_staging` and every row of staged ERP financial data sitting on the instance** —
now with no application, no ACLs from this scope evaluating against it in any app context, and no
`RetentionCleaner` to age it out. The data outlives the controls built to protect it.

There is a second path that makes retention **non-optional**: the same document states that where a
dependent application was previously uninstalled with tables retained, *"the `Retain tables and
data` check box is selected by default and **can't be cleared**."*

## 6a.2 What this app states, and it is a statement not an inference

1. **Uninstalling this application does not, by default, delete staged ERP data.** Anyone
   uninstalling `SN HR&ERP` in order to remove ERP financial data from the instance **must clear
   `Retain tables and data`**, and must confirm afterwards that `x_335329_sn_hr_erp_staging`
   returns zero rows / no longer exists.
2. **`Delete` is not the same operation as `Uninstall`.** Per
   `.../platform-administration/c_RemovingApplications.md`, *delete* is for custom applications
   never shared with other instances and removes the application record; *uninstall* is the
   shared-application path with the retain option. `SN HR&ERP` has never been shared, so **delete**
   is the correct removal path on `dev296062` — but the moment this app is published to an update
   set or an app repo and installed elsewhere, uninstall-with-retain becomes the live risk on
   **that** instance, not this one.
3. **Decommissioning is therefore a two-step procedure, and step 2 is not optional.** Uninstall (or
   delete) the application, **then** verify the staging table is gone. A decommission that stops at
   step 1 has left a copy of the ERP's finance, procurement, inventory, asset and manufacturing
   data on a ServiceNow instance indefinitely.
4. **`sync_run` is subject to exactly the same behaviour** and is retained the same way. That is
   less alarming — it is an audit spine with no ERP figures in it — but it is stated so nobody
   infers a difference that does not exist.

## 6a.3 Verification status — honest

**Documented, not executed.** The claim above is grounded in the ServiceNow product documentation
and in the fact that the uninstall dialog offers the option at all. It has **not** been executed
against `dev296062`, because doing so requires uninstalling this application, and at L0 the
application is the thing being built.

**The verification step, for whoever runs it:** on a throwaway PDI or at the end of this project's
life, uninstall with `Retain tables and data` left at its default and query
`sys_db_object` for `x_335329_sn_hr_erp_staging`. A non-zero result confirms §6a.1. Until that is
run, §6a is a documented expectation, and it is recorded as such rather than as proven fact.

**Reversal of G-2:** `docs/change-manifest.md` G-2 should be read as *"uninstall does not remove
staged data unless the admin clears a checkbox"*, not as *"scoped tables drop with the app"*.

---

# 7. Build order

| # | Step | Depends on | Verify |
|---|---|---|---|
| **L3-1** | `sync_run` table + 3 indexes | L1, L2-3 | `ws_access=true` |
| **L3-2** | `sync_run` ACLs: read `viewer`; **field-read `error_message` = `admin`**; hard deny-write on every field | L3-1, L0-7 | T3-3, T3-19 |
| **L3-3** | `before` BR: `failed` requires `error_message` | L3-1 | T3-5 |
| **L3-4** | `erp_staging` table + 4 indexes | L3-1 | T3-1 |
| **L3-5** | `erp_staging` ACLs: read `viewer`; **no create/write/delete**; hard deny-write on all 7 provenance columns + all 9 promoted + `payload` | L3-4, L0-7 | T3-2, T3-19 |
| **L3-6** | `before` BR: reject `erp_category=hr`, reject `payroll_record`/`employee_profile`, require `sync_run` | L3-4 | T3-6, T3-7 |
| **L3-7** | `src/server/contract/promotion.ts` (§3.2) | L1-1 | unit check: every promoted target is one of the 9 slots; every object has ≥1 |
| **L3-8** | Sync engine: run lifecycle (§4.1) | L3-3, L2-14 | T3-4 |
| **L3-9** | Batched upsert (§4.2) | L3-8 | T3-8, T3-9 |
| **L3-10** | Absent-row reconciliation, `success`-only (§4.3) | L3-9 | T3-10, T3-11 |
| **L3-11** | Pagination + `partial` + the two ceilings (§4.4, §4.5) | L3-9 | T3-12, T3-13 |
| **L3-12** | `SyncEngine` Script Include bridge | L3-11 | build clean |
| **L3-13** | Scheduled sync `daily`, **`active: false`**; refresh drainer `on_demand`, **`active: false`** | L3-12 | T3-16 |
| **L3-14** | `RetentionCleaner` `daily`, **`active: false`**, + §6.2's two guards | L3-13 | T3-17, T3-18 |
| **L3-15** | Fixtures: 50-row and 5,000-row staging sets; an empty-array `success` fixture; a back-dated stale set | L3-9 | present |
| **L3-16** | **The L3 gate** (§8) | all | T3-14, T3-15 |

---

# 8. The L3 gate

Spec §4.2: *"A sync run populates rows with full provenance; a failed run is distinguishable from
an empty one, proven by query."*

Both halves meetable now with fixtures.

1. **Provenance:** run a sync; query a staged row and read back `erp_system`, `erp_category`,
   `logical_object`, `source_record_id`, `fetched_at`, `sync_run`, `object_map` — all seven
   populated. Pasted.
2. **Three-way distinguishability, by query, not inspection** (story L3-2 AC3):
   - (a) working map, ERP returns `[]` → `status=success`, `rows_fetched=0`
   - (b) same object at an unreachable host → `status=failed`, `error_message` non-empty,
     **`rows_fetched` empty — the literal `''`, not `'0'`**
   - (c) no `object_map` → `status=not_configured` (L2-D1), and L4 reads it as not-configured

   All three queried back and pasted.

---

# 9. Test plan

**NON-ADMIN** cases run in a real session as the named user.

| ID | Test | Precondition | Steps | Expected | Validates |
|---|---|---|---|---|---|
| **T3-1** | Staging schema complete | L3-4 | dictionary read | 7 provenance + 9 promoted + `payload` + `currency_code` + `external_ref` | L3-1 AC1 |
| **T3-2** | Provenance hard-deny holds | L3-5 | **as full `admin`**, `PATCH` `fetched_at` on a real staged row; re-read | refused; value unchanged. **An admin who can edit it fails this** | L3-1 AC5, L0-4 AC3 |
| **T3-3** **NON-ADMIN** | Viewer reads status, not error | L3-2 | as `hrerp_viewer_only`, `GET` a `sync_run` row | `status`, `started`, `finished` present; `error_message` **absent** | L3-2 AC6 |
| **T3-4** | `rows_fetched` empty on failure | L3-8 | force a failed run; read raw | literal `''`, **not `'0'`** | L3-2 AC3b |
| **T3-5** | `failed` demands a reason | L3-3 | insert `sync_run` `status=failed`, `error_message` empty | refused | L3-2 AC4 |
| **T3-6** | `hr` rejected | L3-6 | insert staging `erp_category=hr` | refused | L3-1 AC2 |
| **T3-7** | Payroll objects rejected | L3-6 | insert `logical_object=payroll_record`; then `employee_profile` | both refused with `Payroll and employee data are never staged (decision D2).` | L3-1 AC3 |
| **T3-8** | Upsert does not duplicate | L3-9 | run the same sync twice against an unchanged response | **row count unchanged**; `fetched_at` and `sync_run` updated on the existing rows | L3-3 AC1 |
| **T3-9** | Query count independent of N | L3-15 | instrument; run 200-row, then 50-row, then 5,000-row fixtures | bounded and equal (modulo `IN` chunking); **a count that scales with N fails** | L3-3 AC4 |
| **T3-10** | Empty `source_record_id` rejected, not orphaned | L3-9 | fixture with 3 rows lacking the key | 3 counted into the run's error detail; **zero inserted** | L3-3 AC2 |
| **T3-11** | **A failed run never deletes** | L3-10 | stage 50 rows successfully; force the next run to fail | **all 50 present, unchanged**; `rows_deleted = 0`; L4 reports failed-with-history | L3-3 AC5 |
| **T3-12** | A `partial` run never deletes | L3-11 | page 1 succeeds, page 2 fails, with 20 previously-staged rows absent from page 1 | `status=partial`; `rows_deleted = 0`; the 20 survive | §4.3, §4.4 |
| **T3-13** | `partial` names the page | L3-11 | as T3-12 | `error_message` names the failing page; `pages_fetched=1` | L3-2 AC5 |
| **T3-14** | **GATE — provenance** | L3-16 | §8 step 1 | all seven columns populated; pasted | L3 gate |
| **T3-15** | **GATE — three-way distinguishability** | L3-16 | §8 step 2 | three queries pasted; three distinct states | L3 gate, L3-2 AC3 |
| **T3-16** | Jobs ship disarmed | L3-13 | `now-sdk query sysauto_script -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f name,active,run_type` **after the final deploy** | every job `active=false`; drainer and drivers `run_type=on_demand` | L3-3 AC7 |
| **T3-17** | Retention deletes what it should | L3-14 | insert a back-dated staged row; arm the cleaner for one cycle; disarm | the row is gone | L3-5 AC3 |
| **T3-18** | Retention touches nothing else | T3-17 | count rows in `doc_req`, `doc_type`, `doc_tmpl`, `emp_xref`, `sys_attachment` before and after; and the latest `sync_run` per (system × object) | all unchanged; **the latest run survives regardless of age** | L3-5 AC4, AC5; §6.2 |
| **T3-19** | Cleaner disarmed until approved | L3-14 | read `sysauto_script` for `RetentionCleaner` | `active=false`; the arming step recorded in the build report. **An armed cleaner without recorded human approval fails this** | L3-5 AC2, AC6 |
| **T3-20** | No salary column anywhere | sign-off | `now-sdk query sys_dictionary -a dev -q "name STARTSWITH x_335329_sn_hr_erp" -f name,element,column_label` and scan | no column that could hold a salary, pay rate or payroll amount | L3-1 AC4, D2 |
| **T3-21** | Staleness from `fetched_at`, not `sys_updated_on` | L3-15 | back-date `fetched_at`; then edit an unrelated field as a permitted role; re-read the tile | the displayed age **does not reset** | L3-4 AC5 |
| **T3-22** | Threshold change flips state, no redeploy | L3-15 | set `stale_after_hours` 24 → 1; reload | tile flips live → stale | L3-4 AC1 |
| **T3-23** | Stale figures are shown, not hidden | L3-15 | stale fixture | the figure renders **with** the stale marker. A hidden tile reads as zero and fails | L3-4 AC6 |
| **T3-24** | Refresh is tab-scoped | L3-13 | trigger refresh from Tab 3; log the objects synced | only `stock_item` and `backorder`. **A fan-out to every system fails** | L3-3 AC6 |
| **T3-25** | Multi-currency is not silently summed | L3-15 | two systems, same object, different `currency_code` | the tile does not present one total; L4 renders `partial` naming the currencies | §3.4 |

---

# 10. Decision log — L3

### L3-D1 (OD5) — header + provenance + nine promoted typed columns + JSON payload
**Chosen:** §3.1–§3.2.
**Rejected — wide table, JSON only.** Fifteen full scans plus per-row `JSON.parse` per page open;
`GlideAggregate` impossible; the unique upsert index impossible because `source_record_id` would
live inside the JSON.
**Rejected — per-object (14) or per-category (5) tables.** Strong typing, but a 15th logical
object becomes a schema change and a deploy — killing the config-driven promise at the layer where
it is most load-bearing — and Tab 4's three-object aggregate needs three queries instead of one.
**Rejected — hybrid typed/JSON split by volume.** Two upsert paths and the §7 four-state logic
implemented twice. §7 gets one implementation.
**Cost accepted:** generic column names read poorly in a raw list view. Mitigated by always
filtering by `logical_object` and keeping properly-named fields in `payload`.

### L3-D2 — Absent rows are DELETED, and only after `success`
**Chosen:** §4.3.
**Rejected — mark stale / retain.** Paid invoices and retired assets accumulate; "open accounts
payable" only ever grows.
**Rejected — delete after `partial`.** A `partial` run is an incomplete view by definition;
deleting "absent" rows would delete everything on the unfetched pages and then present the
remainder as if complete.
**Binds:** `rows_deleted` is `0` on every non-`success` run, and T3-11/T3-12 assert it.

### L3-D3 — `amount` is Decimal + a plain `currency_code`
**Chosen:** §3.4. **Rejected — a Currency column with FX conversion.** A converted figure is not
what the ERP said, and §7's live state promises exactly what it said.
**Binds:** L4 refuses to sum across distinct currencies and renders `partial` — `docs/l4-api-design.md` §6.3.

### L3-D4 — No `is_stale` column; staleness is computed at read time
**Chosen:** §5. **Rejected — a stored flag maintained by a job.** Wrong the moment the property
changes, and story L3-4 AC1 requires the flip to need no code change and no back-fill.

### L3-D5 (OD1) — one approved base window of 90 days; two category overrides published but empty
**Chosen:** §6.1. `staging_retention_days = 90`, `sync_run_retention_days = 730`,
inventory/assets overrides shipped empty with recommended values documented.
**Rejected — three approved numbers up front.** Turns a data-protection approval into a debate
about inventory analytics.
**Rejected — one number for everything with no override path.** Assets genuinely need a longer
window than inventory, and a redeploy to change it is what D5 exists to avoid.
**Rejected — no retention at all.** D2's accepted cost 3 requires one.
**Status: PROPOSED. Requires explicit human approval before the cleaner is armed.**

### L3-D6 — Retention is a scoped `ScheduledScript`, not `sys_auto_flush`
**Chosen:** §6.3. **Rejected — the native Table Cleanup mechanism**, for four reasons, the first
being that it is a Global-scope record in an app that otherwise creates none.
**Left open:** if governance prefers native, the swap is one row per category plus a condition
script and changes nothing else here.

### L3-D7 — The engine runs as `system`; the UI refresh enqueues rather than syncs inline
**Chosen:** §4.6, following L0-D6. **Rejected — grant `erp_staging` create to `viewer` so a UI
refresh can write inline.** It makes every deny-write ACL on the table decorative, since a viewer
could insert a fabricated row with a fabricated `fetched_at`.
**Cost accepted:** a UI refresh is asynchronous. The SPA shows "Refresh queued" and the figures
update on the next poll or reload — honest, and it is what a "refresh" against a remote ERP
actually is.

---

# 11. Risks and flags

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R3-1 | The absent-row delete is written without the `success`-only guard | A `partial` run wipes the rows on its unfetched pages and presents the remainder as complete — a confidently wrong number, which is this app's defining failure mode | T3-12. The guard is control flow (§4.1 step 7 is unreachable on non-success), not a condition inside the delete |
| R3-2 | Nine generic promoted columns are misread as domain columns | Someone sorts a raw `erp_staging` list by `amount` across objects and gets nonsense | Always filter list views by `logical_object`; `payload` carries the named fields; §3.2 is the only mapping authority |
| R3-3 | Multi-currency summing | A meaningless total presented as live | L3-D3 + T3-25. **This is a genuine product gap if a real estate is multi-currency** — flagged to the human, because `partial` on every finance tile is a poor experience and per-currency sub-totals would be the real fix |
| R3-4 | The scheduled sync is armed before OD1 is approved | Data accumulates with no expiry | The cleaner and the sync are separate jobs; arming order is in the build report |
| R3-5 | `MAX_PAGES` / `MAX_SYNC_MS` hit routinely on a real estate | Permanent `partial` on high-volume objects | Both are constants with derivations; raising them is a design change with a re-derivation, not a tweak. Surfaces honestly as `partial` rather than as a silent truncation |
| R3-6 | 5,000-row fixture never built | L4-4's central claim is untested | L3-15 makes it a build step, not a test-time chore |
| R3-7 | `next_url` points off-host | Credentials to an unintended host | §4.5 validates the host against `base_url` before calling, mirroring the connector's redirect rule |

**Cross-scope:** none. **Global-scope records:** none — this is the layer where the temptation
existed (§6.3) and it was declined.
