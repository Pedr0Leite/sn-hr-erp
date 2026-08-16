---
title: L4 payload contract — the binding shape for L5 and the UIB spec
app: x_335329_sn_hr_erp
base: /api/x_335329_sn_hr_erp/hub
author: developer (L4)
generated: 2026-08-13
status: BINDING. L5 and docs/uib-page-spec.md bind against this file, not against observed output.
---

# GET /data?tab=<name>

`tab` ∈ `financial` | `procurement` | `inventory` | `assets` | `manufacturing`.
Missing → **400** `Missing required parameter 'tab'.` Unknown → **400** `Unknown tab '<v>'.`
Unauthenticated → **401** (driven by `authentication: true`, not by an ACL list).

```jsonc
{
  "tab": "inventory",
  "lab": "Inventory & Supply Chain",
  "gen": "2026-08-13 14:32:07",   // when THIS PAYLOAD was built. NOT a data timestamp.
  "stale_h": 24,                   // the staleness threshold actually used (D5)
  "note": "…",                     // tab-level standing note (Tab 4 only), every state
  "k": [ /* KPI tiles, render order */ ],
  "c": [ /* charts */ ],
  "l": [ /* lists */ ]
}
```

## The tile envelope — every tile, every type, no exceptions

| Key | When present | Meaning |
|---|---|---|
| `id`, `lab`, `obj` | **always, every state** | `obj` is what makes the not-configured sentence buildable (P4) |
| `fmt` | KPI tiles | `number` \| `currency` \| `percent` |
| `note` | when declared | static sub-label |
| `st` | **always** | `live` \| `stale` \| `failed` \| `not_configured` \| `partial` \| `restricted` (P1) |
| `sys` | always | contributing system display names |
| `v` | **only** `live` \| `stale` \| `partial` | **absent otherwise — not `null`, not `0`** (P2) |
| `sub` | mixed currency | `[{cur, v}]` per-currency subtotals **instead of** `v` (D11) |
| `as_of` | `live`\|`stale`\|`partial`, and `failed` with history | the data's own time, from `fetched_at` |
| `age_h` | `stale` | whole hours |
| `deg` | `partial`, `failed`, `not_configured` | which system — or, for mixed currency, which currencies |
| `prev` | `failed` **with** history | `{v, as_of, age_h}` |
| `no_prev` | `failed` **without** history | `true`. `failed` carries one of these two, never neither (P5) |
| `missing` | `not_configured` from an unmapped field | the logical field name to put in the sentence |
| `thr` | tiles that applied a threshold | `{name, kind: property\|per_row, value?}` (D5) |
| `origin`, `unweighted`, `out_of_range` | the OEE tile only | `supplied` \| `computed`; whether the mean was unweighted; range breach |

**`v: 0` occurs only with `st: "live"`, and only when a `success` run returned an empty set or rows summing to zero.** (P3)
`error_message` from `sync_run` never appears in any payload, for any role. (P6)

## Charts

`cat` (categories) and `s` (`[{lab, d[]}]`) are present **only** under `live`/`stale`/`partial`.
Under `not_configured`/`failed`/`restricted` they are **absent entirely** — an empty array lets a
library draw an empty frame, and an empty frame reads as "zero revenue".
`miss: ["Target not mapped"]` names a declared series whose field is unmapped. **It is never
returned as a series of zeros.**

## Lists

`cols: [{k, lab, fmt?}]` — a `finance_viewer`-gated column is **omitted from `cols`** for a caller
without the role, so the header never advertises a figure that is not in the body.
`r` (rows) is present **only** under `live`/`stale`/`partial`; **absent** otherwise — an empty table
with "No records" reads as "no overdue invoices" and is a FAIL.
`link` is present on a row **only** when `deep_link_path` is set **and** the row's `external_ref` is
non-empty; the URL is joined server-side, so `link` present means the link is complete.
`caveat` (Tab 2) is present **in every state**.

## `restricted`

```jsonc
{ "id": "fin_cash", "lab": "Cash balance", "st": "restricted", "obj": "balance", "fmt": "currency" }
```

No `v`, no `sub`, no `as_of`, no `prev`. The figure is **not in the response body at all**, and no
query is issued for it. `restricted` is a *presentation* state on top of §7's four: the four
describe what the ERP did; this describes what the caller may see.

---

# POST /refresh

```jsonc
// request                       // response
{ "tab": "inventory" }           { "queued": true, "objects": ["stock_item","backorder"], "systems": 2 }
```

Enqueues a sync for **only that tab's objects** and returns immediately. Not a GET, because it has
an effect. Not synchronous, because a tab open must not block on an ERP that may be timing out.
**There is no variant that takes no tab.** The drain runs in a `ScheduledScript` as `system`, which
currently ships `on_demand` + `active: false` — so a refresh queues and does not execute until that
job is armed or run.
