---
title: L0 — Scaffold, scope, roles, ACL skeleton
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-12
status: design-only. No instance record was created producing this document.
grounding: |
  Fluent API shapes in this document were read from the SDK shipped with this repo
  (`@servicenow/sdk` 4.9.0) via `npx @servicenow/sdk explain <topic> --format=raw`.
  Topics used: table-api, table-guide, acl-api, security-guide, role-api, property-api,
  now-id-guide, keys-file, scriptinclude-api, script-include-guide, module-guide.
  CLI flags were read from `npx now-sdk <cmd> --help`. Platform claims are cited to the
  ServiceNow documentation corpus via the `sn-rag` MCP (reachable). Instance claims were
  verified live against `dev296062` with `npx now-sdk query`.
---

# 0. What L0 is for

L0 creates nothing anyone can look at. It creates the things every later layer is
unbuildable without: the scope, the four roles, the ACL *shapes* (proven, not assumed), the
naming budget, and the two spikes that decide whether L4's security model works at all.

**L0 has three jobs the spec does not name, and they are the ones that will hurt if skipped:**

1. **The table-name budget** (§2). Five of the table names written into `docs/stories.md` are
   unbuildable with the mandated toolchain. This is discovered at L0 or it is discovered at L6.
2. **Proving which ACL shape actually refuses an admin write** (§5.3). "Hard deny-write" is a
   requirement, not an API. Two candidate shapes exist. One test decides.
3. **Spike A — can a non-admin read `sys_user_has_role`?** (§6). Every security-relevant role
   check in this app depends on the answer, and the answer is not knowable from documentation.

---

# 1. SDK facts that override the kickoff spec

Per instruction: where the SDK docs contradict `docs/SN-HR-ERP-master-kickoff-prompt.md` on an
**API fact**, the SDK docs win, and the contradiction is stated rather than silently reconciled.

| # | Spec / prior art says | SDK 4.9.0 `explain` says | Effect on this design |
|---|---|---|---|
| **F1** | §9: "`sys_properties` declared via the Fluent `Record()` pattern with a placeholder sys_id are silently skipped on deploy. Create the property in the browser, copy the real sys_id back into keys." | There is a first-class **`Property()`** API (`property-api`), and **`now-id-guide`** states: *"Never invent or generate a sys_id value. **Always** use `Now.ID['descriptive-key']`… The build system is the only safe source of new sys_id values."* `keys-file` confirms the sys_id is auto-generated on first build and stable thereafter. | The trap is a consequence of hand-writing a **placeholder sys_id**, not of properties. **Every property in this app uses `Property()` + `Now.ID['…']` and no hand-written sys_id ever appears in `keys.ts`.** The browser-creation workaround is *not* part of this design. A post-deploy verification query is still mandatory (§7 T0-7) — belt and braces, because story L3-4 requires it. |
| **F2** | Sibling source uses `actions: { read: true }` on every `Table()`. | `table-api`: `actions` is `('read' \| 'update' \| 'delete' \| 'create')[]` — **an array**. | Every table in this app declares `actions: ['read']`. The sibling's object form is from an older SDK and must not be copy-pasted. |
| **F3** | Neither spec nor sibling mentions `allowWebServiceAccess`. | `table-api` / `table-guide`: *"defaults to `false` … without it, REST calls return 403 'User Not Authorized' even when ACLs are correctly configured."* | **Every table declares `allowWebServiceAccess: true`.** Load-bearing: ~40 acceptance criteria across `docs/stories.md` are worded "verified via the Table API". Verified live that the sibling's tables carry `ws_access: true` on the instance — so the older SDK set it, and 4.9.0's documented default would silently break every one of those criteria. |
| **F4** | Spec is silent on table-name length. | `table-guide`: *"Table names are limited to max length of 30"*, and *"These are **enforced by the build** — the table plugin emits diagnostics (errors) when they are violated."* | See §2. Five story-named tables are unbuildable. |
| **F5** | §1.2 / D1: the built JS asset is registered as a `sys_ux_lib_asset`. | `ui-page-guide` / `ui-page-patterns-guide`: the UiPage takes `html: <imported src/client/index.html>` plus `direct: true`, and *"The build system handles ALL build processes automatically."* No `sys_ux_lib_asset` appears anywhere in the UI Page documentation. | L5 uses the SDK-documented delivery path. Detail and the vanilla-JS-vs-React consequence are in `docs/l5-ui-design.md` §1. Flagged for the human there. |
| **F6** | §9: "After deploying a BYOUI page, **hard-refresh**. The JS asset is aggressively cached." | `ui-page-patterns-guide` mandates `<script src="main.tsx?uxpcb=$[UxFrameworkScriptables.getFlushTimestamp()]" type="module">` and states *"The `uxpcb` parameter is required to ensure that stale UI Page contents are not mistakenly cached."* | The platform has a supported cache-buster. L5 uses it. The hard-refresh step stays in the test plan as a *verification*, not as the mitigation. |
| **F7** | — | **`scheduled-script-guide` and `module-guide` contradict each other.** `module-guide` lists `ScheduledScript` under *"APIs that support modules (accept functions)"*. `scheduled-script-guide` instruction 2 says *"The ScheduledScript API only accepts strings, so reference an external `.js` file with `Now.include(...)`. The script must use an IIFE."* | **Unresolvable from documentation.** Build-order step L0-9 resolves it empirically with a throwaway job: try the module form, and on a build diagnostic fall back to `Now.include()` + IIFE. The developer records which won. Do not guess. |

**F8 — a fact the spec gets right and that is re-confirmed here.** `module-guide`: `ScriptInclude.script` is
**string-only**. The documented bridge is a thin `Class.create()` wrapper calling
`require('./dist/modules/…')`. That is exactly §9's "every module reaches the platform through a
Script Include bridge", and it is the SDK's own recommended pattern — not a workaround.

---

# 2. The naming budget — the constraint that reshapes the schema

`x_335329_sn_hr_erp` is **18 characters**. The ownership prefix `x_335329_sn_hr_erp_` is **19**.
Against the SDK's 30-character ceiling (F4), **every table name has 11 characters to work with.**

Verified live: the platform itself is more permissive — `sys_dictionary` gives `sys_db_object.name`
`max_length: 80`, and this instance already carries `x_335329_officesea_seat_registration` (36) and
`x_335329_iscan_global_customization` (35). **The limit is the SDK build, not the platform.** With
Fluent/`now-sdk` mandated as the build tooling (spec §0), the SDK limit is the binding one.

## 2.1 Names in `docs/stories.md` that will not build

| Story-named table | Length | Verdict |
|---|---|---|
| `x_335329_sn_hr_erp_erp_system` | 29 | builds |
| `x_335329_sn_hr_erp_object_map` | 29 | builds |
| `x_335329_sn_hr_erp_erp_staging` | 30 | builds, at the ceiling |
| `x_335329_sn_hr_erp_sync_run` | 27 | builds |
| `x_335329_sn_hr_erp_mapping_template` | **35** | **FAILS** |
| `x_335329_sn_hr_erp_employee_xref` | **32** | **FAILS** |
| `x_335329_sn_hr_erp_document_type` | **32** | **FAILS** |
| `x_335329_sn_hr_erp_document_template` | **36** | **FAILS** |
| `x_335329_sn_hr_erp_document_request` | **35** | **FAILS** |

## 2.2 The canonical table names for this app

These are normative. Every later document uses them.

| Logical name (used in prose everywhere) | Physical table | Len | Layer |
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

`erp_staging` deliberately drops to `…_staging` rather than sitting on the 30-character ceiling —
a name at the exact limit is one SDK revision away from being a build failure, and this table is
the one the whole app hangs off.

**Column names are unaffected.** `table-guide`: on a table you are creating, columns need no
prefix and carry no comparable ceiling. `employee_full_name` and `annual_gross_salary` (L6's
template-variable naming, spec §8.1) are safe.

---

# 3. Component inventory

| Component | Type | Notes |
|---|---|---|
| Scope `x_335329_sn_hr_erp` | `now.config.json` | Already present locally: `{"scope":"x_335329_sn_hr_erp","scopeId":"f5a9e167140b4883b0fc301112c0f2bb","name":"SN HR&ERP"}`. Verified live: **absent from `sys_app` on `dev296062`**. |
| `now.config.json` additions | config | Add `"tsconfigPath": "./src/server/tsconfig.json"` (sibling has it, this repo does not) and, at L5, the client tsconfig per `ui-page-guide`. |
| 4 × `Role()` | `sys_user_role` | §4 |
| ~34 × `Acl()` | `sys_security_acl` | §5, landing per-table as tables land |
| 2 × `Record()` on `sys_security_attribute` | security predicate | §6, **conditional on Spike A** |
| 6 × `Property()` | `sys_properties` | §8 |
| 1 × `ApplicationMenu` + modules | navigation | admin config modules, `admin`-gated |
| 3 test users | `sys_user` | one per read role, created **by hand in the browser**, sys_ids recorded |

**No table is created at L0.** Tables land at L1/L3/L6 and their ACLs land with them
(story L0-4's stated dependency). What L0 fixes is the *shape* every one of those ACLs copies.

---

# 4. The four roles

`security-guide`: *"Always prefix role names with the application scope"*, and
*"You cannot rename roles after they are saved."*

```
x_335329_sn_hr_erp.viewer          containsRoles: []
x_335329_sn_hr_erp.finance_viewer  containsRoles: []
x_335329_sn_hr_erp.hr_viewer       containsRoles: []
x_335329_sn_hr_erp.admin           containsRoles: []
```

**All four `containsRoles` lists are empty. This is the design, not an omission.**

The Capacity Planner nests `viewer ⊂ planner ⊂ admin` and spec §5.6 cites it as the model — but
§5.6 then overrides it: `finance_viewer` is *"Never implied by any other role"* and `hr_viewer`
*"Never implied by any other role, and specifically **not** implied by `finance_viewer`"*.
Story L0-3 asserts `sys_user_role_contains` is **empty** for every pair, including
`viewer → finance_viewer`. A non-empty graph fails that story.

The tempting nesting — `admin ⊃ viewer`, `finance_viewer ⊃ viewer` — is rejected for one reason:
the sibling app shipped exactly `financeViewer: containsRoles: [viewer]`, and once one
containment exists, the next one is an easy patch, and `finance_viewer ⊃ viewer ⊃ hr_viewer`
is two careless commits away. An empty graph is a testable invariant; a partial graph is a
judgement call in every future code review.

**Consequence, and it is deliberate:** an operational user who should see Tab 1 needs **two**
roles granted (`viewer` + `finance_viewer`). A tester who assumes `finance_viewer` alone opens the
hub will see the hub refuse — that is correct behaviour and is written into T0-4.

## 4.1 `hr_viewer` also carries the on-behalf-of privilege

Spec §8.2 requires *"Requesting on behalf of another person requires the HR-admin role
explicitly"*, and story L6-3 tests *"a user holding the HR-admin role"*. §5.6 names **four** roles
and there is no `hr_admin` among them.

**Resolved: `hr_viewer` is that role.** Rationale: §5.6 defines `hr_viewer` as
*"employee and payroll data"*, which is exactly the entitlement someone requesting a colleague's
salary certificate is exercising; `admin` is defined as *"configuration"*, and issuing a document
about a person is not configuration. Inventing a fifth role to match a phrase that appears twice
in prose would add a role nobody specified.

**Rejected — add `x_335329_sn_hr_erp.hr_admin`.** Cleaner in principle; costs a fifth role, a
fifth ACL column, and a fifth test user, to separate a read entitlement from a request
entitlement that in practice the same person holds.

**Flagged for the human**: if HR genuinely needs "can read payroll" separate from "can request
for others", say so and the fifth role is a one-line change at L0 — but it is a change *at L0*,
not at L6.

## 4.2 Ordinary employees hold no app role

Self-service document requests (L6) are available to **any** authenticated user, bounded
server-side by `subject == caller`. Requiring `viewer` to request your own employment letter
would mean granting an operational-dashboard role to the whole company.

---

# 5. The ACL skeleton

## 5.1 Rules that apply to every ACL in this app

1. Every `Table()` declares **`createAccessControls: false`**. Story L0-4 asserts that a query of
   `sys_security_acl` for this scope returns only ACLs present in source.
2. Every ACL is authored with `$id: Now.ID['acl-<table>-<op>[-<field>]']` — never a literal sys_id (F1).
3. `security-guide` — **the Trinity**: *"All specified conditions (roles AND condition AND script)
   must evaluate to true to grant access."* An ACL is therefore never given both a role and a
   script unless both are meant to be required.
4. `security-guide` — *"Use `roles` for role checks, not scripts."* Scripts appear only in the
   deny rules of §5.3 and the self-service boundary of L6.
5. Every ACL carries a `description` naming the role it serves (story L0-4's last criterion).

## 5.2 The table-level matrix

`R` = read, `C` = create, `W` = write, `D` = delete. `—` = **no ACL exists**, which is stronger
than a restrictive one: there is nothing for a future contributor to widen.

| Table | R | C | W | D | Note |
|---|---|---|---|---|---|
| `erp_system` | `viewer` | `admin` | `admin` | `admin` | connection fields further restricted, §5.4 |
| `object_map` | `admin` | `admin` | `admin` | `admin` | **not** `viewer` — story L1-3 asserts a viewer-only user cannot read it |
| `field_map` | `admin` | `admin` | `admin` | `admin` | inherits `object_map`'s sensitivity |
| `mapping_template` | `admin` | `admin` | `admin` | `admin` | |
| `call_log` | `viewer` | `viewer` | — | `admin` | create-for-viewer is deliberate; §5.5 |
| `erp_staging` | `viewer` | — | — | — | written only by the sync engine; §5.6 |
| `sync_run` | `viewer` | — | — | — | `error_message` field-restricted, §5.4 |
| `employee_xref` | `hr_viewer` | `admin` | `admin` | `admin` | story L6-1: a `finance_viewer`-only user is refused |
| `document_type` | `viewer` | `admin` | `admin` | `admin` | |
| `document_template` | `admin` | `admin` | `admin` | `admin` | template bodies are not viewer-readable |
| `document_request` | script, §5.7 | *any authenticated* | — | `admin` | |

The sibling app granted `object_map` read to `viewer`. This app does not: `object_map` names
endpoints and, through `query_template`, sometimes credentials-shaped filter syntax.

## 5.3 Hard deny-write on system-derived fields — and how it is decided

**The requirement:** nobody, admin included, can hand-edit provenance. Fields covered:

| Table | Fields under hard deny-write |
|---|---|
| `erp_staging` | `erp_system`, `erp_category`, `logical_object`, `source_record_id`, `fetched_at`, `sync_run`, and every promoted/typed column and `payload` |
| `sync_run` | every field — the table is immutable after the engine finishes it |
| `call_log` | every field — no write ACL exists at all (§5.2) |
| `object_map` | `field_map_generated` — *not built*, see `docs/l1-control-tower-design.md` §4.3 |
| `document_request` | `requester`, `generated_on`, `source_call_ids`, `output_format`, `status`, `failure_reason` |

**The problem:** "hard deny-write" is a behaviour, not an API. `acl-api` exposes
`decisionType: 'allow' | 'deny'` and `adminOverrides: boolean`, and `security-guide` defines the
semantics as: *"Deny-Unless ACLs (`decisionType: 'deny'`) evaluate before Allow ACLs and deny
access unless conditions are met. They do not grant access on their own."* Two shapes satisfy
that reading, and the documentation does not say which the platform actually enforces against a
full admin.

**Shape A — deny-unless-false (primary):**

```ts
Acl({
  $id: Now.ID['acl-staging-field-fetched-at-write'],
  type: 'record', table: 'x_335329_sn_hr_erp_staging',
  field: 'fetched_at', operation: 'write',
  decisionType: 'deny',
  script: 'answer = false;',       // the "unless" is never satisfied
  adminOverrides: false,
  description: 'Provenance is system-derived. No role, including admin, may write it.',
})
```

**Shape B — no allow rule can pass (fallback):**

```ts
Acl({
  $id: Now.ID['acl-staging-field-fetched-at-write'],
  type: 'record', table: 'x_335329_sn_hr_erp_staging',
  field: 'fetched_at', operation: 'write',
  decisionType: 'allow',
  roles: [],
  script: 'answer = false;',
  adminOverrides: false,
})
```

**Build-order step L0-7 decides between them empirically, before the other 20-odd deny ACLs are
written.** One field, one table, both shapes, one Table API `PATCH` **as a full admin**, and a
re-read. The shape that leaves the value unchanged is the shape the whole app uses. This is
story L0-4's third criterion executed once at L0 instead of twenty-six times at sign-off.

**Do not skip this because it "obviously" works.** The instruction to hand-write ACLs exists
because generated ones grant more than intended; the same scepticism applies to a deny shape
nobody on this project has watched refuse an admin.

## 5.4 Field-level read restrictions

| Table.field | Read role | Why |
|---|---|---|
| `erp_system.base_url` | `admin` | ported from the sibling |
| `erp_system.auth_profile_basic` / `_oauth` / `_mutual` | `admin` | credentials |
| `erp_system.mid_server` | `admin` | topology |
| `sync_run.error_message` | `admin` | story L3-2: *"a `viewer`-only user can read `sync_run` status and timestamps … but cannot read `error_message` if it can contain endpoint or credential detail"*. It can — the connector composes it from `RESTMessageV2.getErrorMessage()`, which quotes the URL. |
| `object_map.query_template` | `admin` | filter syntax can carry identifiers |

**`sync_run.error_message` being admin-only is load-bearing on L4.** A `viewer` reading `sync_run`
directly sees `status=failed` and no reason — correct. The L4 API is what turns that into
`ERP did not answer`, and L4 must compose that sentence **without** echoing `error_message` into
the payload for a non-admin caller. Written into `docs/l4-api-design.md` §5.

## 5.5 Two rules that must not be "tidied up"

- **`call_log` CREATE is granted to `viewer`.** In a scoped app, ACLs apply to server-side
  `GlideRecord` too. The connector logs as the invoking user. Admin-only insert means telemetry
  exists only for admins, and a `viewer`-triggered refresh would silently produce no `call_log`
  row — which at L4 is indistinguishable from "no call was attempted". Ported verbatim from the
  sibling, where it is annotated for the same reason.
- **`call_log` has no write ACL at all.** Immutability is the point.

## 5.6 `erp_staging` has no create/write/delete ACL either

The sync engine (L3) writes it. That engine runs inside a Script Include; in a scoped app its
`GlideRecord` is ACL-checked, so with no create ACL it cannot insert.

**Resolved:** the sync engine's insert path runs in a **`ScheduledScript`** (`sysauto_script`),
which executes as `system`, not as the invoking user. A UI-triggered refresh (story L3-3) does
not write staging directly — it enqueues, and L3 §6 specifies the mechanism. This keeps
`erp_staging` un-writable by any human identity, which is what makes §5.3's deny ACLs meaningful
rather than decorative.

**Rejected — grant `erp_staging` create to `viewer`, like `call_log`.** It would let any viewer
insert a fabricated staged row carrying a fabricated `fetched_at`, which is the exact attack the
deny-write ACLs exist to stop. `call_log` tolerates it because a fabricated telemetry row cannot
become a number on a tile; a fabricated staging row is a number on a tile.

## 5.7 `document_request` read is a script ACL, not a role

Story L6-6: *"A requester can see their own request's status and reason; they cannot see another
person's request."*

```ts
Acl({
  $id: Now.ID['acl-doc-req-read'],
  type: 'record', table: 'x_335329_sn_hr_erp_doc_req',
  operation: 'read',
  decisionType: 'allow',
  script: 'answer = (current.requester == gs.getUserID()) || (current.subject_employee == gs.getUserID());',
  adminOverrides: true,
  description: 'A requester sees their own requests. hr_viewer sees all, via a second allow ACL.',
})
```

`gs.getUserID()` is used here rather than `sys_user_has_role`: this is an **ownership** check, not
a role check, and §9's warning is specifically about `gs.hasRole()` under `runAs`. A second allow
ACL grants `hr_viewer` the broad read.

---

# 6. Spike A — the security question that decides L4

**`docs/stories.md` requires, in L0-3, L4-3, L6-3 and L5-9, that every security-relevant check
queries `sys_user_has_role` rather than `gs.hasRole()`** (spec §9: `gs.hasRole()` lies under
`runAs`).

**The problem nobody has checked:** the ServiceNow security jump-start ACL set restricts
`sys_user_has_role` read to `itil`
(`ServiceNowOfficialDocs/platform-security/access-control/r_SecurityJumpStartACLRules.md`:
`|sys_user_has_role|read|itil role required to see User Role records|`). In a scoped app,
server-side `GlideRecord` is ACL-checked. A `finance_viewer`-only user holds no `itil`.

If that ACL is active on `dev296062`, then a scoped `GlideRecord('sys_user_has_role')` executed
during a `finance_viewer`'s `GET /data` call **returns zero rows** — and the check fails closed.
Tab 1 would render access-restricted for the very user D6 exists to admit, and it would do so
silently, and it would pass every happy-path admin test.

**This is the same class of defect as the sibling's OD9, and it must be probed, not assumed.**

## 6.1 The spike

Run as the `finance_viewer`-only test user, in a real session:

```
GlideRecord('sys_user_has_role')
  .addQuery('user', gs.getUserID())
  .addQuery('role.name', 'x_335329_sn_hr_erp.finance_viewer')
  → row count
```

Record the count. **Also record it as a full admin**, so a zero is attributable to the ACL and not
to a bad query.

## 6.2 Both outcomes are designed for

**Outcome 1 — the query returns the row.** Direct `sys_user_has_role` queries are used
throughout, exactly as the stories specify. A shared `RoleCheck` Script Include is the single
call site.

**Outcome 2 — the query returns zero.** The role check moves to a **Security Attribute**, which
`security-guide` documents as the reusable security predicate and which the *platform* evaluates —
it does not require the calling user to be able to read `sys_user_has_role`:

```ts
Record({
  $id: Now.ID['sec-attr-has-finance-viewer'],
  table: 'sys_security_attribute',
  data: {
    name: 'HasHrErpFinanceViewer',
    type: 'compound',
    label: 'Has SN HR&ERP finance_viewer',
    condition: 'Role=x_335329_sn_hr_erp.finance_viewer',
    is_dynamic: 'false',
  },
})
```

`security-guide`: *"Prefer `compound` type — it is the only type that can be referenced in ACLs
and Data Filters"*, and *"Set `is_dynamic: false` for role/group checks that can be cached per
session."* The attribute is then referenced from the L4 resource ACL via `securityAttribute`,
and the tile-level gating in the L4 handler reads the *outcome* of the ACL rather than
re-deriving the role.

**Rejected under Outcome 2 — a `global`-scope Script Include bridge that queries
`sys_user_has_role` with elevated privilege.** It works, and it is a role-check backdoor sitting
in Global scope in an app whose entire security story is "the roles are not decorative".
Governance would be right to refuse it.

**Rejected in both outcomes — `gs.hasRole()`.** §9, non-negotiable.

## 6.3 Spike B — the ampersand (OD8, owned by the developer)

Not this document's call, but L0 must give it a place to happen. `now.config.json` already carries
`"name": "SN HR&ERP"`. The verification is story L0-2's five criteria, run after the first
successful install, and OD8 is closed either way in `docs/decision-log.md`. This design assumes
**nothing** about the outcome: no document, table label, property name or URL in any layer
interpolates the app name.

---

# 7. Properties declared at L0

All via `Property()` + `Now.ID` (F1). Defaults are D5's published table plus OD1's proposal
(`docs/l3-staging-design.md` §7).

| Name | Type | Default | Drives |
|---|---|---|---|
| `x_335329_sn_hr_erp.stale_after_hours` | integer | `24` | the `stale` state (§7 of the spec) |
| `x_335329_sn_hr_erp.asset_maintenance_due_days` | integer | `30` | Tab 4 "assets due for maintenance" |
| `x_335329_sn_hr_erp.asset_high_value_amount` | integer | `50000` | Tab 4 "high-value capital assets" |
| `x_335329_sn_hr_erp.asset_eol_within_days` | integer | `180` | Tab 4 "nearing end-of-life" |
| `x_335329_sn_hr_erp.staging_retention_days` | integer | `90` | L3 retention — **OD1, needs approval before the cleaner is armed** |
| `x_335329_sn_hr_erp.sync_run_retention_days` | integer | `730` | L3 audit-spine retention — OD1 |

`roles: { read: ['x_335329_sn_hr_erp.viewer'], write: ['x_335329_sn_hr_erp.admin'] }` on all six:
the L4 API echoes each threshold into the tile payload (D5 — *"the tile renders the threshold it
actually used"*), so a viewer must be able to read them.

---

# 8. Build order

Numbered, dependency-respecting. Each step names its verification.

| # | Step | Verify |
|---|---|---|
| **L0-1** | Add `"tsconfigPath": "./src/server/tsconfig.json"` to `now.config.json`. Create `src/server/tsconfig.json`. | `npx now-sdk build` clean |
| **L0-2** | Declare the four `Role()` records in `src/fluent/security/roles.now.ts`, all with empty `containsRoles`. | build clean |
| **L0-3** | `npx now-sdk build && npx now-sdk install`. **Never a bare `install`** (§9; confirmed against `now-sdk install --help`, which has no build step and no flag that adds one). | `npx now-sdk query sys_app -a dev -q "scope=x_335329_sn_hr_erp" -f scope,name` returns one row |
| **L0-4** | **OD8 / Spike B** — the ampersand, story L0-2's five criteria. Close OD8 in the decision log either way. | Table API read-back of `sys_app.name` is the literal `SN HR&ERP`, or the fallback is recorded |
| **L0-5** | Exercise the tooling traps once, on purpose: break a source file → `build` → confirm the output dir empties → bare `install` → confirm "No files found" → restore → rebuild. Then: edit source → bare `install` → confirm the **previous** build deployed. | both messages recorded verbatim (story L0-1) |
| **L0-6** | Create the three test users **in the browser** — `hrerp_viewer_only`, `hrerp_finance_only`, `hrerp_hr_only` — each holding exactly one app role. Record sys_ids in the build report. | `npx now-sdk query sys_user_has_role -a dev -q "user.user_name=hrerp_finance_only"` returns exactly one app role |
| **L0-7** | **The deny-ACL shape decision (§5.3).** Create a throwaway table `x_335329_sn_hr_erp_acltest` with one column. Apply Shape A. Deploy. `PATCH` the field via Table API **as admin**. Re-read. If it changed, apply Shape B and repeat. | the winning shape is recorded in the decision log and is the only shape used thereafter. **Delete the throwaway table before L1.** |
| **L0-8** | **Spike A (§6).** Run the `sys_user_has_role` probe as `hrerp_finance_only` and as admin. | both row counts pasted as evidence; the chosen role-check mechanism recorded |
| **L0-9** | **F7.** Declare one throwaway `ScheduledScript` with `frequency: 'on_demand'`, `active: false`, script as a **module function**. Build. If the build rejects it, switch to `Now.include()` + IIFE. | which form builds is recorded; **delete the throwaway job** |
| **L0-10** | Declare the six `Property()` records (§7). Build, install. | `npx now-sdk query sys_properties -a dev -q "nameSTARTSWITHx_335329_sn_hr_erp" -f name,value` returns **six** rows |
| **L0-11** | Declare the `ApplicationMenu` + admin modules, gated on `x_335329_sn_hr_erp.admin`. Links use `_list.do`, never `.list` (§9). | as `hrerp_viewer_only`, no config module appears in navigation |
| **L0-12** | Confirm zero Global-scope records. | `npx now-sdk query sys_metadata -a dev -q "sys_scope=global^sys_created_on>javascript:gs.beginningOfToday()" -f sys_class_name,name` — no row attributable to this app |

**The ACL bodies themselves are not an L0 step.** They land table-by-table at L1/L3/L6 using the
shape L0-7 proved. L0 owns the shape; the layers own the rules.

---

# 9. Test plan

Every case traces to an acceptance criterion in `docs/stories.md`. Cases marked **NON-ADMIN** must
be executed in a real interactive session as the named user — not by impersonation from an
elevated session (§9, and the sibling's OD9, whose entire evidence set had to be redone).

| ID | Test | Precondition | Steps | Expected | Validates |
|---|---|---|---|---|---|
| **T0-1** | App exists in scope | L0-3 done | `now-sdk query sys_app -a dev -q "scope=x_335329_sn_hr_erp" -f scope,name` | exactly one row, `scope = x_335329_sn_hr_erp` | L0-1 AC1 |
| **T0-2** | Package name | — | read `package.json` | `"name": "sn-hr-erp"` | L0-1 AC2 |
| **T0-3** | Failed build empties output; bare install ships stale | L0-5 | as L0-5 | both messages recorded verbatim; not inferred | L0-1 AC3, AC4 |
| **T0-4** | Zero Global records | L0-3 | L0-12's query | no row attributable to this app | L0-1 AC5 |
| **T0-5** | Ampersand survives | L0-4 | story L0-2's five criteria | literal `&` in `sys_app.name` and the update-set name, **or** the fallback `SN HR and ERP` applied and the broken artefact named in the decision log | L0-2, closes OD8 |
| **T0-6** | Four roles exist | L0-2 | `now-sdk query sys_user_role -a dev -q "nameSTARTSWITHx_335329_sn_hr_erp" -f name` | exactly 4 | L0-3 AC1 |
| **T0-7** | Containment graph is empty | T0-6 | `now-sdk query sys_user_role_contains -a dev -q "role.nameSTARTSWITHx_335329_sn_hr_erp^ORcontains.nameSTARTSWITHx_335329_sn_hr_erp" -f role,contains` | **zero rows.** Any row fails, including `viewer → finance_viewer` | L0-3 AC2, AC3 |
| **T0-8** **NON-ADMIN** | Test users hold exactly one role each | L0-6 | as each user, query `sys_user_has_role` for self | one app role each | L0-3 AC4, AC7 |
| **T0-9** | Properties exist after deploy | L0-10 | L0-10's query | **six** rows. A missing row means F1's reasoning was wrong — record it and fall back to §9's browser-creation workaround | L3-4 AC2 |
| **T0-10** | Property drives behaviour without redeploy | T0-9 | `PATCH` `stale_after_hours` from 24 to 1 via Table API; re-read | value changes; **no redeploy** | L3-4 AC1 |
| **T0-11** | Deny-ACL shape refuses an admin | L0-7 | **as a full `admin`**, `PATCH` the protected field on the throwaway table; re-read | write refused, value unchanged. **An admin who can edit it fails this test and the shape is wrong.** | L0-4 AC3 |
| **T0-12** **NON-ADMIN** | Role check works for its own holder | L0-8 | as `hrerp_finance_only`, run the Spike A probe | row count recorded. **Zero is a valid, expected result** and selects the Security Attribute path (§6.2). Zero recorded as "inconclusive" instead of acted on is a FAIL | L4-3 (all), L0-3 AC6 |
| **T0-13** | No `gs.hasRole()` anywhere | any build | `grep -rn "gs.hasRole" src/` | zero hits | L0-3 AC6, §9 |
| **T0-14** | No hand-written sys_id | any build | `grep -rnE "[0-9a-f]{32}" src/fluent/ \| grep -v generated/keys.ts` | zero hits outside `keys.ts` | F1, `now-id-guide` |
| **T0-15** | Every table name fits the budget | any build | `grep -rn "name: 'x_335329_sn_hr_erp_" src/fluent/tables/` and measure | every name ≤ 30 characters | F4 / §2 |
| **T0-16** **NON-ADMIN** | Config modules hidden from viewer | L0-11 | as `hrerp_viewer_only`, open the app navigator; then navigate directly to `x_335329_sn_hr_erp_object_map_list.do` | no config module in nav; direct URL returns a **security message**, not an empty list. An empty list reads as "no systems configured" and is a §7 violation delivered by an ACL | L5-9 AC4 |
| **T0-17** | Throwaway artefacts removed | before L1 | query `sys_db_object` for `…_acltest`; query `sysauto_script` in scope | zero rows each. A test driver left armed is the named sin of §9 | §9 "ship test drivers `active: false`" |

---

# 10. Decision log — L0

### L0-D1 — Table names are shortened to fit an 11-character suffix
**Chosen:** the §2.2 canonical names. Five names from `docs/stories.md` are changed.
**Rejected — keep the story names and let the build fail.** `table-guide` states the limit is
enforced by build diagnostics; the names are unbuildable with the mandated toolchain.
**Rejected — a shorter scope.** `x_335329_sn_hr_erp` is fixed by spec §0 and by
`now.config.json`'s `scopeId`, which is already bound to a real `sys_scope` record.
**Rejected — abbreviate only on build failure.** Guarantees the discovery lands at L6, in the
middle of document generation, instead of before a single table exists.
**Binds:** every later document uses §2.2. The BA's story text is superseded on table *names*
only; every acceptance criterion is unchanged in substance.

### L0-D2 — All four `containsRoles` lists are empty
**Chosen:** no containment between any pair of app roles.
**Rejected — Capacity Planner nesting (`viewer ⊂ finance_viewer ⊂ admin`).** Spec §5.6 forbids
`finance_viewer` and `hr_viewer` being implied; a partial graph makes "which implications are
allowed" a judgement call in every future review, where an empty graph is a query that returns
zero rows.
**Costs accepted:** two roles must be granted to give one person Tab 1. Written into T0-4's
expectations so it is not mistaken for a defect.

### L0-D3 — `hr_viewer` carries the on-behalf-of privilege; no fifth role
**Chosen:** §4.1.
**Rejected — a fifth `hr_admin` role.** Cleaner separation, costs a role/ACL/test-user nobody
specified, to split entitlements the same person holds in practice.
**Flagged:** reversible at L0 at low cost; expensive after L6 ACLs land.

### L0-D4 — The deny-write ACL shape is decided by experiment at L0, not by reading
**Chosen:** L0-7 — Shape A first, Shape B on failure, one shape used everywhere thereafter.
**Rejected — pick Shape A and move on.** `security-guide` describes deny-unless semantics but
does not state the interaction with `adminOverrides: false`. This project's founding lesson is
that a clean build proves nothing.
**Rejected — pick the Capacity Planner's observed shape.** Its documentation records the *effect*
("WRITE deny — `answer = true`") on a different SDK version; the polarity is ambiguous in prose
and guessing polarity on a security control is how provenance becomes editable.

### L0-D5 — Every property uses `Property()` + `Now.ID`; the §9 workaround is not designed in
**Chosen:** F1.
**Rejected — pre-create properties in the browser and paste sys_ids into `keys.ts`.** This is
precisely the practice `now-id-guide` names as the cause: *"Fabricated sys_ids … bypass the
key-tracking system entirely."* The Capacity Planner's trap was the hand-written placeholder, not
the property.
**Guarded:** T0-9 still counts six rows after deploy. If it counts fewer, F1 was wrong, and the
workaround is applied *and recorded* rather than assumed away.

### L0-D6 — `erp_staging` gets no create/write/delete ACL; the sync engine runs as `system`
**Chosen:** §5.6.
**Rejected — grant create to `viewer`, mirroring `call_log`.** A fabricated telemetry row cannot
become a number on a tile; a fabricated staging row can.
**Binds:** L3's UI-triggered refresh cannot write staging inline. `docs/l3-staging-design.md` §6
owns the mechanism.

### L0-D7 — `sync_run.error_message` is admin-read-only
**Chosen:** §5.4.
**Rejected — viewer-readable.** The connector composes it from
`RESTMessageV2.getErrorMessage()`, which quotes the endpoint URL.
**Binds:** L4 composes `ERP did not answer` from `status` alone for non-admin callers, and never
echoes `error_message` into a non-admin payload.

---

# 11. Risks and flags

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R0-1 | **Spike A returns zero** (§6) | Every role-gated figure in the app fails closed, silently, and passes admin testing | T0-12 makes zero an expected, actionable outcome with a designed alternative. Not a blocker — a fork in the road that must be walked before L4 |
| R0-2 | Neither deny-ACL shape refuses an admin | "Hard deny-write" is unachievable via ACL and provenance becomes admin-editable | L0-7 finds out at L0. Escalate to the human; the fallback is a `before` Business Rule reverting the field, which is weaker (it is app code, not access control) and must be recorded as such |
| R0-3 | F7 unresolved until L0-9 | `ScheduledScript` bodies written the wrong way — affects the sync engine, the retention cleaner and every test driver | One throwaway job at L0 |
| R0-4 | Ampersand breaks an artefact (OD8) | Display-name fallback | No layer interpolates the app name anywhere (§6.3) |
| R0-5 | `allowWebServiceAccess` omitted on one table | That table's Table API criteria return 403 and read as an ACL failure | T0-15's grep is extended at each layer to assert the flag is present on every `Table()` |
| R0-6 | Three test users created by hand drift | Every access-control assertion in the app is silently void | Story L5-9's criterion — re-verify `sys_user_has_role` immediately before each test pass, not once at L0 |

**No cross-scope call exists at L0, and none is planned in any layer.** D4 forbids a runtime
dependency on `x_335329_erpcrm`; nothing in L0–L6 reads or writes another scope's table. The one
scope-adjacent object is the Security Attribute of §6.2, which is a record in *this* scope
referencing a role by name.
