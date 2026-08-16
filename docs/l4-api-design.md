---
title: L4 — Scripted REST API — one fat GET /data per tab, four states carried explicitly
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-12
status: design-only.
grounding: |
  Fluent shapes from `@servicenow/sdk` 4.9.0 `explain` (restapi-api, scripted-rest-api-guide,
  module-guide, acl-api, security-guide, property-api). Platform facts cited to the ServiceNow
  corpus via `sn-rag`. Depends on `docs/l3-staging-design.md` for the data contract and on
  `docs/l0-scaffold-design.md` §6 (Spike A) for the role-check mechanism.
---

# 1. What L4 is

**L4 is the single place the four-state rule is decided.** One implementation, consumed by the
BYOUI SPA now and by UI Builder data resources later (`docs/uib-page-spec.md`). Story L4-2's
implementation note says so explicitly, and it is the reason L5 has no state logic at all — L5's
renderer turns a state into a sentence; it never works out which state applies.

Spec §7: *"The REST payload carries every tile's state **explicitly** — the client never infers
state from an absent or zero value."*

---

# 2. The API surface

```ts
RestApi({
  $id: Now.ID['hub-api'],
  name: 'SN HR ERP Hub',
  serviceId: 'hub',                 // → /api/x_335329_sn_hr_erp/hub
  active: true,
  produces: 'application/json',
  routes: [
    { $id: Now.ID['hub-route-data'],    method: 'GET',  path: '/data',    /* §3 */ },
    { $id: Now.ID['hub-route-refresh'], method: 'POST', path: '/refresh', /* §8 */ },
  ],
})
```

`restapi-api` confirms `namespace` defaults to the application scope, so the base path is
`/api/x_335329_sn_hr_erp/hub` without declaring it.

Every route sets **`authentication: true`**. This matters and is easy to get wrong: the corpus
states that resource ACLs *"are only checked for **authenticated users**"*
(`ServiceNowOfficialDocs/api-reference/rest-api-explorer/t_WbSvcOpRqACL.md`). An `enforceAcl` list
alone therefore does **not** produce the 401 that story L4-3 AC5 requires — `authentication: true`
does.

Route `script` is a **module function**; `module-guide` lists `RestApi` route handlers among the
APIs that accept modules. The route body is thin: parse, delegate to `HubData` in
`src/server/api/`, serialise. Story L4-1's note — *"backed by a Script Include so no business
logic lives in the resource script"*.

## 2.1 One service, two routes — not one service per tab

**Rejected — `/data/financial`, `/data/inventory`, …** Five routes with five near-identical
bodies, five ACL sets, and a sixth tab becomes a deploy. The tab is a **parameter**, and an
unknown value is a 400 (story L4-1 AC5) rather than a 404 from the router — which is the
difference between "that tab does not exist" and "this API does not exist".

---

# 3. `GET /data`

| Parameter | Required | Notes |
|---|---|---|
| `tab` | **yes** | `financial` \| `procurement` \| `inventory` \| `assets` \| `manufacturing` |

| Condition | Response |
|---|---|
| `tab` missing | **400** `Missing required parameter 'tab'.` |
| `tab` unrecognised | **400** `Unknown tab '<value>'.` — not 200-with-empty-body, not 500 |
| unauthenticated | **401** |
| valid | **200**, §4 |

Story L4-1 AC4: *"Requesting `?tab=inventory` executes **no** query against finance objects."*
Structural, not a filter: the tab definition names its objects, and every query is built from that
list. There is no code path that reads an object the requested tab does not declare.

---

# 4. The payload

Short keys, per the Capacity Planner pattern and story L4-1 AC3. Documented here so the SPA and
the UIB spec bind against a written contract, not against observed output.

```jsonc
{
  "tab": "inventory",
  "gen": "2026-08-12 14:32:07",        // when THIS payload was built (not a data timestamp)
  "stale_h": 24,                        // the staleness threshold actually used (D5)
  "k": [ /* KPI tiles, in render order */ ],
  "c": [ /* charts */ ],
  "l": [ /* lists */ ]
}
```

## 4.1 The tile envelope — every tile, every type, no exceptions

```jsonc
{
  "id": "inv_low_stock",
  "lab": "Low stock alerts",
  "note": "Items below their own safety-stock threshold.",
  "fmt": "number",                      // number | currency | percent
  "st": "live",                         // live | stale | failed | not_configured | partial | restricted
  "v": 7,                               // ONLY present when st is live | stale | partial
  "as_of": "2026-08-11 03:00:00",       // present when st is live | stale | partial | failed(with history)
  "age_h": 35,                          // present when st is stale
  "obj": "stock_item",                  // ALWAYS present — the not-configured sentence needs it
  "sys": ["SAP S/4HANA Production"],    // contributing systems
  "deg": "SAP S/4HANA Production",      // present when st is partial or failed — which system degraded it
  "prev": { "v": 1204, "as_of": "2026-08-11 09:14:00", "age_h": 29 },  // failed WITH history
  "no_prev": true,                      // failed WITHOUT history
  "thr": { "name": "safety_stock", "kind": "per_row" },   // the threshold rendered (D5)
  "cur": "GBP"                          // present when fmt is currency
}
```

**Six invariants, and they are the whole layer:**

| # | Invariant | Test |
|---|---|---|
| **P1** | `st` is present on **every** tile object. A tile with no `st` fails story L4-2 AC1 | T4-5 |
| **P2** | `v` is present **only** when `st` ∈ {`live`, `stale`, `partial`}. It is **absent** — not `null`, not `0` — otherwise | T4-6 |
| **P3** | `v: 0` occurs **only** with `st: "live"`, and only when a `success` run returned an empty set or rows summing to zero | T4-7 |
| **P4** | `obj` is present on every tile, in every state. Without it the not-configured sentence cannot be built | T4-8 |
| **P5** | `st: "failed"` carries **either** `prev` **or** `no_prev: true`. Never neither | T4-9 |
| **P6** | `error_message` from `sync_run` **never** appears in the payload for a caller without `admin` | T4-16 |

**P2 is stated as absence rather than null on purpose.** A `null` in JSON is a value a careless
client renders as `0` or blank. An absent key makes `if ('v' in tile)` the only way to read it,
and makes a mistake a crash rather than a wrong number.

## 4.2 Charts

```jsonc
{
  "id": "fin_rev_exp", "lab": "Monthly revenue vs expenses", "type": "bar",
  "st": "live", "obj": "gl_summary", "as_of": "...",
  "cat": ["2026-04", "2026-05", "2026-06"],
  "s": [ { "lab": "Revenue", "d": [120000, 131000, 118000] },
         { "lab": "Expenses", "d": [98000, 101000, 99500] } ],
  "miss": ["Target not mapped"]         // series declared but unmapped — L5 states it, draws nothing
}
```

`cat` and `s` are present only under `live`/`stale`/`partial`. **Under `not_configured` or
`failed` they are absent entirely** — story L5-4 AC8: *"the chart area renders the not-configured
sentence and draws **no axes and no empty bars**. An empty chart frame reads as 'zero revenue'."*
Empty arrays would let a chart library draw an empty frame; absent keys cannot.

`miss` is how story L5-8's last criterion is met: an output-vs-target chart with `target` unmapped
returns one series and `miss: ["Target not mapped"]`. **It never returns a target series of zeros.**

## 4.3 Lists

```jsonc
{
  "id": "fin_overdue", "lab": "Top overdue vendor invoices",
  "st": "live", "obj": "vendor_invoice", "as_of": "...",
  "cols": [ {"k":"label","lab":"Vendor"}, {"k":"code","lab":"Invoice"},
            {"k":"amount","lab":"Amount","fmt":"currency"}, {"k":"occurred_on","lab":"Due"} ],
  "r": [ { "label": "Acme", "code": "INV-4471", "amount": 18400, "occurred_on": "2026-07-30",
           "link": "https://sap.example.com/invoice/4471" } ]
}
```

`link` is present **only** when `object_map.deep_link_path` is set **and** the row's
`external_ref` is non-empty. **Otherwise the key is absent and L5 draws no anchor** — story L5-10
AC2, AC3. Building the URL server-side, where `base_url` and `deep_link_path` both live, means the
client never has to decide whether it has enough to build a link.

Under `not_configured` / `failed`, `r` is **absent**. Story L5-4 AC9: an empty table with a
"No records" message reads as "no overdue invoices" and is a FAIL.

`caveat` (Tab 2 only, D3) is a static string on the list object, present **in every state** —
story L5-5 AC8.

---

# 5. The state resolver

`src/server/api/state-resolver.ts`. **The single place §7 is decided.**

## 5.1 Inputs, per (tile → logical object)

1. Is there an **active `object_map`** for this object on **any active `erp_system`**?
2. For each contributing (system × object), the **latest `sync_run`**.
3. The latest **`success`** run per pair, for the "last good figure".
4. Staged rows for the object.
5. `stale_after_hours`.

## 5.2 The decision, per contributing system

```
no active object_map on any active system   → not_configured        (obj named)
latest run is not_configured / no run       → not_configured        (obj named)
latest run is failed
      prior success exists                  → failed  + prev{v, as_of, age_h}
      no prior success                      → failed  + no_prev
latest run is partial                       → partial (deg = system name)
latest run is success
      fetched_at older than threshold       → stale   + v + as_of + age_h
      otherwise                             → live    + v + as_of
```

## 5.3 Aggregating across systems — §0 R4

*"the tile's state is the **worst** state among contributing systems, and the tile names which
system degraded it."*

Severity order, worst first:

```
not_configured  >  failed  >  partial  >  stale  >  live
```

`not_configured` outranks `failed` deliberately: an object mapped on system A and not mapped at
all on system B is showing a number for part of the estate while silently omitting the rest, and
"we cannot reach B" is a *less* accurate sentence than "B was never configured".

**Exception, and it matters:** if **at least one** system is `live`/`stale` and another is
`failed`/`partial`, the tile is **`partial`** — it carries `v` from the systems that answered,
`deg` naming the one that did not, and L5 renders `Partial — SAP S/4HANA Production did not
answer`. Only when **no** system produced a figure does the tile go to `failed` and drop `v`.

## 5.4 Currency (L3-D3)

Before summing a `currency` tile, the resolver groups the contributing rows by `currency_code`.
More than one distinct non-empty code ⇒ **`partial`**, `v` **absent**, and `deg` naming the
currencies rather than a system.

**This is not the ideal answer** — see §11 R4-3. It is the honest one: no code path silently adds
GBP to EUR.

## 5.5 The threshold echo (D5)

Every tile that applied a threshold carries `thr`, and L5 renders it. Two kinds:

- `{"name":"asset_high_value_amount","kind":"property","value":50000}` → *"over £50,000"*
- `{"name":"safety_stock","kind":"per_row"}` → *"below safety stock"*

**D5's hard limit, enforced here:** a threshold property makes a *comparison* configurable; it does
not invent a *field*. If the comparison field is unmapped — `safety_stock` on `stock_item`
(story L5-6 AC8), `target` on `production_output` — the tile is **`not_configured`** naming the
missing field, not a comparison against an implicit zero. `obj` carries the object and `thr.name`
the missing field, so L5 can render `Not configured — 'safety_stock' is not mapped for stock_item`.

---

# 6. Role gating (D6)

Story L4-3: the API refuses data the caller's role does not cover — *"never with the numbers
present and merely flagged for the client to hide"*.

## 6.1 The line, drawn explicitly

`docs/stories.md` assumption 1 asks the architect to draw it. D6 already did; here it is enumerated
so L4-3 and L5-9 have something concrete to test.

**`finance_viewer` gates every currency-formatted figure in the app:**

| Tab | Gated | Ungated |
|---|---|---|
| 1 Financial | **all three KPIs, the chart, the list** | — |
| 2 Procurement | **YTD procurement spend**, **the supplier-spend donut**, and the `amount` column of the approvals list | open POs count, requisitions-pending count, the list's other columns |
| 3 Inventory | — | everything (counts and quantities, no currency) |
| 4 Assets | **total asset valuation**, **the high-value list's `amount` column** | depreciation *count*, maintenance-due count, lifecycle pie |
| 5 Manufacturing | — | everything |

`asset_depreciation` deserves a note: *"assets depreciated this quarter"* is read as a **count of
assets**, `fmt: "number"`, ungated. A depreciation *value* would be currency and gated. The count
reading is chosen because §6 Tab 4 lists it beside two other counts.

**`hr_viewer` gates nothing on any of the five tabs.** No tab renders employee or payroll data —
D2 forbids staging it and no §6 tile asks for it. `hr_viewer` governs L6 only, and story L4-3 AC4
tests exactly that: `GET /data?tab=financial` as an `hr_viewer`-only user returns **no** financial
figures.

## 6.2 What a gated tile returns

```jsonc
{ "id": "fin_cash", "lab": "Cash balance", "st": "restricted", "obj": "balance", "fmt": "currency" }
```

`v` **absent**, `as_of` **absent**, `prev` **absent**. The figure is not in the response body at
all — story L5-4 AC12: *"financial figures are not present in the page source — not merely hidden
by CSS. Verified by viewing the network payload."*

`restricted` is a sixth `st` value on top of §7's four. It is a *presentation* state, not a data
state: §7's four describe what the ERP did; `restricted` describes what the caller may see. L5's
renderer handles it as a sixth branch with its own sentence, and it **never renders `0`** —
story L4-3 AC7.

## 6.3 How the role is checked

**Per `docs/l0-scaffold-design.md` §6, this is decided by Spike A at L0, not here.**

- **Spike A returns the row** → one `RoleCheck` module querying `sys_user_has_role`, called once
  per request, result cached in the request scope. **Never `gs.hasRole()`** (§9).
- **Spike A returns zero** → the compound Security Attribute of L0 §6.2, referenced from the route
  ACL, and the handler reads the ACL outcome rather than re-deriving the role.

Either way: **one call site**, one module, and T4-15 greps for `gs.hasRole` returning zero hits.

---

# 7. Query budget (story L4-4)

## 7.1 The per-request shape

For a tab declaring `O` logical objects (2–4 in practice):

| # | Query | Count |
|---|---|---|
| 1 | active `erp_system` rows | 1 |
| 2 | active `object_map` rows where `logical_object IN (tab objects)` | 1 |
| 3 | latest `sync_run` per (system × object) — `GlideAggregate` max(`started`) grouped | 1 |
| 4 | those `sync_run` rows by sys_id `IN` | 1 |
| 5 | latest **`success`** run per pair, for `prev` — `GlideAggregate` | 1 |
| 6 | KPI aggregates — one `GlideAggregate` over `erp_staging` filtered `logical_object IN (…)`, grouped by (`logical_object`, `erp_system`, `currency_code`) | 1 |
| 7 | chart series — one `GlideAggregate` grouped by (`logical_object`, `dim`) | 1 |
| 8 | list rows — one `GlideRecord` per list, `orderBy` + `setLimit` | 1 per list (1 per tab) |
| 9 | thresholds — `gs.getProperty()`, **not a query** | 0 |

**Budget: 8 queries per `GET /data`, independent of `O` and of row count.**

Recorded per tab in the build report, so a later regression is a FAIL rather than a performance
note (story L4-4 AC5).

## 7.2 The rules that keep it there

- **Reference display values are batched.** System names come from query 1's map, never from
  `getDisplayValue()` per row (story L4-4 AC4). The Capacity Planner rewrote both its hot paths
  for exactly this.
- **`GlideAggregate` wherever a count or sum is all that is needed** — queries 3, 5, 6, 7.
- **No `GlideRecord` inside a loop over result rows** — story L4-4 AC3, verified by reading and by
  the count-invariance test.
- **Low-stock and reorder use a per-row field comparison**, `qty < threshold`, which the promoted
  columns make expressible in one encoded query. Story L5-6 AC7 — *"compares quantity against
  **each item's own** `safety_stock`, not a global constant"* — is why `threshold` is a promoted
  column and not a property.

---

# 8. `POST /refresh`

```jsonc
// request
{ "tab": "inventory" }
// response
{ "queued": true, "objects": ["stock_item", "backorder"], "systems": 2 }
```

Enqueues a sync for **only the active tab's objects** (story L3-3 AC6) and returns immediately.
Per L3-D7 the write happens in a `ScheduledScript` running as `system`.

**Not a GET**, because it has an effect. **Not synchronous**, because a tab open must not block on
an ERP that may be timing out.

This is the one route that could fan out, so the guard is in the signature: it takes a `tab` and
there is no variant that takes nothing.

---

# 9. Build order

| # | Step | Depends on | Verify |
|---|---|---|---|
| **L4-1** | `src/server/api/tabs.ts` — the five tab definitions: which tiles, which objects, which `agg`/`where`/`groupBy`/`columns`. **Data only, no logic**, mirroring `command-center-spec.ts` | L3-7 | unit check: every object named is one of the 14 staged |
| **L4-2** | `state-resolver.ts` (§5) with **no** platform dependency in its decision function — a pure function from (map presence, runs, rows, threshold) to a state | L3-16 | unit-level table test over all six states + the R4 aggregation |
| **L4-3** | `RoleCheck` module, per Spike A's outcome (§6.3) | L0-8 | T4-15 |
| **L4-4** | `HubData` — queries 1–8 of §7.1, batched | L4-2 | T4-13 |
| **L4-5** | Currency guard (§5.4) | L4-4 | T4-14 |
| **L4-6** | `RestApi` + `GET /data`, `authentication: true`, 400 handling | L4-4 | T4-1 … T4-4 |
| **L4-7** | Route ACLs / `enforceAcl` + the `restricted` masking (§6.2) | L4-6, L4-3 | T4-10 … T4-12 |
| **L4-8** | `POST /refresh` (§8) | L4-6 | T4-17 |
| **L4-9** | Write `docs/api-contract.md` — §4 verbatim, as the binding contract for L5 and `uib-page-spec.md` | L4-6 | exists |
| **L4-10** | **The L4 gate** (§10) | all | T4-18 |

---

# 10. The L4 gate

Spec §4.2: *"Returns correct four-state payload for every tile, including not-configured and
failed."*

Story L4-2 AC8 sharpens it: *"The four states are produced for at least one tile on **every** tab,
by manipulating fixtures, and the raw JSON for each is pasted as evidence. Happy-path-only evidence
fails this story."*

**20 payload captures: 5 tabs × 4 states.** Plus story L4-2 AC6's sweep across **all** tiles —
15 KPIs, 5 charts, 5 lists — asserting no `v: 0` under a non-`live` state.

Fixture recipes:

| State | How |
|---|---|
| `live` | working map, `success` run, rows present |
| `live` with `v: 0` | working map, `success` run, response `[]` |
| `stale` | back-date `fetched_at` past the threshold |
| `failed` (with history) | one success, then repoint to `erp-invalid.invalid` |
| `failed` (no history) | a fresh object, first run against the broken host |
| `not_configured` | deactivate or delete the `object_map` |
| `partial` | two systems, one healthy, one broken |
| `restricted` | call as `hrerp_viewer_only` |

---

# 11. Test plan

**NON-ADMIN** cases run as the named user against the live endpoint.

| ID | Test | Precondition | Steps | Expected | Validates |
|---|---|---|---|---|---|
| **T4-1** | One call renders a tab | L4-6 | `GET /data?tab=financial` | KPIs, chart and list in **one** response. A tab needing two calls fails | L4-1 AC1, AC2 |
| **T4-2** | Unknown tab | L4-6 | `?tab=nonsense` | **400** `Unknown tab 'nonsense'.` Not 200-empty, not 500 | L4-1 AC5 |
| **T4-3** | Missing tab | L4-6 | no parameter | **400** naming the parameter | L4-1 AC6 |
| **T4-4** | No cross-tab fan-out | L4-6 | instrument queries; `?tab=inventory` | zero queries touch finance objects | L4-1 AC4 |
| **T4-5** | Every tile has `st` | L4-6 | all five tabs; walk the raw JSON | every object in `k`, `c`, `l` has `st`. **One missing fails** | L4-2 AC1, P1 |
| **T4-6** | `v` absent, not null, when not live-ish | fixtures | not_configured + failed captures | `'v' in tile` is **false**. `null` fails as hard as `0` | P2 |
| **T4-7** | **No `0` under a non-live state** | fixtures | sweep **all 25 tiles** across all five tabs in every state | zero occurrences of `v: 0` where `st != "live"`. **One occurrence fails this story outright** | **L4-2 AC6 — the central assertion** |
| **T4-8** | Live zero is possible | empty-array fixture | `success` run, `[]` | `{"st":"live","v":0,"as_of":...}` | L4-2 AC5, P3 |
| **T4-9** | not_configured names its object | fixtures | delete an `object_map` | `st: "not_configured"`, `obj: "stock_item"`. A tile omitting `obj` fails — the sentence cannot be built | L4-2 AC2, P4 |
| **T4-10** | failed carries history or says it has none | fixtures | both recipes | `prev{v, as_of, age_h}` **or** `no_prev: true`. Never neither | L4-2 AC3, P5 |
| **T4-11** | stale carries figure + `fetched_at` | back-dated | | `v`, `as_of`, `age_h` all present | L4-2 AC4 |
| **T4-12** | partial names the degraded system | two systems | one healthy, one broken | `st: "partial"`, `v` present, `deg` = the broken system's name | L4-2 AC7, §0 R4 |
| **T4-13** **NON-ADMIN** | viewer gets no financial figures | L4-7 | as `hrerp_viewer_only`, `?tab=financial` | `st: "restricted"`, **no `v` anywhere in the body**. Not present-and-flagged | L4-3 AC1, L5-4 AC12 |
| **T4-14** **NON-ADMIN** | finance_viewer gets them | L4-7 | as `hrerp_finance_only` (+ `viewer`, per L0-D2) | figures present. **If this returns `restricted`, Spike A's outcome was misapplied** — §6.3 | L4-3 AC2 |
| **T4-15** **NON-ADMIN** | hr_viewer gets no financials | L4-7 | as `hrerp_hr_only`, `?tab=financial` | `restricted`. `hr_viewer` does not imply `finance_viewer` | L4-3 AC4 |
| **T4-16** **NON-ADMIN** | finance_viewer refused HR surfaces | L4-7, L6 | as `hrerp_finance_only`, any payroll-bearing endpoint | refused | L4-3 AC3 |
| **T4-17** | Unauthenticated → 401 | L4-6 | no credentials | **401**. Driven by `authentication: true`, since resource ACLs are checked only for authenticated users | L4-3 AC5 |
| **T4-18** | No `error_message` leak | L4-7 | as `hrerp_viewer_only`, force a failed tile | no endpoint, host or credential detail anywhere in the body | P6, L0 §5.4 |
| **T4-19** | No `gs.hasRole()` | any build | `grep -rn "gs.hasRole" src/` | zero hits | L4-3 note, §9 |
| **T4-20** | Query count invariant | L3-15 | each tab against 50-row and 5,000-row fixtures; count queries | equal, and equal to the recorded budget. **Scaling with N fails** | L4-4 AC1, AC2 |
| **T4-21** | No query in a loop | L4-4 | read every module under `src/server/api/` | no `GlideRecord`/`GlideAggregate` construction inside a row loop | L4-4 AC3 |
| **T4-22** | Reference display values batched | L4-4 | 500-row list fixture; count queries | unchanged from the 50-row run | L4-4 AC4 |
| **T4-23** | Multi-currency not summed | L3 fixture | two systems, different `currency_code` | `st: "partial"`, `v` absent, `deg` names the currencies | L3-D3 |
| **T4-24** | Unmapped comparison field ⇒ not_configured | fixtures | unmap `safety_stock` on `stock_item` | low-stock tile `not_configured`, `thr.name = "safety_stock"`. **Not a comparison against zero, and not `0`** | L5-6 AC8, D5's hard limit |
| **T4-25** | Chart omits series/categories when not live | fixtures | unmap `gl_summary` | `cat` and `s` **absent**, not empty arrays. Empty arrays let a library draw an empty frame that reads as zero revenue | L5-4 AC8 |
| **T4-26** | List omits rows when not live | fixtures | failed finance run | `r` **absent**. Not `[]` with a "No records" label | L5-4 AC9 |
| **T4-27** | Deep link present only when buildable | fixtures | one row with `external_ref` + `deep_link_path`; one without each | `link` present in case 1; **key absent** in the others | L5-10 AC2, AC3 |
| **T4-28** | Threshold echoed | L4-4 | Tab 4 | `thr: {name:"asset_high_value_amount", kind:"property", value:50000}` | D5 |
| **T4-29** | Refresh is tab-scoped | L4-8 | `POST /refresh {"tab":"inventory"}` | only `stock_item` + `backorder` enqueued | L3-3 AC6 |
| **T4-30** | **GATE — 20 captures** | L4-10 | §10 | four states × five tabs, raw JSON pasted. **Happy-path-only evidence fails** | L4 gate, L4-2 AC8 |

---

# 12. Decision log — L4

### L4-D1 — `restricted` is a sixth `st` value, not a `not_configured` reuse
**Chosen:** §6.2. **Rejected — return `not_configured` for a gated tile.** It would tell a viewer
that a correctly-configured object was never set up, which is a lie and would send an admin
hunting for a missing map that exists.
**Rejected — omit gated tiles entirely.** A missing tile reads as zero (story L3-4 AC6's logic
applied to layout), and the tab silently changes shape by role, which makes screenshots
incomparable between users.

### L4-D2 — `v` is **absent**, never `null`, when the state has no figure
**Chosen:** P2. **Rejected — `"v": null`.** A null is a value a careless client renders as blank
or `0`, and §7's whole point is that absence must be impossible to confuse with zero. Absence
makes a mistake a crash.

### L4-D3 — `not_configured` outranks `failed` in the R4 severity order
**Chosen:** §5.3. **Rejected — `failed` worst.** A tile aggregating a mapped system and an
unmapped one is silently omitting part of the estate; "never configured" is the more accurate and
more actionable sentence than "did not answer".
**Refined:** when at least one system produced a figure and another did not, the tile is
`partial` with `v` present — otherwise a single broken system in a ten-system estate would blank
a figure nine systems answered.

### L4-D4 — Deep-link URLs are built server-side
**Chosen:** §4.3. **Rejected — send `base_url` + `deep_link_path` + `external_ref` and let the
client join them.** The client would need the join rule (story L5-10 AC4: trailing-slash
handling) and, worse, would have to decide whether it has enough to draw a link — which is how a
dead anchor gets drawn. Server-side, `link` present means the link is complete.

### L4-D5 — The tab is a parameter, not a route
**Chosen:** §2.1. **Rejected — one route per tab.** Five bodies, five ACL sets, and an unknown tab
becomes a router 404 rather than the 400 story L4-1 AC5 requires.

### L4-D6 — `asset_depreciation` renders as a count, ungated
**Chosen:** §6.1. **Rejected — a currency value, `finance_viewer`-gated.** §6 Tab 4 lists it
beside two counts. **Flagged:** if the product owner means a monetary total, it moves under
`finance_viewer` and `fmt` becomes `currency` — a one-line change in `tabs.ts` and one row in
§6.1's table.

### L4-D7 — The state resolver's decision function is pure and platform-free
**Chosen:** L4-2. It takes plain inputs and returns a state, so all six states and the R4
aggregation are testable without fixtures, an instance or a browser.
**Rejected — resolve inline inside `HubData`.** The four-state rule is the product; the product's
core logic should not require an ERP outage to test.

---

# 13. Risks and flags

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R4-1 | A tile is added later without `st` | Silent regression of the one rule the app exists for | T4-5 walks the whole payload generically. `tabs.ts` is data; the envelope is built by one function every tile passes through |
| R4-2 | Spike A misapplied — role check fails closed | `finance_viewer` sees `restricted` on Tab 1. Passes every admin test | T4-14 is the canary and is **NON-ADMIN**. Admin evidence does not count |
| R4-3 | Multi-currency estates get `partial` on every finance tile | Poor experience; users may read `partial` as a fault | **Genuine product gap, flagged for the human.** The right fix is per-currency sub-totals in the tile envelope (`v` becomes a map keyed by currency), which is a contract change and therefore a decision, not a patch. Today's behaviour is honest but blunt |
| R4-4 | `GlideAggregate` on `dim` over a large table without the index | Query 7 degrades as data grows while the *count* stays at 8 | `idx_staging_dim` (L3 §3.1). T4-20 measures at 5,000 rows |
| R4-5 | `restricted` leaks a figure via a chart or list column | The tab hides the KPI but the donut still plots spend | §6.1 gates the **donut and the list column**, not just the KPI. T4-13 asserts no `v` **anywhere** in the body |
| R4-6 | The budget of 8 is recorded but never re-measured | Regression becomes a "performance note" | Story L4-4 AC5: exceeding the recorded budget is a **FAIL** |

**Cross-scope:** none. **Global-scope records:** none. The API reads only this app's four tables
plus `sys_properties` and, depending on Spike A, `sys_user_has_role`.
