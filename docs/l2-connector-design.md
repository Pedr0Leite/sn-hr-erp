---
title: L2 — Connector runtime — the port from x_335329_erpcrm, module by module
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-12
status: design-only. Implements D4 (port, do not reuse cross-scope; do not reinvent).
grounding: |
  Source read in full from `/mnt/c/Users/pedro/Documents/Programacao/Github/ServiceNowApps/sn-erp-crm-360/src/server/connector/`
  (12 runtime modules + 6 test drivers, 1,437 lines). Fluent shapes read from
  `@servicenow/sdk` 4.9.0 via `explain` (scriptinclude-api, script-include-guide,
  module-guide, scheduledscript-api, scheduled-script-guide). Table names per
  `docs/l0-scaffold-design.md` §2.2; logical objects per `docs/l1-control-tower-design.md` §2.
---

# 1. The rule this layer is governed by

**D4: port it, keep its structure, keep its tests. The retry / backoff / circuit-breaker /
telemetry behaviour is not to be reinvented.**

The sibling's connector is 21/21 passing with **zero connector defects found across the entire
phase**, and every constant in it carries a derivation comment. The temptation to "improve" it
during the port is the single biggest risk at this layer, and the mitigation is a rule:

> **A diff against the sibling source is a defect unless it appears in §4 of this document.**

§4 lists **four** permitted changes. Everything else is a byte-for-byte port with the table
constants swapped.

---

# 2. Module inventory — what ports, and how it changes

| Module | Lines | Change | Why |
|---|---|---|---|
| `types.ts` | 113 | **+ 2 interfaces** | `FieldMapEntry`, `ResolvedMapping` (§4.1) |
| `util.ts` | 66 | **constants only** | `isTrue`, `truncate`, `nowMs`, `toGlideDateTime` unchanged. **`isTrue` is ported verbatim, comment included** |
| `constants.ts` | 89 | **verbatim** | every number is derived, and the derivation comment is part of the constant |
| `classify.ts` | 65 | **verbatim** | the branch ordering is load-bearing and was corrected by live testing (T17). Do not reorder |
| `backoff.ts` | 96 | **verbatim** | including the busy-wait `sleepMs` — `gs.sleep` threw `MethodNotAllowedException` in a scoped module, proven live |
| `rest-client.ts` | 208 | **verbatim** | contains no vendor name, no hostname, no path. `getBody()` must not appear in it |
| `circuit-breaker.ts` | 141 | **table constant only** | three states, one column. The "populated but expired = HALF_OPEN" row is not a bug |
| `call-log.ts` | 85 | **table constant only** | the C1 chokepoint |
| `config-loader.ts` | 125 | **substantive — §4.1** | `loadMap()` gains `field_map` child rows; `loadSystem()` unchanged |
| `erp-connector.ts` | 274 | **substantive — §4.2, §4.3** | mapping resolution + `not_configured` outcome |
| `cleanup.ts` | 34 | port, retarget | test teardown |
| `harness.ts` | 73 | port | |
| `test-driver-*.ts` | 900 | port, retarget | the 21 cases |

## 2.1 Constants that change, and nothing else

```
x_335329_erpcrm_erp_system  →  x_335329_sn_hr_erp_erp_system
x_335329_erpcrm_object_map  →  x_335329_sn_hr_erp_object_map
x_335329_erpcrm_call_log    →  x_335329_sn_hr_erp_call_log
                       (new)   x_335329_sn_hr_erp_field_map
```

`object_map.object` is renamed `logical_object` in this app (L1 §4.1) for consistency with
`erp_staging` and `sync_run`. `config-loader` and `call-log` change the column name; nothing else
does, because everything downstream reads `ObjectMapConfig.object`, which keeps its name.

## 2.2 Constants that must NOT change

| Constant | Value | Why not |
|---|---|---|
| `MAX_TOTAL_CALL_MS` | 60000 | 5× margin under the 300 s transaction quota; the only thing making `timeout_ms=120000, max_retries=5` impossible in practice |
| `MAX_BACKOFF_SLEEP_MS` | 5000 | bounds the busy-wait's worker-thread burn. Raising it without re-deriving it is a thread-pool incident |
| `BACKOFF_MULTIPLIER` | 2 | |
| `CB_FAILURE_THRESHOLD` | 6 | = two fully-exhausted logical calls at default `max_retries=2` |
| `CB_COOLDOWN_MS` | 120000 | 2 × `MAX_TOTAL_CALL_MS`, so a probe can never outlive the next cooldown. Signed off as OD13 |
| `CB_PROBE_LEASE_MS` | 60000 | = `MAX_TOTAL_CALL_MS`; self-heals if the probing thread dies |
| `RETRYABLE_STATUS` | `[408,425,429,500,502,503,504]` | an **allow-list**, deliberately not `code >= 500`. 501/505 are deterministic. Simplifying this to a range check is a regression T2-6 catches |
| `ERROR_MAX_CHARS` | 1000 | matches the `call_log.error` column |

L3 will want a longer budget for a paginated sync. **It does not get one by editing
`MAX_TOTAL_CALL_MS`.** `docs/l3-staging-design.md` §5 gives the sync engine a per-page budget
built from repeated bounded calls.

---

# 3. The invariants the port must preserve

These are not style. Each was paid for.

| # | Invariant | Enforcement |
|---|---|---|
| **I1** | `getBody()` has **exactly one call site** in the whole layer, in `erp-connector.ts` | build-order step L2-12 greps and fails if the count ≠ 1 |
| **I2** | `CallLogEntry` has **no** field that could hold a response body | the type signature *is* the enforcement, not documentation of it |
| **I3** | `errorDetail` carries only `RESTResponseV2.getErrorMessage()` or a synthesised `HTTP <code>` line — never a body fragment | T2-3 |
| **I4** | Every Boolean read goes through `isTrue()` | grep for `=== 'true'` / `!== 'true'` → zero hits |
| **I5** | No vendor name, hostname or path appears in `rest-client.ts` | code review + T2-16 |
| **I6** | `setFollowRedirect(false)`; 3xx is a **non-retryable failure** | T2-7 |
| **I7** | `disableForcedVariableSubstitution()` on every outbound message | T2-8 |
| **I8** | `setMIDServer()` receives the **name**, via `getDisplayValue('mid_server')` | T2-9 |
| **I9** | Both `execute()` outcomes handled — it may throw **or** return `haveError() == true` | T2-10 |
| **I10** | A real HTTP status code **always wins** over the transport message in `classify()` | T2-6. An earlier revision checked the message first and retried every 404 |
| **I11** | Every module reaches the platform through a Script Include bridge; no `require()` in anything that could run in a vtable context | §6 |
| **I12** | No runtime reference to `x_335329_erpcrm` anywhere | T2-15 |

**A note on I11 in this app.** §9's `require()` trap is specifically about remote-table scripts.
**This app declares no remote table** — D2 stages data instead of querying live, so
`sys_script_vtable` never appears, and with it the `cache_empty_query_results` trap
(§9) never applies. I11 is kept anyway: the bridge pattern is the SDK's own documented approach
(`script-include-guide`, "Bridging Modules Through Script Includes"), and L6 calls the connector
from a Script Include regardless.

---

# 4. The four permitted changes

## 4.1 `config-loader.loadMap()` reads `field_map` child rows

Forced by L1-D3: `object_map.field_map` does not exist in this app.

```ts
export interface FieldMapEntry {
  logicalField: string
  sourceField: string
  transform: string          // 'none' | 'trim' | 'upper' | ... (L1 §4.2)
  zeroIsMeaningful: boolean  // L1 §4.4 — L6 depends on this
}

export interface ObjectMapConfig {
  sysId: string
  object: string
  endpointPath: string
  httpMethod: string
  responseRoot: string
  queryTemplate: string
  paginationStyle: string    // + new
  pageSize: number           // + new
  dateFormat: string         // + new
  deepLinkPath: string       // + new
  fields: FieldMapEntry[]    // + new — replaces the sibling's fieldMap JSON
  active: boolean
}
```

`loadMap()` issues **two** queries: one on `object_map`, one on `field_map` filtered to the
resolved map's sys_id. Bounded per (system × object); not an N+1 over data.

`zeroIsMeaningful` is read with `isTrue()` (I4). It is a Boolean column, and this is the exact
shape of the defect that killed three of four branches in the sibling's Phase 1 rule.

**`loadSystem()` is unchanged, comments included** — the `readCircuitOpenUntilMs` emptiness check
on the *raw string* before constructing the `GlideDateTime` is subtle and correct: an empty
`GlideDateTime` reads as epoch zero, which is in the past, and "populated but in the past" is how
the breaker encodes HALF_OPEN. Returning `0` there would make every healthy system look mid-probe.

## 4.2 A distinguishable `not_configured` outcome

Story L2-2 AC3: *"Given no `object_map` at all … the connector returns a distinguishable
`not_configured` outcome — not an empty array, not a thrown exception indistinguishable from a
network failure."*

The sibling returns `refuse(..., 'failure', 'MAP_INACTIVE', t0)` — a `failure`. That is wrong for
this app: at L4 a `failure` renders **"ERP did not answer"** and a missing map must render
**"Not configured — create an Object Map for `stock_item`"**. Two different sentences; §7 says the
distinction is the product.

**Change:** `CallStatus` gains `'not_configured'`, and `fetch()`'s pre-flight splits:

| Pre-flight condition | `CallStatus` | `errorCode` |
|---|---|---|
| system row missing / `active = false` | `not_configured` | `SYSTEM_INACTIVE` |
| no `object_map` row for (system, object) | `not_configured` | `MAP_MISSING` |
| `object_map` exists, `active = false` | `not_configured` | `MAP_INACTIVE` |
| `object_map` active, **zero `field_map` rows** | `not_configured` | `MAP_UNMAPPED` |
| `base_url` empty after a successful load | `failure` | `CONFIG_UNREADABLE` |
| `auth_type == 'mutual'` | `failure` | `AUTH_UNSUPPORTED` |
| breaker OPEN | `circuit_open` | `CIRCUIT_OPEN` |

`MAP_UNMAPPED` is L1-D6's other half: an active map with no rows never yields
`success, rows_fetched = 0`. Story L2-2 AC4 — *"the outcome is reported as a configuration error
naming the object, not as zero rows."*

**`call_log.status` gains `not_configured`** as a fifth choice. **Additive only** — the sibling's
own OD8 note explains why: `status != success` still catches it, so the Failed Calls module needs
no change, and it keeps configuration noise out of the breaker's derived failure counter.

**Consequence for the breaker, and it is deliberate:** `recordFailure()` already excludes
`circuit_open` rows because *"the counter must count evidence about the ERP, not evidence about
us."* `not_configured` is evidence about us. **It must be excluded too**, or an unmapped object
will trip the breaker on a perfectly healthy ERP and take the other 13 objects down with it.

```ts
gr.addQuery('status', 'NOT IN', 'circuit_open,not_configured')
```

**This is the single most dangerous line in the port**, because it is one word away from being
right and it fails silently. T2-13 exists only for it.

## 4.3 Mapping resolution is logged per call

Story L2-2 AC1, AC6. `ConnectorResult` gains:

```ts
resolvedMapping: {
  objectMapSysId: string
  fieldCount: number
  origin: 'object_map' | 'none'
  mappingSource: string      // 'manual' | 'template'
  mappingVerified: boolean
}
```

`origin` is **always `'object_map'` or `'none'`**. There is no `'template'` origin, because in
this app a template is never resolved at call time (L1-D4): "Apply vendor defaults" expands it
into real `field_map` rows, so by the time the connector runs, every mapping is an `object_map`
mapping. `mappingSource` records *where those rows came from*, which is what story L2-2 AC2 is
actually asking — *"the logged origin states which was used"*.

**Story L2-2 AC2 is satisfied by making the silent fallback impossible rather than by logging it.**
There is no code path where an empty `object_map` mapping quietly borrows a template. Empty →
`MAP_UNMAPPED` → not configured.

`call_log` gains two columns: `object_map` (reference, `cascadeRule: 'none'`) and
`mapping_verified` (Boolean). A wrong figure is traced: tile → `sync_run` → `call_log` → the
`object_map` row → its `field_map` rows.

## 4.4 Response mapping moves in

The sibling's mapper lives in `src/server/remote-tables/field-mapper.ts` because its consumer was
a vtable. This app has no vtable, so it ports to `src/server/connector/field-mapper.ts` and is
called by the L3 sync engine.

Its rules port **unchanged**, and they are the C2 rules restated:

- Unmapped source fields are ignored — an ERP sends far more than a dashboard needs.
- A mapped field missing from a particular record leaves its column **empty. Not zero.**
- A non-numeric amount leaves the column empty; the row is still added with its other columns.
  *"Showing a known invoice number with a blank amount is honest; showing 0 is not."*
- An unparseable date leaves the column empty — **never "now"**, which would make an old invoice
  look current.
- `walkPath()` returns `null` when any segment is missing, and the caller turns that into
  `RESPONSE_UNPARSEABLE` rather than an empty list, because *"the path was wrong"* and *"there are
  no invoices"* are different answers.

**One addition:** `MAPPABLE_COLUMNS` is no longer a fixed six. It becomes the per-object logical
contract from `src/server/contract/objects.ts` (L1 §2.4), and the promotion to typed staging
columns happens in L3, not here. `field-mapper` returns a logical-field-keyed object; L3 decides
which promoted column each logical field lands in.

**And one addition that is not optional:** `transform` (L1 §4.2) is applied here, per field, after
extraction and before typing. `percent_to_ratio` / `ratio_to_percent` exist for OD7's OEE inputs
(`docs/l5-ui-design.md` §5).

---

# 5. Deliberate non-changes

| Tempting | Why it is refused |
|---|---|
| Replace the busy-wait `sleepMs` with `gs.sleep` | Spike 0.3 executed it live on `dev296062` inside a scoped module and it **threw** `MethodNotAllowedException: Function sleep is not allowed in scope`. It type-checks perfectly. A clean build proves nothing about it |
| Simplify `RETRYABLE_STATUS` to `code >= 500` | D14 regression. 501/505 are deterministic; retrying them is pure waste |
| Collapse the breaker's HALF_OPEN state ("expired means closed") | It self-heals when a node dies mid-probe, costs no extra column, and without it the breaker resets only via a call it is itself refusing |
| Store a `consecutive_failures` counter on `erp_system` | That table is `audit: true`; a per-attempt counter emits a `sys_audit` row per attempt on a governance table and contends on a hot config row |
| Use `setWorkflow(false)` on the breaker write | `erp_system` is audited, and the history of breaker trips is exactly what the flag exists for |
| Add a write method "for L7" | `fetch()` is read-only **by construction**, which is why `read_only` is not consulted. The first method that can mutate an ERP must check `system.active && !system.readOnly` before dialling and must log its refusal. That sentence is the design's only defence against it being forgotten |
| Use `setQueryParameter()` for `query_template` | It re-encodes an already-encoded OData filter such as `$filter=Customer eq '0001000123'`, silently corrupting the query |

---

# 6. The Script Include bridge

`module-guide`: `ScriptInclude.script` is **string-only**; the documented pattern is a thin
`Class.create()` wrapper calling `require('./dist/modules/...')`.

```
src/server/connector/*.ts              ← modules; import Glide from '@servicenow/glide'
src/server/script-includes/erp-connector.js  ← Class.create wrapper; imports NOTHING
src/fluent/script-includes/erp-connector.now.ts
```

```ts
ScriptInclude({
  $id: Now.ID['ErpConnector'],
  name: 'ErpConnector',
  script: Now.include('../../server/script-includes/erp-connector.js'),
  accessibleFrom: 'package_private',   // D4: no cross-scope consumer exists
  clientCallable: false,               // the SPA goes through the L4 REST API, never GlideAjax
  description: 'Read-only ERP REST connector: retry, backoff, circuit breaker, telemetry.',
})
```

Per `script-include-guide`: the wrapper uses `Class.create`, must **not** import Glide APIs, and
its `type`, class name and Fluent `name` must match exactly. The modules **must** import Glide
from `@servicenow/glide`.

`accessibleFrom: 'package_private'` is deliberate. The sibling used `public`. D4 removed the only
reason for `public`, and `table-api` warns that `package_private` can make a record unselectable
in some platform features — verified irrelevant here, since no Business Rule or Flow references
`ErpConnector` by name; only L3 and L6 modules call it, in-scope.

---

# 7. Build order

| # | Step | Depends on | Verify |
|---|---|---|---|
| **L2-1** | Copy the 12 runtime modules verbatim into `src/server/connector/`. **Do not edit yet.** | L1 | `npm run build` clean |
| **L2-2** | Swap the four table constants (§2.1) and `object` → `logical_object` in `config-loader` + `call-log` | L2-1 | build clean |
| **L2-3** | `call_log` table: port the sibling's, add `not_configured` status choice, add `object_map` + `mapping_verified` columns, `logical_object` choices = the 16 | L1-2 | `ws_access=true` on the table |
| **L2-4** | `call_log` ACLs — read `viewer`, **create `viewer`**, no write ACL, delete `admin` | L2-3 | T2-14 |
| **L2-5** | §4.1 — `loadMap()` reads `field_map`; `ObjectMapConfig` gains its six fields | L2-2 | T2-1 |
| **L2-6** | §4.2 — `not_configured` status, the four pre-flight branches, **and the `NOT IN` breaker exclusion** | L2-5 | T2-2, **T2-13** |
| **L2-7** | §4.3 — `resolvedMapping` on the result; `call_log.object_map` written | L2-6 | T2-11 |
| **L2-8** | §4.4 — port `field-mapper.ts`, contract-driven, `transform` applied | L2-5 | T2-12 |
| **L2-9** | Script Include bridge (§6) | L2-8 | T2-4 |
| **L2-10** | Port the 21 test drivers. **`frequency: 'on_demand'`, `active: false` in source** | L2-9 | T2-17 |
| **L2-11** | Fixtures: System A (`postman-echo.com`, basic auth), System B (`postman-echo.com`, `generic_odata`, different pagination/date/root), System C (`erp-invalid.invalid`, deliberately broken) | L2-3 | present, `installMethod: 'demo'` |
| **L2-12** | The greps: `getBody` count == 1; `=== 'true'` == 0; `x_335329_erpcrm` == 0 | L2-8 | T2-3, T2-15, I4 |
| **L2-13** | **Run the 21 drivers**, arm one cycle, disarm | L2-10 | T2-18 |
| **L2-14** | **The L2 gate** (§8) | L2-13 | T2-19, T2-20 |

**On `installMethod: 'demo'` fixtures**, and this cost the sibling a green run that turned into
nine failures thirteen minutes later: a redeploy **does** restore every field except `active` from
source. Repointing a fixture by Table API `PATCH` survives exactly until the next deploy. Any
fixture change is made **in source**, then rebuilt and reinstalled.

---

# 8. The L2 gate

Spec §4.2: *"One successful live call **and** one forced-failure call, both logged, breaker
demonstrably opening."*

Both halves are meetable now against `postman-echo.com` — this gate does **not** need OD3.

1. **Success:** `fetch(SystemA, 'invoice')` → `call_log` row `status=success`, real `http_code`,
   real `duration_ms`, `rows_returned` populated. Query pasted.
2. **Forced failure + breaker:** read `erp_system.circuit_open_until` on System C (**expect
   empty**). Drive 6 consecutive non-success attempts. Re-read (**expect a datetime ≈ now + 2 min**).
   **Both reads pasted.** An empty field after the threshold fails the gate — the sibling's most
   expensive investigation.
3. **The breaker CLOSE path**, which the sibling initially missed: after cooldown, one successful
   probe clears the field. Third read pasted.

**Do not read the tables to judge whether a driver passed.** The sibling's post-mortem is
explicit: `runDriverB()` ends with an unconditional `clearBreaker()`, so table state after a run
is teardown state, not evidence. **The evidence is the drivers' own `gs.info` output:**

```
npx now-sdk query syslog_app_scope -a dev -q "messageLIKE[HRERP-L2-^ORDERBYDESCsys_created_on" -f sys_created_on,message --limit 200
```

Every driver line is `PASS <id> | ... | observed: ...` or `FAIL ...`.

---

# 9. Test plan

T2-1 … T2-20 are this layer's own. The **21 ported cases keep their sibling identifiers**
(T15–T33 → `HRERP-L2-T15…T33`) so a deleted case is visible as a gap in a numbered sequence.

| ID | Test | Precondition | Steps | Expected | Validates |
|---|---|---|---|---|---|
| **T2-1** | `loadMap` returns field rows | L2-5 | map `stock_item` with 5 `field_map` rows; call `loadMap` | `fields.length == 5`, each with `logicalField`/`sourceField`/`transform`/`zeroIsMeaningful` | L2-1 AC1 |
| **T2-2** | Four `not_configured` branches distinguishable | L2-6 | drive each of §4.2's four rows | four `call_log` rows, `status=not_configured`, four distinct `errorCode`s. **None is `failure`** | L2-2 AC3, AC4 |
| **T2-3** | No payload in telemetry | L2-12 | force `RESPONSE_UNPARSEABLE`; read `call_log.error` | no fragment of the body. `grep -c getBody src/server/` == **1** | I1, I3 |
| **T2-4** | Script Include deployed and current | L2-9 | `now-sdk query sys_script_include -a dev -q "name=ErpConnector^sys_scope.scope=x_335329_sn_hr_erp" -f name,active`, then read `sys_module.content` | active; **content matches source.** `sys_updated_on` is **not** accepted — it does not move on deploy | L2-1 AC3 |
| **T2-5** | All 21 ported cases pass | L2-13 | run the drivers; read `syslog_app_scope` | **21 PASS.** A count below 21 fails; a case deleted to make it green fails harder | L2-1 AC2 |
| **T2-6** | Status code beats transport message | L2-13 | point a map at `/status/404` | classified `HTTP_404`, **non-retryable**, exactly one attempt row | I10 |
| **T2-7** | 3xx not followed | L2-13 | point a map at an endpoint that 302s | non-retryable failure; **zero requests reach the redirect target**; no `Authorization` leaves the configured host | L2-3 AC3 |
| **T2-8** | Variable substitution disabled | L2-13 | `query_template` containing a literal `${x}` | outbound URL contains `${x}` unaltered | L2-3 AC4 |
| **T2-9** | MID by name | L2-13 | structural review of the branch + a test passing a sys_id | sys_id shown to silently not route; the `getDisplayValue` path demonstrated. **Recorded REVIEWED, not PASS** — this instance has zero `ecc_agent` records | L2-3 AC5 |
| **T2-10** | Both `execute()` outcomes | L2-13 | one throwing case, one `haveError()` case | both → same classified failure + a `call_log` row | L2-3 AC6 |
| **T2-11** | Resolution logged per call | L2-7 | successful fetch | `call_log.object_map` populated; `resolvedMapping.fieldCount` matches the row count; `mappingSource` and `mappingVerified` present | L2-2 AC1, AC6 |
| **T2-12** | Mapper drops unknown, keeps partial | L2-8 | response with 3 mapped + 4 unmapped source fields, one mapped field absent | 3 present, 4 ignored silently, absent field **empty not zero**; the row is still produced | L2-2 AC5 |
| **T2-13** | **`not_configured` does not trip the breaker** | L2-6 | 8 consecutive `MAP_MISSING` calls against a **healthy** system; read `circuit_open_until` before and after | **empty both times.** A tripped breaker here fails the story and would take 13 other objects down with it | §4.2 — this test exists for one line |
| **T2-14** **NON-ADMIN** | Viewer can insert telemetry | L2-4 | as `hrerp_viewer_only`, trigger a call | a `call_log` row exists. Zero rows means create is admin-only and telemetry is invisible to the users who generate it | §5.5 of L0 |
| **T2-15** | No cross-scope reference | L2-12 | `grep -rn "x_335329_erpcrm" src/` | **zero hits** | L2-1 AC5, D4 |
| **T2-16** | No vendor literal in transport | L2-12 | grep `rest-client.ts` for hostnames, vendor names, paths | zero. A vendor field name here is a design failure, as a hardcoded URL would be | I5 |
| **T2-17** | Drivers ship disarmed | L2-10 | `now-sdk query sysauto_script -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f name,active,run_type` | every driver `active=false`; `run_type = on_demand`. Checked **after the final deploy**, not before | L2-3 AC7, §9 |
| **T2-18** | Driver output is the evidence | L2-13 | the `syslog_app_scope` query of §8 | PASS/FAIL lines present and legible. **Table state is not accepted as evidence** | §8 |
| **T2-19** | **GATE — successful live call** | L2-14 | §8 step 1 | `call_log` row `status=success`, real `http_code`, real `duration_ms`. Query pasted | L2-3 AC1, spec §4.2 |
| **T2-20** | **GATE — forced failure, breaker opens and closes** | L2-14 | §8 steps 2–3 | three `circuit_open_until` reads pasted: empty → future datetime → empty | L2-3 AC2, spec §4.2 |

---

# 10. Decision log — L2

### L2-D1 — `not_configured` becomes a first-class `CallStatus` and `call_log` choice
**Chosen:** §4.2. The sibling's `MAP_INACTIVE` → `failure` is split into four
configuration-shaped outcomes.
**Rejected — keep it a `failure` and let L4 disambiguate by reading `object_map`.** L4 would have
to re-derive at render time what the connector already knew at call time, in a second query, and
the two could disagree. §7 makes this distinction the product; the layer that discovers it should
record it.
**Rejected — a separate `config_error` table.** A fifth choice on an existing indexed column does
the same job.
**Binds:** `recordFailure()` excludes `not_configured` as well as `circuit_open` (T2-13).

### L2-D2 — `origin` is only `'object_map'` or `'none'`; there is no call-time template fallback
**Chosen:** §4.3. Templates are expanded into rows by an explicit action (L1 §5.3); the connector
never sees a template.
**Rejected — resolve `mapping_template` at call time when `field_map` is empty.** It is the
"silent fallback" story L2-2 AC2 forbids, and it makes a figure's provenance a runtime race
between an admin's edits and a seeded guess.
**Binds:** an active map with no rows is `MAP_UNMAPPED`, never zero rows.

### L2-D3 — `field_map` is read per call rather than denormalised
**Chosen:** §4.1. Follows L1-D3.
**Rejected — cache the resolved mapping in a `sys_cache` / property.** A cached mapping is a
mapping that can be stale, and §9 records what a cached empty ERP response cost:
`cache_empty_query_results` would have reported that a customer owed nothing.
**Cost accepted:** one extra bounded query per (system × object).

### L2-D4 — `accessibleFrom: 'package_private'` on `ErpConnector`
**Chosen:** §6. **Rejected — `public`, as the sibling ships.** D4 removed the only cross-scope
consumer. `public` on a class that dials external systems with stored credentials is an
unnecessary surface.

### L2-D5 — No remote table is declared anywhere in this app
**Chosen:** D2 stages instead of querying live, so `sys_script_vtable` never exists.
**Consequence, recorded because it is a hazard that has now been removed:** §9's
`cache_empty_query_results` trap — which *"alone would have cached an ERP outage's zero rows and
reported that a customer owed nothing"* — **cannot occur in this app.** If any future layer
introduces a remote table, that trap returns and `cache_empty_query_results: false` /
`cache_ttl: 0` become mandatory again.

### L2-D6 — The port is byte-for-byte except §4; a diff is a defect
**Chosen:** §1. **Rejected — "improve it while we're in there."** 21/21 passing, zero defects
found, every constant carrying its derivation. The most likely way to break this connector is to
tidy it.

---

# 11. Risks and flags

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R2-1 | The breaker exclusion is written `!= 'circuit_open'` (the sibling's form) and `not_configured` slips through | An unmapped object trips the breaker on a healthy ERP and takes 13 other objects offline. **Silent** | T2-13 exists solely for this. It is the highest-value single test at L2 |
| R2-2 | A ported test is quietly dropped as "not applicable here" | The gate is claimed on a weakened suite — the sibling's recorded T32b mistake, repeated | The 21 keep their original identifiers; a gap in the sequence is visible |
| R2-3 | `MAX_TOTAL_CALL_MS` raised for L3 pagination | The C9 budget guard stops bounding worst-case wall clock; a busy-wait sleep loop scales with it | L3 §5 composes bounded calls instead. `constants.ts` is off-limits |
| R2-4 | Fixture repointed by Table API `PATCH` | Survives until the next deploy, then reverts | Every fixture change is a source change |
| R2-5 | `zeroIsMeaningful` read with `=== 'true'` | Zero silently becomes meaningful (or not) on the wrong fields — and at L6 that is a salary certificate reading `0` | I4's grep; `isTrue()` is the only Boolean reader |
| R2-6 | OD3 unresolved | Every "live" test runs against `postman-echo.com` | Stated, not hidden. The L2 gate genuinely does not need a real ERP — only L1-b does |

**Cross-scope:** none. **Global-scope records:** none. The connector's only external reach is
outbound HTTP to hosts named in `erp_system.base_url`.
