---
title: L1 — Control tower — erp_system, object_map, field_map, mapping_template — build report
app: x_335329_sn_hr_erp
instance: https://dev296062.service-now.com (PDI), auth alias `dev`
date: 2026-08-13
author: developer
authority: docs/change-manifest.md — human YES for L0–L6, 2026-08-12. This report covers L1 only. L2 was not started.
verdict: >
  GATE L1-a MET, with live evidence. GATE L1-b NOT MET — blocked on OD3, recorded open, not reworded.
  Three tests could not be executed from this session and are named in §9 rather than claimed.
  C5 (verification as a genuine non-admin) is STILL NOT MET: non-admin basic auth returns an
  instance-level 401 on this PDI regardless of password or role. No access decision in this report
  is evidenced by a non-admin session, and none is claimed to be.
---

# 0. Verdict first

| # | L1 gate item | Verdict |
|---|---|---|
| **L1-a** | A second ERP added as **pure data** — zero application files change | **MET.** `sys_metadata` delta since T₀ returns **0 rows**; scope total unchanged at 197. §8 |
| **L1-b** | A *genuinely different vendor API* is pure data | **NOT MET. Blocked on OD3.** Recorded open, deliberately not reworded. §8.3 |
| — | Four tables deploy with correct posture | **MET.** 4 tables, all `package_private`, all `ws_access=true`. §3.1 |
| — | 24 ACLs, deny rules in Shape A | **MET, verified as a full admin with a control field.** §7 |
| — | Config-validation rule, all four branches alive | **MET for behaviour** (4/4 abort, individually). **Message text not observable via the Table API** — §9.1 |
| — | Templates seeded, nothing ships verified | **MET.** 43 rows, 11/11 vendors covered, `verified=true` → **0 rows**. §6 |
| — | C5 non-admin verification | **NOT MET.** Instance-level 401. §9.2 |

**L1 is declared complete on L1-a only, and L1-b is recorded open in this same document**, which is
the condition §8 of the design places on that declaration.

---

# 1. What the previous session left, and what reconciling it found

The prior developer agent was stopped mid-write. `npm run build` passed, nothing was deployed.
Every file was read against `docs/l1-control-tower-design.md` before anything was extended.

**The two files flagged as "caught mid-sentence" — `field-map.now.ts` and `map-tmpl.now.ts` — are
in fact structurally complete and correct.** The break landed somewhere else: in `choices.ts`,
which both of them depend on.

## 1.1 The real defect: `LOGICAL_FIELD_CHOICES` had drifted from the contract

`src/server/contract/objects.ts` is the single source of truth (§2.4). `choices.ts` mirrors it by
hand. A three-way diff of the two found:

| Field | Contract | Choice list | Consequence |
|---|---|---|---|
| **`qty`** | `stock_item`, `backorder` | **MISSING** | **The single most-used field in the application was unmappable through the UI.** Tab 3's SKU count, low-stock alerts, reorder list and backorder tile all resolve through `qty`. An admin opening the Field Mappings related list would have found no `qty` option and no explanation |
| **`started_on`** | `machine_downtime` | **MISSING** | Tab 5's downtime list has no start time |
| `occurred_on` | *(no object)* | present | A selectable value the L1-8 business rule rejects on **every** object — an admin picks it, gets `Unknown logical field 'occurred_on' for object '<x>'.`, and has no way to know the value should never have been offered |

`qty` and `started_on` were added; `occurred_on` was removed. **Nothing had been deployed, so the
"add, never rename" rule was not engaged** — removing an undeployed choice value orphans nothing.
`occurred_on` is a *staging column* name from `l3-staging-design.md` §3.2's promotion table, not a
logical field name; §2.3 of the L1 design uses the staging-column vocabulary (`code`, `label`,
`occurred_on`) where `objects.ts` correctly uses logical-field names (`sku`, `name`, `promised_on`).
That is a vocabulary collision in the design document, not an error in either file — recorded in §11.

**All of this built clean and would have deployed clean.** It is exactly the failure class §9 warns
about: a clean build proves nothing.

## 1.2 The guard-rail that would have caught it, added

`scripts/check-contract.mjs` now asserts the choice lists mirror the contract **in both
directions** — a missing choice and a surplus choice both fail. It runs in ~200 ms and imports the
real modules, so no second copy of the list can drift.

```
$ node scripts/check-contract.mjs
contract OK: 16 objects, 14 staged
```

## 1.3 One undocumented deviation found in the inherited source, and kept

`field-map.now.ts` declares a `logical_object` column that **§4.2 of the design does not list**.
It is `readOnly`, denormalised from the parent by the L1-8 business rule, never admin-entered.

**Kept, because T1-12 needs it.** Story L1-3 AC6 fixes the rejection message as
`Unknown logical field '<name>' for object '<object>'.` — the rule must name the object, and with
~90 rows across 16 objects the child list view is unreadable without it. Verified live: a
`field_map` row inserted with `logical_field=qty` read back `logical_object=stock_item` with no
client supplying it (§5.4).

## 1.4 A decision the previous session made and did not record — now recorded as L1-D8

`choices.ts` carries a comment citing "R1-1 / L1-D8". **There is no L1-D8** in the design document;
`§10` ends at L1-D7. Risk R1-1 explicitly says *"decide at L1-7, not at test time, and record it"*.
The decision was made and the recording was the part that got cut. It is now written up in
`docs/decision-log.md` as **L1-D8**, and §11 of this report carries the reasoning.

---

# 2. Build order executed

| # | Step | Status |
|---|---|---|
| L1-1 | `src/server/contract/objects.ts` — 16 objects | **Inherited, verified.** 16 objects, 14 staged, no duplicate field, every object carries `erp_id` |
| L1-2 | `src/fluent/tables/choices.ts` | **RECONCILED** — §1.1 |
| L1-3 | `erp_system` table + unique index | **BUILT & DEPLOYED** |
| L1-4 | `erp_system` ACLs (4 table + 5 field-read) | **BUILT & DEPLOYED** |
| L1-5 | Config-validation Business Rule | **BUILT & DEPLOYED**, all four branches proven live |
| L1-6 | `object_map` table + unique index | **BUILT & DEPLOYED** |
| L1-7 | `field_map` table + unique index | **BUILT & DEPLOYED** |
| L1-8 | `before` BR validating `logical_field` | **BUILT & DEPLOYED** |
| L1-9 | `object_map` + `field_map` ACLs incl. 2 Shape A deny | **BUILT & DEPLOYED**, deny proven against a full admin |
| L1-10 | `mapping_template` table + unique index | **BUILT & DEPLOYED** |
| L1-11 | Seed template rows | **BUILT & DEPLOYED** — 43 rows, all `verified=false` |
| L1-12 | "Apply vendor defaults" UI Action | **BUILT & DEPLOYED.** Script Include bridge **deliberately not built** — §6.3. **Behaviour NOT executed** — §9.3 |
| L1-13 | Form annotations + `Unverified Mappings` module | **BUILT & DEPLOYED.** Display-BR rendering **not executed** — browser required, §9.4 |
| L1-14 | Gate demonstration L1-a | **EXECUTED. MET** — §8 |

---

# 3. What is on the instance

## 3.1 Tables

```
$ curl .../sys_db_object?sysparm_query=nameSTARTSWITHx_335329_sn_hr_erp
x_335329_sn_hr_erp_erp_system   ws_access=true  access=package_private
x_335329_sn_hr_erp_object_map   ws_access=true  access=package_private
x_335329_sn_hr_erp_field_map    ws_access=true  access=package_private
x_335329_sn_hr_erp_map_tmpl     ws_access=true  access=package_private
x_335329_sn_hr_erp_acltest      ws_access=true  access=public          <-- OD12, NOT OURS
```

**Governance condition C1 is satisfied on all four**, and the source was checked rather than
trusted: `erp-system.now.ts` already carried `accessibleFrom: 'package_private'` from the L0
session's C1 fix, and the other three carry it too. The instance confirms it — `package_private` is
what `sys_db_object.access` reads back, not the SDK default `public`.

`x_335329_sn_hr_erp_acltest` is the **L0-7 probe shell (OD12)**, unchanged and untouched. It is the
only `public` table in the prefix and it is not this app's. It still needs one browser deletion.

## 3.2 Everything else in scope

| Artefact | Count |
|---|---|
| `sys_security_acl` | **24** |
| `sys_script` (business rules) | 4 |
| `sys_ui_action` | 1 |
| `sys_app_module` | 4 |
| `sys_module` (JS modules) | 8 |
| `sysauto_script` (scheduled jobs) | **0 — nothing is armed** |
| `x_335329_sn_hr_erp_map_tmpl` rows | 43 |

**Zero scheduled jobs.** §9's named sin — a driver left firing — is not available to commit at L1
because L1 declares no job at all.

## 3.3 D16 — Global-scope side effects

```
sys_metadata  sys_scope=global^sys_created_on>javascript:gs.beginningOfToday()  ->  0 rows
```

**No new Global-scope record was created by anything in this session.** D16's four
`sys_embedded_help_role` rows date from L0 and are unchanged. There is no fifth row, and no L1
artefact produced a Global side effect — tables, ACLs, business rules, UI actions and modules all
landed in scope.

---

# 4. Live test results

Every command below ran against `https://dev296062.service-now.com` on 2026-08-13, as `admin`
unless marked otherwise, via `/api/now/table`.

## 4.1 `erp_system` — story L1-1

**T1-1 — `read_only` defaults to `true`.** POST with **no** `read_only` in the payload, then an
independent re-read:

```
POST  x_335329_sn_hr_erp_erp_system  {name, vendor, legal_entity, base_url, auth_type}   -> 201
GET   .../<sys_id>
  {'name':'ECHO-PRIMARY', 'read_only':'true', 'active':'true',
   'timeout_ms':'30000', 'max_retries':'2', 'backoff_ms':'500'}
```
**PASS.** All four dictionary defaults landed. A system is read-only unless someone deliberately
says otherwise.

**T1-2 — audit on `base_url`.** PATCH, then query `sys_audit`:

```
{'fieldname':'base_url',
 'oldvalue':'https://postman-echo.com',
 'newvalue':'https://postman-echo.com/v2',
 'sys_created_on':'2026-08-13 08:45:49'}
```
**PASS.** One row naming both values.

**T1-3 — vendor choice list.** `sys_choice` for `x_335329_sn_hr_erp_erp_system.vendor` → **11
choices**: `dynamics_365_fo, generic_odata, generic_rest, infor, netsuite, oracle_ebs,
oracle_fusion, sap_ecc, sap_s4, unit4, workday`. **PASS** — all eleven of spec §5.1.

**T1-4 — two systems, one vendor, different `legal_entity`.** Both `sap_s4`:
`Acme DE GmbH` → 201, `Acme FR SAS` → 201. **PASS.**

## 4.2 Config validation — story L1-2. **This is where the session's biggest find happened.**

**T1-7 — no outbound call at save time.** `base_url = https://erp-invalid.invalid` → **HTTP 201,
saved.** **PASS**, and it matters: L2 and L3 need this fixture to prove their failed states. It is
on the instance now as `BROKEN-FIXTURE`.

**T1-8 — a valid row saves silently.** `oauth2`, no MID, no basic profile → 201. **PASS.**

**T1-5 / T1-6 — all four branches, individually.** Four separate inserts, one contradiction each:

| Branch | Payload | Result |
|---|---|---|
| 1 — OAuth2 + MID | `auth_type=oauth2, use_mid_server=true` | **HTTP 403 — aborted** |
| 2 — basic + OAuth profile | `auth_type=basic, auth_profile_oauth=<id>` | **HTTP 403 — aborted** |
| 3 — oauth2 + basic profile | `auth_type=oauth2, auth_profile_basic=<id>` | **HTTP 403 — aborted** |
| 4 — **the Boolean branch** | `use_mid_server=true, mid_server=''` | **HTTP 403 — aborted** |

```
detail: "Operation against file 'x_335329_sn_hr_erp_erp_system' was aborted by
         Business Rule 'Validate ERP system configuration^...'"
```

**The Boolean branch is provably alive, and the proof is a pair, not a single case:**

| `use_mid_server` | `mid_server` | `auth_type` | Result |
|---|---|---|---|
| `true` | empty | basic | **aborted** (branch 4) |
| *(absent → false)* | empty | basic | **saved** (T1-1) |

The only difference between those two rows is the Boolean. If `isTrue()` were the sibling's
`getValue(...) === 'true'`, the first row would have saved. It did not. **`src/server/util/bool.ts`
reads `'1'`/`'0'` correctly.**

Branches 1 and 3 also demonstrably do not misfire: T1-8's `oauth2` row saved, so neither fires on
`oauth2` alone. Branches 2 and 4 do not misfire either: T1-1's `basic` row saved.

**T1-6's grep, as the design writes it, produces four FALSE POSITIVES against this codebase:**

```
$ grep -rn "=== 'true'\|!== 'true'" src/     ->  4 hits
src/server/business-rules/validate-erp-system.ts:42   (comment)
src/server/util/bool.ts:7, 11, 13                     (comments)
```

All four are **prose describing the trap**, in the file that exists to prevent it. `bool.ts`
deliberately implements the check as `TRUTHY.indexOf(...)` rather than `=== 'true'` specifically so
it does not trip its own guard-rail. The tester should run:

```
grep -rn "=== 'true'\|!== 'true'" src/ --include=*.ts | grep -v "^\s*[^:]*:[0-9]*:\s*//"
```
which returns **zero**. Recorded so a green test is not turned red by a comment.

## 4.3 `object_map` — story L1-3

**T1-9 — duplicate refused.** Second `(ECHO-PRIMARY, stock_item)` → **HTTP 403, aborted by
`Object mapping uniqueness message`.** **PASS on behaviour.** The verbatim message naming both
values is not observable through the Table API — §9.1.

**T1-10 — `{external_id}` round-trips.**
```
sent: "$filter=Customer eq '{external_id}'"
read: "$filter=Customer eq '{external_id}'"
PASS — byte-identical, no substitution
```

**T1-17 — no silent auto-apply on insert.** POST an `object_map`, then query its children:
```
field_map children: 0
object_map state:  {'mapping_source':'', 'mapping_verified':'false', 'active':'true'}
```
**PASS.** Nothing populated it. The apply path is a UI Action a human must press.

**T1-13 — active map with zero rows.** `object_map` for `backorder`, `active=true`, no children →
**HTTP 201, saved.** **PASS on the save half** (L1-D6: surface, do not refuse). The surfacing half
is a display-BR message and needs a browser — §9.4.

## 4.4 `field_map` — story L1-3 AC6 / T1-12

**Unknown logical field, through the Table API:**
```
POST field_map {object_map: <om>, logical_field: 'nonsense', source_field: 'X'}   -> HTTP 403
      aborted by Business Rule 'Validate field mapping against the logic...'
children after: 0
```
**PASS.** The choice list alone could never satisfy this — the Table API does not evaluate one.

**Valid insert, and the denormalisation:**
```
POST field_map {object_map: <om>, logical_field: 'qty', source_field: 'QuantityOnHand'}  -> 201
GET  -> {'logical_field':'qty', 'logical_object':'stock_item',
         'source_field':'QuantityOnHand', 'transform':'none', 'zero_is_meaningful':'false'}
```
`logical_object` was **not supplied by the client** and came back correct. `zero_is_meaningful`
defaults to `false` — the safe direction for L6 (§4.4).

## 4.5 Templates — story L1-4

**T1-15 — every vendor has ≥1 template.**
```
total rows: 43
  dynamics_365_fo 6   generic_odata 1   generic_rest 1   infor 1   netsuite 1
  oracle_ebs 6        oracle_fusion 6   sap_ecc 8        sap_s4 8  unit4 4   workday 1
```
**PASS — 11 of 11 vendors.** Gaps declared in §6.2.

**T1-16 — nothing ships verified.**
```
x_335329_sn_hr_erp_map_tmpl?sysparm_query=verified=true   ->  0 rows
distinct values of `verified` across all 43 rows: {'false'}
```
**PASS.**

---

# 5. The deny-write ACLs — T1-24, run as a full admin, with a control field

This is the test that D17 says most tests get wrong. **A Shape A refusal is silent: HTTP 200,
normal body, field simply unchanged.** So the assertion is on a re-read, and a control field moves
in the same request so the result is interpretable.

```
BEFORE : {'mapping_source':'', 'mapping_verified':'false', 'date_format':'yyyy-MM-dd'}

PATCH  (one request, as FULL ADMIN):
         date_format      = 'CONTROL-MOVED-yyyyMMdd'   <- control, unprotected
         mapping_source   = 'template'                 <- Shape A deny
         mapping_verified = 'true'                     <- Shape A deny
         -> HTTP 200        (proves nothing on its own — D17)

AFTER  : {'mapping_source':'', 'mapping_verified':'false', 'date_format':'CONTROL-MOVED-yyyyMMdd'}

  control field moved        : True   <- the request WAS applied
  mapping_source   unchanged : True
  mapping_verified unchanged : True
```

**PASS. A full admin cannot write either provenance column.** The control field moving in the same
request is what makes this interpretable: the ACL denied those two fields specifically, not the
write as a whole. Both rules read back from `sys_security_acl` as
`decision_type=deny, admin_overrides=false, script='answer = false;', active=true`.

---

# 6. Design decisions taken during the build

## 6.1 Seed payloads are pre-serialised string literals, not `JSON.stringify(...)`

§5.1 permits a literal `JSON.stringify(...)` as the known-working exception to the
`Symbol(CallExpressionShape)` trap. **A plain string literal was used instead** — it removes the
call expression altogether rather than relying on an exception to a rule about call expressions.
`src/fluent/tables/map-tmpl-seeds.now.ts` contains no `.join()`, no `.map()`, no template literal
and no function call in any `data` value.

Verified live — the deployed `field_map` column holds real JSON, not a `Symbol`:
```
'{"amount":{"source":"AmountInCompanyCodeCurrency","transform":"none"}, ... }'
```

The file is generated once and checked in as literals; the generator is not part of the build.

## 6.2 Template coverage, and the gaps declared rather than fabricated

| Vendor | Objects | Basis |
|---|---|---|
| `sap_s4` | 8 — finance 4, procurement 2, inventory 2 | Public S/4HANA OData API naming (`API_*`, UpperCamelCase, `d.results`) |
| `sap_ecc` | 8 — same objects | Classic ECC field abbreviations (`DMBTR`, `MENGE`, `MATNR`, `WERKS`) |
| `oracle_fusion` | 6 — finance 4, procurement 2 | Fusion Financials REST (`fscmRestApi`, `items`) |
| `oracle_ebs` | 6 — same | EBS interface-table `UPPER_SNAKE_CASE` |
| `dynamics_365_fo` | 6 — finance 4, inventory 2 | D365 F&O data entities (`/data/<Entity>`, OData `value`) |
| `unit4` | 4 — finance | Unit4 REST naming |
| `netsuite`, `infor`, `workday` | **1 each** | **DECLARED GAP** — enough to prove the mechanism, no more |
| `generic_rest`, `generic_odata` | 1 each, identity (`qty` → `qty`) | The escape hatch |

**KNOWN GAPS, stated rather than filled:**

1. **The six assets and manufacturing objects — `fixed_asset`, `asset_depreciation`,
   `maintenance_schedule`, `work_order`, `production_output`, `machine_downtime` — have NO template
   for ANY vendor.** Nobody on this project has seen a real fixed-asset or MES payload. Per L1-D5, a
   `verified: false` flag on an invented mapping is still an invented mapping an admin may apply and
   half-trust. **An unfounded guess is worse than an absent one.** These are mapped by hand until
   OD3 supplies a real endpoint.
2. **`netsuite`, `infor` and `workday` carry one row each.** Above the story's ≥1 bar, well below
   useful coverage.
3. **`employee_profile` and `payroll_record` are never templated** — they are live-only (D2) and are
   single-record lookups, not staged collections.

**Every one of the 43 rows is a guess**, and each carries a `source_note` saying which convention it
came from and that it is unconfirmed against a real system.

## 6.3 The "Apply vendor defaults" Script Include bridge was NOT built. Deliberate deviation.

§5.3 asks for the UI Action *"plus the same logic exposed as a Script Include method for the Table
API path."* The UI Action was built; the Script Include was not.

- **Nothing calls it at L1.** No test in §9 of the design exercises it, and no L1 component needs it.
- **`ScriptInclude.script` is string-only** (`module-guide`), so the bridge must be a
  `require('x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/mapping/apply-template.ts')` string —
  a path pinned to the app **version**, which breaks silently on the first version bump.
- **A Script Include is not reachable from the Table API anyway.** The phrase "the Table API path"
  does not describe something a Script Include provides; only a Scripted REST API would, and that is
  L4's concern.
- The logic lives in `src/server/mapping/apply-template.ts` and exports `applyVendorDefaults(id)`,
  which any later layer imports directly.

**If the architect wants the named entry point, it is ~8 lines and belongs at L4** where a real
caller exists. Flagged rather than silently skipped.

## 6.4 The unverified-mappings module carries §5.4's query verbatim

`Unverified Mappings` → `FILTER` on `object_map`, filter
`mapping_verified=false^mapping_source=template`. **That query does not catch §5.5's other case** —
an active map with zero `field_map` rows and no template applied. That case is surfaced on the
**form** by the display business rule instead. Recorded as a small ambiguity in §11.

---

# 7. ACL inventory — extends C3 of `docs/l0-build-report.md` §8.3

**24 rules, all deployed, all read back from `sys_security_acl`.** `adminOverrides` is written
explicitly on every one — the SDK default is `true` (L0 trap T4).

## 7.1 Table-level — 16 rules

| Table | Op | Roles | decision | adminOverrides | Live? |
|---|---|---|---|---|---|
| `erp_system` | read | `viewer` | allow | true | ✓ |
| `erp_system` | create / write / delete | `admin` | allow | true | ✓ |
| `object_map` | read / create / write / delete | `admin` | allow | true | ✓ |
| `field_map` | read / create / write / delete | `admin` | allow | true | ✓ |
| `map_tmpl` | read / create / write / delete | `admin` | allow | true | ✓ |

`erp_system` **read is `viewer`, deliberately** — L2's telemetry and L4's tiles must name the system
a figure came from, and provenance a viewer cannot read is not provenance. The sensitive columns are
carved out individually below, so a viewer sees *which* system answered and never its URL or
credentials.

`object_map` **read is `admin`, deliberately not `viewer`** — story L1-3 AC8.

## 7.2 Field-level READ restrictions — 6 rules, all `admin`, allow, adminOverrides true

`erp_system.base_url`, `.auth_profile_basic`, `.auth_profile_oauth`, `.auth_profile_mutual`,
`.mid_server`, and `object_map.query_template`. All ✓ live.

`object_map.query_template` is currently redundant (the table read is already admin-only) and is
kept on purpose: it survives any later widening of the table rule.

## 7.3 Field-level HARD DENY-WRITE — 2 rules, Shape A

| Table.field | Op | decision | adminOverrides | script | Live? |
|---|---|---|---|---|---|
| `object_map.mapping_source` | write | **deny** | **false** | `answer = false;` | ✓ **proven §5** |
| `object_map.mapping_verified` | write | **deny** | **false** | `answer = false;` | ✓ **proven §5** |

## 7.4 Deliberately absent

- **`erp_system.circuit_open_until` is NOT deny-write.** The breaker writes it and spec §5.1 calls it
  *"admin-editable for manual reset"*. Operational state, not provenance. Recorded so nobody
  "completes" the deny set by adding it.
- **No `field_map` deny-write rules.** Field mappings are admin-authored configuration, not
  system-derived provenance. `field_map.logical_object` is `readOnly` at the dictionary — a
  convenience, not a security control, and it is documented as such.

## 7.5 Running total for the app

L0 delivered the inventory of ~66. **L1 has now built and deployed 24 of them.** The remaining ~42
land with `call_log` (L2), `erp_staging` / `sync_run` (L3) and the four L6 tables.

---

# 8. THE GATE

## 8.1 L1-a — **MET**

Executed in one sitting. **No source edit, no `now-sdk build`, no `now-sdk install` occurred between
T₀ and the delta query.**

**Step 1 — T₀ snapshot.**
```
sys_metadata?sysparm_query=sys_scope.scope=x_335329_sn_hr_erp
  -> 197 records
T0 (latest sys_updated_on in scope) = 2026-08-13 08:45:54
```

**Step 2 — a second ERP, created through the Table API only.**
```
POST erp_system  ECHO-SECOND-ODATA / generic_odata / Globex Nordics AB / oauth2   -> 201
POST object_map  stock_item, odata_skiptop, response_root=value,
                 date_format='dd/MM/yyyy HH:mm', page_size=250                    -> 201
POST field_map   qty, safety_stock, sku, name, location, erp_id                   -> 201 x6
```

**The four differences the gate demands — not merely name and URL:**

| attribute | system 1 | system 2 | differs |
|---|---|---|---|
| `vendor` | `generic_rest` | `generic_odata` | ✔ |
| **`auth_type`** | `basic` | `oauth2` | ✔ |
| **`pagination_style`** | `none` | `odata_skiptop` | ✔ |
| **`date_format`** | `yyyy-MM-dd` | `dd/MM/yyyy HH:mm` | ✔ |
| **`response_root`** | `args` | `value` | ✔ |

**Step 4 — THE EVIDENCE.**
```
sys_metadata?sysparm_query=sys_scope.scope=x_335329_sn_hr_erp
                          ^sys_updated_on>2026-08-13 08:45:54
  ->  0 rows

total sys_metadata in scope: 197   (was 197)
```

**Zero rows. Scope total unchanged. L1-a is MET.** A second ERP with a different vendor, a different
auth type, a different pagination style, a different date format and a different response root was
added, and **not one application file changed.**

### 8.2 The half of L1-a's script that could NOT run, stated plainly

§8.1 step 3 reads *"Run a sync (L3) against it. Confirm staged rows with correct provenance naming
the second system."* **L3 does not exist.** There is no sync engine, no `erp_staging`, no `sync_run`.

**The gate's own evidence — the empty `sys_metadata` delta — is complete and is what §8.1 calls
"the gate evidence".** But the end-to-end confirmation that the second system actually *produces
correctly-attributed rows* is deferred to L3 and must be re-run there. **L1-a is met on its stated
evidence; it is not met end-to-end, and pretending otherwise would be the same class of overclaim
the L1-b split exists to prevent.**

## 8.3 L1-b — **NOT MET. Blocked on OD3. Recorded open.**

*"A genuinely different vendor API is pure data."*

**Not demonstrated, and not demonstrable from here.** It needs a second real endpoint whose JSON
shape, paging semantics and date encoding are **not under our control**. Both fixtures point at
`postman-echo.com`, which answers however it is asked — so what §8.1 proves is that *our
configuration surface* accommodates four different configurations *of our own devising*. That is
worth something. It is L1-a. **It is not L1-b.**

**This gate was not reworded.** It is not marked N/A. It is **blocked**, and blocked items get
revisited. What would close it: OD3 supplies one real ERP endpoint, and a *third* system against a
*second* real vendor is configured with no code change.

**L1 is declared complete on L1-a, and this paragraph is the condition that permits that.**

---

# 9. What was NOT verified, and exactly why

Nothing in this section is claimed as passing.

## 9.1 The verbatim text of every business-rule refusal — **NOT OBSERVABLE via the Table API**

The design mandates `current.setAbortAction(true)` + `gs.addErrorMessage(...)`, and that is what is
built. `gs.addErrorMessage` writes to the **session message queue**. The Table API returns only:

```
"Operation against file '<table>' was aborted by Business Rule '<name>^<sys_id>'."
```

So **behaviour is proven** (the right branch fires on the right input, and only on it) while the
**exact wording is not**. This affects:

| Test | Message the story fixes |
|---|---|
| T1-5 / L1-2 AC1–AC4 | the four validation messages |
| T1-9 / L1-3 AC3 | `An object mapping already exists for ERP system '<name>' and logical object '<object>'.` |
| T1-12 / L1-3 AC6 | `Unknown logical field '<name>' for object '<object>'.` |

**What the tester must do:** perform each save **on the form, in a browser**, and read the message
banner. The message literals are in
`src/server/business-rules/validate-erp-system.ts` and `validate-mappings.ts`.

**Not substituted with a source grep and called verified.**

## 9.2 C5 — verification as a genuine non-admin. **STILL NOT MET.**

This was pursued properly, not waved off.

```
PATCH sys_user/<hrerp_viewer_only>  {user_password: <set>}          -> HTTP 200
GET   /api/now/table/... as hrerp_viewer_only                       -> HTTP 401
      {"message":"User is not authenticated","detail":"Required to provide Auth information"}
```

**Discriminating tests run, so this is a finding and not a guess:**

| Hypothesis | Test | Result |
|---|---|---|
| The password PATCH silently failed | Created a brand-new user with `user_password` set **at insert** | **401** — so it is not the PATCH path |
| The user lacks a platform REST role | Granted `snc_internal`, then `snc_platform_rest_api_access` | **401 after each** |
| Password needs re-setting | Re-PATCHed the password | **401** |
| SSO / MFA property forces it | Checked `glide.authenticate.multisso.enabled`, `glide.authenticate.sso.redirect.idp`, `glide.authenticate.external.enforce_sso`, `glide.security.mfa.enable`, `glide.basicauth.required.scriptedrest` | **all absent** |

**Conclusion: basic authentication as a non-admin user is refused at the instance level on this
PDI.** The error is `401 User is not authenticated` — an *authentication* failure, not a `403`
authorization failure, and it is independent of roles. Admin's own basic auth works, so basic auth
is not globally disabled. **This is the same wall the sibling project hit.**

**Assertions that consequently need a human in a browser:**

| ID | Assertion | Story |
|---|---|---|
| **T1-14** | As `hrerp_viewer_only`: `x_335329_sn_hr_erp_object_map_list.do` shows a **security message**, not an empty list | L1-3 AC8 |
| **H5** (L0 §9) | As `hrerp_viewer_only`: no config module visible in the navigator | L5-9 AC4 |
| **new** | As `hrerp_viewer_only`: `erp_system` **is** readable, but `base_url`, the three auth profiles and `mid_server` are **absent from the form** | §7.2 |
| **new** | As `hrerp_viewer_only`: `field_map` and `map_tmpl` lists are refused | §7.1 |

**A password was set on `hrerp_viewer_only`** during this attempt so a human can log in as that
user in a browser without creating a new credential. Its value was reported to the product owner in
session only and is **not written to any file in this repository**. `password_needs_reset` is
`false`; `active` is `true`; the user still holds **exactly one** app role, `inherited=false`.
Two throwaway probe users (`hrerp_authprobe`, `hrerp_authprobe2`) were created and **deleted**
(HTTP 204 each) — `sys_user?user_nameSTARTSWITHhrerp` returns the original three and nothing else.

**No admin-run test is offered as a substitute anywhere in this report.** §5's deny-write test is
run as admin *on purpose* — admin failing to write is the assertion — and that is the only place
admin's own session is the point.

## 9.3 T1-18 and T1-21 — "Apply vendor defaults" behaviour. **NOT EXECUTED.**

The UI Action is built and deployed (`sys_ui_action` → 1 row, `active=true`,
`action_name=apply_vendor_defaults`, table `object_map`, roles `x_335329_sn_hr_erp.admin`). **Its
script has never run**, because a form-button UI Action cannot be invoked from the Table API, and
the alternatives were all worse:

- a `sys_trigger` / `sysauto_script` to run it → **an armed driver on the instance.** §9's named sin.
  Refused.
- a background script at `sys.scripts.do` → a browser session with a CSRF token. Not available.
- a Scripted REST API wrapper → building unrequested L4 infrastructure at L1.

**Handed to the tester with the exact steps in §10.**

### 9.3.1 A GENUINE UNRESOLVED RISK the tester must check first, before anything else

**The applier writes the two columns that carry a Shape A deny-write ACL.** §5.3 step 5:

```ts
map.setValue('mapping_source', 'template')
map.setValue('mapping_verified', tmpl.getValue('verified'))
map.update()
```

`mapping_source` and `mapping_verified` are exactly the two fields §5 just proved a **full admin
cannot write through the Table API**. Whether a **scoped `GlideRecord.update()` inside a UI Action**
is subject to the same field-level write ACL **is a fact about this instance that has not been
established.** The Table API path went through `GlideRecordSecure.insert` (visible in the stack trace
in §10, trap T7); the UI Action path may not.

**If the ACL does apply, the failure is silent and is precisely the §7 failure mode:** the action
inserts the `field_map` rows and reports `Applied N default mappings…`, `mapping_source` stays empty,
`mapping_verified` stays `false`, **and the unverified-mapping banner never appears** — because the
display rule keys on `mapping_source === 'template'`. An admin would apply a guess and see no warning.

**This was NOT guessed at and NOT worked around.** The design was implemented as written and the
interaction is escalated. Two candidate fixes exist if the tester finds it broken, and **both are
architect decisions, not developer ones**:

- **(a)** derive both columns in a `before insert/update` business rule — a BR's `current.setValue()`
  is not re-checked against the field write ACL, which is why `field_map.logical_object` populates
  correctly today (§4.4). Needs a way for the rule to know a template was applied.
- **(b)** narrow the deny ACLs with a condition that permits the applier's own transaction, which
  weakens the "nobody, admin included" property the rules exist to provide.

**First test to run: apply a template, then re-read `mapping_source`.** If it is empty, this is real.

## 9.4 T1-19, T1-20, T1-11, T1-13 (surfacing half) — **NOT EXECUTED, browser required**

- **T1-19** — the unverified banner rendering and clearing. It is a `display` business rule; display
  rules do not fire on a REST `GET`. Deployed and active (`sys_script`, `when=before_display`).
- **T1-20** — the `Unverified Mappings` module rendering. Deployed
  (`sys_app_module`, `FILTER`, `mapping_verified=false^mapping_source=template`, active, admin-gated).
- **T1-11 — OD4's gate criterion, "no JSON brace typed."** This is the criterion OD4 exists for and
  it is explicitly *"timed and observed by the tester"*. The structure that makes it passable is in
  place — `field_map` is a child table with a related list and a `logical_field` dropdown, and
  `object_map` carries no JSON column at all — but **a human has to do it and be timed.**
- **T1-13's surfacing half** — the message `No field mapping — this object will return no usable
  rows.` on a saved active map. The map saves (proven, §4.3); the annotation is display-BR only.

## 9.5 T1-22's sync half and T1-23 — see §8.2 and §8.3

---

# 10. Traps hit this session

**Three are new and none of them is in kickoff §9 or in `l0-build-report.md` §10. T7 is the
expensive one and it would have shipped a completely dead validation layer.**

| # | Trap | Cost | Detail |
|---|---|---|---|
| **T6** | **`var` is not allowed in a Fluent `.now.ts` file** | one failed build | `TS115: Declaration kind "var" is not supported. Only const variables are supported.` plus `TS243: Unsupported statement in Fluent source file.` Same root cause as L0's T2 (shorthand properties): `.now.ts` is a **restricted AST**, not compiled TypeScript. `const` at module top level is fine and hoisted references work. **Add to §9 next to T2.** |
| **T7** | **A transitive module import without a `.ts` extension resolves at BUILD time and FAILS at RUNTIME — and the business rule's exception is SWALLOWED, so the record saves anyway** | the entire first deploy; all four validation branches dead | **See below. This is the most dangerous thing found this session.** |
| **T8** | **`sys_app_module.roles` and `Acl.roles` want an array; the guide's own example shows a bare string on modules** | one failed build | `TS2322: Type 'string' is not assignable to type '(string \| Role)[]'`. Fails loudly, cheap. Noted only because `application-menu-guide`'s example writes `roles: ['admin','itil']` while a single role invites `roles: ADMIN`. |

## 10.1 Trap T7 in full

**Symptom.** Clean `now-sdk build`. Clean `now-sdk install`. Every one of the four config-validation
branches **silently did nothing** — four contradictory rows created with HTTP 201.

**This is the exact shape of the sibling's bug the design spent three paragraphs warning about**
(a validation rule that validates nothing, clean build, passing happy path) arriving through a
completely different mechanism. Had the test asserted only the happy path, or only that "the rule
exists in `sys_script`", it would have shipped.

**Diagnosis — one `syslog` query, not a theory.**

```
com.glide.ui.ServletErrorListener | JavaScript evaluation error on:
  // @fluent-module validateErpSystem;false;.../src/server/business-rules/validate-erp-system.ts
  const { validateErpSystem } = require('x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/business-rules/validate-erp-system.ts');
  validateErpSystem(current, previous);
Root cause:
  com.glide.module_support.exceptions.ModuleResolutionException:
  No module with path "x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/util/bool"
  found in sys_module table
```

**Root cause.** Modules are registered in `sys_module` under a path **that includes the `.ts`
extension**:

```
dist/app/update/sys_module_a81ec4bf....xml
  <path>x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/util/bool.ts</path>
```

The SDK rewrites the **top-level** import (`.now.ts` → module) into an extension-bearing `require()`,
so that resolves. But a **module-to-module relative import is emitted verbatim** into the module
body:

```js
import { isEmpty, isTrue } from '../util/bool';     // shipped exactly like this
```

and the platform's runtime loader resolves it to `.../src/server/util/bool` — **no such row.**

**The build cannot catch this**, because TypeScript resolves `'../util/bool'` to `bool.ts`
perfectly well on disk. It only fails on the instance, at the moment the rule first runs.

**Two things make it far worse than a normal runtime error:**

1. **The business rule's exception is swallowed.** The insert **completed with HTTP 201**. A `before`
   rule that throws does not abort the transaction and does not surface to the caller. **A business
   rule that crashes is indistinguishable, from the API, from a business rule that approved the
   record.** Every validation, every provenance stamp and every guard written as a module function
   in L2–L6 has this property.
2. **It is invisible unless you go looking in `syslog`.** Nothing in the deploy output, the REST
   response, or the record itself indicates a problem.

**The fix — one character per import.**

```ts
import { isEmpty, isTrue } from '../util/bool.ts'          // resolves at runtime
import { isLogicalField } from '../contract/objects.ts'
```

`src/server/tsconfig.json` already carries `"allowImportingTsExtensions": true` — **the L0 scaffold
was set up for exactly this style, and the reason was never written down.** It is written down now.

**After the fix and a redeploy, all four branches abort correctly** (§4.2), and the instance is
clean:

```
syslog?sysparm_query=messageLIKE@fluent-module                          -> 14 rows, ALL at 08:39
syslog?sysparm_query=messageLIKE@fluent-module^sys_created_on>08:48:00  ->  0 rows
```

All 14 errors predate the fix; nothing has thrown since. **Time-bound this query** — the historical
rows stay in `syslog` and a naive `messageLIKE@fluent-module` check reads as a failure forever.

**Binds every later layer.** L2 ports 12 server modules with a dense internal import graph; L3's sync
engine is the largest body of logic in the app. **Every relative import between files under
`src/server/` must carry `.ts`.** Recommended standing check before any deploy:

```bash
grep -rn "from '\.\./\|from '\./" src/server/ | grep -v "\.ts'"      # must return nothing
```

**And a standing post-deploy check**, because the swallow makes silence meaningless:

```bash
# after the first exercise of any module-backed rule
sys_log?sysparm_query=messageLIKE@fluent-module^sys_created_on>javascript:gs.minutesAgoStart(30)
#   -> must return zero rows
```

**D15's honest caveat was right and understated it.** D15 said the `require()` bridge had been proven
to *build* but never *executed*, and that the first live run would be the proof. **This is that first
live run, and the bridge worked for the top-level module and broke for its dependency.** Recorded as
**D19**.

---

# 11. Contradictions found against the design documents

| # | Document | Contradiction | Resolution |
|---|---|---|---|
| 1 | `l1-control-tower-design.md` §2.3 vs `src/server/contract/objects.ts` | §2.3 names `backorder`'s contract as `code`, `label`, `qty`, `occurred_on`, `status`, `erp_id`; the code uses `sku`, `name`, `qty`, `promised_on`, `status`, `location`, `erp_id` | **The code is right.** §2.3 is written in `erp_staging`'s **typed-column** vocabulary (`code`/`label`/`occurred_on`, `l3-staging-design.md` §3.2), not in logical-field vocabulary. Two different namespaces. This collision is what left a stray `occurred_on` in the choice list (§1.1). **The design should say which vocabulary §2.3 is using** |
| 2 | `l1-control-tower-design.md` §4.2 | Specifies `logical_field` *"filtered to the parent map's `logical_object`"* | **Not implementable as a dependent choice.** The platform filters a dependent choice on a field of the **same** record, and a new `field_map` row has no `logical_object` until it is saved — a dependent choice would be **empty on the New form**, which is worse than an unfiltered one. R1-1 anticipated this and required a decision at L1-7. **Decision recorded as L1-D8**: flat list of all 58 field names, correctness enforced by the L1-8 business rule on every path including the Table API (proven, §4.4). T1-11 is unaffected — the admin still types no JSON brace; the dropdown is simply longer than ideal |
| 3 | `l1-control-tower-design.md` §4.2 | Does not list `field_map.logical_object` | **The column exists and is kept.** Denormalised, `readOnly`, set by the rule. T1-12's message must name the object, and a ~90-row child list is unreadable without it. §1.3 |
| 4 | `l1-control-tower-design.md` §5.3 | *"plus the same logical exposed as a Script Include method for the Table API path"* | **Not built.** A Script Include is not reachable from the Table API; nothing at L1 calls it; the bridge would be a version-pinned `require()` path. §6.3 |
| 5 | `l1-control-tower-design.md` §5.4 vs §5.5 | §5.5 says a zero-row active map *"appears in the unverified surface"*, but §5.4 fixes that surface's query to `mapping_verified=false^mapping_source=template`, which a hand-built zero-row map does not match | **Surfaced on the form instead**, by the display rule. The module keeps §5.4's verbatim query. **The architect should decide** whether the module query widens or a second module is added. §6.4 |
| 6 | `l1-control-tower-design.md` §9 T1-6 | `grep -rn "=== 'true'\|!== 'true'" src/` → expects zero | **Returns 4, all in comments** that document the trap, in the file that prevents it. Corrected grep in §4.2 |
| 7 | `l1-control-tower-design.md` §9 T1-5/T1-9/T1-12 | Expect verbatim message text via Table API inserts | **The Table API does not carry `gs.addErrorMessage` text.** Behaviour proven; wording needs a form save. §9.1 |
| 8 | `l1-control-tower-design.md` §5.1 | Names `JSON.stringify(...)` as the known-working exception for seed payloads | **A pre-serialised string literal is used instead** — strictly safer, needs no exception. §6.1 |
| 9 | `l1-control-tower-design.md` §6 / §5.3 | §6 puts `mapping_source` / `mapping_verified` under hard deny-write; §5.3 step 5 has the applier write them | **Possible direct collision, UNRESOLVED.** §9.3.1. Escalated to the architect, not worked around |
| 10 | `docs/stories.md` L1-3 AC1, L1-4 | Both still name a `field_map` **column** on `object_map` and `x_335329_sn_hr_erp_mapping_template` | **Superseded by OD4 and D13.** The column does not exist; the table is `…_map_tmpl` (27 chars). Restated here because a tester reading the stories literally will look for a column that was deliberately deleted |

---

# 12. Handover — what L2 must know

1. **Every relative import under `src/server/` must end in `.ts`.** Trap T7 / D19. L2 ports 12
   modules with a dense import graph; this will bite on every one. The build will not tell you.
2. **A module-backed business rule that throws is swallowed and the record saves.** After L2's first
   deploy, query `syslog` for `@fluent-module` before believing any green result.
3. **Fixtures already on the instance**, ready to use — no need to recreate them:

   | `erp_system` | vendor | auth | `base_url` | purpose |
   |---|---|---|---|---|
   | `ECHO-PRIMARY` | `generic_rest` | basic | `postman-echo.com` | system 1 |
   | `ECHO-SECOND-ODATA` | `generic_odata` | oauth2 | `postman-echo.com` | system 2, the L1-a gate fixture |
   | **`BROKEN-FIXTURE`** | `generic_rest` | basic | **`erp-invalid.invalid`** | **the deliberately-broken system L2/L3 need to prove the failed state. Do not "fix" it.** |
   | `ECHO-SAP-DE`, `ECHO-SAP-FR` | `sap_s4` | basic | `postman-echo.com` | T1-4, two entities of one vendor |
   | `HAPPY-PATH` | `sap_s4` | oauth2 | `postman-echo.com` | T1-8 |

   Plus 3 `object_map` rows and 7 `field_map` rows. **All six systems are `read_only=true`.**
4. **`config-loader.loadMap()` must read `field_map` rows, not a JSON column.** `object_map` has no
   `field_map` column — OD4 / L1-D3. This is the one substantive change D4's "do not rewrite from
   scratch" permits, and `l2-connector-design.md` §4 already records it.
5. **T1-25 will be L2's test, not L1's** — grep `src/server/connector/` and `src/server/sync/` for
   vendor field names. Those directories do not exist yet, so the test is vacuous today. The
   vendor field names to grep for are in `src/fluent/tables/map-tmpl-seeds.now.ts`
   (`MENGE`, `MATNR`, `QuantityOnHand`, `AmountInCompanyCodeCurrency`, …). **A single one of those in
   runtime code is a design failure.**
6. **Read `erp_system.mid_server` with `getDisplayValue()`.** `setMIDServer()` takes the **name**.
   A sys_id silently never routes.
7. **`circuit_open_until` is writable by design** — three states in one column: empty = closed,
   future = open, **past = half-open**.
8. **Still open and unchanged:** OD12 (drop the `acltest` shell in a browser), OD13 (ampersand
   AC3/AC4), OD3 (real ERP endpoint — and therefore **L1-b**).
9. **C5 is still not met.** Until a human verifies in a browser, no access-control assertion in this
   app is evidenced by a non-admin session — at L1, L0 or anywhere else.

---

# 13. Evidence appendix

All read-only unless noted. `<PW>` was supplied inline and is written to no file.

```bash
# state
curl -u admin:<PW> ".../api/now/table/sys_db_object?sysparm_query=nameSTARTSWITHx_335329_sn_hr_erp&sysparm_fields=name,ws_access,access"
curl -u admin:<PW> ".../api/now/table/sys_security_acl?sysparm_query=sys_scope.scope=x_335329_sn_hr_erp&sysparm_display_value=all"
curl -u admin:<PW> ".../api/now/table/sys_script?sysparm_query=sys_scope.scope=x_335329_sn_hr_erp"
curl -u admin:<PW> ".../api/now/table/sysauto_script?sysparm_query=sys_scope.scope=x_335329_sn_hr_erp"      # 0
curl -u admin:<PW> ".../api/now/table/sys_module?sysparm_query=sys_scope.scope=x_335329_sn_hr_erp"

# templates
curl -u admin:<PW> ".../api/now/table/x_335329_sn_hr_erp_map_tmpl?sysparm_fields=vendor,logical_object,verified&sysparm_limit=200"
curl -u admin:<PW> ".../api/now/table/x_335329_sn_hr_erp_map_tmpl?sysparm_query=verified=true"              # 0

# the T7 diagnosis
curl -u admin:<PW> ".../api/now/table/syslog?sysparm_query=messageLIKEvalidateErpSystem^ORDERBYDESCsys_created_on"

# the gate
curl -u admin:<PW> ".../api/now/table/sys_metadata?sysparm_query=sys_scope.scope=x_335329_sn_hr_erp"                                # 197 before and after
curl -u admin:<PW> ".../api/now/table/sys_metadata?sysparm_query=sys_scope.scope=x_335329_sn_hr_erp^sys_updated_on>2026-08-13 08:45:54"   # 0
```

Local:

```bash
npm run build                                                        # Build completed successfully
node scripts/check-contract.mjs                                      # contract OK: 16 objects, 14 staged
grep -rn "gs.hasRole" src/                                           # 0
grep -rnE "[0-9a-f]{32}" src/fluent/ | grep -v generated/keys.ts     # 0
grep -rn "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" src/                     # 0
grep -c '"deleted"' src/fluent/generated/keys.ts                     # 0 — nothing orphaned
grep -rn "from '\.\./" src/server/ | grep -v "\.ts'"                 # 0 — trap T7 guard
```

## 13.1 Source added or changed at L1

```
src/fluent/tables/choices.ts                      CHANGED  +qty +started_on -occurred_on (§1.1)
src/fluent/tables/map-tmpl-seeds.now.ts           NEW      43 Record(), plain string literals
src/fluent/business-rules/l1-rules.now.ts         NEW      4 BusinessRule()
src/fluent/security/l1-acls.now.ts                NEW      24 Acl()
src/fluent/navigation/l1-modules.now.ts           NEW      1 UiAction() + 4 sys_app_module
src/server/util/bool.ts                           NEW      isTrue() / isEmpty()
src/server/business-rules/validate-erp-system.ts  NEW      §3.3, four branches
src/server/business-rules/validate-mappings.ts    NEW      object_map uniqueness + field_map contract
src/server/business-rules/annotate-object-map.ts  NEW      §5.4 and §5.5 annotations
src/server/mapping/apply-template.ts              NEW      §5.3 apply algorithm
scripts/check-contract.mjs                        CHANGED  contract <-> choice-list cross-check
```

Unchanged and inherited: `erp-system.now.ts`, `object-map.now.ts`, `field-map.now.ts`,
`map-tmpl.now.ts`, `src/server/contract/objects.ts`.

## 13.2 Rollback contexts

```
ef099ba747260b100739b71f316d436f   first L1 install (business rules dead — trap T7)
0bdad32f47e20b100739b71f316d4345   second L1 install (T7 fixed; this is the live state)
```
