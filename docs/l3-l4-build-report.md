---
title: L3 + L4 — staging, sync engine, provenance, REST API — build report
app: x_335329_sn_hr_erp
instance: https://dev296062.service-now.com (PDI)
author: developer (L3+L4)
generated: 2026-08-13
scope note: product owner — ship code, defer testing. Neither gate is claimed or reworded.
rollback context: d932a0f347ae0b100739b71f316d435e
---

# 1. Shipped and DEPLOYED

- **3 tables** — `sync_run` (3 indexes), `erp_staging` (4 indexes, unique upsert key), `sync_request`.
- **28 ACLs** — read `viewer` on all three; field-read `admin` on `sync_run.error_message`;
  create `viewer` on `sync_request`; **19 Shape A deny-write rules**, every one `adminOverrides: false`.
  `erp_staging` has **no** create/write/delete ACL for any app role.
- **2 business rules** — `hr`/payroll refusal + mandatory `sync_run` on staging; `failed` demands a reason on `sync_run`.
- **Sync engine** — `src/server/sync/{engine,retention,drainer,test-driver-l3}.ts`, bridged by the
  `SyncEngine` Script Include. Run lifecycle, idempotent upsert, `success`-only reconciliation,
  pagination with both ceilings, retention with both guards.
- **`src/server/contract/promotion.ts`** — the only promotion authority, with a self-check the engine runs.
- **REST API** — `/api/x_335329_sn_hr_erp/hub` : `GET /data`, `POST /refresh`, both
  `authentication: true`, verified live on `sys_ws_definition` / `sys_ws_operation`.
- **`src/server/api/{tabs,state-resolver,role-check,hub-data,routes}.ts`** — 15 KPIs, 5 charts, 5 lists.
- **2 new properties** (empty inventory/assets retention overrides), 2 gate-driver target properties.
- **`docs/api-contract.md`** — binding payload shape for L5 / `uib-page-spec.md`.
- Additive column `object_map.oee_input_scale` (no default, OD7) and `erp_staging.delta` (see §3).

Verified by query after deploy: **9 scheduled jobs, every one `active=false`, `run_type=on_demand`.**
`grep` guards: D19 `.ts` extensions = **0 violations**; `x_335329_erpcrm` = **0 hits**.

# 2. NOT met, NOT attempted — the honest list

- **THE L3 GATE and THE L4 GATE.** Not run, not reworded, no partial credit. OD21.
- **No staging fixtures exist** (L3-15 skipped as test material). `GET /data` today returns
  `not_configured`/`failed` on every tile — correct for an unsynced instance, evidence of nothing. OD22.
- **Not one line of `src/server/sync/` or `src/server/api/` has executed.** A clean build and a
  clean install prove nothing about either, and that is this project's own rule.
- The L3 gate driver is deployed and disarmed. It needs the same *Execute Now* / admin-password
  trigger **OD18** already blocks.

# 3. Contradictions found against the designs

1. **`qty < threshold` is not expressible as an encoded query.** `l4 §7.2` and `l3 §3.1` both say
   it is. ServiceNow's field comparison is `[is same]`/`[is different]` + two **date-only** range
   operators (`r_ComparingFieldValues.md`). **Fixed by a tenth promoted column, `delta`,
   precomputed per row at stage time (L3-D12).** Still per-row, still each item's own safety stock.
2. **`l4 §7.1`'s "8 queries, one aggregate for all KPIs" is unreachable** — the KPIs carry
   different filters. Real budget: **9–11 per tab**, independent of row count and system count.
   OD20.
3. **`l3 §3.2` promotes "the resolved OEE" to `ratio` at L3; `l5 §5` computes OEE in the L4
   resolver.** Split: L3 promotes a **supplied** `oee` (scaled); L4 owns precedence, the weighted
   mean and the "which input is missing" sentence.
4. **`l3 §4.6`/`§6.3` say `frequency: 'daily'`.** Shipped `on_demand` per the standing zero-armed
   constraint (L3-D8). Stronger, not looser; arming is a source diff.
5. **`l4 §5.4` blanks a mixed-currency tile; D11 requires subtotals.** D11 wins — `st: "partial"`,
   `sub: [{cur,v}]`, `v` absent (L4-D8).
6. **T4-19 ("zero `gs.hasRole` hits") contradicts D14**, which mandates it. T4-19 recorded
   **superseded** (L4-D9).
7. **`sync_run.status` has exactly four values, so there is no "running".** An in-flight run is
   inserted as `failed` + "Run did not complete." and finished at the end — a transaction that
   dies mid-sync therefore leaves an honest "ERP did not answer", not a stateless row.
8. **The design never names the refresh queue.** New `sync_request` table (L3-D9).

# 4. Traps that bind L5 / L6

- **T14 — `erp_staging` insert vs the 19 deny-write ACLs is REASONED, NOT RUN.** `KB0677278` says
  server-side GlideRecord is not ACL-subject, so a system-context insert should succeed while a
  Table API `PATCH` is still refused. If that is wrong, L3 is dead on arrival **and the symptom is
  silent** (Shape A refusal = HTTP 200, field unchanged). **Run this first.** OD23.
- **T15 — `delta` is now load-bearing for every per-row comparison.** Any future tile comparing two
  numeric columns needs its own precomputed column; there is no query-time operator to fall back on.
- **T16 — `POST /refresh` queues but nothing drains.** The drainer is `on_demand` + `active: false`.
  L5 must render "Refresh queued", never "Refreshing" — and the figures will not move until a human
  runs the job. That is honest, and it is also a support call waiting to happen.
- **T17 — the payload's absent-key contract is unforgiving by design.** `v`, `sub`, `cat`, `s`, `r`
  and `link` are **absent**, never `null`/`[]`/`0`. L5 must read with `'v' in tile`; `tile.v || 0`
  renders a wrong number and will pass a happy-path smoke test.
- **T18 — a gated list COLUMN is dropped from `cols`, not just from the rows.** L5 renders whatever
  `cols` says and must not hardcode a column set per tab.
- **T19 — `sync_request` create is granted to `viewer` on purpose.** Same reasoning as `call_log`
  create. Do not "tighten" it to admin: every viewer-pressed Refresh would silently enqueue nothing.
- Carried forward and still live: **T10** (active map + zero field rows refuses to dial — any L3
  fixture needs field rows), **T11** (`not_configured` excluded from the breaker counter — the
  `NOT IN` filter in `circuit-breaker.recordFailure` must not be tidied), **T12** (the six
  `erp_system` rows exist only on the instance), **T13** (response bodies never persisted; the
  first legitimate landing place is `erp_staging.payload`).

# 5. Open questions for the human

1. **OD1 retention is still PROPOSED.** 90/730 are deployed as property values but the cleaner is
   disarmed. Arming = approve the number, then change `frequency` **and** `active` in source.
2. **Uninstall does not delete staged data** (`l3 §6a`, unchanged and unverified). Decommissioning
   is two steps: uninstall/delete, **then** confirm `x_335329_sn_hr_erp_staging` is gone.
3. **L4-D6 flag stands:** "Assets depreciated this quarter" ships as an ungated **count**. If the
   product owner means a monetary total it becomes `currency` + `finance_viewer` — one line.
4. **Pagination parameter names** (`offset`/`limit`, `page`/`per_page`, `$skip`/`$top`) are
   conventional per style; no design or column specifies them. An ERP spelling them differently is
   onboarded via `query_template`, but this has not been proven against a real vendor (OD3/OD15).
5. **OD12** — the empty `x_335329_sn_hr_erp_acltest` shell is still on the instance.
