---
title: SN HR&ERP — deferred work
purpose: Everything blocked, unverified or deliberately postponed. Tackled in the final pass.
updated: 2026-08-13
---

# How to read this

Nothing here is abandoned. Each item is either **blocked on something only a human can do**, or
**deliberately postponed** under the product owner's 2026-08-13 instruction: ship the dev layers
first, run all verification at the end.

**None of it is a code defect.** Where something is unverified, it says unverified — not passing.

---

# 1. Blocked on a human, cannot be done from this environment

| # | Item | What it needs | Cost of leaving it |
|---|---|---|---|
| **OD18** | **The L2 gate — never executed.** One successful live call, one forced-failure call, both logged, breaker demonstrably opening. Driver `HRERP L2 GATE (temporary)` is deployed and ready (`sysauto_script`, `on_demand`, `active=false`, sys_id `10fe36d40cb24526ab805c2200ab6cca`), produces all four under marker `[HRERP-L2-GATE]` | *Execute Now* in a browser. Attempted from shell: a `sys_trigger` insert **silently drops** `name`/`document`/`document_key`/`trigger_type` (HTTP 201, fields empty, row self-consumes having run nothing); a follow-up `PATCH` **does** set them, but the job is skipped while `active=false`, and flipping `active` was blocked by the permission classifier | **No L2 connector module has executed even once.** D19 (`.ts` imports) is verified by grep but unproven at runtime for L2 |
| **C5** | Four ACL assertions as a genuine non-admin | A browser. Basic auth as any non-admin returns instance-level `401 User is not authenticated` — reproduced on a brand-new user with a password set at insert; `snc_internal` + `snc_platform_rest_api_access` change nothing; no SSO/MFA property set; admin's own basic auth works. A password was set on `hrerp_viewer_only` for this purpose (session-only, written to no file) | **An ACL unverified as a real non-admin is unverified.** No admin-run substitute was accepted |
| **OD12** | Drop the empty throwaway table `x_335329_sn_hr_erp_acltest` and its `np$` shadow view | Browser — `sys_db_object_list.do`. Table API `DELETE` returns **403** even as full admin (D18) | Cosmetic. Not a security control — its ACL and columns are already gone |
| **OD13** | Ampersand AC3/AC4 — app opened from the Next Experience picker (label must read `SN HR&ERP`), and a `.do` link carrying the name as a parameter (truncation at `&` is a FAIL) | Browser | Record-level ampersand already verified intact |
| **OD3 / L1-b** | A real ERP endpoint. Fixtures on `postman-echo.com` stand in (D12) | The product owner supplying one | **L1-b is recorded open and unmet.** Not reworded |
| **OD14** | Does a scoped `GlideRecord.update()` in the mapping-template UI Action beat the Shape A deny on `mapping_source` / `mapping_verified`? §6 denies the write, §5.3 step 5 performs it | Apply a template, then re-read `mapping_source` | **If the deny wins, the failure is silent**: rows insert, success is reported, the unverified-mapping banner never appears |

---

# 2. Postponed by decision — do at the end

| # | Item | Note |
|---|---|---|
| T1 | **Full test pass** — tester + bug-hunter across all layers | Owner's call: dev first, tests last |
| T2 | 19 ported L2 connector cases (T15–T33) | Built and deployed **disarmed**. Never run |
| T3 | Per-story acceptance criteria — 189 ACs across 38 stories in `docs/stories.md` | Zero executed |
| T4 | L1 items needing a form save or a timed human: T1-11 (OD4 "no JSON brace"), T1-18/T1-21 (UI Action not invocable from the Table API), T1-19/T1-20, T1-13's surfacing half | Display business rules don't fire on a REST GET |
| T5 | L1 verbatim message text (T1-5/T1-9/T1-12) | Behaviour proven; wording needs a form save. The Table API doesn't carry `gs.addErrorMessage` |

---

# 3. Open design questions — need an architect or the owner, not a developer

| # | Question |
|---|---|
| **OD16** | Two `isTrue` implementations now exist. Consolidate, or leave? |
| **OD17** | Does the logical contract gain per-field types, or does L3's promotion table stay the only place types live? `docs/l2-connector-design.md` §4.4 says both |
| **OD19** | The six `erp_system` fixture rows exist **only on the instance**, not in source; L2 fixtures reference them by queried sys_id. **A source-only deploy to a fresh instance leaves dangling references.** Put them in source, or accept instance-bound fixtures? |
| **OD23** | **Run this first in the test pass.** Does the sync engine's own insert survive the 19 Shape A deny-write ACLs on `erp_staging`? The answer is **cited (KB0677278), not executed.** If the citation is wrong, **L3 is dead on arrival and fails silently** — rows never land, the run reports success | 
| **OD20** | `l4-api-design.md` §7.1's "8 queries, one aggregate for all KPIs" is unreachable with per-tile filters. Real budget is 9–11 per tab, independent of row and system count. Accept, or re-architect the tile filters? |
| **OD21/OD22** | See `docs/decision-log.md` |
| **OD1** | Retention still **PROPOSED**, not approved. Cleaner ships disarmed |
| **L4-D6** | "Assets depreciated" ships as an **ungated count**. Confirm you don't mean a monetary total — if you do, it needs `finance_viewer` gating (D6) |
| **Bad vendor seeds** | **Shipped config that is wrong on the wire.** `docs/vendor-integration-research.md` establishes: the `sap_s4` seeds **invent all eight service names**, and their `date_format` **silently blanks every date** (OData V2 emits `/Date(ms)/`); the `unit4` seeds are wrong on endpoint, response root and pagination; D365 lacks `cross-company=true`. Fix before any real ERP is connected — these fail as *wrong data*, not as errors |
| **L6-D9** | **Verify before any demo.** `employee_profile.full_name`/`hire_date` and `payroll_record.currency` were **renamed** to the L6 document names, against the add-never-rename rule. Justified by zero `object_map` rows existing for both live-only objects — re-check that's still true, and that no L2 vendor default mapping references the old names |
| **OD24–OD30** | Raised during L5/L6, not attempted. See `docs/decision-log.md`. Includes `docs/l6-platform-seam.md`, unwritten |
| **L5 gate / L6 gate** | Neither attempted, on the owner's ship-first instruction. **Every tile on the live hub currently reads `not_configured`/`failed`** — correct for an unsynced instance, and evidence of nothing |
| **OD2** | PDF. Resolved as **labelled HTML** — no `sn_pdfgeneratorutils` scope, no `PDFGenerationAPI` on this instance. Reopens only if the free PDF Generator Utilities store app is installed. **Never label HTML as PDF** either way |

---

# 4. Standing risks carried forward

- **Uninstalling this app retains staged ERP financial data.** ServiceNow's uninstall dialog
  defaults to *"Retain tables and data"*. Deliberate human act required. (`l3-staging-design.md` §6a)
- **A `before` business rule that throws is swallowed and the record saves.** A crashed rule is
  indistinguishable from an approving one — never infer a rule ran from a record's state.
- **A Shape A deny refusal is silent** (HTTP 200, field unchanged). Any assertion on status code
  passes against a completely broken ACL. Re-read the value; write a control field in the same request.
- **`now-sdk query` on app tables 403s when filtering on `sys_created_on` or `sys_class_name`**,
  even as full admin — field-level read ACLs gate the *query*, not just the response. Filter on
  business fields.
- **Salesforce dev org credentials were pasted into the session transcript** on 2026-08-13.
  Unused — Salesforce is CRM and this app is specified to carry no CRM/sales content. **Rotate that
  password if the org is not a throwaway.**

---

# 5. The four rules that override any of the above

> **Never** draw a button that can't commit its decision. **Never** label HTML as PDF.
> **Never** display `0` for an absence. **Never** ship a test driver armed.
