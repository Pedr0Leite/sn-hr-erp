---
title: L5 — BYOUI 5-tab hub, view state machine, workspace shell, ACL verification
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-12
status: design-only. Resolves OD6 and OD7. Raises one item needing a human decision (§1.3).
grounding: |
  Fluent and client shapes from `@servicenow/sdk` 4.9.0 `explain` (uipage-api, ui-page-guide,
  ui-page-patterns-guide, ui-page-theming-guide, workspace-api, application-menu-guide,
  now-include-guide). `@servicenow/react-components` confirmed published at 0.1.8 via
  `npm view`. Binds against the payload contract in `docs/l4-api-design.md` §4.
---

# 1. The delivery mechanism — where the SDK docs override the prior art

D1 is settled and is **not** relitigated: BYOUI SPA on a `sys_ui_page`, backed by a Scripted REST
API, with a client-side view state machine — plus `docs/uib-page-spec.md` as a written deliverable.
Every one of those holds below.

What changes is **how the page gets its code**, which is an API fact, and on API facts the SDK docs
win.

## 1.1 Asset delivery — `sys_ux_lib_asset` is not the SDK's mechanism

Spec §1.2 and D1 describe a built JS asset registered as `sys_ux_lib_asset` and loaded by the
UI Page. That is the Capacity Planner's arrangement, built on an earlier SDK.

`ui-page-guide` documents a different, supported path:

```ts
import { UiPage } from '@servicenow/sdk/core'
import page from '../../client/index.html'

export const hub = UiPage({
  $id: Now.ID['hub-page'],
  category: 'general',
  endpoint: 'x_335329_sn_hr_erp_hub.do',   // CRITICAL: must begin with the scope name
  html: page,                               // CRITICAL: must import the build system's output
  direct: true,                             // CRITICAL: must be true
})
```

with *"The build system handles ALL build processes automatically"* and an explicit prohibition on
adding webpack/vite/babel configs or build scripts. **No `sys_ux_lib_asset` appears anywhere in the
UI Page documentation.**

**Adopted: the SDK path.** No `sys_ux_lib_asset` or `sys_ux_lib_source_script` record is authored.
Story L5-1 AC1's substance — *a `sys_ui_page` served at `<scope>_hub.do` loading a built JS asset* —
is met; the *registration table* named in it is superseded.

## 1.2 The cache trap has a supported fix

§9: *"After deploying a BYOUI page, hard-refresh. The JS asset is aggressively cached."*

`ui-page-patterns-guide` gives the HTML entry point as:

```html
<html class="-polaris">
  <head>
    <title>SN HR&amp;ERP — Consolidated Hub</title>
    <sdk:now-ux-globals></sdk:now-ux-globals>
    <script src="main.tsx?uxpcb=$[UxFrameworkScriptables.getFlushTimestamp()]" type="module"></script>
  </head>
  <body><div id="root"></div></body>
</html>
```

and states *"The `uxpcb` parameter is required to ensure that stale UI Page contents are not
mistakenly cached."*

The hard refresh stays in the test plan (story L5-1 AC6) as a **verification** — T5-3 deploys a
visible change and checks it appears **without** a hard refresh. If it does not, `uxpcb` is not
doing its job here and the manual step returns, recorded.

`<sdk:now-ux-globals>` also brings in the Horizon design tokens, which §4.4 uses so the four states
are distinguishable in both light and dark themes.

## 1.3 Vanilla JS vs React — **this one needs a human**

D1's chosen text says *"vanilla-JS SPA"*. `ui-page-guide` says:
*"**Always use React 18.2.0. Never use vanilla JavaScript**, jQuery, or other frameworks"*, and
*"Use `@servicenow/react-components` for all UI elements."* Confirmed published: `0.1.8`.

**This is not the same question D1 answered.** D1 rejected *native UI Builder macroponent
authoring* — 61,000 characters of generated composition — and chose a self-authored page. React
inside a self-authored UiPage is still a self-authored page: same `.do` endpoint, same one fat
`GET /data`, same client-side view state machine, same bundled-locally rule.

**Recommendation: React 18.2.0 + `@servicenow/react-components`**, because it is the SDK's
supported path, it inherits Polaris theming and accessibility rather than reimplementing them,
and this agent's own UI mandate is TypeScript-and-React-first.

**Rejected — vanilla JS, matching D1's literal wording.** It works, and it copies a known-good
app, and it means hand-rolling focus management, keyboard navigation and theme tokens that
`@servicenow/react-components` ships — on a page whose §7 states must be distinguishable *without
relying on colour* (story L5-3 AC8).

**Flagged for the human, and the design is written to survive either answer:** everything below —
the state machine, the tab contract, the renderer's six branches, the exact sentences, the deep-link
rule — is framework-agnostic. Only §4's component names change. **The L4 payload contract does not
change either way.**

## 1.4 What `@servicenow/react-components`' anti-patterns do and do not forbid

`ui-page-guide` forbids `.map()` over fetched **ServiceNow table records** and mandates
`NowRecordListConnected` / `RecordProvider` for record CRUD.

**Neither applies to this hub.** Nothing on these five tabs is a ServiceNow record. Every figure is
a computed four-state envelope from `/api/x_335329_sn_hr_erp/hub/data` — there is no table to point
`NowRecordListConnected` at, no `sys_id` to give `RecordProvider`, and no record to edit. The lists
are arrays of plain objects carrying an explicit state.

The rule's *intent* — do not hand-roll what the platform gives you — is honoured: `Card`, `Badge`,
`Alert`, `TextLink`, `Tooltip` and `Table` come from the library; only the tile envelope and the
charts are custom, because no component in the library renders a four-state tile.

**`hideHeader` / `onNewActionClicked` do not arise**, since no `NowRecordListConnected` is used.

---

# 2. Page and navigation

| Component | Value |
|---|---|
| `UiPage` | `x_335329_sn_hr_erp_hub.do`, `direct: true`, `category: 'general'` |
| Entry HTML | `src/client/index.html` (§1.2) |
| Client root | `src/client/main.tsx` → `app.tsx` |
| Client tsconfig | `src/client/tsconfig.json` per `ui-page-guide` (`moduleResolution: bundler`, `jsx: preserve`) |
| ApplicationMenu | "SN HR&ERP" — one `viewer`-gated module linking the hub, plus `admin`-gated config modules |
| Workspace | §3 |

**Every navigation link uses `.do` / `_list.do`, never `.list`** (§9 — `.list` fails in the Next
Experience shell). T5-16.

---

# 3. The workspace shell, and what it honestly is

Story L5-2 asks for a workspace shell authored from the Fluent Workspace API.

`workspace-api` gives `Workspace()` exactly six meaningful properties: `path`, `title`,
`landingPath`, `tables`, `listConfig`, `order`. **It builds a list-and-navigation workspace over
tables. It cannot host an arbitrary tabbed analytics composition** — which is precisely the
reasoning D1 recorded when it rejected native UIB.

**What is built:**

```ts
Workspace({
  $id: Now.ID['hub-workspace'],
  title: 'SN HR&ERP',
  path: 'sn_hr_erp',
  tables: ['x_335329_sn_hr_erp_erp_system', 'x_335329_sn_hr_erp_object_map',
           'x_335329_sn_hr_erp_sync_run', 'x_335329_sn_hr_erp_doc_req'],
})
```

— a real workspace giving admins list navigation over the config and audit tables, with the hub
reachable in one click from an application-menu module.

**What is not built, and the story text should not be read as promising it:** the five-tab hub
rendering *inside* the workspace shell as a native workspace page. That is the UIB assembly D1
deferred to a human, and `docs/uib-page-spec.md` is the deliverable that enables it.

Story L5-2 AC2 — *"The hub is reachable from the workspace navigation in one click, as the
`viewer`-only test user"* — is met by the module link. AC3's `schema_version` requirement applies
to any `sys_ux_macroponent` authored; **this design authors none**, so AC3 is satisfied vacuously
and that is recorded rather than claimed as a pass.

---

# 4. The SPA

## 4.1 View state machine

`ui-page-guide` mandates URLSearchParams navigation with a `popstate` listener and Polaris iframe
detection — which is `switchView()` with browser history, and it is strictly better: a tab becomes
linkable and the back button works.

```
?tab=financial | procurement | inventory | assets | manufacturing
```

```ts
const TABS = ['financial','procurement','inventory','assets','manufacturing'] as const
// state: { tab, byTab: { [tab]: {status:'idle'|'loading'|'ready'|'error', payload?, error?} } }
```

**Lazy loading is the contract, not an optimisation** (spec §6):

| Event | Behaviour |
|---|---|
| Page open | **exactly one** `GET /data` — the tab in the URL, or `financial` |
| Switch to an unloaded tab | **exactly one** further call |
| Return to a loaded tab | **zero** calls — render from `byTab` |
| Explicit Refresh | `POST /refresh` for that tab, then re-`GET` that tab only |

**A page open that calls `/data` five times fails story L5-1 AC3.** Verified in the browser network
panel, not by reading the code.

Iframe handling per `ui-page-patterns-guide`: `window.self !== window.top` →
`window.CustomEvent.fireTop('magellanNavigator.permalink.set', {relativePath, title})`; otherwise
`history.pushState`.

## 4.2 One renderer, six branches — story L5-3

**One function produces every tile's text. A tile with its own inline state handling fails
story L5-3 AC1.**

```ts
function renderState(t: Tile): { headline: string | null; sub: string; tone: Tone; icon: string }
```

| `st` | headline | sub-line |
|---|---|---|
| `live` | the formatted figure (**including `0`**) | `as of 12 Aug 2026 14:32` |
| `stale` | the formatted figure | `Stale — as of 09 Aug 2026 03:00 (3 days old)` |
| `failed` + `prev` | **none — no numeral at all** | `ERP did not answer` then `Last good figure: 1,204 (as of 11 Aug 2026 09:14, 1 day old)` |
| `failed` + `no_prev` | **none** | `ERP did not answer — no previous figure` |
| `not_configured` | **none** | ``Not configured — create an Object Map for `stock_item` `` |
| `partial` | the formatted figure | `Partial — SAP S/4HANA Production did not answer` |
| `restricted` | **none** | `Restricted — this figure requires the finance_viewer role` |
| **anything else, or absent** | **none** | `State unavailable — this tile cannot be trusted` |

**The default branch is the important one.** Story L5-3 AC7: an unrecognised state must **never**
fall back to displaying the raw value. Defaulting to `live` fails the story. In code, the switch
has no fall-through and the default returns the untrusted sentence.

Threshold echo (D5) appends `thr`'s rendering — *below safety stock*, *over £50,000*, *within 90
days* — so the number on screen is always attributable.

**Timestamps carry a date and a time** (§0 R3). `as of 14:32` alone fails: a figure from last
Tuesday at 14:32 reads as current. Format: `d MMM yyyy HH:mm`, instance timezone, rendered once by
one helper.

## 4.3 A unit-level check on the sentences

Story L5-3 AC9. `src/client/state-renderer.test-ish.ts` — an assertion harness, no framework —
feeding each of the eight rows above into `renderState` and asserting the **exact** output string.
A renderer change that breaks a sentence fails it.

This runs at build time, not on the instance: the sentences are the deliverable, and they should
not need an ERP outage to verify.

## 4.4 Distinguishable without colour

Story L5-3 AC8: *"colour alone is not the distinction, since colour is invisible to a screen reader
and to a colour-blind reader. **Text carries the meaning.**"*

Each state gets: its own **sentence** (above), its own **icon glyph**, and — only then — its own
tone from Horizon tokens (`--now-color-status-*`). Removing all colour must leave every state
readable. T5-6 checks it in greyscale.

`aria-live="polite"` on the tile region so a state change is announced.

## 4.5 Deep links

`link` is present or absent in the payload (L4-D4). The client's whole rule:

```tsx
{row.link ? <TextLink href={row.link} target="_blank" rel="noopener noreferrer">View in ERP</TextLink> : null}
```

**No anchor element when `link` is absent** — story L5-10 AC2, asserted against the DOM, not by
eye. A styled-as-disabled anchor still fails. `rel="noopener noreferrer"` carries no ServiceNow
session artefact (AC5).

## 4.6 Errors are never a blank page

Story L5-1 AC7. An error boundary renders an explicit region:
`The hub could not load this tab. <reason>` **A blank white page reads as "no data" and violates
§0 R1 in spirit.**

## 4.7 No CDN, ever

Story L5-1 AC5. `ui-page-patterns-guide`: CSS via ESM `import "./file.css"`; CSS Modules,
`@import` and `<link rel="stylesheet">` are **not supported**. Charts (§6) are hand-drawn SVG, so
no chart library is loaded at all. A CSP-blocked request in the console fails the story.

---

# 5. OD7 — OEE

**Resolved: ERP-supplied when mapped; otherwise computed from three explicitly-mapped components;
otherwise not configured. Computed in the L4 state resolver, never in the client**
(story L5-8's implementation note).

## 5.1 Precedence, and the tile always says which

| Order | Condition | Tile |
|---|---|---|
| 1 | `production_output.oee` is mapped and present | figure + `Supplied by <system name>` |
| 2 | `oee` unmapped, but **all three** of `availability`, `performance`, `quality` mapped and present | figure + `Computed from availability × performance × quality` |
| 3 | `oee` unmapped and **any** component unmapped | `Not configured — 'quality' is not mapped for OEE` (naming **each** missing input) |
| 4 | all mapped, but a component missing on a row | that row is excluded; if none remain → `not_configured` naming the objects |
| 5 | result outside 0–100% | `OEE out of range (412.5%) — check the mapping` |

Story L5-8 AC5: **never substitutes 1.0, never treats a missing factor as neutral, never renders a
partial product.** A two-factor product looks like a plausible OEE and is wrong by the whole third
factor.

## 5.2 The unit trap, and the column that closes it

`0.85 × 0.90 × 0.95 = 0.727` → **72.7%**.
`85 × 90 × 95 = 726,750` → nonsense, or **72.7%** if you happen to divide by 10,000.

Mixing the two silently produces a plausible-looking wrong number, which is exactly what
*"a silently-wrong OEE is a number executives act on"* warns about.

**`object_map.oee_input_scale`** — choice, **no default**, `ratio_0_1` | `percent_0_100`.
Mandatory when the three components are mapped and `oee` is not. Unset in that situation ⇒
**`not_configured`** naming `oee_input_scale`. The tile states the scale it used.

**Rejected — infer the scale** (if any component > 1, treat all as percent). It is correct for
every realistic input and it is a heuristic standing between an executive and a wrong number.
An explicit declaration costs one choice column.

`field_map.transform`'s `percent_to_ratio` / `ratio_to_percent` (L1 §4.2) exist for the case where
one component arrives in a different unit from the other two.

## 5.3 Aggregation across lines

OEE is a **weighted mean** across production lines, weighted by `output` (the `qty` slot), not a
plain mean. A line that ran for an hour and a line that ran all week must not count equally.
Where `output` is unmapped, a plain mean is used **and the tile says so**:
`Unweighted mean — 'output' is not mapped`.

## 5.4 Rejected alternatives

**Rejected — always compute, ignoring a supplied `oee`.** The ERP's own OEE embeds its plant's
definition of planned downtime. Recomputing it from three fields we mapped produces a number that
disagrees with the MES screen and is harder to defend.

**Rejected — always trust a supplied `oee`, never compute.** Most ERPs do not expose it, and the
tile would be permanently not-configured for them.

**Rejected — compute and show both.** Two OEE figures on one tile is a question, not an answer.

---

# 6. Charts

Hand-drawn SVG, ~150 lines, one module, four shapes (bar, grouped bar, donut/pie, line).

**Rejected — a bundled chart library.** CSP forbids CDN (§9), so it must be bundled; every
mainstream library is 50–200 KB; and none of them has a concept of "do not draw axes because this
data does not exist". That last point is not a preference — story L5-4 AC8 requires that a
not-configured chart draws **no axes and no empty bars**, because an empty chart frame reads as
"zero revenue". Getting a library to render *nothing* convincingly is more work than drawing four
chart types.

Chart states, driven by L4's absent-key contract (§4.2 of `docs/l4-api-design.md`):

| `st` | Rendered |
|---|---|
| `live` / `stale` / `partial` | the chart, plus the state sub-line |
| `not_configured` / `failed` / `restricted` | the **sentence only**. No axes, no gridlines, no empty frame |
| `miss` non-empty | the available series, plus `Target not mapped`. **No zero-valued series** |

Every chart carries a `<table>` alternative behind a "View as data" toggle — a chart with no text
equivalent is invisible to a screen reader, and §0's rules are about text carrying meaning.

---

# 7. The five tabs

Definitions live in `src/server/api/tabs.ts` (L4 §9). Client-side, each tab is a layout over the
payload. Objects per `docs/l1-control-tower-design.md` §2.1; gating per `docs/l4-api-design.md` §6.1.

## Tab 1 — Financial Health & Ledger
KPIs `Cash balance` (`balance`), `Open accounts receivable` (`invoice`), `Open accounts payable`
(`vendor_invoice`). Chart: grouped bar, `gl_summary` by period, revenue vs expenses. List: top 10
overdue `vendor_invoice` by amount desc, deep-linked.

**D7 is enforced in the label.** The tile reads **`Cash balance`**. The word "real-time" appears
nowhere in this app, because under D2 the figure is as old as its last sync and the `as of` stamp
says so. T5-8 greps the built bundle for "real-time" and expects zero hits.

Entirely `finance_viewer`-gated (D6).

## Tab 2 — Procurement & Sourcing (read-only, D3)
KPIs `Total open purchase orders`, `Requisitions pending approval`, `YTD procurement spend`
(gated). Donut: `purchase_order` by supplier category (gated). List: requisitions awaiting a
decision.

**No Approve control and no Reject control is rendered anywhere, in any state, for any role
including `admin`. A disabled or hidden one also fails** (story L5-5 AC4). There is no component,
no handler and no dead branch — the code to draw one does not exist.

The caveat renders **above the list, in every state**, verbatim:

> Approve and Reject are not shown. These requisitions live in the ERP and are not mirrored into
> ServiceNow approvals, so a decision made here could not be written back. Use the ERP link on each row.

It renders under `not_configured` and `failed` too (AC8) and when no deep link can be drawn
(AC7) — *"it is the honest state even when the escape route is missing"*.

T5-11 greps the built bundle for `approve` / `reject` as control labels; the only permitted
occurrence is inside the caveat string.

## Tab 3 — Inventory & Supply Chain
KPIs `Total SKU count`, `Low stock alerts`, `Backordered items` (`backorder` — L1-D2). Chart: bar,
`stock_item` by location. List: reorder list where `qty < threshold`.

**The founding case, story L5-6 AC4:** with the warehouse system unreachable, the low-stock tile
reads `ERP did not answer` and **never** `0 low stock alerts`. *"This criterion is the single most
important assertion in the whole backlog and must be executed live."* T5-9.

Comparison is per-row (`qty` vs `threshold`), never a global constant. `safety_stock` unmapped ⇒
`not_configured` naming the field (L4 §5.5, T4-24).

## Tab 4 — Fixed Assets & Equipment — **OD6: display-only**
KPIs `Total asset valuation` (gated), `Assets depreciated this quarter` (count, ungated — L4-D6),
`Assets due for maintenance` (within `asset_maintenance_due_days`). Pie: `fixed_asset` by lifecycle
stage. List: high-value assets nearing EOL, thresholds echoed.

A visible note, always:

> Figures are from the ERP and are not reconciled against ServiceNow asset or CMDB records.

Each tile holds its own state independently — one unconfigured object must not blank the tab
(story L5-7 AC8).

## Tab 5 — Manufacturing & Production
KPIs `OEE %` (§5), `Active work orders`, `Delayed orders`. Chart: line, `production_output` by day,
output vs target. List: `machine_downtime` with severity badges.

Severity badge text is the severity word, never colour alone (§4.4).

---

# 8. OD6 — Tab 4 display-only

**Resolved: display-only. No query against `alm_asset` or `cmdb_ci` at any layer.**

Both tables verified present on `dev296062` (`sys_db_object`: `alm_asset` "Asset", `cmdb_ci`
"Configuration Item"), so reconciliation is technically possible. It is still declined.

**Rejected — reconcile ERP assets against `alm_asset` / `cmdb_ci`.** Reconciliation needs a match
key, and no ERP mapping in this design supplies one: `asset_tag` is the ERP's tag, `alm_asset` has
its own `asset_tag` populated by a different process, and matching on `serial_number` requires
both sides to have it mapped and normalised. On top of that it needs a confidence model, an
unmatched queue, a duplicate-resolution rule and a UI for all three — a larger problem than the
five tabs combined, and it writes into CMDB territory this app has no mandate over.

**Rejected — a partial reconciliation shown as a hint** ("12 of 40 matched"). Story L5-7 AC4
forbids it, and rightly: an unqualified match count is wrong more often than right, and a wrong
match count is the §7 failure mode wearing a different mask — a confident number nobody can trace.

**Rejected — reconcile silently and show only ERP figures.** Cost with no visible benefit.

**Consequence, stated on screen:** the ERP's asset picture and ServiceNow's may disagree, and this
tab does not adjudicate. The note says so. **This is the honest position, not a limitation to
apologise for** — a half-reconciled asset view is worse than an openly unreconciled one.

---

# 9. Build order

| # | Step | Depends on | Verify |
|---|---|---|---|
| **L5-1** | **Resolve §1.3 with the human.** Record the answer in `docs/decision-log.md` | — | recorded before any client code |
| **L5-2** | `src/client/` scaffold: `index.html` (§1.2), `tsconfig.json`, `main.tsx`, `app.tsx`. Add deps to `package.json` and install | L5-1 | `npm run build` clean |
| **L5-3** | `UiPage` (§1.1), `direct: true`, endpoint `x_335329_sn_hr_erp_hub.do` | L5-2 | page loads |
| **L5-4** | `hubApi.ts` — `GET /data`, `POST /refresh`, `X-UserToken: window.g_ck`, centralised error handling | L4-10 | T5-1 |
| **L5-5** | `state-renderer.ts` — the eight branches of §4.2 | L5-4 | **T5-5 before any tile is drawn** |
| **L5-6** | The assertion harness (§4.3) | L5-5 | 8/8 exact strings |
| **L5-7** | Tile / chart / list components consuming only `renderState` | L5-5 | T5-4 |
| **L5-8** | `charts.ts` — four SVG shapes + the "no axes when not live" rule | L5-7 | T5-13 |
| **L5-9** | View state machine + URLSearchParams + `popstate` + iframe detection | L5-7 | T5-2 |
| **L5-10** | The five tab layouts (§7) | L5-8, L5-9 | T5-8 … T5-12 |
| **L5-11** | Deep-link rendering (§4.5) | L5-7 | T5-14 |
| **L5-12** | Error boundary (§4.6) | L5-9 | T5-15 |
| **L5-13** | `Workspace()` + `ApplicationMenu` + modules, `.do` links only | L5-3 | T5-16 |
| **L5-14** | Deploy; check the `uxpcb` cache-buster **without** a hard refresh | L5-13 | T5-3 |
| **L5-15** | **The L5 gate** — the browser pass as three genuine non-admin users | all | T5-17 … T5-20 |

---

# 10. The L5 gate

Spec §4.2: *"All five tabs render live, not-configured, stale and failed states correctly,
verified in a browser as a genuine non-admin user."*

Not met by an admin session, and not by impersonation from an elevated session. The sibling's
entire OD9 evidence set came from `runAs` jobs and had to be redone interactively; story L5-9 AC5
says so explicitly.

**The pass:** three browser logins (`hrerp_viewer_only`, `hrerp_finance_only`, `hrerp_hr_only`),
five tabs each, four fixture states each, screenshots plus network payloads. Before starting,
`sys_user_has_role` is re-queried per user (story L5-9 AC6) — *"a role added for convenience
mid-build silently voids every assertion here"*.

---

# 11. Test plan

**Every case here is a browser case.** **NON-ADMIN** cases require that user's own session.

| ID | Test | Precondition | Steps | Expected | Validates |
|---|---|---|---|---|---|
| **T5-1** | One call per tab open | L5-4 | open the hub; network panel | **exactly one** `/data` call | L5-1 AC3 |
| **T5-2** | Tab switch = one call; return = none | L5-9 | switch to Inventory, then back to Financial | one further call; then **zero**. No page reload | L5-1 AC2, AC3, AC4 |
| **T5-3** | Cache-buster works | L5-14 | deploy a visible change; reload **without** hard refresh | the change appears. If not, `uxpcb` is not working here — record it and reinstate the manual step | L5-1 AC6, §1.2 |
| **T5-4** | One renderer only | L5-7 | grep the client for state literals outside `state-renderer.ts` | zero. A tile with inline state handling fails | L5-3 AC1 |
| **T5-5** | Eight exact sentences | L5-6 | run the harness | 8/8 byte-exact, including the backticked object name in the not-configured sentence | L5-3 AC2–AC6 |
| **T5-6** | Unknown state is not trusted | L5-6 | feed `st: "banana"`, and a tile with no `st`, each carrying `v: 999` | both render `State unavailable — this tile cannot be trusted` and **no numeral**. Defaulting to live fails | **L5-3 AC7** |
| **T5-7** | Distinguishable without colour | L5-7 | render all six states; view in greyscale | each identifiable by text + glyph alone | L5-3 AC8 |
| **T5-8** **NON-ADMIN** | Tab 1, four states | fixtures | as `hrerp_finance_only` | not-configured names `vendor_invoice`; failed shows last-good, **not `0`**; stale shows age; live-zero shows `0` + `as of`. Chart draws **no axes** when unconfigured; list shows **no rows**, not "No records" | L5-4 AC4–AC9 |
| **T5-9** **NON-ADMIN** | **The founding case** | inventory system unreachable | as `hrerp_viewer_only`, open Tab 3 | low-stock tile reads `ERP did not answer`. **Never `0 low stock alerts`.** Executed live, not reasoned about | **L5-6 AC4 — the backlog's most important assertion** |
| **T5-10** **NON-ADMIN** | Per-row threshold | 2-item fixture, different `safety_stock` | Tab 3 | exactly one item flagged | L5-6 AC7 |
| **T5-11** | No Approve/Reject exists | L5-10 | grep the built bundle; inspect the DOM in all four states as `admin` | zero control labels; **zero button elements**, including disabled and hidden. Only the caveat string matches | L5-5 AC4, AC5, D3 |
| **T5-12** | Caveat in every state | L5-10 | Tab 2 in live, stale, failed, not-configured, and with no deep link | caveat present, verbatim, every time | L5-5 AC6, AC7, AC8 |
| **T5-13** | Chart draws nothing when not live | L5-8 | unmap `gl_summary` | sentence only; **no axes, no gridlines, no empty frame** | L5-4 AC8 |
| **T5-14** | Deep links | L5-11 | mapped row; unmapped-path row; empty-`external_ref` row; `base_url` with and without a trailing slash | anchor in case 1 with exactly one slash at the join; **no anchor element** in cases 2 and 3, asserted against the DOM | L5-10 AC1–AC4 |
| **T5-15** | No blank page on error | L5-12 | force a JS error | explicit error region, not white | L5-1 AC7 |
| **T5-16** | No CDN; `.do` links | L5-14 | console + link audit | zero CSP blocks; zero `.list` URLs | L5-1 AC5, L5-2 AC4 |
| **T5-17** **NON-ADMIN** | viewer sees no financials in the payload | L5-15 | as `hrerp_viewer_only`, Tab 1, network panel | figures **absent from the response body** — not hidden by CSS. Tiles read the restricted sentence, **not `0`, not blank** | L5-9 AC1, L4-3 AC7 |
| **T5-18** **NON-ADMIN** | finance_viewer full Tab 1, no HR | L5-15 | as `hrerp_finance_only` | Tab 1 populated; document surfaces refused | L5-9 AC2 |
| **T5-19** **NON-ADMIN** | hr_viewer no financials | L5-15 | as `hrerp_hr_only`, Tab 1 | figures absent | L5-9 AC3 |
| **T5-20** **NON-ADMIN** | Config hidden from viewer | L5-15 | as `hrerp_viewer_only`: navigation, then direct URLs to config lists | no config module; direct URL gives a **security message**, not an empty list | L5-9 AC4 |
| **T5-21** | Roles re-verified before the pass | L5-15 | `sys_user_has_role` per user | one app role each, checked **immediately before** testing | L5-9 AC6 |
| **T5-22** | No refusal renders blank | L5-15 | every refused surface | each states its refusal. A blank region is a FAIL | L5-9 AC7 |
| **T5-23** | OEE provenance stated | L5-10 | supplied fixture; then computed fixture | tile states `Supplied by <system>` / `Computed from availability × performance × quality` | L5-8 AC4 |
| **T5-24** | OEE missing input | fixtures | unmap `quality` | `Not configured — 'quality' is not mapped for OEE`. **Never substitutes 1.0; never a partial product** | L5-8 AC5 |
| **T5-25** | OEE scale undeclared | fixtures | map all three components, leave `oee_input_scale` empty | `not_configured` naming `oee_input_scale`. **Not a guess** | §5.2 |
| **T5-26** | OEE out of range | fixtures | force 412.5% | `OEE out of range (412.5%) — check the mapping`. **Not printed as a figure** | L5-8 AC6 |
| **T5-27** | Target unmapped | fixtures | unmap `target` | output series alone + `Target not mapped`. **No target line at zero** | L5-8 AC8 |
| **T5-28** | Tab 4 note, and no reconciliation | L5-10 | Tab 4; then grep the codebase | note visible; **zero references to `alm_asset` or `cmdb_ci` anywhere in `src/`** | L5-7 AC4, AC5, OD6 |
| **T5-29** | One unconfigured object does not blank a tab | fixtures | unmap `asset_depreciation` only | that tile not-configured; the other two render their own states | L5-7 AC8 |
| **T5-30** | No CRM content | L5-10 | grep the bundle for `opportunity`, `lead`, `deal`, `pipeline`, `account 360` | zero hits | L5-4 AC13, spec §0 |
| **T5-31** | "real-time" never appears | L5-10 | grep the bundle | zero hits. The tile is `Cash balance` | D7 |

---

# 12. Decision log — L5

### L5-D1 — SDK asset delivery replaces `sys_ux_lib_asset`
**Chosen:** §1.1. `html: <imported index.html>` + `direct: true`; the build system bundles.
**Rejected — hand-author `sys_ux_lib_asset` / `sys_ux_lib_source_script`.** The SDK 4.9.0 UI Page
documentation does not mention them and forbids custom build configuration. Following prior art
against the documented path means fighting the bundler.
**Note:** this supersedes the *table named in* story L5-1 AC1, not its substance.

### L5-D2 — `uxpcb` replaces the manual hard refresh as the mitigation
**Chosen:** §1.2. **Rejected — rely on the documented manual step.** A required manual step after
every deploy is a step someone forgets, and the platform ships a cache-buster.
**Guarded:** T5-3 verifies it. If it fails, the manual step returns and is recorded.

### L5-D3 — React 18.2.0 recommended; **needs a human decision** (§1.3)
**Chosen (recommended):** React + `@servicenow/react-components@0.1.8`.
**Rejected — vanilla JS, D1's literal wording.** It means hand-rolling theming, focus management
and keyboard navigation the library ships, on a page whose states must be distinguishable without
colour.
**Not a reversal of D1:** D1 rejected native UIB macroponent authoring; this is still a
self-authored BYOUI page with the same endpoint, the same one fat `GET /data` and the same client
state machine. **The design is framework-agnostic below §4; only component names change.**

### L5-D4 — Charts are hand-drawn SVG
**Chosen:** §6. **Rejected — a bundled chart library.** 50–200 KB, and none can express "draw no
axes because this data does not exist" — which story L5-4 AC8 requires, because an empty frame
reads as zero revenue.

### L5-D5 (OD6) — Tab 4 is display-only
**Chosen:** §8. **Rejected — reconciliation** (no match key exists in any mapping; needs a
confidence model, an unmatched queue and a resolution UI).
**Rejected — a partial match hint.** Story L5-7 AC4 forbids it; an unqualified match count is the
§7 failure mode in a new costume.
**Binds:** zero references to `alm_asset` / `cmdb_ci` anywhere in `src/`, asserted by T5-28.

### L5-D6 (OD7) — OEE: supplied if mapped, else computed from three declared inputs, else not configured
**Chosen:** §5. Computed **server-side**, in the state resolver. The tile always states which.
**Rejected — always compute.** Disagrees with the plant's own MES definition of planned downtime.
**Rejected — only accept a supplied value.** Most ERPs do not expose it; the tile would be
permanently not-configured.
**Rejected — infer the input scale.** Correct for realistic inputs, and it is a heuristic between
an executive and a wrong number. `oee_input_scale` costs one choice column.
**Binds:** `object_map` gains `oee_input_scale`; aggregation is output-weighted, and says so when
it cannot be.

### L5-D7 — The workspace is a real but modest list-and-navigation shell
**Chosen:** §3. **Rejected — claim the hub renders inside the workspace as a native page.**
`workspace-api` exposes no mechanism for it; that is the UIB assembly D1 deferred, and
`docs/uib-page-spec.md` is what enables it.
**Recorded:** story L5-2 AC3's `schema_version` criterion is satisfied vacuously — no
`sys_ux_macroponent` is authored. Stated, not claimed as a pass.

### L5-D8 — `restricted` renders a sentence, never a blank or a zero
**Chosen:** §4.2. **Rejected — hide the tile.** A missing tile reads as zero and changes the tab's
shape by role. Story L5-9 AC7: any surface that refuses access says so.

---

# 13. Risks and flags

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R5-1 | §1.3 unresolved when L5 starts | Rework of every component | L5-1 is the first build step and blocks the rest |
| R5-2 | A tile bypasses `renderState` under deadline | Twenty tiles drift into twenty interpretations of "no data" — story L5-3's stated fear | T5-4's grep, plus components receiving only `renderState`'s output, never the raw tile |
| R5-3 | Charts draw an empty frame when not live | *"An empty chart frame reads as zero revenue"* | L4 omits `cat`/`s` entirely (absent keys, not empty arrays), so there is nothing to plot. T5-13 |
| R5-4 | Browser pass done as admin "to save time" | Every access-control assertion is void — the sibling's OD9, repeated | T5-17…T5-22 are all **NON-ADMIN**; admin evidence is not accepted |
| R5-5 | `@servicenow/react-components@0.1.x` is pre-1.0 | Breaking changes on upgrade | Pin exactly. `ui-page-guide` requires the caret form `^0.1.0` in `package.json`, so the lockfile is what actually pins it — commit it |
| R5-6 | OEE weighted mean silently unweighted | A short line and a week-long line count equally | §5.3 states it on the tile when `output` is unmapped |
| R5-7 | An Approve button is added later "because Tab 2 looks incomplete" | D3 breached; a user believes they approved something and a buyer is still waiting | T5-11 greps the built bundle. The caveat explains the absence on screen so it does not read as an oversight |
| R5-8 | Polaris iframe navigation untested outside the shell | Back button breaks in one context | T5-2 runs both standalone and inside the shell |

**Cross-scope:** none. **Global-scope records:** none. The client calls exactly one origin — this
instance — and one API, `/api/x_335329_sn_hr_erp/hub`.
