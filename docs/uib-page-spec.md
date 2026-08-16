---
title: UI Builder page specification — Page Component Tree and Data Binding Schema
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-12
status: |
  Design deliverable per D1. A human assembles this page in UI Builder from this document,
  without redesigning the application. It describes a UIB page; it does not replace the BYOUI
  hub of `docs/l5-ui-design.md`, and both bind to the same L4 payload contract.
grounding: |
  UI Builder vocabulary and binding syntax taken from the ServiceNow documentation corpus via
  `sn-rag`: `ServiceNowOfficialDocs/application-development/ui-builder/data-resources.md`
  (data binding, data resource types, inherited vs local, the one-GlideForm note) and
  `ServiceNowOfficialDocs/api-reference/ui-builder-api-reference/apiAPI.md`.
  Payload contract: `docs/l4-api-design.md` §4.
---

# 0. Vocabulary — read this first

The object that fetches data in UI Builder is a **data resource**. This document uses that term
throughout and uses no other. The Playbook / CSM / dashboard term for a different mechanism —
the one story DOC-1 forbids by name — appears nowhere in this document, including here.

The corpus states the available data resource categories directly
(`data-resources.md`, "Types of data sources available in UI Builder"):

| Category | Description (verbatim) |
|---|---|
| Controller | *"Encapsulates data and event logic and enables presets for components."* |
| GraphQL | *"GraphQL queries and mutations that are executed."* |
| Transform | *"Script that transforms the input data into another format."* |
| Client state | *"Client-side data resources that include the client information, domain-specific states or logic, user preferences, and so on."* |
| Composite | *"Single reusable data resource that contains multiple data resources."* |
| REST | *"Data resources that are made through REST API requests."* |

and *"Data resources fetch data from Glide, GraphQL, and REST APIs, then transform it for use in a
component on a UI Builder page."*

## 0.1 The four binding forms

Verbatim from `data-resources.md`, "Using data binding in UI Builder":

| Form | Syntax | Corpus definition |
|---|---|---|
| **Data resource binding** | `@data.<resource_id>.<output>` | *"Use data resources to fetch data from the back end of your instance… `@data.lookup_record_1.result.number.displayValue`"* |
| **Context binding** | `@context.props.<name>` | *"Use URL parameters to connect parts of the URL with your page's properties… `@context.props.table`"* |
| **Client state parameter binding** | `@state.<name>` | *"Use `@state` syntax to bind a state property to a client state parameter."* |
| **Component binding** | `@elements.<component_id>.<property>` | *"connect one component to another… `@elements.list_menu_1.selectedListId`"* |

## 0.2 The one-GlideForm constraint

`data-resources.md`, line 54, verbatim:

> **Note:** Only one GlideForm is supported per page in UI Builder.

**How this page stays within it: it uses zero GlideForms.** Every tile, chart and list on all five
tabs is fed by one REST data resource per tab; no component on this page views or edits a
ServiceNow record, so no GlideForm data resource is added. The constraint is therefore satisfied
with four to spare, and §7 records what would have to change if a record form were ever added.

## 0.3 Inherited versus local data resources

Verbatim from `data-resources.md`, "Inherited versus local data resources in UI Builder":

> Inherited data resources share information from the surrounding parts of a UI Builder page such
> as an application… If you get this information from the frame, you don't have to get it again
> yourself.
>
> Local data resources are items you add to a UI Builder page yourself.

and *"Inherited data resources are automatically loaded into a UI Builder page, and local data
resource instances can be added and configured."*

**This distinction is what makes §4's per-tab lazy loading possible, and getting it wrong breaks
the requirement.** Assignments are in §3.1.

---

# 1. The page

| Property | Value |
|---|---|
| Experience | UX App for scope `x_335329_sn_hr_erp` |
| Page name | `SN HR&ERP — Consolidated Hub` |
| Route | `hub` |
| Page property | `tab` — string, default `financial` |
| URL | `/x/335329/sn_hr_erp/hub?tab=inventory` |

The page property `tab` is the state machine's single input, bound as `@context.props.tab` and
mirrored into a client state parameter `@state.activeTab` (§3.3) so components can change it
without a route change.

---

# 2. What the page binds to

**One Scripted REST endpoint, already built at L4:**

```
GET /api/x_335329_sn_hr_erp/hub/data?tab=<tab>
```

The payload contract is `docs/l4-api-design.md` §4 and is **not restated here** — the two documents
must not be able to drift. What matters for binding is its shape:

```
{ tab, gen, stale_h, k: [tile…], c: [chart…], l: [list…] }
```

and the **tile envelope**, which every KPI, chart and list carries:

```
{ id, lab, note, fmt, st, v?, as_of?, age_h?, obj, sys[], deg?, prev?, no_prev?, thr?, cur? }
```

with `st` ∈ `live` | `stale` | `failed` | `not_configured` | `partial` | `restricted`.

**The three payload invariants this page depends on, restated because the component tree is built
on them:**

- `st` is present on **every** tile object.
- `v` is **absent** — not `null`, not `0` — unless `st` is `live`, `stale` or `partial`.
- `v: 0` occurs **only** with `st: "live"`.

---

# 3. Data resources

## 3.1 The register

| # | Resource ID | Category | Inherited / Local | Executes | Purpose |
|---|---|---|---|---|---|
| DR-1 | `hub_financial` | **REST** | **Local** | tab = `financial` only | `GET /hub/data?tab=financial` |
| DR-2 | `hub_procurement` | **REST** | **Local** | tab = `procurement` only | `GET /hub/data?tab=procurement` |
| DR-3 | `hub_inventory` | **REST** | **Local** | tab = `inventory` only | `GET /hub/data?tab=inventory` |
| DR-4 | `hub_assets` | **REST** | **Local** | tab = `assets` only | `GET /hub/data?tab=assets` |
| DR-5 | `hub_manufacturing` | **REST** | **Local** | tab = `manufacturing` only | `GET /hub/data?tab=manufacturing` |
| DR-6 | `active_tab` | **Client state** | **Local** | always | holds `@state.activeTab`; the state machine's memory |
| DR-7 | `tile_view` | **Transform** | **Local** | on any `hub_*` output change | §3.4 — the single place a state becomes render instructions |
| DR-8 | `user_context` | *(inherited)* | **Inherited** | automatically | current user, from the experience frame. Not re-fetched |
| DR-9 | `theme_context` | *(inherited)* | **Inherited** | automatically | Polaris theme tokens from the frame |

**All five `hub_*` resources are LOCAL, and that is the load-bearing choice.** An inherited data
resource *"is automatically loaded into a UI Builder page"* — five inherited resources would fire
five REST calls on every page open, which is precisely the failure story L5-1 AC3 forbids
(*"A page open that calls `/data` five times fails this story"*). Local resources are added per
page and configured, including when they execute.

DR-8 and DR-9 are inherited because the experience already has them: *"If you get this information
from the frame, you don't have to get it again yourself."* Adding a local "get current user"
resource would re-fetch what the frame already holds.

## 3.2 REST resource configuration (DR-1 … DR-5, identical but for `tab`)

| Setting | Value |
|---|---|
| Method | `GET` |
| Base path | `/api/x_335329_sn_hr_erp/hub/data` |
| Query parameter `tab` | the literal for this resource — `financial`, `procurement`, … |
| Execution | **Manual / conditional** — see §4. **Not** "on page load" |
| Refresh policy | on explicit user action only |
| Outputs | `result` (the payload), `loading`, `error`, `requestSucceeded` |

`apiAPI.md` documents `requestSucceeded` as *"the last fetch attempt for the data resource instance
finished successfully; otherwise, false"* — used in §6.2 for the transport-failure branch, which is
distinct from the payload's own `failed` state.

**Each resource is hard-wired to its own `tab` literal rather than binding `tab` to
`@state.activeTab`.** One resource parameterised by state would re-fetch on every tab switch,
including a switch *back*, destroying the "return to a loaded tab issues no call" requirement.
Five resources with five literals give five independent caches for free.

## 3.3 Client state parameters

| Parameter | Type | Initial | Purpose |
|---|---|---|---|
| `activeTab` | string | `@context.props.tab` | the current tab |
| `loadedTabs` | array | `[]` | tabs already fetched — the lazy-load memory |
| `refreshing` | boolean | `false` | a `POST /hub/refresh` is in flight |

Bound as `@state.activeTab`, `@state.loadedTabs`, `@state.refreshing`.

## 3.4 DR-7 `tile_view` — one Transform, and it exists for one reason

**Category: Transform** — *"Script that transforms the input data into another format."*

Input: the active tab's payload. Output: the same tiles, each with three added render fields:

```
headline   string | null    // the formatted figure, or null when no numeral may be shown
sub        string           // the §7 sentence
tone       string           // informational | warning | critical | neutral
```

**Why this is a data resource and not per-component logic.** Story L5-3 AC1: *"One renderer
function handles all four states and is the only place a tile's text is produced. A tile with its
own inline state handling fails this story."* In UI Builder, the equivalent of "one renderer" is
one Transform data resource that every component binds through. Twenty-five components each with a
conditional binding is twenty-five interpretations of "no data" — the exact drift that criterion
forbids.

**`headline` is `null`, not `""` or `"—"`, in every non-figure state**, and components bind
visibility to `headline !== null`. That is how "renders **no numeral at all**" (story L5-3 AC4) is
expressed as a binding rather than as a string that happens to look empty.

**The Transform never invents a state.** It reads `st` and maps it. An unrecognised or absent `st`
produces `headline: null`, `sub: "State unavailable — this tile cannot be trusted"`,
`tone: "critical"` — story L5-3 AC7. **It never falls back to `live`.**

---

# 4. Per-tab lazy loading — the mandatory behaviour

Spec §6: *"Lazy loading is mandatory, not an optimisation. Only the active tab's data resources
execute. A 'refresh' action must not fan out to every system at once."*

## 4.1 The rule, per resource

Each `hub_*` resource executes **only** when both hold:

```
@state.activeTab == '<its own tab>'
AND '<its own tab>' NOT IN @state.loadedTabs
```

## 4.2 The event wiring

| Event | Actions, in order |
|---|---|
| Page load | 1. `@state.activeTab = @context.props.tab` (default `financial`) 2. evaluate §4.1 → **exactly one** resource executes 3. append that tab to `@state.loadedTabs` |
| Tab clicked | 1. `@state.activeTab = <clicked>` 2. evaluate §4.1 → executes **only if not already loaded** 3. append on success |
| Refresh clicked | 1. `@state.refreshing = true` 2. `POST /hub/refresh {tab: @state.activeTab}` 3. remove the active tab from `@state.loadedTabs` 4. re-execute **that one** resource 5. `@state.refreshing = false` |
| Route change (`?tab=`) | as "tab clicked", from `@context.props.tab` |

**Step 3 of Refresh is what confines the refresh to one tab.** Clearing `@state.loadedTabs`
entirely would re-fetch all five on the next switch — a fan-out wearing lazy loading's clothes.

## 4.3 What a reviewer must be able to state after reading this

- A page open executes **exactly one** REST data resource.
- A tab switch to an unvisited tab executes **exactly one** further REST data resource.
- A tab switch back executes **none**.
- Refresh executes **one** REST data resource and **one** POST, for the active tab only.
- **A tab switch must not trigger the other four tabs' data resources.**

---

# 5. Page Component Tree

Indentation is containment. Every leaf names the binding it reads. Components with no binding are
marked **static**.

```
Page: hub
│
├── container:page_shell                                              static
│   │
│   ├── heading:page_title                                            static  "Consolidated ERP Hub"
│   │
│   ├── text:generated_stamp
│   │     content ← @data.tile_view.result.gen                        "Data generated 12 Aug 2026 14:32"
│   │
│   ├── tab_list:hub_tabs                                             static labels
│   │     selectedTab      ← @state.activeTab
│   │     onTabSelected    → set @state.activeTab (§4.2)
│   │     tabs: Financial Health & Ledger | Procurement & Sourcing |
│   │           Inventory & Supply Chain  | Fixed Assets & Equipment |
│   │           Manufacturing & Production
│   │
│   ├── button:refresh_active_tab                                     static label "Refresh this tab"
│   │     disabled         ← @state.refreshing
│   │     onClick          → §4.2 Refresh
│   │
│   ├── loading_indicator:tab_loading
│   │     visible          ← @data.hub_financial.loading OR … OR @data.hub_manufacturing.loading
│   │
│   ├── alert:transport_error
│   │     visible          ← active resource requestSucceeded == false
│   │     content          ← "The hub could not load this tab."      §6.2
│   │
│   ├── container:tab_financial      visible ← @state.activeTab == 'financial'
│   │   ├── kpi_row:fin_kpis
│   │   │   ├── stateful_tile:fin_cash            ← @data.tile_view.result.k[0]
│   │   │   ├── stateful_tile:fin_ar              ← @data.tile_view.result.k[1]
│   │   │   └── stateful_tile:fin_ap              ← @data.tile_view.result.k[2]
│   │   ├── stateful_chart:fin_rev_exp            ← @data.tile_view.result.c[0]
│   │   └── stateful_list:fin_overdue             ← @data.tile_view.result.l[0]
│   │
│   ├── container:tab_procurement    visible ← @state.activeTab == 'procurement'
│   │   ├── kpi_row:proc_kpis
│   │   │   ├── stateful_tile:proc_open_po        ← @data.tile_view.result.k[0]
│   │   │   ├── stateful_tile:proc_pending_req    ← @data.tile_view.result.k[1]
│   │   │   └── stateful_tile:proc_ytd_spend      ← @data.tile_view.result.k[2]
│   │   ├── stateful_chart:proc_supplier_donut    ← @data.tile_view.result.c[0]
│   │   ├── callout:proc_caveat                                       static, ALWAYS VISIBLE  §6.4
│   │   └── stateful_list:proc_approvals          ← @data.tile_view.result.l[0]
│   │       ── NO approve action, NO reject action, in any state, for any role.  §6.4
│   │
│   ├── container:tab_inventory      visible ← @state.activeTab == 'inventory'
│   │   ├── kpi_row:inv_kpis
│   │   │   ├── stateful_tile:inv_sku_count       ← @data.tile_view.result.k[0]
│   │   │   ├── stateful_tile:inv_low_stock       ← @data.tile_view.result.k[1]
│   │   │   └── stateful_tile:inv_backorder       ← @data.tile_view.result.k[2]
│   │   ├── stateful_chart:inv_by_location        ← @data.tile_view.result.c[0]
│   │   └── stateful_list:inv_reorder             ← @data.tile_view.result.l[0]
│   │
│   ├── container:tab_assets         visible ← @state.activeTab == 'assets'
│   │   ├── callout:assets_source_note                                static  §6.5
│   │   ├── kpi_row:asset_kpis
│   │   │   ├── stateful_tile:ast_valuation       ← @data.tile_view.result.k[0]
│   │   │   ├── stateful_tile:ast_depreciated     ← @data.tile_view.result.k[1]
│   │   │   └── stateful_tile:ast_maint_due       ← @data.tile_view.result.k[2]
│   │   ├── stateful_chart:ast_lifecycle_pie      ← @data.tile_view.result.c[0]
│   │   └── stateful_list:ast_high_value_eol      ← @data.tile_view.result.l[0]
│   │
│   └── container:tab_manufacturing  visible ← @state.activeTab == 'manufacturing'
│       ├── kpi_row:mfg_kpis
│       │   ├── stateful_tile:mfg_oee             ← @data.tile_view.result.k[0]
│       │   ├── stateful_tile:mfg_active_wo       ← @data.tile_view.result.k[1]
│       │   └── stateful_tile:mfg_delayed_wo      ← @data.tile_view.result.k[2]
│       ├── stateful_chart:mfg_output_target      ← @data.tile_view.result.c[0]
│       └── stateful_list:mfg_downtime            ← @data.tile_view.result.l[0]
```

**25 data-bound components: 15 KPI tiles, 5 charts, 5 lists.** Plus `generated_stamp`,
`hub_tabs`, `tab_loading` and `transport_error`. The three static components —
`page_title`, `proc_caveat`, `assets_source_note` — are annotated as static, per the requirement
that a component with no binding is either removed or annotated.

**`@data.tile_view.result` resolves against the active tab** because DR-7's input is the active
tab's payload (§3.4). Indices are stable: L4's `tabs.ts` emits `k`, `c` and `l` in a fixed render
order.

---

# 6. The four states in the component tree

**This is the section that makes the tree correct rather than decorative.** A component tree that
expresses only the live state is a tree that renders `0` for an absence.

## 6.1 `stateful_tile` — the internal structure, per tile

Every one of the 15 KPI tiles is this structure. No tile deviates.

```
card:<tile_id>
│   accessibleLabel ← <tile>.lab + ", " + <tile>.sub
│
├── text:<tile_id>_label
│     content   ← <tile>.lab                                  ALWAYS visible
│
├── heading:<tile_id>_headline
│     content   ← <tile>.headline
│     visible   ← <tile>.headline != null          ◄── THE CRITICAL BINDING
│
├── icon:<tile_id>_state_icon
│     glyph     ← <tile>.tone → check | clock | alert | info | lock
│     visible   ← <tile>.st != 'live'
│
├── text:<tile_id>_sub
│     content   ← <tile>.sub                                  ALWAYS visible
│     tone      ← <tile>.tone
│
├── text:<tile_id>_prev
│     content   ← "Last good figure: " + <tile>.prev.v + " (as of " + <tile>.prev.as_of + ", " + <tile>.prev.age_h + "h old)"
│     visible   ← <tile>.st == 'failed' AND <tile>.prev != null
│
├── text:<tile_id>_threshold
│     content   ← <tile>.thr rendered                         e.g. "over £50,000"
│     visible   ← <tile>.thr != null
│
└── text:<tile_id>_note
      content   ← <tile>.note                                 ALWAYS visible
```

**`visible ← headline != null` is the single most important binding on this page.** It is what
makes "renders no numeral at all" (story L5-3 AC4) a structural property rather than a formatting
convention.

**Never bind `visible` to `<tile>.v != null` or to `<tile>.v > 0`.** The first is fragile against
an absent key; the second hides a genuine live zero, which is the one case where `0` **must**
appear (story L5-6 AC6).

## 6.2 The state → binding matrix

| `st` | `headline` | `_headline` visible | `_sub` content | `_prev` visible | Icon |
|---|---|---|---|---|---|
| `live` | the figure, **including `0`** | **yes** | `as of 12 Aug 2026 14:32` | no | hidden |
| `stale` | the figure | **yes** | `Stale — as of 09 Aug 2026 03:00 (3 days old)` | no | clock |
| `failed` + `prev` | `null` | **no** | `ERP did not answer` | **yes** | alert |
| `failed` + `no_prev` | `null` | **no** | `ERP did not answer — no previous figure` | no | alert |
| `not_configured` | `null` | **no** | ``Not configured — create an Object Map for `stock_item` `` | no | info |
| `partial` | the figure | **yes** | `Partial — SAP S/4HANA Production did not answer` | no | alert |
| `restricted` | `null` | **no** | `Restricted — this figure requires the finance_viewer role` | no | lock |
| absent / unknown | `null` | **no** | `State unavailable — this tile cannot be trusted` | no | alert |

`0` appears **only** on the `live` row. Story L4-2 AC6 asserts the same rule on the raw JSON; this
table asserts it in the bindings.

**Transport failure is a separate concern.** If the REST data resource itself fails —
`requestSucceeded == false` — no payload exists and there are no tiles to bind. `alert:transport_error`
covers it. **The tiles must not render a default state in that case**; their containers bind
visibility to the presence of `@data.tile_view.result`, so nothing draws rather than something
drawing wrongly.

## 6.3 `stateful_chart`

```
container:<chart_id>
├── text:<chart_id>_label        ← <chart>.lab                ALWAYS
├── chart:<chart_id>_canvas
│     categories ← <chart>.cat
│     series     ← <chart>.s
│     visible    ← <chart>.st IN ('live','stale','partial')   ◄── CRITICAL
├── text:<chart_id>_state
│     content    ← <chart>.sub
│     visible    ← <chart>.st NOT IN ('live','stale','partial')
├── text:<chart_id>_missing
│     content    ← <chart>.miss joined                        e.g. "Target not mapped"
│     visible    ← <chart>.miss non-empty
└── table:<chart_id>_data_alt
      rows       ← <chart>.cat + <chart>.s                    behind a "View as data" toggle
```

**The chart component must not render when `st` is not live-ish** — story L5-4 AC8: *"the chart
area renders the not-configured sentence and draws **no axes and no empty bars**. An empty chart
frame reads as 'zero revenue'."*

The L4 contract supports this structurally: under `not_configured` / `failed` / `restricted`, `cat`
and `s` are **absent keys, not empty arrays**, so a chart component bound to them has nothing to
plot even if the visibility binding were wrong. **Do not "fix" a missing category array by
defaulting it to `[]` in the Transform.** That defeat is invisible until an executive reads it as
zero revenue.

## 6.4 `stateful_list`, and Tab 2's caveat

```
container:<list_id>
├── text:<list_id>_label      ← <list>.lab                    ALWAYS
├── callout:<list_id>_caveat  ← <list>.caveat                 visible ← caveat != null   (ALWAYS, every state)
├── table:<list_id>_rows
│     columns ← <list>.cols
│     rows    ← <list>.r
│     visible ← <list>.st IN ('live','stale','partial')       ◄── CRITICAL
│     per-row link cell:
│        link:<list_id>_row_link
│          href    ← row.link
│          visible ← row.link != null                         ◄── no anchor when absent
└── text:<list_id>_state      ← <list>.sub
      visible ← <list>.st NOT IN ('live','stale','partial')
```

**No "No records found" empty state is configured on the table component.** Story L5-4 AC9: an
empty table with a "No records" message reads as "no overdue invoices" and is a FAIL. When there
are no rows to show, the table is **not visible** and the state text is.

**Tab 2, per D3 — the binding requirement stated as a prohibition:**

> `stateful_list:proc_approvals` has **no row action, no bulk action, no context menu item and no
> button** anywhere in its configuration. Not a disabled one. Not a hidden one. Not one bound to a
> role condition. **The controls are not added to the component.**

`callout:proc_caveat` is static and always visible, in every state including `not_configured` and
`failed` (story L5-5 AC8), reading verbatim:

> Approve and Reject are not shown. These requisitions live in the ERP and are not mirrored into
> ServiceNow approvals, so a decision made here could not be written back. Use the ERP link on each row.

## 6.5 Tab 4's source note

`callout:assets_source_note`, static, always visible (OD6 — display-only):

> Figures are from the ERP and are not reconciled against ServiceNow asset or CMDB records.

## 6.6 Accessibility

Story L5-3 AC8 — colour alone is not the distinction. Each tile carries `accessibleLabel` combining
`lab` and `sub`, so a screen reader hears *"Low stock alerts, ERP did not answer"* rather than a
tone. The state icon is a **glyph difference**, not a colour difference. Every chart has the
`_data_alt` table.

---

# 7. Data Binding Schema — the complete register

Every binding on the page, in one table. A reviewer should be able to reconstruct the page from
this alone.

| Component | Property | Binding |
|---|---|---|
| `generated_stamp` | content | `@data.tile_view.result.gen` |
| `hub_tabs` | selectedTab | `@state.activeTab` |
| `hub_tabs` | onTabSelected | → set `@state.activeTab`, evaluate §4.1 |
| `refresh_active_tab` | disabled | `@state.refreshing` |
| `refresh_active_tab` | onClick | → §4.2 Refresh |
| `tab_loading` | visible | `@data.hub_financial.loading` OR … OR `@data.hub_manufacturing.loading` |
| `transport_error` | visible | active resource `.requestSucceeded == false` |
| `tab_<name>` container | visible | `@state.activeTab == '<name>'` |
| `<tile>_label` | content | `@data.tile_view.result.k[i].lab` |
| `<tile>_headline` | content | `@data.tile_view.result.k[i].headline` |
| `<tile>_headline` | **visible** | `@data.tile_view.result.k[i].headline != null` |
| `<tile>_sub` | content | `@data.tile_view.result.k[i].sub` |
| `<tile>_sub` | tone | `@data.tile_view.result.k[i].tone` |
| `<tile>_state_icon` | visible | `@data.tile_view.result.k[i].st != 'live'` |
| `<tile>_prev` | visible | `k[i].st == 'failed' AND k[i].prev != null` |
| `<tile>_threshold` | visible | `k[i].thr != null` |
| `<tile>_note` | content | `@data.tile_view.result.k[i].note` |
| `<chart>_canvas` | categories | `@data.tile_view.result.c[j].cat` |
| `<chart>_canvas` | series | `@data.tile_view.result.c[j].s` |
| `<chart>_canvas` | **visible** | `c[j].st IN ('live','stale','partial')` |
| `<chart>_state` | visible | `c[j].st NOT IN ('live','stale','partial')` |
| `<chart>_missing` | visible | `c[j].miss` non-empty |
| `<list>_rows` | columns | `@data.tile_view.result.l[m].cols` |
| `<list>_rows` | rows | `@data.tile_view.result.l[m].r` |
| `<list>_rows` | **visible** | `l[m].st IN ('live','stale','partial')` |
| `<list>_row_link` | href | `row.link` |
| `<list>_row_link` | **visible** | `row.link != null` |
| `<list>_caveat` | visible | `l[m].caveat != null` |
| `<list>_state` | visible | `l[m].st NOT IN ('live','stale','partial')` |
| DR-1…DR-5 | query param `tab` | a **literal** per resource (§3.2) |
| DR-1…DR-5 | execution condition | §4.1 |
| DR-7 `tile_view` | input | the active tab's `@data.hub_<tab>.result` |
| page | initial `activeTab` | `@context.props.tab` |

**Component binding (`@elements.…`) is deliberately unused on this page.** No component's output
drives another's input — the tabs drive `@state.activeTab` and everything else reads from
`@data.tile_view`. Recorded so a reader knows its absence is a decision, not an oversight.

---

# 8. Role gating

The API already refuses data the caller may not see (`docs/l4-api-design.md` §6). A gated tile
arrives with `st: "restricted"` and **no `v` anywhere in the response body**.

**Therefore no component on this page has a role-based visibility binding, and none should be
added.** A role condition in UI Builder hides a component in the browser; it does not stop the
value reaching the browser. Story L5-4 AC12 requires that financial figures are *"not present in
the page source — not merely hidden by CSS"*.

The `restricted` row of §6.2 is the entire client-side treatment: a sentence, no numeral, a lock
glyph.

---

# 9. What this page deliberately does not do

| Not done | Why |
|---|---|
| Any GlideForm data resource | §0.2. Zero used; the one-per-page limit is satisfied with room to spare |
| Any record create/edit component | This is a read-only hub. D3: never draw a button that cannot commit its decision |
| Approve / Reject on Tab 2 | D3. Not disabled, not hidden — **not added** (§6.4) |
| Any query against `alm_asset` / `cmdb_ci` | OD6 — display-only (§6.5) |
| Role-based component visibility | §8 |
| Client-side state derivation | The four states arrive explicitly from L4. The Transform maps; it never infers |
| Inherited `hub_*` data resources | §3.1 — five inherited resources would fetch all five tabs on page load |
| XLSX export | D8 — out of scope |

---

# 10. Assembly checklist

For the human building this in UI Builder.

1. Create the page in the scope's UX App; route `hub`; page property `tab`, default `financial`.
2. Add client state parameters `activeTab`, `loadedTabs`, `refreshing` (§3.3).
3. Add the five **local REST** data resources (§3.2). Set each `tab` query parameter to its
   **literal**. Set execution to manual/conditional — **not** on page load.
4. Confirm `user_context` and `theme_context` are **inherited** from the experience. Do not add
   local equivalents.
5. Add the **Transform** data resource `tile_view` (§3.4). Verify the unknown-state branch returns
   `headline: null` and the untrusted sentence **before** wiring any component.
6. Build `page_shell`, `hub_tabs`, `refresh_active_tab`, `tab_loading`, `transport_error` (§5).
7. Wire the four events of §4.2. **Verify §4.3's five statements in the browser network panel
   before building any tile.** Getting lazy loading wrong is cheap to fix now and expensive after
   25 components exist.
8. Build one `stateful_tile` completely (§6.1) and verify all **eight** rows of §6.2 by
   manipulating fixtures. **Then** duplicate it 14 times.
9. Build one `stateful_chart` and one `stateful_list`; verify the not-live branches draw **no axes**
   and **no empty table**; then duplicate.
10. Add `proc_caveat` and `assets_source_note` as static callouts (§6.4, §6.5).
11. Verify as a genuine non-admin user: `restricted` renders its sentence and **no numeral**, and
    no figure appears in the network payload.
12. Confirm no component anywhere has an approve or reject action.

---

# 11. Decision log — UIB spec

### U-D1 — All five `hub_*` resources are LOCAL, one per tab, each with a literal `tab`
**Chosen:** §3.1, §3.2.
**Rejected — one REST resource with `tab` bound to `@state.activeTab`.** Fewer resources, and it
re-fetches on every switch including a switch *back*, which breaks "returning to an already-loaded
tab issues no call". Five resources give five independent caches for free.
**Rejected — inherited `hub_*` resources.** Inherited resources load automatically; five of them
means five REST calls on page open — the exact failure the lazy-loading requirement names.

### U-D2 — A Transform data resource holds the state→text mapping
**Chosen:** DR-7.
**Rejected — conditional bindings per component.** 25 components × 8 states = 200 independent
conditions and 25 chances to drift. Story L5-3 AC1 requires exactly one place a tile's text is
produced.
**Rejected — a Controller data resource.** Controllers encapsulate data *and event logic*; this is
a pure shape mapping with no events, and Transform is the category the corpus defines for it.

### U-D3 — Visibility binds to `headline != null`, never to `v`
**Chosen:** §6.1.
**Rejected — `visible ← v != null`.** Fragile against an absent key and against a `null` a future
payload change might introduce.
**Rejected — `visible ← v > 0`.** Hides a genuine live zero, which is the one case where `0` must
appear.

### U-D4 — No role-based visibility bindings anywhere
**Chosen:** §8. **Rejected — hide financial tiles for non-`finance_viewer` in UI Builder.** It
hides a value that already arrived in the browser. The API refusal is the control; the binding
would be decoration over a leak.

### U-D5 — Zero GlideForms
**Chosen:** §0.2. The page views no ServiceNow record, so the one-per-page limit is not approached.
**Recorded for the future:** if a record form is ever added to this page — an `object_map` editor,
say — it consumes the single permitted GlideForm, and a second such form anywhere on the page is
unsupported. Put it on its own page instead.

### U-D6 — Charts bind to absent keys, and the Transform must not default them to `[]`
**Chosen:** §6.3. The L4 contract omits `cat`/`s` under non-live states specifically so a chart
component has nothing to plot. Defaulting them to empty arrays in the Transform would restore the
empty frame that reads as zero revenue — a one-line "tidy-up" that silently defeats the
requirement.
