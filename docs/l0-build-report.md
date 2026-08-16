---
title: L0 — Scaffold, scope, roles, ACL skeleton — build report
app: x_335329_sn_hr_erp
instance: https://dev296062.service-now.com (PDI), auth alias `dev`
date: 2026-08-12
author: developer
authority: docs/change-manifest.md — human YES for L0–L6, 2026-08-12. This report covers L0 only.
verdict: GATE PARTIALLY MET — 3 of 5 gate items fully met, 2 blocked on a capability this session does not have. Detail in §1.
---

# 0. ADDENDUM — 2026-08-12, later the same day. Supersedes §1.2 in part.

The product owner supplied the admin password, giving this session a real Table API write path. The
blocked items were then executed for real. **H2 — the item that blocked L1 — is closed.**

| Item | Was | Now |
|---|---|---|
| **H2 / L0-7 / T0-11** — deny-ACL shape | blocked | **CLOSED. Shape A proven against a full admin.** See decision **D17** |
| **H1** — three test users | blocked | **DONE.** `hrerp_viewer_only` `bdede8af476e87100739b71f316d435c`, `hrerp_finance_only` `8eede8af476e87100739b71f316d439c`, `hrerp_hr_only` `1eede8af476e87100739b71f316d43c0` — each holding **exactly one** app role, `inherited=false`, no `itil`/`admin`/`user_admin` |
| **H4 / T0-10** — property without redeploy | blocked | **PASS.** `stale_after_hours` PATCHed 24 → 1, re-read as 1, reverted to 24. No redeploy |
| **H3 / T0-17** — ampersand AC3/AC4, throwaway cleanup | blocked | **Still open.** Browser-only. Now **OD13** and **OD12** |

**H1 incidentally re-proves the containment rule the hard way:** granting `finance_viewer` to
`hrerp_finance_only` pulled in nothing else. The user holds that role and only that role. The empty
`sys_user_role_contains` graph is not merely declared in source, it is observed in a real grant.

**One new artefact, one new trap.** The L0-7 probe left an empty table shell that a deploy cannot
remove and the Table API refuses to drop (403) — see **D18** and **OD12**. So gate item 4 ("zero
throwaway artefacts") has **regressed from met to not met**, by the act of running gate item 5. That
is an honest trade and it is recorded rather than quietly dropped: the shell is empty, carries no
columns and no ACL, and needs one browser deletion.

**Revised verdict: 4 of 5 gate items met. L1 is unblocked.** The two outstanding items (OD12, OD13)
are browser-only, neither blocks L1, and neither is a security control.

---

# 1. Verdict first — as written before the addendum above

**The gate is NOT fully met. L1 should not start until §1.2 is resolved.**

## 1.1 What is met, with live evidence

| # | Gate item | Verdict |
|---|---|---|
| **1** | Deploys clean | **MET.** `now-sdk build && now-sdk install` clean. `sys_app` returns one row. §3 |
| **2** | Four roles exist, no implication between them, verified against `sys_user_role_contains` | **MET.** 4 rows in `sys_user_role`; **0 rows** in `sys_user_role_contains`. §4 |
| **3** | Ampersand intact in `sys_app` and everywhere the design specifies | **MET on every criterion a Table API can reach.** `sys_app.name` = literal `SN HR&ERP`. Two of story L0-2's five criteria are browser-only and were **not executed**. §5 |
| **4** | Every throwaway spike artefact deleted, verified by query returning zero rows | **MET, and stronger than required** — no spike artefact was ever installed. Both spikes ran build-only in a disposable sandbox. `sys_db_object`, `sysauto_script` and `sys_security_acl` in scope all return **0 rows**. §7 |
| **5** | C1–C5 satisfied or explicitly reported as not satisfied | **C1 MET. C2 MET (and it reverses the governance assumption). C3 MET. C4 MET. C5 NOT MET.** §8 |

## 1.2 What is not met, and exactly why

**One root cause blocks everything in this list: this session has no write path to the instance.**

`now-sdk` exposes exactly one write operation — `install`, which deploys a built application. It has
no record-create, no record-update, no Table API `PATCH`. The stored credential for alias `dev` lives
in the SDK's own credential store; attempting to read it out was blocked by the environment's
permission classifier, correctly — extracting a stored secret to hand-roll HTTP calls is not a thing
an agent should do quietly, and I did not work around it.

The consequence is precise: **anything requiring a record write that is not an application artefact
could not be executed.**

| Blocked | Design step | Why it needs a write |
|---|---|---|
| **Three test users** | L0-6 | The design says *"created by hand in the browser"*. No browser, no user-create API |
| **C5 — non-admin verification** | C5, T0-8, T0-12, T0-16 | Depends on the three test users existing and on authenticating **as** them |
| **The deny-ACL shape decision** | L0-7, T0-11 | The decisive step is a Table API `PATCH` **as a full admin** against a protected field |
| **Property-without-redeploy** | T0-10 | A Table API `PATCH` of `stale_after_hours` from 24 to 1 |
| **Ampersand AC3 / AC4** | L0-4 | A real browser session in the Next Experience shell |

**These are not "skipped as unimportant".** L0-7 in particular is the step the design document
itself says *"Do not skip this because it 'obviously' works"*, and it is unexecuted. What I could
do instead is in §6.3, and it is explicitly *not* a substitute.

**What the next session needs:** either (a) a human runs §9's five short tasks in a browser, or
(b) the session is given a credential it may use for direct Table API calls. Nothing else in L0
is outstanding.

---

# 2. What was built

Everything below is in scope `x_335329_sn_hr_erp`, deployed to `dev296062`.

| Component | Type | Count | Source file | Status |
|---|---|---|---|---|
| Application scaffold | `sys_app` / `sys_scope` | 1 | `now.config.json` | **BUILT** |
| `viewer`, `finance_viewer`, `hr_viewer`, `admin` | `sys_user_role` | 4 | `src/fluent/security/roles.now.ts` | **BUILT** |
| Six threshold properties | `sys_properties` | 6 | `src/fluent/properties/thresholds.now.ts` | **BUILT** |
| Application menu | `sys_app_application` | 1 | `src/fluent/navigation/app-menu.now.ts` | **BUILT** |
| Server tsconfig | config | 1 | `src/server/tsconfig.json` | **BUILT** |
| ACL bodies | `sys_security_acl` | **0** | — | **CORRECTLY ABSENT** — see below |
| Tables | `sys_db_object` | **0** | — | **CORRECTLY ABSENT** — no table is created at L0 |

**Zero ACLs at L0 is the design, not an omission.** `docs/l0-scaffold-design.md` §8: *"The ACL
bodies themselves are not an L0 step. They land table-by-table at L1/L3/L6 using the shape L0-7
proved. L0 owns the shape; the layers own the rules."* What L0 owes is the **inventory** (condition
C3, delivered in §8.3) and the **proven shape** (L0-7, **not delivered** — §6.3).

## 2.1 Scaffold decision — hand-built, not `init`

The repo already carried `now.config.json` (with the real `scopeId`
`f5a9e167140b4883b0fc301112c0f2bb`), `package.json` and `node_modules`, but no `src/`.

`now-sdk init` applies a template into the current working directory and **merges** `now.config.json`
and `package.json` rather than replacing them — but running it would also have pulled in
`src/fluent/example.now.ts` (a `ClientScript` and a `BusinessRule` on `incident`) and
`src/server/script.ts`, which are exactly the kind of stray artefact that ships to an instance
because nobody read the scaffold. **Rejected.**

Instead the SDK's own template definitions were read directly out of
`node_modules/@servicenow/sdk-api/dist/project-factory/templates.js` and only the two files this
project actually needs were reproduced verbatim: the `tsconfigPath` line in `now.config.json` and
`src/server/tsconfig.json`. **The existing config was not destroyed** — `scope`, `scopeId` and
`name` are byte-identical to what was there before.

Deliberately **not** created: `src/tsconfig.json`, `src/tsconfig.client.json`,
`src/tsconfig.server.json`. Those three configure type-checking of legacy `*.server.js` /
`*.client.js` files, of which this app has none. They cost nothing to add at L5 if the client build
wants them.

`typescript` is listed as a template devDependency but is **not installed** in this repo, and the
build does not need it — `now-sdk build` succeeded four times without it. Recorded so nobody
installs it chasing a phantom.

---

# 3. Gate item 1 — deploys clean

Three successful `build` + `install` cycles. Rollback contexts, in order:

```
fcbe18af47ea87100739b71f316d43a2   (roles)
eb746cab472e87100739b71f316d4330   (properties + application menu)
49f520af472e87100739b71f316d4383   (restore after the L0-5 trap exercise)
```

## T0-1 — the app exists in scope

```
$ npx now-sdk query sys_app -a dev -q "scope=x_335329_sn_hr_erp" -f scope,name,version,sys_id
[now-sdk] Retrieved 1 record(s) from table 'sys_app'
[
  {
    "sys_id": "f5a9e167140b4883b0fc301112c0f2bb",
    "scope": "x_335329_sn_hr_erp",
    "name": "SN HR&ERP",
    "version": "0.0.1"
  }
]
```

**Before this session the same query returned `Retrieved 0 record(s)`**, matching
`docs/change-manifest.md` §1. `sys_scope` returns the identical single row.

## T0-2 — package name

`node -p "require('./package.json').name"` → `sn-hr-erp`. **PASS.**

## T0-9 — six properties survive deploy (F1 / L0-D5 confirmed)

```
$ npx now-sdk query sys_properties -a dev -q "nameSTARTSWITHx_335329_sn_hr_erp" \
    -f name,value,type,read_roles,write_roles
[now-sdk] Retrieved 6 record(s) from table 'sys_properties'
  x_335329_sn_hr_erp.asset_eol_within_days          180    integer  read: …viewer  write: …admin
  x_335329_sn_hr_erp.asset_high_value_amount      50000    integer  read: …viewer  write: …admin
  x_335329_sn_hr_erp.stale_after_hours               24    integer  read: …viewer  write: …admin
  x_335329_sn_hr_erp.asset_maintenance_due_days      30    integer  read: …viewer  write: …admin
  x_335329_sn_hr_erp.staging_retention_days          90    integer  read: …viewer  write: …admin
  x_335329_sn_hr_erp.sync_run_retention_days        730    integer  read: …viewer  write: …admin
```

**Six rows, correct values, correct roles. F1 is confirmed and L0-D5 holds.** `Property()` +
`Now.ID` deploys cleanly; the kickoff §9 workaround ("create the property in the browser, copy the
real sys_id back into keys") is **not needed and was not used**. The original trap was the
hand-written placeholder sys_id, not the property API — exactly as the architect reasoned.

**Count discrepancy, resolved:** `docs/change-manifest.md` §1 and the task brief both say *five*
`sys_properties`; `docs/l0-scaffold-design.md` §3 and §7 say **six**. The design document governs,
and six is right — the manifest's table predates OD1 splitting retention into
`staging_retention_days` **and** `sync_run_retention_days`. Both are governance-approved in §5.3 of
the manifest. **Six is correct.**

## T0-14 / no fabricated sys_id

```
$ grep -rnE "[0-9a-f]{32}" src/fluent/ | grep -v "generated/keys.ts" | wc -l   →  0
$ grep -rn "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" src/ | wc -l                     →  0
```

Every identity is `Now.ID['…']`. `src/fluent/generated/keys.ts` was written by the build and has
**no `deleted` block** — nothing was orphaned. The poisoned training-data sys_id named in the SDK
docs appears nowhere.

## T0-13 / T0-15

```
$ grep -rn "gs.hasRole" src/ | wc -l   →  0
```
No tables exist at L0, so T0-15's name-length grep has nothing to measure. C4 compliance is §8.4.

---

# 4. Gate item 2 — the four roles, and the empty containment graph

## T0-6 — four roles exist

```
$ npx now-sdk query sys_user_role -a dev -q "nameSTARTSWITHx_335329_sn_hr_erp" -f name,sys_id
[now-sdk] Retrieved 4 record(s) from table 'sys_user_role'
  0d725b70d93647d1af7c843fa8da56ec   x_335329_sn_hr_erp.hr_viewer
  11031a92b26c4e7ab34910721c4d2504   x_335329_sn_hr_erp.viewer
  76615979f2574cae8243969c09518e1c   x_335329_sn_hr_erp.finance_viewer
  875163d8147a4574bccc6c8814c8211f   x_335329_sn_hr_erp.admin
```

**Exactly four. PASS.** Record these four sys_ids — every later access-control assertion references
them.

## T0-7 — the containment graph is empty. This is the load-bearing one.

```
$ npx now-sdk query sys_user_role_contains -a dev \
    -q "role.nameSTARTSWITHx_335329_sn_hr_erp^ORcontains.nameSTARTSWITHx_335329_sn_hr_erp" \
    -f role,contains
[now-sdk] Retrieved 0 record(s) from table 'sys_user_role_contains'
[]
```

**Zero rows. PASS.** The query is deliberately two-sided (`role.name…` **OR** `contains.name…`), so
it would also catch a *platform* role that contains one of ours, not only containment among our own
four. Nothing.

This satisfies story L0-3 AC2 and AC3 in full:
- no `viewer → finance_viewer` row,
- no `finance_viewer → hr_viewer` row,
- no `hr_viewer → finance_viewer` row,
- and no row of any other shape either.

`containsRoles` is omitted entirely on all four `Role()` declarations, which is L0-D2's empty graph.
**Payroll access is not a side effect of finance access, and finance access is not a side effect of
anything.**

**Consequence, and it is designed, not a defect (L0-D2):** a user who should see Tab 1 needs **two**
roles granted — `viewer` **and** `finance_viewer`. A tester who grants `finance_viewer` alone and
finds the hub refuses has observed correct behaviour.

**Not met here:** story L0-3 AC4, AC5 and AC7 — the three test users and the as-that-user
verification. That is C5, §8.5.

---

# 5. Gate item 3 — the ampersand (OD8, story L0-2)

**Verdict: intact. `SN HR&ERP` stays. The `SN HR and ERP` fallback was not needed and was not
applied.** OD8 is closed in `docs/decision-log.md` with the full criterion-by-criterion table.

| Where | Read back |
|---|---|
| `sys_app.name` | `SN HR&ERP` — literal `&`, not `&amp;`, not `&#38;`, not truncated |
| `sys_scope.name` | `SN HR&ERP` |
| `sys_app_application.title` | `SN HR&ERP` |
| `sys_app_application.name` | `SN HR&ERP` |
| `sys_app_application.hint` | `SN HR&ERP configuration` |
| `sys_user_role.description` (viewer) | `…the SN HR&ERP hub…` — the `&` also survives inside a **field value**, not only a record name |

In the build artefact the SDK writes `<name>SN HR&amp;ERP</name>`. **That is correct XML escaping,
not corruption** — the instance un-escapes it on import, which the read-backs above prove.

**Criterion AC2 is N/A rather than passed, and the reason matters:** `now-sdk install` ships a
scoped application, not a captured update set.
`now-sdk query sys_update_set -q "nameLIKESN HR"` returns **zero rows** — there is no update-set
artefact to inspect. `docs/change-manifest.md` §1 already anticipated this.

**Criteria AC3 and AC4 were NOT executed — they need a browser.** The stored label is provably
correct; whether the Next Experience shell *renders* it and whether a generated link *truncates* at
the `&` is unverified. AC4 is additionally mitigated structurally: `docs/l0-scaffold-design.md` §6.3
mandates that **no** document, table label, property name or URL in any layer interpolates the app
name, so this app generates no such URL. Both are in §9's handover list.

---

# 6. The spikes

Both spikes were run in a **disposable project sandbox** outside the repo (`now.config.json`,
`package.json` and a symlinked `node_modules` copied into a scratch directory), and **neither was
ever installed**. This is stronger than the design's "delete the throwaway afterwards": nothing
reached `dev296062`, nothing entered this project's `keys.ts`, and there is no delete record to ship
on a future upgrade. The sandbox was removed at the end of the session.

## 6.1 Spike A (§6) — already answered, correctly, before this session

`docs/l0-scaffold-design.md` §6 specifies a live probe of `sys_user_has_role` as a
`finance_viewer`. **That spike was superseded before L0 began.** OD11 in `docs/decision-log.md`
records the question answered by live query on 2026-08-12: three active read ACLs on
`sys_user_has_role`, granting read to `role_delegator`, `user_admin`, `itil`,
`role_delegator_admin`, `ai_user_admin` — and a plain `finance_viewer` holds none of the five. The
decision log states it outright: *"Spike A is not needed; it is answered."*

**D14 is therefore the governing mechanism, not §6.2's Security Attribute fork:** ACLs enforce
record access; `gs.hasRole()` shapes the L4 payload in the caller's genuine session; scheduled jobs
make no role checks at all. **No new work was needed and none was invented.**

**Flagged as a live contradiction:** `docs/l0-scaffold-design.md` §6 still presents Spike A as an
open fork with two designed outcomes, and §11 R0-1 still lists *"Spike A returns zero"* as a risk.
D14 closed both. The L0 design document is stale on this point and should be amended to point at
D14 before a later reader re-runs a spike that has an answer. **Not amended by me** — it is the
architect's document and the answer is already recorded in the decision log.

## 6.2 Spike F7 — **RESOLVED, and `module-guide` wins**

The design flagged (F7) that `module-guide` and `scheduled-script-guide` contradict each other on
whether `ScheduledScript.script` accepts a module function. It resolved empirically on the first
build.

Declared with `script: f7SpikeJob` (a real function imported from a `src/server/*.ts` module),
`active: false`, `frequency: 'on_demand'`:

```
[now-sdk] Build completed successfully
```

and the generated `sysauto_script_*.xml` contains the SDK's own module bridge:

```
// @fluent-module f7SpikeJob;false;x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/spike-job.ts
// WARNING: This code is generated by the ServiceNow SDK in order to provide
// support for modular JavaScript. …
const { f7SpikeJob } = require('x_335329_sn_hr_erp/sn-hr-erp/0.0.1/src/server/spike-job.ts');
f7SpikeJob();
```

No diagnostic, no TypeScript error. **`scheduled-script-guide`'s "only accepts strings … must use an
IIFE" is stale for SDK 4.9.0.** Recorded as **D15**. L3's sync engine, the `RetentionCleaner` and
every test driver should be written as module functions.

**The honest limit:** this proves the **build** form. The spike was never installed, so the
`require()` bridge has **not executed on the instance**. The first L3 job to actually run is the
proof; if it throws, the fallback is `Now.include()` + IIFE and D15 gets a superseding entry.

The spike carried `active: false` and `frequency: 'on_demand'` from the first line — the §9 sin of a
driver left armed was never available to commit, because the record never left the sandbox.

## 6.3 L0-7 — the deny-ACL shape. **NOT DECIDED. This is the most important gap in L0.**

The design is emphatic (§5.3, L0-D4): *"Do not skip this because it 'obviously' works … guessing
polarity on a security control is how provenance becomes editable."* **The decisive test — a Table
API `PATCH` as a full admin against a protected field — could not be run.** §1.2.

What *was* established, and it is groundwork, not a verdict:

1. **Both shapes compile and emit well-formed ACL XML.** Shape A (`decisionType: 'deny'` +
   `script: 'answer = false;'` + `adminOverrides: false`) and Shape B (`decisionType: 'allow'`,
   `roles: []`, same script) both build. Both emit `<advanced>true</advanced>`,
   `<local_or_existing>Local</local_or_existing>`, and identical
   `<name>x_335329_sn_hr_erp_acltest.probe</name>`.
2. **`decision_type = deny` with `admin_overrides = false` is a live, supported construct on
   `dev296062`** — not a theoretical API. Verified against OOB records:
   ```
   $ npx now-sdk query sys_security_acl -a dev -q "decision_type=deny^active=true" \
       -f name,operation,admin_overrides,decision_type
     cmdb_rel_filter               admin_overrides=false  decision_type=deny
     cmdb_health_scorecard_service admin_overrides=false  decision_type=deny
     …
   ```
   So Shape A is not dead on arrival, which was the cheapest way this could have failed.
3. **A silent build-time trap that would have applied to Shape A anyway** — `adminOverrides`
   **defaults to `true`**. See §10, trap T4. A deny ACL that omits the flag is overridden by admin,
   which is precisely the failure L0-7 exists to prevent.

**A deliberately rejected substitute.** Redeploying a `Record()` fixture with a changed value would
have made the *install* attempt an admin write against the deny ACL. It was rejected: application
installs import at a privileged level rather than through ACL-checked `GlideRecord`, so a "value
changed" result would not tell you anything about an interactive or Table API admin write, and a
"value unchanged" result is equally explainable by the SDK skipping an unchanged record. **A test
whose result cannot be interpreted is worse than no test**, because it produces a green line in a
report. It was not run and no verdict is claimed.

**L0-7 and T0-11 are OPEN. §9 carries the exact steps.**

---

# 7. Gate item 4 — throwaway artefacts, and the tooling traps exercised on purpose

## T0-17 — zero throwaway artefacts on the instance

```
$ npx now-sdk query sys_db_object -a dev -q "nameLIKEacltest^ORname=x_335329_sn_hr_erp_acltest" -f name
[now-sdk] Retrieved 0 record(s) from table 'sys_db_object'

$ npx now-sdk query sysauto_script -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f name,active,run_type
[now-sdk] Retrieved 0 record(s) from table 'sysauto_script'

$ npx now-sdk query sys_security_acl -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f name,operation
[now-sdk] Retrieved 0 record(s) from table 'sys_security_acl'

$ npx now-sdk query sys_db_object -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f name
[now-sdk] Retrieved 0 record(s) from table 'sys_db_object'
```

**Four queries, zero rows each. PASS.** No scheduled job exists in this scope at all, armed or
otherwise. No table exists in this scope, which is correct for L0.

## L0-5 / T0-3 — both tooling traps reproduced, messages verbatim

Exercised for real, not simulated. The trigger was a genuine build failure (§10, trap T2), which
made this free.

**Trap 1 — a failed build empties the output directory, and the next install fails.**

```
[now-sdk] ERROR: Found 12 diagnostic error(s) while building the project.
[now-sdk] ERROR: Build failed due to errors

$ find dist -type f
(nothing — dist/ exists and is empty)

$ npx now-sdk install -a dev
[now-sdk] Starting installation...
[now-sdk] Attempting to log into instance https://dev296062.service-now.com as admin.
[now-sdk] ERROR: No files found in /…/sn-hr-erp/dist/app directory to create zip.
```

Independently reproduced a second time in the sandbox on a different failure (`TS213`), confirming
it is the failure path and not one specific error.

**Trap 2 — a source edit plus a bare install silently deploys the *previous* build and reports
success.** This is the dangerous one, and the evidence is unambiguous:

```
# source edited: stale_after_hours  value: 24  →  value: 99.   NO BUILD RUN.
$ npx now-sdk install -a dev
[now-sdk] Starting installation...
[now-sdk] Rollback (undo installation): https://dev296062.service-now.com/sys_rollback_context.do?sys_id=9525242f472e87100739b71f316d435d
[now-sdk] Installation completed. Access the application at: …

$ npx now-sdk query sys_properties -a dev -q "name=x_335329_sn_hr_erp.stale_after_hours" -f name,value
[
  {
    "name": "x_335329_sn_hr_erp.stale_after_hours",
    "value": "24"
  }
]
```

**Source says 99. Install reported "Installation completed." The instance holds 24.** No warning, no
diagnostic, a rollback context generated as if work had been done. Source was then restored to 24
and a proper `build && install` run.

**This is why `build && install` is non-negotiable, and it is now documented rather than assumed —
story L0-1 AC3 and AC4 satisfied with observed output.**

---

# 8. The five governance conditions

## 8.1 C1 — `erp_system.accessibleFrom` → `package_private`. **MET.**

**Fixed in the L1 design document, as instructed. L1 was not built.**

`docs/l1-control-tower-design.md` line 114 changed `'public'` → `'package_private'`, and a new
**§3.0** records why, at length: `erp_system` holds `base_url`, three auth-profile references and MID
config; D4 removed every cross-scope consumer; L2 already applied identical reasoning to
`ErpConnector`; **no consumer justifying `public` exists or is planned**.

**Two things found while fixing it that make C1 bigger than one line:**

- SDK 4.9.0 `table-api`: *"`accessibleFrom` … **Default is `public`**."* So a `Table()` that simply
  omits the flag is public. §3.0 therefore mandates declaring it **explicitly on every `Table()` at
  every layer**, not just on `erp_system`. An omitted flag is a silent widening.
- The documented cost is recorded rather than glossed: `package_private` *"will prevent the table
  from being selectable in some platform features such as Business Rules"* — from **other** scopes.
  This app's own L1 config-validation business rule is in-scope and unaffected.

## 8.2 C2 — uninstall behaviour for staged data. **MET — and it reverses the governance finding.**

`docs/l3-staging-design.md` gains **§6a**. The word "uninstall" now appears in a design document.

**The manifest's G-2 assumption was wrong, in the unsafe direction.** G-2 inferred *"scoped tables
drop with the app, so staged financial data goes with it."* Grounded against
`ServiceNowOfficialDocs/platform-administration/t_UninstallApplications.md` via the `sn-rag` corpus
(reachable, used):

> 6. To delete all data associated with this application, clear the **Retain tables and data** check
>    box. **Leave this check box selected to remove only application files.**

**The retain option is the thing you must actively clear.** An admin who clicks through the
uninstall dialog removes the application files and **leaves `x_335329_sn_hr_erp_staging` and every
row of staged ERP financial data on the instance** — with no app, no in-scope ACLs evaluating, and
no `RetentionCleaner` to age it out. The data outlives the controls built to protect it.

Worse, the same page states that where a dependent application was previously uninstalled with
tables retained, *"the `Retain tables and data` check box is selected by default and **can't be
cleared**."*

§6a states the consequence as a **two-step decommission procedure whose second step is not
optional**: uninstall (or delete), **then verify the staging table is gone**. It also distinguishes
*delete* (correct path on `dev296062`, never shared) from *uninstall* (the shared-instance path
where the risk is live).

**Verification status, stated honestly in §6a.3: documented, not executed.** Executing it means
uninstalling the application, and at L0 the application is the thing being built. The exact
verification step is written down for whoever runs it on a throwaway PDI or at end of life.

## 8.3 C3 — the consolidated ACL inventory. **MET.**

**Every ACL this application will create, in one table, before L1 starts.** Consolidated from
`docs/l0-scaffold-design.md` §5.2/§5.3/§5.4/§5.7, `docs/l1-control-tower-design.md` §6 and
`docs/l6-document-design.md` §3. Logical names on the left; §8.4 maps them to physical names.

**Reading the table:** `adminOverrides` is the *specified* value. **It must be written explicitly on
every single ACL** — see §10 trap T4: the SDK default is `true`, so an omitted flag on a deny rule
silently hands admin the override the rule exists to remove.

### 8.3.1 Table-level ACLs — 34 rules

| # | Table | Op | Roles | decisionType | adminOverrides | Layer | Note |
|---|---|---|---|---|---|---|---|
| 1 | `erp_system` | read | `viewer` | allow | true | L1 | connection fields further restricted, §8.3.2 |
| 2 | `erp_system` | create | `admin` | allow | true | L1 | |
| 3 | `erp_system` | write | `admin` | allow | true | L1 | |
| 4 | `erp_system` | delete | `admin` | allow | true | L1 | |
| 5 | `object_map` | read | `admin` | allow | true | L1 | **not `viewer`** — story L1-3 asserts a viewer-only user cannot read it |
| 6 | `object_map` | create | `admin` | allow | true | L1 | |
| 7 | `object_map` | write | `admin` | allow | true | L1 | |
| 8 | `object_map` | delete | `admin` | allow | true | L1 | |
| 9 | `field_map` | read | `admin` | allow | true | L1 | inherits `object_map`'s sensitivity |
| 10 | `field_map` | create | `admin` | allow | true | L1 | |
| 11 | `field_map` | write | `admin` | allow | true | L1 | |
| 12 | `field_map` | delete | `admin` | allow | true | L1 | |
| 13 | `mapping_template` | read | `admin` | allow | true | L1 | |
| 14 | `mapping_template` | create | `admin` | allow | true | L1 | |
| 15 | `mapping_template` | write | `admin` | allow | true | L1 | |
| 16 | `mapping_template` | delete | `admin` | allow | true | L1 | |
| 17 | `call_log` | read | `viewer` | allow | true | L2 | |
| 18 | `call_log` | **create** | **`viewer`** | allow | true | L2 | **deliberate — do not tidy.** §5.5: the connector logs as the invoking user; admin-only insert means a `viewer`-triggered refresh silently produces no telemetry, indistinguishable at L4 from "no call attempted" |
| 19 | `call_log` | delete | `admin` | allow | true | L2 | |
| — | `call_log` | write | **NO ACL EXISTS** | — | — | L2 | immutability is the point (§5.5) |
| 20 | `erp_staging` | read | `viewer` | allow | true | L3 | |
| — | `erp_staging` | create / write / delete | **NO ACL EXISTS** | — | — | L3 | L0-D6. Written only by the `ScheduledScript` sync engine, which runs as `system`. A fabricated staging row is a number on a tile |
| 21 | `sync_run` | read | `viewer` | allow | true | L3 | `error_message` field-restricted, §8.3.2 |
| — | `sync_run` | create / write / delete | **NO ACL EXISTS** | — | — | L3 | immutable after the engine finishes it |
| 22 | `employee_xref` | read | `hr_viewer` | allow | true | L6 | story L6-1: a `finance_viewer`-only user is refused |
| 23 | `employee_xref` | create | `admin` | allow | true | L6 | |
| 24 | `employee_xref` | write | `admin` | allow | true | L6 | |
| 25 | `employee_xref` | delete | `admin` | allow | true | L6 | |
| 26 | `document_type` | read | `viewer` | allow | true | L6 | |
| 27 | `document_type` | create | `admin` | allow | true | L6 | |
| 28 | `document_type` | write | `admin` | allow | true | L6 | |
| 29 | `document_type` | delete | `admin` | allow | true | L6 | |
| 30 | `document_template` | read | `admin` | allow | true | L6 | template bodies are not viewer-readable |
| 31 | `document_template` | create | `admin` | allow | true | L6 | |
| 32 | `document_template` | write | `admin` | allow | true | L6 | |
| 33 | `document_template` | delete | `admin` | allow | true | L6 | |
| 34 | `document_request` | read | **script, no role** | allow | true | L6 | §5.7 — ownership check, see 8.3.4 |
| 35 | `document_request` | read | `hr_viewer` | allow | true | L6 | second allow ACL granting the broad read |
| 36 | `document_request` | create | *any authenticated* | allow | true | L6 | L0 §4.2: self-service is open to any authenticated user, bounded server-side by `subject == caller` |
| 37 | `document_request` | delete | `admin` | allow | true | L6 | |
| — | `document_request` | write | **NO ACL EXISTS** | — | — | L6 | |

**`—` means no ACL is written at all, and that is stronger than a restrictive one: there is nothing
for a future contributor to widen.** Seven such gaps above, each deliberate.

### 8.3.2 Field-level READ restrictions — 7 rules

| # | Table.field | Op | Roles | decisionType | adminOverrides | Layer | Why |
|---|---|---|---|---|---|---|---|
| 38 | `erp_system.base_url` | read | `admin` | allow | true | L1 | endpoint |
| 39 | `erp_system.auth_profile_basic` | read | `admin` | allow | true | L1 | credentials |
| 40 | `erp_system.auth_profile_oauth` | read | `admin` | allow | true | L1 | credentials |
| 41 | `erp_system.auth_profile_mutual` | read | `admin` | allow | true | L1 | credentials |
| 42 | `erp_system.mid_server` | read | `admin` | allow | true | L1 | topology |
| 43 | `object_map.query_template` | read | `admin` | allow | true | L1 | filter syntax can carry identifiers |
| 44 | `sync_run.error_message` | read | `admin` | allow | true | L3 | **load-bearing on L4 (L0-D7).** Composed from `RESTMessageV2.getErrorMessage()`, which quotes the URL. A `viewer` reading `sync_run` sees `status=failed` and no reason — correct. L4 must compose "ERP did not answer" from `status` alone and never echo `error_message` into a non-admin payload |

### 8.3.3 Field-level HARD DENY-WRITE — ~24 rules. **Shape unproven — see §6.3.**

**Nobody, admin included, can hand-edit provenance.** Every rule here carries
**`adminOverrides: false`**, and every one is blocked on L0-7's undecided shape.

| # | Table.field(s) | Op | Roles | decisionType | adminOverrides | Layer |
|---|---|---|---|---|---|---|
| 45–56 | `erp_staging`: `erp_system`, `erp_category`, `logical_object`, `source_record_id`, `fetched_at`, `sync_run`, every promoted/typed column (`amount`, `qty`, `threshold`, `ratio`, `status`, `dim`, `label`, `code`, `occurred_on`) and `payload` | write | none | **deny** | **false** | L3 |
| 57 | `sync_run` — **every field** (`*`) | write | none | **deny** | **false** | L3 |
| 58 | `object_map.mapping_source` | write | none | **deny** | **false** | L1 |
| 59 | `object_map.mapping_verified` | write | none | **deny** | **false** | L1 |
| 60 | `document_request.requester` | write | none | **deny** | **false** | L6 |
| 61 | `document_request.generated_on` | write | none | **deny** | **false** | L6 |
| 62 | `document_request.source_call_ids` | write | none | **deny** | **false** | L6 |
| 63 | `document_request.output_format` | write | none | **deny** | **false** | L6 |
| 64 | `document_request.status` | write | none | **deny** | **false** | L6 |
| 65 | `document_request.failure_reason` | write | none | **deny** | **false** | L6 |
| 66 | `document_request.pdf_probe_result` | write | none | **deny** | **false** | L6 |

**Three reconciliations the reviewer should know about, found by consolidating:**

1. **`document_request.pdf_probe_result`** is in `l6-document-design.md:184`'s deny-write list but
   **missing** from `l0-scaffold-design.md` §5.3's. The **union** is taken — it is a system-derived
   probe result and belongs under deny-write.
2. **`object_map.mapping_source` / `.mapping_verified`** are in `l1-control-tower-design.md:436` but
   **absent** from L0 §5.3, which instead names `object_map.field_map_generated` — a field
   explicitly **not built** (OD4 deleted the JSON blob). L0 §5.3's `object_map` row is **stale**;
   L1's is correct and is what this inventory carries.
3. **`erp_system.circuit_open_until` is deliberately NOT deny-write** (`l1:440`) — spec §5.1 calls it
   *"admin-editable for manual reset"*. It is operational state, not provenance. Recorded so nobody
   "completes" the deny set by adding it.

### 8.3.4 The one script ACL, and why it is not a role check

```ts
Acl({
  $id: Now.ID['acl-doc-req-read'],
  type: 'record', table: 'x_335329_sn_hr_erp_doc_req', operation: 'read',
  decisionType: 'allow',
  script: 'answer = (current.requester == gs.getUserID()) || (current.subject_employee == gs.getUserID());',
  adminOverrides: true,
  description: 'A requester sees their own requests. hr_viewer sees all, via a second allow ACL.',
})
```

`gs.getUserID()` is an **ownership** check, not a role check. §9's warning is specifically about
`gs.hasRole()` under `runAs`, and D14 governs role checks. This is the only script ACL in the app
outside §8.3.3's deny rules.

### 8.3.5 Inventory totals and the standing rules

- **~66 ACLs total**: 37 table-level, 7 field-read, ~24 field deny-write, of which 1 is a script ACL.
- **`createAccessControls: false` on every `Table()`, every layer, no exceptions** (L0 §5.1).
  Story L0-4 asserts a `sys_security_acl` query for this scope returns **only** ACLs present in
  source.
- **Every ACL carries a `description` naming the role it serves** (story L0-4's last criterion).
- **The Trinity** (`security-guide`): roles **AND** condition **AND** script must all evaluate true.
  An ACL is never given both a role and a script unless both are meant to be required.
- **`roles` for role checks, never scripts** — scripts appear only in §8.3.3's deny rules and
  §8.3.4's ownership boundary.
- **Every ACL is `$id: Now.ID['acl-<table>-<op>[-<field>]']`.** No literal sys_id, ever.
- **`adminOverrides` is written explicitly on all ~66.** §10 trap T4.

**Current state on the instance: 0 ACLs, correctly.** They land with their tables at L1/L3/L6.

## 8.4 C4 — canonical table names. **MET, trivially and by construction.**

**No table was created at L0.** The only table name written anywhere in this session was the
throwaway `x_335329_sn_hr_erp_acltest` (25 chars) in a sandbox that was never installed and has been
deleted. `now-sdk query sys_db_object -q "sys_scope.scope=x_335329_sn_hr_erp"` returns **0 rows**.

The canonical names from `docs/l0-scaffold-design.md` §2.2, restated so the L1 session has them
without re-deriving, all ≤ 30 characters:

| Logical | Physical | Len | Layer |
|---|---|---|---|
| `erp_system` | `x_335329_sn_hr_erp_erp_system` | 29 | L1 |
| `object_map` | `x_335329_sn_hr_erp_object_map` | 29 | L1 |
| `field_map` | `x_335329_sn_hr_erp_field_map` | 28 | L1 |
| `mapping_template` | `x_335329_sn_hr_erp_map_tmpl` | 27 | L1 |
| `call_log` | `x_335329_sn_hr_erp_call_log` | 27 | L2 |
| `erp_staging` | `x_335329_sn_hr_erp_staging` | 26 | L3 |
| `sync_run` | `x_335329_sn_hr_erp_sync_run` | 27 | L3 |
| `employee_xref` | `x_335329_sn_hr_erp_emp_xref` | 27 | L6 |
| `document_type` | `x_335329_sn_hr_erp_doc_type` | 27 | L6 |
| `document_template` | `x_335329_sn_hr_erp_doc_tmpl` | 27 | L6 |
| `document_request` | `x_335329_sn_hr_erp_doc_req` | 26 | L6 |

**Never the five over-length names in `docs/stories.md` (D13).**

## 8.5 C5 — verification as a genuine non-admin user. **NOT MET.**

**Stated plainly: not met, and not partially met.** No test user was created, therefore no
access-control assertion in this report is evidenced by a non-admin session. Reason in §1.2 — no
write path.

Everything in §3–§7 was verified **as admin**, which is fine for those assertions because they are
existence and configuration facts, not access decisions. **No access decision is claimed anywhere in
this report.**

This matters more here than on a typical project, and the manifest says why: on the
`sys_user_has_role` ACL specifically, `admin_overrides: true` means **admin passes the very ACL that
denies everyone else**. Admin is not merely insufficient — it is actively misleading. That is
exactly why C5 exists and exactly why it is reported unmet rather than papered over.

**Open and traceable:** story L0-3 AC4/AC5/AC7, tests T0-8, T0-12, T0-16, and design step L0-6.
Steps in §9.

---

# 9. Handover — what L1 must not start without

**Five tasks. Four need a browser; the fifth needs a decision.** L1's first act is to create tables,
and each table's ACLs land with it — so **L0-7's undecided shape blocks the deny-write ACLs on
`object_map` from being written correctly.**

| # | Task | Who | Blocks |
|---|---|---|---|
| **H1** | **Create the three test users** `hrerp_viewer_only`, `hrerp_finance_only`, `hrerp_hr_only`, each holding **exactly one** app role and **no** `itil` / `admin` / `user_admin`. Record the three sys_ids into this report. Verify with `now-sdk query sys_user_has_role -a dev -q "user.user_name=hrerp_finance_only"` → exactly one app role | human, browser | **C5**, story L0-3 AC4/AC5/AC7, T0-8, and every access-control assertion in L1–L6 |
| **H2** | **Decide the deny-ACL shape (L0-7 / T0-11).** Deploy a throwaway `x_335329_sn_hr_erp_acltest` with Shape A on one field, `PATCH` that field via the Table API **as a full admin**, re-read. Value unchanged → Shape A. Value changed → apply Shape B and repeat. **An admin who can edit it fails the test and the shape is wrong.** Record in the decision log; delete the throwaway table | human or a session with Table API write | **all ~24 deny-write ACLs** (§8.3.3), starting with `object_map.mapping_source` / `.mapping_verified` at **L1** |
| **H3** | **Ampersand AC3/AC4.** Open the app from the Next Experience picker — label must read `SN HR&ERP`. Open a `.do` link that carries the name as a parameter — a truncation at `&` is a FAIL. If either fails, reopen OD8; the fallback is one line in `now.config.json` (`name` only; `scope` and the npm package name stay) | human, browser | closing OD8 with confidence rather than on partial evidence |
| **H4** | **T0-10.** `PATCH` `x_335329_sn_hr_erp.stale_after_hours` 24 → 1 via the Table API, re-read, confirm it changed **with no redeploy**, then set it back to 24 | human or Table API write | story L3-4 AC1 |
| **H5** | **T0-16** (after L1 creates `object_map`). As `hrerp_viewer_only`: no config module in the navigator; then navigate directly to `x_335329_sn_hr_erp_object_map_list.do` and confirm a **security message**, not an empty list. An empty list reads as "no systems configured" and is a §7 violation delivered by an ACL | human, browser, post-L1 | story L5-9 AC4 |

**Also carry forward:**

- **The application menu has no modules.** `sys_app_application` was created (gated on
  `x_335329_sn_hr_erp.admin`); no `Module()` records were declared, because their target tables do
  not exist at L0 and a module pointing at a non-existent table is a broken link, not a scaffold.
  **L1 adds its own modules to this menu.** Links use `_list.do`, never `.list` (§9).
- **Global-scope expectation is now four rows, not zero** — D16. A **fifth** row is a finding.
- **`docs/l0-scaffold-design.md` §6 and §11 R0-1 are stale** — Spike A was answered by OD11/D14
  before L0 began. Amend or a later reader will re-run a resolved spike.
- **`docs/l0-scaffold-design.md` §5.3's `object_map` deny-write row is stale** — it names
  `field_map_generated`, a field OD4 deleted. §8.3.3 note 2.
- **Declare `accessibleFrom: 'package_private'` explicitly on every `Table()`** — the SDK default is
  `public` (§8.1).
- **Declare `adminOverrides` explicitly on every `Acl()`** — the SDK default is `true` (§10 T4).
- **Declare `allowWebServiceAccess: true` explicitly on every `Table()`** — the SDK default is
  `false` and ~40 acceptance criteria are worded "verified via the Table API" (F3).
- **`actions: ['read']` — an array, not `{ read: true }`** (F2). Confirmed in `table-api`.
- **Write `ScheduledScript` bodies as module functions** (D15), and expect the first live run to be
  the proof that the `require()` bridge executes.

---

# 10. Traps hit this session

Five. **T2, T3 and T4 are not in §9 of the kickoff spec and should be added.**

| # | Trap | Cost | Detail |
|---|---|---|---|
| **T1** | *(already in §9)* `now-sdk install` does not build | none — expected | Reproduced deliberately, §7. Source `99`, instance `24`, "Installation completed." |
| **T2** | **NEW — a Fluent `.now.ts` file rejects ES6 shorthand property assignment** | one failed build | `const roles = { read: [viewer], write: [admin] }` then `roles,` inside six `Property()` calls produced **12 diagnostics**: `TS304: Node kind "ShorthandPropertyAssignment" is not allowed in Fluent files` and `TS304: Only property assignments are allowed`. `.now.ts` files are parsed as a **restricted AST**, not compiled as TypeScript — the build reads the source declaratively, so a hoisted variable and a shorthand key are both unavailable. **Fix: write `roles: { … }` inline at every call site.** This is the same root cause as §9's `Symbol(CallExpressionShape)` trap — *"`Record()` data values are strings, evaluated at build time from the source expression, not executed JavaScript"* — but it bites on **object shape**, not just on computed string values, and it fails loudly rather than silently. **Worth adding to §9 because DRY instincts push straight into it.** |
| **T3** | **NEW — a `Table()` must be a named export whose variable name equals the table name** | one failed build (sandbox) | `TS213: Table definition should be exported as a named export with the name 'x_335329_sn_hr_erp_acltest'`. A bare `Table({ … })` will not build. **L1 creates four tables and will hit this four times if it is not written down.** Required form: `export const x_335329_sn_hr_erp_erp_system = Table({ name: 'x_335329_sn_hr_erp_erp_system', … })` |
| **T4** | **NEW, and the most dangerous — `Acl.adminOverrides` defaults to `true`** | none, caught by reading the SDK before writing an ACL | `node_modules/@servicenow/sdk-build-plugins/dist/acl-plugin.js:166` — `admin_overrides: $.from('adminOverrides').def(true)`. Also `active → true`, `decisionType → 'allow'`, `localOrExisting → 'Local'`. **A deny ACL that omits `adminOverrides` is silently admin-overridable — the exact failure the ~24 deny-write rules exist to prevent, arriving on a clean build with no diagnostic.** It would pass every admin-run test for the worst possible reason. `acl-api` documents the property but not its default. **Add to §9.** |
| **T5** | **NEW — four Global-scope records appear that no source file asked for** | ~10 min of "did we violate the Global rule" | Deploying four `sys_user_role` records causes the platform to write four `sys_embedded_help_role` rows into **Global**, authored by `system`, one per role, pointing at exactly this app's four role sys_ids. They are not in `dist/`. Recorded as **D16**; the criterion is reworded to "created by this app's source or deploy payload", with the four enumerated. **Add to §9** — any project asserting "zero Global records" will trip on this the moment it creates a role |

**A trap deliberately *not* hit:** the `sys_properties` placeholder-sys_id trap (§9, and the
Capacity Planner's original wound). Every property used `Property()` + `Now.ID`; all six deployed
first time. **F1 and L0-D5 are confirmed correct — the workaround is not needed.**

---

# 11. Contradictions found against the design documents

| # | Document | Contradiction | Resolution |
|---|---|---|---|
| 1 | `l0-scaffold-design.md` §6, §11 R0-1 | Presents **Spike A** as an open fork with two designed outcomes and lists "Spike A returns zero" as a live risk | **Already answered** by OD11's live query and closed by **D14** before L0 began. The L0 document is stale. Not amended by me — the architect owns it, and the answer is in the decision log |
| 2 | `l0-scaffold-design.md` §5.3 | `object_map`'s deny-write row names `field_map_generated`, *"not built"* | **OD4 deleted that field entirely.** `l1:436` names the real fields: `mapping_source`, `mapping_verified`. §8.3.3 carries L1's version |
| 3 | `l0-scaffold-design.md` §5.3 vs `l6-document-design.md:184` | L6 adds `pdf_probe_result` to `document_request`'s deny-write list; L0 omits it | **Union taken.** It is system-derived. §8.3.3 |
| 4 | `change-manifest.md` §1 + task brief vs `l0-scaffold-design.md` §3/§7 | *five* `sys_properties` vs **six** | **Six is correct** — OD1 split retention into `staging_retention_days` **and** `sync_run_retention_days`, both approved in manifest §5.3. Six deployed. §3 |
| 5 | `change-manifest.md` G-2 | *"Scoped tables drop with the app, so staged financial data goes with it"* | **Wrong, in the unsafe direction.** Uninstall's `Retain tables and data` is **selected by default**. §8.2 / L3 §6a |
| 6 | `l0-scaffold-design.md` §8 L0-4, story L0-2 AC2 | Expects a *"generated update set / application-file name"* carrying the app name | **No update set is generated.** `now-sdk install` ships a scoped application; `sys_update_set` LIKE `SN HR` → 0 rows. Manifest §1 already said so. AC2 is **N/A**, not failed; equivalent name-carrying artefacts all verified §5 |
| 7 | SDK internal — `scheduled-script-guide` vs `scheduledscript-api` + `module-guide` | Guide: *"only accepts strings … does not accept function types … will produce a TypeScript error"* | **The guide is stale for 4.9.0.** The module form builds and generates the SDK's own `require()` bridge. **D15**. §6.2 |
| 8 | `l0-scaffold-design.md` §7 (properties `roles`) | `read: [viewer]`, `write: [admin]` — so a holder of only `x_335329_sn_hr_erp.admin` is **not** in the read list | Built as designed. **Low impact**: `read_roles` gates the System Properties surface, not `gs.getProperty()` at runtime, and platform `admin` passes regardless. **Flagged for the architect** — if an app-admin should read these in the UI, add `admin` to `read` at L1; it is a one-line change |

---

# 12. Evidence appendix — every verification command

Run against `https://dev296062.service-now.com`, alias `dev`, 2026-08-12. All read-only.

```bash
npx now-sdk query sys_app              -a dev -q "scope=x_335329_sn_hr_erp" -f scope,name,version,sys_id
npx now-sdk query sys_scope            -a dev -q "scope=x_335329_sn_hr_erp" -f name,scope,sys_id,version
npx now-sdk query sys_user_role        -a dev -q "nameSTARTSWITHx_335329_sn_hr_erp" -f name,sys_id,description
npx now-sdk query sys_user_role_contains -a dev \
    -q "role.nameSTARTSWITHx_335329_sn_hr_erp^ORcontains.nameSTARTSWITHx_335329_sn_hr_erp" -f role,contains
npx now-sdk query sys_properties       -a dev -q "nameSTARTSWITHx_335329_sn_hr_erp" \
    -f name,value,type,read_roles,write_roles
npx now-sdk query sys_app_application  -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f title,name,hint,roles,active
npx now-sdk query sys_update_set       -a dev -q "nameLIKESN HR" -f name,state,application
npx now-sdk query sys_metadata         -a dev -q "sys_scope=global^sys_created_on>javascript:gs.beginningOfToday()" -f sys_class_name
npx now-sdk query sys_embedded_help_role -a dev -q "sys_created_on>javascript:gs.beginningOfToday()" -f role,sys_scope,sys_created_by,sys_id
npx now-sdk query sys_security_acl     -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f name,operation
npx now-sdk query sys_security_acl     -a dev -q "decision_type=deny^active=true" -f name,operation,admin_overrides,decision_type
npx now-sdk query sys_db_object        -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f name
npx now-sdk query sys_db_object        -a dev -q "nameLIKEacltest^ORname=x_335329_sn_hr_erp_acltest" -f name
npx now-sdk query sysauto_script       -a dev -q "sys_scope.scope=x_335329_sn_hr_erp" -f name,active,run_type
```

Local:

```bash
node -p "require('./package.json').name"                                    # sn-hr-erp
grep -rn "gs.hasRole" src/ | wc -l                                          # 0
grep -rnE "[0-9a-f]{32}" src/fluent/ | grep -v "generated/keys.ts" | wc -l   # 0
grep -rn "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" src/ | wc -l                     # 0
grep -n "deleted" src/fluent/generated/keys.ts                              # no orphan block
```

## 12.1 Source tree as delivered

```
now.config.json                        scope, scopeId, name (unchanged) + tsconfigPath
package.json                           unchanged; name = sn-hr-erp
src/server/tsconfig.json
src/fluent/security/roles.now.ts       4 × Role(), all containsRoles omitted
src/fluent/properties/thresholds.now.ts 6 × Property(), Now.ID, no literal sys_id
src/fluent/navigation/app-menu.now.ts  1 × ApplicationMenu(), roles: [admin], no modules
src/fluent/generated/keys.ts           build-generated; 8 explicit + 4 composite keys; no deletes
```

## 12.2 Deploy payload — the complete contents of `dist/app/`

```
scope/sys_app_f5a9e167140b4883b0fc301112c0f2bb.xml
update/sys_app_application_d94b6401d6f247998f474fee15a3b8ac.xml
update/sys_module_ab1b6c76e2574558b55e6653b237f00d.xml      (package_json)
update/sys_module_ba6f48024ee545a290dfeba333a9c5c7.xml      (bom_json)
update/sys_properties_*.xml                                 × 6
update/sys_user_role_*.xml                                  × 4
```

**14 files. No `sys_embedded_help_role`, no ACL, no table, no scheduled job.** This is the payload
D16's Global-scope finding is measured against.
