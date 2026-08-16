---
title: SN HR&ERP — product backlog (rm_story records)
app: x_335329_sn_hr_erp
author: BA agent
generated: 2026-08-12
status: draft for architect. Requirements source of truth is
        `docs/SN-HR-ERP-master-kickoff-prompt.md`; decisions D1–D4 in `docs/decision-log.md`
        are settled and are honoured here, not relitigated.
grounding: ServiceNow implementation notes were checked against the local ServiceNow
        documentation corpus via the `sn-rag` MCP (semantic search). The corpus was
        reachable; citations appear as `rel_path` values under each story.
---

# How to read this backlog

Each story below is shaped for an `rm_story` record: title, As-a/I-want/So-that, acceptance
criteria, ServiceNow implementation notes, story points, priority, dependencies.

**This backlog does not design the solution.** Where the spec leaves a shape open (OD1–OD8), the
story states the *behaviour that must hold whatever shape is chosen*, and names the open decision.
The architect owns the shape.

**Story points** are Fibonacci, relative, and assume the connector is ported (D4) rather than
written. **Priority** is delivery priority within the layer, not business value.

## §0 The shared rendering contract — referenced by every tile, chart and list story

This is §7 of the spec, restated once as the exact strings a tester reads off a screen. Every
story that renders a figure inherits all four criteria below and adds its own object name. A story
that renders `0` in any state other than **live** is a failed story.

| State | Trigger | Exact rendered text |
|---|---|---|
| **live** | latest `sync_run` for (system × object) = `success`, `fetched_at` within the staleness threshold | the figure, then `as of 12 Aug 2026 14:32` |
| **not configured** | no active `object_map` row for this logical object on any active `erp_system` | `Not configured — create an Object Map for `<logical_object>`` |
| **failed** | an `object_map` exists, latest `sync_run` = `failed`, and a prior `success` exists | `ERP did not answer` then `Last good figure: <figure> (as of 11 Aug 2026 09:14, 1 day old)` |
| **failed, no history** | as above but no prior `success` run for this object | `ERP did not answer — no previous figure` |
| **stale** | latest `sync_run` = `success` but `fetched_at` older than the staleness threshold | the figure, then `Stale — as of 09 Aug 2026 03:00 (3 days old)` |

Rules that ride along with the table:

- **R1.** `0` is displayed only when the ERP returned rows totalling zero, or returned an
  empty result set under a `success` run. Never for a missing map, a failed call, a stale sync,
  or an empty staging table with no run.
- **R2.** The state arrives from the server **explicitly**, as a field in the `GET /data` payload.
  The client never infers state from a missing key, a `null`, or a `0`.
- **R3.** Timestamp format must contain a date and a time. `as of 14:32` alone fails — a figure
  from last Tuesday at 14:32 reads as current.
- **R4.** Where a tile aggregates across more than one `erp_system`, the tile's state is the
  **worst** state among contributing systems, and the tile names which system degraded it:
  `Partial — SAP S/4HANA Production did not answer`.

Assumption flagged: the exact timestamp format string is the architect's to fix; the criteria
above test *content*, not format.

---

# L0 — Scaffold, scope, roles, ACL skeleton

## Story L0-1: Scaffold the scoped app and prove the scope identifier

**As a** platform admin
**I want** `x_335329_sn_hr_erp` to exist on the instance as a source-controlled Fluent app
**So that** every later layer has a scope to deploy into and nothing lands in Global

### Acceptance Criteria
- [ ] `now-sdk build && now-sdk install` completes and `sys_app` contains a record with scope
      `x_335329_sn_hr_erp`, verified by `now-sdk query sys_app -a dev --query "scope=x_335329_sn_hr_erp"`,
      not by reading the build log.
- [ ] The npm package name in `package.json` is exactly `sn-hr-erp`.
- [ ] A deliberate build failure is exercised once: break a source file, run `now-sdk build`,
      confirm the output directory is emptied, confirm a bare `now-sdk install` then fails with
      "No files found", then restore and rebuild. The tester records both messages.
- [ ] After a source edit, a bare `now-sdk install` **without** a preceding build is run once and
      shown to deploy the *previous* build. The team records the observed evidence so the trap is
      documented, not assumed.
- [ ] Zero records created in Global scope. `sys_metadata` filtered to
      `sys_scope=Global^sys_created_on>` deploy start returns no rows attributable to this app.

### ServiceNow Implementation Notes
- Module: custom scoped app (no ITSM/HRSD/CSM dependency — HRSD is absent per spec §3)
- Table(s): `sys_app`, `sys_scope`, `sys_metadata`
- Components: `now.config.json`, Fluent source tree, `now-sdk` CLI
- Doc reference: spec §9 "Tooling / Fluent / now-sdk"; sibling `docs/SESSION-RESUME.md` tooling lessons

### Story Points: 3
### Priority: High
### Dependencies: none

---

## Story L0-2: Verify the ampersand in `SN HR&ERP` survives scaffolding

**As a** developer
**I want** proof that `&` in the app name does not corrupt any generated artefact
**So that** we discover a broken display name at L0 and not at L5 in a browser URL

### Acceptance Criteria
- [ ] `sys_app.name` read back from the instance via the Table API is the literal string
      `SN HR&ERP` — not `SN HR&amp;ERP`, not `SN HR`, not `SN HR&#38;ERP`.
- [ ] The generated update set / application-file name containing the app name is read back and
      contains the literal `&`.
- [ ] The app opens from the Next Experience application picker and the rendered label reads
      `SN HR&ERP`.
- [ ] A URL that interpolates the app name (application-navigator link, any `.do` link generated
      with the name as a parameter) is opened and loads; a truncation at the `&` (query-parameter
      split) is a FAIL and must be recorded as such.
- [ ] **Failure path:** if any of the above fails, the display name is changed to `SN HR and ERP`
      while `scope` stays `x_335329_sn_hr_erp` and the npm package stays `sn-hr-erp`, and the
      specific artefact that broke is written into `docs/decision-log.md` closing OD8.
- [ ] OD8 is closed either way — "verified intact" or "fell back, because X". An unclosed OD8
      fails this story.

### ServiceNow Implementation Notes
- Module: platform / app scaffold
- Table(s): `sys_app`, `sys_update_set`, `sys_metadata`
- Components: none — this is a verification story with a scripted fallback
- Doc reference: spec §0 "Ampersand check"; open item OD8

### Story Points: 2
### Priority: High
### Dependencies: L0-1

---

## Story L0-3: Create the four roles with no implication between them

**As a** security admin
**I want** `viewer`, `finance_viewer`, `hr_viewer` and `admin` to exist with an explicit, tested
containment graph
**So that** payroll access is never granted as a side effect of granting finance access

### Acceptance Criteria
- [ ] Four `sys_user_role` records exist in scope: `x_335329_sn_hr_erp.viewer`,
      `.finance_viewer`, `.hr_viewer`, `.admin`.
- [ ] `sys_user_role_contains` is queried directly and returns **no** row where
      `role=x_335329_sn_hr_erp.viewer` and `contains=x_335329_sn_hr_erp.finance_viewer`.
- [ ] `sys_user_role_contains` returns **no** row where `role=finance_viewer` and
      `contains=hr_viewer`, and **no** row where `role=hr_viewer` and `contains=finance_viewer`.
      Payroll access is not a superset of finance access and vice versa.
- [ ] A test user is created holding **only** `x_335329_sn_hr_erp.finance_viewer`. Logged in as
      that genuine non-admin user, `sys_user_has_role` for that user returns exactly one row for
      this app's roles, and the user cannot read any `hr_viewer`-gated surface.
- [ ] A second test user holding **only** `hr_viewer` cannot read any `finance_viewer`-gated
      surface. Verified as that user, not by impersonation from an admin session where an
      elevation could mask the result.
- [ ] No security assertion in this story is evidenced by `gs.hasRole()` output. Every assertion
      queries `sys_user_has_role` / `sys_user_role_contains` directly.
- [ ] Three named test users (`viewer` only, `finance_viewer` only, `hr_viewer` only) exist and
      are recorded by sys_id for reuse by every later access-control story.

### ServiceNow Implementation Notes
- Module: platform security
- Table(s): `sys_user_role`, `sys_user_role_contains`, `sys_user_has_role`, `sys_user`
- Components: Fluent `Role()` declarations; no `contains` between the three read roles
- Doc reference: `ServiceNowOfficialDocs/platform-administration/user-administration/exploring-user-administration.md`
  ("Roles can contain other roles, and any access granted to a role is granted to any role that
  contains it") — which is precisely why the containment graph must be asserted empty here;
  `ServiceNowOfficialDocs/platform-security/c_ElevatedPrivilege.md`; spec §5.6, §9 (`gs.hasRole()`
  lies under `runAs`)

### Story Points: 3
### Priority: High
### Dependencies: L0-1

---

## Story L0-4: Hand-write the ACL skeleton with hard deny-write on system-derived fields

**As a** security admin
**I want** every ACL authored by hand, including deny-write field ACLs that admin cannot override
**So that** provenance can never be hand-edited and no generated ACL grants more than intended

### Acceptance Criteria
- [ ] Every table in the app is declared with `createAccessControls: false`. A query of
      `sys_security_acl` for this scope returns only ACLs present in source — an ACL on the
      instance with no source counterpart is a FAIL.
- [ ] Write ACLs on `fetched_at`, `sync_run`, `erp_system`, `logical_object`, `source_record_id`
      and every other system-derived field are declared with `adminOverrides: false`.
- [ ] **Failure path, run as a full `admin`:** an attempt to update `erp_staging.fetched_at` via
      the Table API returns a write refusal and the field value is unchanged on re-read. An admin
      who *can* edit it fails this story.
- [ ] **Failure path, run as the `viewer`-only test user:** an attempt to insert a row into
      `erp_system` is refused, and an attempt to read `erp_system.auth_profile` returns no value.
- [ ] Every ACL assertion in this story is executed as a genuine non-admin user holding only the
      intended role. Results obtained while holding `admin` do not count as evidence for any
      criterion here.
- [ ] Each ACL has a stated intent in a comment naming which role it serves; an ACL nobody can
      explain is deleted, not shipped.

### ServiceNow Implementation Notes
- Module: platform security
- Table(s): `sys_security_acl`, `sys_security_acl_role`
- Components: Fluent ACL declarations, table-level + field-level, `adminOverrides: false`
- Doc reference: spec §5.6; Capacity Planner pattern in spec §1.2

### Story Points: 5
### Priority: High
### Dependencies: L0-3, and the tables from L1/L3 (ACLs land as those tables land)

---

# L1 — Control tower

## Story L1-1: `erp_system` connection registry

**As an** app admin
**I want** one record per ERP instance holding its connection configuration
**So that** adding a second ERP is a data task, not a code change

### Acceptance Criteria
- [ ] `erp_system` exists with at minimum: `name`, `vendor`, `legal_entity`, `base_url`,
      `auth_type`, the matching auth-profile references, `use_mid_server`, `mid_server`,
      `timeout_ms`, `max_retries`, `backoff_ms`, `circuit_open_until`, `read_only`, `active`.
- [ ] `read_only` defaults to **true** on insert. A row inserted via the Table API with no
      `read_only` value reads back `true`.
- [ ] `audit` is enabled on the table; updating `base_url` produces a `sys_audit` row naming the
      old and new value.
- [ ] The `vendor` choice list contains at least: SAP S/4HANA, SAP ECC, Oracle E-Business Suite,
      Oracle Fusion/Financials Cloud, Microsoft Dynamics 365 Finance & Operations, Unit4 ERP,
      Infor, NetSuite, Workday, `generic_rest`, `generic_odata`.
- [ ] Two rows of the **same vendor** with different `legal_entity` values can coexist and are
      distinguishable in every list view that shows a system.
- [ ] A choice-value rename is prevented by convention and by a documented note on the table:
      "add, never rename — a renamed value orphans telemetry keyed on it." A rename in a later
      story is a governance failure, not a refactor.

### ServiceNow Implementation Notes
- Module: custom (control tower)
- Table(s): `x_335329_sn_hr_erp_erp_system`; references `sys_connection_alias` / auth-profile
  tables, `ecc_agent` for MID
- Components: table + choice lists + dictionary defaults; field ACLs from L0-4
- Doc reference: spec §5.1; sibling app `x_335329_erpcrm` `erp_system`

### Story Points: 5
### Priority: High
### Dependencies: L0-1

---

## Story L1-2: Reject internally contradictory connection configurations at save time

**As an** app admin
**I want** the platform to refuse a configuration that cannot possibly work
**So that** a misconfiguration surfaces at save time and not as a mystery outage at L2

### Acceptance Criteria
- [ ] Saving `auth_type=oauth2` together with `use_mid_server=true` is refused with the message
      `OAuth2 cannot be combined with a MID Server. Choose one.`
- [ ] Saving `auth_type=basic` with an OAuth2 auth-profile reference populated is refused with
      `Auth profile does not match the declared auth type (basic).`
- [ ] Saving `use_mid_server=true` with `mid_server` empty is refused with
      `MID Server is enabled but no MID Server is selected.`
- [ ] **All four validation branches are individually exercised** via the Table API against a real
      record, each producing its own message. A single passing happy-path save is not evidence for
      this story.
- [ ] The rule reads `use_mid_server` in a way that is proven correct against the platform's
      Boolean representation. A test inserts `use_mid_server=true` and asserts the rule fired; a
      rule whose Boolean branch is silently dead fails this story regardless of build cleanliness.
- [ ] **No outbound HTTP call is made by this rule.** A deliberately-broken fixture pointing at
      `https://erp-invalid.invalid` saves successfully. A rule that refuses to save an unreachable
      host fails this story — reachability is not a save-time concern.
- [ ] A valid row saves with no message.

### ServiceNow Implementation Notes
- Module: custom (control tower)
- Table(s): `x_335329_sn_hr_erp_erp_system`
- Components: `before` Business Rule (insert + update), `current.setAbortAction(true)` +
  `gs.addErrorMessage()`
- Doc reference: spec §5.1, §9 — `GlideRecord.getValue()` on a Boolean column returns `'1'`/`'0'`,
  not `'true'`/`'false'`. The sibling app shipped a rule with 3 of 4 branches dead on exactly this.

### Story Points: 5
### Priority: High
### Dependencies: L1-1

---

## Story L1-3: `object_map` plus a field-mapping admin surface an admin will actually use

**As an** app admin
**I want** to map an ERP's field names onto the logical contract without hand-writing JSON
**So that** onboarding a second ERP across 17+ objects is a config task rather than an ordeal

### Acceptance Criteria
- [ ] `object_map` exists with `erp_system`, `logical_object`, `endpoint_path`, `http_method`,
      `response_root`, `query_template`, `pagination_style`, `page_size`, `date_format`,
      `field_map`, `active`.
- [ ] `pagination_style` choices include `none`, `offset`, `page`, `cursor`, `odata_skiptop` and
      `next_url`.
- [ ] A unique index on (`erp_system`, `logical_object`) exists. Inserting a duplicate pair via
      the Table API is refused, and the refusal message names both values.
- [ ] `query_template` accepts and round-trips a literal `{external_id}` placeholder without
      substitution or corruption on save.
- [ ] An admin holding only `x_335329_sn_hr_erp.admin` can create a complete field mapping for one
      logical object **without typing a JSON brace**, timed and observed by the tester. If the only
      available path is editing a raw JSON blob in a text area, this story FAILS — that is OD4's
      explicit prohibition.
- [ ] Mapping a source field to a logical field that does not exist in the contract is refused
      with `Unknown logical field '<name>' for object '<object>'.`
- [ ] **Failure path:** an `object_map` saved with `active=true` and an empty `field_map` is either
      refused, or is accepted and reported in the unverified-mappings surface (L1-4) as
      `No field mapping — this object will return no usable rows.` Silently accepting it and
      returning empty rows at L3 is a FAIL.
- [ ] A `viewer`-only user cannot read `object_map`. Verified as that genuine non-admin user.

### ServiceNow Implementation Notes
- Module: custom (control tower)
- Table(s): `x_335329_sn_hr_erp_object_map` (+ a child mapping-row table if OD4 lands that way)
- Components: table, unique index, form layout / UI action for the mapping surface
- Doc reference: spec §5.2 requirement 1; **open item OD4** — the architect chooses child table vs
  JSON-plus-editor. This story tests the *outcome* (no hand-written JSON), not the shape.

### Story Points: 8
### Priority: High
### Dependencies: L1-1, OD4 resolved

---

## Story L1-4: Seeded per-vendor `mapping_template` rows with a `verified` flag

**As an** app admin
**I want** a starting mapping for my vendor that I explicitly choose to apply
**So that** I am not mapping 17 objects from a blank page, and I am never silently trusting a guess

### Acceptance Criteria
- [ ] `mapping_template` exists keyed on (`vendor`, `logical_object`) with a `field_map` payload
      and a `verified` Boolean.
- [ ] Every vendor in the L1-1 choice list has at least one seeded template row. A vendor with
      zero templates is listed in the story's completion note as a known gap, not silently absent.
- [ ] `verified` defaults to **false** on every seeded row. A query of `mapping_template` filtered
      to `verified=true` immediately after deploy returns **zero rows**.
- [ ] Defaults are applied only by an explicit "Apply vendor defaults" action. Inserting a new
      `object_map` row via the Table API and re-reading it shows `field_map` still empty — no
      business rule populated it on insert.
- [ ] **Overwrite protection:** an admin edits a mapping, then runs "Apply vendor defaults" again.
      The edited field keeps the admin's value; the action reports
      `Applied 6 default mappings, skipped 2 already edited by an admin.` An action that silently
      overwrites an admin edit fails this story.
- [ ] Any `object_map` whose `field_map` came from an unverified template renders a visible label
      on the form: `Unverified default mapping — this is a guess about <vendor>'s API. Confirm it
      against a real endpoint before trusting these figures.`
- [ ] A list view of unverified mappings exists and is reachable by an admin in one navigation step.
- [ ] **Failure path:** clearing `verified` back to false on a previously verified map restores the
      warning label on the `object_map` form.

### ServiceNow Implementation Notes
- Module: custom (control tower)
- Table(s): `x_335329_sn_hr_erp_mapping_template`, `x_335329_sn_hr_erp_object_map`
- Components: seed data records, UI Action "Apply vendor defaults", form annotation / info message.
  Field-sync pattern from the sibling app: apply per source field, skip empty source values so a
  re-apply never blanks existing data.
- Doc reference: spec §5.2 requirement 2 and its "every shipped default mapping is a guess"
  paragraph; §10.2 deliverables

### Story Points: 8
### Priority: High
### Dependencies: L1-3

---

# L2 — Connector runtime

## Story L2-1: Port the connector into this scope with its tests intact

**As a** developer
**I want** the sibling app's `ErpConnector` running inside `x_335329_sn_hr_erp`
**So that** retry, backoff, circuit-breaking and telemetry are inherited rather than reinvented

### Acceptance Criteria
- [ ] The connector source is present under this repo's `src/server/connector/` with the sibling's
      structure preserved.
- [ ] **All 21 ported tests pass in this scope**, and the run output is recorded. A count below 21
      fails this story; a test deleted to make the suite green fails it harder.
- [ ] `now-sdk query sys_script_include` confirms an active `ErpConnector` in scope
      `x_335329_sn_hr_erp`, and the module's `content` field is read to confirm the deployed body
      matches source. `sys_updated_on` is not accepted as evidence — it does not move on deploy.
- [ ] Grep of the ported source returns **zero** occurrences of `=== 'true'` or `!== 'true'`
      against a Boolean column read.
- [ ] No runtime reference to scope `x_335329_erpcrm` exists anywhere in this app. A cross-scope
      call at runtime fails this story per D4.
- [ ] Every module reaches the platform through a Script Include bridge; no `require()` appears in
      any script that could execute in a remote-table or vtable context.

### ServiceNow Implementation Notes
- Module: custom (connector runtime)
- Table(s): `sys_script_include`, `sys_module`, `call_log` (ported)
- Components: `ErpConnector` Script Include, `rest-client`, `circuit-breaker`, `backoff`,
  `classify`, `call-log`, `config-loader`
- Doc reference: D4 in `docs/decision-log.md`; spec §4.1, §9

### Story Points: 8
### Priority: High
### Dependencies: L1-1, L1-3

---

## Story L2-2: Resolve vendor default mappings at call time

**As an** integration runtime
**I want** to resolve which `field_map` applies for a (system × object) call
**So that** the mapping an admin sees on screen is the mapping the connector actually used

### Acceptance Criteria
- [ ] Given an `object_map` with its own `field_map`, the connector uses that map and the resolved
      map's origin is logged as `object_map`.
- [ ] Given an `object_map` whose `field_map` is empty and a matching `mapping_template` for the
      system's vendor, the connector does **not** silently fall back. Resolution follows whatever
      OD4/§5.2 decided, and the logged origin states which was used. A figure whose provenance
      cannot name the mapping that produced it fails this story.
- [ ] Given no `object_map` at all for the requested logical object, the connector returns a
      distinguishable `not_configured` outcome — not an empty array, not a thrown exception
      indistinguishable from a network failure.
- [ ] Given an `object_map` referencing a `logical_object` with no mapped fields, the outcome is
      reported as a configuration error naming the object, not as zero rows.
- [ ] A source field present in the ERP response but absent from `field_map` is dropped without
      error; a *logical* field required by the object and absent from `field_map` is reported.
- [ ] The resolved map is logged per call so a wrong figure can be traced back to the mapping row
      that produced it.

### ServiceNow Implementation Notes
- Module: custom (connector runtime)
- Table(s): `object_map`, `mapping_template`, `call_log`
- Components: mapping-resolution module inside `ErpConnector`
- Doc reference: spec §4.1, §5.2

### Story Points: 5
### Priority: High
### Dependencies: L2-1, L1-4

---

## Story L2-3: Outbound-call hardening and the L2 evidence gate

**As a** security-conscious integrator
**I want** the connector's failure and safety behaviour demonstrated live, not asserted
**So that** L3 is built on a runtime that has been seen to fail correctly

### Acceptance Criteria
- [ ] **One successful live call** against the approved test host is logged with `status=success`,
      a real `http_code` and a real `duration_ms`. Pasted as evidence.
- [ ] **One forced-failure call** is logged, and `erp_system.circuit_open_until` is read before and
      after and shown to populate. Both reads pasted as evidence. An empty
      `circuit_open_until` after the failure threshold fails this story — that was the sibling's
      most expensive investigation.
- [ ] A 3xx response is treated as a **non-retryable failure** and no redirect is followed. Proven
      by pointing an `object_map` at an endpoint that 302s and confirming zero requests reach the
      redirect target. An `Authorization` header leaving the configured host fails this story.
- [ ] `disableForcedVariableSubstitution()` is called on outbound messages. Proven by configuring
      a `base_url` or `query_template` containing a literal `${x}` and confirming the outbound URL
      contains it unaltered.
- [ ] `setMIDServer()` is passed the MID server's **name**. A test with a sys_id passed instead is
      shown to silently not route, and the code path that prevents it is demonstrated.
- [ ] Both `RESTMessageV2.execute()` outcomes are handled: a case where it **throws** and a case
      where it **returns a response with `haveError()` true** are each exercised, and both produce
      the same classified failure and a `call_log` row.
- [ ] Any test driver created for this story ships `active: false` in source **and** reads back
      `active: false` on the instance after the final deploy.

### ServiceNow Implementation Notes
- Module: custom (connector runtime)
- Table(s): `erp_system`, `call_log`, `sysauto_script`
- Components: `RESTMessageV2`, circuit breaker, classifier, scheduled test drivers
- Doc reference: spec §4.2 L2 gate, §9 "Platform"; open item OD3 (real ERP endpoint — until then,
  `postman-echo.com` is the approved test host)

### Story Points: 8
### Priority: High
### Dependencies: L2-1

---

# L3 — Staging, sync runs, provenance, staleness

## Story L3-1: `erp_staging` with a full provenance contract

**As a** data consumer
**I want** every staged row to carry which system, which object, which source record and when
**So that** any figure on any tab can be traced to the ERP response that produced it

### Acceptance Criteria
- [ ] `erp_staging` carries `erp_system` (reference), `erp_category`, `logical_object`,
      `source_record_id`, `fetched_at`, `sync_run` (reference), and the mapped payload.
- [ ] `erp_category` choices are exactly `finance`, `procurement`, `inventory`, `assets`,
      `manufacturing`. **`hr` is not a choice.** A row inserted with `erp_category=hr` is refused.
- [ ] `logical_object` choices include the additive objects from spec §6: `fixed_asset`,
      `asset_depreciation`, `maintenance_schedule`. `payroll_record` and `employee_profile` are
      **not** valid `logical_object` values on this table — an insert naming either is refused with
      `Payroll and employee data are never staged (decision D2).`
- [ ] No column anywhere in the app stores a salary, a pay rate, or a payroll amount. Proven by a
      dictionary scan of the scope at sign-off.
- [ ] Every provenance field carries a hard deny-write field ACL from L0-4; the admin-write refusal
      is re-verified here against a real staged row.
- [ ] A staged row whose `sync_run` reference is empty is impossible: inserting one via the Table
      API is refused.
- [ ] The rejected shape alternative (wide+JSON vs per-object tables vs header+promoted columns) is
      recorded in `docs/decision-log.md`, closing OD5. An unrecorded choice fails this story.

### ServiceNow Implementation Notes
- Module: custom (staging)
- Table(s): `x_335329_sn_hr_erp_erp_staging`
- Components: table, choice lists, mandatory reference, deny-write field ACLs
- Doc reference: spec §5.3; D2; **open item OD5**

### Story Points: 8
### Priority: High
### Dependencies: L0-4, L2-2, OD5 resolved

---

## Story L3-2: `sync_run` — the audit spine that makes four states possible

**As a** dashboard
**I want** one row per sync execution recording exactly what happened
**So that** zero rows can be told apart from a failed call and from a never-configured object

### Acceptance Criteria
- [ ] `sync_run` records `erp_system`, `logical_object`, started, finished, `status`, rows fetched,
      rows upserted, rows deleted, http status, error message, duration.
- [ ] `status` choices are exactly `success`, `partial`, `failed`, `not_configured`.
- [ ] **Three-way distinguishability is proven by query, not by inspection:**
      (a) an object with a working map and an ERP returning an empty array produces
      `status=success, rows_fetched=0`;
      (b) the same object pointed at an unreachable host produces `status=failed` with a non-empty
      `error_message` and `rows_fetched` empty (not `0`);
      (c) an object with no `object_map` produces either `status=not_configured` or no run at all,
      and whichever it is, the L4 resolver reads it as not-configured.
      All three states are queried back and pasted as evidence.
- [ ] A `partial` run is exercised: a paginated fetch that succeeds for page 1 and fails on page 2
      is recorded as `partial`, with the error message naming the page that failed, and its rows
      are **not** presented as a complete set at L4.
- [ ] `error_message` is populated for every `failed` run. A `failed` run with an empty
      `error_message` fails this story.
- [ ] A `viewer`-only user can read `sync_run` status and timestamps (needed for "as of" and the
      failure sentence) but cannot read `error_message` if it can contain endpoint or credential
      detail. Verified as that genuine non-admin user.

### ServiceNow Implementation Notes
- Module: custom (staging)
- Table(s): `x_335329_sn_hr_erp_sync_run`
- Components: table, choice list, field ACLs
- Doc reference: spec §5.4 — "this table is what makes §7 possible"

### Story Points: 5
### Priority: High
### Dependencies: L2-3

---

## Story L3-3: Sync engine — idempotent upsert, batched, per (system × object)

**As an** operator
**I want** a sync to update existing staged rows rather than duplicate them
**So that** a figure does not double every time a sync runs

### Acceptance Criteria
- [ ] Running the same sync twice against an unchanged ERP response leaves the staged row **count
      unchanged** and updates `fetched_at` and `sync_run` on the existing rows. A doubled count
      fails this story.
- [ ] Upsert matches on (`erp_system`, `logical_object`, `source_record_id`). A response row with
      an empty `source_record_id` is rejected into the run's error detail, not inserted as an
      orphan that can never be updated.
- [ ] A row present in staging but absent from the latest successful response is handled by an
      explicitly-decided rule (delete / mark stale / retain) and `rows_deleted` reflects it. The
      chosen rule is written into the decision log.
- [ ] **Batching:** a sync of N rows issues a bounded number of queries independent of N. Proven by
      running a 200-row fixture and counting queries; a count that scales with N fails this story.
- [ ] **A failed run never deletes staged rows.** Proven: stage 50 rows successfully, force the
      next run to fail, confirm all 50 rows still present, unchanged, and that the L4 resolver now
      reports them via the failed-with-history sentence.
- [ ] A refresh action triggered from the UI syncs only the objects the **active tab** needs. A
      refresh that fans out to every configured system fails this story.
- [ ] Any scheduled sync job ships `active: false` until explicitly armed, and is confirmed
      `active: false` on the instance after the final deploy.

### ServiceNow Implementation Notes
- Module: custom (staging)
- Table(s): `erp_staging`, `sync_run`, `erp_system`, `object_map`
- Components: Script Include sync engine, Scheduled Job, batched `IN` queries via
  `GlideRecord.addQuery('field','IN',ids)` — collect ids first, then one query
- Doc reference: spec §5.3, §9 "Batch, never loop"; sibling app N+1 rewrites

### Story Points: 13
### Priority: High
### Dependencies: L3-1, L3-2

---

## Story L3-4: Staleness as a first-class, configurable state

**As a** person reading a figure
**I want** to be told when the number I am looking at is old
**So that** I never act on last week's cash position believing it is today's

### Acceptance Criteria
- [ ] A staleness threshold is stored in a `sys_property` and is changeable without a redeploy.
      Changing it and reloading a tab flips a tile between live and stale with no code change.
- [ ] The `sys_property` is confirmed present on the instance by query after deploy. If it was
      declared via the Fluent `Record()` pattern with a placeholder sys_id and is **absent**, the
      property is created in the browser and the real sys_id copied back into the keys file — the
      known silent-skip trap.
- [ ] A staged row with `fetched_at` older than the threshold renders
      `Stale — as of 09 Aug 2026 03:00 (3 days old)` per §0.
- [ ] A staged row inside the threshold renders `as of <date time>` with no stale marker.
- [ ] The age shown is computed from `fetched_at`, not from `sys_updated_on`. Proven by editing an
      unrelated field on a staged row (as a role permitted to) and confirming the displayed age
      does not reset.
- [ ] A stale figure is still *shown*, not hidden. Hiding it and rendering nothing fails this
      story — a missing tile reads as zero.

### ServiceNow Implementation Notes
- Module: custom (staging)
- Table(s): `erp_staging`, `sys_properties`
- Components: `sys_property` threshold, state resolver
- Doc reference: spec §2 binding consequence 1, §7; §9 Fluent `sys_properties` trap

### Story Points: 5
### Priority: High
### Dependencies: L3-1

---

## Story L3-5: Retention policy for staged financial data (OD1)

**As a** data protection owner
**I want** staged ERP financial data to expire on a stated schedule
**So that** the app does not accumulate an indefinite copy of another system's finances

### Acceptance Criteria
- [ ] A written retention proposal exists in `docs/decision-log.md` closing OD1, stating a
      retention window per `erp_category` and the reasoning.
- [ ] Explicit human approval of that proposal is recorded before any deletion mechanism is armed.
      An armed cleaner without recorded approval fails this story.
- [ ] Rows older than the window are removed by the approved mechanism, verified by inserting a
      back-dated row and observing its removal on the next cycle.
- [ ] **`sync_run` rows are retained longer than the `erp_staging` rows they produced**, or the
      policy explicitly states otherwise. Deleting the audit spine before the data it explains
      fails this story.
- [ ] Deletion never removes a `document_request` or its attached document — those carry their own
      retention and are named separately in the policy.
- [ ] The cleaner ships disarmed and is armed only by an explicit step recorded in the build report.

### ServiceNow Implementation Notes
- Module: custom (staging)
- Table(s): `erp_staging`, `sync_run`, `sys_auto_flush` / table cleaner
- Components: table cleaner or scheduled deletion job, scoped to this app's tables only
- Doc reference: `ServiceNowOfficialDocs/it-service-management/devops-change-velocity/dev-ops-archive-cleanup-events-table-records.md`
  (table cleaners + retention with table rotation);
  `ServiceNowOfficialDocs/it-operations-management/event-management/rotate-tables-purge-data.md`;
  spec §2 binding consequence 3; **open item OD1**

### Story Points: 5
### Priority: Medium
### Dependencies: L3-1, L3-2, OD1 approved

---

# L4 — Scripted REST API

## Story L4-1: One fat `GET /data` per tab

**As a** SPA
**I want** a single call per tab returning that tab's entire dataset
**So that** a tab open is one round trip, not one per widget

### Acceptance Criteria
- [ ] A Scripted REST API exists at `/api/x_335329_sn_hr_erp/<service>` with a `GET /data`
      resource taking a tab identifier.
- [ ] `GET /data?tab=financial` returns KPIs, chart series and list rows for Tab 1 in **one**
      response. A tab requiring two calls to render fails this story.
- [ ] Response keys are short and compact; the shape is documented alongside the API so the SPA and
      the future UIB spec bind against a written contract, not against observed output.
- [ ] Requesting `?tab=inventory` executes **no** query against finance objects. Proven by
      instrumenting query counts per request; cross-tab fan-out fails this story.
- [ ] An unknown `tab` value returns HTTP 400 with `Unknown tab '<value>'.` — not 200 with an
      empty body, and not 500.
- [ ] A missing `tab` parameter returns HTTP 400 naming the missing parameter.

### ServiceNow Implementation Notes
- Module: custom (API layer)
- Table(s): `sys_ws_definition`, `sys_ws_operation`
- Components: Scripted REST API + resource, backed by a Script Include so no business logic lives
  in the resource script
- Doc reference: `ServiceNowOfficialDocs/api-reference/rest-api-explorer/t_WbSvcRqACL.md`;
  spec §1.2 (Capacity Planner pattern), D1 binding — payload shaped for a client-side view state
  machine, not for UIB data resources

### Story Points: 8
### Priority: High
### Dependencies: L3-3

---

## Story L4-2: The payload carries every tile's state explicitly

**As a** renderer
**I want** the server to tell me which of the four states each tile is in
**So that** the client never has to guess from an absent key or a zero

### Acceptance Criteria
- [ ] Every KPI, chart series and list in the payload carries an explicit state field valued
      `live`, `not_configured`, `failed` or `stale`. A tile object with no state field fails this
      story.
- [ ] `not_configured` tiles carry the `logical_object` name so the client can render
      `Not configured — create an Object Map for `stock_item``. A not-configured tile that omits
      the object name fails — the sentence cannot be constructed without it.
- [ ] `failed` tiles carry the last successful figure and its `fetched_at`, when one exists, and a
      flag saying none exists when it does not.
- [ ] `stale` tiles carry the figure and the `fetched_at` that makes it stale.
- [ ] **A `live` tile whose ERP genuinely returned zero carries `value: 0` and `state: live`.**
      Exercised with a fixture returning an empty array under a `success` run.
- [ ] **A `not_configured` or `failed` tile never carries `value: 0`.** Asserted on the raw JSON
      for every tile across all five tabs — 15 KPIs, 5 charts, 5 lists. A `0` under a non-live
      state fails this story outright.
- [ ] A multi-system tile where one system succeeded and one failed returns the partial state and
      names the degraded system.
- [ ] The four states are produced for at least one tile on **every** tab, by manipulating fixtures,
      and the raw JSON for each is pasted as evidence. Happy-path-only evidence fails this story.

### ServiceNow Implementation Notes
- Module: custom (API layer)
- Table(s): `erp_staging`, `sync_run`, `object_map`, `erp_system`
- Components: state-resolution Script Include — the single place the four-state rule is decided.
  One implementation, consumed by both the SPA and (later) UIB data resources.
- Doc reference: spec §7; sibling `src/server/agent/command-center-spec.ts` header comment

### Story Points: 13
### Priority: High
### Dependencies: L4-1, L3-2, L3-4

---

## Story L4-3: Role gating at the API, not just at the UI

**As a** security owner
**I want** the API itself to refuse data the caller's role does not cover
**So that** hiding a tile in the SPA is not the only thing standing between a viewer and financials

### Acceptance Criteria
- [ ] Called as the `viewer`-only test user, `GET /data?tab=financial` returns the tab structure
      with financial figures **absent or state-gated**, never with the numbers present and merely
      flagged for the client to hide.
- [ ] Called as the `finance_viewer`-only test user, the same call returns financial figures.
- [ ] Called as the `finance_viewer`-only test user, any HR/payroll-bearing endpoint returns a
      refusal. `finance_viewer` does not imply `hr_viewer`.
- [ ] Called as the `hr_viewer`-only test user, `GET /data?tab=financial` does **not** return
      financial figures. `hr_viewer` does not imply `finance_viewer`.
- [ ] Called unauthenticated, the API returns 401.
- [ ] Every one of the above is executed as a genuine non-admin user session. Results from an
      admin session, or from an impersonation that elevates, are not accepted as evidence.
- [ ] A gated tile returns a state the client can render as a refusal sentence, not as `0` and not
      as a blank tile.

### ServiceNow Implementation Notes
- Module: custom (API layer) / security
- Table(s): `sys_ws_operation`, `sys_security_acl`, `sys_user_has_role`
- Components: resource-level ACL requirement plus in-script role checks that query
  `sys_user_has_role` rather than calling `gs.hasRole()`
- Doc reference: `ServiceNowOfficialDocs/api-reference/rest-api-explorer/t_WbSvcOpRqACL.md`
  (resource-level ACL overriding inherited API security);
  `ServiceNowOfficialDocs/api-reference/rest-api-explorer/add-a-path-based-acl-for-a-scripted-rest-api.md`;
  spec §5.6, §9 (`gs.hasRole()` lies under `runAs`)

### Story Points: 8
### Priority: High
### Dependencies: L4-1, L0-3

---

## Story L4-4: Batched reads and a bounded query budget per tab

**As an** instance
**I want** a tab open to cost a predictable, small number of queries
**So that** the hub does not degrade as staged data grows

### Acceptance Criteria
- [ ] For each of the five tabs, the query count for one `GET /data` call is measured and recorded.
- [ ] Query count is independent of row count. Proven by running each tab against a 50-row and a
      5,000-row staging fixture and observing the same count.
- [ ] No code path issues a `GlideRecord` query inside a loop over result rows. Verified by reading
      the code and by the count-invariance test above.
- [ ] Reference fields needed for display (system name, sync status) are fetched by one batched
      `IN` query per reference, not per row.
- [ ] A recorded query budget per tab exists so a later regression is detectable. A tab that
      exceeds its budget after a change is a FAIL, not a "performance note".

### ServiceNow Implementation Notes
- Module: custom (API layer)
- Table(s): `erp_staging`, `sync_run`, `erp_system`
- Components: batched `IN` queries; `GlideAggregate` where a count or sum is all that is needed
- Doc reference: spec §1.2 ("both hot paths were originally N+1 and were rewritten"), §9

### Story Points: 5
### Priority: Medium
### Dependencies: L4-1

---

# L5 — The BYOUI 5-tab SPA

## Story L5-1: BYOUI page shell, bundled asset, and the client view state machine

**As a** user
**I want** the hub to load as one page with five switchable tabs
**So that** I move between domains without a page reload and without loading data I am not viewing

### Acceptance Criteria
- [ ] A `sys_ui_page` is served at `<scope>_hub.do` and loads a built JS asset registered as
      `sys_ux_lib_asset`.
- [ ] A `switchView()`-style client state machine toggles five named views. Switching tabs does not
      reload the page.
- [ ] **Lazy loading:** opening the page issues exactly one `GET /data` call, for the default tab.
      Switching to a second tab issues exactly one further call. Verified in the browser network
      panel. A page open that calls `/data` five times fails this story.
- [ ] Returning to an already-loaded tab issues no new call unless the user explicitly refreshes.
- [ ] No script or stylesheet is loaded from an external CDN. Any third-party library is bundled
      locally. A CSP-blocked request in the browser console fails this story.
- [ ] After deploy, a hard refresh is performed and documented as a required step; a stale cached
      asset producing old behaviour is a known trap, not a bug report.
- [ ] With JavaScript errors present, the page shows an explicit error region rather than a blank
      white page. A blank page reads as "no data" and violates §0 R1 in spirit.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): `sys_ui_page`, `sys_ux_lib_asset`, `sys_ux_lib_source_script`
- Components: single-file vanilla-JS SPA, no framework; Fluent-authored page + asset
- Doc reference: D1 in `docs/decision-log.md`; spec §1.2 (Capacity Planner pattern), §9 (hard
  refresh; CSP blocks CDN libraries)

### Story Points: 8
### Priority: High
### Dependencies: L4-1

---

## Story L5-2: Workspace shell around the hub

**As a** user
**I want** the hub reachable from a proper workspace shell
**So that** it is navigable like a first-class app rather than a bookmarked `.do` URL

### Acceptance Criteria
- [ ] A workspace shell is authored from source via the Fluent Workspace API and deploys clean.
- [ ] The hub is reachable from the workspace navigation in one click, as the `viewer`-only test
      user.
- [ ] Every `sys_ux_*` record authored declares its mandatory fields (for example `schema_version`
      on a macroponent). A deploy failure caused by a missing mandatory field is fixed in source,
      not by hand-creating the record in the browser.
- [ ] Navigation links use `.do` / `_list.do` suffixes. A link using `.list` is a FAIL — it breaks
      in the Next Experience shell.
- [ ] The shell renders for a user holding only `viewer` without exposing any admin configuration
      module in the navigation.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): `sys_ux_page`, `sys_ux_app_route`, `sys_ux_macroponent`, `sys_ux_app_config`
- Components: Fluent Workspace API declarations
- Doc reference: D1; spec §9 (`sys_ux_*` authorable but demand mandatory fields; `.do` not `.list`)

### Story Points: 5
### Priority: Medium
### Dependencies: L5-1

---

## Story L5-3: One renderer for the four states, used by every tile

**As a** developer
**I want** a single client-side renderer that turns a payload state into the §0 sentence
**So that** twenty tiles cannot drift into twenty different interpretations of "no data"

### Acceptance Criteria
- [ ] One renderer function handles all four states and is the only place a tile's text is produced.
      A tile with its own inline state handling fails this story.
- [ ] Given `state: not_configured, object: 'stock_item'` the renderer outputs exactly
      `Not configured — create an Object Map for `stock_item``.
- [ ] Given `state: failed` with a prior figure, it outputs `ERP did not answer` followed by
      `Last good figure: 1,204 (as of 11 Aug 2026 09:14, 1 day old)`.
- [ ] Given `state: failed` with no prior figure, it outputs `ERP did not answer — no previous
      figure` and renders **no numeral at all**.
- [ ] Given `state: stale` it outputs the figure followed by
      `Stale — as of 09 Aug 2026 03:00 (3 days old)`.
- [ ] Given `state: live, value: 0` it outputs `0` followed by `as of <date time>`.
- [ ] Given a payload object with a **missing or unrecognised** state, the renderer outputs
      `State unavailable — this tile cannot be trusted` and never falls back to displaying the
      raw value. Defaulting to "live" on an unknown state fails this story.
- [ ] The four states are visually distinct — colour alone is not the distinction, since colour is
      invisible to a screen reader and to a colour-blind reader. Text carries the meaning.
- [ ] A unit-level check exists that feeds each state into the renderer and asserts the exact
      output string. A renderer change that breaks a sentence fails that check.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): none (client-side)
- Components: SPA renderer module + a small assertion harness
- Doc reference: spec §7, §10.3

### Story Points: 5
### Priority: High
### Dependencies: L5-1, L4-2

---

## Story L5-4: Tab 1 — Financial Health & Ledger

**As a** finance viewer
**I want** cash position, receivables, payables, a revenue-vs-expense chart and overdue vendor
invoices
**So that** I can see the financial picture across every connected ERP in one place

### Acceptance Criteria
- [ ] Three KPI scorecards render: real-time cash balance, open accounts receivable, open accounts
      payable — each with its own state per §0.
- [ ] A bar chart renders monthly revenue vs operating expenses as two series.
- [ ] A list renders the top 10 overdue vendor invoices, sorted by amount descending.
- [ ] **Not configured:** with no `object_map` for `vendor_invoice`, the payables tile reads
      `Not configured — create an Object Map for `vendor_invoice`` and shows no numeral.
- [ ] **Failed:** with the finance system pointed at an unreachable host, the cash tile reads
      `ERP did not answer` plus the last good figure and its age. It does not read `0`.
- [ ] **Stale:** with `fetched_at` back-dated past the threshold, the receivables tile shows its
      figure plus `Stale — as of <date time> (<n> days old)`.
- [ ] **Live zero:** with a fixture returning an empty array under a `success` run, the payables
      tile reads `0` with an `as of` timestamp — and this is the only path by which `0` appears.
- [ ] **Chart states:** with no map for `gl_summary`, the chart area renders the not-configured
      sentence and draws **no axes and no empty bars**. An empty chart frame reads as "zero
      revenue".
- [ ] **List states:** with a failed run, the list renders `ERP did not answer` and no rows, not an
      empty table with a "No records" message that reads as "no overdue invoices".
- [ ] Each invoice row deep-links to the ERP record via `erp_system.base_url` + per-object path.
- [ ] **No deep-link field mapped ⇒ no link drawn.** The row still renders; the link is absent, not
      a dead anchor.
- [ ] Rendered as the `finance_viewer`-only test user, the tab is fully populated. Rendered as the
      `viewer`-only user, financial figures are not present in the page source — not merely hidden
      by CSS. Verified by viewing the network payload as that genuine non-admin user.
- [ ] No CRM content appears: no opportunity, lead, deal or account-360 element anywhere on the tab.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): `erp_staging` (`erp_category=finance`), `sync_run`
- Components: SPA view, KPI/chart/list components, L5-3 renderer
- Doc reference: spec §6 Tab 1, §7; sibling `command-center-spec.ts` `financial` tab

### Story Points: 8
### Priority: High
### Dependencies: L5-3, L4-2, L4-3

---

## Story L5-5: Tab 2 — Procurement & Sourcing, read-only per D3

**As a** procurement viewer
**I want** open POs, pending requisitions, YTD spend, a supplier spend donut and an approvals list
**So that** I can see what is outstanding — and be told plainly that I cannot decide it here

### Acceptance Criteria
- [ ] Three KPI scorecards render: total open purchase orders, requisitions pending approval,
      year-to-date procurement spend — each with its own state per §0.
- [ ] A donut chart renders spend distribution by supplier / vendor category.
- [ ] An approvals list renders requisitions awaiting a decision.
- [ ] **No Approve control and no Reject control is rendered anywhere on this tab**, in any state,
      for any role including `admin`. A disabled, greyed or hidden Approve button also fails this
      story — the requirement is that it is not drawn at all.
- [ ] A grep of the built SPA asset for `approve` / `reject` as user-facing control labels returns
      nothing. Text inside the caveat sentence is the only permitted occurrence.
- [ ] The caveat renders above the list, visibly, in every state, reading:
      `Approve and Reject are not shown. These requisitions live in the ERP and are not mirrored
      into ServiceNow approvals, so a decision made here could not be written back. Use the ERP
      link on each row.`
- [ ] Each requisition row deep-links to the ERP record. **If the deep-link field is unmapped, no
      link is drawn** — and in that case the caveat still renders, because it is the honest state
      even when the escape route is missing.
- [ ] All four §0 states verified on at least the "requisitions pending approval" tile, including
      that a failed procurement system does **not** render `0 requisitions pending approval`.
- [ ] The caveat is present in the not-configured and failed states too. A caveat that only appears
      alongside data fails this story.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): `erp_staging` (`erp_category=procurement`), `sync_run`
- Components: SPA view, static caveat element, deep-link builder
- Doc reference: D3 in `docs/decision-log.md` ("never draw a button that cannot commit its
  decision"); spec §6 Tab 2, §10.3; sibling `command-center-spec.ts` `commercial` tab caveat

### Story Points: 8
### Priority: High
### Dependencies: L5-3, L4-2

---

## Story L5-6: Tab 3 — Inventory & Supply Chain

**As an** operations viewer
**I want** SKU count, low-stock alerts, backorders, stock by warehouse and a reorder list
**So that** I can act on what is actually running out

### Acceptance Criteria
- [ ] Three KPI scorecards render: total SKU count, low-stock alerts, backordered items — each with
      its own state per §0.
- [ ] A bar chart renders stock distribution by warehouse location.
- [ ] A list renders the critical reorder list, filtered to items where quantity on hand is below
      that item's own safety-stock threshold.
- [ ] **The founding case:** with the warehouse system unreachable, the low-stock tile reads
      `ERP did not answer` and **never** `0 low stock alerts`. This criterion is the single most
      important assertion in the whole backlog and must be executed live, not reasoned about.
- [ ] With no `object_map` for `stock_item`, the SKU tile reads exactly
      `Not configured — create an Object Map for `stock_item``.
- [ ] With a `success` run returning an empty array, the low-stock tile reads `0` with an `as of`
      timestamp — genuinely nothing is below safety stock.
- [ ] The low-stock filter compares quantity against **each item's own** `safety_stock` field, not
      a global constant. Verified with a fixture containing two items with different thresholds
      where only one should be flagged.
- [ ] If `safety_stock` is unmapped, the low-stock tile renders not-configured naming the missing
      field, rather than comparing against an implicit zero and reporting no alerts.
- [ ] Reorder rows deep-link to the ERP; unmapped deep-link field ⇒ no link drawn.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): `erp_staging` (`erp_category=inventory`), `sync_run`
- Components: SPA view, filtered list, comparison against a per-row field
- Doc reference: spec §6 Tab 3, §7; sibling `command-center-spec.ts` `inventory` tab

### Story Points: 8
### Priority: High
### Dependencies: L5-3, L4-2

---

## Story L5-7: Tab 4 — Fixed Assets & Equipment (display-only)

**As an** asset viewer
**I want** asset valuation, quarterly depreciation, maintenance due, a lifecycle pie and an
end-of-life list
**So that** I can see the ERP's asset picture without it being confused with the CMDB's

### Acceptance Criteria
- [ ] KPI scorecards render: total asset valuation, assets depreciated this quarter, assets due for
      maintenance — each with its own state per §0.
- [ ] A pie chart renders enterprise assets by lifecycle stage (Active / In Maintenance / Retired).
- [ ] A list renders high-value capital assets nearing end-of-life.
- [ ] **The tab is display-only.** No reconciliation against `alm_asset` or `cmdb_ci` is performed
      and no matched/unmatched indicator is rendered. A partial reconciliation shipped as a hint
      fails this story — a half-reconciled asset view is worse than an honestly unreconciled one.
- [ ] A visible note states the source: `Figures are from the ERP and are not reconciled against
      ServiceNow asset or CMDB records.`
- [ ] OD6 is closed in `docs/decision-log.md` recording display-only and the rejected alternative.
- [ ] All four §0 states verified on the valuation tile, including that an unreachable asset system
      does not render `0` valuation.
- [ ] With `asset_depreciation` unmapped, the depreciation tile reads
      `Not configured — create an Object Map for `asset_depreciation``, while the other two tiles
      continue to render their own independent states. One unconfigured object must not blank the
      tab.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): `erp_staging` (`erp_category=assets`), `sync_run`. `alm_asset` / `cmdb_ci` exist on
  the instance but are deliberately **not** queried at this layer.
- Components: SPA view, source note
- Doc reference: spec §6 Tab 4; **open item OD6** (default display-only)

### Story Points: 8
### Priority: Medium
### Dependencies: L5-3, L4-2, OD6 resolved

---

## Story L5-8: Tab 5 — Manufacturing & Production, including an honest OEE

**As a** production viewer
**I want** OEE, active and delayed work orders, output vs target, and a downtime log
**So that** I can see plant performance — and never see an OEE figure that was quietly invented

### Acceptance Criteria
- [ ] KPI scorecards render: OEE %, active work orders, delayed orders — each with its own state
      per §0.
- [ ] A line chart renders daily production output volume vs target as two series.
- [ ] A list renders machine downtime logs with severity badges.
- [ ] **OEE provenance is explicit:** the tile states whether the figure came from the ERP or was
      computed here. If computed, the tile names the components used
      (`Computed from availability × performance × quality`).
- [ ] **If any OEE input is unmapped, the tile renders not-configured naming the missing input**,
      for example `Not configured — 'quality' is not mapped for OEE`. It never substitutes 1.0,
      never treats a missing factor as neutral, and never renders a partial-product figure. A
      silently-wrong OEE is a number an executive acts on.
- [ ] An OEE outside 0–100% is not rendered as a figure; it renders
      `OEE out of range (<value>) — check the mapping` so a mapping error surfaces rather than
      printing 400%.
- [ ] OD7 is closed in `docs/decision-log.md` stating supplied-vs-computed and, if computed, the
      exact source fields.
- [ ] All four §0 states verified on the active-work-orders tile, including that a failed MES does
      not render `0 active work orders`.
- [ ] The output-vs-target chart, when target is unmapped, draws the output series alone and states
      `Target not mapped` — it does not draw a target line at zero.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): `erp_staging` (`erp_category=manufacturing`), `sync_run`
- Components: SPA view, OEE computation (if OD7 lands that way) in the **server** state resolver,
  not in the client
- Doc reference: spec §6 Tab 5; **open item OD7**

### Story Points: 8
### Priority: Medium
### Dependencies: L5-3, L4-2, OD7 resolved

---

## Story L5-9: Access control verified in a browser as genuine non-admin users

**As a** security owner
**I want** every role boundary proven through a real interactive session
**So that** the ACLs are load-bearing rather than decorative

### Acceptance Criteria
- [ ] Logged into the browser as the `viewer`-only test user: the hub loads, operational tabs
      render, and Tab 1's financial figures are absent from the network payload.
- [ ] Logged in as the `finance_viewer`-only user: Tab 1 renders fully; no HR or payroll surface is
      reachable; the document-request surfaces are refused.
- [ ] Logged in as the `hr_viewer`-only user: HR document surfaces are reachable; Tab 1 financial
      figures are absent from the network payload. `hr_viewer` grants nothing on the finance tab.
- [ ] Logged in as the `viewer`-only user: no configuration module (`erp_system`, `object_map`,
      `mapping_template`) appears in the navigation and direct navigation to their list URLs is
      refused with a security message, not an empty list. An empty list reads as "no systems
      configured" and is a §7 violation delivered by an ACL.
- [ ] Every criterion above is executed in a real browser session **as that user**, not by admin
      impersonation from an elevated session, and evidence is recorded per user.
- [ ] The three test users hold **only** the intended role — re-verified against `sys_user_has_role`
      immediately before testing, because a role added for convenience mid-build silently voids
      every assertion here.
- [ ] Any surface that refuses access says so. A blank region is a FAIL.

### ServiceNow Implementation Notes
- Module: custom (UI) / security
- Table(s): `sys_user_has_role`, `sys_security_acl`
- Components: browser verification pass against L0-4, L4-3 and every tab story
- Doc reference: spec §9 "Test as a genuine non-admin user", §10.3; sibling app's OD9 —
  all its prior evidence came from `runAs` jobs and had to be redone interactively

### Story Points: 8
### Priority: High
### Dependencies: L5-4 … L5-8, L4-3

---

## Story L5-10: ERP deep links that are never dead

**As a** user
**I want** a row action that takes me to the record in the source ERP
**So that** I can act where the data actually lives — or be given nothing rather than a 404

### Acceptance Criteria
- [ ] A row whose deep-link field is mapped renders a link built as
      `<erp_system.base_url>/<per-object path>/<value>` and the constructed URL is asserted
      character-for-character in one test.
- [ ] A row whose deep-link field is **not** mapped renders **no anchor element**. Asserted against
      the DOM, not by eye — a styled-as-disabled anchor still fails.
- [ ] A row whose deep-link value is empty on an otherwise-mapped object renders no anchor.
- [ ] A `base_url` with a trailing slash and one without both produce a URL with exactly one slash
      at the join.
- [ ] The link opens the ERP in a new context and does not carry any ServiceNow session artefact in
      the URL.
- [ ] Links are present on Tab 1 invoices, Tab 2 requisitions, Tab 3 reorder items, Tab 4 assets
      and Tab 5 downtime rows — or explicitly absent for a stated reason per tab.

### ServiceNow Implementation Notes
- Module: custom (UI)
- Table(s): `erp_system.base_url`, `object_map.field_map`
- Components: client-side link builder, one implementation shared by all five lists
- Doc reference: spec §6 cross-cutting requirements; sibling `command-center-spec.ts`
  `deepLinkField` / `deepLinkPath` contract

### Story Points: 3
### Priority: Medium
### Dependencies: L5-3

---

# L6 — HR document generation

## Story L6-1: `employee_xref` — a join key and nothing more

**As a** privacy owner
**I want** the only persisted employee data to be the link between a ServiceNow user and an ERP key
**So that** this app never becomes a shadow HR database

### Acceptance Criteria
- [ ] `employee_xref` holds a reference to `sys_user`, the ERP-side employee key, and the source
      `erp_system` — and no name, salary, grade, address, or contract field.
- [ ] A dictionary scan of `employee_xref` at sign-off returns no column that could hold HR content.
      Any such column fails this story.
- [ ] The (`sys_user`, `erp_system`) pair is unique; a duplicate insert is refused.
- [ ] A `sys_user` with no xref row produces, at generation time, the specific message
      `Cannot generate <document type>: no employee cross-reference exists for <user>.` — not a
      generic failure and not a document.
- [ ] Read access to `employee_xref` requires `hr_viewer` or `admin`. A `finance_viewer`-only user
      reading it is refused, verified as that genuine non-admin user.
- [ ] The xref is never populated from a sync. It is administered explicitly, and there is no code
      path that writes it as a side effect of an ERP fetch.

### ServiceNow Implementation Notes
- Module: custom (HR)
- Table(s): `x_335329_sn_hr_erp_employee_xref`, `sys_user`
- Components: table, unique index, ACLs
- Doc reference: spec §5.5, §8.3 non-negotiable 1; D2

### Story Points: 3
### Priority: High
### Dependencies: L0-3

---

## Story L6-2: `document_type` and `document_template` with a platform-shaped contract

**As an** HR admin
**I want** each document type to declare the fields it needs, in names that read as template
variables
**So that** a licensed instance can point a real Document Template at the same row later

### Acceptance Criteria
- [ ] `document_type` exists with at least two seeded rows: **Employment Verification Letter** and
      **Salary Certificate**.
- [ ] Each `document_type` declares which logical objects and which fields it requires. A type with
      an empty requirement list cannot be activated.
- [ ] `document_template` holds a template body plus its placeholder contract per document type.
- [ ] **Placeholder names match the document source row's field names exactly.** A placeholder with
      no corresponding field, or a field with no placeholder, is reported by a validation action
      naming the mismatch. This is the seam that lets the platform feature replace the hand-rolled
      renderer without a data migration.
- [ ] Field names on the document source row read as template variables a human would pick from a
      list (`employee_full_name`, `annual_gross_salary`, `employment_start_date`) — not
      `field_1` / `u_val3`. Reviewed and signed off explicitly, because naming is the deliverable
      here.
- [ ] A written mapping exists in the docs stating, for each hand-rolled piece, which platform
      feature it stands in for (`com.snc.document_templates` / `sys_document_template`), and
      confirming that plugin's absence on `dev296062`.
- [ ] **Failure path:** a template referencing a placeholder the document type does not declare is
      refused on save with `Template references '<name>', which <document type> does not provide.`

### ServiceNow Implementation Notes
- Module: custom (HR)
- Table(s): `x_335329_sn_hr_erp_document_type`, `_document_template`
- Components: tables, validation Business Rule, seeded rows
- Doc reference: spec §8.1, §8.3 non-negotiable 6, §3 (`com.snc.document_templates` is **absent**
  on the target instance — the cheap path is closed)

### Story Points: 5
### Priority: High
### Dependencies: L0-1

---

## Story L6-3: `document_request` intake with a server-enforced self-service boundary

**As an** employee
**I want** to request a document about myself
**So that** I can get a letter without a ticket — and without being able to request one about a
colleague

### Acceptance Criteria
- [ ] A Record Producer against `document_request` exists on the base platform (no Employee Center
      dependency — `com.snc.employee_center` is absent).
- [ ] Submitting the producer creates a `document_request` with requester, subject employee, type,
      and `status=pending`.
- [ ] **Self-service boundary, server-side:** a request submitted via the **Table API** (bypassing
      the form entirely) naming a subject employee other than the caller is **refused** with
      `You may only request documents for yourself.` A boundary enforced only by hiding a field on
      the producer fails this story.
- [ ] A user holding the HR-admin role can submit on behalf of another person and the request is
      accepted. The elevated path is a role check against `sys_user_has_role`, not a client script.
- [ ] The refusal path is exercised as a genuine non-admin user with no HR role, via the Table API,
      and the refusal is pasted as evidence.
- [ ] A request naming a non-existent employee is refused at submission naming the problem, rather
      than accepted and failed later.
- [ ] `status` choices are exactly `pending`, `generated`, `failed`.
- [ ] `failure_reason` is readable by the requester so they know why nothing arrived.

### ServiceNow Implementation Notes
- Module: custom (HR) / Service Catalog
- Table(s): `x_335329_sn_hr_erp_document_request`, `sc_cat_item_producer`
- Components: Record Producer with a script that sets fields; a `before` Business Rule enforcing
  the boundary so the API path is covered too
- Doc reference: `ServiceNowOfficialDocs/application-development/app-engine-studio/add-a-record-producer.md`;
  `ServiceNowOfficialDocs/servicenow-platform/service-catalog/t_CreatingRecordProducersFromTables.md`;
  spec §8.2, §5.6 self-service rule

### Story Points: 8
### Priority: High
### Dependencies: L6-1, L6-2

---

## Story L6-4: Assembly — live payroll fetch, and a loud specific failure that produces nothing

**As a** person applying for a mortgage
**I want** a salary certificate to either be correct or not exist
**So that** I never hand a bank a document with a blank or a zero where my salary should be

### Acceptance Criteria
- [ ] On generation, the requester is resolved to an ERP employee via `employee_xref`, and
      `payroll_record` / `employee_profile` are fetched **live** through the connector.
- [ ] **No payroll or employee-profile data is written to any table.** Proven by generating a
      document and then querying every table in the scope for the salary figure that appeared in
      it; zero hits required. A hit anywhere fails this story and breaches D2.
- [ ] **Missing figure ⇒ no document.** With `annual_gross_salary` unmapped, the request ends
      `status=failed` with `failure_reason` = `Cannot generate Salary Certificate:
      'annual_gross_salary' is not mapped for system <system name>.` and **no attachment exists on
      the request**. Verified by querying `sys_attachment` for that request and getting zero rows.
- [ ] **ERP down ⇒ no document.** With the payroll system unreachable, the request ends
      `status=failed` with `failure_reason` = `Cannot generate Salary Certificate: the payroll ERP
      did not answer (<classified error>).` and zero attachments.
- [ ] **No fallback to a stored figure.** There is no code path that substitutes a previously-seen
      value when the live call fails. A fallback is the shadow HR database D2 exists to prevent.
- [ ] A figure that arrives as an empty string, `null`, or `0` from the ERP is treated as
      **unavailable** unless the mapping explicitly declares zero to be meaningful for that field.
      A salary certificate reading `0` is a FAIL, not an edge case.
- [ ] Both document types are generated successfully end to end at least once against a working
      fixture, and both are generated **unsuccessfully** at least once, and all four outcomes are
      recorded.
- [ ] Every failure message names the specific missing figure or the specific call that failed.
      `Document generation failed` alone is a FAIL.

### ServiceNow Implementation Notes
- Module: custom (HR)
- Table(s): `document_request`, `document_type`, `employee_xref`, `sys_attachment`; **no** staging
  table involved
- Components: assembly Script Include calling `ErpConnector` live; pre-flight requirement check
  driven by `document_type`'s declared field list, run **before** any rendering begins
- Doc reference: spec §8.2, §8.3 non-negotiables 2 and 4; D2 costs-accepted clause ("fails loudly
  when the ERP is down; it does not fall back to a stored figure")

### Story Points: 13
### Priority: High
### Dependencies: L6-3, L2-2

---

## Story L6-5: Render, and never label a file PDF unless it is one

**As a** recipient of a document
**I want** the file's stated format to be its actual format
**So that** a file called `.pdf` opens as a PDF

### Acceptance Criteria
- [ ] A runtime probe determines whether a real PDF API is callable in this scope, and its result
      is recorded in `docs/decision-log.md` closing OD2. The probe result is evidence from the
      instance, not an inference from the plugin list — `com.snc.apppdfgenerator` and `com.snc.whtp`
      are active yet no `sn_pdfgeneratorutils` scope or `PDFGenerationAPI` Script Include was found.
- [ ] **If PDF is confirmed:** the output attachment's file extension is `.pdf`, its content type is
      `application/pdf`, its first bytes are `%PDF-`, and `document_request` records the format as
      PDF. All four asserted; any one failing means the output is relabelled HTML.
- [ ] **If PDF is not confirmed:** the output is clean HTML, the extension is `.html`, the content
      type is `text/html`, and `document_request` records the format as **HTML**. A record claiming
      PDF for an HTML file fails this story.
- [ ] A grep of the codebase finds no hard-coded `.pdf` filename or `application/pdf` content type
      on a path that can emit HTML.
- [ ] The format shown to the requester matches the format recorded on the request, which matches
      the actual attachment. All three are asserted together in one test.
- [ ] **Failure path:** if the PDF conversion call itself fails at runtime, the request ends
      `status=failed` with a stated reason and **no attachment**. It does not silently downgrade to
      HTML while still reporting PDF, and it does not attach a zero-byte file.

### ServiceNow Implementation Notes
- Module: custom (HR)
- Table(s): `document_request`, `sys_attachment`
- Components: capability probe; renderer producing HTML; conditional PDF conversion
- Doc reference: `ServiceNowOfficialDocs/api-reference/server-api-reference/PDFGenerationAPIBothAPI.md`
  — `PDFGenerationAPI.convertToPDF(html, targetTable, targetTableSysId, pdfName, fontFamilySysId,
  documentConfiguration)` is scoped-callable **where the capability is installed**, attaches to a
  target record, and truncates content beyond A4; `convertToPDFAsync()` exists for larger output.
  This API's presence on `dev296062` is exactly what OD2's probe must establish.
- Doc reference: spec §3 (PDF row), §8.2, §10.3 "never label HTML as PDF"; **open item OD2**

### Story Points: 8
### Priority: High
### Dependencies: L6-4, OD2 probed

---

## Story L6-6: Every generated document is audited to its sources

**As an** auditor
**I want** each document to record who, for whom, when, which type, and which ERP responses
**So that** a figure printed on a letter can be traced back to the call that produced it

### Acceptance Criteria
- [ ] `document_request` records requester, subject employee, type, generated timestamp, status,
      failure reason, the output attachment, and the identifiers of the live calls the figures came
      from.
- [ ] Opening a generated request shows which `call_log` entries (or equivalent live-call ids)
      produced its figures, and those entries are still resolvable.
- [ ] A **failed** request is audited as thoroughly as a successful one: requester, subject, type,
      timestamp, reason, and the failed call id. A failure with no audit trail fails this story.
- [ ] The audit trail contains **no payroll figures** — call ids and timestamps only. An audit row
      quoting the salary reintroduces the shadow database through the back door.
- [ ] Audit fields carry deny-write ACLs with `adminOverrides: false`; an admin cannot retro-edit
      who requested what. Verified by an admin write attempt that is refused.
- [ ] A requester can see their own request's status and reason; they cannot see another person's
      request. Verified as a genuine non-admin user.

### ServiceNow Implementation Notes
- Module: custom (HR)
- Table(s): `document_request`, `call_log`, `sys_attachment`, `sys_audit`
- Components: audit fields, deny-write ACLs, related list of source calls
- Doc reference: spec §5.5, §8.2 "attach and audit", §8.3 non-negotiable 5

### Story Points: 5
### Priority: High
### Dependencies: L6-4

---

# Documentation deliverable

## Story DOC-1: `docs/uib-page-spec.md` — Page Component Tree and Data Binding Schema

**As a** future UI Builder author
**I want** a written UIB specification for the same 5-tab hub
**So that** a human can assemble a native workspace page later without redesigning the app

### Acceptance Criteria
- [ ] `docs/uib-page-spec.md` exists and contains a **Page Component Tree** covering all five tabs,
      every KPI, every chart and every list.
- [ ] It contains a **Data Binding Schema** using correct UIB vocabulary: `@data.<resource_id>.<output>`,
      `@context.props.<name>`, `@state.<name>`, `@elements.<component_id>.<property>`.
- [ ] It says **data resources**, never "data brokers". A single occurrence of "data broker" fails
      this story — the vocabulary is the deliverable.
- [ ] It specifies **per-tab lazy loading**: which data resources execute on which tab, and states
      that a tab switch must not trigger the other four tabs' resources.
- [ ] It states the **inherited vs local** data resource distinction and which resources are which.
- [ ] It notes that **only one GlideForm is supported per UIB page** and states how the design stays
      within that.
- [ ] It specifies how each of the four §0 states is represented in the bound data and rendered,
      including that `0` is bound only in the live state. A UIB spec that would render an absent
      value as an empty scorecard fails this story.
- [ ] Every component in the tree names the data resource output it binds to. A component with no
      binding is either removed or annotated as static.
- [ ] A reviewer unfamiliar with this app can, from this document alone, name every data resource
      the page needs. Tested by having someone read it and list them.

### ServiceNow Implementation Notes
- Module: documentation (no instance change)
- Table(s): none written; describes `sys_ux_*` composition conceptually
- Components: markdown document
- Doc reference: `ServiceNowOfficialDocs/application-development/ui-builder/data-resources.md`
  ("Using data binding in UI Builder" — context binding, data resource binding);
  `ServiceNowOfficialDocs/application-development/ui-builder/connect-data.md`
  (data resources must be added to the page before binding);
  `ServiceNowOfficialDocs/application-development/ui-builder/controllers.md`;
  D1 in `docs/decision-log.md`; spec §10.2

### Story Points: 8
### Priority: High
### Dependencies: L4-1, L4-2 (the payload contract the bindings mirror)

---

# L7 — Deferred (out of scope for this delivery)

## Story L7-1 (PLACEHOLDER — OUT OF SCOPE): Requisition Approve/Reject write-back

> **Not in scope for L0–L6.** Recorded so the §6 Tab 2 requirement is visibly deferred rather than
> dropped. **Do not build any part of this story in this delivery.** Its in-scope counterpart is
> **L5-5**, which ships Tab 2 read-only with a visible caveat and an ERP deep link, and renders no
> Approve or Reject control at all.

**As a** procurement approver
**I want** to approve or reject an ERP requisition from ServiceNow
**So that** I do not have to leave the hub to make a decision

### Scope note in place of acceptance criteria
This needs an approval mirror — real ServiceNow approval records created per pending ERP
requisition — plus an outbound write path to a system of record, plus an ERP that accepts writes in
order to be testable at all. Per D3 it carries its own design, its own governance gate and its own
explicit human YES. Acceptance criteria will be written when that gate opens; writing them now
would imply the work is queued rather than deferred.

**Binding until then:** never draw a button that cannot commit its decision.

### Story Points: not estimated (out of scope)
### Priority: Deferred
### Dependencies: D3 gate reopened; OD3 (a real ERP endpoint that accepts writes)

---

# Assumptions flagged

1. **Tab 1's three KPIs are `finance_viewer`-gated; Tabs 2–5 are `viewer`-gated.** The spec names
   `finance_viewer` as "financial figures" without drawing the tab boundary. YTD procurement spend
   (Tab 2) and total asset valuation (Tab 4) are arguably financial. **Architect must draw this
   line explicitly** — L4-3 and L5-9 test whatever line is drawn, but they cannot test a line that
   was never drawn.
2. **Client-side XLSX export is not storied.** It appears in spec §1.2 as a Capacity Planner
   property worth copying, but in no §6 tab requirement. Treated as out of scope. If it is wanted,
   it needs its own story — including a criterion that an exported file's contents carry the same
   four states as the screen, since an export that writes `0` for a failed tile reintroduces the
   exact defect this app exists to prevent.
3. **"Real-time cash balance" (Tab 1) is served from staging, not live.** D2 stages finance data,
   so "real-time" is read as "as of the last successful sync", carried by the `as of` label. If the
   product owner means a live call on tab open, that contradicts D2's rejection of live-fetch-every-tab
   and needs a new decision entry.
4. **`sync_run` is per (system × object).** Spec §5.4 says so; the state resolver in L4-2 therefore
   evaluates state per object per system and aggregates by §0 R4.
5. **Test users and fixtures assume `postman-echo.com`** until OD3 supplies a real endpoint. Every
   "live" acceptance criterion is executable against a fixture host; none of them are executable
   against a real ERP yet, and no story claims otherwise.

# Gaps — spec requirements I could NOT write a testable acceptance criterion for

1. **"A second ERP can be added as pure data, demonstrated" (L1 gate, spec §4.2).** Testable as
   *"no application file in this scope changed"*, which L1 stories cover indirectly — but the gate
   as written ("demonstrated") has no stated demonstration. It needs a named second vendor, a named
   endpoint and a named object to be executable end to end, and OD3 supplies none of them. A
   second fixture system against the same test host proves the *data-only* claim but not the
   *different-vendor-API* claim, and pretending otherwise would repeat the sibling app's T32b
   mistake of weakening a gate test to make it pass. **Recorded as a gap; needs OD3.**

2. **"Backordered items" KPI (spec §6 Tab 3).** No logical object in §5/§6 supplies a backorder
   status. It is neither in the sibling's 17 objects nor in the five additive ones. I could write
   the four-state criteria, but not a criterion for what makes an item backordered. **Needs a
   logical object and field named by the architect or the product owner before it is testable.**

3. **"Assets due for maintenance" (spec §6 Tab 4) threshold.** `maintenance_schedule` is a named
   additive object, but "due" has no defined window (overdue only? next 30 days? next quarter?).
   Any criterion I wrote would be inventing the business rule. **Needs a stated window.**

4. **"Nearing end-of-life" (spec §6 Tab 4 list) and "high-value" (same list).** Both are
   unquantified. Same reason as above — a testable criterion requires a threshold, and inventing
   one here would hide a product decision inside a test.

5. **Retention window lengths (OD1).** L3-5 tests that a policy exists, is approved and is enforced,
   but the actual number of days is undecided. A criterion naming a specific window would be
   fabricating the approval the story exists to require.

6. **PDF confirmation (OD2).** L6-5 is written to branch on the probe result and is testable either
   way, but **which branch is the real one cannot be determined without running the probe on
   `dev296062`.** Not a gap in the criteria — a gap in the fact they depend on.

7. **The 12 sibling logical objects beyond the five additive ones.** Spec §6 says the new objects
   are "additive to the sibling's 17", but the sibling's list includes CRM objects (`opportunity`,
   `job_requisition`) that are explicitly out of scope here. **I did not write criteria that
   assume the full 17 carry over.** The architect must publish this app's own logical-object list;
   until then no story asserts a specific object count.
