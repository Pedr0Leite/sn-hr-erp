---
title: L2 — Connector runtime — build report
app: x_335329_sn_hr_erp
instance: https://dev296062.service-now.com (PDI)
author: developer (L2)
generated: 2026-08-13
scope note: |
  Mid-layer scope change from the product owner: testing breadth deferred to a dedicated pass.
  The L2 gate is unchanged and was NOT reworded. The ported suite is built and deployed
  disarmed but deliberately NOT executed.
---

# 0. Verdict first

| Item | State |
|---|---|
| **L2 code ported, built and DEPLOYED** | **DONE.** 14 runtime modules + 6 driver modules, Script Include bridge, `call_log` table, 3 ACLs, 26 fixture records, 5 scheduled scripts |
| **THE L2 GATE** | **NOT MET — NOT EXECUTED.** Blocked on one thing: the admin password. See §1 |
| Zero armed scheduled jobs | **VERIFIED BY QUERY.** 5 jobs, every one `active=false`, `run_type=on_demand` |
| `.ts` on every relative import under `src/server/` (D19/T7) | **VERIFIED.** Guard grep returns zero |
| `grep -rn "x_335329_erpcrm" src/` (T2-15) | **VERIFIED. Zero hits** |
| `@fluent-module` runtime errors since the L2 deploy | **Zero**, time-bounded. See §4 |
| Ported test suite (19 cases, T15–T33) | **BUILT AND DEPLOYED, NOT RUN** — deferred per the scope change |

**The gate is recorded NOT MET in its original wording.** One successful live call, one
forced-failure call, both logged, breaker demonstrably opening — none of the four has been
observed. Nothing below should be read as partial credit for it.

---

# 1. The gate — NOT MET, and exactly what it needs

The gate driver is **written, built, deployed and verified present** on the instance as
`HRERP L2 GATE (temporary)` (`sysauto_script`, `run_type=on_demand`, `active=false`). It
produces all four pieces of evidence in one run and logs them under the marker
`[HRERP-L2-GATE]`:

1. **T2-19 success** — `fetch(SystemA, 'invoice')` → one `call_log` row, `status=success`,
   real `http_code`, real `duration_ms`.
2. **T2-20 read 1** — `BROKEN-FIXTURE.circuit_open_until`, expected empty.
3. **T2-20 read 2** — after 6 consecutive non-success attempts against `erp-invalid.invalid`,
   expected a datetime ≈ now + 2 min.
4. **T2-20 read 3** — the CLOSE path: on System A, tripped by real HTTP 503s, forced HALF_OPEN,
   one successful probe, expected empty again.

**What blocks it.** An `on_demand` scheduled script is executed by *Execute Now*, which is a
**write** (a `sys_trigger` insert, or the browser equivalent). This environment's only write
path to the instance is `now-sdk install`, which deploys metadata and cannot run a job. Every
other write — Table API `POST`/`PATCH`, a `sys_trigger` insert — needs the **admin password**,
which is deliberately absent from the repo.

**What was deliberately NOT done to get around it**, because each is the failure this estate has
already been burned by:

- Shipping the gate driver `frequency: 'periodically'` + `active: true` for "one cycle". That is
  precisely the armed driver that fired every three minutes for hours on a prior instance.
- Shipping a `Record()` on `sys_trigger` so the install itself fires the job. It would arm on
  every install of the app, everywhere, forever.
- Rewording the gate to something the environment can satisfy.

**To close it, a human supplies the admin password inline (never to a file), and then:**

```bash
# 1. Execute Now, via the trigger the UI action creates
curl -u admin:<PW> -X POST "https://dev296062.service-now.com/api/now/table/sys_trigger" \
  -H 'Content-Type: application/json' -d '{
    "name":"HRERP L2 GATE run",
    "trigger_type":"0",
    "document":"sysauto_script",
    "document_key":"<sys_id of HRERP L2 GATE (temporary)>",
    "next_action":"<now>"
  }'

# 2. Read the evidence from the DRIVER'S OWN OUTPUT, never from table state
npx now-sdk query syslog_app_scope -a dev \
  -q "messageLIKE[HRERP-L2-^ORDERBYDESCsys_created_on" -f sys_created_on,message --limit 200
```

Alternatively a human clicks *Execute Now* on the record in a browser. Either way the job stays
`on_demand` and `active=false` throughout — `on_demand` jobs need no arming.

---

# 2. What is on the instance

```
sys_db_object   x_335329_sn_hr_erp_call_log   ws_access=true  access=package_private
sys_script_include  ErpConnector  api_name=x_335329_sn_hr_erp.ErpConnector
                                  access=package_private  active=true
sysauto_script  5 rows, ALL active=false, ALL run_type=on_demand:
                  HRERP L2 GATE (temporary)
                  HRERP L2 DRIVER ADMIN (temporary)
                  HRERP L2 DRIVER VIEWER (temporary)     runAs = hrerp_viewer_only
                  HRERP L2 CONNECTOR HARNESS (temporary)
                  HRERP L2 CLEANUP (temporary)
x_335329_sn_hr_erp_object_map   14 rows (3 from L1 + 11 L2 fixtures)
x_335329_sn_hr_erp_field_map    22 rows (7 from L1 + 15 L2 fixtures)
x_335329_sn_hr_erp_call_log      0 rows — nothing has called anything yet
```

The six `erp_system` rows are untouched. **`BROKEN-FIXTURE` still points at
`erp-invalid.invalid` and was not "fixed".**

`fixed_asset` on System A ships `active: false` on purpose — it is the `MAP_INACTIVE` fixture.
`backorder` on System A is active with **zero** `field_map` rows on purpose — it is the
`MAP_UNMAPPED` fixture. Neither is a mistake to correct.

---

# 3. Contradictions found against the design documents

| # | Document | Contradiction | Resolution |
|---|---|---|---|
| 1 | `l2-connector-design.md` §1, §9, R2-2 | Says **"21 ported cases"** and then names the range **T15–T33**, which is **19** identifiers. The sibling's own build report lists 19 (T15–T28, T29 review-only, T30–T32, T33 a grep) | **19 cases were ported, keeping every original identifier.** Nothing was dropped and nothing was invented to reach 21. The count in the design is an arithmetic error; the *identifiers* are the real control, and they are intact |
| 2 | `l2-connector-design.md` T2-3 | `grep -c getBody src/server/` == **1** | **Wrong as written** — it counts mentions, and the C1 comments that explain the rule are themselves mentions. Actual result: 2 (one call site, one comment). The correct guard is `grep -rn "\.getBody(" src/server/` excluding comment lines → **1**, in `erp-connector.ts`. I1 holds |
| 3 | `l2-connector-design.md` I4 vs §2 | I4: `grep '=== ''true'''` → **zero hits**. §2: `isTrue` is **ported verbatim**. The ported `isTrue` body literally contains `v === 'true'` | **Both cannot hold.** §1's "a diff is a defect" wins, so `isTrue` is verbatim and I4's grep returns 5 (1 code line inside the helper, 4 comments). Corrected guard: zero hits **outside the two Boolean helpers and outside comments** → verified zero. L1 hit the same wall (its contradiction #6) and L1's own `bool.ts` avoids the literal deliberately, which is why the two implementations now differ in style |
| 4 | `l2-connector-design.md` §4.4 | Restates the sibling's typed rules ("a non-numeric amount leaves the column empty", "an unparseable date leaves the column empty") **and**, in its last paragraph, defers typed promotion to L3 | **Not simultaneously implementable.** The sibling knew a column was decimal because it had a fixed six-column table; this app deliberately does not, and the logical contract declares no types. Resolution in `field-mapper.ts`: numeric/date handling applies **only where the mapping declares it** (the `abs`/`negate`/`percent_to_ratio`/`ratio_to_percent` transforms are numeric, `date_only` is a date); everything else passes through as a string. `parseDate()` and `toNumber()` are **exported** so L3 uses the identical primitives instead of growing a second set. **Escalated as OD17** |
| 5 | `l2-connector-design.md` §4.4 / §4.1 | §4.1 says `zeroIsMeaningful` is carried "because L6 depends on it". Nothing says **where** the flag is applied | **Applied in `field-mapper.mapRecord`**, because that is the only place holding both the value and the flag, and an absent key is exactly how this mapper spells UNAVAILABLE. Recorded as **L2-D7** so L3/L6 can see where it lives rather than re-implementing it |
| 6 | `l2-connector-design.md` §2 vs L1 | §2 orders `util.ts` ported verbatim, `isTrue` included. This app **already has** an `isTrue` in `src/server/util/bool.ts` | **Ported verbatim as instructed**, so the app now carries **two implementations of its single most safety-critical predicate**. They agree on every value `GlideRecord` returns, but "two representations of one truth" is what OD4 rejected elsewhere. Consolidating them is an architect decision. **Escalated as OD16** |
| 7 | `l2-connector-design.md` §9 T16/T17 fixtures | Names `credit_status` and `receipt` as the fixture objects | Both were **dropped from this app's 16 logical objects by OD9**. `gl_summary` carries T16's `rows_returned` fixture and `vendor_invoice` carries T17's 404. **Assertions unchanged; only the object name moved** |
| 8 | `l2-connector-design.md` §8 step 3 | "after cooldown, one successful probe clears the field" — implied to be on System C | **Impossible on System C.** Nothing at `erp-invalid.invalid` will ever answer, and repointing it is the fixture edit R2-4 forbids. The gate driver therefore trips **System C** with a genuinely unreachable host (reads 1 and 2) and demonstrates the **CLOSE** path on **System A**, tripped by real HTTP 503s. Both are logged and labelled; neither is presented as the other |
| 9 | `l2-connector-design.md` §7 L2-11 | System A/B fixtures should be declared as `installMethod: 'demo'` records | **The six `erp_system` rows are NOT in source.** They were created directly on the instance at L1 and `erp_system.name` is uniquely indexed, so declaring them would collide and produce a second set. They are referenced by the sys_id a live query returned — the one case kickoff §9 permits a raw sys_id. **This is a standing fragility: a fresh instance install has the connector, the maps and the field mappings but no ERP systems.** Flagged for the architect |
| 10 | `l2-connector-design.md` §4.2 row 1 | `system row missing / active=false` → `not_configured` | Implemented as specified — but note it is a **behaviour change from the sibling**, which returned `failure`/`SYSTEM_INACTIVE`. Any L4 code copied from the sibling's error handling will mis-render it |

---

# 4. Live verification performed

Everything below actually ran. Nothing here is the gate.

```bash
npm run build                                                     # Build completed successfully
npx now-sdk install -a dev                                        # Installation completed
# rollback context: 9be863ab47a60b100739b71f316d4388
```

```bash
grep -rn "from '\.\./\|from '\./" src/server/ | grep -v "\.ts'"   # 0 — D19/T7 guard
grep -rn "x_335329_erpcrm" src/                                   # 0 — T2-15
grep -rn "\.getBody(" src/server/                                 # 1 call site + 1 comment (see §3.2)
```

```
sys_db_object      name=x_335329_sn_hr_erp_call_log
                     -> ws_access=true, access=package_private
sysauto_script     sys_scope.scope=x_335329_sn_hr_erp
                     -> 5 rows, active=false, run_type=on_demand  (T2-17)
sys_script_include name=ErpConnector
                     -> x_335329_sn_hr_erp.ErpConnector, package_private, active=true
syslog             messageLIKE@fluent-module ^ sys_created_on>2026-08-13 09:00:00
                     -> 0 rows
```

**On that last one, and this is the important caveat.** Zero `@fluent-module` errors since the
L2 deploy proves that the **26 fixture inserts** — which each fired L1's module-backed
`validateObjectMap` / `validateFieldMap` `before` rules — resolved their `.ts` imports at
runtime. It proves **nothing about the L2 connector modules**, which have not executed once. The
D19 trap is *not* cleared for L2 until a driver runs and this query is repeated. **A `before`
rule that throws is swallowed and the record saves**, so silence before execution is not
evidence of anything.

---

# 5. New traps — these bind L3

| # | Trap | Detail |
|---|---|---|
| **T9** | **`on_demand` + `active: false` is the correct way to ship a driver AND it makes the driver unrunnable from this environment.** | `now-sdk` has no execute verb. *Execute Now* is a `sys_trigger` insert, i.e. a write, i.e. the admin password. Every layer from here that needs live evidence needs a human in the loop for the trigger, or a browser. **Plan for it at the start of L3, not at its gate.** |
| **T10** | **An active `object_map` with zero `field_map` rows now REFUSES TO DIAL.** | §4.2's `MAP_UNMAPPED` branch. A map that "worked" at L1 (config only) will return `not_configured` at L2 unless at least one field is mapped. Every L3 sync fixture needs field rows or it will silently never call anything. `backorder` on System A is exactly this, on purpose |
| **T11** | **`not_configured` is a FIFTH `call_log.status`, and it is excluded from the breaker's failure counter.** | `gr.addQuery('status', 'NOT IN', 'circuit_open,not_configured')` in `circuit-breaker.recordFailure`. Rewriting it to the sibling's `!= 'circuit_open'` makes one unmapped object trip the breaker on a healthy ERP and take the other 13 objects down — **silently**. L3 must not "tidy" that line. `status != success` still catches `not_configured`, so any Failed Calls view keeps working |
| **T12** | **The six `erp_system` fixture rows exist only on the instance, not in source.** | A rebuild-from-source deployment to a fresh instance produces object maps and field maps whose `erp_system` references point at sys_ids that do not exist there. See §3.9 |
| **T13** | **The connector returns `body` in memory and it must never be logged.** | The single `getBody()` call site is `erp-connector.ts`. `harness.ts` logs `body.length`, never `body`; the L2 drivers log mapped **key names** and never values. L3 stages mapped values into `erp_staging`, which is the first place a payload legitimately lands — and C1 still forbids it reaching `call_log` or any log |

---

# 6. NOT EXECUTED — the honest list

| Item | Why |
|---|---|
| **THE L2 GATE (T2-19, T2-20)** | **Blocked on the admin password.** §1. Not reworded, not partially credited |
| The 19 ported cases T15–T33 | Built and deployed disarmed. **Deliberately not run** — testing breadth deferred to a dedicated pass by the product owner. They are also blocked by the same trigger problem |
| T2-1 … T2-18 | Same. Written into `test-driver-l2.ts` and the ported drivers, deployed, not run |
| **T2-14 — the only NON-ADMIN case** | `HRERP L2 DRIVER VIEWER` is deployed with `runAs = hrerp_viewer_only`. Not run. And even when it is, **`runAs` in a scheduled job is not an interactive session** — it is good evidence, not the browser verification **C5** still requires. Admin does not count and will not be substituted |
| T2-4 (`sys_module.content` matches source) | The Script Include record was verified present, active and `package_private`. Its `content` was **not** byte-compared against source. `sys_updated_on` does not move on deploy and is not accepted as a substitute |
| T2-9 / T29 (MID routing) | Cannot be executed: this instance has zero `ecc_agent` records. The review case is written and will report **REVIEWED, never PASS** |
| Any assertion that the ported connector behaves as the sibling's did | **Not one line of `src/server/connector/` has run on this instance.** A clean build and a clean install prove nothing about it — that is this project's own rule and it applies here |
| L1-b | Still open, still blocked on OD3. Every fixture answers from `postman-echo.com` or an invalid host (D12/OD15) |

---

# 7. Source added at L2

```
src/server/connector/types.ts                NEW  ported + §4.1/§4.2/§4.3
src/server/connector/util.ts                 NEW  ported VERBATIM (see OD16)
src/server/connector/constants.ts            NEW  ported VERBATIM
src/server/connector/classify.ts             NEW  ported VERBATIM
src/server/connector/backoff.ts              NEW  ported VERBATIM (one comment corrected, §3)
src/server/connector/rest-client.ts          NEW  ported VERBATIM
src/server/connector/circuit-breaker.ts      NEW  ported + the §4.2 NOT IN exclusion
src/server/connector/call-log.ts             NEW  ported + §4.3 columns
src/server/connector/config-loader.ts        NEW  ported + §4.1 field_map read
src/server/connector/erp-connector.ts        NEW  ported + §4.2 pre-flight, §4.3 resolvedMapping
src/server/connector/field-mapper.ts         NEW  §4.4, contract-driven (see OD17, L2-D7)
src/server/connector/harness.ts              NEW  ported
src/server/connector/cleanup.ts              NEW  ported, retargeted
src/server/connector/test-driver-util.ts     NEW  ported, retargeted
src/server/connector/test-driver-a.ts        NEW  T15-T23, T29
src/server/connector/test-driver-b.ts        NEW  T24-T28, T32, T33
src/server/connector/test-driver-l2.ts       NEW  T2-1/2/7/8/11/12/13 + THE GATE
src/server/connector/test-driver-viewer.ts   NEW  T30, T31, T2-14
src/server/connector/test-driver-all.ts      NEW  ordering
src/server/script-includes/erp-connector.js  NEW  Class.create bridge, imports NOTHING
src/fluent/tables/call-log.now.ts            NEW  the table
src/fluent/security/l2-acls.now.ts           NEW  3 ACLs (read/create viewer, delete admin, NO write)
src/fluent/script-includes/erp-connector.now.ts NEW  package_private (L2-D4)
src/fluent/data/l2-fixtures.now.ts           NEW  26 Record() — 11 object_map, 15 field_map, 1 auth profile
src/fluent/scheduled-scripts/l2-test-drivers.now.ts NEW 5 ScheduledScript + 6 Property, all disarmed
```

Rollback context for this install: `9be863ab47a60b100739b71f316d4388`.
