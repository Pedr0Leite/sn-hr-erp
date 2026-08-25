---
title: SN HR&ERP — defect audit
app: x_335329_sn_hr_erp
auditor: bug-hunter
generated: 2026-08-14
basis: static read of src/ against docs/api-contract.md (binding), docs/decision-log.md, kickoff §7
scope: contract mismatches (L4↔L5), four-state violations, runtime-fatal patterns, ACLs, N+1, scope
excluded: everything already recorded in docs/DEFERRED.md and in the per-layer "contradictions" sections
---

# Summary

| Severity | Count |
|---|---|
| CRITICAL | 1 |
| HIGH | 4 |
| MEDIUM | 4 |
| LOW | 2 |

**Categories found clean** (a result, not an omission):

- **D19 `.ts` relative imports** — every `src/server/**` → `src/server/**` relative import carries
  `.ts`. All 74 checked. The extensionless imports under `src/fluent/**` are the top-level
  `.now.ts` → module form the SDK rewrites, which D19 explicitly exempts. **Clean.**
- **Boolean reads** — zero `getValue(...) === 'true'` comparisons in `src/`. Every Boolean read in
  `hub-data.ts`, `config-loader.ts`, `drainer.ts`, `validate-erp-system.ts` and
  `annotate-object-map.ts` goes through `isTrue()`. **Clean.**
- **`gs.nowDateTime()` in scoped code** — zero call sites; four comments explaining its absence.
  **Clean.**
- **ACL `adminOverrides`** — written explicitly on all 74 `Acl()` declarations across
  `l1/l2/l3/l6-acls.now.ts`. Every deny rule is Shape A with `adminOverrides: false`; every allow
  rule is `true`. No rule relies on the SDK default. **Clean.**
- **N+1 GlideRecord in tab assembly** — no `new GlideRecord` or `new GlideAggregate` is constructed
  inside any row loop in the L4 request path. `loadContext()` is 6 batched queries using `IN`;
  system display names come from the query-1 map, never `getDisplayValue()` per row. **Clean.**
- **Cross-scope / unsupported API use** — no `Packages.`, no `GlideAjax`, no `gs.getUser()`, no
  `setAbortAction` outside a business rule. `GlideSysAttachment` (`hr/assemble.ts:258`) is
  scope-supported. **Clean.**

---

# Findings

## Status — 2026-08-14

Fixed in source and **built clean**, awaiting deploy (the SDK credential store emptied mid-session):

| | |
|---|---|
| **BUG-001** | FIXED — a non-numeric `SUM` now poisons the system contribution instead of summing as `0`, so the tile resolves to an absence. `COUNT` keeps `\|\| '0'` (a count of zero rows is a genuine zero) |
| **BUG-002** | FIXED — the `result` envelope is unwrapped before *both* branches, so the API's own 400 sentence survives |
| **BUG-003** | FIXED — chart gaps are `null`, not `0`: bars draw nothing, lines break rather than interpolate, pie slices consume no angle |
| **BUG-004** | FIXED — OEE tests presence, not truthiness, and guards `Number(null) === 0` |
| **BUG-005** | FIXED — `insert()` return captured; a refused queue write returns 500 instead of `{queued: true}` |
| **BUG-007** | FIXED — `domainOf()` tracks both bounds; bars baseline at zero and draw downward, with a zero line when `min < 0` |
| **BUG-008** | FIXED — explicit write ACL on `sync_request`, plus the drainer logs an error if `drained` fails to stick |
| **BUG-010** | FIXED — `sys` populated on the three `restricted` early-returns |
| **BUG-011** | FIXED — the fetch guard moved from a `setByTab` updater into a ref |
| **BUG-006** | **OPEN** — `as_of` reads `sync_run.started`, not `staging.fetched_at`. Needs a `MAX(fetched_at)` aggregate |
| **BUG-009** | **OPEN** — the OEE tile reads every `production_output` row unbounded, in the request path |

Nothing here has been verified at runtime — no connector call has ever executed (OD18).

---

### BUG-001 — A KPI whose promoted column is unmapped or unparsed renders `v: 0` with `st: "live"`

- **Severity:** CRITICAL
- **File:** `src/server/api/hub-data.ts:317-318`, `:322-323` (`aggregateFor`)
- **Table:** `x_335329_sn_hr_erp_staging`
- **Description:** The KPI aggregate path coerces "this column has no value" into the number zero,
  then hands it to the resolver as a real contribution. Two coercions do it:

  ```
  317:  ? parseFloat(String(ga.getAggregate('COUNT', 'sys_id') || '0'))
  318:  : parseFloat(String(ga.getAggregate('SUM', tile.field as string) || '0'))
  322:  out[sysId].total += isNaN(value) ? 0 : value
  ```

  `GlideAggregate` returns a group for every distinct `erp_system`/`currency_code` present in
  staging, whether or not the summed column holds anything. When `amount` is empty on every row of
  the group, `SUM(amount)` yields empty — `|| '0'` turns it into `0`, and the `isNaN → 0` fallback
  at 322 catches whatever survives. `contributionsFor` (`:348`) then sees `agg !== undefined`, so
  `value = 0` rather than `null`, `stateOf` sees a `success` run, and the tile resolves `live`
  with `v: 0`.

  **The chart path in the same file gets this right and the KPI path does not.** `chartTile:552-559`
  reads `parseFloat(String(raw || ''))` — deliberately `''`, not `'0'` — and its comment states the
  rule: *"NaN means the column is empty for every row in the group, i.e. the field is not mapped.
  It is LEFT OUT, not written as 0."* The two paths disagree by one string literal.

  `requiresMapped` does not cover this. It is declared on exactly two tiles (`inv_low_stock`,
  `inv_reorder`, both on `safety_stock`). The five currency KPIs — `fin_cash`, `fin_ar`, `fin_ap`,
  `proc_ytd_spend`, `ast_valuation` — declare none, and all five sum `amount`.
- **Evidence:** `docs/api-contract.md:49` — *"`v: 0` occurs **only** with `st: "live"`, and only
  when a `success` run returned an empty set or rows summing to zero"* (P3). `docs/DEFERRED.md:81` —
  *"**Never** display `0` for an absence."* `hub-data.ts:21-23` states P3 as an invariant of this
  file. The rendered result is `Cash balance / 0 / as of 14 Aug 2026 09:12` — a live, timestamped,
  finance-gated zero for a figure the ERP never supplied.
- **Fix:** In `aggregateFor`, drop both `|| '0'` fallbacks and stop swallowing `NaN` — parse with
  `String(raw || '')` and skip the group when `isNaN`, exactly as `chartTile:552-559` does, so
  `agg` stays absent and `contributionsFor:348` leaves `value: null`. The genuine-zero path
  (`:349-351`, `success` run with no aggregate row) already produces P3's only legal `v: 0` and is
  unaffected.
- **Reproducible when:** any active `object_map` syncs successfully while its `field_map` does not
  map the tile's promoted column — or maps it with a wrong `source_path`, so `walkPath` returns
  undefined and `engine.ts:449-451` writes `''` into the slot for every row. A single typo in one
  `field_map.source_path` turns Tab 1 into three confident zeros.

---

### BUG-002 — The client discards every 400's sentence: the same `result` envelope bug, on the error path

- **Severity:** HIGH
- **File:** `src/client/api.ts:32` (read), against `src/server/api/routes.ts:38` and
  `src/server/api/hub-data.ts:770`, `:776`, `:818`, `:822`, `:829` (written)
- **Description:** `api.ts:41` was fixed to unwrap `{"result": …}` on success. The error branch
  eight lines above it was not, and it runs first:

  ```
  32:  const stated = parsed && parsed.error ? String(parsed.error) : ''
  ...
  36:  throw new Error(stated || 'The hub API returned HTTP ' + response.status + '.')
  ```

  The routes build their errors with `response.setStatus(400)` + `response.setBody({error: "…"})`.
  A Scripted REST API wraps a `setBody()` body in `result` regardless of status, so the wire body is
  `{"result":{"error":"Unknown tab 'foo'."}}`. `parsed.error` is `undefined`, `stated` is `''`, and
  the user is shown the generic fallback. Every sentence the API composes — `Unknown tab 'foo'.`,
  `Missing required parameter 'tab'.`, `Tab 'x' declares no staged objects.` — is thrown away,
  along with the `tabs: tabNames()` hint at `:776`/`:822`.

  Same defect on the refresh path: `app.tsx:87` renders
  `'The refresh could not be queued. ' + e.message`, so a failed refresh reads
  *"The refresh could not be queued. The hub API returned HTTP 400."*
- **Evidence:** `ServiceNowOfficialDocs/api-reference/rest-api-explorer/r_ScriptedRESTServiceScriptExamples.md`
  § *Requests* — a Scripted REST response body is `{"result":{…}}`. The platform's unwrapped
  `{"error":{"message","detail"},"status":"failure"}` shape
  (`ServiceNowOfficialDocs/api-reference/rest-api-explorer/c_CustomWebServices.md` § *Error response
  format*) is produced by `sn_ws_err` error objects, which these routes do not use. `api.ts:38-41`
  already documents the envelope — the comment sits below the code that ignores it.
  Story L4-1 AC5 requires a 400 **naming the value**; the naming never reaches a human.
- **Fix:** Unwrap once, before the `response.ok` test — move the `'result' in parsed` unwrap above
  line 28 and read `.error` off the unwrapped object. Also guard the shape: if the platform *does*
  emit its own `{"error":{message,detail}}` (401, router 404), `String(parsed.error)` yields
  `"[object Object]"`, so read `parsed.error.message` when `error` is an object.
- **Reproducible when:** any 400 — `GET /data` with no `tab`, or `?tab=finance` (a plausible typo
  for `financial`). Also fires on the 500 path if a tile ever throws.

---

### BUG-003 — Chart series zero-fill every category the ERP had no value for

- **Severity:** HIGH
- **File:** `src/server/api/hub-data.ts:584-595` (`chartTile`)
- **Description:** `chartTile` correctly refuses to write an unmapped field as `0` while reading
  the aggregate (`:552-559`), then writes exactly that zero back while assembling the series:

  ```
  588:  const v = data[String(s)] ? data[String(s)][categories[c]] : undefined
  589:  values.push(v === undefined ? 0 : v)
  590:  if (v !== undefined) { anyPresent = true }
  ```

  `anyPresent` is evaluated across the **whole series**, so the `miss: [...]` escape only fires when
  a series is empty for *every* category. A series present for some categories and absent for
  others is emitted as a dense array of numbers with `0` standing in for the gaps, and the client
  cannot tell them apart — `d` is a `number[]`, the absence is gone by the time it leaves the
  server.

  Rendered result: `fin_rev_exp` (Monthly revenue vs expenses) draws a full-height Revenue bar and a
  floor-height Expenses bar for a month where `threshold` was never populated. The reader concludes
  the month had zero expenses. `mfg_output_target` does the same with the Target line, dropping it
  to the axis for any day without a target — a target at zero is a target somebody acts on.
- **Evidence:** `docs/api-contract.md:56-58` — *"`miss: [...]` names a declared series whose field
  is unmapped. **It is never returned as a series of zeros.**"* The contract states the rule
  per-series; the code applies it per-series but the gap is per-category.
  `docs/DEFERRED.md:81` — *"**Never** display `0` for an absence."*
  `charts.tsx:1-12` records that the whole no-library decision exists because *"no mainstream
  library has a concept of 'draw no axes because this data does not exist'"* — and then the payload
  hands it zeros that are indistinguishable from data.
- **Fix:** Emit the absence rather than erasing it. Either restrict `cat` to the categories for
  which every emitted series has a value, or add a per-series gap list to the envelope (a `gaps`
  index array beside `d`) and teach `Bars`/`Lines` to skip those indices — the contract change has
  to be made in `docs/api-contract.md` first, since L5 binds to that file.
- **Reproducible when:** a chart's group-by dimension has more distinct values than the series field
  has populated rows — a `gl_summary` sync where `threshold` (expenses) is mapped for 10 of 12
  months, or any `production_output` day where `target` was not supplied.

---

### BUG-004 — OEE silently drops any row whose availability, performance or quality is genuinely `0`

- **Severity:** HIGH
- **File:** `src/server/api/hub-data.ts:439`
- **Description:**

  ```
  439:  } else if (payload && payload.availability && payload.performance && payload.quality) {
  ```

  A truthiness test on three numerics that are legitimately zero. A production line that was down
  for the whole period reports `availability: 0`; a batch scrapped entirely reports `quality: 0`.
  Every such row fails this guard, is never pushed into `components`, and contributes neither a
  value nor a weight.

  The consequence is not a missing tile — it is a **wrong number presented as live**. The bad lines
  drop out of the weighted mean entirely, so the surviving lines average higher, and the tile
  renders that inflated figure with `origin: "computed"` and an `as of` stamp. If *every* line was
  down, `components` is empty, `resolveOee` returns `missing: 'production_output'`
  (`state-resolver.ts:377-381`), and the tile reads `Not configured — 'production_output' is not
  mapped` for a line that was mapped, synced and genuinely at zero.

  The sibling read one line above gets it right: `if (ratio !== '')` at `:436` compares against the
  empty string precisely so a supplied `ratio` of `0` survives.
- **Evidence:** `state-resolver.ts:318-322` — *"NEVER substitutes 1.0 for a missing factor, never
  treats it as neutral, never renders a partial product… a silently-wrong OEE is a number
  executives act on."* Dropping a zero-availability row is the same error in the other direction:
  it excludes a real factor instead of inventing one. Kickoff §7 / `DEFERRED.md:81` forbid
  conflating a genuine `0` with an absence in either direction.
- **Fix:** Test for presence, not truth — `typeof payload.availability === 'number'` (or an explicit
  `!= null` plus `isNaN` check after `Number()`) for each of the three, matching the `!== ''`
  treatment `ratio` already gets at `:436`.
- **Reproducible when:** any `production_output` row is staged with a zero in one of the three
  component fields — an unplanned outage day, a fully-scrapped batch, or a line not yet
  commissioned.

---

### BUG-005 — `POST /refresh` reports `queued: true` without checking that anything was queued

- **Severity:** HIGH
- **File:** `src/server/api/hub-data.ts:832-847` (`queueRefresh`)
- **Table:** `x_335329_sn_hr_erp_sync_request`
- **Description:**

  ```
  832:  const gr = new GlideRecord('x_335329_sn_hr_erp_sync_request')
  ...
  837:  gr.insert()
  ...
  847:  return { status: 200, body: { queued: true, objects: def.objects, systems: systems } }
  ```

  `gr.insert()` returns the new sys_id, or `null` when the insert is refused. The return value is
  discarded and `queued: true` is a literal — the response asserts success unconditionally. A
  scoped `GlideRecord` runs security-aware in the caller's session (this is a Scripted REST route
  with `authentication: true` and no `enforceAcl`), so a caller lacking
  `x_335329_sn_hr_erp.viewer` — or hitting any create ACL that does not resolve as intended — gets
  HTTP 200, `{"queued": true}`, and nothing in the queue.

  `app.tsx:80-86` then renders the full success sentence: *"Refresh QUEUED for stock_item,
  backorder across 2 system(s)…"*. The button reports a decision it did not commit.

  This is not the deferred OD23 (that is the sync engine's own insert into `erp_staging`, running as
  `system`). This is the user-session insert into `sync_request`, on a different table, and the
  failure is unconditional regardless of how OD23 resolves.
- **Evidence:** `docs/DEFERRED.md:80` — *"**Never** draw a button that can't commit its decision."*
  `docs/api-contract.md:86` binds the response to `{ "queued": true, … }`, which the client is
  entitled to read as a fact. `sync-request.now.ts:14-17` states the intent — *"if create were
  admin-only, every viewer-pressed Refresh would silently enqueue nothing"* — and identifies exactly
  this failure mode without guarding against it in code.
- **Fix:** Capture the return — `const id = gr.insert()` — and return a 500 (or a `queued: false`
  with a stated reason) when it is null or empty. The client's error branch at `app.tsx:87` already
  exists to render it.
- **Reproducible when:** any caller without `x_335329_sn_hr_erp.viewer` presses Queue refresh; or
  any deployment where the `acl-sync-request-create` rule fails to install or is deactivated.

---

### BUG-006 — `as_of` and every staleness calculation read `sync_run.started`, not `staging.fetched_at`

- **Severity:** MEDIUM
- **File:** `src/server/api/hub-data.ts:255` (`loadContext` query 5), `:357-361`
  (`contributionsFor`); consumed at `state-resolver.ts:98`, `:225`, `:248-250`
- **Description:** `RunRow.startedMs`/`started` are populated from `sync_run.started` and carried
  into `SystemContribution.fetchedAtMs`/`fetchedAt`, whose own declaration
  (`state-resolver.ts:39-40`) says *"Epoch ms of the data's fetched time"*. They are not the same
  instant. `engine.ts:410` sets `const fetchedAt = nowValue()` **after** the pagination loop
  completes, so `erp_staging.fetched_at` is when the ERP finished answering, while
  `sync_run.started` is when the run began — separated by the whole fetch, including paged requests
  and the connector's sleep-based backoff, bounded only by `SYNC_CONSTANTS.MAX_SYNC_MS`.

  Consequences: every `as_of` stamp on every tile is early by the sync duration, and `stateOf`
  (`:98`) crosses the `stale_after_hours` threshold that much sooner, so a figure is flagged stale
  before it is. The column the contract names is written correctly on every staged row and is never
  read by L4.
- **Evidence:** `docs/api-contract.md:40` — *"`as_of` … the data's own time, **from `fetched_at`**"*.
  `erp-staging.now.ts:68-72` — *"`fetched_at`: When the ERP ANSWERED. Every 'as of' and every
  staleness calculation reads this and never `sys_updated_on` (story L3-4 AC5)."* The API reads
  neither `fetched_at` nor `sys_updated_on` — it reads a third column the contract does not name.
- **Fix:** Add `MAX(fetched_at)` per `erp_system`/`logical_object` to the staging aggregate already
  built in `aggregateFor`, or a seventh `GlideAggregate` on `erp_staging` in `loadContext`
  (grouped the same way as query 4), and populate `fetchedAtMs`/`fetchedAt` from it. Keep
  `sync_run.started` only for ordering runs.
- **Reproducible when:** any object whose sync takes non-trivial wall time — multi-page pagination,
  or a retried call under `backoff.ts`. Divergence equals the sync duration.

---

### BUG-007 — A negative value renders as no bar at all, beside real bars

- **Severity:** MEDIUM
- **File:** `src/client/charts.tsx:21-31` (`maxOf`), `:47-72` (`Bars`), `:74-90` (`Lines`)
- **Description:** `maxOf` seeds `max = 0` and only ever raises it, so for an all-negative series it
  returns `0`, and `max || 1` makes the divisor `1`. `Bars` then computes
  `h = ((H - PAD - 8) * v) / max` — negative — and emits `<rect height={h}>` with a negative
  height. A negative `height` is an error value in SVG: the element is not rendered. `Lines` puts
  the point below the baseline, outside the `viewBox`, and it is clipped.

  The reader sees a chart where some categories have bars and the negative ones have nothing — an
  absence, drawn for a value that exists. There is no state sentence to correct it, because the
  tile is genuinely `live`: the ERP answered, and the answer was negative.
- **Evidence:** `charts.tsx:1-8` — the module exists so that *"an empty chart frame reads as 'zero
  revenue'"* cannot happen; a missing bar in an otherwise-populated frame reads the same way.
  `docs/DEFERRED.md:81` — *"**Never** display `0` for an absence"*; this displays *nothing* for a
  real negative, which is worse. `erp-staging.now.ts:87` places no non-negative constraint on
  `amount`, and `field-mapper.ts`'s `toNumber` does not clamp.
- **Fix:** Track both bounds in `maxOf` (return a `{min, max}` domain), baseline the bars at
  `y = 0` within that domain rather than at `H - PAD`, and give `<rect>` `y = min(y0, yv)` with
  `height = |h|`. Draw the zero line whenever `min < 0`.
- **Reproducible when:** `fin_rev_exp` for a loss-making month, or any `gl_summary` /
  `purchase_order` row carrying a credit note or reversal — `amount < 0`.

---

### BUG-008 — The drainer cannot mark a request drained: no write ACL exists on `sync_request`

- **Severity:** MEDIUM
- **File:** `src/server/sync/drainer.ts:38-39`; table `src/fluent/tables/sync-request.now.ts`;
  ACLs `src/fluent/security/l3-acls.now.ts:376-378`
- **Table:** `x_335329_sn_hr_erp_sync_request`
- **Description:** `drainRefreshQueue` closes each queue row with
  `gr.setValue('drained', true); gr.update()`. The table declares
  `createAccessControls: false`, and `l3-acls.now.ts` ships **read** and **create** for `viewer` and
  **delete** for `admin` — its own header comment says so: *"No write ACL: the `drained` flag is set
  by the drainer running as system."* If that assumption is wrong, `update()` is refused silently
  (a scoped write refusal is HTTP-200-equivalent — no throw, field unchanged, per
  `DEFERRED.md:68-70`), `drained` stays `false`, and the row is re-selected by
  `gr.addQuery('drained', false)` on **every subsequent drain**.

  The failure is not a stuck queue — it is an unbounded one. Each pass calls `syncCategory()` again
  for every request ever queued, so the ERP is re-fetched once per queued request per drain pass,
  forever. Every one of those re-syncs writes `sync_run` rows and upserts staging.

  Related to but distinct from OD23 (deferred): OD23 asks whether the engine's **insert** into
  `erp_staging` survives 19 deny-write field ACLs. This is a **write to a different table** where
  no write rule exists at all, and it is the one that turns into repeated outbound ERP traffic.
- **Evidence:** `l3-acls.now.ts:376-378` and `sync-request.now.ts:20-31` both record the assumption
  as an assumption. `DEFERRED.md:68-70` — *"A Shape A deny refusal is silent (HTTP 200, field
  unchanged). Any assertion on status code passes against a completely broken ACL."*
  `drainer.ts:24-40` has no post-update re-read.
- **Fix:** Either add an explicit write ACL on `sync_request.drained` scoped to the drainer's
  identity, or re-read `drained` after `update()` and `gs.error()` + abort the loop when it did not
  stick — a drainer that cannot close its queue must stop, not spin.
- **Reproducible when:** the L3 drain job is armed for the first time with more than zero rows in
  `sync_request`. Currently masked because the job ships `on_demand` + `active: false` and the
  queue is empty.

---

### BUG-009 — The OEE tile reads every `production_output` row in staging, unbounded, in the request path

- **Severity:** MEDIUM
- **File:** `src/server/api/hub-data.ts:423-447` (`oeeTile`)
- **Table:** `x_335329_sn_hr_erp_staging`
- **Description:** The only non-aggregate read in the L4 request path:

  ```
  423:  const rows = new GlideRecord(T_STAGING)
  424:  rows.addQuery('logical_object', 'production_output')
  425:  rows.addQuery('erp_system', 'IN', systemIds.join(','))
  426:  rows.query()
  ```

  No `setLimit`, no date window, no `where`. It loads every staged production row across every
  active system, and runs `JSON.parse()` on each row's `payload` inside the loop. This executes
  synchronously on every `GET /data?tab=manufacturing`, for every user, on every tab open — the
  Manufacturing tab is not cached client-side beyond `byTab` for one session.

  Every other query in this file is bounded: the lists carry `list.limit` (`:671`), and the KPI and
  chart paths use `GlideAggregate`. This one grows with retained history. `retention.ts` is the only
  bound on it, and it ships disarmed under OD1.
- **Evidence:** `hub-data.ts:29-32` — *"QUERY BUDGET… It is INDEPENDENT OF ROW COUNT"* — the stated
  property of story L4-4 that this query breaks: the work is O(rows), not O(queries). Story L4-4 AC3
  is satisfied (no query inside the loop), but the row-count independence claimed two lines above it
  is not.
- **Fix:** Bound it — `rows.setLimit()` plus an `occurred_on` window (a `withinDays`-style property,
  consistent with D5), or push the weighted mean into a `GlideAggregate` over `ratio × qty` where
  `ratio` is supplied and read rows only for the component-triple fallback.
- **Reproducible when:** `production_output` accumulates history with retention disarmed. Latent
  today at zero rows; first felt after the first armed scheduled sync.

---

### BUG-010 — `restricted` tiles omit `sys`, which the contract lists as always present

- **Severity:** LOW
- **File:** `src/server/api/hub-data.ts:392-395` (`kpiTile`), `:513-516` (`chartTile`),
  `:629-632` (`listTile`)
- **Description:** All three gated early-returns build `out` and return before `merge()`, which is
  the only writer of `out.sys` (`:722-726`). A `restricted` tile therefore ships without `sys`,
  while `docs/api-contract.md:35` marks `sys` **always**. The contract contradicts itself — its own
  `restricted` example at `:73` also omits `sys` — so this is a documentation defect as much as a
  code one.

  Not currently user-visible: `KpiTile.tsx:27` guards with `t.sys && t.sys.length > 0`. It is
  recorded because the contract is binding on L5 and a future consumer reading the table rather than
  the example will trust `sys` to be there.
- **Evidence:** `docs/api-contract.md:35` (`sys` | always) vs `:72-78` (the `restricted` example,
  no `sys`) vs `hub-data.ts:392-395`.
- **Fix:** Decide one way in `docs/api-contract.md` first. If `sys` stays "always", populate it in
  the three early-returns from `ctx.systems`; naming the contributing systems leaks nothing the
  tab's other tiles do not already name.
- **Reproducible when:** any `finance_viewer`-gated tile requested by a caller without the role.

---

### BUG-011 — `load()` is called from inside a `setByTab` state updater

- **Severity:** LOW
- **File:** `src/client/app.tsx:55-62`
- **Description:**

  ```
  55:  useEffect(() => {
  56:      setByTab((prev) => {
  57:          if (!prev[tab]) { load(tab) }
  58:          return prev
  59:      })
  60:  }, [tab, load])
  ```

  The updater is not pure: it fires a side effect (`load`, which itself calls `setByTab`) during
  React's state-processing phase, and it returns `prev` unchanged so the outer update bails out.
  React documents updaters as pure functions and may invoke them more than once for a single
  logical update under `createRoot`'s concurrent rendering. Each extra invocation is one more
  `GET /data`, which is what story L5-1 AC3 counts.

  Currently mild: `main.tsx:8` uses `createRoot` **without** `StrictMode`, so the guaranteed
  dev-mode double-invoke is absent, and the `!prev[tab]` test suppresses a repeat once the loading
  entry lands. Adding `<StrictMode>` — the ordinary next change — turns this into two calls per
  tab open.
- **Evidence:** `app.tsx:1-9` states the contract: *"page open → EXACTLY ONE `GET /data`… A page
  open that calls /data five times fails story L5-1 AC3."* The guard is placed inside the one
  construct React does not promise to run exactly once.
- **Fix:** Read the guard from a ref instead of from state — keep an `inFlight` `useRef(Set)`,
  test and add to it in the effect body, and call `load()` there rather than inside the updater.
- **Reproducible when:** `StrictMode` is added, React's concurrent renderer discards and replays a
  render, or a second `setByTab` is introduced in the same commit.

---

# B-L2-1 — the gate's own success case carries an error code, and the gate does not look

**Found:** 2026-08-25, in the first L2 gate run ever executed on this instance.
**Severity:** low as a runtime defect, **high as a test defect**.
**Status:** open, not fixed.

## What was observed

GATE-1 is the canonical "one successful live call". It passed. The `call_log` row it asserted on:

```
#1{obj=invoice,status=success,http=200,dur=887,rows=-,map=set,verified=0,err=RESPONSE_UNPARSEABLE}
```

`status=success`, `http=200`, `dur=887` — and `rows=-` with `err=RESPONSE_UNPARSEABLE`.

## Why

`l2-fixtures.now.ts` sets `response_root: 'args'` on the System A `invoice` map. postman-echo's
`/get` returns `args` as a JSON **object** of query parameters — deliberately, because the fixture
is built so `field-mapper.ts` reads named fields out of it and the source field names are
intentionally unlike the logical ones.

But `response_root` is overloaded. `erp-connector.ts` `countRows()` walks the same path and
requires an **array** at the end of it:

```
if (Object.prototype.toString.call(node) === '[object Array]') {
    return { rows: node.length, errorCode: null }
}
return { rows: null, errorCode: 'RESPONSE_UNPARSEABLE' }
```

An object is not an array, so the happy path can never produce a row count. `rows_fetched` is
`null` on every successful call against this fixture.

## Why the gate did not catch it

`T2-19` asserts `okRows[0].status === 'success' && okRows[0].httpCode === '200' &&
okRows[0].durationMs > 0`. It never reads `rows_fetched` and never reads `error_code`. A row that
is simultaneously `success` and `RESPONSE_UNPARSEABLE` satisfies every clause.

## The part that is genuinely reassuring

`countRows()` returning `RESPONSE_UNPARSEABLE` rather than `0` is **correct and deliberate** —
`field-mapper.ts:62` states the reason: *"the path was wrong" and "there are no rows" are
different*. The four-state contract held. A tile fed from this would resolve to `failed`, not to a
fabricated `0`. **This is the rule working, discovered by accident.**

## What to decide

Whether `response_root` should stay overloaded at all. Two paths need two different things: field
extraction wants the object, row counting wants the array. Candidate fixes, none chosen:

1. Split the column — `response_root` for extraction, `row_count_root` for counting.
2. Let `countRows()` treat a non-array object at the root as one row, which is arguably what a
   single-record endpoint means.
3. Leave the runtime alone and fix only the fixture, accepting that the gate's happy path then
   stops exercising a single-record shape.

**Do not "fix" this by making `countRows()` return `0` for a non-array.** That converts a refusal
into a fabricated absence and breaks the one rule the observation just confirmed is working.

## Also required

`T2-19` should assert on `error_code` being empty. A test that calls a row `success` while it
carries an error code is a test that cannot fail for the thing it is named after.

---

# Notes on what was checked and not reported

- `state-renderer.ts` is clean against the four-state rule. `hasFigure()` uses
  `hasOwnProperty(t, 'v') && typeof t.v === 'number'`; there is no `tile.v || 0`, no `(x || []).map`
  over payload data, and the `default:` branch returns no numeral. `mayDrawData()` correctly gates
  on `live`/`stale`/`partial` and `ListBlock.tsx:41` / `ChartBlock.tsx:26` both honour it.
- `format.ts` is clean: `stamp()` reformats textually and never constructs a `Date`, so no timezone
  shift; `age(0)` returns `"0 hours old"`, not `"age unknown"`.
- `merge()` (`hub-data.ts:721-755`) enforces P1/P2/P5 correctly — `v`/`sub` are copied only under
  the three permitted states, and there is no branch writing `v: null` or a `v: 0` fallback.
- `resolveTile` precedence (`not_configured > failed > partial > stale > live`, with the
  partial-when-some-answered exception) matches `state-resolver.ts:143-159` and L4-D3.
- The `engine.ts` failure path was checked against `state-resolver.ts:220-221`'s claim that staged
  rows are the last good figure: page-1 failure returns before any staging write (`:319-329`) and
  all pages are buffered before the upsert loop (`:410`). The claim holds. Not a bug.
- Item 6 of `docs/l5-l6-build-report.md` (a `currency` tile carries no currency code) and OD20
  (9–11 queries per tab) are already recorded and are not repeated here.
