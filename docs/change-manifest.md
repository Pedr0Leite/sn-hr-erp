---
title: SN HR&ERP — change manifest
app: x_335329_sn_hr_erp
instance: https://dev296062.service-now.com (PDI)
date: 2026-08-12
verdict: APPROVED WITH CONDITIONS — recommendation only
---

> **This document does not grant approval.** It is a recommendation. A human must give an explicit
> YES against §5 before any developer step writes to the instance.
>
> ## HUMAN APPROVAL GRANTED — 2026-08-12
>
> The product owner gave an explicit **YES** to build **L0 → L6**, with conditions C1–C5 included in
> the work, and with a report back at each layer gate rather than an unattended run to L6. All eight
> items in §5 were approved as stated. **L7 remains unapproved and unrequested.**

**Provenance of this review.** The `governance` agent was terminated by an account session limit
partway through. Its one partial claim ("OD11 confirmed") was **not trusted** — this estate's own
post-mortem says not to trust a dead agent's progress claims — and was independently re-established
by live query. This manifest was then completed inline against the eight design documents and the
live instance. Findings below are cited to a file and line or to a query result.

---

# 1. What is being changed

Nothing exists yet. `npx now-sdk query sys_app -q "scope=x_335329_sn_hr_erp"` returns **zero rows**.
The sibling `x_335329_erpcrm` v0.0.8 is live and is **not** modified by this build (D4 ports the
connector rather than calling it).

| Layer | Records created | Notes |
|---|---|---|
| **L0** | 1 `sys_app`, 4 `sys_user_role`, ACL skeleton, 5 `sys_properties` | New scope. Roles: `viewer`, `finance_viewer`, `hr_viewer`, `admin` |
| **L1** | `erp_system`, `object_map`, `field_map` tables + config-validation business rule + seeded `mapping_template` rows | `field_map` is a child table; the JSON blob column is **not** created (OD4) |
| **L2** | `ErpConnector` Script Include + 12 server modules + `call_log` table + 21 test drivers | Ported from `x_335329_erpcrm`, 1,437 lines |
| **L3** | `erp_staging`, `sync_run` tables + sync engine + `RetentionCleaner` | Staged data lands here |
| **L4** | 1 Scripted REST API, one `GET /data` route per tab | Reads this app's tables only |
| **L5** | 1 UI Page + bundled React asset + workspace shell records + ACLs | |
| **L6** | `doc_type`, `doc_template`, `doc_request`, `emp_xref` tables + Record Producer + renderer | Output is **labelled HTML**, not PDF (OD2) |

**Update set.** `now-sdk install` ships a scoped application, not a captured update set — the scope
is its own boundary. No existing update set is written to. Verify at L0 that the generated update
set name carries the `&` intact (OD8).

---

# 2. The four checks that matter, with evidence

### 2.1 Global-scope usage — CLEAN, and deliberately so

Every layer document ends with an explicit "Global-scope records: none" statement, and L3 records a
rejected alternative that would have created one: `sys_auto_flush` for retention was **rejected
mainly because it is a Global-scope record in an app that otherwise creates none**
(`l3-staging-design.md:410-413, 552`). L0-12 ships a verification query and T0-4 asserts it.

This is the correct posture and it was arrived at deliberately, not by accident.

### 2.2 Cross-scope calls — NONE, verified by design and by a shipped test

D4 ports rather than reuses. `l0-scaffold-design.md:564` states no cross-scope call exists at L0 and
none is planned in any layer. `ErpConnector` ships `accessibleFrom: 'package_private'`
(`l2-connector-design.md:280`) where the sibling shipped `public` — the design reasons that D4
removed the only consumer, so the surface should go too. **T2-15 greps `src/` for
`x_335329_erpcrm` and requires zero hits.**

### 2.3 Test drivers — ALL DISARMED, with two independent locks

§9's named sin (a driver left firing every three minutes for days, reported four times). Every job
in every layer ships `frequency: 'on_demand'` **and** `active: false`
(`l3-staging-design.md:335-337`, `l2-connector-design.md:310`, `l6-document-design.md:348`). T2-17
and T3-16 both re-verify **after the final deploy, not before** — which is the right time, because
`installMethod: 'demo'` records restore every field but `active` from source on redeploy.

### 2.4 OD11 — the `sys_user_has_role` ACL. CONFIRMED ACTIVE. This was the real find.

Established by live query, not inference. Three active read ACLs on `sys_user_has_role`:

| ACL | `admin_overrides` | Roles granted read |
|---|---|---|
| `8bb1de220a0a0b4400b22b63058d1810` | **true** | `role_delegator`, `user_admin`, `itil` |
| `937ff319ff072210459effffffffffba` | false | `role_delegator_admin` |
| `bb332892ff5322103ad8ffffffffff0c` | false | `ai_user_admin` |

A `finance_viewer` holds none of those five. Scoped `GlideRecord` is security-aware, so the query
returns zero rows and the role check **denies a user who holds the role**. `admin_overrides: true`
on the first ACL is why it would have shipped: every admin-run test passes.

**Resolved by D14** — ACLs do the enforcing; `gs.hasRole()` shapes the payload in the REST API,
which is a genuine user session and the one context where it does not lie; scheduled jobs make no
role checks at all. The three rejected fixes (query anyway / grant `itil` to `viewer` / a
Global-scope elevated bridge) are recorded in the decision log.

---

# 3. Findings

| # | Severity | Finding |
|---|---|---|
| **G-1** | **Medium** | `erp_system` ships `accessibleFrom: 'public'` (`l1-control-tower-design.md:114`), carried over from the sibling. **D4 removed every cross-scope consumer**, and L2 applied exactly that reasoning to the Script Include — but not to this table. `erp_system` holds `base_url`, auth-profile references and MID config; `public` lets any other scoped app on the instance read them. **Condition C1: change to `package_private`** unless a consumer is named. |
| **G-2** | **Low-Medium** | **Uninstall behaviour is undocumented.** The word "uninstall" appears in none of the eight design documents. Scoped tables drop with the app, so staged financial data goes with it — but that is inferred, not stated, and it is exactly the kind of assumption this project's method says to verify. **Condition C2: state it explicitly in L3, and verify it.** |
| **G-3** | Informational | The `field_map` JSON blob is **deleted, not deprecated** (OD4). Correct for a greenfield app. Noted because "delete the column" reads as destructive in review and is not — nothing has ever been installed. |
| **G-4** | Informational | `docs/stories.md` names five tables that exceed the SDK's 30-character limit and **will not build** (D13). The canonical names are in `l0-scaffold-design.md` §2.2. A developer following the stories literally hits a build error. Already recorded; restated here so it is not rediscovered at L0. |

### Payroll and PII — clean, with one chokepoint doing the work

D2/D10 forbid persisting a salary figure. The design honours it beyond the obvious column check:
the connector's **C1 chokepoint guarantees `call_log` cannot hold a response body**
(`l6-document-design.md:274`), which is the leak that would otherwise be easiest to miss — a salary
in a telemetry row is the same breach as a salary in a column. `doc_request` stores
`source_call_ids` (deny-write) so a printed figure remains traceable to a specific ERP response
without the figure itself being stored.

### ACLs

`Acl(` appears only in `l0-scaffold-design.md` — the ACL skeleton is centralised rather than
scattered per layer, which is the right shape for reviewing it. `createAccessControls: false`
throughout. Hard deny-write (`adminOverrides: false`) confirmed on `object_map.mapping_source`
(`l1:407`) and on `doc_request.requester` / `generated_on` / `output_format` (`l6:184`).

**Condition C3:** the full ACL inventory — every ACL, operation, role and `adminOverrides` value in
one table — must be produced and reviewed at L0 before L1 starts. It is currently spread across a
skeleton plus per-layer prose, and the one thing this app cannot afford is an ACL nobody read.

### No outbound writes

Confirmed: no design in L0–L6 writes to any external system. D3 defers the only write path (ERP
requisition Approve/Reject) to L7 with its own gate. No Approve/Reject control is rendered anywhere.

---

# 4. Risk table

| Risk | Severity | Mitigation |
|---|---|---|
| Role check fails closed, silently, passing all admin tests | **Was Critical** | **Retired by D14.** Now: ACLs enforce; `gs.hasRole()` shapes payload in-session. Must still be proven as a genuine non-admin |
| Staged financial data persists in ServiceNow | High | 90-day retention (OD1); `RetentionCleaner` ships disarmed; provenance columns deny-write to everyone including admin |
| A salary figure leaks into a log, error or telemetry row | High | Connector C1 chokepoint: `call_log` cannot hold a body. Payroll never staged (D2). **Re-verify live at L6** |
| A tile shows `0` for an absence | High | The four-state contract; `sync_run` makes the states distinguishable; state is explicit in the payload, never inferred client-side |
| An unverified vendor mapping produces a plausible figure from the wrong field | Medium | `verified: false` by default; surfaced as unverified in the UI; L1-b gate stays **open and unmet** until a real ERP exists |
| A document is generated with a missing figure | High | Request fails, produces nothing, states the reason. No placeholder ever substitutes for a real figure |
| A file is labelled PDF that is not one | Medium | OD2 resolved to labelled HTML; `output_format` is deny-write |
| `erp_system` connection config readable by other scopes | Medium | **Condition C1** |
| A test driver ships armed | Medium | `on_demand` + `active: false`; verified after the final deploy |

---

# 5. What the human is being asked to approve

1. **A new scope** `x_335329_sn_hr_erp` on `dev296062`, roughly 20 tables and ~3,000 lines.
2. **Persisting ERP financial data** in ServiceNow (D2) — reversing the sibling app's founding rule.
3. **`staging_retention_days = 90`** and **`sync_run_retention_days = 730`** (OD1). The audit spine
   deliberately outlives the data it describes. Per-category overrides ship empty.
4. **The four-role model** — `viewer`, `finance_viewer`, `hr_viewer`, `admin`, with the two
   sensitive roles never implied by anything, including each other.
5. **D14's role-check mechanism**, replacing the stories' blanket "always query `sys_user_has_role`"
   which is unrunnable on this instance for exactly the roles it was meant to protect.
6. **Live payroll fetch at document-generation time, never stored** (D2/D10), and the accepted
   consequence that §8.1's platform-swap seam covers the verification letter but not the salary
   certificate.
7. **Labelled HTML output** rather than PDF (OD2), until and unless the PDF Generator Utilities
   store app is installed.
8. **The L1-b gate shipping open and unmet** — "a genuinely different vendor API is pure data"
   cannot be proven on `postman-echo.com` fixtures, and the gate is **not** reworded to make it
   passable.

---

# 6. Verdict

## APPROVED WITH CONDITIONS

The design is materially stronger than a typical config change deserves: zero Global records, zero
cross-scope calls, drivers double-locked, and a critical fail-closed security defect caught by
reading rather than by testing. The conditions are small and specific.

### Conditions — all before or during L0, none of them optional

- [ ] **C1** — `erp_system.accessibleFrom` → `package_private`, or name the cross-scope consumer that
      justifies `public`.
- [ ] **C2** — state and verify uninstall behaviour for staged data in `l3-staging-design.md`.
- [ ] **C3** — produce the consolidated ACL inventory (every ACL, operation, role, `adminOverrides`)
      at L0 and review it before L1 starts.
- [ ] **C4** — build from the canonical table names in `l0-scaffold-design.md` §2.2, never the
      over-length names in `docs/stories.md` (D13).
- [ ] **C5** — every access-control assertion is verified **as a genuine non-admin user holding only
      the intended role**. On the `sys_user_has_role` ACL specifically, admin is not merely
      insufficient — it is actively misleading, because `admin_overrides: true` means admin passes
      the very ACL that denies everyone else.

### Not approved, and not requested

L7 — the requisition Approve/Reject approval mirror and outbound ERP write-back. Deferred by D3 with
its own design and its own governance gate. No Approve/Reject control appears anywhere in L0–L6.
