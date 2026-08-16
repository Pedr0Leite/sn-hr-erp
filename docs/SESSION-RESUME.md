---
title: SN HR&ERP — session resume
app: x_335329_sn_hr_erp · npm sn-hr-erp · scoped
instance: https://dev296062.service-now.com (PDI)
hub: https://dev296062.service-now.com/x_335329_sn_hr_erp_hub.do
updated: 2026-08-13 (after L6)
purpose: Bootstrap a fresh session cold. Assumes zero memory.
---

# Read first

Read this, then `docs/DEFERRED.md`, then `docs/decision-log.md`. Nothing else is required to resume.

**All six build layers L0→L6 are deployed.** The app is built. What has never happened is
*execution*: no connector call, no sync, no gate, no test.

---

# 1. State, verified live 2026-08-13

| Check | State |
|---|---|
| App | Live, v0.0.1, active. Name reads `SN HR&ERP` — ampersand intact |
| **Hub page** | **Live** at `x_335329_sn_hr_erp_hub.do`, 5 tabs (`?tab=financial\|procurement\|inventory\|assets\|manufacturing`) |
| Roles | 4: `viewer`, `finance_viewer`, `hr_viewer`, `admin`. `sys_user_role_contains` = **0 rows** |
| **Scheduled jobs** | **10, every one `active=false` + `on_demand`. NOTHING IS ARMED** |
| `erp_staging` / `sync_run` / `sync_request` / `call_log` | **0 / 0 / 0 / 0** |
| `erp_system` / `object_map` / `field_map` | 6 / 14 / 22 — all fixtures pointing at `postman-echo.com` |
| Build | clean |

**Zero business data exists.** Only configuration. `call_log: 0` independently confirms no
connector module has ever run.

---

# 2. What is built

| Layer | State |
|---|---|
| **L0** scaffold, roles, ACL shape | Deployed. 2 browser-only items open (OD12, OD13) |
| **L1** control tower | Deployed. L1-a met; **L1-b open**, blocked on OD3 |
| **L2** connector | **Deployed. Gate NEVER EXECUTED (OD18)** |
| **L3** staging + sync engine | Deployed. **OD23 unproven — see below** |
| **L4** hub API | Deployed. `/api/x_335329_sn_hr_erp/hub` — `GET /data`, `POST /refresh` |
| **L5** BYOUI 5-tab React SPA | Deployed. One bug found and fixed post-deploy (see §4) |
| **L6** HR documents | Deployed. Output is HTML **labelled** HTML (OD2) |
| L7 write-back | Deferred by D3. Unapproved, unrequested |

---

# 3. The two things that could invalidate work already done

1. **OD23 — run this first.** Does the sync engine's own insert survive the 19 Shape A deny-write
   ACLs on `erp_staging`? The answer is **cited (KB0677278), never executed**. If the citation is
   wrong, **L3 is dead on arrival and fails silently**: rows never land, the run reports success.
2. **OD18 — no connector call has ever been made.** Every runtime assumption in L2 is unverified,
   including D19 (`.ts` imports) at runtime. The gate driver is deployed and ready:
   `HRERP L2 GATE (temporary)`, `sysauto_script`, sys_id `10fe36d40cb24526ab805c2200ab6cca`.

---

# 4. Bug found after L5 deployed — pattern worth remembering

The hub threw `can't access property "map", payload.k is undefined` on every tab.

Cause: a **Scripted REST API wraps every body in `{"result": …}`**, and `docs/api-contract.md`
describes the *inner* object. The client read `payload.k` off the envelope. Fixed in
`src/client/api.ts` — unwrapped once, centrally. Deployed.

The lesson, not the fix: **L5 was built against the contract document, never against a live
response.** The error boundary behaved correctly and refused to render figures, but the defect
existed because no gate was run. Expect more of this class.

---

# 5. Blocked on a human at a browser

Full detail in `docs/DEFERRED.md` §1. Shortest path to a working demo:

1. `https://dev296062.service-now.com/sysauto_script_list.do`
2. Open **HRERP L2 GATE (temporary)** → right-click header → **Execute Now**
3. Read evidence: `npx now-sdk query syslog_app_scope -a dev -q "messageLIKEHRERP-L2-^ORDERBYsys_created_on"`

Attempted from the shell and failed: a `sys_trigger` insert **silently drops** `name`, `document`,
`document_key`, `trigger_type` (HTTP 201, row self-consumes, runs nothing). A follow-up `PATCH`
**does** set them — but the job is skipped while `active=false`, and flipping `active` was blocked
by the permission classifier.

Also browser-only: C5 (4 ACL assertions as a genuine non-admin — basic auth 401s instance-wide),
OD12, OD13, OD14.

---

# 6. Traps, ranked. Each established live on this instance

1. **`Acl.adminOverrides` defaults to `true`.** A deny ACL omitting it is silently admin-overridable.
2. **A Shape A deny refusal is SILENT** — HTTP 200, field unchanged. Any test asserting on status
   code passes against a completely broken ACL. Re-read the value; write a control field in the same request.
3. **A `before` business rule that throws is swallowed and the record saves.** A crashed rule is
   indistinguishable from an approving one.
4. **A relative import under `src/server/` without a `.ts` extension builds clean, installs clean,
   and is dead at runtime** (D19). Cost two deploy cycles.
5. **A Scripted REST response is wrapped in `{"result": …}`** — see §4.
6. **`sys_user_has_role` read is ACL-gated**; a role check by query fails closed while every admin
   test passes. Resolved by D14 — `gs.hasRole()` inside the REST API.
7. **`now-sdk query` 403s when filtering on `sys_created_on`/`sys_class_name`** on app tables, even
   as full admin. Field-level read ACLs gate the *query*. Filter on business fields.
8. **Deleting a Fluent `Table()` does not drop the table** (D18) — it strips the ACL and columns and
   leaves an unprotected shell. Uninstall defaults to *"Retain tables and data"*.
9. **`GlideRecord.getValue()` on a Boolean returns `'1'`/`'0'`.**
10. **`Record()` data values are build-time strings, not executed JS.** Use `Now.include('./file')`.
11. **Never invent a sys_id.** `Now.ID['key']` only.
12. **`now-sdk install` does not build.** Always `npm run build && npx now-sdk install -a dev`.
13. **L2 T10** — an active `object_map` with zero `field_map` rows refuses to dial (`MAP_UNMAPPED`).
14. **L4 absent-key contract** — `tile.v || 0` renders a wrong number for an absence.

---

# 7. Document map

| File | What |
|---|---|
| `docs/DEFERRED.md` | **Everything blocked or postponed. Read second.** |
| `docs/decision-log.md` | D1–D19 + per-layer decisions + OD1–OD30. Every decision with its rejected alternative |
| `docs/api-contract.md` | **Binding** payload shape. L5 and the UIB spec bind to this file |
| `docs/SN-HR-ERP-master-kickoff-prompt.md` | The normative spec. §7 (four-state rule), §9 (traps) |
| `docs/l0-…l6-…-build-report.md` | Per-layer build reports |
| `docs/salesforce-integration-design.md` | Salesforce as a connector vendor (in progress) |
| `docs/stories.md` | 38 stories, 189 ACs — **zero executed** |
| `docs/uib-page-spec.md` | The UIB deliverable (D1/D9) |

---

# 8. Owner decisions, not to be relitigated

| | |
|---|---|
| **D1/D9** | BYOUI page, React 18.2.0, plus the UIB spec as a written deliverable |
| **D2/D10** | Stage ERP data; **payroll and employee profile fetched live, never stored** |
| **D3** | Approve/Reject write-back **deferred to L7**. No such control rendered anywhere |
| **D4** | Connector **ported** into this scope, not called cross-scope |
| **Priority** | 2026-08-13: **ship dev layers first, all verification in a final pass** |

> **Never** draw a button that can't commit its decision. **Never** label HTML as PDF.
> **Never** display `0` for an absence. **Never** ship a test driver armed.
