---
title: Noviq ERP-agnostic Employee Services — rm_story backlog
app: x_335329_sn_hr_erp (engine reuse) · target surface Employee Center Pro / HRSD
author: BA agent
generated: 2026-08-23
status: draft for architect
sources:
  - "202608 Noviq_BRD_ServiceNow-EmployeeServices-ERPAgnostic_v1.md" (R1-R10, D1-D10, §7 NFR, §8-§11)
  - "202608 Noviq_TRD_ERP-Integration-Technical-Requirements_v1.md" (§2 principles, §3 entities, INT-01-INT-23, §5-§8)
baseline: docs/noviq-brd-trd-alignment.md — the completed gap analysis. Not re-derived here.
---

# How to read this backlog

Story IDs are **`NV-n`**. They do not collide with the existing 38-story `L0-*` … `L6-*` backlog in
`docs/stories.md`; that backlog stays authoritative for the app as built, this one is the Noviq
product increment on top of it.

**Naming collision warning, read once.** The BRD numbers its HR Document Center catalog items
`D1`–`D10`. This repo numbers its logged decisions `D1`–`D19`. Throughout this file:

- `D1` … `D10` **unqualified** = the BRD catalog documents (§6.1a).
- `DL-D2`, `DL-D3`, … = `docs/decision-log.md` decisions.

Two decision-log entries are load-bearing against this BRD and are flagged in every story they
touch:

- **`DL-D2`** — payroll and employee master data are fetched **live at generation time and never
  staged**. This *agrees* with BRD O3 and R1 ("never stored at rest in ServiceNow") and is not in
  conflict. It does constrain caching.
- **`DL-D3`** — ERP write-back is deferred; `erp_system.read_only` makes the refusal structural. This
  **directly contradicts** R2, R3, R4, R5-step-5, R6, R7, R8, R9, R10 and INT-03/04/05/06/07/12/15/18/21/23.
  Every write story below carries the conflict banner. **NV-3 is the story that reverses it** and is
  a hard dependency of every write in this backlog.

**The four-state contract carries forward unchanged.** Every read story inherits §0 of
`docs/stories.md` — `live` · `not configured` · `failed` · `stale` (+ `partial`, `restricted`) — and
the rule that **an absence is never rendered as `0`**. `v: 0` occurs only with `st: "live"` and only
when a successful call returned an empty set. ACs below name the state, not the mechanism.

**Priority** follows BRD §4.3 / §6.2 literally: the first release is **frozen to R1, R2, R3**.
Priority values map as `High` = P0 or a P0 enabler, `Medium` = P1, `Low` = P2. Foundation stories
that a P0 cannot ship without are `High` even where the TRD calls them cross-cutting.

**Story points** are Fibonacci and assume the existing L1 control tower (`erp_system` /
`object_map` / `field_map` / `map_tmpl`) and L2 connector (retry, backoff, circuit breaker,
`Retry-After`, `call_log`) are reused rather than rebuilt — per `docs/noviq-brd-trd-alignment.md` §7.

**Second brain: consulted 2026-08-23, after the fact.** The BA and architect passes both ran with
`sn-rag` unreachable and recorded that honestly. The server was restored at
`192.168.1.90:8079` and the prior-art pass was then run against it (51,605 files / 506,089 chunks,
drift 0). **Nine stories changed as a result** — NV-1, NV-5, NV-6, NV-11, NV-15, NV-16, NV-25,
NV-36 and NV-52 — each marked below with a `**Vault (2026-08-23):**` line carrying its citation.
The full pass, including the stories that needed no change, is in `docs/noviq/story-validation.md`.

The decisive source is `Unit4_ERP_Integration_Compendium_ServiceNow.md` — a
**working, in-production ServiceNow ↔ Unit4 integration**, TLP Green internal material. It is the
only implementation-grade evidence behind any story in this backlog, and it settles three things
the two Noviq documents leave open: which side renders the PDF, what the real platform limits are,
and whether ERP-side document archival has ever actually been built. It had been mined once before
for OD38; sections 8, 11–13 had not.

---
# Epic A — Integration Foundation

Everything in this epic is an enabler. Nothing in Epics C–J can ship without it. TRD §2 says its
principles are **pass/fail criteria**; each one below is a story so that a fail is visible as an
unclosed story rather than as a silent assumption.

---

## Story NV-1: Token-based authentication, with the Basic-auth exception path made explicit

**As a** ServiceNow Platform Owner
**I want** every `erp_system` to authenticate with a token-based, credential-scoped mechanism, and any Basic-auth deployment to be an explicit, recorded exception
**So that** the integration meets TRD §2 Authentication without pretending a known working Basic-auth deployment does not exist

### Acceptance Criteria
- [ ] `erp_system.auth_type` accepts `oauth2_client_credentials`, `oauth2_jwt`, `mutual_tls` and `basic`. Saving a row with `auth_type=basic` **and** `environment=production` is rejected by a business rule unless `auth_exception_ref` is non-empty; the rejection message is exactly `Basic authentication is not permitted in production without a recorded exception (TRD §2). Populate Auth exception reference.`
- [ ] `auth_exception_ref` is a String(200) that must contain a non-empty value; a save with whitespace only is rejected with the same message.
- [ ] A row with `auth_type=oauth2_client_credentials` and an empty auth-profile reference is rejected at save with `OAuth 2.0 selected but no Connection & Credential Alias is set.`
- [ ] No client secret, token, password or certificate private key appears in any record this app creates. Grep of the deployed update set for `client_secret`, `password`, `BEGIN PRIVATE KEY` returns zero hits in app-owned XML.
- [ ] **Negative — token acquisition fails.** With deliberately wrong credentials, the read call returns state `failed`, `call_log` records `status=failed` with the HTTP status from the token endpoint, and the widget renders `ERP did not answer` — never `0`, never a blank tile.
- [ ] **Negative — token expiry mid-session.** A 401 on a data call triggers exactly one token refresh and one retry; a second 401 is classified **non-retriable** and does not enter the retry loop. `call_log` shows two attempts, not `max_retries`.
- [ ] **Conflict, must be recorded not resolved silently.** The story's `notes` field carries: *"Conflicts with the only implementation-grade Unit4 evidence in this repo (OD38, `docs/unit4-integration.md` §2) — a working ServiceNow ↔ Unit4 integration authenticating via a ServiceNow Basic credential. TRD §2 forbids Basic in production. Escalate to the document owner: either TRD §2 gains a documented exception path (this story implements one) or that deployment is declared non-compliant."*
- [ ] **Vault (2026-08-23): the conflict is smaller than the banner claims, and the exception path is the right answer.** `Unit4_ERP_Integration_Compendium_ServiceNow.md` §13 lists that deployment's own security backlog, and *"Employee REST uses Password (2-Way)"* appears on it as an **open finding** with the action *"Validate credential rotation, ACLs and alias/environment separation"* — alongside *"ERPx Tracking OAuth profile missing"* and *"Discovery endpoint has no authentication"*. The compendium is not endorsing Basic auth; it is flagging it. **TRD §2 and the observed deployment agree that Basic is a weakness** — they disagree only on whether it blocks production today. `auth_exception_ref` must therefore carry a remediation target date, not merely a reference: an exception with no expiry is how a flagged finding becomes permanent. A save with `auth_exception_ref` populated and `auth_exception_expires` empty is rejected.

### ServiceNow Implementation Notes
- Module: Integration Hub / platform auth (no HRSD dependency)
- Table(s): `x_..._erp_system`, `sys_auth_profile`, `connection_alias`
- Components: Business Rule (before insert/update) on `erp_system`; Connection & Credential Alias; `rest-client.ts` auth resolution (already exists)
- Doc reference: TRD §2 Authentication; `docs/noviq-brd-trd-alignment.md` §2 and §6.1; `docs/decision-log.md` OD38

### Story Points: 8
### Priority: High (P0 enabler — no read or write in this backlog is callable without it)
### Dependencies: none

---

## Story NV-2: Least-privilege credential scope declared and asserted per object

**As an** HR/Finance Systems Owner
**I want** each ERP credential to declare the entities and operations it is scoped to, and any call outside that scope to be refused before it leaves ServiceNow
**So that** TRD §2 Authorization scope is enforced by the integration, not merely promised by the ERP admin

### Acceptance Criteria
- [ ] `erp_system` gains a related list `erp_scope_grant` with columns `logical_object`, `operation` (`read` | `create` | `update`), `erp_role_or_scope` (String(200)), `source_note` (String(500), the citation).
- [ ] A connector call for (object, operation) with no matching active `erp_scope_grant` row is refused **client-side** before the HTTP request is issued. `call_log` records `status=not_configured` with `error_message` = `No scope grant for <logical_object>.<operation>`. Zero outbound HTTP requests are recorded by the ERP-side log for that attempt.
- [ ] The refusal renders as `not configured` in the UI with the sentence `Not configured — grant <operation> scope for <logical_object>`, never as `0` and never as `failed`.
- [ ] `erp_scope_grant` rows for `banking` and `compensation` fields require `erp_role_or_scope` to be **different** from the general employee-update grant; a save reusing the same value is rejected with `Elevated-sensitivity field requires a distinct ERP role/scope (TRD §5 Field-level permission clarity).`
- [ ] **Negative — ERP returns 403.** A 403 on a granted-but-actually-unauthorised call is classified **non-retriable**, does not retry, and surfaces on the HR exception queue (NV-12) with the literal text `Permission denied — scope grant claims access this credential does not have.`
- [ ] `source_note` is mandatory and non-empty for every seeded grant. A blank citation fails the seed build. (Repo rule: never seed an invented endpoint or field name.)

### ServiceNow Implementation Notes
- Module: platform / integration control tower
- Table(s): `x_..._erp_system`, new `x_..._erp_scope_grant`
- Components: Fluent `Table()`, Business Rule (before insert/update), pre-flight guard in `rest-client.ts`
- Doc reference: TRD §2 Authorization scope; TRD §5 Field-level permission clarity; CLAUDE.md rule 5 (never seed an invented field name)

### Story Points: 8
### Priority: High (P0 enabler)
### Dependencies: NV-1

---

## Story NV-3: A confirmable write path — the story that reverses DL-D3

**As a** ServiceNow Platform Owner
**I want** an outbound write path with a confirmed success/failure status, its own governance gate, and `read_only` still honoured per system
**So that** every write requirement in this BRD (R2, R3, R4, R5-archival, R6–R10) becomes buildable instead of structurally refused

### Acceptance Criteria
- [ ] **Conflict banner, mandatory.** Story `notes` carries: *"Conflicts with DL-D3 — write-back deferred to L7; `erp_system.read_only` makes the refusal structural. This story is the reversal. It must not be started until a new OD is logged in `docs/decision-log.md` recording the reversal and its rejected alternative. Building the write path without that OD is a governance failure, not a scheduling shortcut."*
- [ ] A new table `erp_write` records one row per attempted write with: `erp_system`, `logical_object`, `operation`, `external_id`, `idempotency_key`, `source_case` (reference to the originating case/RITM), `approval_ref`, `request_hash`, `state` (`queued` | `sent` | `confirmed` | `failed` | `blocked_readonly` | `blocked_cutoff` | `blocked_approval`), `erp_ack_ref`, `attempts`, `first_sent_at`, `confirmed_at`.
- [ ] A write against an `erp_system` with `read_only=true` is refused before dispatch; `erp_write.state=blocked_readonly` and `error_message` = `System is marked read-only; write refused.` No HTTP request is issued. **(Defect fixed 2026-08-23: this AC previously set `state=blocked`, a value absent from the state list above. A state a column cannot hold is a test that cannot be written — the three blocked reasons must stay distinguishable, since read-only is a configuration choice, cut-off is a timing outcome and approval is a governance outcome, and collapsing them loses the reason a write did not happen.)**
- [ ] A write that receives HTTP 2xx **without** a confirmable identifier or status in the response body sets `state=failed`, not `confirmed`, with `error_message` = `Write returned no confirmable status (TRD §2 Write pattern).` A 2xx is never by itself treated as success.
- [ ] An asynchronous write sets `state=sent` and a follow-up poll moves it to `confirmed` or `failed`. A row in `sent` beyond `confirm_timeout_ms` transitions to `failed`, not to `confirmed`.
- [ ] **Negative — timeout.** A write that times out with no response stays `sent`, is retried per the existing retriable classification, and **never** issues a second create without the idempotency key from NV-4.
- [ ] **Negative — no UI control before commit is possible.** No Submit/Approve/Send button is rendered for any write whose `erp_scope_grant`, `object_map` or approval record is absent. Rendering a disabled button with a tooltip also fails this AC — the control is absent, and the surface states the reason. (Repo rule 1: never draw a button that cannot commit its decision.)
- [ ] Every `erp_write` row has a non-empty `source_case`. A write with no originating case is rejected at insert with `Write has no originating ServiceNow case — refused (BRD §7 Auditability).`

### ServiceNow Implementation Notes
- Module: platform integration; consumed by HRSD/Catalog flows
- Table(s): new `x_..._erp_write`; `x_..._erp_system` (`read_only`, `confirm_timeout_ms`)
- Components: Fluent `Table()`, Script Include write dispatcher, Flow Designer action, `ScheduledScript` confirmation poller (ships `on_demand` + `active: false` per L3-D8)
- Doc reference: TRD §2 Write pattern; `docs/decision-log.md` DL-D3; `docs/noviq-brd-trd-alignment.md` §7 item 2

### Story Points: 13
### Priority: High (P0 enabler — R2 and R3 are both writes)
### Dependencies: NV-1, NV-2

---

## Story NV-4: Idempotent writes — deterministic key and existence check

**As an** HR Shared Services agent
**I want** a retried write to be provably safe
**So that** a retry never produces a duplicate employee record, a duplicate leave request, or a second archived copy of the same certificate

### Acceptance Criteria
- [ ] `erp_write.idempotency_key` is computed deterministically from `(logical_object, operation, external_id, source_case_sys_id, document_type_or_period)` and is stable across retries of the same logical write. Re-running the same request produces a byte-identical key.
- [ ] A unique index on `(erp_system, idempotency_key)` exists. A second insert with the same pair is rejected at the database, not by script.
- [ ] Where the ERP supports a client-supplied idempotency header, `idempotency_key` is sent in it and `erp_scope_grant.source_note` cites the vendor doc that confirms the header name. Where it does not, an **existence check** call precedes the create, and the create is skipped when the check returns a match.
- [ ] **Negative — retry after ambiguous timeout.** A create that timed out with no response, when retried, performs the existence check first. If the record exists, `erp_write.state=confirmed` with `erp_ack_ref` set from the check result and **no second create is issued**. Test asserts exactly one record ERP-side after two dispatch attempts.
- [ ] **Negative — vendor supports neither header nor existence check.** The object map is refused at save with `No idempotency mechanism configured for <logical_object>.create — configure an idempotency header or an existence-check endpoint (TRD §2 Idempotency).` The capability is recorded as a **gap against that vendor**, not worked around.
- [ ] D1–D10 archival (NV-37) and employee create (NV-23) are both covered by this mechanism; a test proves each independently.

### ServiceNow Implementation Notes
- Module: platform integration
- Table(s): `x_..._erp_write`, `x_..._object_map` (new `idempotency_mode`, `existence_check_path` — both blank by default)
- Components: Script Include key generator; unique index; pre-create existence probe in the write dispatcher
- Doc reference: TRD §2 Idempotency; BRD §7 Idempotent writes; INT-03, INT-18

### Story Points: 8
### Priority: High (P0 enabler)
### Dependencies: NV-3

---

## Story NV-5: Binary payload transport — retrieve a PDF and upload a PDF

**As an** employee
**I want** the integration to move actual PDF bytes in both directions
**So that** R1 payslip retrieval, D3 payslip reissue and R5 archival are possible at all

### Acceptance Criteria
- [ ] **Conflict/gap banner.** Story `notes` carries: *"The existing connector is JSON-only. `docs/noviq-brd-trd-alignment.md` §6.2 identifies this as the build gap sitting underneath R1, R5, D3 and INT-18. It is a build gap, not a vendor gap."*
- [ ] The connector can issue a request with `Accept: application/pdf` and return the response body as a base64 string plus `content_type` and `content_length`, without passing it through the JSON field mapper.
- [ ] A retrieved PDF is **streamed to the requesting user and never written to `sys_attachment`, `erp_staging`, or any app table.** A test asserts `sys_attachment` row count is unchanged before and after a payslip download, and that no app table contains the byte string. (BRD R1: "never stored at rest in ServiceNow"; consistent with DL-D2.)
- [ ] A response whose `Content-Type` is not in the allowed MIME list is rejected before delivery; the user sees `Document could not be retrieved — the ERP returned an unexpected format (<received content-type>)`, and the bytes are discarded. **HTML is never labelled or delivered as PDF.** (Repo rule 2.)
- [ ] A response whose first 5 bytes are not `%PDF-` is rejected with the same treatment, even when `Content-Type` claims `application/pdf`.
- [ ] Upload direction: a multipart or binary-body POST carries the PDF plus a document-type/category value, and the response's identifier is written to `erp_write.erp_ack_ref`.
- [ ] **Vault (2026-08-23): every documented working path is attachment-mediated, not streamed.** `Unit4_ERP_Integration_Compendium_ServiceNow.md` §8 names the four real components of a shipped implementation: *"Unit4 ERP Document Integration — sends a generated attachment/document to Unit4 ERP using Connection Alias and attachment data"*, *"Unit4 Send Document to ERP — low-level REST action for sending a PDF attachment"*, *"Generate document template - HTML — converts generated HTML into a PDF attachment"*, and *"Move Attachment from HR Case to HR Task"*. Every one of them operates on a `sys_attachment` record. This **confirms** the architect's V13/OD43 finding from the other direction: `saveResponseBodyAsAttachment()` is not merely the only supported API, it is what the only working deployment actually does. Design the spool-and-shred explicitly; do not design a stream and discover this at build time.
- [ ] **Negative — oversize.** A retrieval or upload exceeding the configured limit (NV-11) is refused before transfer with `Document exceeds the ERP's stated size limit of <n> MB` and does not partially transfer.
- [ ] **Negative — ERP does not answer.** The widget shows `ERP did not answer`; it does not show an empty document list, a zero-byte download, or a `0`.

### ServiceNow Implementation Notes
- Module: platform integration
- Table(s): `x_..._call_log` (records content type and length, never the bytes)
- Components: `RESTMessageV2` / `sn_ws.RESTResponseV2.getBody()` binary handling; new `binary-client.ts` beside `rest-client.ts` (relative import **must** carry the `.ts` extension — trap 1)
- Doc reference: TRD §2 Data format; INT-09, INT-18; BRD R1, R5; `docs/noviq-brd-trd-alignment.md` §6.2

### Story Points: 13
### Priority: High (P0 enabler for R1)
### Dependencies: NV-1, NV-2

---

## Story NV-6: API version and deprecation policy modelled as data

**As a** ServiceNow Platform Owner
**I want** each ERP connection to record its API version and the vendor's stated deprecation notice period
**So that** a breaking vendor change is a tracked risk rather than an outage discovered by an employee

### Acceptance Criteria
- [ ] **Gap banner.** Story `notes` carries: *"TRD §2 requires a versioned API with a stated deprecation policy but the TRD never asks for an API-versioning column, and the app has none — version currently lives inside `endpoint_path` free text (`docs/noviq-brd-trd-alignment.md` §2, verdict: Gap). This story closes it."*
- [ ] `erp_system` gains `api_version` (String(40)), `version_source_note` (String(500)), `deprecation_notice_days` (Integer, **no default**), `deprecation_policy_url` (URL).
- [ ] Saving an `erp_system` with `api_version` empty is allowed but the connection renders in the control tower with the badge `API version not recorded` — it is never silently blank.
- [ ] `deprecation_notice_days` left empty renders as `Deprecation policy not stated by vendor`, **never as `0`**. A `0` in this field means the vendor stated zero notice, which is itself a recorded finding.
- [ ] An `endpoint_path` containing a version-looking token (`/v[0-9]`, `/data/v[0-9.]+/`) while `api_version` is empty raises a warning on save: `Endpoint path appears to carry a version but API version is not recorded.` The save succeeds; the warning is recorded.
- [ ] **Negative — vendor returns a deprecation header.** A response carrying `Sunset` or `Deprecation` headers writes them to `call_log` and raises an exception-queue entry (NV-12) with `ERP announced deprecation of <api_version>, sunset <date>`.
- [ ] **Vault (2026-08-23): Unit4's figure is citable, so its row ships populated rather than blank.** `Unit4_ERP_Integration_Compendium_ServiceNow.md` §11 states the API lifecycle rule verbatim: *"Use the most recent API version; supported previous versions retain backward compatibility until end of life; EOL announcement at least 18 months in advance."* Seed `deprecation_notice_days = 540` for `unit4` with that sentence as `version_source_note`. Every other vendor stays empty. This is the first vendor row in the backlog that can be populated without guessing — rule 5 permits it precisely because the citation exists.

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._erp_system`
- Components: Fluent `Table()` columns, Business Rule warning, response-header capture in `rest-client.ts`
- Doc reference: TRD §2 Versioning; `docs/noviq-brd-trd-alignment.md` §2 (Gap row)

### Story Points: 3
### Priority: High (P0 enabler — cheap, and the risk it covers is silent)
### Dependencies: NV-1

---

## Story NV-7: Payroll cut-off calendar and the queue-for-next-cycle behaviour

**As a** Payroll team member
**I want** any write affecting payroll submitted after cut-off to queue for the next cycle and say so on screen
**So that** an approved change never lands mid-cycle and never silently applies to the wrong period

### Acceptance Criteria
- [ ] **Gap banner.** Story `notes` carries: *"The BRD requires payroll cut-off awareness (§7) and the TRD requires the calendar be exposed or discoverable (§5), but neither document states where the cut-off data comes from — an ERP endpoint, a ServiceNow-maintained calendar, or a per-country rule. This story implements a ServiceNow-maintained calendar with an optional ERP refresh, and flags the source question as Open Question OQ-2."*
- [ ] New table `payroll_calendar` with `erp_system`, `country`, `pay_period_label`, `period_start`, `period_end`, `cutoff_datetime`, `pay_date`, `source` (`erp` | `manual`), `source_note`.
- [ ] A payroll-affecting write (R3 leave, R6 compensation, R8 termination, R9 benefits) dispatched after `cutoff_datetime` for the period containing its effective date sets `erp_write.state=blocked_cutoff` and `effective_cycle` = the next period's label. No HTTP request is issued.
- [ ] The requester sees the exact string `Submitted after the <pay_period_label> cut-off (<cutoff_datetime>). This change will apply in <next_period_label>, pay date <pay_date>.` on the case/RITM.
- [ ] A blocked-for-cut-off write is dispatched automatically when the next period opens; `erp_write.attempts` increments and `state` moves to `sent`, with the idempotency key from NV-4 unchanged.
- [ ] **Negative — no calendar row.** A payroll-affecting write with no matching `payroll_calendar` row for its country and effective date is **refused**, not allowed through. `erp_write.state=blocked_cutoff`, message `No payroll calendar configured for <country> covering <effective_date> — write refused.` Allowing it through on the assumption that no calendar means no cut-off fails this AC.
- [ ] The employee-facing surface never renders a cut-off state as a numeric `0` days or a blank date.

### ServiceNow Implementation Notes
- Module: platform; consumed by every payroll-affecting flow
- Table(s): new `x_..._payroll_calendar`; `x_..._erp_write` (`effective_cycle`)
- Components: Fluent `Table()`, Script Include cut-off resolver, `ScheduledScript` release job (`on_demand` + `active: false`)
- Doc reference: BRD §7 Payroll cut-off awareness; TRD §5; BRD R6 note; BRD §11 Q2

### Story Points: 8
### Priority: High (P0 enabler — R3 is payroll-affecting)
### Dependencies: NV-3

---

## Story NV-8: Every ERP write traceable to case, approver and timestamp, on both sides

**As a** Compliance officer / auditor
**I want** each ERP write attributable to the originating ServiceNow case, its approver and a timestamp, and distinguishable in the ERP's own audit log from a manual UI change
**So that** a payroll or compliance audit can trace any change end to end

### Acceptance Criteria
- [ ] Every `erp_write` row carries non-empty `source_case`, `approval_ref` (where the operation is approval-gated), `requested_by`, `approved_by`, `sent_at`, `confirmed_at`.
- [ ] The outbound request carries the ServiceNow case number in a vendor-agreed field or header, and `erp_scope_grant.source_note` cites the vendor doc confirming that field exists. Where no such field exists, the story records a **vendor gap** — it does not invent one.
- [ ] An audit read of `erp_write` for a given case returns the full chain without exposing any payload value classified sensitive: salary figures, IBAN, and bank account numbers are **absent** from `erp_write` and from `call_log`. A test greps both tables for a seeded IBAN and asserts zero hits. (Extends the existing `doc_audit` rule: store `call_log` sys_ids, not the salary.)
- [ ] `erp_write` is deny-write to every role except the integration user via a Shape A ACL with `adminOverrides` set **explicitly** (trap 3). A test writes the field as full admin, **re-reads the value**, and asserts it is unchanged — asserting on HTTP status alone fails this AC (trap 4).
- [ ] **Negative — write with no approver on a gated operation.** Insert is rejected; `erp_write` row is not created; the flow surfaces `Approval record missing — write refused.`
- [ ] Retention: `erp_write` rows are retained for the period set in `sys_property` `erp_write.retention_days`, which ships with **no default value** and renders as `Retention not set` until an admin sets it. Flagged as Open Question OQ-7 — neither document states a retention period.

### ServiceNow Implementation Notes
- Module: platform
- Table(s): `x_..._erp_write`, `x_..._call_log`, `x_..._doc_audit`
- Components: ACL (Shape A deny-write, `adminOverrides: false` explicit), Business Rule validation, `sys_property`
- Doc reference: BRD §7 Auditability; TRD §5 Audit trail; CLAUDE.md traps 3 and 4

### Story Points: 8
### Priority: High (P0 enabler)
### Dependencies: NV-3, NV-9

---

## Story NV-9: The approval gate — a write cannot fire before the approval record exists

**As an** HR Business Partner
**I want** a single enforced gate that every sensitive write passes through
**So that** approval integrity is a property of the platform rather than of each individual flow being written correctly

### Acceptance Criteria
- [ ] A reusable gate resolves, for a given (`logical_object`, `operation`), whether approval is required, from a configuration table `write_approval_policy` — not from code branches per flow.
- [ ] Ship the policy rows the BRD mandates: **R2 banking/IBAN (INT-05), R6 compensation (INT-06), R8 termination (INT-07)**, and the approval-gated documents **D2, D6, D7, D8, D9**. Each row cites its BRD section in `source_note`.
- [ ] The gate refuses dispatch unless a `sysapproval_approver` record exists with `state=approved`, its `sysapproval` resolves to the same `source_case` as the write, and its `sys_updated_on` is **earlier than** `erp_write.first_sent_at`. An approval created after dispatch does not retroactively satisfy the gate.
- [ ] **Negative — approval forged by direct record edit.** Setting `sysapproval_approver.state` to `approved` by a user who is not the assigned approver is denied by ACL; a test performs the update, **re-reads the field**, and asserts the value is still `requested`.
- [ ] **Negative — approval rejected.** `erp_write` is never created; the case closes with `state=closed_incomplete` and reason `Approval rejected`. No HTTP request appears in `call_log`.
- [ ] **Negative — approval times out.** The write stays `blocked_approval` indefinitely and appears on the HR exception queue (NV-12) after the configured age. It never auto-approves.
- [ ] No Submit-to-ERP control is rendered on any gated item until the approval record exists. (Repo rule 1.)

### ServiceNow Implementation Notes
- Module: HRSD / Flow Designer approvals
- Table(s): new `x_..._write_approval_policy`; `sysapproval_approver`; `x_..._erp_write`
- Components: Flow Designer subflow, Script Include gate, ACL on approval state
- Doc reference: BRD §7 Approval integrity; BRD §9 risk 2; BRD R2/R6/R8; BRD §6.1a D2/D6/D7/D8/D9

### Story Points: 8
### Priority: High (P0 enabler — R2 banking is P0)
### Dependencies: NV-3

---

## Story NV-10: A shared, persistent employee identifier across ServiceNow and the ERP

**As a** ServiceNow Platform Owner
**I want** one stable external employee ID persisted against the ServiceNow user record
**So that** every subsequent call addresses the correct employee without re-matching on name or email

### Acceptance Criteria
- [ ] **EXTENDS an existing table — do not create a new one.** `emp_xref` already exists in this app with the required unique index (architect verification finding V3, `docs/noviq/architecture.md` §0). This story adds what it lacks and reuses what it has; specifying a new `x_..._employee_link` fails this AC. The pair (`erp_employee_id`, `erp_system`) is unique and a duplicate insert is rejected at the database, not by script.
- [ ] Every read and write in this backlog resolves its target employee from `erp_employee_id`. A test asserts that **no** connector call in the app builds a query from `sys_user.email` or `sys_user.name`.
- [ ] A user with no `erp_employee_id` sees, on every ERP-backed widget, the exact string `Your record is not yet linked to the ERP — contact HR` and **no figure of any kind**. Not `0`, not a blank tile, not "no data".
- [ ] The ID is established at onboarding (NV-23) or by lookup (NV-22), and is written **once**; a change requires the `hr_admin` role and writes an audit row naming the old and new value.
- [ ] **Negative — ERP returns a different ID for the same user.** The mismatch raises an exception-queue entry `Identity mismatch for <user>: stored <a>, ERP returned <b>` and **blocks every write** for that user until resolved. Reads are also blocked, since a read against the wrong employee is a data-protection incident.
- [ ] **Negative — ID reused after termination.** A terminated employee's `erp_employee_id` is retained and never reassigned; an attempt to assign it to another user is rejected.

### ServiceNow Implementation Notes
- Module: platform / HRSD user profile
- Table(s): existing `x_..._emp_xref` (EXTEND — see V3); `sys_user`
- Components: Fluent `Table()`, unique index, ACL restricting write to `hr_admin`, audit Business Rule
- Doc reference: TRD §2 Identity linkage; BRD §7 Identity; BRD R7 note; BRD §11 Q3

### Story Points: 5
### Priority: High (P0 enabler — every R1/R2/R3 call needs it)
### Dependencies: none

---

## Story NV-11: Attachment size and MIME limits, mirrored from the ERP's stated values

**As an** employee submitting a receipt
**I want** an oversize or wrong-type file rejected in ServiceNow with a clear message
**So that** I do not discover the limit as an opaque ERP error after submitting

### Acceptance Criteria
- [ ] `erp_system` gains `max_attachment_bytes` (Integer), `allowed_mime_types` (String(500), comma-separated), `attachment_limits_source_note` (String(500)). All three ship **empty**, never with a guessed default.
- [ ] With `max_attachment_bytes` empty, the attachment control on any catalog item that uploads to the ERP is **not rendered**, and the item shows `Attachment limits not configured for <system> — attachments unavailable.` A guessed limit fails this AC.
- [ ] A file exceeding `max_attachment_bytes` is rejected client-side with `File is <x> MB; the ERP accepts at most <y> MB.` Nothing is uploaded.
- [ ] A file whose MIME type is outside `allowed_mime_types` is rejected with `<type> is not accepted by the ERP. Accepted: <list>.`
- [ ] Validation is enforced **server-side as well**, so a client bypass is still refused; a test posts an oversize body directly to the REST endpoint and receives 413 with a JSON body (remembering the `{"result": …}` wrapper — trap 2).
- [ ] **Negative — ERP rejects a file that passed local validation.** The mismatch raises an exception-queue entry naming both the configured limit and the ERP's response, so the configuration can be corrected rather than the user blamed.
- [ ] **Vault (2026-08-23): Unit4's limits are citable and must be seeded, with the two-limit trap made explicit.** `Unit4_ERP_Integration_Compendium_ServiceNow.md` §12.2 gives ERP CR/ERP7 `maxRequestLength` file upload = **58,368 KB (≈57 MB)**, and §12.1 gives an **inbound/outbound API size ceiling of 350 MB per minute** across all environments. These are *different* limits and a per-file check satisfies only the first: ten 50 MB uploads each pass `max_attachment_bytes` and together breach the per-minute ceiling. `erp_system` therefore also needs `max_throughput_bytes_per_min`, enforced as a rolling window — a per-file-only check fails this AC.

### ServiceNow Implementation Notes
- Module: Service Catalog / platform
- Table(s): `x_..._erp_system`
- Components: Catalog Client Script, Scripted REST validation, `sys_attachment` size check
- Doc reference: TRD §5 Attachment size/type limits; INT-15, INT-18

### Story Points: 5
### Priority: Medium (P1 — first needed by R4/R5, not by R1–R3 reads)
### Dependencies: NV-5

---

## Story NV-12: Retriable vs non-retriable classification and the HR exception queue

**As an** HR Shared Services agent
**I want** every failed sync to land on an actionable queue with a plain-language reason
**So that** a failure is worked rather than discovered months later

### Acceptance Criteria
- [ ] Reuse the existing `connector/classify.ts` classification (`RETRYABLE_STATUS` = 408/425/429/500/502/503/504, exponential backoff, circuit breaker, `Retry-After` honoured). No second classifier is written.
- [ ] A **non-retriable** failure (400, 401, 403, 404, 409, 422) is not retried and creates an `erp_exception` row immediately. A test asserts `call_log` shows exactly one attempt for a 422.
- [ ] A **retriable** failure exhausting `max_retries` creates an `erp_exception` row; a retriable failure that succeeds on retry creates none.
- [ ] `erp_exception` carries `category` rendered as one of exactly: `Validation failure`, `Permission denied`, `Record not found`, `Conflict / duplicate`, `Rate limited`, `ERP unavailable`, `Timeout`, `Unexpected format`. A generic `Error` value fails this AC.
- [ ] Every `erp_exception` row is assigned to a group and appears in an HR-facing list view with the originating case linked. An exception with no assignment group is rejected at insert.
- [ ] **Negative — nothing fails silently.** A test forces each of the eight categories and asserts an `erp_exception` row exists for each. A category producing no row is a failure.
- [ ] `sync_run.error_message` is **never** surfaced to an employee-facing surface, for any role — the employee sees the four-state string, the agent sees the exception row. (Carried from the existing payload contract, P6.)

### ServiceNow Implementation Notes
- Module: HRSD / platform
- Table(s): new `x_..._erp_exception`; existing `x_..._call_log`, `x_..._sync_run`
- Components: existing `connector/classify.ts` (reuse), Business Rule, list view, assignment rule
- Doc reference: TRD §2 Error semantics; BRD §7 Error handling; `docs/noviq-brd-trd-alignment.md` §2 (this is the app's strongest existing area)

### Story Points: 5
### Priority: High (P0 enabler)
### Dependencies: NV-1

---

## Story NV-13: Synchronous on-demand reads for every employee-facing widget

**As an** employee
**I want** a widget I open to fetch live data, not yesterday's batch
**So that** a balance or payslip list I act on is the ERP's current truth

### Acceptance Criteria
- [ ] Every widget in Epics C–J issues a synchronous, on-demand call at render. No employee-facing figure in this backlog is served from `erp_staging`.
- [ ] `payroll_record`, `employee_profile`, `leave_balance` and `payslip_document` are **never** written to `erp_staging`. A test asserts zero rows for those logical objects. (Honours DL-D2, and BRD O3 "no shadow master data".)
- [ ] A read exceeding `read_timeout_ms` renders `ERP did not answer` with no figure. `0` is never rendered.
- [ ] Where a prior successful figure exists **within the same user session** it may be shown as `Last good figure: <v> (as of <date time>, <n> old)` — with a date *and* a time, never a bare time.
- [ ] Reference data explicitly marked cacheable (INT-14 leave types, INT-22 cost centres) may be cached; its cache age is rendered on the surface. Non-reference data being cached fails this AC.
- [ ] **Negative — partial multi-system answer.** Where a tile aggregates systems and one degrades, state is the **worst** contributing state and the tile names the degraded system: `Partial — <system display name> did not answer.`

### ServiceNow Implementation Notes
- Module: Employee Center Pro widgets / Scripted REST
- Table(s): none new; reads bypass `erp_staging`
- Components: Scripted REST API, widget server scripts, existing four-state payload envelope
- Doc reference: TRD §2 Read pattern; TRD §6; BRD O3; `docs/decision-log.md` DL-D2; `docs/api-contract.md`

### Story Points: 5
### Priority: High (P0)
### Dependencies: NV-1, NV-10

---

## Story NV-14: Data-format conformance — ISO 8601 dates and explicit currency codes

**As an** integration developer
**I want** dates and money to be parsed by shape and never defaulted
**So that** an unparseable date is a visible failure rather than an invisible `0`

### Acceptance Criteria
- [ ] Every date field maps to a ServiceNow date/datetime via `parseDate`, which recognises ISO 8601 and (already) OData V2 `/Date(…)/` **by shape, not by config**. Any new wire format added gets the same shape detection plus a unit test.
- [ ] **A date that fails to parse produces a `failed` state for the tile that depends on it, not an empty column.** A test seeds an unparseable date, asserts `sync_run` records the parse failure, and asserts the "due within N days" style tile renders `ERP did not answer` rather than `0`. (Closes CLAUDE.md trap 13, which is currently traced in code but unconfirmed live.)
- [ ] Every monetary value carries an explicit ISO 4217 currency code from the ERP. Where the vendor cannot supply one, the `currency` logical field is left **unmapped** and the tile renders `not configured`, naming `currency` as the missing field. Defaulting to instance currency fails this AC.
- [ ] A mixed-currency aggregate renders per-currency subtotals, not a single converted figure and not a blank. (Carries DL-D11 forward.)
- [ ] Non-JSON structured responses (XML/SOAP) are converted at the connector boundary; the logical field layer never sees a vendor payload shape.
- [ ] **Negative — vendor sends a bare number for money.** The field is treated as unmapped currency-wise; the figure is not rendered alone.

### ServiceNow Implementation Notes
- Module: platform integration
- Table(s): `x_..._field_map`
- Components: `src/server/connector/field-mapper.ts` `parseDate` (exists), currency handling (exists), new format tests
- Doc reference: TRD §2 Data format; CLAUDE.md trap 13; `docs/decision-log.md` DL-D11, OD37

### Story Points: 5
### Priority: High (P0)
### Dependencies: NV-13

---

## Story NV-15: Sandbox tenant and the vendor-onboarding checklist as tracked records

**As a** delivery lead
**I want** the non-production tenant and the vendor's access path recorded per ERP before build starts
**So that** a partner-program gate is discovered during scoping rather than at go-live

### Acceptance Criteria
- [ ] `erp_system.environment` accepts `sandbox` | `production` and is mandatory. A row with `environment=sandbox` and a production hostname raises a save warning naming both values.
- [ ] A `vendor_onboarding` checklist record exists per vendor with boolean-plus-citation fields for each TRD §8 item: developer/partner portal documented, sandbox tenant available, developer-tier access path, production-tier access path, ERP-side marketplace certification required. Each `true` requires a non-empty `source_note` URL; a `true` with a blank citation is rejected at save.
- [ ] An unchecked item renders as `Not confirmed`, **never** as `No` — absence of confirmation is not a negative finding. (Mirrors TRD §9 step 2: do not assume absence from silence.)
- [ ] The Store-certification test evidence (NV-49) is captured against a `sandbox` system only; a certification run against `environment=production` is refused.
- [ ] **Vault (2026-08-23): environment mixing is a contractual vendor prohibition, not a good practice — enforce it in data.** `Unit4_ERP_Integration_Compendium_ServiceNow.md` §11 states the rule as *"PROD ↔ PROD; matching non-production types; non-production ↔ production is not supported or allowed"*, and §13 carries *"Environment mixing prohibited"* as a live finding with the action *"Enforce same-type environment mapping in ServiceNow Connection Aliases"*. A ServiceNow instance whose own `instance_type` is non-production must therefore refuse to save an `erp_system` with `environment=production`, and the reverse. The save is **rejected**, not warned — a warning on a rule the vendor states as not allowed is a warning someone clicks through.
- [ ] **Gap flagged:** Cegid and PHC currently have **zero research** in this repo (`docs/noviq-brd-trd-alignment.md` §6.3). Their `vendor_onboarding` records ship with every item `Not confirmed` and a `source_note` of `No research exists — see alignment §6.3`. Seeding them with plausible values fails this AC. (Repo rule 5: blank beats wrong.)

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._erp_system`; new `x_..._vendor_onboarding`
- Components: Fluent `Table()`, Business Rule requiring citation, list view
- Doc reference: TRD §2 Non-production environment; TRD §8; TRD §9; `docs/vendor-integration-research.md`

### Story Points: 5
### Priority: High (P0 enabler — certification testing needs it)
### Dependencies: NV-1

---

## Story NV-16: Rate limits and latency expectations declared per connection

**As a** ServiceNow Platform Owner
**I want** each ERP's stated rate limit and expected latency recorded and enforced
**So that** throttling is configured from vendor figures rather than invented ad hoc

### Acceptance Criteria
- [ ] `erp_system` gains `rate_limit_per_min` (Integer), `expected_latency_ms` (Integer), `throughput_source_note` (String(500)). All ship **empty**.
- [ ] With `rate_limit_per_min` empty, no client-side throttle is applied and the control tower shows `Rate limit not stated by vendor` — a guessed throttle fails this AC.
- [ ] With a value set, outbound calls are throttled to it; the 61st call in a minute against a limit of 60 is queued, not dropped, and not sent.
- [ ] **Queueing must not silently become a hang — the two mechanisms in this backlog fight each other.** NV-13 requires every employee-facing read to be synchronous with a `read_timeout_ms` budget; this story queues calls above the limit. A queued *employee-facing read* therefore consumes that budget while waiting and, on exceed, renders `failed` — an ERP that would have answered, reported as one that did not. Queue time counts against `read_timeout_ms`, and a read that cannot be dispatched inside its budget renders the distinct string `Too many requests right now — try again shortly`, **never** `ERP did not answer` and never `0`. Background and write traffic queue normally. A test saturates the limit, issues an employee read, and asserts that exact string.
- [ ] A `429` response honours `Retry-After` (already implemented) and records the observed limit in `call_log` for comparison against the configured figure.
- [ ] A read whose observed latency exceeds `expected_latency_ms` by more than the configured factor raises a low-priority exception-queue entry; it does not fail the read.
- [ ] Volume assumptions from TRD §6 (R1/R3 high-frequency read-heavy "few seconds"; R2/R6 minutes-tolerant; R7/R8 low-frequency high-accuracy) are recorded as the per-object `read_timeout_ms` defaults, each with a `source_note` citing TRD §6. **Flagged assumption:** TRD §6 calls these "first-pass planning assumptions to be replaced with real figures once a pilot is scoped" — they must not harden into product defaults without a pilot measurement (OQ-8).
- [ ] **Vault (2026-08-23): Unit4's figures are published, and one of them contradicts this app's own default.** `Unit4_ERP_Integration_Compendium_ServiceNow.md` §12 states: **500 HTTP requests/min per environment** (PROD, PREV, ACPT01, ACPT02), **1,500/min shared** across ACPT03–11, *"when exceeded, subsequent requests are suspended for one minute"*, with **429 + `Retry-After`** documented and exponential backoff explicitly recommended. Timeouts: **ERPx Public API Gateway 240 s**, ERPx web application **110 s**, ERP CR REST and SOAP **120 s**. Recommended REST concurrency **10**. Seed all of these for `unit4` with the citation.
- [ ] **The 30-second default is too short for this vendor, and the failure is invisible.** `erp_system.timeout_ms` defaults to **30000**, while Unit4 permits a long-running Public API call up to **240 s**. A legitimately slow call is cut off by our own client, recorded as a timeout, and rendered as `failed` — an ERP that answered correctly, reported as an ERP that did not answer. A test issues a call the vendor takes >30 s to satisfy and asserts the state is `live`, not `failed`. Either the default rises per-system from the vendor figure or the mismatch is recorded as a known ceiling; silently keeping 30000 fails this AC.
- [ ] **Suspension is not rate-limiting.** Unit4 suspends *all* subsequent requests for a full minute once the limit trips — so a breach is a one-minute outage for every employee on that tenant, not a slow queue for one caller. The client-side throttle must therefore be conservative by default (a configurable safety margin below `rate_limit_per_min`, shipping at 80%), and a breach raises a **high**-priority exception-queue entry, not the low-priority latency one.

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._erp_system`, `x_..._object_map`
- Components: throttle in `rest-client.ts` (extends existing retry/backoff), `call_log` telemetry
- Doc reference: TRD §2 Throughput; TRD §6

### Story Points: 5
### Priority: Medium (P1 — reads work without it; needed before pilot volume)
### Dependencies: NV-1

---
# Epic B — Logical entity model (TRD §3)

The app carries 16 logical objects; **two** of the TRD's eleven entities overlap
(`employee_profile`, partially `payroll_record`). These five stories add the missing nine and
complete the two. They are pure control-tower data model work — no vendor field names are seeded
without a citation (repo rule 5).

---

## Story NV-17: Complete the Employee entity to the TRD's minimum field set

**As an** integration developer
**I want** `employee_profile` to carry all thirteen TRD §3 Employee fields as logical fields
**So that** R2, R6, R7 and R8 have somewhere to map to

### Acceptance Criteria
- [ ] `employee_profile` logical fields include, at minimum: `external_employee_id`, `name`, `employment_status`, `start_date`, `end_date`, `job_title`, `department_or_position`, `cost_centre`, `address`, `phone`, `emergency_contact`, `bank_account_iban`, `contract_type`. The seven that exist today are unchanged in name.
- [ ] Every newly added logical field ships with **no** `field_map` entry and **no** `endpoint_path_hint` for any vendor unless a `source_note` citing vendor documentation is present. A seeded mapping with a blank `source_note` fails the build. (Repo rule 5; OD37 precedent.)
- [ ] `bank_account_iban` is flagged `sensitive=true`; a `sensitive` field is excluded from `call_log`, `erp_write`, `doc_audit` and every payload except the one live render that needs it. A test seeds an IBAN and greps all four tables for zero hits.
- [ ] An unmapped field renders as `not configured` naming the field: `Not configured — map employee_profile.cost_centre`. It never renders as blank and never as `0`.
- [ ] `employee_profile` remains **absent** from any staging category; a test asserts it cannot be selected for `erp_staging`. (DL-D2 preserved; BRD O3 satisfied.)
- [ ] **Negative — vendor returns a partial record.** Missing optional fields render `not configured`; the tile does not fail wholesale, and the fields that did arrive render `live`.

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._field_map` (choice list of logical fields), `x_..._object_map`, `x_..._map_tmpl`
- Components: `src/fluent/tables/choices.ts`, `map-tmpl-seeds.now.ts`; note L1-D8 — `logical_field` is a flat choice list filtered by Business Rule
- Doc reference: TRD §3 Employee; INT-01, INT-04, INT-05, INT-06, INT-07; `docs/decision-log.md` DL-D2, OD37, L1-D8

### Story Points: 5
### Priority: High (P0 — R2 needs address, phone, emergency contact, IBAN)
### Dependencies: NV-2

---

## Story NV-18: PayslipDocument and IncomeStatement entities

**As an** employee
**I want** payslip and annual tax statement documents modelled as first-class objects
**So that** R1, D3 and D4 have an entity to read from

### Acceptance Criteria
- [ ] New logical object `payslip_document`: `external_employee_id`, `period_label`, `period_start`, `period_end`, `issue_date`, `document_reference`, `document_available` (boolean), `retrieval_path`.
- [ ] New logical object `income_statement`: `external_employee_id`, `tax_year`, `gross_annual`, `net_annual`, `tax_withheld`, `statutory_contributions`, `currency`, `document_reference`.
- [ ] Neither object may be staged. A test asserts `hr`/`payroll` remain absent from the staging category choices and that neither object can be selected for a `sync_run`. (DL-D2.)
- [ ] `document_reference` with no value renders the period row as `Document not available from the ERP for this period` — **never** as a download link that 404s, and never as a `0`-count in a "payslips available" tile.
- [ ] All monetary fields on `income_statement` require `currency`; an unmapped `currency` leaves the figure unrendered with `not configured — map income_statement.currency`.
- [ ] **Negative — the ERP lists a period but cannot serve its document.** The list row renders with the period and the label `Retrieval unavailable`; the count tile reports the number of **listed** periods and states separately how many are retrievable. A single number conflating the two fails this AC.

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._object_map`, `x_..._field_map`, `x_..._map_tmpl`
- Components: `choices.ts`, seed rows with mandatory `source_note`
- Doc reference: TRD §3 PayslipDocument, IncomeStatement; INT-08, INT-09, INT-10; BRD R1, D3, D4

### Story Points: 5
### Priority: High (P0 — R1)
### Dependencies: NV-17

---

## Story NV-19: LeaveBalance, LeaveRequest and leave reference-data entities

**As an** employee
**I want** leave balances and requests modelled with an explicit unit type
**So that** a balance of "5" is never ambiguous between days and hours

### Acceptance Criteria
- [ ] New logical object `leave_balance`: `external_employee_id`, `leave_type`, `balance_value`, `balance_unit` (`days` | `hours`), `as_of_date`.
- [ ] New logical object `leave_request`: `external_employee_id`, `leave_type`, `start_date`, `end_date`, `status`, `approver`, `submitted_date`, `erp_request_reference`.
- [ ] New reference object `leave_type_ref`: `code`, `label`, `unit`, `active`.
- [ ] `balance_unit` unmapped means the balance is **not rendered at all**; the tile shows `Not configured — map leave_balance.balance_unit`. Rendering a bare number without its unit fails this AC.
- [ ] A `balance_value` of `0` renders as `0 days` **only** when the ERP returned a successful response containing zero. A failed or unmapped read renders `ERP did not answer` / `not configured`.
- [ ] `as_of_date` is rendered with the balance, with a date and a time. A balance with no `as_of_date` renders `Balance date unknown` and is flagged `stale`.
- [ ] **Negative — the ERP returns a leave type not present in `leave_type_ref`.** The row still renders, labelled with the raw code plus `(unrecognised leave type)`; it is not dropped, because dropping it understates the balance.

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._object_map`, `x_..._field_map`
- Components: `choices.ts`, cacheable-reference flag on `leave_type_ref`
- Doc reference: TRD §3 LeaveBalance, LeaveRequest; INT-11, INT-12, INT-13, INT-14; BRD R3, D5

### Story Points: 5
### Priority: High (P0 — R3)
### Dependencies: NV-17

---

## Story NV-20: ExpenseClaim and Attachment entities

**As a** Finance validator
**I want** expense claims and ERP-side attachments modelled with line items, VAT and currency
**So that** R4 and R5 archival have a shape to write into

### Acceptance Criteria
- [ ] New logical object `expense_claim`: `external_employee_id`, `claim_date`, `status`, `total_amount`, `currency`, `erp_claim_reference`, plus child `expense_line`: `amount`, `category`, `currency`, `vat_amount`, `vat_code`, `receipt_reference`.
- [ ] New logical object `erp_attachment`: `parent_entity_type`, `parent_external_id`, `document_type_category`, `file_name`, `mime_type`, `uploaded_by`, `uploaded_date`, `erp_attachment_reference`.
- [ ] Every `expense_line` requires an explicit `currency`; a line with no currency is rejected at submission with `Line <n> has no currency code — the ERP requires an explicit code (TRD §2 Data format).`
- [ ] VAT fields are optional and render `Not applicable` when unmapped for a jurisdiction — never `0`.
- [ ] `erp_attachment.document_type_category` is mandatory on write; an upload with no category is refused before dispatch.
- [ ] **Negative — the total does not equal the sum of lines.** Submission is refused with `Claim total <x> does not match line total <y>`; no partial claim is sent.

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._object_map`, `x_..._field_map`
- Components: `choices.ts`; child-object modelling in `field-mapper.ts` (array predicate path syntax already supported — OD38)
- Doc reference: TRD §3 ExpenseClaim, Attachment; INT-15, INT-16, INT-18

### Story Points: 5
### Priority: Medium (P1 — R4, R5)
### Dependencies: NV-17, NV-5

---

## Story NV-21: CompensationChange, BenefitEnrollment, TimesheetEntry and CostCentre/Project entities

**As an** integration developer
**I want** the four remaining TRD §3 entities modelled
**So that** R6, R9 and R10 are not blocked on a data-model gap when their turn comes

### Acceptance Criteria
- [ ] New logical object `compensation_change`: `external_employee_id`, `change_type` (`promotion` | `salary` | `department` | `manager`), `effective_date`, `old_value`, `new_value`, `approval_reference`.
- [ ] New logical object `benefit_enrollment`: `external_employee_id`, `benefit_type`, `plan_option`, `contribution_amount`, `currency`, `effective_date`.
- [ ] New logical object `timesheet_entry`: `external_employee_id`, `entry_date`, `cost_centre_or_project_ref`, `hours`, `entry_status`.
- [ ] New reference object `cost_centre_project_ref`: `id`, `name`, `active`, marked cacheable.
- [ ] `compensation_change.new_value` is flagged `sensitive=true` and follows the same exclusion rule as `bank_account_iban` (NV-17): absent from `call_log`, `erp_write`, `doc_audit`. A test greps for a seeded salary figure and asserts zero hits.
- [ ] `effective_date` is mandatory on all three write entities; a write with an empty effective date is refused with `Effective date is required — the ERP cannot place this change in a payroll period.`
- [ ] **Negative — inactive cost centre.** A timesheet entry against a `cost_centre_project_ref` row with `active=false` is refused at submission naming the code; it is not silently reassigned to a default.

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._object_map`, `x_..._field_map`
- Components: `choices.ts`, cacheable-reference flag, sensitive-field exclusion (shared with NV-17)
- Doc reference: TRD §3 CompensationChange, BenefitEnrollment, TimesheetEntry, CostCentre/Project; INT-06, INT-20, INT-21, INT-22, INT-23

### Story Points: 5
### Priority: Low (P2 for R9/R10; the `compensation_change` half is P1 for R6 and may be split)
### Dependencies: NV-17

---
# Epic C — Identity & Onboarding (R7)

---

## Story NV-22: Employee lookup and identity matching (INT-02)

**As an** HR Shared Services agent
**I want** to search the ERP for an employee and bind the result to a ServiceNow user
**So that** an existing workforce can be linked without an onboarding event for each person

### Acceptance Criteria
- [ ] A lookup screen queries the ERP by surname plus one of (employee number, national ID, start date) and renders candidate rows with `external_employee_id`, name, department and start date.
- [ ] Selecting a candidate writes `erp_employee_id` per NV-10; the write requires the `hr_admin` role and is refused for any other role, verified by re-reading the field after an attempt (trap 4).
- [ ] A search returning more than one candidate **never auto-binds**. The agent must select; an auto-bind on a single result is also refused unless `external_employee_id` was supplied exactly.
- [ ] A search returning zero rows renders `No matching ERP employee found` — distinct from `ERP did not answer` when the call failed. A tester can tell the two apart from the screen alone.
- [ ] **Negative — the ERP has no search endpoint.** `object_map` for `employee_profile.search` is absent, the lookup screen is not rendered, and the surface shows `Employee search is not available for <system> — link IDs manually or via onboarding`. It does not render an empty search box that always returns nothing.
- [ ] **Negative — candidate already bound to another ServiceNow user.** Binding is refused with `ERP employee <id> is already linked to <user>`; the existing link is unchanged.

### ServiceNow Implementation Notes
- Module: HRSD agent workspace
- Table(s): existing `x_..._emp_xref`, `x_..._object_map`
- Components: Scripted REST search proxy, UI Page / workspace component, ACL on the bind action
- Doc reference: INT-02; BRD R7; TRD §2 Identity linkage

### Story Points: 5
### Priority: High (P0 enabler — R1/R2/R3 all need a linked ID for the existing workforce)
### Dependencies: NV-10, NV-13

---

## Story NV-23: Create the ERP employee record on onboarding approval (INT-03)

**As an** HR Shared Services agent
**I want** an approved onboarding case to create the employee master record in the ERP and write the returned ID back
**So that** the record is complete and correct before day one, with no re-keying

**Flags:** conflicts with **DL-D3** — this is a write. Blocked on NV-3.

### Acceptance Criteria
- [ ] On onboarding case approval, a single `erp_write` row is created with `operation=create`, `logical_object=employee_profile`, and the idempotency key from NV-4.
- [ ] On confirmation, the ERP-returned employee ID is written to `erp_employee_id` (NV-10) on the ServiceNow user, and the case displays `Linked to ERP employee <id>`.
- [ ] The create payload includes banking details only when the banking approval (NV-9) is present; otherwise the record is created **without** banking fields and a follow-up R2 banking write is raised as a separate task. Creating an employee with unapproved banking data fails this AC.
- [ ] **Negative — retry after timeout.** Two dispatch attempts produce exactly one ERP employee record; the second attempt runs the existence check and confirms rather than creating. Test asserts the ERP-side count.
- [ ] **Negative — validation failure.** A 422 from the ERP is non-retriable, creates an `erp_exception` with category `Validation failure` and the ERP's own field-level message, and leaves the case open. The case is never closed as complete on a failed create.
- [ ] **Negative — permission denied.** A 403 raises `Permission denied` on the exception queue and does not retry.
- [ ] **Negative — approval absent.** With no approved `sysapproval_approver` record, no `erp_write` row is created and no Submit control is rendered.
- [ ] Onboarding creates **no** shadow copy: personal data captured in the case is retained per the case retention policy, and no `erp_staging` row for `employee_profile` is created. (BRD O3, DL-D2.)

### ServiceNow Implementation Notes
- Module: HRSD onboarding case type
- Table(s): `x_..._erp_write`, existing `x_..._emp_xref`, HRSD case tables
- Components: Flow Designer onboarding flow, write dispatcher, existence check
- Doc reference: INT-03; BRD R7; BRD §7 Idempotent writes; TRD §2 Idempotency

### Story Points: 8
### Priority: Medium (P1 per BRD §6.2)
### Dependencies: NV-3, NV-4, NV-9, NV-10, NV-17, NV-22

---

# Epic D — Payroll & Tax Documents (R1 · P0)

---

## Story NV-24: Payslip period list widget (INT-08)

**As an** employee
**I want** to see which payslips exist for me, with their periods and issue dates
**So that** I can choose one to download without contacting HR

### Acceptance Criteria
- [ ] The Employee Center Pro widget lists `payslip_document` rows for the signed-in user's `erp_employee_id`, newest first, showing `period_label`, `issue_date` and a retrieval control.
- [ ] Metadata only: the response body contains **no document bytes**. A test inspects the widget's server response and asserts no base64 field is present.
- [ ] **`not configured`** — with no active `object_map` for `payslip_document`, the widget renders `Not configured — create an Object Map for payslip_document` and no list frame. An empty table with "No payslips" fails this AC.
- [ ] **`failed`** — with the ERP unreachable, the widget renders `ERP did not answer`. It never renders an empty list and never renders `0 payslips available`.
- [ ] **`live` with genuinely zero** — a successful call returning an empty set renders `No payslips issued yet` and is distinguishable on screen from the `failed` case.
- [ ] Each row states whether the document is retrievable; a row with an empty `document_reference` renders `Retrieval unavailable` and its control is **absent**, not disabled. (Repo rule 1.)
- [ ] A user with no `erp_employee_id` sees `Your record is not yet linked to the ERP — contact HR` (NV-10) and no list.
- [ ] Latency: the widget's server call carries a timeout drawn from `object_map.read_timeout_ms`; on exceed, the `failed` state renders within that budget rather than hanging the page.

### ServiceNow Implementation Notes
- Module: Employee Center Pro
- Table(s): `x_..._object_map` (`payslip_document`), `x_..._call_log`
- Components: Scripted REST `GET /payslips`, Employee Center widget, four-state payload envelope per `docs/api-contract.md`
- Doc reference: INT-08; BRD R1; BRD §7; `docs/stories.md` §0 rendering contract

### Story Points: 8
### Priority: High (P0)
### Dependencies: NV-13, NV-18, NV-10

---

## Story NV-25: On-demand payslip PDF retrieval, streamed and never stored (INT-09)

**As an** employee
**I want** to download a specific payslip PDF on demand
**So that** I have the document without it ever resting in ServiceNow

### Acceptance Criteria
- [ ] Requesting a payslip issues a synchronous authenticated call and streams the response to the browser with `Content-Type: application/pdf` and a `Content-Disposition` filename containing the period label.
- [ ] **Nothing is stored.** `sys_attachment` row count, `erp_staging` row count and every app table are unchanged before and after a successful download. A test asserts all three. (BRD R1; DL-D2.)
- [ ] The bytes are not written to `call_log`; `call_log` records `content_type`, `content_length`, status and duration only.
- [ ] Authorisation: a user requesting another employee's payslip receives HTTP 403 with body `{"result": {"error": "Not authorised for this employee record"}}` (note the `{"result": …}` wrapper — trap 2). The check uses `gs.hasRole()` in user-session context plus an `erp_employee_id` identity match; a query-based role check is not used (trap 9, DL-D14).
- [ ] **Negative — ERP returns HTML (a login page).** The response fails the `%PDF-` magic-byte check from NV-5, nothing is delivered, and the user sees `Document could not be retrieved — the ERP returned an unexpected format`. Delivering HTML with a `.pdf` filename fails this AC absolutely. (Repo rule 2.)
- [ ] **Negative — timeout.** The user sees `ERP did not answer — try again`; no partial file is delivered and no zero-byte file is written.
- [ ] **Negative — 404 for a period the list advertised.** Non-retriable; an `erp_exception` with category `Record not found` names the period, so the list/retrieval mismatch is investigated.
- [ ] Every retrieval writes an audit row with user, `erp_employee_id`, period and timestamp — and **no** document content.

### ServiceNow Implementation Notes
- Module: Employee Center Pro
- Table(s): `x_..._call_log`, `x_..._doc_audit`
- Components: `binary-client.ts` (NV-5), Scripted REST streaming response, `gs.hasRole()` in-session check
- Doc reference: INT-09; BRD R1; CLAUDE.md traps 2, 9; `docs/decision-log.md` DL-D14

### Story Points: 8
### Priority: High (P0)
### Dependencies: NV-5, NV-24

---

## Story NV-26: Annual income and tax statement retrieval (INT-10)

**As an** employee
**I want** my annual income and tax statement for a chosen year
**So that** I can file my personal tax return without an HR request

### Acceptance Criteria
- [ ] A year selector lists only years for which the ERP reports a statement. A year with no data is not offered; the selector is never populated with a guessed range.
- [ ] Where the ERP returns **data** (INT-10 data variant), the figures render with explicit currency codes; an unmapped `currency` leaves the figures unrendered with `not configured — map income_statement.currency`.
- [ ] Where the ERP returns a **document**, the NV-25 streaming and magic-byte rules apply unchanged, including never storing it.
- [ ] `tax_withheld` of zero renders `0` **only** under a successful response containing zero. A missing or unmapped value renders `not configured`, never `0`. This is the single highest-risk `0` in this backlog — a `0` tax-withheld figure on a tax return is acted upon.
- [ ] **Negative — statement not yet issued for the current year.** The selector shows the year with `Statement not yet issued`, not with zero figures.
- [ ] **Negative — ERP unreachable.** `ERP did not answer`; no figures of any kind.
- [ ] Feeds D4 (NV-41) without a second read path being written.

### ServiceNow Implementation Notes
- Module: Employee Center Pro
- Table(s): `x_..._object_map` (`income_statement`)
- Components: Scripted REST, widget, shared binary path where the vendor returns a document
- Doc reference: INT-10; BRD D4; TRD §3 IncomeStatement

### Story Points: 5
### Priority: Medium (P1 — supports D4, which BRD §6.1a marks P1)
### Dependencies: NV-18, NV-13, NV-5

---
# Epic E — Leave & Absence (R3 · P0)

---

## Story NV-27: Live leave balance widget (INT-11)

**As an** employee
**I want** my current leave balance per leave type, with its unit and as-of date
**So that** I can plan a request without waiting on an HR reply

### Acceptance Criteria
- [ ] The widget renders one row per `leave_type`, each showing `balance_value` + `balance_unit` + `as_of_date` with a date and a time.
- [ ] A balance is rendered **only** with its unit. A mapped value with an unmapped `balance_unit` renders `Not configured — map leave_balance.balance_unit` and no number.
- [ ] **`live` zero** — a successful call returning `0` renders `0 days remaining`. **`failed`** renders `ERP did not answer`. **`not configured`** renders `Not configured — create an Object Map for leave_balance`. **`stale`** renders the figure plus `Stale — as of <date time> (<n> old)`. A tester can distinguish all four from the screen alone.
- [ ] The balance is fetched synchronously at render and is **never** staged (NV-13, DL-D2).
- [ ] **Negative — partial answer across leave types.** If the ERP returns some types and errors on others, the widget renders the types it got and states `Partial — <n> leave types did not return`. It does not silently drop the missing types, because a missing type reads as a zero balance.
- [ ] Balances feed D5 (NV-41) without a second read path.

### ServiceNow Implementation Notes
- Module: Employee Center Pro
- Table(s): `x_..._object_map` (`leave_balance`)
- Components: Scripted REST, widget, four-state envelope
- Doc reference: INT-11; BRD R3, D5; TRD §3 LeaveBalance

### Story Points: 5
### Priority: High (P0)
### Dependencies: NV-19, NV-13, NV-10

---

## Story NV-28: Leave types and absence reason codes as cached reference data (INT-14)

**As an** employee
**I want** the leave-type picker to offer exactly the codes the ERP accepts
**So that** my request is not rejected for an invalid type after approval

### Acceptance Criteria
- [ ] `leave_type_ref` is fetched from the ERP and cached; the cache TTL is a `sys_property` with a published default, and the cache age is displayed on the picker as `Leave types as of <date time>`.
- [ ] Only `active=true` types are offered. An inactive type already used on an open request still renders on that request, labelled `(no longer offered)`.
- [ ] **Negative — reference fetch fails and no cache exists.** The leave-request form is **not rendered**; the surface shows `Leave types unavailable — the ERP did not answer. Try again shortly.` A free-text leave type or a hard-coded fallback list fails this AC absolutely, because a hard-coded list is exactly the invented-field-name failure (repo rule 5).
- [ ] **Negative — reference fetch fails but a cache exists.** The form renders from cache, labelled `Leave types may be out of date — as of <date time>`.
- [ ] **Negative — the ERP returns an empty type list under a success response.** The form is not rendered and the surface shows `The ERP reports no leave types configured` — distinct from the failure message.
- [ ] This is the only object in Epic E permitted to cache (NV-13 exception for reference data).

### ServiceNow Implementation Notes
- Module: Employee Center Pro / Service Catalog
- Table(s): `x_..._object_map` (`leave_type_ref`), cache store
- Components: Catalog variable populated from a cached reference fetch, `sys_property` TTL
- Doc reference: INT-14; BRD R3; TRD §2 Read pattern (cacheable reference data)

### Story Points: 5
### Priority: High (P0)
### Dependencies: NV-19, NV-13

---

## Story NV-29: Write an approved leave request to the ERP (INT-12)

**As an** employee
**I want** my manager-approved leave to reach the ERP so my balance and payroll are correct
**So that** the approval I received is actually the outcome

**Flags:** conflicts with **DL-D3** — this is a write. Blocked on NV-3.

### Acceptance Criteria
- [ ] Manager approval in ServiceNow is the gate; the write dispatches only after an approved `sysapproval_approver` record exists whose `sys_updated_on` precedes `erp_write.first_sent_at` (NV-9).
- [ ] On confirmation, the ERP's request reference is written to `leave_request.erp_request_reference` and shown on the RITM as `Recorded in the ERP as <reference>`.
- [ ] **Payroll cut-off.** A request whose start date falls in a locked period sets `erp_write.state=blocked_cutoff` and the requester sees the NV-7 message naming the next cycle and pay date. It is not sent and not dropped.
- [ ] **Negative — retry.** Two dispatch attempts produce exactly one ERP leave request. Test asserts the ERP-side count via INT-13.
- [ ] **Negative — insufficient balance rejected by the ERP.** 422, non-retriable, `erp_exception` category `Validation failure` carrying the ERP's message, RITM stays open with `The ERP rejected this request: <message>`. The ServiceNow approval is **not** reversed automatically; the exception is worked by HR.
- [ ] **Negative — permission denied.** 403, non-retriable, `Permission denied` on the exception queue.
- [ ] **Negative — timeout with no response.** The request is not resubmitted blind; the existence check runs first (NV-4).
- [ ] No Submit control is rendered until `object_map` for `leave_request.create`, the scope grant, and the approval all exist. (Repo rule 1.)
- [ ] The RITM never shows `Submitted to ERP` for a write in state `queued`, `sent` or `blocked_*`. The status string on screen matches `erp_write.state` one-for-one.

### ServiceNow Implementation Notes
- Module: Service Catalog / HRSD case, Flow Designer
- Table(s): `x_..._erp_write`, `x_..._object_map` (`leave_request`), `payroll_calendar`
- Components: Flow Designer approval + write action, cut-off resolver, idempotency key
- Doc reference: INT-12; BRD R3; BRD §7 Payroll cut-off, Approval integrity

### Story Points: 8
### Priority: High (P0)
### Dependencies: NV-3, NV-4, NV-7, NV-9, NV-19, NV-28

---

## Story NV-30: Leave request status read-back and cancellation (INT-13)

**As an** employee
**I want** to see the ERP's own status for my leave request and cancel it if plans change
**So that** "did my change actually happen?" is answerable on screen

### Acceptance Criteria
- [ ] The RITM shows the ERP's status for the request, read live via INT-13, alongside the ServiceNow approval state. The two are labelled distinctly: `ServiceNow approval: Approved` / `ERP status: Pending`.
- [ ] A divergence between the two (ServiceNow approved, ERP rejected) raises an `erp_exception` with category `Conflict / duplicate` and is visible to HR. It is not silently overwritten in either direction.
- [ ] Cancellation is a write and passes the full NV-3 path, including confirmation. A cancellation that returns no confirmable status is `failed`, not `confirmed`.
- [ ] **Negative — cancellation after the payroll period locked.** Refused with the NV-7 message; the request is not cancelled locally either, because a local cancel with an ERP-side booking is a data-drift incident.
- [ ] **Negative — ERP does not support cancellation.** `object_map` for `leave_request.cancel` is absent, the Cancel control is **not rendered**, and the RITM shows `Cancellation must be handled by HR for this system`. A rendered Cancel button that raises a case fails this AC — it is a button that cannot commit its decision.
- [ ] **Negative — ERP unreachable on status read.** `ERP status: could not be retrieved`; the ServiceNow approval state still renders. No `0`, no blank.

### ServiceNow Implementation Notes
- Module: Employee Center Pro / RITM view
- Table(s): `x_..._erp_write`, `x_..._object_map` (`leave_request`)
- Components: live status read at render, cancel write action
- Doc reference: INT-13; BRD R3

### Story Points: 5
### Priority: High (P0)
### Dependencies: NV-29

---

# Epic F — Personal & Banking Data (R2 · P0)

---

## Story NV-31: Read the employee's current personal data for prefill (INT-01)

**As an** employee
**I want** the change form prefilled with what the ERP currently holds
**So that** I correct a value rather than retype every field

### Acceptance Criteria
- [ ] The catalog item prefills address, phone and emergency contact from a live `employee_profile` read for the signed-in user's `erp_employee_id`.
- [ ] A field the ERP did not return renders **empty with the label `Not returned by the ERP`** — not blank-and-silent, and not pre-filled from `sys_user`.
- [ ] `bank_account_iban` prefills **masked** (last four characters only) and the full value is never present in the page payload. A test inspects the served HTML/JSON for the full IBAN and asserts zero hits.
- [ ] **`failed`** — with the ERP unreachable the form is rendered **read-only** with `Current values could not be retrieved from the ERP. Submitting now risks overwriting data you cannot see.` Submission is disabled by not rendering the Submit control.
- [ ] **`not configured`** — with no `object_map` for `employee_profile`, the item is not orderable and shows `Not configured — create an Object Map for employee_profile`.
- [ ] No prefilled value is written to any app table. A test asserts no `erp_staging` row for `employee_profile`. (DL-D2, BRD O3.)

### ServiceNow Implementation Notes
- Module: Service Catalog / Employee Center Pro
- Table(s): `x_..._object_map` (`employee_profile`)
- Components: Catalog Client Script + Scripted REST prefill, masking in the server script
- Doc reference: INT-01; BRD R2; BRD §7 Data protection

### Story Points: 5
### Priority: High (P0)
### Dependencies: NV-13, NV-17, NV-10

---

## Story NV-32: Update non-sensitive personal fields (INT-04)

**As an** employee
**I want** my address, phone and emergency contact to reach the ERP without an HR ticket
**So that** payroll and emergency records stay correct

**Flags:** conflicts with **DL-D3** — this is a write. Blocked on NV-3.

### Acceptance Criteria
- [ ] Submitting the item creates one `erp_write` row with `operation=update`, containing **only the changed fields** — an unchanged field is not sent, so a stale prefill cannot overwrite a value changed in the ERP meanwhile.
- [ ] The BRD permits auto-sync for these fields; no approval is required and none is configured in `write_approval_policy`. A policy row added for these fields fails this AC unless a new requirement is recorded.
- [ ] On confirmation, the RITM shows `Updated in the ERP at <date time>` sourced from `erp_write.confirmed_at`.
- [ ] **Negative — retry.** Two dispatch attempts produce one logical update; the idempotency key is identical. Test asserts the ERP field equals the submitted value, not a doubled or reverted one.
- [ ] **Negative — validation failure.** 422 non-retriable, `erp_exception` category `Validation failure` with the ERP's field-level message rendered to the employee verbatim, RITM stays open.
- [ ] **Negative — permission denied.** 403 non-retriable, `Permission denied`, and — because this is the general employee-update scope — an exception note that the credential's scope grant (NV-2) may be wrong.
- [ ] **Negative — timeout.** State stays `sent`; the confirmation poller resolves it; the RITM shows `Sent to the ERP, awaiting confirmation` and **never** `Updated in the ERP` until `confirmed`.
- [ ] Banking fields are structurally excluded from this item; a submission containing `bank_account_iban` is rejected server-side with `Banking changes must use the approval-gated item.`

### ServiceNow Implementation Notes
- Module: Service Catalog / Flow Designer
- Table(s): `x_..._erp_write`, `x_..._object_map` (`employee_profile`)
- Components: Flow, write dispatcher, changed-fields diff
- Doc reference: INT-04; BRD R2

### Story Points: 5
### Priority: High (P0)
### Dependencies: NV-3, NV-4, NV-31

---

## Story NV-33: Banking / IBAN update — approval-gated with prior-of-record notification (INT-05)

**As an** HR Business Partner
**I want** every banking change to require a human approval and to notify the employee's previously-recorded contact channel
**So that** the standard payroll-fraud control is enforced by the system, not by procedure

**Flags:** conflicts with **DL-D3** — this is a write. Blocked on NV-3.

### Acceptance Criteria
- [ ] `write_approval_policy` carries a row for `employee_profile.bank_account_iban` with `required=true` citing BRD R2. Removing or deactivating that row is denied by ACL to every role except `hr_admin`, and the change writes an audit row.
- [ ] **The write cannot fire before the approval record exists.** A test dispatches with `sysapproval_approver.state=requested` and asserts zero outbound HTTP requests in `call_log` and `erp_write.state=blocked_approval`.
- [ ] **A retroactive approval does not satisfy the gate.** A test creates the approval **after** a dispatch attempt and asserts the write still does not send, because `sys_updated_on` is later than `first_sent_at` (NV-9).
- [ ] On approval and confirmation, a notification is sent to the employee's **prior-of-record** contact channel — the address/phone value read from the ERP *before* the change, captured at submission time — not to the newly submitted value. A test changes both IBAN and email in one submission and asserts the notification went to the old email.
- [ ] The notification body contains the last four IBAN characters only. A test greps the sent notification for the full IBAN and asserts zero hits.
- [ ] `call_log`, `erp_write`, `doc_audit` and `erp_exception` contain no full IBAN, in either the old or the new value. A test greps all four.
- [ ] The banking scope grant (NV-2) is a **distinct** ERP role from the general employee-update grant; a shared value fails at save.
- [ ] **Negative — approval rejected.** No `erp_write` row, no HTTP request, RITM closed incomplete with `Approval rejected`, and a notification to the prior-of-record channel that a change was requested and refused.
- [ ] **Negative — retry.** Two dispatches produce one logical update, idempotency key identical.
- [ ] **Negative — validation failure (invalid IBAN).** 422 non-retriable, message rendered verbatim, the approval is **not** consumed — a corrected resubmission requires a fresh approval.
- [ ] **Negative — timeout.** RITM shows `Sent to the ERP, awaiting confirmation`; the prior-of-record notification fires only on `confirmed`, never on `sent`.

### ServiceNow Implementation Notes
- Module: Service Catalog / Flow Designer / Notifications
- Table(s): `x_..._erp_write`, `x_..._write_approval_policy`, `sysapproval_approver`, `sysevent_email_action`
- Components: approval subflow, prior-of-record capture at submit, masked notification template, sensitive-field exclusion
- Doc reference: INT-05; BRD R2 key requirement; BRD §7 Approval integrity; BRD §9 risk 2; TRD §5 Field-level permission clarity

### Story Points: 13
### Priority: High (P0)
### Dependencies: NV-3, NV-4, NV-9, NV-31, NV-2

---
# Epic G — Expenses (R4 · P1)

---

## Story NV-34: Submit an expense claim with line items and receipts (INT-15)

**As an** employee
**I want** to submit a travel/expense claim with receipts attached
**So that** it reaches Finance for reimbursement without a separate system

**Flags:** conflicts with **DL-D3** — this is a write. Blocked on NV-3.

### Acceptance Criteria
- [ ] The catalog item captures header + N line items, each with amount, category, explicit currency, optional VAT amount and code, and at least one receipt attachment where policy requires it.
- [ ] Attachment validation follows NV-11 exactly: size and MIME checked client-side **and** server-side, with the ERP's own stated limits. With limits unconfigured the attachment control is not rendered and the item is not orderable.
- [ ] HR/Finance policy validation is a ServiceNow approval step; the write dispatches only after it (NV-9). `write_approval_policy` carries a row for `expense_claim.create`. **Flagged assumption:** the BRD says "HR/Finance validates against policy" but does not state whether that is a formal approval record or an agent action — this story implements a formal approval record so the gate is testable. Recorded as OQ-4.
- [ ] Claim total must equal the sum of lines (NV-20); a mismatch refuses submission naming both figures.
- [ ] **Negative — retry.** Two dispatches produce exactly one ERP claim and exactly one copy of each receipt. Test asserts the ERP-side attachment count.
- [ ] **Negative — receipt upload succeeds, claim create fails.** Orphaned receipts are cleaned up or the claim is retried with the same idempotency key so no duplicate receipt is created. An orphaned receipt with no claim fails this AC.
- [ ] **Negative — validation failure.** 422 non-retriable; the ERP's per-line message is rendered against the line it concerns, not as a single header error.
- [ ] **Negative — permission denied / timeout.** Per NV-12 and NV-3 respectively; the RITM never shows `Submitted to Finance` for a write not in `confirmed`.

### ServiceNow Implementation Notes
- Module: Service Catalog / Employee Center Pro
- Table(s): `x_..._erp_write`, `x_..._object_map` (`expense_claim`), `sys_attachment`
- Components: multi-row variable set, attachment validation, multipart write via `binary-client.ts`
- Doc reference: INT-15; BRD R4; TRD §3 ExpenseClaim; TRD §5 Attachment limits

### Story Points: 13
### Priority: Medium (P1)
### Dependencies: NV-3, NV-4, NV-5, NV-9, NV-11, NV-20

---

## Story NV-35: Expense claim status read-back (INT-16)

**As an** employee
**I want** to see whether my claim is submitted, approved, paid or rejected
**So that** I stop emailing Finance to ask

### Acceptance Criteria
- [ ] The RITM renders the ERP's own claim status live, mapped to exactly one of `Submitted`, `Approved`, `Paid`, `Rejected`, plus `Status not recognised (<raw value>)` for anything else. An unrecognised value is shown raw, not coerced to the nearest known status.
- [ ] The payment date and amount render **only** when the ERP supplies them, each with an explicit currency code. An unmapped amount renders `not configured`, never `0`.
- [ ] **Negative — ERP unreachable.** `Claim status could not be retrieved from the ERP`; the ServiceNow-side state still renders. Never `0`, never an implied `Rejected`.
- [ ] **Negative — claim reference missing.** A claim whose `erp_claim_reference` is empty (write never confirmed) shows `Not yet recorded in the ERP` and issues no status call.
- [ ] A status of `Rejected` renders the ERP's reason where supplied; where not supplied it renders `Rejected — no reason supplied by the ERP`, not a blank.

### ServiceNow Implementation Notes
- Module: Employee Center Pro / RITM view
- Table(s): `x_..._object_map` (`expense_claim`)
- Components: live status read at render
- Doc reference: INT-16; BRD R4

### Story Points: 3
### Priority: Medium (P1)
### Dependencies: NV-34

---

# Epic H — HR Document Center (R5 + D1–D10 · P1 pattern, P0-labelled documents)

**Priority conflict, flagged not resolved.** BRD §6.2 places **R5 at P1** and freezes the first
release to R1/R2/R3. BRD §6.1a places **D1, D2 and D3 at P0**. Both cannot be literally true: D1–D3
are instances of the R5 pattern and cannot ship before it. This backlog follows **§4.3 and §6.2** —
R5 and all ten documents are P1 — and records the contradiction as **OQ-1**. The one partial
exception is honest: **D3 (payslip reissue) genuinely reuses the R1 read path** and could ship in the
first release as a re-download of an existing period without the R5 generate/archive machinery.
NV-39 splits on exactly that line.

---

## Story NV-36: The HR Document Center category and the generic R5 pattern (INT-17)

**As an** employee
**I want** one catalog category where document requests are ordered, generated from live ERP data and attached to my own request
**So that** I download the document from the request I raised, with no email and no portal hop

### Acceptance Criteria
- [ ] A Service Catalog category `HR Document Center` exists in Employee Center Pro containing the ten items D1–D10; items whose `object_map` or template is not configured are **not published** to the category rather than published-and-broken.
- [ ] A `document_template` table maps each document type to the exact set of logical fields it needs (`document_type`, `logical_object`, `logical_field`, `placeholder`, `mandatory`). Template-to-field mapping is configurable per document type without code.
- [ ] Generation performs a **live** read of only the mapped fields (INT-17). No document data is staged; a test asserts zero `erp_staging` rows for `employee_profile` and `payroll_record` after a generation. (DL-D2, BRD O3.)
- [ ] **A document that cannot be generated correctly is not generated.** If any `mandatory=true` placeholder resolves to no value, generation aborts, no PDF is produced, no attachment is created, and the RITM shows `Could not be generated — <field label> was not returned by the ERP.` Rendering the document with a blank, an em-dash, or `0` in place of a missing value fails this AC absolutely. (Repo rules 3 and 4.)
- [ ] The output is a real PDF: first bytes `%PDF-`, and a test opens it. An HTML file named `.pdf` fails absolutely. (Repo rule 2.)
- [ ] The generated PDF is attached to the RITM. Attachment read access is restricted to the requester and the authorised HR group, matching the case's own ACL; a test as an unrelated employee re-reads the attachment and asserts denial (trap 4 — assert on the read, not the status code).
- [ ] **Negative — ERP unreachable at generation.** No PDF, RITM shows `The ERP did not answer — the document was not generated. Your request remains open.` No fallback to a previously generated copy, because a stored copy is the shadow HR database DL-D2 exists to prevent.
- [ ] **Negative — template references a logical field with no `field_map`.** The item is unpublished (see AC 1) and the control tower names the missing mapping.
- [ ] The generated PDF is not retained in ServiceNow beyond the RITM attachment; **flagged gap** — neither document states a retention period for the RITM copy (OQ-7).
- [ ] **Vault (2026-08-23): the "which side renders the PDF" gap is closed — ServiceNow renders it, and there is a reference implementation.** `Unit4_ERP_Integration_Compendium_ServiceNow.md` §8 names the action *"Generate document template - HTML — converts generated HTML into a PDF attachment"*, and §8.1 gives the full Promotion Letter path: trigger on the HR Task for the Salary Changes and Promotions template → select the ERP Connection Alias **from company data** → look up the parent case and employee HR profile → set ERP Company ID and ERP Employee ID from the HR profile → generate HTML and convert to PDF → invoke the document-send integration → **log and terminate on document-generation or ERP-send errors** → move the attachment from case to task. Two details this backlog had not specified and should adopt: the **connection alias is resolved per company**, not per system (a multi-company tenant needs one alias each), and the flow **terminates on a generation error rather than continuing to archival** — which is repo rule 3 arriving from a working deployment. This also confirms D8 (Amendment Letter, NV-42) has a direct precedent.

### ServiceNow Implementation Notes
- Module: Service Catalog / Employee Center Pro / HRSD
- Table(s): new `x_..._document_template`; `x_..._doc_request`, `x_..._doc_audit` (reuse from L6); `sc_req_item`, `sys_attachment`
- Components: existing L6 template-to-field rendering (reuse), PDF generation (see OD2 detail on PDF generation on this instance), attachment ACL
- Doc reference: INT-17; BRD R5 steps 1–4; BRD §6.1a design notes; `docs/decision-log.md` DL-D2, DL-D10, OD2

### Story Points: 13
### Priority: Medium (P1 per BRD §6.2 — see the priority conflict banner above)
### Dependencies: NV-13, NV-17, NV-10

---

## Story NV-37: Idempotent archival of the generated PDF back to the ERP (INT-18)

**As an** HR/Finance Systems Owner
**I want** every issued document filed against the employee's ERP personnel file exactly once
**So that** the ERP holds the system-of-record copy of what was issued to whom and when

**Flags:** conflicts with **DL-D3** — this is a write, and it is the half of R5 the BRD calls the point (`docs/noviq-brd-trd-alignment.md` §5). Blocked on NV-3 and NV-5.

### Acceptance Criteria
- [ ] On successful generation (and, for gated items, on release), the same PDF bytes are uploaded to the ERP tagged with the document type/category from `document_template`. `erp_write.erp_ack_ref` records the ERP's attachment reference.
- [ ] **Idempotency, proven.** Two dispatches for the same RITM produce exactly **one** archived copy ERP-side. A test asserts the ERP-side count via INT-19. This is the BRD's explicit key requirement for R5.
- [ ] The archived copy is byte-identical to the RITM attachment; a test compares hashes.
- [ ] A document type with no `document_type_category` configured is refused before dispatch (NV-20).
- [ ] **Negative — archival fails, generation succeeded.** The employee **keeps** the RITM attachment; the archival is queued for retry and an `erp_exception` is raised. Deleting the employee's copy because archival failed fails this AC. The RITM shows `Issued. ERP archival pending.` — never `Archived` before `confirmed`.
- [ ] **Negative — timeout with no response.** The retry runs the existence check (NV-4) before re-uploading; a second copy is never created.
- [ ] **Negative — oversize / rejected MIME.** Refused before transfer per NV-11 with the ERP's stated limits named.
- [ ] **Negative — the ERP has no attachment-upload capability.** The `erp_scope_grant` for `erp_attachment.create` is absent, archival is not attempted, and the control tower records the **vendor gap** explicitly: `<system> does not expose document archival — R5 archival unavailable.` The item still generates and attaches; it does not silently pretend to archive. (BRD §11 Q6 names this as one of the two hardest capabilities to confirm for any ERP.)
- [ ] Every archival writes an `erp_write` row with `source_case` = the RITM (NV-8), and contains no document content in any log table.

### ServiceNow Implementation Notes
- Module: Service Catalog / Flow Designer
- Table(s): `x_..._erp_write`, `x_..._object_map` (`erp_attachment`), `x_..._document_template`
- Components: `binary-client.ts` upload (NV-5), idempotency key (NV-4), existence check via INT-19
- Doc reference: INT-18; BRD R5 step 5 and key requirements; BRD §7 Idempotent writes; BRD §11 Q6; `docs/noviq-brd-trd-alignment.md` §5, §6.2

### Story Points: 13
### Priority: Medium (P1)
### Dependencies: NV-3, NV-4, NV-5, NV-11, NV-20, NV-36

---

## Story NV-38: List previously archived documents for audit and reconciliation (INT-19)

**As a** Compliance officer
**I want** to list what has been archived against an employee ERP-side and compare it to what ServiceNow issued
**So that** a gap between issued and archived is found by a report rather than by an audit finding

### Acceptance Criteria
- [ ] An HR-facing view lists ERP-side archived documents for an employee (`document_type_category`, `file_name`, `uploaded_date`, `erp_attachment_reference`) read live via INT-19.
- [ ] A reconciliation view joins that list to `erp_write` rows with `logical_object=erp_attachment` and reports three counts: issued-and-archived, issued-not-archived, archived-with-no-ServiceNow-record.
- [ ] Each of the three counts renders `0` **only** under a successful read on both sides. If either side failed, the count renders `Could not be reconciled — <side> did not answer` and no number.
- [ ] The reconciliation view doubles as the existence check backing NV-4 for archival; a single implementation serves both.
- [ ] **Negative — the ERP exposes upload but not list.** The reconciliation view is not rendered and the control tower states `<system> exposes archival upload but no archived-document listing — archival cannot be reconciled.` Presenting an empty reconciliation as "all reconciled" fails this AC.
- [ ] No document content is retrieved by this view; metadata only.

### ServiceNow Implementation Notes
- Module: HRSD agent workspace / reporting
- Table(s): `x_..._erp_write`, `x_..._object_map` (`erp_attachment`)
- Components: live list read, reconciliation report
- Doc reference: INT-19; BRD R5 (audit); TRD §5 Audit trail

### Story Points: 5
### Priority: Medium (P1)
### Dependencies: NV-37

---

## Story NV-39: D1, D3 — the auto-issue P0-labelled documents

**As an** employee
**I want** an employment verification letter and a duplicate payslip issued without an HR sign-off
**So that** the highest-frequency, lowest-friction requests self-serve

### Acceptance Criteria
- [ ] **D1 Employment Verification Letter.** Template pulls `job_title`, `start_date`, `contract_type`, `employment_status`. All four are `mandatory=true`; a missing one aborts generation per NV-36 rather than issuing a letter with a gap.
- [ ] D1 has **no** `write_approval_policy` row; the PDF attaches and archival fires on generation. Adding an approval step fails this AC unless a new requirement is recorded.
- [ ] **D3 Payslip Reissue.** The item takes a period from the NV-24 list and re-delivers the existing payslip document via the NV-25 path. **It does not generate a new PDF** and does not render a payslip from data — a rendered payslip is not the payslip that was issued.
- [ ] D3's delivered file is byte-identical to the ERP's stored payslip; a test compares hashes with a direct NV-25 download.
- [ ] D3 is the only Epic H item shippable in the first release, because it needs NV-24/NV-25 and not NV-36/NV-37. Its dependencies reflect that.
- [ ] **Negative — the requested period has no document.** D3 shows `No payslip document exists for <period>` and issues nothing. It never falls through to generating one.
- [ ] **Negative — employment status is `terminated`.** D1 still issues where the template supports past employment; where the template does not, the item is not orderable for terminated users and states why. Issuing a present-tense verification for a terminated employee fails this AC.

### ServiceNow Implementation Notes
- Module: Service Catalog
- Table(s): `x_..._document_template`
- Components: two catalog items, two template row sets
- Doc reference: BRD §6.1a D1, D3; BRD §6.1a design note ("D3 literally reuses R1's read path")

### Story Points: 5
### Priority: Medium for D1 (P1, gated behind the R5 pattern) · High for D3 (P0-shippable via the R1 path)
### Dependencies: D1 → NV-36, NV-37 · D3 → NV-24, NV-25

---

## Story NV-40: D2 — Salary / Income Certificate, approval-gated

**As an** HR Business Partner
**I want** every salary certificate to pass a human sign-off before release
**So that** an income figure leaves the organisation only when someone accountable released it

### Acceptance Criteria
- [ ] `write_approval_policy` carries a row for `document.D2` citing BRD §6.1a. The RITM attachment is **not created** and archival does not fire until an approved `sysapproval_approver` record exists whose `sys_updated_on` precedes release.
- [ ] **The employee cannot see the PDF before approval.** A test as the requester attempts to read the attachment pre-approval, **re-reads**, and asserts no attachment exists — not merely that a UI control is hidden.
- [ ] Salary data is read live at generation and **never persisted** in any app table. A test greps `doc_audit`, `call_log`, `erp_write` and `erp_staging` for the seeded salary figure and asserts zero hits. (DL-D2, DL-D10.)
- [ ] Template pulls `gross_salary`, `net_salary`, `salary_history`, `contract_type`, each with an explicit currency code. An unmapped `currency` aborts generation — a certificate with a bare number is not issued.
- [ ] **Negative — approval rejected.** No attachment, no archival, RITM closed incomplete with `Approval rejected`. No PDF exists anywhere; a test asserts `sys_attachment` count unchanged.
- [ ] **Negative — ERP unreachable at generation.** No PDF and no fallback to a prior certificate.
- [ ] **Negative — approval granted, archival fails.** Employee keeps the attachment, archival retries per NV-37; the RITM shows `Issued. ERP archival pending.`
- [ ] No Release control is rendered before the approval exists. (Repo rule 1.)

### ServiceNow Implementation Notes
- Module: Service Catalog / Flow Designer
- Table(s): `x_..._document_template`, `x_..._write_approval_policy`, `sysapproval_approver`
- Components: approval subflow, deferred attachment creation, sensitive-field exclusion
- Doc reference: BRD §6.1a D2; BRD §7 Approval integrity; `docs/decision-log.md` DL-D2, DL-D10

### Story Points: 8
### Priority: Medium (P1 — see the Epic H priority conflict banner; BRD §6.1a labels D2 P0)
### Dependencies: NV-9, NV-36, NV-37

---

## Story NV-41: D4, D5, D10 — the remaining auto-issue documents

**As an** employee
**I want** my annual tax statement, leave balance certificate and pension/benefits contribution statement on request
**So that** external processes that need proof are unblocked without an HR ticket

### Acceptance Criteria
- [ ] **D4 Annual Income & Tax Statement.** Sources from `income_statement` via NV-26 — no second read path. Where the ERP serves a document rather than data, the NV-25 streaming rules apply and no PDF is generated.
- [ ] **D5 Leave Balance Certificate.** Sources from `leave_balance` via NV-27. Every balance on the certificate prints its **unit** and its `as_of_date` with date and time. A balance without a unit aborts generation.
- [ ] **D10 Pension / Benefits Contribution Statement.** Sources from `benefit_enrollment` contribution history (NV-21). Because the entity is P2, D10 is unpublished until `benefit_enrollment` has a configured `object_map`; it is never published with an empty statement.
- [ ] None of the three has a `write_approval_policy` row.
- [ ] **Negative — zero balance on D5.** Prints `0 days` only under a successful read returning zero, and the certificate states the as-of date. A failed read aborts generation rather than certifying a zero balance. **This is the sharpest `0` risk in the backlog** — a certified zero balance is acted on by a new employer.
- [ ] **Negative — partial contribution history on D10.** If the ERP returns a truncated history, the certificate is not issued; the RITM states `Contribution history was incomplete — the statement was not generated.` A statement covering an unknown subset of the history fails this AC.
- [ ] Localisation applies per NV-43 for D4, which carries jurisdiction-specific legal wording.

### ServiceNow Implementation Notes
- Module: Service Catalog
- Table(s): `x_..._document_template`
- Components: three catalog items, three template row sets, reuse of NV-26/NV-27/NV-21 reads
- Doc reference: BRD §6.1a D4, D5, D10; TRD §3 IncomeStatement, LeaveBalance, BenefitEnrollment

### Story Points: 8
### Priority: Medium for D4, D5 (P1) · Low for D10 (P2)
### Dependencies: NV-36, NV-37, NV-26, NV-27, NV-21, NV-43

---

## Story NV-42: D6, D7, D8, D9 — the remaining approval-gated documents

**As an** HR Business Partner
**I want** work certificates, final settlements, contract copies and visa letters to pass a sign-off before release
**So that** documents with legal or immigration consequence are not auto-issued

### Acceptance Criteria
- [ ] Each of D6, D7, D8, D9 has a `write_approval_policy` row citing BRD §6.1a. For each, a test asserts the attachment does not exist pre-approval by **re-reading**, not by checking a UI state.
- [ ] **D6 Work Certificate / Employment History.** Needs full position history — a logical object the current model does not carry. `employee_profile` gains `position_history` as a child collection, or D6 is unpublished with `Position history is not available from <system>`. Inventing a flattened single-position substitute fails this AC.
- [ ] **D7 Final Settlement Statement.** Only orderable against a case with a confirmed termination (NV-45). Ordering it for an active employee is refused with `Final settlement requires a confirmed termination date.` Needs `termination_date`, `final_pay_calculation`, `leave_payout` — the latter two are **not modelled by the TRD** and are flagged as OQ-6.
- [ ] **D8 Contract Copy / Amendment Letter.** Where the ERP holds the signed contract as a document, it is **retrieved and delivered** via NV-25, not regenerated. A regenerated "copy" of a signed contract is not a copy and fails this AC.
- [ ] **D9 Visa / Immigration Support Letter.** Pulls `employment_status`, salary with explicit currency, and `contract_end_date`. A permanent contract with no end date prints `Permanent — no end date`, **never** a blank and never `0`.
- [ ] **Negative — approval rejected on any of the four.** No attachment, no archival, `sys_attachment` count unchanged, RITM closed incomplete.
- [ ] **Negative — ERP unreachable.** No document, no fallback copy.
- [ ] D6 and D7 carry jurisdiction-specific wording and depend on NV-43.

### ServiceNow Implementation Notes
- Module: Service Catalog / Flow Designer
- Table(s): `x_..._document_template`, `x_..._write_approval_policy`
- Components: four catalog items, approval subflow reuse, `position_history` child collection
- Doc reference: BRD §6.1a D6–D9; BRD §7 Approval integrity, Localisation

### Story Points: 13
### Priority: Medium for D6, D7 (P1) · Low for D8, D9 (P2)
### Dependencies: NV-9, NV-36, NV-37, NV-43 · D7 also NV-45

---

## Story NV-43: Per-jurisdiction template content, with integration logic held constant

**As an** HR operations lead in a second country
**I want** to add a country's legal wording as template content
**So that** a new jurisdiction is a configuration change, not a code change

### Acceptance Criteria
- [ ] `document_template` gains `country` and `language`; template resolution is by (`document_type`, `country`, `language`) with a documented fallback order, and the resolved combination is recorded on the RITM.
- [ ] Adding a country requires **zero** changes to `object_map`, `field_map`, the connector, or any script. A test adds a country by data only and generates successfully.
- [ ] **Negative — no template for the employee's country.** The item is not orderable for that user and states `This document is not available for <country> yet.` Falling back to another country's template fails this AC — the wrong legal wording is worse than no document.
- [ ] Country-specific **fields** (not just wording) are supported: a template may declare a field mandatory in one country and absent in another, and the mandatory-field abort in NV-36 respects the resolved template.
- [ ] The resolved `country`/`language` appear in the generated PDF's metadata and on the audit row.

### ServiceNow Implementation Notes
- Module: Service Catalog
- Table(s): `x_..._document_template`
- Components: template resolution Script Include, fallback order documented in the app docs
- Doc reference: BRD §6.1a Localisation note; BRD §7 Localisation; BRD §9 cross-jurisdiction risk

### Story Points: 5
### Priority: Medium (P1)
### Dependencies: NV-36

---
# Epic I — Employment Lifecycle Changes (R6, R8 · P1)

---

## Story NV-44: Contract, role or compensation change with an effective date (R6, INT-06)

**As an** HR Business Partner
**I want** an approved promotion, salary review or department change written to the ERP with an effective date that respects payroll cut-off
**So that** the change lands in the right payroll cycle and is auditable

**Flags:** conflicts with **DL-D3** — this is a write. Blocked on NV-3.

### Acceptance Criteria
- [ ] A multi-step approval chain (manager → HR → Finance where `change_type=salary`) completes in ServiceNow before dispatch. `write_approval_policy` carries a row for `compensation_change.update` citing BRD R6 and §7.
- [ ] The write carries `effective_date`, `old_value`, `new_value`, `change_type` and `approval_reference`. An empty `effective_date` is refused (NV-21).
- [ ] **Cut-off.** A change whose effective date falls in a locked period is `blocked_cutoff` and the case shows the NV-7 message naming the next cycle and its pay date. It is queued, not sent and not dropped, and it dispatches automatically when the next period opens.
- [ ] `new_value` for salary is `sensitive=true`: a test greps `call_log`, `erp_write`, `erp_exception` and `doc_audit` for the seeded figure and asserts zero hits.
- [ ] The compensation scope grant (NV-2) is a **distinct** ERP role from the general employee-update grant.
- [ ] **Negative — Finance approval missing on a salary change.** Dispatch is blocked even when manager and HR approved; a test asserts zero outbound requests and `state=blocked_approval`.
- [ ] **Negative — retry.** Two dispatches produce one logical change; a test reads the ERP value and asserts it equals `new_value` exactly once, with no duplicated effective-dated row.
- [ ] **Negative — validation failure.** 422 non-retriable with the ERP's message; the approval is not consumed and a corrected resubmission requires a fresh approval chain.
- [ ] **Negative — timeout.** The case shows `Sent to the ERP, awaiting confirmation` and never `Applied` before `confirmed`.
- [ ] **Negative — permission denied.** 403 non-retriable, exception queue, and a note that the compensation scope grant may be wrong.

### ServiceNow Implementation Notes
- Module: HRSD case type / Flow Designer
- Table(s): `x_..._erp_write`, `x_..._object_map` (`compensation_change`), `payroll_calendar`
- Components: multi-stage approval flow, cut-off resolver, sensitive-field exclusion
- Doc reference: INT-06; BRD R6 and its effective-dating note; BRD §7 Payroll cut-off, Approval integrity; BRD §9 risk 2

### Story Points: 13
### Priority: Medium (P1)
### Dependencies: NV-3, NV-4, NV-7, NV-9, NV-21, NV-2

---

## Story NV-45: Offboarding — orchestration-only first, with termination as a status change (R8, INT-07)

**As a** Compliance officer
**I want** the first release to orchestrate offboarding with a manual ERP confirmation step, and any later automatic write to be a status change and never a delete
**So that** an ex-employee is never paid or left with access because an automated write misfired

**Flags:** conflicts with **DL-D3** for the phase-2 write half. Phase 1 is orchestration only and is not blocked on NV-3.

### Acceptance Criteria
- [ ] **Phase 1 (first delivery), orchestration only.** The offboarding case captures last working day and reason, tracks IT/asset revocation tasks, and presents HR with a **manual confirmation task**: "record the termination in the ERP, then confirm here." No automatic ERP write is issued and **no Submit-to-ERP control is rendered**. The case cannot close until the confirmation task is completed and its completer recorded. (Repo rule 1; BRD R8 recommendation.)
- [ ] Phase 1 verifies the manual entry by reading the ERP back (INT-01) and comparing `employment_status` and `end_date` to the case values. A mismatch blocks case closure with `The ERP shows <status>/<end date>, the case records <status>/<end date>.`
- [ ] **Phase 2 (later), automatic write.** `write_approval_policy` carries a row for `employee_profile.terminate` citing BRD R8 and §7. Dispatch requires the approval and passes the cut-off gate (NV-7).
- [ ] **Termination is a status change, never a delete.** The `object_map` for `employee_profile.terminate` may only bind to an update/status operation; binding it to a DELETE verb is rejected at save with `Offboarding must be a status change, not a hard delete (TRD §5).`
- [ ] `erp_employee_id` is retained after termination and never reassigned (NV-10).
- [ ] **Negative — retry.** Two dispatches produce one termination; a re-terminate of an already-terminated record is confirmed via existence check, not re-sent.
- [ ] **Negative — timeout.** The case never shows `Terminated in the ERP` for a write not `confirmed`, and the IT/asset revocation tasks proceed independently of the ERP write state — access revocation must not wait on payroll.
- [ ] **Negative — validation failure or permission denied.** Exception queue with the ERP's message; the case stays open and the manual confirmation task is re-raised.
- [ ] D7 Final Settlement Statement (NV-42) is orderable only after termination is confirmed, phase 1 or phase 2.

### ServiceNow Implementation Notes
- Module: HRSD offboarding case type / Flow Designer
- Table(s): `x_..._erp_write`, `x_..._object_map` (`employee_profile`), HRSD case + task tables
- Components: manual-confirmation task, ERP read-back comparison, operation-verb guard at map save
- Doc reference: INT-07; BRD R8 and its "orchestration-only in the first release" recommendation; TRD §5 Deletion vs status change

### Story Points: 8
### Priority: Medium (P1 — phase 1) · Medium (P1, later) for phase 2
### Dependencies: Phase 1 → NV-10, NV-31 · Phase 2 → NV-3, NV-4, NV-7, NV-9, NV-17

---

# Epic J — Benefits & Time (R9, R10 · P2)

---

## Story NV-46: Benefits and pension enrollment view and change (R9, INT-20, INT-21)

**As an** employee
**I want** to see my current benefit enrollments and change them, effective from the correct payroll period
**So that** a deduction change takes effect when I expect it to

**Flags:** conflicts with **DL-D3** for the change half. Blocked on NV-3.

### Acceptance Criteria
- [ ] A widget renders current enrollments (INT-20) live: benefit type, plan/option, contribution amount with explicit currency, effective date.
- [ ] A contribution amount of `0` renders **only** under a successful read returning zero (e.g. an opted-out scheme). A failed or unmapped read renders `ERP did not answer` / `not configured`.
- [ ] Available plan options are read from the ERP as reference data — never hard-coded, never free-text. With no reference data available, the change item is not orderable and states why. (Repo rule 5.)
- [ ] A change (INT-21) is approval-gated where the organisation's policy requires it; the policy row is configurable rather than assumed. **Flagged assumption:** the BRD does not mark R9 approval-gated — this backlog therefore ships **no** default approval row for R9 and makes one addable. Recorded as OQ-5.
- [ ] **Cut-off.** A change whose effective date falls in a locked period is `blocked_cutoff` with the NV-7 message. R9 is explicitly named in BRD §7 as payroll-affecting.
- [ ] **Negative — retry / timeout / validation failure / permission denied.** All four behave per NV-3, NV-4 and NV-12; the RITM never shows `Enrolled` before `confirmed`.
- [ ] Feeds D10 (NV-41) without a second read path.

### ServiceNow Implementation Notes
- Module: Employee Center Pro / Service Catalog
- Table(s): `x_..._erp_write`, `x_..._object_map` (`benefit_enrollment`), `payroll_calendar`
- Components: widget, catalog item, reference-data-backed option list
- Doc reference: INT-20, INT-21; BRD R9; TRD §3 BenefitEnrollment

### Story Points: 8
### Priority: Low (P2 per BRD §6.2)
### Dependencies: NV-3, NV-4, NV-7, NV-9, NV-21, NV-13

---

## Story NV-47: Timesheet entry against a validated cost centre or project (R10, INT-22, INT-23)

**As an** employee
**I want** to log time against a cost centre or project that the ERP will actually accept
**So that** costing and client billing are correct and my entry is not rejected after the fact

**Flags:** conflicts with **DL-D3** for the submit half. Blocked on NV-3.

### Acceptance Criteria
- [ ] The cost-centre/project picker is populated from `cost_centre_project_ref` (INT-22), cached with its age displayed, filtered to `active=true`.
- [ ] **Negative — reference data unavailable and no cache.** The entry form is **not rendered**; `Cost centres unavailable — the ERP did not answer.` A free-text cost centre fails this AC absolutely: an invented cost centre code posts real cost to the wrong place.
- [ ] Submission (INT-23) writes one `timesheet_entry` per row via the NV-3 path with the NV-4 idempotency key.
- [ ] **Negative — retry.** Two dispatches produce exactly one entry per row; a test asserts the ERP-side hours total is not doubled. A doubled timesheet is a billing incident.
- [ ] **Negative — inactive cost centre selected from a stale cache.** The ERP's 422 is rendered against the row, the cache is invalidated, and the picker refreshes.
- [ ] **Negative — timeout / permission denied.** Per NV-3 and NV-12; the entry never shows `Submitted` before `confirmed`.
- [ ] Hours of `0` are only submittable where the ERP accepts a zero entry; otherwise refused at validation with the ERP's stated rule, not silently dropped.
- [ ] **Landscape check, mandatory before build.** BRD R10 warns this frequently duplicates capability the organisation already runs natively in the ERP. This story is not started until the NV-52 landscape discovery for the deployment records whether an existing native timesheet workflow is in use.

### ServiceNow Implementation Notes
- Module: Employee Center Pro / Service Catalog
- Table(s): `x_..._erp_write`, `x_..._object_map` (`timesheet_entry`, `cost_centre_project_ref`)
- Components: cached reference picker, multi-row submission, idempotency per row
- Doc reference: INT-22, INT-23; BRD R10 and its duplication warning; TRD §3 TimesheetEntry, CostCentre/Project

### Story Points: 8
### Priority: Low (P2 per BRD §6.2)
### Dependencies: NV-3, NV-4, NV-21, NV-52

---

# Epic K — Non-Functional, Governance & Store Certification

---

## Story NV-48: Data minimisation — no shadow master data, provably

**As a** Data Protection Officer
**I want** evidence that ServiceNow holds case metadata and status but not a copy of ERP master data
**So that** the lawful basis and data-minimisation position survive review

### Acceptance Criteria
- [ ] A standing automated check asserts zero `erp_staging` rows for `employee_profile`, `payroll_record`, `payslip_document`, `income_statement`, `leave_balance`, `benefit_enrollment` and `compensation_change`. It runs on every build and fails the build on a hit. (BRD O3; DL-D2.)
- [ ] A seeded-sensitive-value sweep greps `call_log`, `erp_write`, `erp_exception`, `doc_audit`, `sys_email` and `syslog` for a seeded IBAN, a seeded salary and a seeded national ID, asserting zero hits in each. The sweep runs in CI.
- [ ] `hr` and `payroll` remain absent from the staging category choice list; adding them requires a logged decision. (Carries the existing DL-D2 guard forward.)
- [ ] Every table this backlog creates declares a retention setting; a table with no retention setting renders `Retention not set` in a governance report rather than defaulting. **Flagged gap:** neither document states a document or audit retention period (OQ-7).
- [ ] Data residency: the deployment records the ServiceNow instance's processing location and which of the flows transit personal data, as a reviewable record. **Flagged gap:** BRD §11 Q4 leaves the DPO's residency position open (OQ-3).
- [ ] Personal data captured in a case that is never dispatched to the ERP (rejected approval, abandoned request) is subject to the same retention setting as a dispatched one; there is no untracked residue.

### ServiceNow Implementation Notes
- Module: platform governance
- Table(s): all app tables
- Components: CI assertion script, staging-category guard, governance report
- Doc reference: BRD §7 Data protection; BRD O3; BRD §11 Q4; `docs/decision-log.md` DL-D2

### Story Points: 5
### Priority: High (P0 — the P0 scope already handles payroll and banking data)
### Dependencies: NV-13, NV-17

---

## Story NV-49: ServiceNow Store technical and security review readiness

**As a** ServiceNow Platform Owner
**I want** the app to satisfy Store technical and security review criteria from the first release
**So that** certification is a checklist run rather than a rebuild

### Acceptance Criteria
- [ ] All application code is in the scoped application; a query of `sys_metadata` for records created by this app in `Global` returns zero rows attributable to it. (Note: filter on business fields — filtering on `sys_created_on` or `sys_class_name` on app tables returns 403 even as admin.)
- [ ] No credential, token or secret is stored in any app record; credentials resolve through Connection & Credential Aliases only (NV-1).
- [ ] Every table has explicit ACLs; every deny rule sets `adminOverrides` **explicitly** (trap 3). A test enumerates app ACLs and fails on any deny rule with `adminOverrides` unset.
- [ ] Every ACL test asserts by **re-reading the value**, and writes a control field in the same request so a silent Shape-A deny is distinguishable from a broken test (trap 4). A test suite asserting only on HTTP status fails this AC.
- [ ] No `eval`, no `gs.nowDateTime()` in scoped code, no `var` in Fluent files, and every relative import under `src/server/` carries the `.ts` extension (trap 1, DL-D19). Enforced by a build-time lint that fails the build.
- [ ] A certification evidence pack is produced against a `sandbox` `erp_system` only (NV-15), containing: ACL matrix, outbound endpoint inventory with the data classes each carries, error-handling behaviour per category (NV-12), and the data-minimisation sweep results (NV-48).
- [ ] Uninstall behaviour is documented and tested: deleting a Fluent `Table()` does **not** drop the table and leaves an unprotected shell; uninstall defaults to "Retain tables and data" (trap 8). The evidence pack states this explicitly rather than claiming a clean uninstall.
- [ ] Every scheduled job ships `active: false` + `on_demand`; a job shipping armed fails this AC. (Repo rule 4; L3-D8.)

### ServiceNow Implementation Notes
- Module: platform / app packaging
- Table(s): `sys_app`, `sys_metadata`, `sys_security_acl`
- Components: build-time lint, ACL enumeration test, evidence pack generator
- Doc reference: BRD O4; BRD §7 Store certification readiness; BRD §10; CLAUDE.md traps 1, 3, 4, 8

### Story Points: 8
### Priority: High (P0 — "designed against Store requirements from the outset")
### Dependencies: NV-1, NV-8, NV-12, NV-15, NV-48

---

## Story NV-50: Usage telemetry per requirement area

**As a** product owner
**I want** to see which of the ten requirement areas are used, by whom, at what volume
**So that** P2 scope is decided by demand rather than by guess, and the pilot's success criteria are measurable

### Acceptance Criteria
- [ ] Every employee-facing action records a telemetry row: `requirement_area` (R1–R10 or D1–D10), `action` (`view` | `submit` | `download`), `persona_role`, `outcome` (`success` | `failed` | `not_configured` | `blocked_approval` | `blocked_cutoff`), `timestamp`, `erp_system`. No personal data and no business values are recorded — a test greps the telemetry table for a seeded salary and IBAN and asserts zero hits.
- [ ] A dashboard reports volume by requirement area and by outcome. An area with no usage renders `No usage recorded` — **never** `0 requests`, since the two are different findings and only one of them means "employees do not want this".
- [ ] Failure outcomes are reported alongside success, so an area that looks unused because it is broken is distinguishable from one that is genuinely unwanted.
- [ ] Manual-re-keying baseline: the dashboard supports a before/after comparison for the three P0 areas, as BRD §10 requires. The baseline figure is entered by the organisation, not inferred — a computed baseline fails this AC.
- [ ] **Negative — telemetry write fails.** The employee-facing action still completes; telemetry is best-effort and never blocks a user transaction. A failed telemetry write is logged, not surfaced to the employee.

### ServiceNow Implementation Notes
- Module: platform / Performance Analytics or a scoped telemetry table
- Table(s): new `x_..._usage_event`
- Components: instrumentation hook in the shared read/write paths, dashboard
- Doc reference: BRD O5; BRD §10 Success criteria; BRD §11 Q1

### Story Points: 5
### Priority: High (P0 — O5 and §10 both require it from the pilot onward)
### Dependencies: NV-13, NV-3

---

## Story NV-51: A country-aware data model from the outset

**As an** implementation architect
**I want** jurisdiction-specific fields and categories supported by the data model rather than bolted on
**So that** the second country does not require a schema migration

### Acceptance Criteria
- [ ] `object_map` and `field_map` carry an optional `country` qualifier; resolution is by (`erp_system`, `logical_object`, `country`) with a documented fallback to the country-agnostic row.
- [ ] A field mandatory in one jurisdiction and absent in another is expressible as data; a test configures two countries with different mandatory sets and asserts both resolve correctly.
- [ ] `payroll_calendar` (NV-7), `document_template` (NV-43) and `write_approval_policy` (NV-9) all carry `country` and resolve with the same fallback rule. Three different fallback rules fail this AC.
- [ ] The employee's country is resolved from the ERP record, not from the ServiceNow user's location, and a mismatch between the two raises an exception-queue entry rather than silently preferring one.
- [ ] **Negative — no configuration for the employee's country and no country-agnostic fallback.** The affected item is not orderable and states `Not configured for <country>`. Silently using another country's configuration fails this AC.

### ServiceNow Implementation Notes
- Module: integration control tower
- Table(s): `x_..._object_map`, `x_..._field_map`, `x_..._payroll_calendar`, `x_..._document_template`, `x_..._write_approval_policy`
- Components: shared country-resolution Script Include used by all five tables
- Doc reference: BRD §7 Localisation; BRD §9 cross-jurisdiction risk; BRD §6.1a localisation note

### Story Points: 8
### Priority: High (P0 enabler — "from the outset" is the requirement; retrofitting is the risk)
### Dependencies: NV-2

---

## Story NV-52: Landscape discovery as a gate before any deployment build

**As a** delivery lead
**I want** a recorded landscape-discovery finding before scope is committed for an organisation
**So that** a fragmented HR/Finance estate is found during scoping rather than during build

### Acceptance Criteria
- [ ] A `landscape_discovery` record per deployment names, per requirement area R1–R10, which system is the authority: the core ERP, a separate cloud HCM, a separate expense system, or none identified. `None identified` is a valid and visible answer; a blank is not.
- [ ] A requirement area whose authority is a system other than the configured `erp_system` is marked `out of scope — authority is <system>` and its catalog items are **not published**. Publishing an item pointed at the wrong system of record fails this AC.
- [ ] R10 specifically records whether the organisation already runs a native ERP timesheet workflow (BRD R10 note); NV-47 is blocked on this field being answered.
- [ ] Multi-ERP orchestration is explicitly out of BRD scope (§4.2). A discovery record naming more than one authoritative system raises a scoping decision rather than triggering a build; the record states `Multi-system landscape — out of the current scope boundary (BRD §4.2).`
- [ ] **Negative — discovery not completed.** No catalog item in Epics C–J is published for that deployment. A deployment with an incomplete discovery record has an empty HR Document Center category rather than a partially-correct one.
- [ ] **Vault (2026-08-23): discovery must also answer build-vs-buy, which no story in this backlog asked.** Two ServiceNow-shipped products overlap this scope and the record must state, with a citation, why each was rejected or adopted for the deployment:
  - **Zero Copy Connector for ERP** — an official scoped app that queries the ERP system of record through **remote tables**, i.e. it serves BRD O3 ("no shadow master data") natively. Decisive limit, from the release notes through the Australia release: **SAP ECC and SAP S/4HANA are the only supported systems.** It therefore cannot serve an ERP-agnostic product and does not displace this backlog — but for a SAP-only deployment it may already be most of the read path, and committing to a custom build without recording that finding is the mistake this AC prevents.
  - **HRSD Advanced Integration with Workday / Oracle HCM / SuccessFactors** — ServiceNow ships these, including a *Get Time Off Balance* capability that is R3/INT-11 by another name. Irrelevant to Unit4, Cegid and PHC; decisive if the landscape turns out to hold one of those HCMs, which is exactly the fragmented-estate case BRD §9 risk 3 warns about.
- [ ] **Vault (2026-08-23): Cegid and PHC confirmed absent.** A full-vault search returns **zero** material on either. C4 stands unchanged: both ship every onboarding item `Not confirmed`, and the citation is that no research exists anywhere — not in this repo and not in the vault.

### ServiceNow Implementation Notes
- Module: platform / implementation governance
- Table(s): new `x_..._landscape_discovery`
- Components: Fluent `Table()`, publication guard on catalog items
- Doc reference: BRD §8 assumptions; BRD §9 risk 3; BRD §4.2; BRD §11 Q5

### Story Points: 3
### Priority: High (P0 — it gates everything else)
### Dependencies: none

---
# Coverage matrix

Every requirement ID in both documents appears below exactly once. A row with no story ID carries a
reason in the same row.

## BRD §6 — business requirements R1–R10

| ID | Requirement | Priority (BRD) | Stories |
|---|---|---|---|
| R1 | Payslip and tax document retrieval | P0 | NV-5, NV-13, NV-18, NV-24, NV-25, NV-26 |
| R2 | Personal data & banking details update | P0 | NV-3, NV-9, NV-17, NV-31, NV-32, NV-33 |
| R3 | Leave & absence request | P0 | NV-7, NV-19, NV-27, NV-28, NV-29, NV-30 |
| R4 | Expense claim & reimbursement | P1 | NV-11, NV-20, NV-34, NV-35 |
| R5 | ERP-sourced document generation & archival | P1 | NV-36, NV-37, NV-38, NV-43 (+ NV-39 – NV-42 for the ten items) |
| R6 | Contract, role or compensation change | P1 | NV-7, NV-21, NV-44 |
| R7 | Employee onboarding | P1 | NV-10, NV-22, NV-23 |
| R8 | Employee offboarding | P1 | NV-45 |
| R9 | Benefits & pension enrollment | P2 | NV-21, NV-46 |
| R10 | Timesheet / cost-centre allocation | P2 | NV-21, NV-47, NV-52 |

## BRD §6.1a — HR Document Center D1–D10

| ID | Document | Approval gated | Stories |
|---|---|---|---|
| D1 | Employment Verification Letter | No | NV-36, NV-37, NV-39 |
| D2 | Salary / Income Certificate | **Yes** | NV-9, NV-36, NV-37, NV-40 |
| D3 | Payslip Reissue (Duplicate) | No | NV-24, NV-25, NV-39 |
| D4 | Annual Income & Tax Statement | No | NV-26, NV-41, NV-43 |
| D5 | Leave Balance Certificate | No | NV-27, NV-41 |
| D6 | Work Certificate / Employment History | **Yes** | NV-9, NV-42, NV-43 |
| D7 | Final Settlement Statement | **Yes** | NV-9, NV-42, NV-45 |
| D8 | Employment Contract Copy / Amendment | **Yes** | NV-9, NV-25, NV-42 |
| D9 | Visa / Immigration Support Letter | **Yes** | NV-9, NV-42 |
| D10 | Pension / Benefits Contribution Statement | No | NV-21, NV-41, NV-46 |

## TRD §4 — ERP capabilities INT-01 to INT-23

| ID | Capability | Stories |
|---|---|---|
| INT-01 | Retrieve one employee by external ID | NV-31, NV-45 |
| INT-02 | Search/list employees | NV-22 |
| INT-03 | Create employee record | NV-23 |
| INT-04 | Update employee fields | NV-32 |
| INT-05 | Update banking/IBAN | NV-33 |
| INT-06 | Update position/compensation, effective-dated | NV-44 |
| INT-07 | Terminate/deactivate with end date and reason | NV-45 |
| INT-08 | List payslip periods/documents | NV-24 |
| INT-09 | Retrieve a payslip PDF | NV-5, NV-25 |
| INT-10 | Retrieve annual income/tax statement | NV-26 |
| INT-11 | Retrieve leave balances by type | NV-27 |
| INT-12 | Submit an approved leave request | NV-29 |
| INT-13 | Leave request status / cancellation | NV-30 |
| INT-14 | Leave types and reason codes (reference) | NV-28 |
| INT-15 | Submit expense claim with receipts | NV-34 |
| INT-16 | Retrieve expense claim status | NV-35 |
| INT-17 | Retrieve the field set a template needs | NV-36 |
| INT-18 | Upload a generated PDF, idempotent | NV-4, NV-5, NV-37 |
| INT-19 | List previously archived documents | NV-38 |
| INT-20 | Retrieve benefit enrollments | NV-46 |
| INT-21 | Submit a benefit enrollment change | NV-46 |
| INT-22 | Retrieve valid cost centres/projects | NV-47 |
| INT-23 | Submit a timesheet entry | NV-47 |

## TRD §2 — architecture principles (pass/fail)

| Principle | Stories |
|---|---|
| Authentication (token-based, no plaintext shared secret) | NV-1 |
| Authorization scope (least privilege) | NV-2 |
| Read pattern (synchronous, on-demand) | NV-13 |
| Write pattern (confirmable success/failure) | NV-3 |
| Identity linkage (stable external employee ID) | NV-10 |
| Idempotency | NV-4 |
| Error semantics (retriable vs non-retriable) | NV-12 |
| Data format (JSON, ISO 8601, explicit currency, PDF) | NV-14, NV-5 |
| Non-production environment | NV-15 |
| Throughput (rate limits, latency) | NV-16 |
| Versioning and deprecation policy | NV-6 |

## TRD §3 — data objects

| Entity | Stories |
|---|---|
| Employee | NV-17 |
| PayslipDocument | NV-18 |
| IncomeStatement | NV-18 |
| LeaveBalance | NV-19 |
| LeaveRequest | NV-19 |
| ExpenseClaim | NV-20 |
| Attachment | NV-20 |
| CompensationChange | NV-21 |
| BenefitEnrollment | NV-21 |
| TimesheetEntry | NV-21 |
| CostCentre / Project | NV-21 |

## TRD §5 — cross-cutting technical requirements

| Requirement | Stories |
|---|---|
| Payroll cut-off awareness | NV-7 |
| Audit trail attributable to the integration identity | NV-8 |
| Attachment size / MIME limits | NV-11 |
| Field-level permission clarity (banking, compensation) | NV-2, NV-33, NV-44 |
| Deletion vs status change on offboarding | NV-45 |

## TRD §6, §8, §9 — volume, vendor onboarding, method

| Requirement | Stories |
|---|---|
| §6 Volume & performance expectations | NV-16, NV-13 |
| §8 Vendor/partner onboarding expectations | NV-15 |
| §9 Mark each capability Confirmed / Partial / Unconfirmed; escalate Unconfirmed | NV-15 |

## BRD §7 — non-functional requirements

| NFR | Stories |
|---|---|
| Data protection / data minimisation | NV-48 |
| Identity (shared persistent employee ID) | NV-10 |
| Auditability | NV-8 |
| Approval integrity | NV-9 |
| Error handling (queue + actionable exception) | NV-12 |
| Idempotent writes | NV-4 |
| Payroll cut-off awareness | NV-7 |
| Store certification readiness | NV-49 |
| Localisation | NV-51, NV-43 |

## BRD §3, §8, §9, §10 — objectives, assumptions, risks, success criteria

| Item | Stories |
|---|---|
| O1 Eliminate manual re-entry | NV-3, NV-29, NV-32, NV-33, NV-44 |
| O2 Single self-service channel with live ERP data | NV-13, NV-24, NV-27, NV-31 |
| O3 ERP remains system of record, no shadow master data | NV-48, NV-13 |
| O4 Store-listable, certifiable integration | NV-49 |
| O5 Request volume/type visible as a usage signal | NV-50 |
| §8 Assumption — documented ERP API available | NV-15 |
| §8 Assumption — single design partner, list may re-prioritise | NV-50, NV-52 |
| §8 Assumption — single-ERP landscape per deployment | NV-52 |
| §9 Risk 1 — uneven API coverage | NV-15, NV-2 (a missing capability is an unpublished item, not a silent gap) |
| §9 Risk 2 — sensitive writes without approval controls | NV-9, NV-33, NV-44, NV-45 |
| §9 Risk 3 — fragmented HR/Finance landscape | NV-52 |
| §9 Risk 4 — R1/R5 harder to support than field sync | NV-5, NV-24, NV-37 (validate the binary path first) |
| §9 Risk 5 — cross-jurisdiction rules misconfigured | NV-51, NV-43 |
| §10 Success — Store certification | NV-49 |
| §10 Success — usage telemetry | NV-50 |
| §10 Success — no compliance/payroll incident in pilot | NV-7, NV-8, NV-9, NV-48 |
| §10 Success — measurable drop in manual re-keying for the P0 areas | NV-50 |

## Deliberately not covered

| Item | Why |
|---|---|
| BRD §4.2 — payroll calculation logic | Explicitly out of scope; stays in the ERP. No story, and none should be written. |
| BRD §4.2 — financial period-close, GL reconciliation, statutory reporting | Explicitly out of scope. |
| BRD §4.2 — multi-ERP orchestration | Explicitly out of scope. **NV-52 detects it and stops**, rather than building for it — that is the correct treatment of an out-of-scope condition that can still occur in the field. |
| BRD §4.2 — deep organisational-design workflows | Explicitly out of scope. |
| BRD §8 — pricing / commercial model | Explicitly out of scope for the BRD; not a build item. |
| BRD §6.1a "Open item: confirm the definitive top-10 ranking against real ticket data" | Not a build story. It is a discovery activity; NV-50's telemetry supplies the data once the pilot runs. Recorded as **OQ-1b**. |
| TRD §9 "How to use this document" (steps 1–3) | Method, not requirement. Its output is recorded by NV-15; the activity itself is a BA/architect task, not a story. |
| The existing app's 14 non-HR logical objects (finance, procurement, inventory, assets, manufacturing) | Outside both documents entirely (`docs/noviq-brd-trd-alignment.md` §3). Not in this backlog and not affected by it. |

---

# Assumptions and conflicts, stated explicitly

Per the BA rule that assumptions are flagged, never silently resolved.

## Conflicts with logged decisions

| # | Conflict | Decision | Stories affected | Treatment |
|---|---|---|---|---|
| C1 | The BRD requires ERP write-back across R2, R3, R4, R5, R6, R7, R8, R9, R10 | **DL-D3** defers write-back; `erp_system.read_only` makes the refusal structural | NV-3 (the reversal) and every write story: NV-23, NV-29, NV-30, NV-32, NV-33, NV-34, NV-37, NV-44, NV-45 phase 2, NV-46, NV-47 | **Not resolved here.** NV-3 is the reversal story and requires a new `OD` logged in `docs/decision-log.md` before build starts. Building writes without that OD is a governance failure. |
| C2 | TRD §2 forbids Basic auth in production | **OD38** records a *working* ServiceNow ↔ Unit4 integration authenticating with a ServiceNow Basic credential | NV-1 | **Not resolved here.** NV-1 implements a recorded-exception path so the conflict is visible in data. Escalate to the document owner: either TRD §2 gains an exception path or that deployment is declared non-compliant. |
| C3 | The BRD's R1 and R5 both require binary payloads | The connector is JSON-only; there is no attachment path in either direction | NV-5, NV-24, NV-25, NV-37 | **Build gap, not a vendor gap.** NV-5 closes it and is a P0 enabler. |
| C4 | The BRD's evaluated vendor set is Unit4, SAP, Cegid, PHC | This repo has implementation-grade Unit4 and verified SAP endpoints, and **zero research** on Cegid and PHC | NV-15 | **Not resolved here.** Cegid and PHC ship with every onboarding item `Not confirmed` and a citation saying no research exists. Seeding plausible values would violate repo rule 5 — blank beats wrong. |
| C5 | BRD §6.2 places R5 at P1 and freezes release 1 to R1/R2/R3; BRD §6.1a places D1, D2, D3 at P0 | — | Epic H, NV-39 | **Not resolved here.** This backlog follows §4.3/§6.2 (R5 and all ten documents are P1), except D3, which genuinely rides the R1 read path and is P0-shippable. Recorded as **OQ-1**. |

**No conflict where one might be assumed:** `DL-D2` (never stage payroll or employee master data)
*agrees* with BRD O3 and with R1's "never stored at rest in ServiceNow". It is preserved, not
overridden, throughout this backlog.

## Assumptions made in place of a clarifying question

| # | Assumption | Story | Question it stands in for |
|---|---|---|---|
| A1 | The PDF is rendered **in ServiceNow**, not in the ERP | NV-36 | OQ-9 |
| A2 | The payroll cut-off calendar is a ServiceNow-maintained table with an optional ERP refresh | NV-7 | OQ-2 |
| A3 | "HR/Finance validates against policy" on R4 means a formal approval record, not an informal agent action | NV-34 | OQ-4 |
| A4 | R9 benefits changes are **not** approval-gated by default, because the BRD does not mark them so | NV-46 | OQ-5 |
| A5 | R2's non-banking fields auto-sync with no approval, per the BRD's explicit wording | NV-32 | — |
| A6 | "Prior-of-record contact channel" means the contact value held *before* the submitted change | NV-33 | — |
| A7 | TRD §6's latency figures are planning assumptions and must not harden into product defaults | NV-16 | OQ-8 |
| A8 | The first release delivers R8 as orchestration-only, per the BRD's own recommendation | NV-45 | — |

## Gaps where neither document has coverage

| # | Gap | Story that exposes it |
|---|---|---|
| G1 | Neither document states **which side renders the PDF** — ServiceNow or the ERP. TRD §6 explicitly calls it "an architecture decision to confirm per ERP, not assumed here". | NV-36 (assumes ServiceNow, flagged) |
| G2 | Neither document states the **source of the payroll cut-off data** — an ERP endpoint, a ServiceNow calendar, or a country rule. | NV-7 |
| G3 | The TRD requires a versioned API but never asks for an **API-versioning column** or a way to record the deprecation notice period. | NV-6 |
| G4 | Neither document states a **document or audit retention period** — for the RITM attachment, for `erp_write`, or for the ERP-side archived copy. | NV-8, NV-36, NV-48 |
| G5 | The TRD models no entity for **`final_pay_calculation`** or **`leave_payout`**, both of which D7 requires. | NV-42 |
| G6 | The TRD models no **position history** collection, which D6 requires. | NV-42 |
| G7 | Neither document defines what happens when **ServiceNow's approval state and the ERP's own state diverge** after a successful write. | NV-30 |
| G8 | Neither document states a **data residency / processing-location** position. | NV-48 |

---

# Open Questions

For a human to settle. Every one of these is a question this backlog would otherwise have asked.

| # | Question | Blocks |
|---|---|---|
| OQ-1 | BRD §6.2 puts R5 at P1 and freezes release 1 to R1/R2/R3; BRD §6.1a puts D1, D2, D3 at P0. Which governs? This backlog assumed §6.2. | Epic H sequencing |
| OQ-1b | BRD §6.1a calls the top-10 document ranking "a BA-curated estimate". Confirm against real ticket volume once a pilot organisation exists. | Epic H scope, not its design |
| OQ-2 | Where does the payroll cut-off calendar come from — an ERP endpoint, a ServiceNow-maintained table, or a per-country statutory rule? (BRD §11 Q2.) | NV-7 |
| OQ-3 | What is the DPO's position on data residency and processing location for data transiting ServiceNow? (BRD §11 Q4.) | NV-48 |
| OQ-4 | Is R4's "HR/Finance validates against policy" a formal approval record or an agent action? | NV-34 |
| OQ-5 | Are R9 benefits changes approval-gated? The BRD does not say. | NV-46 |
| OQ-6 | Where do D7's `final_pay_calculation` and `leave_payout` come from? Neither is a TRD entity. | NV-42 |
| OQ-7 | What retention period applies to the RITM PDF attachment, to `erp_write`, and to the ERP-side archived copy? Neither document states one. | NV-8, NV-36, NV-48 |
| OQ-8 | TRD §6's latency and volume figures are explicitly first-pass. What are the pilot's real figures? | NV-16 |
| OQ-9 | Which side renders the PDF? TRD §6 defers it per ERP; this backlog assumed ServiceNow. | NV-36 |
| OQ-10 | Does the TRD's Basic-auth prohibition admit a documented exception, or is the working Unit4 Basic-auth deployment (OD38) non-compliant? | NV-1, C2 |
| OQ-11 | Is there an existing employee identifier shared between ServiceNow and the ERP, or must one be established at onboarding? (BRD §11 Q3.) | NV-10, NV-22 |
| OQ-12 | Does the pilot organisation run one ERP or a fragmented landscape? (BRD §11 Q5.) | NV-52 |
| OQ-13 | Does the target ERP expose a production API for payslip retrieval and for uploading a PDF to a personnel file? BRD §11 Q6 names these as the two hardest capabilities to confirm for every ERP evaluated. | NV-25, NV-37 |
| OQ-14 | What is the current manual process and volume per requirement area? (BRD §11 Q1.) | NV-50 baseline |
| OQ-15 | Cegid and PHC have zero research in this repo. Is either in pilot scope? If so, the TRD §4 checklist must be run against them before any commitment. | NV-15, C4 |
| OQ-16 | Does the target deployment have HRSD and Employee Center Pro installed? The existing app was built for an instance where **the HR module is not installed** (`docs/noviq-brd-trd-alignment.md` §5). Every catalog item, RITM attachment and HRSD case type in this backlog assumes they are. This is the largest unstated dependency in the whole set. | Epics C–K |

---

*Story count: 52 across 11 epics. Every R, D, INT, §2 principle, §3 entity, §5 requirement and §7
NFR in both documents is traceable above. Second brain not consulted — both routes unreachable, see
the header.*
