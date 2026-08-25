---
title: Noviq ERP-agnostic Employee Services — test plan
app: x_335329_sn_hr_erp
author: architect agent
generated: 2026-08-23
status: draft — executable only after the §9.1 governance gates in docs/noviq/architecture.md
traces: docs/noviq/stories.md (NV-1 … NV-52) + NV-53 (raised in architecture.md §8, finding V1)
---

# §0 — Rules that apply to every test in this plan

These are not preamble. A test written without them passes against broken code, and each has
already cost this repo a build cycle.

| # | Rule | Origin |
|---|---|---|
| **R-A** | **Every ACL assertion re-reads the value and writes a control field in the same request.** A Shape A deny refusal is silent — HTTP 200, normal body, field unchanged. A test asserting on status code passes against a completely broken ACL. The control field moving in the same request is what makes the result interpretable. | D17 / trap 4 |
| **R-B** | **Every assertion on a REST error body unwraps `{"result": …}` first.** Scripted REST wraps error bodies too. | trap 2 |
| **R-C** | **Never infer that a business rule ran from a record's state.** A `before` rule that throws is swallowed and the record saves with HTTP 201. Every rule-backed test also checks `syslog` for `fluent-module` errors in the window. | D19 / trap 5 |
| **R-D** | **"Zero outbound HTTP" is proved by two independent signals**: zero new `call_log` rows with a non-null `http_code`, **and** near-zero elapsed time (the technique T18 already uses for `mutual`). One alone is not proof. | L2 |
| **R-E** | **Boolean reads use `isTrue()`.** `getValue()` on a Boolean returns `'1'`/`'0'`. A test that compares to `'true'` passes vacuously. | trap 6 |
| **R-F** | **A clean build, a clean install and an HTTP 2xx together prove nothing.** Every gate ends with the trap-1 grep and a `syslog` check. | D19 |
| **R-G** | **`0` vs absence is asserted on the payload key, not the rendered value.** `'v' in tile` — not `tile.v == 0`. | api-contract P2/P3 |
| **R-H** | Every test that touches an app table filters on **business fields only**. Filtering on `sys_created_on` or `sys_class_name` returns 403 even as full admin. | CLAUDE.md |

**Seed fixtures used throughout** (one set, created once, referenced by name):

- `SEED_IBAN` = `GB29NWBK60161331926819`
- `SEED_SALARY` = `147852.63`
- `SEED_NATIONAL_ID` = `QQ123456C`
- `SEED_EMP_KEY` = `ERP-EMP-00042`
- Systems: `SYS_SANDBOX` (`environment=sandbox`, `read_only=false`), `SYS_RO`
  (`read_only=true`), `SYS_PROD_BASIC` (`auth_type=basic`, `environment=production`).
- Users: `U_EMP` (`employee` only, linked), `U_EMP2` (`employee` only, linked, different key),
  `U_UNLINKED` (`employee`, no `emp_xref`), `U_AGENT` (`hr_agent`), `U_ADMIN` (full admin).

---

# §1 — Cross-cutting suites

These run against **every** table and endpoint the backlog creates. They are the suites that catch
what a per-story test misses.

## T-ACL — the ACL matrix (validates NV-8 AC4, NV-49 AC3, NV-49 AC4, and every "denied by ACL" AC)

### T-ACL-1: every deny rule sets `adminOverrides` explicitly
- **Precondition:** app deployed.
- **Steps:** 1. Query `sys_security_acl` for this scope. 2. For every row with `decisionType = deny`, read `admin_overrides`.
- **Expected:** every deny row has `admin_overrides = false`, present, not defaulted. **Any row where the column was never authored fails the test**, even if it happens to read `false`.
- **Validates:** NV-49 AC3.

### T-ACL-2: the Shape A re-read pattern, per protected field
- **Precondition:** one row exists on the table under test. The table has one unprotected control column and one Shape A protected column.
- **Steps:** 1. As `U_ADMIN`, PATCH **both** columns in **one** Table API request. 2. Independently re-read the record.
- **Expected:** the control column shows the new value; the protected column is **unchanged**. HTTP status is 200 and is **not** asserted on.
- **Run for:** `erp_write.state`, `.first_sent_at`, `.confirmed_at`, `.erp_ack_ref`, `.idempotency_key`, `.request_hash`; `write_approval_policy.required`; `erp_scope_grant.source_note`; `emp_xref.erp_employee_key`; `field_map.sensitive`.
- **Validates:** NV-8 AC4, NV-9 AC4, NV-10 AC4, NV-33 AC1, NV-49 AC4.

### T-ACL-3: self-scoping — an employee cannot read another employee's row
- **Precondition:** `U_EMP` and `U_EMP2` both linked, both with `erp_write` rows.
- **Steps:** As `U_EMP`, query `erp_write` unfiltered; then GET `/emp/payslips` while impersonating a request for `U_EMP2`'s key.
- **Expected:** the query returns only `U_EMP`'s rows; the endpoint returns 403 with unwrapped body `{"error": "Not authorised for this employee record"}`.
- **Validates:** NV-25 AC4, architecture V7.

## T-SENS — the sensitive-value sweep (validates NV-17 AC3, NV-21 AC5, NV-33 AC6, NV-40 AC3, NV-44 AC4, NV-48 AC2, NV-50 AC1)

### T-SENS-1
- **Precondition:** a full P0 exercise has run: a banking update, a compensation change, a salary certificate generation, a payslip download.
- **Steps:** grep `call_log`, `erp_write`, `erp_exception`, `doc_audit`, `usage_event`, `sys_email`, `sysevent_email_action` and `syslog` for `SEED_IBAN`, `SEED_SALARY`, `SEED_NATIONAL_ID`.
- **Expected:** **zero hits in every table.** One hit anywhere fails the suite.
- **Note:** also assert the notification body contains only the last four IBAN characters.

### T-SENS-2: no shadow master data
- **Steps:** query `erp_staging` for `logical_object IN (employee_profile, payroll_record, payslip_document, income_statement, leave_balance, benefit_enrollment, compensation_change)`.
- **Expected:** zero rows. Also: `CATEGORY_CHOICES` contains no `hr` and no `payroll`; the staged-object list still has exactly 14 entries.
- **Validates:** NV-13 AC2, NV-17 AC5, NV-18 AC3, NV-48 AC1, NV-48 AC3.

## T-ZERO — the `0`-for-absence sweep (validates the four-state ACs across every story)

### T-ZERO-1: forced-state matrix
- **Precondition:** for each of the ten employee-facing surfaces (payslip list, payslip retrieval, income statement, leave balance, leave types, profile prefill, write status, benefits, cost centres, document request), four fixtures exist: no `object_map`; ERP unreachable; ERP returns success-with-empty; ERP returns success-with-data.
- **Steps:** render each surface under each fixture; capture the payload **and** the screen text.
- **Expected, per surface:**
  - no map → `st: "not_configured"`, **`v` absent**, sentence names the map to create;
  - unreachable → `st: "failed"`, **`v` absent**, sentence `ERP did not answer`, plus `prev` or `no_prev`;
  - success-empty → `st: "live"`, `v: 0` **permitted here and only here**, with a distinct sentence;
  - success-data → `st: "live"` with the figure.
  A tester must be able to tell all four apart **from the screen alone**.
- **Validates:** NV-2 AC3, NV-6 AC3/AC4, NV-13 AC3, NV-17 AC4, NV-18 AC4, NV-19 AC4/AC5, NV-24 AC3/AC4/AC5, NV-26 AC4, NV-27 AC3, NV-35 AC2, NV-38 AC3, NV-46 AC2, NV-50 AC2.

## T-TRAP — the platform traps

### T-TRAP-1: no extensionless relative import
- **Steps:** `grep -rn "from '\./\|from '\.\./" src/server/ | grep -v "\.ts'"`
- **Expected:** empty. Then, after the first exercise of every new module-backed rule, query `syslog` for `messageLIKE@fluent-module` in the last 30 minutes.
- **Expected:** zero rows.
- **Validates:** NV-49 AC5, R-C, R-F.

### T-TRAP-2: no armed job
- **Steps:** query `sysauto_script` for this scope.
- **Expected:** every row `active = false` and `run_type = on_demand`. Three rows expected (confirm poller, cut-off release, reference-cache refresh).
- **Validates:** NV-49 AC8.

### T-TRAP-3: scoped-code lint
- **Steps:** grep for `var ` in `src/fluent/`, `gs.nowDateTime(` and `eval(` in `src/server/` and `src/fluent/`.
- **Expected:** all empty; the build fails if not.
- **Validates:** NV-49 AC5.

---

# §2 — Per-story tests

Format: **Test — Precondition / Steps / Expected / Validates.** Each story block closes with its AC
coverage line. Where a test is listed in §1 it is referenced, not repeated.

## Epic A — Integration Foundation

### NV-1 — Token authentication (7 ACs)
- **T1-1 basic in production without an exception ref.** *Pre:* none. *Steps:* POST `erp_system` with `auth_type=basic`, `environment=production`, `auth_exception_ref` empty; re-read. *Exp:* zero rows created; message exactly `Basic authentication is not permitted in production without a recorded exception (TRD §2). Populate Auth exception reference.` Repeat with whitespace-only ref → identical. Plus R-C `syslog` check. → AC1, AC2
- **T1-2 OAuth without an alias.** POST `auth_type=oauth2_client_credentials`, alias empty. *Exp:* refused with `OAuth 2.0 selected but no Connection & Credential Alias is set.` → AC3
- **T1-3 no secret in the artefact.** grep the built update-set XML for `client_secret`, `password`, `BEGIN PRIVATE KEY`. *Exp:* zero hits in app-owned XML. → AC4
- **T1-4 token acquisition fails.** *Pre:* deliberately wrong credentials on `SYS_SANDBOX`. *Steps:* open the payslip widget. *Exp:* state `failed`; `call_log.status=failed` carrying the token endpoint's HTTP status; screen reads `ERP did not answer`; **no `0`, no blank tile** (assert `'v' in tile` is false). → AC5
- **T1-5 token expiry mid-session.** *Pre:* fixture returns 401 on the first data call, 401 again after refresh. *Exp:* exactly **two** attempts in `call_log`, not `max_retries`; the second 401 classified non-retriable. → AC6
- **T1-6 conflict recorded.** Read the story record's `notes`. *Exp:* carries the OD38/TRD §2 conflict text verbatim. → AC7
- **AC coverage: AC1–AC7 all mapped.**

### NV-2 — Scope grants (6 ACs)
- **T2-1 schema.** `erp_scope_grant` exists with the four named columns and their types. → AC1
- **T2-2 client-side refusal.** *Pre:* no active grant for `(payslip_document, read)`. *Steps:* call the read. *Exp:* `call_log.status=not_configured`, `error_message = No scope grant for payslip_document.read`; **R-D zero-HTTP proof**. → AC2
- **T2-3 rendering.** Same fixture, via the widget. *Exp:* `Not configured — grant read scope for payslip_document`; never `0`, never `failed`. → AC3
- **T2-4 distinct elevated scope.** Save a `banking` grant reusing the general employee-update `erp_role_or_scope`; re-read. *Exp:* refused, `Elevated-sensitivity field requires a distinct ERP role/scope (TRD §5 Field-level permission clarity).` → AC4
- **T2-5 403 on a granted call.** Fixture returns 403. *Exp:* exactly one attempt in `call_log`; `erp_exception` with `Permission denied — scope grant claims access this credential does not have.` → AC5
- **T2-6 blank citation fails the build.** Add a seed grant with empty `source_note`; run `npm run build`. *Exp:* build fails. → AC6
- **AC coverage: AC1–AC6 all mapped.**

### NV-3 — Confirmable write path (8 ACs)
- **T3-0 governance.** *Exp:* **OD42 exists in `docs/decision-log.md`.** If absent, every NV-3 test is `BLOCKED`, not `FAIL`, and Phase 5 does not run. → AC1
- **T3-1 schema.** `erp_write` carries all thirteen named columns plus the state choice list. → AC2
- **T3-2 read-only refusal.** Dispatch against `SYS_RO`. *Exp:* `state=blocked`, `System is marked read-only; write refused.`, R-D zero-HTTP. → AC3
- **T3-3 2xx with no confirmable identifier.** Fixture returns 200 `{}` on a map whose `confirm_ack_path` resolves nothing. *Exp:* `state=failed`, `Write returned no confirmable status (TRD §2 Write pattern).` **Never `confirmed`.** → AC4
- **T3-4 async confirm.** Fixture returns 202. *Exp:* `state=sent`; poller moves it to `confirmed` on the follow-up; a row left in `sent` past `confirm_timeout_ms` moves to **`failed`**, asserted by advancing the clock, not by waiting. → AC5
- **T3-5 timeout.** Fixture never responds. *Exp:* `state` stays `sent`; retried per classification; the second dispatch carries the **identical** `idempotency_key` and issues no bare create. → AC6
- **T3-6 no control before commit is possible.** *Pre:* `erp_scope_grant` absent. *Steps:* inspect the rendered DOM. *Exp:* **no Submit element exists in the DOM at all** — a `disabled` attribute fails this test — and the surface states the reason. → AC7
- **T3-7 no originating case.** Insert `erp_write` with empty `source_record`; re-read. *Exp:* zero rows; `Write has no originating ServiceNow case — refused (BRD §7 Auditability).` Plus R-C. → AC8
- **AC coverage: AC1–AC8 all mapped.**

### NV-4 — Idempotency (6 ACs)
- **T4-1 key stability.** Compute the key twice for identical inputs across two sessions. *Exp:* byte-identical. Assert the key contains no timestamp by computing it 60s apart. → AC1
- **T4-2 database-level uniqueness.** Insert two `erp_write` rows with the same `(erp_system, idempotency_key)` **via the Table API**, bypassing script. *Exp:* the second is rejected by the index, not by a rule. → AC2
- **T4-3 header mode / existence-check mode.** *Exp:* header mode sends the key in the configured header and `source_note` cites the vendor doc; existence-check mode issues the probe **before** the create and skips the create on a match. → AC3
- **T4-4 retry after ambiguous timeout.** *Pre:* create times out with no response; the record exists ERP-side. *Steps:* retry. *Exp:* existence check runs first; `state=confirmed` with `erp_ack_ref` from the check; **no second create in `call_log`**; ERP-side count is exactly 1 after two dispatch attempts. → AC4
- **T4-5 neither mechanism.** Save an `object_map` with `operation=create` and `idempotency_mode=none`. *Exp:* refused with `No idempotency mechanism configured for <logical_object>.create …`; a vendor-gap record is written. → AC5
- **T4-6 both consumers proven independently.** Run T4-4 twice: once for `erp_attachment.create` (NV-37) and once for `employee_profile.create` (NV-23). → AC6
- **AC coverage: AC1–AC6 all mapped.**

### NV-5 — Binary transport (8 ACs)
- **T5-1 gap banner.** Story `notes` carries the build-gap text. → AC1
- **T5-2 binary retrieval.** *Exp:* the request carries `Accept: application/pdf`; the result exposes `content_type` and `content_length`; the bytes never pass through the field mapper (assert `field-mapper` is not on the call path). → AC2
- **T5-3 never stored — restated per architecture §6.1 / OD43.** *Steps:* record `sys_attachment` count **before** the request and **after the response completes**; then query `sys_attachment` for `table_name = x_..._bin_spool`. *Exp:* count unchanged; spool attachments **zero**; `bin_spool` rows zero; no app table contains the byte string. *Note:* a mid-transaction sample would see a spool row — that is OD43's accepted cost and is **not** a failure. → AC3
- **T5-4 wrong content type.** Fixture returns `text/html`. *Exp:* rejected before delivery; `Document could not be retrieved — the ERP returned an unexpected format (text/html)`; bytes discarded; spool cleaned. → AC4
- **T5-5 magic bytes.** Fixture returns `Content-Type: application/pdf` with a body starting `<html`. *Exp:* rejected identically. **Additional assertion:** delivered byte length equals `Content-Length` on the success path, so a truncated-but-`%PDF-` body is caught. → AC5
- **T5-6 upload direction.** *Exp:* multipart/binary POST carries the PDF plus the document-type value; the response identifier lands in `erp_write.erp_ack_ref`. → AC6
- **T5-7 oversize.** Exceeds `max_attachment_bytes`. *Exp:* refused **before transfer**, `Document exceeds the ERP's stated size limit of <n> MB`, zero bytes moved. → AC7
- **T5-8 ERP silent.** *Exp:* `ERP did not answer`; no empty list, no zero-byte download, no `0`. → AC8
- **AC coverage: AC1–AC8 all mapped.**

### NV-6 — Versioning (6 ACs)
- **T6-1** notes carry the gap banner. → AC1 · **T6-2** four columns exist with the right types and **no default** on `deprecation_notice_days`. → AC2
- **T6-3** empty `api_version` saves and renders `API version not recorded`. → AC3
- **T6-4** empty `deprecation_notice_days` renders `Deprecation policy not stated by vendor`; a stored `0` renders `0` as a finding. **Two distinct renders from one column.** → AC4
- **T6-5** `endpoint_path` `/data/v67.0/query` with empty `api_version` → save succeeds **and** a warning is recorded. → AC5
- **T6-6** fixture returns `Sunset` and `Deprecation` headers → both written to `call_log`; `erp_exception` raised with `ERP announced deprecation of <api_version>, sunset <date>`. → AC6
- **AC coverage: AC1–AC6 all mapped.**

### NV-7 — Payroll cut-off (7 ACs)
- **T7-1** notes carry the gap banner. → AC1 · **T7-2** `payroll_calendar` schema. → AC2
- **T7-3 after cut-off.** *Pre:* calendar row whose `cutoff_datetime` is past. *Steps:* dispatch a leave write. *Exp:* `state=blocked_cutoff`, `effective_cycle` = next period label, **R-D zero-HTTP**. → AC3
- **T7-4 the sentence.** *Exp:* the RITM shows exactly `Submitted after the <pay_period_label> cut-off (<cutoff_datetime>). This change will apply in <next_period_label>, pay date <pay_date>.` → AC4
- **T7-5 automatic release.** Advance to the next period, run the release job on demand. *Exp:* `attempts` increments, `state=sent`, `idempotency_key` **unchanged**. → AC5
- **T7-6 no calendar row — the dangerous default.** *Pre:* no row for the country/date. *Exp:* `state=blocked_cutoff` with `No payroll calendar configured for <country> covering <effective_date> — write refused.` **A write that goes through fails this test.** → AC6
- **T7-7** the employee surface never renders a cut-off state as `0` days or a blank date. → AC7
- **Additional (trap 13):** seed an unparseable `cutoff_datetime`. *Exp:* the gate **refuses**; it does not read the field as absent and allow the write.
- **AC coverage: AC1–AC7 all mapped.**

### NV-8 — Auditability (6 ACs)
- **T8-1** every `erp_write` row created by the P0 exercise carries non-empty `source_table`+`source_record`, `requested_by`, `sent_at`; `approval_ref` and `approved_by` non-empty on every gated operation. → AC1
- **T8-2** the outbound request carries the case number in the configured header **and** `erp_scope_grant.source_note` cites the vendor doc; where no field exists, a vendor-gap record exists and **no header was invented**. → AC2
- **T8-3** = **T-SENS-1** restricted to `erp_write` + `call_log`. → AC3
- **T8-4** = **T-ACL-2** on `erp_write.state` and friends. → AC4
- **T8-5** dispatch a gated operation with no approver. *Exp:* insert rejected, **no `erp_write` row**, surface shows `Approval record missing — write refused.` → AC5
- **T8-6** `sys_property erp_write.retention_days` exists with **no value**; the governance report renders `Retention not set`. → AC6
- **AC coverage: AC1–AC6 all mapped.**

### NV-9 — The approval gate (7 ACs)
- **T9-1** the gate resolves from `write_approval_policy`, not from code. *Steps:* grep the dispatcher for per-flow approval branches. *Exp:* none. → AC1
- **T9-2** the ten seed rows exist, each with a non-empty `source_note` citing its BRD section. → AC2
- **T9-3 the gate.** Three fixtures: (a) no approval; (b) approval `state=requested`; (c) approval `approved` but `sys_updated_on` **after** `first_sent_at`. *Exp:* all three → `state=blocked_approval`, R-D zero-HTTP. Then (d) approval `approved` before `first_sent_at` → dispatch proceeds. → AC3
- **T9-4 forged approval.** As a user who is not the assigned approver, PATCH `sysapproval_approver.state` to `approved` **with a control field in the same request**; re-read. *Exp:* control field moved, `state` still `requested`. → AC4
- **T9-5 approval rejected.** *Exp:* no `erp_write` row; case `closed_incomplete`, reason `Approval rejected`; zero HTTP in `call_log`. → AC5
- **T9-6 approval times out.** *Exp:* stays `blocked_approval` indefinitely, appears on the exception queue after the configured age, **never auto-approves** (assert after advancing the clock past any plausible window). → AC6
- **T9-7** no Submit-to-ERP control in the DOM on any gated item until the approval record exists. → AC7
- **T9-8 (architecture V15 / OD44) — the gate survives a swallowed rule.** *Steps:* deliberately break the `before insert` rule (introduce a runtime throw), redeploy, dispatch a gated write with no approval. *Exp:* the row saves (trap 5 confirmed) **and the dispatcher still refuses** — R-D zero-HTTP, `state=blocked_approval`. **A test suite that omits this has not tested the gate.**
- **AC coverage: AC1–AC7 all mapped, plus V15.**

### NV-10 — Shared employee identifier (6 ACs)
- **T10-1** `emp_xref` carries `erp_employee_key` + `erp_system` with **two** unique indexes; a duplicate insert on either is rejected **at the database**. → AC1
- **T10-2** grep every connector call path for `sys_user.email` / `sys_user.name` as a query source. *Exp:* zero hits; every read and write resolves from `erp_employee_key`. → AC2
- **T10-3** as `U_UNLINKED`, open each ERP-backed widget. *Exp:* exactly `Your record is not yet linked to the ERP — contact HR` and **no figure of any kind** — assert `'v' in tile` is false on every tile. → AC3
- **T10-4** write-once: as `U_AGENT` PATCH an existing `erp_employee_key` with a control field; re-read. *Exp:* unchanged. As `hr_admin`, change it; *Exp:* succeeds **and** an audit row names old and new. → AC4
- **T10-5 identity mismatch.** ERP returns a different key. *Exp:* exception `Identity mismatch for <user>: stored <a>, ERP returned <b>`; **both reads and writes blocked** for that user. → AC5
- **T10-6 retired key.** Terminate, then attempt to assign the key to another user. *Exp:* refused; the key remains on the original row. → AC6
- **AC coverage: AC1–AC6 all mapped.** *(Architecture V3: these run against the extended `emp_xref`, not a new table.)*

### NV-11 — Attachment limits (6 ACs)
T11-1 three columns exist and ship **empty** (AC1) · T11-2 empty limit ⇒ attachment control **not in the DOM** and item shows `Attachment limits not configured for <system> — attachments unavailable.` (AC2) · T11-3 oversize rejected client-side with the exact sentence, nothing uploaded (AC3) · T11-4 wrong MIME rejected with the accepted list named (AC4) · T11-5 POST an oversize body **directly to the REST endpoint**, bypassing the client → 413 with an unwrapped JSON body per R-B (AC5) · T11-6 ERP rejects a locally-valid file → exception names both the configured limit and the ERP's response (AC6). **AC coverage: AC1–AC6.**

### NV-12 — Classification and exception queue (7 ACs)
T12-1 grep for a second classifier ⇒ zero; `classify.ts` is the only one, extended not duplicated (AC1) · T12-2 force 400/401/403/404/409/422 → **exactly one attempt each** in `call_log`, `erp_exception` created immediately (AC2) · T12-3 retriable exhausting `max_retries` creates one exception; retriable succeeding on retry creates **none** (AC3) · T12-4 the eight `category` values are a closed choice list; a generic `Error` value cannot be saved (AC4) · T12-5 insert an exception with no assignment group → rejected; the HR list view shows the originating case linked (AC5) · T12-6 force all eight categories, assert one row each (AC6) · T12-7 as `U_EMP`, inspect every employee-facing payload for `sync_run.error_message` ⇒ zero occurrences, for every role (AC7). **Plus V6:** fixture returns **HTTP 200 with an error body** matching `error_predicate_path`/`_value` → classified `failure`, non-retriable, exception raised. With the predicate blank, the same fixture classifies `success` — behaviour unchanged from today. **AC coverage: AC1–AC7 + V6.**

### NV-13 — Synchronous reads (6 ACs)
T13-1 every Epic C–J widget issues its call at render; grep for any read served from `erp_staging` ⇒ zero (AC1) · T13-2 = **T-SENS-2** (AC2) · T13-3 exceed `read_timeout_ms` → `ERP did not answer`, `'v' in tile` false (AC3) · T13-4 a prior good figure in the **same session** renders `Last good figure: <v> (as of <date time>, <n> old)` with a date **and** a time; a new session shows none (AC4) · T13-5 only objects with `cacheable=true` write `ref_cache`; a non-reference object attempting to cache is refused; cache age is on screen (AC5) · T13-6 two systems, one degraded → state is the **worst** contributor and the tile names the degraded system: `Partial — <name> did not answer.` (AC6). **AC coverage: AC1–AC6.**

### NV-14 — Data format (6 ACs)
T14-1 ISO 8601 and OData V2 `/Date(…)/` both parse **by shape**, with `date_format` deliberately blank (AC1) · **T14-2 — trap 13, the important one:** seed an unparseable date; assert `sync_run` records the parse failure **and** the "due within N days" tile renders `ERP did not answer`, not `0` and not an empty column (AC2) · T14-3 unmapped `currency` leaves the figure unrendered with `not configured — map <object>.currency`; instance-currency defaulting is absent from the code (AC3) · T14-4 mixed currency renders per-currency subtotals via `sub`, with `v` absent (AC4) · T14-5 an XML/SOAP response is converted at the connector boundary; grep the logical-field layer for vendor payload shapes ⇒ zero (AC5) · T14-6 a bare number for money renders nothing (AC6). **AC coverage: AC1–AC6.**

### NV-15 — Sandbox and vendor onboarding (5 ACs)
T15-1 `environment` mandatory; `sandbox` + a production hostname raises a warning naming both (AC1) · T15-2 each TRD §8 item is a Boolean+citation pair; `true` with a blank `source_note` is refused at save (AC2) · T15-3 unchecked renders `Not confirmed`, **never `No`** — assert the literal string (AC3) · T15-4 a certification run against `environment=production` is refused (AC4) · T15-5 Cegid and PHC records exist with **every** item unchecked and `source_note = No research exists — see alignment §6.3`; any plausible seeded value fails (AC5). **AC coverage: AC1–AC5.**

### NV-16 — Rate limits and latency (6 ACs)
T16-1 three columns exist and ship empty (AC1) · T16-2 empty `rate_limit_per_min` ⇒ **no throttle applied**, badge `Rate limit not stated by vendor` (AC2) · T16-3 limit 60: the 61st call in a minute is **queued**, not dropped and not sent (AC3) · T16-4 a 429 honours `Retry-After` and records the observed limit in `call_log` (AC4) · T16-5 latency over `expected_latency_ms` × factor raises a low-priority exception **and the read still succeeds** (AC5) · T16-6 per-object `read_timeout_ms` defaults each carry a `source_note` citing TRD §6, and the governance report flags them as unconfirmed planning assumptions (AC6). **AC coverage: AC1–AC6.**

## Epic B — Logical entity model

### NV-17 (6) T17-1 all thirteen fields present, the original seven **unrenamed** (AC1) · T17-2 build fails on any seeded mapping with a blank `source_note` (AC2) · T17-3 = T-SENS-1 for `bank_account_iban` (AC3) · T17-4 unmapped field renders `Not configured — map employee_profile.cost_centre` (AC4) · T17-5 = T-SENS-2 (AC5) · T17-6 partial vendor record: present fields render `live`, absent render `not configured`, tile does not fail wholesale (AC6). **AC1–AC6.**
### NV-18 (6) T18-1/T18-2 both objects with their full field sets (AC1, AC2) · T18-3 = T-SENS-2 (AC3) · T18-4 empty `document_reference` → `Document not available from the ERP for this period`; **no link that 404s, no `0`-count tile** (AC4) · T18-5 unmapped `currency` leaves figures unrendered (AC5) · T18-6 the listed-vs-retrievable split: two separate numbers, two separate sentences; one conflated number fails (AC6). **AC1–AC6.**
### NV-19 (7) T19-1/2/3 three objects incl. `leave_type_ref` (AC1–AC3) · T19-4 unmapped `balance_unit` ⇒ **no number rendered at all** (AC4) · T19-5 `0 days` only under success-with-zero (AC5) · T19-6 `as_of_date` with date **and** time; missing ⇒ `Balance date unknown` + `stale` (AC6) · T19-7 unknown leave type still renders, labelled `(unrecognised leave type)`, never dropped (AC7). **Plus V11:** `absence_reason_ref` exists with `code`/`label`/`active`. **AC1–AC7 + V11.**
### NV-20 (6) T20-1/2 both objects incl. the `expense_line` child (AC1, AC2) · T20-3 a line with no currency refuses submission with the exact sentence (AC3) · T20-4 unmapped VAT renders `Not applicable`, never `0` (AC4) · T20-5 upload with no `document_type_category` refused **before dispatch** (AC5) · T20-6 total ≠ sum of lines refuses naming both figures; nothing partial is sent (AC6). **AC1–AC6.**
### NV-21 (7) T21-1/2/3/4 four objects (AC1–AC4) · T21-5 = T-SENS-1 for `new_value` (AC5) · T21-6 empty `effective_date` refused with the exact sentence, on all three write entities (AC6) · T21-7 inactive cost centre refused naming the code, never reassigned to a default (AC7). **Plus V9/V10:** `salary_history` and `benefit_contribution_history` child collections exist and map through the array-predicate path syntax. **AC1–AC7 + V9 + V10.**

## Epic C — Identity & Onboarding

### NV-22 (6) T22-1 lookup by surname + one of (employee number, national ID, start date) renders the four candidate columns (AC1) · T22-2 bind writes `erp_employee_key`; as a non-`hr_admin`, attempt it with a control field and **re-read** ⇒ unchanged (AC2) · T22-3 multiple candidates **never** auto-bind; a single result auto-binds only when `external_employee_id` was supplied exactly (AC3) · T22-4 zero rows renders `No matching ERP employee found`, visibly distinct from `ERP did not answer` — a tester distinguishes them from the screen alone (AC4) · T22-5 no search `object_map` ⇒ **the lookup screen is not rendered**; surface shows `Employee search is not available for <system> — link IDs manually or via onboarding`; no empty search box exists in the DOM (AC5) · T22-6 already-bound candidate refused with `ERP employee <id> is already linked to <user>`; the existing link unchanged (AC6). **AC1–AC6.**
### NV-23 (8) T23-1 approval creates exactly one `erp_write` with `operation=create` and the NV-4 key (AC1) · T23-2 confirmation writes the ERP id to `emp_xref`; the case shows `Linked to ERP employee <id>` (AC2) · T23-3 without banking approval the create payload **omits** banking fields and a separate R2 task is raised; a payload containing them fails (AC3) · T23-4 two dispatches ⇒ exactly one ERP record, second confirms via existence check (AC4) · T23-5 422 ⇒ non-retriable, exception `Validation failure` with the ERP's field-level message, case stays open, **never closed complete** (AC5) · T23-6 403 ⇒ `Permission denied`, no retry (AC6) · T23-7 no approval ⇒ no `erp_write` row and **no Submit control in the DOM** (AC7) · T23-8 = T-SENS-2 for `employee_profile` (AC8). **AC1–AC8.**

## Epic D — Payroll & Tax Documents

### NV-24 (8) T24-1 list newest-first with `period_label`, `issue_date`, retrieval control (AC1) · T24-2 inspect the server response for any base64 field ⇒ **zero** (AC2) · T24-3/4/5 = **T-ZERO-1** for this surface: `Not configured — create an Object Map for payslip_document` with no list frame; `ERP did not answer`, never an empty list, never `0 payslips available`; `No payslips issued yet` under success-empty and visibly distinct from failed (AC3–AC5) · T24-6 a row with empty `document_reference` renders `Retrieval unavailable` and its control is **absent from the DOM**, not disabled (AC6) · T24-7 as `U_UNLINKED` ⇒ the NV-10 sentence and no list (AC7) · T24-8 timeout is bounded by `object_map.read_timeout_ms` and the `failed` state renders **within** that budget (AC8). **AC1–AC8.**
### NV-25 (8) T25-1 response carries `Content-Type: application/pdf` and a `Content-Disposition` filename containing the period label (AC1) · T25-2 = **T5-3**, per OD43's restatement (AC2) · T25-3 `call_log` holds `content_type`, `content_length`, status, duration and **no bytes** (AC3) · T25-4 as `U_EMP` request `U_EMP2`'s payslip ⇒ 403 with unwrapped `{"error": "Not authorised for this employee record"}`; grep the code path for a `sys_user_has_role` query ⇒ zero (AC4) · T25-5 ERP returns a login page ⇒ magic-byte rejection, `Document could not be retrieved — the ERP returned an unexpected format`; **nothing with a `.pdf` name is delivered** (AC5) · T25-6 timeout ⇒ `ERP did not answer — try again`, no partial file, no zero-byte file (AC6) · T25-7 404 for an advertised period ⇒ non-retriable, exception `Record not found` naming the period (AC7) · T25-8 every retrieval writes a `doc_audit` row with user, key, period, timestamp and **no content** (AC8). **AC1–AC8.**
### NV-26 (7) T26-1 the year selector lists only years the ERP reports; no guessed range (AC1) · T26-2 figures render with explicit currency; unmapped `currency` ⇒ `not configured — map income_statement.currency` (AC2) · T26-3 document variant follows NV-25 rules unchanged (AC3) · **T26-4 the highest-risk `0`:** `tax_withheld = 0` renders `0` **only** under a successful response containing zero; a missing or unmapped value renders `not configured`. Run both fixtures and diff the screens (AC4) · T26-5 not-yet-issued year shows `Statement not yet issued`, not zero figures (AC5) · T26-6 unreachable ⇒ `ERP did not answer`, no figures (AC6) · T26-7 D4 (NV-41) consumes this read; grep for a second income-statement read path ⇒ zero (AC7). **AC1–AC7.**

## Epic E — Leave & Absence

### NV-27 (6) T27-1 one row per leave type with value + unit + `as_of_date` (date and time) (AC1) · T27-2 unmapped unit ⇒ `Not configured — map leave_balance.balance_unit` and **no number** (AC2) · T27-3 = **T-ZERO-1**: all four states distinguishable from the screen alone, including `Stale — as of <date time> (<n> old)` (AC3) · T27-4 fetched at render, never staged (AC4) · T27-5 partial across types ⇒ the types received render, plus `Partial — <n> leave types did not return`; **no type is silently dropped** (AC5) · T27-6 D5 consumes this read; no second path (AC6). **AC1–AC6.**
### NV-28 (6) T28-1 cached with a `sys_property` TTL; picker shows `Leave types as of <date time>` (AC1) · T28-2 only `active=true` offered; an inactive type on an open request renders `(no longer offered)` (AC2) · **T28-3 no cache, fetch fails ⇒ the form is NOT rendered**; `Leave types unavailable — the ERP did not answer. Try again shortly.`; grep the code for any hard-coded leave-type list ⇒ **zero** (AC3) · T28-4 cache present, fetch fails ⇒ form renders labelled `Leave types may be out of date — as of <date time>` (AC4) · T28-5 success-with-empty ⇒ `The ERP reports no leave types configured`, distinct from the failure message (AC5) · T28-6 no other Epic E object writes `ref_cache` (AC6). **AC1–AC6.**
### NV-29 (9) T29-1 approval precedes `first_sent_at` (AC1) · T29-2 confirmation writes `erp_request_reference` and shows `Recorded in the ERP as <reference>` (AC2) · T29-3 locked period ⇒ `blocked_cutoff` + the NV-7 sentence; not sent, not dropped (AC3) · T29-4 two dispatches ⇒ exactly one ERP request, verified via INT-13 (AC4) · T29-5 422 insufficient balance ⇒ non-retriable, `Validation failure` with the ERP's message, RITM open with `The ERP rejected this request: <message>`, **the ServiceNow approval is not reversed** (AC5) · T29-6 403 ⇒ `Permission denied`, no retry (AC6) · T29-7 timeout ⇒ existence check before any resubmission (AC7) · T29-8 no Submit control in the DOM until map + grant + approval all exist (AC8) · T29-9 the RITM status string equals `erp_write.state` one-for-one across `queued`/`sent`/`blocked_cutoff`/`blocked_approval`/`confirmed`/`failed`; `Submitted to ERP` never appears for a non-confirmed state (AC9). **AC1–AC9.**
### NV-30 (6) T30-1 both states rendered and distinctly labelled (AC1) · T30-2 divergence raises `Conflict / duplicate`, visible to HR, **not silently overwritten either way** (AC2) · T30-3 cancellation passes the full NV-3 path; no confirmable status ⇒ `failed` (AC3) · T30-4 cancel after lock ⇒ refused with the NV-7 message and **not cancelled locally either** (AC4) · T30-5 no cancel `object_map` ⇒ **no Cancel element in the DOM**; RITM shows `Cancellation must be handled by HR for this system`; a button that raises a case fails (AC5) · T30-6 ERP unreachable ⇒ `ERP status: could not be retrieved` while the ServiceNow state still renders; no `0`, no blank (AC6). **AC1–AC6.**

## Epic F — Personal & Banking Data

### NV-31 (6) T31-1 prefill from a live read (AC1) · T31-2 a field the ERP omitted renders empty **with the label `Not returned by the ERP`**, never prefilled from `sys_user` (AC2) · T31-3 IBAN prefills masked; grep the served HTML/JSON for the full value ⇒ zero (AC3) · T31-4 unreachable ⇒ form read-only with `Current values could not be retrieved from the ERP. Submitting now risks overwriting data you cannot see.` and **no Submit element in the DOM** (AC4) · T31-5 no `object_map` ⇒ item not orderable, `Not configured — create an Object Map for employee_profile` (AC5) · T31-6 = T-SENS-2 (AC6). **AC1–AC6.**
### NV-32 (8) T32-1 only changed fields in the payload — assert an unchanged field is **absent**, not sent with its old value (AC1) · T32-2 `write_approval_policy` has **no row** for these fields (AC2) · T32-3 confirmation ⇒ `Updated in the ERP at <date time>` from `confirmed_at` (AC3) · T32-4 two dispatches ⇒ one logical update, identical key, ERP value equals the submitted value exactly once (AC4) · T32-5 422 ⇒ non-retriable, ERP's field-level message rendered verbatim, RITM open (AC5) · T32-6 403 ⇒ `Permission denied` plus the scope-grant note (AC6) · T32-7 timeout ⇒ `Sent to the ERP, awaiting confirmation`; **`Updated in the ERP` never appears before `confirmed`** (AC7) · T32-8 a submission containing `bank_account_iban` is rejected **server-side** with `Banking changes must use the approval-gated item.` (AC8). **AC1–AC8.**
### NV-33 (11) T33-1 the policy row exists, cites BRD R2, and is deny-write below `hr_admin` — re-read pattern; a change writes an audit row (AC1) · T33-2 dispatch with `state=requested` ⇒ R-D zero-HTTP and `blocked_approval` (AC2) · T33-3 approval created **after** a dispatch attempt ⇒ still does not send (AC3) · T33-4 change IBAN **and** email in one submission ⇒ the notification goes to the **old** email (AC4) · T33-5 grep the sent notification for the full IBAN ⇒ zero; last four only (AC5) · T33-6 = T-SENS-1 across all four tables, old **and** new values (AC6) · T33-7 banking grant reusing the general scope value ⇒ refused at save (AC7) · T33-8 rejection ⇒ no `erp_write`, no HTTP, RITM closed incomplete, prior-of-record notified of the refusal (AC8) · T33-9 two dispatches ⇒ one update, identical key (AC9) · T33-10 invalid IBAN 422 ⇒ non-retriable, message verbatim, **the approval is not consumed**; a corrected resubmission requires a fresh approval (AC10) · T33-11 timeout ⇒ `Sent to the ERP, awaiting confirmation`; the prior-of-record notification fires **only on `confirmed`** (AC11). **AC1–AC11.**

## Epic G — Expenses

### NV-34 (8) T34-1 header + N lines with amount, category, explicit currency, optional VAT, receipts (AC1) · T34-2 = NV-11 suite, client **and** server; unconfigured limits ⇒ control absent and item not orderable (AC2) · T34-3 the `expense_claim.create` policy row exists and gates dispatch (AC3) · T34-4 total ≠ line sum refuses naming both (AC4) · T34-5 two dispatches ⇒ one ERP claim and **one copy of each receipt** (AC5) · T34-6 receipt succeeds, claim fails ⇒ no orphan survives: either cleaned up or reconciled under the same key on retry (AC6) · T34-7 422 ⇒ the per-line message renders **against its line**, not as a header error (AC7) · T34-8 403 and timeout per NV-12/NV-3; `Submitted to Finance` never shown for a non-confirmed write (AC8). **AC1–AC8.**
### NV-35 (5) T35-1 status maps to exactly one of the four, or `Status not recognised (<raw value>)` shown raw and **never coerced** (AC1) · T35-2 payment date/amount render only when supplied, each with a currency; unmapped ⇒ `not configured`, never `0` (AC2) · T35-3 unreachable ⇒ `Claim status could not be retrieved from the ERP`; the ServiceNow state still renders; **never an implied `Rejected`** (AC3) · T35-4 empty `erp_claim_reference` ⇒ `Not yet recorded in the ERP` and **zero status calls issued** (AC4) · T35-5 `Rejected` with no reason ⇒ `Rejected — no reason supplied by the ERP`, not a blank (AC5). **AC1–AC5.**

## Epic H — HR Document Center

> **Gate:** every test below that asserts `%PDF-` on a **generated** document is `BLOCKED`, not
> `FAIL`, until OD2 resolves to branch (b). On the current instance the honest expected result is
> a `.html` file, `text/html`, `output_format = HTML`, and **no ERP archival** (OD41). NV-39's D3
> and NV-42's D8 are unaffected — those bytes come from the ERP.

### NV-36 (9) T36-1 the category exists; an item with no `object_map` or template is **not published** (AC1) · T36-2 the template table maps document type → logical fields with `placeholder` and `mandatory` (AC2) · T36-3 generation reads live, only the mapped fields; = T-SENS-2 after generation (AC3) · **T36-4 the abort:** make one `mandatory` placeholder unresolvable ⇒ **no PDF, no attachment**, RITM shows `Could not be generated — <field label> was not returned by the ERP.` Assert `sys_attachment` count unchanged. A document containing a blank, an em-dash or a `0` in that position fails absolutely (AC4) · T36-5 output format: first bytes and content type both derive from one resolution; **BLOCKED per the gate above** — on this instance assert `.html`/`text/html`/`HTML` and that nothing claims PDF (AC5) · T36-6 as an unrelated employee, request the attachment and **re-read**; assert denial by absence of content, not by a UI state (AC6) · T36-7 ERP unreachable ⇒ no PDF, `The ERP did not answer — the document was not generated. Your request remains open.`, **no fallback to a prior copy** (AC7) · T36-8 template referencing an unmapped logical field ⇒ item unpublished and the control tower names the missing mapping (AC8) · T36-9 the RITM copy's retention setting exists or renders `Retention not set` (AC9). **AC1–AC9.**
### NV-37 (9) T37-1 upload on generation/release, tagged with the category; `erp_ack_ref` recorded (AC1) · **T37-2 idempotency proven:** two dispatches ⇒ exactly **one** archived copy, counted via INT-19 (AC2) · T37-3 archived copy byte-identical to the RITM attachment, compared by hash (AC3) · T37-4 no `document_type_category` ⇒ refused before dispatch (AC4) · T37-5 archival fails after successful generation ⇒ the employee **keeps** the attachment, archival queued, exception raised, RITM shows `Issued. ERP archival pending.` and **never `Archived`** before `confirmed` (AC5) · T37-6 timeout ⇒ existence check before re-upload; no second copy (AC6) · T37-7 oversize/MIME refused before transfer naming the ERP's limits (AC7) · T37-8 no `erp_attachment.create` grant ⇒ archival not attempted; control tower records `<system> does not expose document archival — R5 archival unavailable.`; the item **still generates and attaches** (AC8) · T37-9 every archival writes an `erp_write` row with `source_record` = the RITM and no document content in any log (AC9). **Plus OD41:** with the resolved format HTML and `allow_html_archive=false`, archival is **refused** and the RITM says so. **AC1–AC9 + OD41.**
### NV-38 (6) T38-1 the HR view lists ERP-side archived documents live (AC1) · T38-2 reconciliation reports the three counts (AC2) · **T38-3** each count renders `0` **only** under a successful read on **both** sides; either side failing ⇒ `Could not be reconciled — <side> did not answer` and **no number** (AC3) · T38-4 this view is the existence check backing NV-4 for archival; grep for a second implementation ⇒ zero (AC4) · T38-5 upload-but-no-list ⇒ the reconciliation view is **not rendered** and the control tower states why; an empty reconciliation presented as "all reconciled" fails (AC5) · T38-6 no document content is retrieved (AC6). **AC1–AC6.**
### NV-39 (7) T39-1 D1's four fields are all `mandatory=true`; a missing one aborts per T36-4 (AC1) · T39-2 D1 has **no** policy row; attachment and archival fire on generation (AC2) · T39-3 D3 takes a period from the NV-24 list and re-delivers via NV-25; grep D3's path for any PDF **generation** call ⇒ zero (AC3) · T39-4 D3's delivered file hash equals a direct NV-25 download's hash (AC4) · T39-5 D3's dependency set contains NV-24/NV-25 and **not** NV-36/NV-37 (AC5) · T39-6 requested period has no document ⇒ `No payslip document exists for <period>`, nothing issued, **no fall-through to generation** (AC6) · T39-7 terminated employee: D1 either issues past-tense wording or the item is not orderable **and states why**; a present-tense verification for a terminated employee fails (AC7). **AC1–AC7.**
### NV-40 (8) T40-1 the `document.D2` policy row exists; no attachment and no archival before approval (AC1) · **T40-2** as the requester pre-approval, request the attachment and **re-read**: assert **no attachment record exists** — not that a control is hidden (AC2) · T40-3 = T-SENS-1 for `SEED_SALARY` across `doc_audit`, `call_log`, `erp_write`, `erp_staging` (AC3) · T40-4 unmapped `currency` ⇒ generation aborts; a certificate with a bare number is not issued (AC4) · T40-5 rejection ⇒ no attachment, no archival, RITM closed incomplete, `sys_attachment` count unchanged (AC5) · T40-6 unreachable ⇒ no PDF, no fallback to a prior certificate (AC6) · T40-7 approved but archival fails ⇒ employee keeps the attachment, `Issued. ERP archival pending.` (AC7) · T40-8 no Release element in the DOM before approval (AC8). **AC1–AC8.**
### NV-41 (7) T41-1 D4 sources from NV-26; document variant follows NV-25 and generates nothing (AC1) · T41-2 D5 sources from NV-27; every balance prints unit and `as_of_date` with date and time; a unitless balance aborts generation (AC2) · T41-3 D10 unpublished until `benefit_enrollment` has an `object_map`; never published with an empty statement (AC3) · T41-4 none of the three has a policy row (AC4) · **T41-5 the sharpest `0`:** D5 prints `0 days` only under a successful read returning zero and states the as-of date; a **failed** read **aborts generation** rather than certifying zero. Run both fixtures (AC5) · T41-6 truncated contribution history ⇒ **not issued**; `Contribution history was incomplete — the statement was not generated.` (AC6) · T41-7 D4 resolves its template through NV-43 (AC7). **AC1–AC7.**
### NV-42 (8) T42-1 all four have policy rows; for each, the pre-approval attachment check is a **re-read**, not a UI check (AC1) · T42-2 D6 needs `position_history`; with it absent the item is unpublished with `Position history is not available from <system>`; a flattened single-position substitute fails (AC2) · T42-3 D7 only orderable after a confirmed termination; otherwise `Final settlement requires a confirmed termination date.`; `final_pay_calculation`/`leave_payout` unmodelled ⇒ D7 unpublishable (G5/OQ-6) (AC3) · T42-4 D8 **retrieves** the stored contract via NV-25; grep D8's path for a generation call ⇒ zero (AC4) · T42-5 D9 with a permanent contract prints `Permanent — no end date`, never blank and never `0` (AC5) · T42-6 rejection on any of the four ⇒ no attachment, no archival, `sys_attachment` unchanged, RITM closed incomplete (AC6) · T42-7 unreachable ⇒ no document, no fallback (AC7) · T42-8 D6/D7 resolve through NV-43 (AC8). **AC1–AC8.**
### NV-43 (5) T43-1 resolution by (type, country, language) with the documented fallback; the resolved combination is recorded on the RITM (AC1) · T43-2 add a country **by data only** and generate successfully; assert zero changes to `object_map`, `field_map`, the connector or any script (AC2) · T43-3 no template for the employee's country ⇒ item not orderable, `This document is not available for <country> yet.`; **falling back to another country's template fails absolutely** (AC3) · T43-4 a field mandatory in one country and absent in another; the NV-36 abort respects the **resolved** template (AC4) · T43-5 resolved country/language appear in the document metadata and on the audit row (AC5). **AC1–AC5.**

## Epic I — Employment Lifecycle

### NV-44 (10) T44-1 the manager→HR→Finance chain completes before dispatch; the policy row exists and cites BRD R6/§7 (AC1) · T44-2 the write carries all five fields; empty `effective_date` refused (AC2) · T44-3 locked period ⇒ `blocked_cutoff` with the NV-7 sentence; queued, not sent, not dropped; dispatches when the period opens (AC3) · T44-4 = T-SENS-1 for `SEED_SALARY` (AC4) · T44-5 the compensation grant is a distinct ERP role (AC5) · T44-6 Finance approval missing on a salary change ⇒ R-D zero-HTTP and `blocked_approval`, even with manager + HR approved (AC6) · T44-7 two dispatches ⇒ one logical change; read the ERP value and assert exactly one effective-dated row (AC7) · T44-8 422 ⇒ non-retriable, **approval not consumed**, fresh chain required (AC8) · T44-9 timeout ⇒ `Sent to the ERP, awaiting confirmation`; `Applied` never before `confirmed` (AC9) · T44-10 403 ⇒ non-retriable, exception, scope-grant note (AC10) · **Plus V14:** `old_value` originates from a live INT-01 read taken at approval time and is stored hashed+masked, never as a figure — assert via T-SENS-1. **AC1–AC10 + V14.**
### NV-45 (9) T45-1 phase 1: the case captures last working day and reason, tracks revocation tasks, presents the manual confirmation task; **no Submit-to-ERP element exists in the DOM**; the case cannot close until the task is complete and its completer recorded (AC1) · T45-2 read-back comparison; a mismatch blocks closure with `The ERP shows <status>/<end date>, the case records <status>/<end date>.` (AC2) · T45-3 phase 2: the policy row exists; dispatch requires approval and passes the cut-off gate (AC3) · **T45-4** attempt to save an `object_map` for `employee_profile.terminate` bound to `http_method = delete`; **re-read** ⇒ refused with `Offboarding must be a status change, not a hard delete (TRD §5).` *(This test is only possible because `delete` exists as a choice — architecture V4.)* (AC4) · T45-5 the key is retained after termination and never reassigned (AC5) · T45-6 two dispatches ⇒ one termination; re-terminating an already-terminated record confirms via existence check (AC6) · T45-7 `Terminated in the ERP` never shown for a non-confirmed write; the IT/asset tasks progress **independently** of the write state (AC7) · T45-8 422/403 ⇒ exception with the ERP's message, case open, manual task re-raised (AC8) · T45-9 D7 orderable only after confirmed termination, phase 1 or 2 (AC9). **AC1–AC9.**

## Epic J — Benefits & Time

### NV-46 (7) T46-1 the widget renders type, option, amount with currency, effective date (AC1) · T46-2 `0` contribution only under success-with-zero; failed/unmapped ⇒ the respective sentence (AC2) · T46-3 options come from ERP reference data; grep for a hard-coded or free-text option list ⇒ zero; no reference data ⇒ item not orderable and states why (AC3) · T46-4 **no default policy row for R9**, and one is addable (AC4) · T46-5 locked period ⇒ `blocked_cutoff` with the NV-7 message (AC5) · T46-6 retry/timeout/422/403 per NV-3/NV-4/NV-12; `Enrolled` never before `confirmed` (AC6) · T46-7 D10 consumes this read; no second path (AC7). **AC1–AC7.**
### NV-47 (8) T47-1 picker from `cost_centre_project_ref`, cached with its age shown, filtered to `active=true` (AC1) · T47-2 no reference data and no cache ⇒ **the form is not rendered**; `Cost centres unavailable — the ERP did not answer.`; grep for a free-text cost-centre input ⇒ zero (AC2) · T47-3 one `erp_write` per row with its own key (AC3) · T47-4 two dispatches ⇒ one entry per row; read the ERP-side hours total and assert it is **not doubled** (AC4) · T47-5 inactive centre from a stale cache ⇒ the ERP's 422 renders against the row, the cache is invalidated, the picker refreshes (AC5) · T47-6 timeout/403 per NV-3/NV-12; `Submitted` never before `confirmed` (AC6) · T47-7 zero hours submittable only where the ERP accepts it; otherwise refused with the ERP's stated rule, **never silently dropped** (AC7) · T47-8 the story is `BLOCKED` until NV-52's `native_timesheet_in_use` is answered (AC8). **AC1–AC8.**

## Epic K — Non-functional, governance, certification

### NV-48 (6) T48-1 = **T-SENS-2**, run as a build step that **fails the build** on a hit (AC1) · T48-2 = **T-SENS-1**, run in CI (AC2) · T48-3 `hr`/`payroll` absent from `CATEGORY_CHOICES`; adding one requires a logged decision (AC3) · T48-4 every table this backlog creates declares a retention setting; unset renders `Retention not set` in the governance report and **does not default** (AC4) · T48-5 the processing-location record exists and names which flows carry personal data (AC5) · T48-6 personal data on a rejected or abandoned request is subject to the same retention as a dispatched one; assert no untracked residue by querying for orphaned rows (AC6). **AC1–AC6.**
### NV-49 (8) **T49-1 (restated per architecture V12):** query Global `sys_metadata` for records attributable to this app's **source**. *Exp:* zero — **and** the four platform-created Global records that D16 documents are enumerated in the evidence pack with their explanation. The BA's literal AC ("zero rows") fails on a correct build and is superseded (AC1) · T49-2 no credential, token or secret in any app record; credentials resolve through aliases only (AC2) · T49-3 = **T-ACL-1** (AC3) · T49-4 = **T-ACL-2**; a suite asserting only on HTTP status fails this AC (AC4) · T49-5 = **T-TRAP-1 + T-TRAP-3** (AC5) · T49-6 the evidence pack is produced against a `sandbox` system only and contains the ACL matrix, the outbound endpoint inventory with data classes, per-category error behaviour, and the T-SENS results (AC6) · T49-7 uninstall behaviour documented **and tested**: removing a `Table()` leaves the table and drops the ACL and columns; the pack states this rather than claiming a clean uninstall (AC7) · T49-8 = **T-TRAP-2** (AC8). **AC1–AC8.**
### NV-50 (5) T50-1 every employee-facing action writes a telemetry row with the six fields; grep the table for `SEED_SALARY`/`SEED_IBAN` ⇒ zero (AC1) · T50-2 the dashboard reports by area and outcome; an unused area renders `No usage recorded`, **never `0 requests`** (AC2) · T50-3 failure outcomes report alongside success, so broken and unwanted are distinguishable (AC3) · T50-4 the re-keying baseline is **entered**, not computed; assert no code path derives it (AC4) · T50-5 force a telemetry write failure ⇒ the user action still completes, the failure is logged, nothing surfaces to the employee (AC5). **AC1–AC5.**
### NV-51 (5) T51-1 `country` on `object_map` and `field_map`; resolution by (system, object, country) with fallback to the country-agnostic row (AC1) · T51-2 configure two countries with different mandatory sets; both resolve correctly (AC2) · T51-3 all five tables carry `country` and resolve through **the same function** — grep for a second resolution implementation ⇒ zero; three different fallback rules fail this test (AC3) · T51-4 country resolves from the **ERP record**, not the ServiceNow user's location; a mismatch raises an exception rather than preferring one (AC4) · T51-5 no country config and no agnostic fallback ⇒ item not orderable, `Not configured for <country>`; silently using another country's configuration fails (AC5). **AC1–AC5.**
### NV-52 (5) T52-1 a record exists per (deployment, R1–R10) with a non-blank authority; `None identified` is valid and visible, a blank is not (AC1) · T52-2 an area whose authority is another system is marked out of scope and its items are **not published** (AC2) · T52-3 R10 records `native_timesheet_in_use`; NV-47 is blocked until it is answered (AC3) · T52-4 more than one authoritative system ⇒ `Multi-system landscape — out of the current scope boundary (BRD §4.2).` and a scoping decision, **not a build** (AC4) · T52-5 incomplete discovery ⇒ **no** Epic C–J item published; the HR Document Center category is empty rather than partially correct (AC5). **AC1–AC5.**

### NV-53 — the employee surface (new story, architecture V1)
- **T53-1** grep every authored file for `sn_hr_core`, `sn_hr_sp`, `employee_center` ⇒ **zero hits**. Validates OD40.
- **T53-2** the `emp` Scripted REST service exists with `authentication: true` on **every** route; an anonymous call returns 401 (produced by the flag, not by an ACL list).
- **T53-3** every employee tile renders through `state-renderer.ts`; grep the new React components for `switch (tile.st)` / `if (tile.st ===` ⇒ zero.
- **T53-4** the HRSD swap is a data change: set `erp_write.source_table = 'sn_hr_core_case'` on a fixture row and assert the dispatcher, the approval gate and the audit read all resolve without any code change.
- **T53-5** base Service Catalog presence is **confirmed by query**, not inferred, before any catalog item is authored (OQ-19).

---

# §3 — AC coverage index

Every acceptance criterion in `docs/noviq/stories.md` maps to at least one test above.

| Story | ACs | Tests | Story | ACs | Tests |
|---|---|---|---|---|---|
| NV-1 | 7 | T1-1…6 | NV-27 | 6 | T27-1…6 |
| NV-2 | 6 | T2-1…6 | NV-28 | 6 | T28-1…6 |
| NV-3 | 8 | T3-0…7 | NV-29 | 9 | T29-1…9 |
| NV-4 | 6 | T4-1…6 | NV-30 | 6 | T30-1…6 |
| NV-5 | 8 | T5-1…8 | NV-31 | 6 | T31-1…6 |
| NV-6 | 6 | T6-1…6 | NV-32 | 8 | T32-1…8 |
| NV-7 | 7 | T7-1…7 | NV-33 | 11 | T33-1…11 |
| NV-8 | 6 | T8-1…6 | NV-34 | 8 | T34-1…8 |
| NV-9 | 7 | T9-1…7 (+T9-8) | NV-35 | 5 | T35-1…5 |
| NV-10 | 6 | T10-1…6 | NV-36 | 9 | T36-1…9 |
| NV-11 | 6 | T11-1…6 | NV-37 | 9 | T37-1…9 |
| NV-12 | 7 | T12-1…7 | NV-38 | 6 | T38-1…6 |
| NV-13 | 6 | T13-1…6 | NV-39 | 7 | T39-1…7 |
| NV-14 | 6 | T14-1…6 | NV-40 | 8 | T40-1…8 |
| NV-15 | 5 | T15-1…5 | NV-41 | 7 | T41-1…7 |
| NV-16 | 6 | T16-1…6 | NV-42 | 8 | T42-1…8 |
| NV-17 | 6 | T17-1…6 | NV-43 | 5 | T43-1…5 |
| NV-18 | 6 | T18-1…6 | NV-44 | 10 | T44-1…10 |
| NV-19 | 7 | T19-1…7 | NV-45 | 9 | T45-1…9 |
| NV-20 | 6 | T20-1…6 | NV-46 | 7 | T46-1…7 |
| NV-21 | 7 | T21-1…7 | NV-47 | 8 | T47-1…8 |
| NV-22 | 6 | T22-1…6 | NV-48 | 6 | T48-1…6 |
| NV-23 | 8 | T23-1…8 | NV-49 | 8 | T49-1…8 |
| NV-24 | 8 | T24-1…8 | NV-50 | 5 | T50-1…5 |
| NV-25 | 8 | T25-1…8 | NV-51 | 5 | T51-1…5 |
| NV-26 | 7 | T26-1…7 | NV-52 | 5 | T52-1…5 |
| | | | NV-53 | new | T53-1…5 |

**Total: 355 acceptance criteria across 52 stories, plus NV-53. All mapped.**

## Negative-path coverage the stories mandate — where each lives

| Mandated negative path | Tests |
|---|---|
| **Retry idempotency** (a retry never duplicates) | T4-4, T4-6, T23-4, T29-4, T32-4, T33-9, T34-5, T37-2, T37-6, T44-7, T45-6, T47-4 |
| **Timeout** | T3-5, T5-8, T25-6, T29-7, T32-7, T33-11, T37-6, T44-9, T45-7, T46-6, T47-6 |
| **Permission denied (403)** | T2-5, T23-6, T29-6, T32-6, T34-8, T44-10, T45-8, T46-6, T47-6 |
| **Validation failure (422)** | T12-2, T23-5, T29-5, T32-5, T33-10, T34-7, T44-8, T45-8, T47-5 |
| **The ERP not answering** | T1-4, T5-8, T13-3, T24-4, T25-6, T26-6, T27-3, T28-3, T30-6, T31-4, T35-3, T36-7, T40-6, T42-7, T46-2, T47-2 |
| **ACL re-read pattern (trap 4)** | T-ACL-2 and every test citing it: T8-4, T9-4, T10-4, T22-2, T33-1, T36-6, T40-2, T42-1, T45-4, T49-4 |
| **Zero outbound HTTP proof (R-D)** | T2-2, T3-2, T7-3, T9-3, T33-2, T44-6 |
| **A `0` that must not be rendered** | T-ZERO-1 and T6-4, T14-2, T18-4, T19-5, T26-4, T27-3, T35-2, T38-3, T41-5, T46-2, T50-2 |
| **A control that cannot commit its decision** | T3-6, T9-7, T11-2, T22-5, T23-7, T24-6, T28-3, T30-5, T31-4, T40-8, T45-1, T47-2 |

---

# §4 — Tests for the architecture's own findings (V1–V15)

Each verification-gate finding gets a test, because a finding without one is an opinion.

| Finding | Test |
|---|---|
| V1 surface | T53-1 … T53-5 |
| V2 no PDF API | Re-run the OD2 probe as a precondition of every Epic H test; a generated document claiming PDF while `PDFGenerationAPI` is absent is a **FAIL**, not a BLOCK |
| V3 `emp_xref` reuse | T10-1 asserts **two** unique indexes on the **existing** table; a test that finds a new `employee_link` table **fails** |
| V4 HTTP verbs | T45-4 (only expressible because `delete` exists) |
| V5 connector write | Grep `src/server/write/` for `RESTMessageV2` ⇒ **zero**; every write appears in `call_log` with an attempt count |
| V6 error payload | T12 addendum — 200-with-error-body |
| V7 employee role | T-ACL-3 |
| V8 integration identity | T8-2 plus: `integration_identity_source_note` empty ⇒ control tower renders `Integration identity not evidenced` and the TRD §5 row is `Not confirmed` |
| V9 `salary_history` | T21 addendum |
| V10 contribution history | T21 addendum + T41-6 |
| V11 absence reason codes | T19 addendum |
| V12 Global metadata | T49-1 (restated) |
| V13 binary at-rest | T5-3 / T25-2 (restated per OD43) |
| V14 `old_value` | T44 addendum |
| V15 gate survives trap 5 | **T9-8** |

---

# §5 — What cannot be tested, and why

Stated so a green run is not mistaken for coverage it does not have.

| Not testable | Reason | Consequence |
|---|---|---|
| Anything requiring the live instance | `now-sdk auth --list` → `No credentials found`; the credential store is empty and re-adding it needs a real terminal | **Every test in this plan is currently unrun.** A clean build proves nothing (D19) |
| A real ERP write | No ERP endpoint accepts writes from this instance | Phase 5 gate needs either a vendor sandbox (NV-15) or a fixture host; `postman-echo.com` is the approved fallback (D12) |
| A real PDF from a generated document | No callable PDF API (OD2) | Every "assert `%PDF-`" on a **generated** document is `BLOCKED` until a human installs the Store app (OQ-20) |
| MID Server routing | `ecc_agent` has zero rows | Reviewed structurally, recorded **REVIEWED**, never **PASS** (OD14 precedent) |
| Browser rendering assertions | No browser session available | Every "not in the DOM" test needs a human or a headless run; asserting on the server payload is necessary and **not sufficient** |
| Whether `getBody()` is binary-safe | Never probed (OQ-21) | OD43's spool is built defensively; if the probe later says it is safe, the spool can be deleted |
| Cegid / PHC behaviour | Zero research exists (C4, OQ-27) | Their `vendor_onboarding` rows are `Not confirmed` by design; no test asserts anything about them |
