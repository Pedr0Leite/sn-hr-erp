---
title: Noviq ERP-agnostic Employee Services — technical architecture and developer instructions
app: x_335329_sn_hr_erp (brownfield extension)
author: architect agent
generated: 2026-08-23
status: draft for governance — NOT buildable until the ODs in §3 are logged
inputs:
  - docs/noviq/stories.md (NV-1 … NV-52)
  - "202608 Noviq_BRD_ServiceNow-EmployeeServices-ERPAgnostic_v1.md" (read in full)
  - "202608 Noviq_TRD_ERP-Integration-Technical-Requirements_v1.md" (read in full)
  - docs/noviq-brd-trd-alignment.md, docs/decision-log.md, docs/api-contract.md, CLAUDE.md
companion: docs/noviq/test-plan.md
---

# §0 — What was actually consulted, and what was not

Stated first because the rest of this document is only as good as this list.

| Source | Result |
|---|---|
| BRD, in full | Read. O1–O5, R1–R10, §6.1a D1–D10, §7 NFRs, §8, §9, §10, §11 |
| TRD, in full | Read. §2 principles, §3 entities, INT-01–INT-23, §5, §6, §7, §8, §9 |
| `docs/noviq/stories.md` | Read in full, all 52 stories, matrix, C1–C5, G1–G8, OQ-1…16 |
| Repo: `CLAUDE.md`, `decision-log.md`, `noviq-brd-trd-alignment.md`, `api-contract.md`, `l6-document-design.md`, `SN-HR-ERP-master-kickoff-prompt.md` §3 | Read |
| Source: `src/server/connector/*`, `src/server/api/*`, `src/server/hr/*`, `src/server/contract/objects.ts`, `src/fluent/**` | Read |
| **`servicenow-sdk:now-sdk` skill** | **Invoked.** `explain` topic inventory retrieved and used (§5 names only metadata types the SDK actually exposes: `Table`, `Acl`, `Role`, `BusinessRule`, `ScriptInclude`, `RestApi`, `ScheduledScript`, `CatalogItem*`, `VariableSet`, `CatalogClientScript`, `UserCriteria`, `wfa` flows/subflows, `UiPage`). |
| **Live instance lookup** | **NOT AVAILABLE.** `npx @servicenow/sdk auth --list` → `No credentials found`. The credential store is empty and re-adding it needs a real terminal (CLAUDE.md, "Current state"). **Every instance fact below is therefore cited to a dated probe already recorded in this repo, never asserted fresh.** Anything not so cited is marked UNVERIFIED. |
| **`/second-brain` skill** | **Invoked and FAILED.** The skill loaded, but its retrieval tools (`sn_search`, `sn_lexical`, `sn_get_section`) are not registered — the `sn-rag` MCP server is disconnected (`BACKEND_UNAVAILABLE`). `smart-connections` exposes no `semantic_search` tool in this session. `obsidian-cli` is not on `PATH` (`command -v obsidian` → nothing). All three routes attempted, all three failed. **No vault coverage was obtained and none is claimed.** Any decision below may duplicate or contradict a note already in the vault — re-check before build. Same finding the BA reported; it has not improved. |

**Instance facts used, each with its recorded probe:**

| Fact | Evidence | Date |
|---|---|---|
| HRSD absent — `sn_hr_core_case`, `sn_hr_core_profile` do not exist | `docs/SN-HR-ERP-master-kickoff-prompt.md` §3; re-probed `docs/l6-document-design.md` §2 (`sys_db_object where name = sn_hr_core_case` → **0 rows**); re-confirmed `decision-log.md` OD2 row | 2026-08-12, twice |
| `com.snc.employee_center` absent. `com.sn_hr_service_portal` (Employee Service Center) active, scope `sn_hr_sp` exists — a portal shell with no HR core behind it | kickoff §3; `l6-document-design.md` §4 | 2026-08-12 |
| Base **Service Catalog present** — catalog `e0d08b13c3330100c8b837659bba8fb4`, category `3eeeb63c71e1495aaab1fd597b597ccc`, both resolved by live query and in production use by `src/fluent/catalog/l6-producer.now.ts` | `l6-document-design.md` §4 | 2026-08-12 |
| `com.snc.document_templates` absent — no `sys_document_template`, no `document_template` table | kickoff §3; `l6-document-design.md` §2 | 2026-08-12 |
| **No callable PDF API.** `sn_pdfgeneratorutils` scope absent, `PDFGenerationAPI` absent from `sys_script_include` in every scope. `com.snc.apppdfgenerator` and `com.snc.whtp` are active but supply no scoped API | `decision-log.md` OD2 detail | 2026-08-12, re-probed |
| `ecc_agent` — **zero rows**. No MID Server | connector `rest-client.ts` comment, spike 0.5 | 2026-08-13 |
| `sys_user_has_role` read is ACL-gated for this app's roles; `gs.hasRole()` in user session is the supported check | `decision-log.md` D14 / OD11 detail, verified live | 2026-08-12 |
| Shape A deny ACL refusal is silent — HTTP 200, normal body, field unchanged | `decision-log.md` D17, verified live against full admin | 2026-08-12 |
| `sc_req_item` / `sc_request` present | **INFERRED, not probed.** They are part of the same base Service Catalog plugin whose catalog record was resolved live. Flagged **OQ-19** — verify before build |

---

# §1 — COVERAGE VERIFICATION (the gate)

The BA's matrix was **not trusted**. Both source documents were re-walked line by line and every ID
re-derived independently. The result is below.

## 1.1 What re-checked clean

Confirmed genuinely traceable to at least one story with acceptance criteria that would actually
detect the requirement failing:

- **BRD R1–R10** — all ten. R1→NV-5/13/18/24/25/26, R2→NV-3/9/17/31/32/33, R3→NV-7/19/27/28/29/30,
  R4→NV-11/20/34/35, R5→NV-36/37/38/43(+39–42), R6→NV-7/21/44, R7→NV-10/22/23, R8→NV-45,
  R9→NV-21/46, R10→NV-21/47/52. **Clean.**
- **BRD §6.1a D1–D10** — all ten, each with its approval-gating correctly carried
  (D2/D6/D7/D8/D9 gated; D1/D3/D4/D5/D10 auto-issue). **Clean.** The BA's split of D3 onto the R1
  read path rather than the R5 generate path is correct and is preserved here.
- **TRD INT-01 – INT-23** — all twenty-three appear. **Clean as coverage**; two are thin, see 1.2.
- **TRD §2 architecture principles** — all eleven (Authentication, Authorization scope, Read
  pattern, Write pattern, Identity linkage, Idempotency, Error semantics, Data format,
  Non-production environment, Throughput, Versioning). **Clean.**
- **TRD §3 entities** — all eleven (Employee, PayslipDocument, IncomeStatement, LeaveBalance,
  LeaveRequest, ExpenseClaim, Attachment, CompensationChange, BenefitEnrollment, TimesheetEntry,
  CostCentre/Project). **Clean as entity coverage**; three field-level misses, see 1.2.
- **TRD §5 cross-cutting** — all five (payroll cut-off, audit trail, attachment limits, field-level
  permission clarity, deletion vs status change). Four clean; the audit-trail row is nominal, see 1.2.
- **TRD §6 volume/performance** — all four rows reachable via NV-16 + NV-13, and the BA correctly
  refused to harden TRD §6's own "first-pass planning assumptions" into product defaults (A7/OQ-8).
  **Clean, and better than the source document deserved.**
- **TRD §7 traceability matrix** — reproduced faithfully; no row silently dropped. **Clean.**
- **TRD §8 vendor onboarding** — all four bullets are fields on NV-15's `vendor_onboarding`
  record, and NV-15 refuses a `true` without a citation. **Clean.**
- **TRD §9** — correctly classified as method, not requirement, with its *output* captured by NV-15.
  **Clean, and the right call.**
- **BRD O1–O5** — all five. **Clean.**
- **BRD §7 NFRs** — all nine. **Clean.**
- **BRD §8 assumptions** — all four. **Clean.**
- **BRD §9 risks** — all five. **Clean.**
- **BRD §10 success criteria** — all four. **Clean.**
- **BRD §11 open questions** — all six, mapped to OQ-14/2/11/3/12/13. **Clean.**
- **BRD §4.2 out-of-scope** — correctly *not* covered, with NV-52 designed to *detect* the
  multi-ERP condition and stop rather than build for it. **Correct treatment.**

**The matrix is sound at the level of IDs.** No requirement ID in either document is missing from
it. That is worth saying plainly: the BA did not lose anything.

## 1.2 What the BA missed, mis-mapped, or covered only nominally

Fifteen findings. Each is designed for in this document.

| # | Finding | Severity | Where designed |
|---|---|---|---|
| **V1** | **The surface has no story at all.** OQ-16 records the dependency and then every Epic C–J story proceeds as if it were satisfied. There is no story that *builds* the Employee Center Pro / HRSD surface, and on the target instance that surface does not exist. This is not an open question, it is a missing epic. | **Critical** | §2, OD40, NV-53 |
| **V2** | **No story checked OD2.** NV-36 AC5 requires "the output is a real PDF: first bytes `%PDF-`, and a test opens it". On `dev296062` there is **no callable PDF API** (OD2, probed twice). That AC is unsatisfiable today, which means D1, D2, D4–D10 are all blocked on a human installing a Store app. The BA treated PDF rendering as an *assumption* (A1/OQ-9) about which side renders; the real blocker is whether **either** side can. | **Critical** | §2.3, OD41 |
| **V3** | **NV-10 specifies a new table that already exists.** `x_335329_sn_hr_erp_emp_xref` (L6-1) already carries `user` + `erp_system` + `erp_employee_key` + `active`, with a unique index on `(user, erp_system)` — it is exactly NV-10's requirement, built and deployed. NV-10 proposes "a `sys_user` extension or `x_..._employee_link`". Building either duplicates the identity key, which is the one thing that must not have two homes. | High | §5.2, EXTENDS `emp_xref` |
| **V4** | **`object_map.http_method` has only `get` and `post`.** Every update capability (INT-04/05/06/07/21) is a PUT or PATCH, and NV-45's AC "binding it to a DELETE verb is rejected at save" cannot be tested because DELETE is not an expressible value. No story extends the choice list. | High | §5.3, `object_map` EXTENDS |
| **V5** | **No story extends the connector with a write method.** `erp-connector.ts` states outright: *"NO WRITE METHOD EXISTS. fetch() is read-only by construction."* NV-3 says "Script Include write dispatcher" without naming the connector change, and a dispatcher that bypasses `erp-connector.ts` also bypasses retry, backoff, circuit breaker and `call_log` — the entire TRD §2 error-semantics pass. | High | §6.2, `submit()` in `erp-connector.ts` |
| **V6** | **TRD §2 Error semantics is only half implemented, and no story closes the other half.** The TRD requires errors be distinguishable *"via status code **or error payload**"*. `classify.ts` reads status code and transport message only. A vendor that returns **HTTP 200 with an error body** — the common SOAP/OData-wrapper shape, and the one Unit4 evidence in this repo is closest to — is classified `success`. NV-12 says "reuse the existing classification. No second classifier is written", which locks the gap in. | High | §5.3, `error_predicate` on `object_map` |
| **V7** | **There is no employee self-service role, and no self-scoping rule.** The app ships `viewer`, `finance_viewer`, `hr_viewer`, `admin`. Every widget in Epics D–J renders *the signed-in employee's own* payslips, balances, IBAN. NV-10 AC3 assumes a per-user identity render; nothing grants an ordinary employee the right to see it, and nothing stops a `viewer` from reading another employee's row. NV-25 AC4 spot-checks this for payslips only. | **Critical** | §7.1, new `employee` role + self-scope predicate |
| **V8** | **TRD §5 "Audit trail" is nominal.** The requirement is that the write be attributable **in the ERP's own audit log to the integration identity, not merged indistinguishably with manual UI changes**. NV-8 AC2 delivers a *case number in a header*, which is a different thing. Nothing requires the ERP credential be a dedicated non-human service identity, and nothing records that it is. | High | §5.2 `erp_system.integration_identity_*` |
| **V9** | **D2 needs `salary_history`; nothing models it.** BRD §6.1a D2 pulls "Gross/net salary, **salary history**, contract type". NV-40 AC4 names `salary_history` as a template field, but NV-17/NV-18/NV-21 model no history collection. Same class of gap the BA *did* catch for D6 (G6 position history) and missed here. | Medium | §5.4, G12 |
| **V10** | **D10 needs contribution history; nothing models it.** BRD §6.1a D10 pulls "**Contribution history**, scheme enrolment data". NV-21 models `benefit_enrollment` as a single current row. NV-41 AC6 then tests "partial contribution history" against an entity that has no history. | Medium | §5.4, G11 |
| **V11** | **INT-14 is half covered.** The capability is "valid leave types **and absence reason codes**". NV-19 models `leave_type_ref` only; `absence_reason_ref` appears nowhere. A leave request rejected for an invalid reason code after approval is exactly the failure NV-28 exists to prevent. | Medium | §5.4, `absence_reason_ref` |
| **V12** | **NV-49 AC1 contradicts a logged, verified fact.** "a query of `sys_metadata` for records created by this app in `Global` returns zero rows attributable to it" — `decision-log.md` **D16** records that **four Global-scope records are created by the platform** when this app's roles deploy. The AC as written fails on a correct build. | Medium | §8, NV-49 restated |
| **V13** | **NV-25's "streamed … never stored at rest" is not achievable as written, and no story says so.** ServiceNow's supported route for binary out of `RESTMessageV2` is `saveResponseBodyAsAttachment()`, which writes `sys_attachment`. `getBody()` returning binary intact is **undocumented and unverified**. The BA wrote the AC as if a clean streaming path existed. | **Critical** | §6.1, OD43 + OQ-17 |
| **V14** | **R6 needs `old_value` and nothing supplies it.** NV-44 AC2 requires the write carry `old_value`; `compensation_change.old_value` is a logical field with no read behind it. The value must come from a live INT-01 read taken *at approval time*, or the audit trail records a value nobody verified. | Low | §8, NV-44 |
| **V15** | **NV-9's gate is defeated by trap 5 as specified.** NV-9 puts the gate in a Business Rule. `decision-log.md` D19: *"a `before` business rule that throws is SWALLOWED and the record saves"* — a crashed gate is indistinguishable from an approving one, and returns HTTP 201. A gate that can fail open is not a gate. | **Critical** | §7.2, two-layer gate |

**Nothing else was found.** Specifically re-checked and confirmed *not* missing: TRD §2 Non-production
environment; TRD §5 attachment limits; TRD §6 R7/R8 accuracy-over-speed; BRD §7 Localisation;
BRD §9 risk 4; BRD §10 re-keying baseline; BRD §11 Q6. The BA's G1–G8 gaps and C1–C5 conflicts are
all real and all carried forward; none was invented and none was overstated.

---

# §2 — The surface decision (OQ-16), resolved

## 2.1 The finding

The backlog assumes HRSD and Employee Center Pro. Three independent probes recorded in this repo,
two of them re-run, say both are absent from `dev296062`:

- `sys_db_object` where `name = sn_hr_core_case` → **0 rows** (`l6-document-design.md` §2).
- `com.snc.employee_center` → **absent** as a plugin id (kickoff §3).
- `com.snc.document_templates` → **absent**; no `sys_document_template`.

What *is* present: the **base Service Catalog** (catalog sys_id resolved by live query and already
carrying this app's `l6-producer` record producer), and `com.sn_hr_service_portal` — an Employee
Service Center *portal shell* with no HR core behind it.

A `ReferenceColumn` to a table that does not exist **fails the build** — this repo has the
precedent in `erp-system.now.ts`, where `auth_profile_mutual` is a `StringColumn` and not a
`ReferenceColumn` for exactly that reason. So option (a) is not merely undesirable here, it is
non-compiling.

## 2.2 The decision — **OD40 (proposed)**

**Answer (b): the backlog's catalog / RITM / case surface is re-hosted on the base Service Catalog
and on this app's own tables and BYOUI page. No `sn_hr_core_*` identifier is authored anywhere.**

Concretely:

| BRD/backlog concept | What is actually built | Why |
|---|---|---|
| Employee Center Pro widget | A new **Employee tab set** in the existing React 18.2.0 BYOUI SPA at `x_335329_sn_hr_erp_hub.do`, fed by a second Scripted REST service `/api/x_335329_sn_hr_erp/emp` using the **same four-state envelope** as `docs/api-contract.md` | The SPA exists, is deployed and already implements the four-state renderer. A second UI technology would need a second state renderer, and two renderers is how a `0` gets on screen. |
| Catalog item | `CatalogItem` / `CatalogItemRecordProducer` on the **base Service Catalog** (present, in use) | Base platform, no HRSD licence |
| RITM (`sc_req_item`) | `sc_req_item` where the catalog path produces one; **referenced polymorphically, never by `ReferenceColumn`** | Keeps the HRSD swap a data change |
| HRSD case (onboarding, offboarding, comp change) | New scoped table `x_..._emp_case` + `x_..._emp_case_task` | These three have no catalog shape and no base-platform case table this app may extend |
| "the originating case" on every write | `erp_write.source_table` (TableName) + `erp_write.source_record` (String(32) sys_id) — **a polymorphic pair, not a reference** | This is the single design choice that makes option (a) a later configuration change. On an HRSD-licensed instance, `source_table = 'sn_hr_core_case'` and nothing in the engine changes. |

**Rejected — build against HRSD now and let it fail on the PDI.** It does not fail at runtime, it
fails at `now-sdk build`, so nothing ships at all.

**Rejected — target a different, HRSD-licensed instance.** No such instance is named, no
credentials for one exist, and the repo's entire body of live evidence (fourteen traps, D14, D17,
OD2) is `dev296062` evidence. Moving instance discards it.

**Rejected — Employee Service Center portal (`sn_hr_sp`) widgets.** It is a shell with no HR core;
building Angular Service Portal widgets there introduces the second UI technology the UI mandate
forbids, for a surface with no data model behind it.

**Consequence, stated rather than hidden:** the delivered product is *not* Employee Center Pro. It
satisfies every functional requirement of the BRD on a surface the BRD did not name. Whether that
is acceptable is a commercial question → **OQ-18**.

## 2.3 PDF capability — **OD41 (proposed)**

`decision-log.md` OD2 is unresolved in the direction this backlog needs: there is **no callable
scoped API on `dev296062` that renders a PDF from arbitrary HTML**. `resolveFormat()` in
`src/server/hr/render.ts` already refuses to label anything PDF unless the converter returned real
`%PDF-` bytes, and CLAUDE.md rule 2 forbids the alternative.

Therefore:

1. **D3 (payslip reissue) and R1 are unaffected.** Those bytes come from the ERP and already are a
   PDF. R1/D3 are the only Epic D/H items shippable before OD2 is resolved.
2. **D1, D2, D4–D10 generate labelled HTML** until a human installs `sn_pdfgeneratorutils`. The
   RITM attachment is `.html`, `text/html`, `output_format = HTML`. This is honest and already
   built (L6).
3. **Archival to the ERP of an HTML artefact is REFUSED by default.** `erp_write` for
   `erp_attachment.create` is refused unless the resolved format is PDF, **or** the document
   template sets `allow_html_archive = true` **and** the ERP's `allowed_mime_types` contains
   `text/html`. Reason: R5's stated purpose is the ERP-side system-of-record copy *of the
   certificate that was issued*. Filing an HTML file where an auditor expects a PDF is the
   "label HTML as PDF" failure arriving one layer downstream. Blank beats wrong.
4. **The R5 pattern is built to completion regardless.** When OD2 flips to branch (b), the change
   is one branch in `render.ts` — already designed that way at L6 — plus lifting the refusal in (3).

**This makes OD2 a hard, named build dependency of eight of the ten HR Document Center items.** It
is not a footnote. → **OQ-9 is upgraded from "which side renders" to "will anyone install the
renderer", and re-raised as OQ-20.**

---

# §3 — Decisions this design proposes against the logged record

Per the repo rule, every contradiction of D1–D19 / OD1–OD39 is named with its ID and its reasoning,
as a **new OD proposal**, never a silent reversal. **None of these may be built before the OD is
logged in `docs/decision-log.md`.**

| New OD | Contradicts | Proposal | Rejected alternative |
|---|---|---|---|
| **OD40** | — (fills a void) | The Noviq surface is the base Service Catalog + this app's tables + the existing BYOUI SPA. `erp_write.source_table`/`source_record` is polymorphic so the HRSD swap stays a data change. | Target an HRSD instance (§2.2); build Service Portal widgets on `sn_hr_sp` (§2.2). |
| **OD41** | Extends OD2 | An HTML-format document is **not archived to the ERP** unless the template and the ERP both explicitly permit `text/html`. Eight of ten HR Document Center items are blocked on OD2 branch (b). | Archive the HTML anyway and call it "the document" — files a different artefact than the one certified. Generate nothing at all — discards a working L6. |
| **OD42** | **DL-D3** | Write-back is enabled **for the HR employee-services logical objects only**, through one dispatcher, behind `erp_system.read_only` which remains structural per system and default `true`. D3's original subject — the **requisition Approve/Reject mirror on Tab 2** — stays deferred and stays unrendered. | Reverse D3 wholesale, which would also un-defer Tab 2's approve/reject with no design behind it. Keep D3 and refuse the BRD, which makes 9 of 10 requirements unbuildable. |
| **OD43** | Extends **DL-D2** | Binary transport uses `saveResponseBodyAsAttachment()` into an **ephemeral spool record**, streams to the caller, and deletes the attachment and the holder row in a `finally` block within the same transaction. **The bytes touch `sys_attachment` transiently.** DL-D2's *purpose* — no queryable store of HR data — is preserved; its literal phrasing is not. | Claim `getBody()` is binary-safe — undocumented, and a truncated PDF still begins `%PDF-`, so NV-5's magic-byte check would pass a corrupt file. MID Server proxy — `ecc_agent` has zero rows. |
| **OD44** | Sharpens **D19 / trap 5** | The approval gate is **two-layer**: a `before` Business Rule for a fast, readable refusal, *and* an independent re-validation inside the dispatcher immediately before dial. Neither alone is the gate. A swallowed BR exception therefore cannot open it. | BR only — trap 5 says a crashed rule returns HTTP 201 and is indistinguishable from an approving one. Dispatcher only — no readable refusal on the form, so the user learns by silence. |
| **OD45** | Extends **D2 / choices.ts** | The ten new HR logical objects are added to `OBJECT_CHOICES` and to `LOGICAL_OBJECTS` with `category: null`, and **none** is added to the staged list. `hr` and `payroll` remain absent from `CATEGORY_CHOICES`. | Add an `hr` category "for completeness" — one keystroke from a queryable salary table. |
| **OD46** | Extends **D14 / L4-D9** | The employee self-scope check is `gs.hasRole()` in user session **plus** an `emp_xref` identity match, executed in the Scripted REST caller session — never in a scheduled job. Row-level enforcement is a Security Data Filter / ACL condition, not a script branch. | Query `sys_user_has_role` — D14 proved it fails closed and silently on this instance. |
| **OD47** | Extends **DL-D3's binding rule** | The four write states that must never be rendered as a completed action (`queued`, `sent`, `blocked_cutoff`, `blocked_approval`) each get their own on-screen sentence, and the Submit/Release control is **absent**, not disabled, whenever it could not commit. | A disabled button with a tooltip — explicitly failed by NV-3 AC6 and by CLAUDE.md rule 1. |

---

# §4 — Architecture at a glance

Three new layers on the existing six. Nothing in L0–L6 is rewritten.

```
L0 scaffold · L1 control tower · L2 connector · L3 staging · L4 hub API · L5 BYOUI SPA · L6 documents
                    │                │                                        │            │
        EXTENDS ────┤                ├──── EXTENDS                            │            │
                    ▼                ▼                                        ▼            ▼
   ┌──────────────────────────────────────────────────────────────────────────────────────────┐
   │ L7  WRITE PATH        erp_write · write_approval_policy · payroll_calendar · erp_exception │
   │                       erp-connector.submit() · write-dispatcher.ts · confirm-poller       │
   ├──────────────────────────────────────────────────────────────────────────────────────────┤
   │ L8  BINARY PATH       binary-client.ts · bin_spool (ephemeral) · magic-byte + MIME gate   │
   ├──────────────────────────────────────────────────────────────────────────────────────────┤
   │ L9  EMPLOYEE SURFACE  /api/.../emp Scripted REST · base Service Catalog items · emp_case  │
   │                       React employee tab set in the existing BYOUI SPA                    │
   └──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Trap inventory this design must survive** (each already cost this repo something):

| Trap | Where it bites here | Mitigation baked in |
|---|---|---|
| 1 — relative import without `.ts` is dead at runtime | Every new `src/server/` module: `write-dispatcher.ts`, `binary-client.ts`, `approval-gate.ts`, `cutoff.ts`, `idempotency.ts`, `country.ts`, `telemetry.ts` | Build-order step B0 is the grep; NV-49's lint fails the build |
| 2 — Scripted REST wraps error bodies in `{"result": …}` | Every new employee-surface endpoint and every test asserting on an error body | Client `api.ts` already unwraps; test plan asserts on the unwrapped shape |
| 3 — `Acl.adminOverrides` defaults `true` | ~40 new ACL rows | Written explicitly on every row, no exceptions; NV-49 test enumerates and fails on any unset |
| 4 — Shape A deny refusal is silent | Every deny on `erp_write`, `write_approval_policy`, `emp_xref`, `field_map.sensitive` | **Every** ACL test re-reads the value and writes a control field in the same request |
| 5 — a `before` BR that throws is swallowed, record saves | The approval gate, the cut-off gate, the scope-grant gate | OD44 two-layer gate; the dispatcher re-validates independently |
| 6 — `getValue()` on Boolean returns `'1'`/`'0'` | `read_only`, `sensitive`, `active`, `allow_html_archive`, `mandatory` | `util/bool.ts` `isTrue()` on every read, reused as-is |
| 7 — `Record()` data values are build-time strings | Every seed row (`write_approval_policy`, `vendor_onboarding`, templates) | `Now.include('./file')` for anything multi-line |
| 8 — deleting a `Table()` leaves an unprotected shell | Twelve new tables | Documented in the NV-49 evidence pack; no table is ever removed by a redeploy |
| 10 — `sys_trigger` drops fields on REST insert | Confirmation poller, cut-off release job | Both ship as `ScheduledScript`, `on_demand` + `active: false` (L3-D8) — never created by REST |
| 12 — never invent a sys_id | Every new record | `Now.ID['…']` only; the two base-catalog sys_ids are the *only* literals, and they were resolved by live query |
| 13 — an unparseable date reads as absent, not failed | `effective_date`, `cutoff_datetime`, `as_of_date`, `period_start/end` | NV-14: a parse failure sets the tile `failed`, never leaves the column empty |

---

# §5 — Component inventory: NEW / EXTENDS / REUSED AS-IS

Nothing is re-specified that already works.

## 5.1 REUSED AS-IS — do not touch

| Component | File | Why it already satisfies the requirement |
|---|---|---|
| Retry, exponential backoff, per-sleep cap | `src/server/connector/backoff.ts` | TRD §2 Throughput, BRD §7 Error handling |
| Circuit breaker, probe lease | `src/server/connector/circuit-breaker.ts` | TRD §2 Throughput |
| `Retry-After` parsing (delay-seconds *and* HTTP-date) | `rest-client.ts` `parseRetryAfterMs` | TRD §2 Throughput, NV-16 AC4 |
| Per-attempt `call_log` with **no body field by type** | `call-log.ts`, `types.ts` `CallLogEntry` | BRD §7 data minimisation — the *type signature* is the enforcement |
| Config load / flatten | `config-loader.ts` | — |
| Three path syntaxes + shape-detected OData V2 dates | `field-mapper.ts` `parseDate`, `resolvePath` | TRD §2 Data format, NV-14 AC1 |
| `zero_is_meaningful` handling | `field-mapper.mapRecord` (L2-D7) | The whole four-state `0` rule |
| Four-state payload envelope | `docs/api-contract.md`, `src/server/api/state-resolver.ts` | Every read AC in Epics C–J |
| Client state renderer, absent-key contract (`'v' in tile`) | `src/client/state-renderer.ts` | Never render `0` for an absence |
| `gs.hasRole()` in caller session | `src/server/api/role-check.ts` | D14, trap 9 |
| Format resolution — one return value drives extension, content type, first bytes and the record field | `src/server/hr/render.ts` `resolveFormat` | CLAUDE.md rule 2 |
| Document assembly from live ERP fields, abort on any missing mandatory | `src/server/hr/assemble.ts` | R5 steps 2–3, INT-17 |
| Self-service boundary as a `before` BR, not a form | `src/fluent/business-rules/l6-rules.now.ts` | The pattern V7's new role reuses |
| Boolean reading | `src/server/util/bool.ts` `isTrue()` | Trap 6 |
| Roles pattern with empty `containsRoles` | `src/fluent/security/roles.now.ts` | L0-D2 |

## 5.2 EXTENDS — existing tables gaining columns

**`x_..._erp_system`** (`src/fluent/tables/erp-system.now.ts`)

| Column | Type | Story | Note |
|---|---|---|---|
| `auth_type` | Choice — **add** `oauth2_client_credentials`, `oauth2_jwt`, `mutual_tls`; keep `basic`, `oauth2`, `mutual` | NV-1 | ADD, NEVER RENAME — existing rows key on the old values |
| `auth_exception_ref` | String(200) | NV-1 | Mandatory when `auth_type=basic` ∧ `environment=production` |
| `environment` | Choice `sandbox`\|`production`, **mandatory, no default** | NV-15 | |
| `api_version` | String(40) | NV-6 | Empty ⇒ badge `API version not recorded` |
| `version_source_note` | String(500) | NV-6 | |
| `deprecation_notice_days` | Integer, **no default** | NV-6 | Empty renders `Deprecation policy not stated by vendor`, never `0` |
| `deprecation_policy_url` | Url | NV-6 | |
| `max_attachment_bytes` | Integer, **empty** | NV-11 | Empty ⇒ attachment control not rendered |
| `allowed_mime_types` | String(500), **empty** | NV-11 | |
| `attachment_limits_source_note` | String(500) | NV-11 | |
| `rate_limit_per_min` | Integer, **empty** | NV-16 | Empty ⇒ no throttle, badge `Rate limit not stated by vendor` |
| `expected_latency_ms` | Integer, **empty** | NV-16 | |
| `throughput_source_note` | String(500) | NV-16 | |
| `confirm_timeout_ms` | Integer, **no default** | NV-3 | Empty ⇒ async writes cannot be configured; the object map is unpublishable |
| `integration_identity` | String(120) | **V8** | The ERP-side principal this credential authenticates as |
| `integration_identity_source_note` | String(500) | **V8** | Cites the vendor doc proving the ERP audit log records it distinguishably from a UI change. Empty ⇒ control tower renders `Integration identity not evidenced — TRD §5 audit trail unproven` |

`read_only` is **unchanged and keeps its default `true`**. OD42 does not weaken it.

**`x_..._object_map`** (`object-map.now.ts`)

| Column | Type | Story |
|---|---|---|
| `http_method` | Choice — **add** `put`, `patch`, `delete` (**V4**) | NV-3, NV-45 |
| `operation` | Choice `read`\|`create`\|`update`\|`terminate`\|`cancel`\|`search`\|`list` — a map is now (system × object × operation) | NV-3 |
| `idempotency_mode` | Choice `header`\|`existence_check`\|`none`, **default `none`** | NV-4 |
| `idempotency_header` | String(80), blank | NV-4 |
| `existence_check_path` | String(255), blank | NV-4 |
| `confirm_ack_path` | String(255) | NV-3 — dotted path to the ERP's identifier in the write response. **Blank ⇒ every write on this map is `failed`, never `confirmed`** |
| `confirm_status_path` / `confirm_status_ok_values` | String(255) / String(200) | NV-3 async confirm |
| `error_predicate_path` / `error_predicate_value` | String(255) / String(200), blank (**V6**) | NV-12 — a 200 whose body matches is reclassified `failure` |
| `read_timeout_ms` | Integer | NV-16, NV-24 |
| `cacheable` | Boolean, default `false` | NV-13, NV-28, NV-47 |
| `cache_ttl_s` | Integer, blank | NV-28 |
| `country` | String(2), blank = country-agnostic | NV-51 |
| `unique index` | `(erp_system, logical_object, operation, country)` | NV-51 fallback resolution |

**`x_..._field_map`** — `sensitive` (Boolean, default false, NV-17/NV-21), `country` (String(2), NV-51).

**`x_..._call_log`** — `content_type` (String(120)), `content_length` (Integer), `sunset_header`,
`deprecation_header` (String(120) each, NV-6). **No body field is added, ever.**

**`x_..._emp_xref`** (**V3** — this is NV-10, not a new table) — `retired` (Boolean, default false;
a retired key is never reassigned, NV-10 AC6), `id_source` (Choice `onboarding`\|`lookup`\|`manual`),
`linked_by` (Reference `sys_user`), `linked_on` (DateTime). The unique index on `(user, erp_system)`
already exists; **add** a second unique index on `(erp_system, erp_employee_key)` so one ERP
employee cannot bind to two ServiceNow users (NV-22 AC6).

**`x_..._doc_type` / `x_..._doc_tmpl`** (these are NV-36's `document_template` — they exist) —
`country` (String(2)), `language` (String(5)), `document_type_category` (String(120), mandatory
before archival), `allow_html_archive` (Boolean, default **false**, OD41), `requires_approval`
(Boolean — the D2/D6/D7/D8/D9 flag, resolved through `write_approval_policy`, not instead of it).
Unique index `(code, country, language)`.

**`src/server/contract/objects.ts`** — ten new logical objects, all `category: null` (OD45):
`payslip_document`, `income_statement`, `leave_balance`, `leave_request`, `leave_type_ref`,
`absence_reason_ref` (**V11**), `expense_claim`, `erp_attachment`, `compensation_change`,
`benefit_enrollment`, `timesheet_entry`, `cost_centre_project_ref`, plus child collections
`position_history` (G6), `salary_history` (**V9**), `benefit_contribution_history` (**V10**).
`employee_profile` gains the six missing TRD §3 fields (`address`, `phone`, `emergency_contact`,
`bank_account_iban`, `cost_centre`, `contract_type`, `employment_end_date`). **The seven existing
field names are unchanged** — L6-D9 renamed them to the document names and a rename orphans
`call_log`, `sync_run` and every `field_map` row.

**`src/fluent/tables/choices.ts`** — `OBJECT_CHOICES` gains the above. `CATEGORY_CHOICES` and the
14-entry staged list are **unchanged** (OD45).

## 5.3 EXTENDS — existing runtime modules

| File | Change | Story |
|---|---|---|
| `connector/erp-connector.ts` | **`submit()`** — the write sibling of `fetch()`. Checks `system.active && !system.readOnly` before dialling and logs the refusal, exactly as the file's own comment instructs. Reuses the same retry loop, breaker, classify and `call_log`. Keeps the single `getBody()` call-site rule by living in this file (**V5**) | NV-3 |
| `connector/rest-client.ts` | `sendOnce` gains `put`/`patch`/`delete`; `Accept` header becomes a parameter (default `application/json`); body allowed on put/patch. No vendor name, host or path enters this file — the design bar holds | NV-3, NV-5 |
| `connector/classify.ts` | New `classifyBody(attempt, map)` — applied **only** when `error_predicate_path` is non-empty. A 200 whose predicate matches becomes `{status:'failure', retryable:false, errorCode:'ERP_BODY_ERROR'}`. Blank predicate ⇒ behaviour byte-identical to today (**V6**) | NV-12 |
| `connector/field-mapper.ts` | Child-collection mapping via the existing array-predicate path syntax (OD38) for `position_history`, `salary_history`, `benefit_contribution_history`, `expense_line`. `parseDate` unchanged | NV-20, NV-42, V9, V10 |
| `connector/call-log.ts` | Writes `content_type`, `content_length`, `sunset_header`, `deprecation_header`. Still no body | NV-5, NV-6 |
| `api/role-check.ts` | `isEmployeeSelf(erpEmployeeKey)` — `gs.hasRole()` + `emp_xref` match in caller session (OD46) | **V7** |
| `hr/assemble.ts` | Template resolution by `(document_type, country, language)` with documented fallback; per-placeholder mandatory honoured from the *resolved* template | NV-43 |
| `hr/render.ts` | Unchanged mechanism; `resolveFormat()`'s PDF branch is what OD2 branch (b) turns on | NV-36, OD41 |
| `src/client/**` | New employee tab set: `EmployeeTabs.tsx`, `PayslipList.tsx`, `LeaveBalance.tsx`, `DocumentRequest.tsx`, `WriteStatus.tsx`. All consume `state-renderer.ts` output — **no component branches on `st` itself** | Epics D–J |

## 5.4 NEW — tables

Twelve. Every one `accessibleFrom: 'package_private'`, `callerAccess: 'tracking'`,
`createAccessControls: false`, `audit: true`, variable name = table name (TS213).

| # | Table | Story | Key columns |
|---|---|---|---|
| 1 | `x_..._erp_scope_grant` | NV-2 | `erp_system`, `logical_object`, `operation`, `erp_role_or_scope` S(200), `source_note` S(500) **mandatory**, `active`. Unique `(erp_system, logical_object, operation)` |
| 2 | `x_..._erp_write` | NV-3 | `erp_system`, `logical_object`, `operation`, `external_id`, `idempotency_key` S(64), `source_table` TableName, `source_record` S(32), `approval_ref`, `request_hash` S(64), `state` Choice, `erp_ack_ref` S(200), `attempts` Int, `first_sent_at`, `confirmed_at`, `effective_cycle`, `effective_date`, `country`, `requested_by`, `approved_by`, `error_message`. Unique `(erp_system, idempotency_key)` |
| 3 | `x_..._write_approval_policy` | NV-9 | `logical_object`, `operation`, `document_type`, `country`, `required` Bool, `approver_group`, `source_note` S(500) **mandatory**, `active` |
| 4 | `x_..._payroll_calendar` | NV-7 | `erp_system`, `country`, `pay_period_label`, `period_start`, `period_end`, `cutoff_datetime`, `pay_date`, `source` Choice `erp`\|`manual`, `source_note` |
| 5 | `x_..._erp_exception` | NV-12 | `erp_system`, `category` Choice (8 exact values), `message`, `call_log`, `erp_write`, `source_table`/`source_record`, `assignment_group` **mandatory**, `state`, `opened_at` |
| 6 | `x_..._vendor_onboarding` | NV-15 | `vendor`, five Boolean+`*_source_note` pairs (portal, sandbox, dev-tier, prod-tier, ERP marketplace cert). Boolean is **tri-state by rendering**: unchecked renders `Not confirmed`, never `No` |
| 7 | `x_..._landscape_discovery` | NV-52 | `deployment`, `requirement_area` (R1–R10), `authority` Choice `core_erp`\|`cloud_hcm`\|`expense_system`\|`none_identified` **mandatory**, `native_timesheet_in_use` Choice `yes`\|`no`\|`not_assessed`, `note` |
| 8 | `x_..._usage_event` | NV-50 | `requirement_area`, `action`, `persona_role`, `outcome`, `occurred_at`, `erp_system`. **No user reference, no business value, no free text** |
| 9 | `x_..._bin_spool` | NV-5 / OD43 | `token` S(32), `created_at`, `consumed` Bool. Four columns; holds an attachment for the length of one transaction and nothing else |
| 10 | `x_..._emp_case` | OD40 | `case_type` Choice `onboarding`\|`offboarding`\|`comp_change`, `subject_user`, `state`, `effective_date`, `opened_by`. **Carries no HR content** — the same schema-is-the-enforcement rule as `emp_xref` |
| 11 | `x_..._emp_case_task` | NV-45 | `emp_case`, `task_type`, `state`, `completed_by`, `completed_on` |
| 12 | `x_..._ref_cache` | NV-28, NV-47 | `erp_system`, `logical_object`, `country`, `payload` (String, reference data only — leave types, cost centres), `fetched_at`, `ttl_s`. **One cache table, not two.** Only objects with `object_map.cacheable = true` may be written here; a `before` BR refuses anything else |

## 5.5 NEW — runtime modules (`src/server/`)

Every relative import carries `.ts` (trap 1).

| Module | Purpose |
|---|---|
| `connector/binary-client.ts` | Down: `Accept` negotiation, `saveResponseBodyAsAttachment` into `bin_spool`, MIME allow-list, `%PDF-` magic-byte gate, stream, `finally { delete }`. Up: `setRequestBodyFromAttachment`. **Never calls `getBody()`** |
| `write/dispatcher.ts` | The single write entry point. Order is fixed and is the design: scope grant → read-only → approval gate → cut-off gate → idempotency → dispatch via `erp-connector.submit()` → confirm → `erp_write` state |
| `write/idempotency.ts` | Deterministic key = SHA-256 of `logical_object\|operation\|external_id\|source_record\|discriminator`. Existence probe |
| `write/approval-gate.ts` | OD44 layer 2. Resolves policy, validates `sysapproval_approver` |
| `write/cutoff.ts` | Resolves `payroll_calendar` for (country, effective_date). **No row ⇒ refuse**, never pass through |
| `write/confirm-poller.ts` | Moves `sent` → `confirmed`/`failed`. Never `confirmed` on timeout |
| `platform/country.ts` | The **one** country-resolution function used by `object_map`, `field_map`, `payroll_calendar`, `doc_tmpl` and `write_approval_policy`. Three different fallback rules fail NV-51 |
| `platform/telemetry.ts` | Best-effort `usage_event` write; a failure is logged and never propagates |
| `platform/scope-guard.ts` | NV-2 pre-flight refusal, client-side, before any HTTP |
| `api/emp-data.ts`, `api/emp-routes.ts`, `api/emp-state.ts` | The employee surface, reusing the four-state envelope |

## 5.6 NEW — Fluent metadata

- **Roles**: `x_335329_sn_hr_erp.employee` (**V7**), `x_335329_sn_hr_erp.hr_agent`,
  `x_335329_sn_hr_erp.integration` (the dispatcher's identity). All four `containsRoles` lists stay
  empty (L0-D2).
- **Scripted REST**: `RestApi` service `emp` — routes `/payslips`, `/payslip` (binary),
  `/leave/balance`, `/leave/types`, `/profile`, `/documents`, `/write-status`, `/benefits`,
  `/costcentres`. `authentication: true` on **every** route (that flag, not an ACL list, is what
  produces the 401 — see `hub-api.now.ts`).
- **Catalog**: `CatalogItem` × 10 (HR Document Center D1–D10, unpublished until configured) +
  `CatalogItemRecordProducer` × 4 (personal data, banking, leave request, expense claim) +
  `VariableSet` for expense lines (multi-row) + `CatalogClientScript` for client-side attachment
  validation + `UserCriteria` for country/landscape publication guards.
- **Flows** (`wfa`): `leave-request`, `personal-data-update`, `banking-update`, `expense-claim`,
  `document-issue`, `onboarding`, `offboarding`, `comp-change`. Plus **one `Subflow`
  `erp-write-subflow`** every one of them calls — the write is never inlined into a flow.
- **ScheduledScript** × 3: confirm poller, cut-off release, reference-cache refresh. All three
  `on_demand` + `active: false` (L3-D8, CLAUDE.md rule 4).
- **ACLs**: ~40 rows, §7.
- **UI Page**: the existing `hubPage` is reused; the employee tab set is inside the same bundle.

---

# §6 — The two structural gaps, designed

## 6.1 Binary payload path (NV-5) — the honest version

**The problem the BA did not state (V13).** BRD R1 says the PDF is "streamed to the employee —
never stored at rest in ServiceNow", and NV-25 AC2 asserts `sys_attachment` row count is unchanged.
ServiceNow's only documented route for binary out of `RESTMessageV2` is
`saveResponseBodyAsAttachment(table, sysId, filename)` — which writes `sys_attachment`.
`RESTResponseV2.getBody()` returning binary intact is **undocumented and has never been tested on
this instance**; a truncated or charset-mangled PDF still begins `%PDF-`, so NV-5's own magic-byte
check would pass a corrupt file. Designing on that assumption would be exactly the "builds clean,
dead at runtime" failure trap 1 already cost this repo two cycles.

**The design — stage and shred (OD43).**

```
GET /api/x_335329_sn_hr_erp/emp/payslip?period=…
  1  authorise:  gs.hasRole(employee) ∧ emp_xref match  (OD46)         → 403 { "result": { "error": … } }
  2  scope guard: erp_scope_grant(payslip_document, read)              → not_configured, 0 HTTP
  3  spool = insert bin_spool { token, created_at }                    ← ephemeral holder
  4  try {
       msg.setRequestHeader('Accept', map.accept_mime || 'application/pdf')
       msg.saveResponseBodyAsAttachment('x_..._bin_spool', spool.sys_id, filename)
       execute()
  5    gate A  HTTP status classify (+ error_predicate)
       gate B  Content-Type ∈ erp_system.allowed_mime_types      else → discard, "unexpected format (<ct>)"
       gate C  first 5 bytes === '%PDF-'                          else → discard, same sentence
       gate D  content_length ≤ max_attachment_bytes              else → discard, "exceeds … <n> MB"
  6    stream GlideSysAttachment bytes to the response,
         Content-Type from gate B, Content-Disposition filename carrying the period label
  7  } finally {
       delete every sys_attachment on the spool row; delete the spool row
     }
  8  call_log: content_type, content_length, status, duration.  NEVER the bytes.
  9  doc_audit: user, erp_employee_key, period, timestamp.       NEVER the content.
```

**Upload direction** is the mirror and is cheaper: the bytes are *already* a `sys_attachment` on the
RITM, so `msg.setRequestBodyFromAttachment(attachmentSysId)` needs no spool and adds no exposure.
`erp_write.erp_ack_ref` takes the ERP's returned identifier via `confirm_ack_path`.

**What this costs, stated because it must be:** the bytes exist in `sys_attachment` for the duration
of one transaction. DL-D2's *purpose* — that no queryable store of HR data exists in ServiceNow —
holds; its literal wording does not. NV-25's AC is therefore restated as: **`sys_attachment` row
count is unchanged when measured before the request and after it completes, and a query for the
spool table's attachments after the response returns zero rows.** A test that samples mid-transaction
would see a row, and pretending otherwise would be the dishonesty this repo's rules exist to prevent.
→ **OQ-17: does the DPO accept transient at-rest?**

**Failure discipline.** Gates B, C and D discard the bytes and deliver nothing. There is no path on
which a non-PDF reaches the browser with a `.pdf` filename — extension, content type and magic bytes
all derive from one `resolveFormat()`-style return, the pattern `src/server/hr/render.ts` already
proves. **HTML is never delivered as PDF** (rule 2).

## 6.2 Write path with confirmable status (NV-3, NV-4, NV-8) — the design

**Where the write lives.** `erp-connector.ts` gains `submit(systemSysId, object, operation, params)`
— *not* a new dispatcher that calls `RESTMessageV2` directly. Reason: the retry loop, the circuit
breaker, `Retry-After`, the classification and `call_log` all live in that file, and a write that
bypasses them fails TRD §2 error semantics, §2 throughput and BRD §7 error handling in one stroke.
The file's own comment already specifies the contract: *"the first method that can mutate an ERP
must check `system.active && !system.readOnly` before dialling, and must log its refusal."*

**The dispatch order is the design.** Each step is a hard stop; none is skippable; all are
re-validated by the dispatcher itself, not only by a Business Rule (OD44).

```
1  scope grant        no active erp_scope_grant(object, operation)  →  state=not_configured, 0 HTTP
2  read_only          erp_system.read_only = true                   →  state=blocked,        0 HTTP
3  originating case   source_table/source_record empty              →  refused at insert
4  approval gate      policy.required ∧ ¬(approved ∧ same case ∧
                        approval.sys_updated_on < first_sent_at)    →  state=blocked_approval, 0 HTTP
5  cut-off gate       payroll-affecting ∧ (no calendar row
                        ∨ now > cutoff)                             →  state=blocked_cutoff,  0 HTTP
6  idempotency        key computed; mode=header → set header
                      mode=existence_check → probe first
                      mode=none ∧ operation=create                  →  map refused at save
7  dispatch           erp-connector.submit()  →  state=sent, first_sent_at, attempts++
8  confirm            confirm_ack_path resolves an identifier?      →  state=confirmed, erp_ack_ref
                      2xx with nothing resolvable                   →  state=failed
                      async: state stays sent; poller resolves
                      sent longer than confirm_timeout_ms           →  state=failed  (never confirmed)
```

**A 2xx is never by itself success.** `confirm_ack_path` blank on an object map means every write
through it lands `failed` with `Write returned no confirmable status (TRD §2 Write pattern)`. That
is the map being unusable, and the control tower says so.

**Idempotency (NV-4).** `idempotency_key = sha256(logical_object|operation|external_id|source_record|discriminator)`
where `discriminator` is the document type, the pay period, or the leave start date — whatever makes
two *legitimately different* writes from the same case distinct. Byte-stable across retries by
construction: no timestamp, no random, no attempt counter. A unique index on
`(erp_system, idempotency_key)` makes the second insert a **database** rejection, not a script one.
Where the vendor supports neither a header nor an existence-check endpoint, the object map is
**refused at save** and the shortfall is recorded as a **vendor gap**, never worked around.

**Auditability (NV-8, TRD §5, V8).** Every `erp_write` row carries `source_table`+`source_record`,
`approval_ref`, `requested_by`, `approved_by`, `first_sent_at`, `confirmed_at`. The outbound request
carries the originating record number in a **vendor-agreed header named in `erp_scope_grant.source_note`**
— and where the vendor has no such field, that is recorded as a gap, not invented. Separately, and
this is V8's point, `erp_system.integration_identity` + `_source_note` record the ERP-side principal
and the citation proving the ERP's own audit log distinguishes it from a manual UI change. **No
citation ⇒ the control tower renders `Integration identity not evidenced` and the TRD §5 audit-trail
row is `Not confirmed`, not `Pass`.**

**Sensitive values never enter the write log.** `field_map.sensitive = true` (IBAN, salary
`new_value`/`old_value`, national ID) excludes the value from `call_log`, `erp_write`,
`erp_exception`, `doc_audit`, `usage_event` and every notification body. `erp_write.request_hash`
holds a hash of the payload so a retry is provably the same request without the payload being
readable. **The hash is salted per instance** — an unsalted hash of a 22-character IBAN is
brute-forceable in seconds and would be a shadow copy in disguise.

---

# §7 — Security design

## 7.1 Roles and self-scoping (V7)

| Role | Grants |
|---|---|
| `x_335329_sn_hr_erp.employee` | **NEW.** Read *own* payslip list, own leave balance, own profile, own write status. Order HR Document Center items for self. Nothing else. |
| `x_335329_sn_hr_erp.hr_agent` | **NEW.** Employee lookup/bind, exception queue, approval tasks, reconciliation view, on-behalf-of document requests. |
| `x_335329_sn_hr_erp.hr_viewer` | Existing. Unchanged. |
| `x_335329_sn_hr_erp.admin` | Existing. Control-tower configuration. |
| `x_335329_sn_hr_erp.integration` | **NEW.** The only role permitted to write `erp_write.state`. Held by no interactive user. |

All `containsRoles` lists stay empty (L0-D2). `employee` does **not** imply `viewer`.

**Self-scoping is enforced twice, deliberately:**
1. **Server, per request** — `isEmployeeSelf()` in `role-check.ts`: `gs.hasRole()` in the caller's
   real session plus an `emp_xref` match on `(user = gs.getUserID(), erp_system)`. Never queries
   `sys_user_has_role` (D14, trap 9).
2. **Row level** — an ACL read condition on `emp_xref`, `erp_write`, `doc_req` and `usage_event`
   restricting a caller holding only `employee` to rows whose subject resolves to their own
   `emp_xref`. `hr_agent` and `admin` are exempt by role, not by condition.

Layer 1 alone is a script branch. Layer 2 alone leaves the Scripted REST payload unshaped. Both.

## 7.2 The approval gate is structural (NV-9, V15, OD44)

"Structurally unable to fire before the approval record exists" means the write cannot be reached by
editing a condition. Four mechanisms, and no single one is the gate:

1. **`erp_write.state` is Shape A deny-write to every role except `integration`.** Nobody — full
   admin included — moves a row to `queued` or `sent` by editing the record. `adminOverrides: false`
   written explicitly (trap 3).
2. **`before insert` on `erp_write`** refuses a row whose `(logical_object, operation, country)`
   resolves to an active `write_approval_policy` with `required = true` and whose `approval_ref` is
   empty. Message: `Approval record missing — write refused.`
3. **The dispatcher re-validates independently** immediately before dial: the `sysapproval_approver`
   record exists, `state = approved`, its `sysapproval` resolves to the same `source_record`, and
   `sys_updated_on < erp_write.first_sent_at`. **This is the mechanism that survives trap 5** — if
   (2) throws and is swallowed, (3) still refuses and no HTTP request is issued.
4. **`sysapproval_approver.state` is ACL-protected** so a user who is not the assigned approver
   cannot self-approve. Tested by re-read (trap 4), never by status code.

**A retroactive approval does not satisfy the gate** — the `sys_updated_on < first_sent_at`
comparison is the whole reason `first_sent_at` is stamped at dispatch attempt, not at confirmation.

**`write_approval_policy` seed rows** — the five the BRD mandates plus the five gated documents,
each with `source_note` citing its BRD section:

| logical_object.operation / document | required | Citation |
|---|---|---|
| `employee_profile.bank_account_iban` (INT-05) | true | BRD R2 key requirement, §7 Approval integrity, §9 risk 2 |
| `compensation_change.update` (INT-06) | true | BRD R6, §7 |
| `employee_profile.terminate` (INT-07) | true | BRD R8, §7 |
| `expense_claim.create` | true | BRD R4 "HR/Finance validates against policy" — **assumption A3/OQ-4** |
| document D2, D6, D7, D8, D9 | true | BRD §6.1a |
| `employee_profile.update` (address/phone/emergency) | **no row** | BRD R2 explicitly permits auto-sync (A5) |
| `benefit_enrollment.update` (R9) | **no row, addable** | BRD is silent — A4/OQ-5 |

The policy table is deny-write to everything except `admin`, `adminOverrides: false`, and every
change writes an audit row (NV-33 AC1).

## 7.3 ACL inventory

~40 rows. Every one sets `adminOverrides` **explicitly** — the SDK default is `true` and a deny rule
omitting it is silently admin-overridable (trap 3, D17).

| Table | Rules |
|---|---|
| `erp_write` | read: `hr_agent`, `admin`, self-scoped `employee`. create/write: `integration` only. **Shape A deny-write on `state`, `first_sent_at`, `confirmed_at`, `erp_ack_ref`, `idempotency_key`, `request_hash`** (`decisionType: 'deny'`, `script: 'answer = false;'`, `adminOverrides: false`) |
| `write_approval_policy` | read: `hr_agent`, `admin`. write/create/delete: `admin`. Shape A deny on `required` for everyone below `admin` |
| `erp_scope_grant` | read: `viewer`. write: `admin`. Shape A deny on `source_note` |
| `payroll_calendar` | read: `viewer`. write: `admin` |
| `erp_exception` | read/write: `hr_agent`, `admin`. Never readable by `employee` — it can quote an ERP message |
| `emp_xref` | read: self-scoped `employee`, `hr_agent`, `admin`. write: `hr_agent`+`admin`. **Shape A deny on `erp_employee_key` after insert** (write once, NV-10 AC4) |
| `usage_event` | read: `admin`. create: `integration`. **No update, no delete for anyone** |
| `bin_spool` | no read for any role. create/delete: `integration` |
| `doc_req` attachment | read restricted to requester + `hr_agent`, matching the request's own ACL (NV-36 AC6) |
| `emp_case`, `emp_case_task` | read: subject + `hr_agent` + `admin`. write: `hr_agent` |
| `field_map` | existing rules retained; `sensitive` gains Shape A deny-write below `admin` |

**Every ACL test in the test plan re-reads the value and writes a control field in the same
request** (D17 / trap 4). A test asserting on HTTP status passes against a completely broken ACL.

---

# §8 — Per-story design

Format per the architect contract. Scope is `x_335329_sn_hr_erp` throughout; update set
`SN-HR-ERP Noviq L7-L9` (one per epic on delivery, named `…Noviq-EpicA` … `…Noviq-EpicK`).
**N** = NEW, **E** = EXTENDS (file named), **R** = REUSED AS-IS.

## Epic A — Integration Foundation

### NV-1 — Token auth, Basic exception path
- **Tables:** `erp_system` **E** (auth_type choices, `auth_exception_ref`, `environment`).
- **Business Rules:** `validate-erp-system.ts` **E** — three branches: basic∧production∧empty ref → abort with the exact NV-1 sentence; whitespace-only ref → same; `oauth2_client_credentials` with empty alias → `OAuth 2.0 selected but no Connection & Credential Alias is set.`
- **Script Includes:** `rest-client.ts` **E** — one token refresh on 401, then non-retriable.
- **UI:** control-tower badge. **ACLs:** existing `erp_system` rules retained. **Integrations:** `sys_auth_profile`, `connection_alias`.
- **Risks:** trap 5 — this rule is module-backed, so the `.ts`-extension grep is mandatory before the gate. The 401-refresh counter must live in the attempt loop, not in `sendOnce`, or a breaker-open system refreshes forever.
- **Conflict:** C2/OD38 recorded, not resolved. Carried to §10.

### NV-2 — Least-privilege scope grants
- **Tables:** `erp_scope_grant` **N**.
- **Script Includes:** `platform/scope-guard.ts` **N**, called by `erp-connector.fetch()` and `.submit()` **E** *before* the breaker check, so a refusal costs nothing.
- **Business Rules:** distinct-role check on `banking`/`compensation` grants; mandatory `source_note`.
- **Risks:** the refusal must produce `not_configured` with **zero** outbound HTTP. Asserting "zero requests" needs the ERP-side log or near-zero elapsed time — the same technique T18 already uses for `mutual`.

### NV-3 — Confirmable write path — **reverses DL-D3, blocked on OD42**
- **Tables:** `erp_write` **N**; `erp_system` **E** (`confirm_timeout_ms`); `object_map` **E** (`operation`, `confirm_ack_path`, `confirm_status_*`, http verbs).
- **Script Includes:** `erp-connector.submit()` **E**; `write/dispatcher.ts` **N**; `write/confirm-poller.ts` **N**.
- **Flows:** `erp-write-subflow` **N** — the only path any flow uses to write.
- **Scheduled:** confirm poller, `on_demand` + `active: false`.
- **ACLs:** §7.3 `erp_write` block.
- **Dependencies:** NV-1, NV-2, **and a logged OD42**.
- **Risks:** V5 — a dispatcher that calls `RESTMessageV2` directly loses retry/breaker/`call_log`. Trap 5 — insert validation alone is not the gate.

### NV-4 — Idempotency
- **Tables:** `erp_write` **E** (`idempotency_key` + unique index with `erp_system`); `object_map` **E** (`idempotency_mode`, `idempotency_header`, `existence_check_path`).
- **Script Includes:** `write/idempotency.ts` **N**.
- **Risks:** the key must contain no clock and no attempt counter. `sha256` via `GlideDigest`; if unavailable in scope, a documented deterministic concatenation with length-prefixed segments — **never** a naive join, which collides on delimiter-bearing values.

### NV-5 — Binary transport — §6.1
- **Tables:** `bin_spool` **N**; `call_log` **E**.
- **Script Includes:** `connector/binary-client.ts` **N** (relative imports carry `.ts` — trap 1).
- **Risks:** V13/OD43. The `%PDF-` check is necessary and **not sufficient** — it does not prove the body is undamaged. A round-trip byte-length assertion against `Content-Length` is the cheapest additional check and is in the test plan.

### NV-6 — API version and deprecation as data
- **Tables:** `erp_system` **E** ×4; `call_log` **E** (`sunset_header`, `deprecation_header`).
- **Business Rules:** version-token warning on save (**warning, save succeeds**).
- **Risks:** `deprecation_notice_days` empty renders `Deprecation policy not stated by vendor`; a literal `0` is a *finding*, not an absence. Two different renders from one column — the four-state rule in miniature.

### NV-7 — Payroll cut-off
- **Tables:** `payroll_calendar` **N**; `erp_write` **E** (`effective_cycle`).
- **Script Includes:** `write/cutoff.ts` **N**.
- **Scheduled:** release job, `on_demand` + `active: false`.
- **Risks:** **no calendar row ⇒ refuse.** Passing through on the assumption that no calendar means no cut-off is the single most dangerous default in this backlog. Trap 13 — `cutoff_datetime` that fails to parse must fail the gate, not be read as absent.

### NV-8 — Auditability both sides
- **Tables:** `erp_write` **E**; `erp_system` **E** (`integration_identity*`, **V8**); `sys_property` `erp_write.retention_days` **N**, **no default**.
- **ACLs:** Shape A deny-write block, `adminOverrides: false`.
- **Risks:** V8. A case number in a header is not the same requirement as a distinguishable ERP audit identity; both are needed and only one is testable from ServiceNow.

### NV-9 — Approval gate — §7.2, OD44
- **Tables:** `write_approval_policy` **N** (10 seed rows, each cited).
- **Script Includes:** `write/approval-gate.ts` **N** + the dispatcher's independent re-check.
- **Flows:** approval `Subflow` **N**.
- **ACLs:** `sysapproval_approver.state` protection; policy table deny-write.
- **Risks:** V15/trap 5. Also: `sysapproval_approver` is a Global table — the ACL is authored against it from this scope and must be verified not to collide with a platform rule.

### NV-10 — Shared employee identifier — **EXTENDS `emp_xref`, does not create a table (V3)**
- **Tables:** `emp_xref` **E** (`retired`, `id_source`, `linked_by`, `linked_on`, second unique index).
- **Business Rules:** write-once on `erp_employee_key`; audit row on change; refuse assignment of a `retired` key.
- **UI:** every ERP-backed surface renders `Your record is not yet linked to the ERP — contact HR` and **no figure** when unlinked.
- **Risks:** an identity mismatch blocks **reads too**, not only writes — a read against the wrong employee is a data-protection incident, and the BA got this right.

### NV-11 — Attachment limits
- **Tables:** `erp_system` **E** ×3.
- **Components:** `CatalogClientScript` **N** (client), Scripted REST validation **N** (server, returns 413 inside the `{"result": …}` wrapper — trap 2).
- **Risks:** with limits empty the control is **not rendered** and the item is not orderable. A guessed default fails the AC and violates repo rule 5.

### NV-12 — Classification and exception queue
- **Tables:** `erp_exception` **N**.
- **Script Includes:** `classify.ts` **E** (`classifyBody`, **V6**) — this is the one place the story's "no second classifier" instruction must be read as *extend*, not *ignore*.
- **UI:** HR-facing list view, assignment group mandatory at insert.
- **Risks:** the eight `category` values are a closed list; a generic `Error` fails the AC. `sync_run.error_message` never reaches an employee-facing surface (P6).

### NV-13 — Synchronous on-demand reads
- **Components:** `api/emp-data.ts` **N** reusing `state-resolver.ts` **R** and the `docs/api-contract.md` envelope **R**.
- **Risks:** the "last good figure within the same user session" allowance must be session-scoped and must render a **date and a time**. Anything persisted across sessions is a cache and fails NV-13 AC5.

### NV-14 — Data-format conformance
- **Components:** `field-mapper.ts` **E** — new-format shape detection + unit test; currency unmapped ⇒ figure unrendered.
- **Risks:** **trap 13, and this story is what closes it.** A parse failure must set the tile `failed`; today it leaves the column empty and the column reads as absent.

### NV-15 — Sandbox and vendor onboarding
- **Tables:** `vendor_onboarding` **N**; `erp_system.environment` **E**.
- **Risks:** unchecked renders `Not confirmed`, never `No`. Cegid and PHC ship with every item `Not confirmed` and `source_note = No research exists — see alignment §6.3` (C4, repo rule 5).

### NV-16 — Rate limits and latency
- **Components:** `rest-client.ts` **E** throttle (queue, never drop); `call_log` **R** telemetry.
- **Risks:** TRD §6's figures are planning assumptions and must not harden into defaults (A7/OQ-8). With `rate_limit_per_min` empty, **no throttle** — a guessed one fails the AC.

## Epic B — Logical entity model

### NV-17 — Employee entity completed
- **Components:** `contract/objects.ts` **E**, `choices.ts` **E**, `field_map.sensitive` **E**.
- **Risks:** the seven existing field names are **unchanged** (L6-D9 renamed them once already; a second rename orphans `call_log` and every `field_map` row). No seeded mapping without `source_note` (OD37).

### NV-18 — PayslipDocument, IncomeStatement
- **Components:** two logical objects **N**, `category: null` (OD45).
- **Risks:** the "listed vs retrievable" split — one number conflating them fails the AC. Two counts, two sentences.

### NV-19 — LeaveBalance, LeaveRequest, leave reference data — **plus `absence_reason_ref` (V11)**
- **Risks:** a balance without `balance_unit` renders **no number at all**. `0` only under a successful response containing zero.

### NV-20 — ExpenseClaim, Attachment
- **Components:** child collection `expense_line` via the array-predicate path syntax (OD38) **R**.
- **Risks:** total ≠ sum of lines refuses submission naming both figures; VAT unmapped renders `Not applicable`, never `0`.

### NV-21 — CompensationChange, BenefitEnrollment, TimesheetEntry, CostCentre — **plus `salary_history` (V9) and `benefit_contribution_history` (V10)**
- **Risks:** `new_value` and `old_value` are `sensitive = true`. `effective_date` mandatory on all three write entities. Inactive cost centre refuses, never silently reassigns.

## Epic C — Identity & Onboarding

### NV-22 — Employee lookup (INT-02)
- **Components:** Scripted REST search proxy **N**; workspace/BYOUI lookup component **N**; bind ACL.
- **Risks:** never auto-bind on multiple candidates; `No matching ERP employee found` must be visually distinct from `ERP did not answer`; a candidate already bound refuses (second unique index, §5.2).

### NV-23 — Create employee on onboarding approval (INT-03) — write, blocked on OD42
- **Components:** `emp_case` **N**, onboarding Flow **N** → `erp-write-subflow` **N**.
- **Risks:** banking fields are excluded from the create payload unless the banking approval exists — the create then raises a **separate** R2 banking write task. Retry after timeout runs the existence check first.

## Epic D — Payroll & Tax Documents

### NV-24 — Payslip period list (INT-08)
- **Components:** `GET /emp/payslips` **N**; React `PayslipList.tsx` **N** consuming `state-renderer.ts` **R**.
- **Risks:** metadata only — no base64 anywhere in the response. A row with empty `document_reference` renders `Retrieval unavailable` and its control is **absent**, not disabled (rule 1, OD47).

### NV-25 — Payslip PDF retrieval (INT-09)
- **Components:** `binary-client.ts` **N** §6.1; `GET /emp/payslip`; `doc_audit` **R**.
- **Risks:** V13/OD43 — the AC is restated per §6.1. 403 body carries the `{"result": …}` wrapper (trap 2). Authorisation is `gs.hasRole()` + `emp_xref` match, never a `sys_user_has_role` query (trap 9, D14).

### NV-26 — Annual income / tax statement (INT-10)
- **Risks:** *"`tax_withheld` of zero renders `0` only under a successful response containing zero"* — the highest-risk `0` in the backlog. `zero_is_meaningful` on that field, handled in `field-mapper.mapRecord` (L2-D7) **R**.

## Epic E — Leave & Absence

### NV-27 — Live leave balance (INT-11) — four states distinguishable from the screen alone.
### NV-28 — Leave types + absence reason codes (INT-14) — `ref_cache` **N**, `object_map.cacheable` **E**. **No hard-coded fallback list, ever** (rule 5). No cache and a failed fetch ⇒ the form is not rendered.
### NV-29 — Write an approved leave request (INT-12) — write, blocked on OD42. Cut-off gate applies. The RITM status string matches `erp_write.state` one-for-one (OD47).
### NV-30 — Status read-back and cancellation (INT-13) — divergence between ServiceNow approval and ERP status raises `Conflict / duplicate` (G7). No cancel `object_map` ⇒ **no Cancel control**; a button that raises a case instead is a button that cannot commit its decision.

## Epic F — Personal & Banking Data

### NV-31 — Prefill (INT-01) — IBAN masked to last four; full value never in the page payload. ERP unreachable ⇒ form read-only, **Submit control absent**.
### NV-32 — Non-sensitive update (INT-04) — changed fields only. No approval policy row (A5). Banking field in the payload ⇒ server-side rejection.
### NV-33 — Banking / IBAN (INT-05) — write, blocked on OD42. §7.2 gate. Prior-of-record contact captured **at submission**, notification fires **only on `confirmed`**. Distinct ERP scope grant. A 422 does **not** consume the approval.

## Epic G — Expenses

### NV-34 — Expense claim (INT-15) — multi-row `VariableSet` **N**, multipart via `binary-client.ts` **N**. Receipt-then-claim ordering: receipts are uploaded **under the claim's idempotency key** so an orphan cannot outlive a failed claim.
### NV-35 — Claim status (INT-16) — unrecognised status shown raw, never coerced. Empty `erp_claim_reference` ⇒ `Not yet recorded in the ERP` and **no status call issued**.

## Epic H — HR Document Center — **all of D1, D2, D4–D10 gated on OD41 / OD2 branch (b)**

### NV-36 — The category and the R5 pattern (INT-17)
- **Components:** `doc_type`/`doc_tmpl` **E** (not a new `document_template` table — they exist); `hr/assemble.ts` **R**; `hr/render.ts` **R**; catalog category + 10 `CatalogItem` **N**; publication guard `UserCriteria` **N**.
- **Risks:** **OD41.** On this instance the output is labelled HTML. NV-36 AC5 (`%PDF-`) is unsatisfiable until a human installs `sn_pdfgeneratorutils`. Any `mandatory` placeholder unresolved ⇒ **no document at all** — no blank, no em-dash, no `0`.

### NV-37 — Idempotent archival (INT-18) — write + binary, blocked on OD42 **and** OD41. Archival of an HTML artefact is refused by default (§2.3). The employee **keeps** the RITM attachment when archival fails; RITM shows `Issued. ERP archival pending.`
### NV-38 — Archived-document list (INT-19) — doubles as NV-4's existence check for archival; one implementation. Upload-without-list ⇒ reconciliation view **not rendered**, and the control tower says why.
### NV-39 — D1, D3 — D3 rides NV-24/25 and is the only Epic H item shippable now; byte-identical to a direct download. D1 blocked on OD41.
### NV-40 — D2, approval-gated — attachment **not created** pre-approval; the test re-reads and asserts no attachment exists, not that a control is hidden.
### NV-41 — D4, D5, D10 — D5's zero-balance certificate is the sharpest `0` in the backlog: a failed read **aborts generation**, it does not certify zero. D10 unpublished until `benefit_enrollment` is mapped **and** `benefit_contribution_history` (V10) resolves.
### NV-42 — D6, D7, D8, D9 — needs `position_history` (G6) and `salary_history` (V9); `final_pay_calculation` / `leave_payout` remain unmodelled (G5/OQ-6) and D7 is unpublishable until they are. D8 **retrieves** the signed contract via NV-25, never regenerates it.
### NV-43 — Per-jurisdiction templates — `platform/country.ts` **N**, the single resolution function (NV-51 AC3). **No cross-country fallback** — the wrong legal wording is worse than no document.

## Epic I — Employment Lifecycle

### NV-44 — Compensation change (INT-06) — write, blocked on OD42. Multi-stage approval; Finance stage mandatory when `change_type = salary`. **V14:** `old_value` comes from a live INT-01 read taken at approval time and is stored as a **hash plus a masked display**, never as a figure (it is `sensitive`).
### NV-45 — Offboarding (INT-07) — **Phase 1 is orchestration-only and is NOT blocked on OD42.** `emp_case` + `emp_case_task` **N**, manual confirmation task, ERP read-back comparison, case cannot close on mismatch. **No Submit-to-ERP control rendered at all in phase 1.** Phase 2 needs the `delete` verb to exist so binding it can be *refused* (V4). IT/asset revocation proceeds independently of the ERP write state.

## Epic J — Benefits & Time

### NV-46 — Benefits (INT-20/21) — no default approval row (A4/OQ-5); plan options from ERP reference data only, never hard-coded, never free-text.
### NV-47 — Timesheet (INT-22/23) — **blocked on NV-52's `native_timesheet_in_use` being answered.** No reference data and no cache ⇒ form not rendered. A free-text cost centre posts real cost to the wrong place and fails absolutely.

## Epic K — Non-functional, governance, certification

### NV-48 — Data minimisation, provably — CI assertion **N**: zero `erp_staging` rows for the seven live-only objects; seeded-sensitive sweep across `call_log`, `erp_write`, `erp_exception`, `doc_audit`, `usage_event`, `sys_email`, `syslog`. Build fails on a hit. Retention: every new table declares one; unset renders `Retention not set` (OQ-7).
### NV-49 — Store certification readiness — **V12: AC1 is restated.** D16 records four Global-scope records created *by the platform* when this app's roles deploy. The correct assertion is *zero Global `sys_metadata` records **authored by this app's source**, with the four platform-created records enumerated and explained in the evidence pack.* Also: build-time lint (no `var` in Fluent, no `gs.nowDateTime()` in scope, no `eval`, every `src/server/` relative import ends `.ts`), ACL enumeration failing on any unset `adminOverrides`, uninstall behaviour documented per trap 8 (**not** claimed clean), every scheduled job `active: false` + `on_demand`.
### NV-50 — Usage telemetry — `usage_event` **N**, instrumentation in the shared read/write paths only (one hook, not per-flow). Best-effort: a telemetry failure never blocks a user transaction. `No usage recorded` ≠ `0 requests`.
### NV-51 — Country-aware model — `platform/country.ts` **N** used by all five tables with **one** fallback rule. Country resolved from the **ERP record**, not the ServiceNow user's location; a mismatch raises an exception rather than preferring one.
### NV-52 — Landscape discovery gate — `landscape_discovery` **N** + publication guard. Incomplete discovery ⇒ **no catalog item in Epics C–J is published** and the HR Document Center category is empty rather than partially correct.

### NV-53 — **NEW STORY (V1): the employee surface itself**
The BA recorded OQ-16 and wrote no story for it. This is that story.
- **As a** ServiceNow Platform Owner **I want** the employee-facing surface built on components that exist on the target instance **so that** Epics C–J have somewhere to render.
- **Components:** `RestApi` service `emp` **N** (9 routes, `authentication: true` on every one); React employee tab set inside the existing bundle **N**; base Service Catalog category + items **N**; `emp_case`/`emp_case_task` **N**; `erp_write.source_table`/`source_record` polymorphic pair **N**.
- **Acceptance:** no `sn_hr_core_*` identifier appears in any authored file (grep, zero hits); the SPA renders every state through `state-renderer.ts` and no component branches on `st`; swapping `source_table` to `sn_hr_core_case` requires zero code change.
- **Priority:** High — P0 enabler for Epics C–K. **Dependencies:** OD40.

---

# §9 — Dev Instructions

## 9.1 Governance preconditions — nothing below starts until these exist

| # | Gate | Blocks |
|---|---|---|
| G-1 | **OD40** logged (surface) | everything |
| G-2 | **OD42** logged (write-back reverses DL-D3) | every write story |
| G-3 | **OD43** logged (transient at-rest binary) + OQ-17 answered | NV-5, NV-25, NV-37 |
| G-4 | **OD41** logged + OD2 resolved to branch (b) *or* accepted as HTML-only | D1, D2, D4–D10 |
| G-5 | OD44, OD45, OD46, OD47 logged | NV-9, Epic B, NV-13, every UI control |
| G-6 | NV-52 landscape discovery record complete for the deployment | any catalog publication |
| G-7 | `now-sdk auth --add …` run in a real terminal | any deploy at all |

## 9.2 Build order

Strictly dependency-respecting. Each step ends with `npm run build` and, before any gate is claimed,
the trap-1 grep and the `syslog` check from D19.

**Phase 0 — guards (do first, they protect every later step)**
```
B0.1  Add the D19 grep + the NV-49 lint to the build script:
      grep -rn "from '\./\|from '\.\./" src/server/ | grep -v "\.ts'"   → must be empty
      grep -rn "\bvar \b" src/fluent/                                    → must be empty
      grep -rn "gs\.nowDateTime\|eval(" src/server/ src/fluent/          → must be empty
B0.2  Add the NV-48 CI assertion skeleton (fails on any hit; empty is a pass).
```

**Phase 1 — control tower extensions (no runtime behaviour changes yet)**
```
B1.1  choices.ts + contract/objects.ts: the 12 new logical objects, all category:null, plus
      employee_profile's 7 new fields.  DO NOT touch CATEGORY_CHOICES or the staged list.
B1.2  erp_system columns (§5.2). auth_type: ADD values, never rename.
B1.3  object_map columns (§5.2) incl. put/patch/delete/operation. New unique index.
B1.4  field_map: sensitive, country.  call_log: content_type, content_length, sunset/deprecation.
B1.5  emp_xref: retired, id_source, linked_by, linked_on + second unique index.
B1.6  doc_type / doc_tmpl: country, language, document_type_category, allow_html_archive.
B1.7  New tables 1,3,4,6,7,12 (erp_scope_grant, write_approval_policy, payroll_calendar,
      vendor_onboarding, landscape_discovery, ref_cache).
B1.8  Roles: employee, hr_agent, integration.  containsRoles empty on all.
B1.9  ACLs for everything created in B1.7-B1.8.  adminOverrides EXPLICIT on every row.
      → GATE 1: deploy, then run the ACL re-read tests (test-plan §T-ACL). Do not proceed on a
        status-code-only pass.
```

**Phase 2 — foundation runtime (NV-1, 2, 6, 12, 14, 16, 51)**
```
B2.1  platform/country.ts          (needed by everything that resolves configuration)
B2.2  platform/scope-guard.ts      + wire into erp-connector.fetch() BEFORE the breaker check
B2.3  classify.ts classifyBody()   (V6) — no behaviour change when the predicate is blank
B2.4  rest-client.ts: Accept parameter, put/patch/delete, throttle, 401-refresh-once
B2.5  validate-erp-system.ts branches (NV-1), version warning (NV-6)
B2.6  erp_exception table + assignment rule + list view (NV-12)
B2.7  field-mapper.ts: new-format shape detection, parse-failure → failed state (NV-14, trap 13)
      → GATE 2: the L2 connector gate re-run with the new code. 19 ported cases still pass.
```

**Phase 3 — identity and the employee surface (NV-10, 22, 53) — no writes yet**
```
B3.1  emp_xref business rules (write-once, retired, audit on change)
B3.2  role-check.ts isEmployeeSelf()  (OD46)
B3.3  RestApi 'emp' service, read routes only, four-state envelope reused verbatim
B3.4  React employee tab set in the existing bundle; every tile via state-renderer.ts
B3.5  emp_case / emp_case_task tables + ACLs
B3.6  NV-22 lookup proxy + bind action
      → GATE 3: an unlinked user sees "Your record is not yet linked to the ERP" and NO figure.
```

**Phase 4 — binary path (NV-5, 11, 24, 25, 26, 39-D3)**
```
B4.1  bin_spool table + ACLs (no read for any role)
B4.2  connector/binary-client.ts  — down direction, all four gates, finally-delete
B4.3  GET /emp/payslips (metadata) then GET /emp/payslip (binary)
B4.4  NV-11 limits: erp_system columns, CatalogClientScript, server-side 413
B4.5  binary-client.ts upload direction (setRequestBodyFromAttachment)
B4.6  D3 catalog item riding NV-24/25
      → GATE 4: sys_attachment count unchanged pre/post; spool attachments zero after; a
        text/html response is rejected and nothing is delivered.
```

**Phase 5 — the write path (NV-3, 4, 7, 8, 9) — REQUIRES OD42**
```
B5.1  erp_write table, unique index, Shape A deny-write ACLs, adminOverrides: false explicit
B5.2  write/idempotency.ts
B5.3  write/cutoff.ts + payroll_calendar resolution (no row ⇒ REFUSE)
B5.4  write/approval-gate.ts  + write_approval_policy seed rows (10, each cited)
B5.5  erp-connector.submit()  — read_only + active check FIRST, logged refusal
B5.6  write/dispatcher.ts     — the 8-step order in §6.2, in that order
B5.7  write/confirm-poller.ts as ScheduledScript, on_demand + active:false
B5.8  erp-write-subflow
      → GATE 5: the negative suite. Zero outbound HTTP on every blocked state, proven by
        call_log and by elapsed time. Retroactive approval does not open the gate.
```

**Phase 6 — P0 business stories (R1, R2, R3)**
```
B6.1  NV-27, NV-28 (leave balance, reference cache)
B6.2  NV-31 (prefill, IBAN masked)
B6.3  NV-32 (non-sensitive update)  → first live write
B6.4  NV-29, NV-30 (leave write, status/cancel)
B6.5  NV-33 (banking — approval-gated, prior-of-record notification)
      → GATE 6: the P0 release gate.
```

**Phase 7 — P1: documents, expenses, lifecycle** — NV-36, 37, 38, 39-D1, 40, 41, 42, 43, 34, 35, 23, 44, 45-phase1. **Blocked on OD41 for everything that must be a PDF.**

**Phase 8 — P2 and governance** — NV-46, 47, 21-remainder, 48, 49, 50.

## 9.3 Per-component instructions (the ones with a non-obvious failure mode)

### `connector/erp-connector.ts` → `submit()`
- Type: Script Include (module function), **E**.
- Signature: `submit(systemSysId, object, operation, params): ConnectorResult`.
- Order inside: `loadSystem` → **`if (!system.active || isTrue(system.readOnly)) return refuse(...)`** → scope guard → `loadMap(object, operation)` → retry loop reusing `computeDelayMs`/breaker/`classify` → single `getBody()` call site (still exactly one in the file; the L2-12 grep now expects **1**, unchanged, because `submit()` shares the orchestrator's body read).
- **Do not** add a second `getBody()` call site. **Do not** create a parallel dispatcher module that calls `RESTMessageV2`.
- `read_only` uses `isTrue()` — `getValue()` on a Boolean returns `'1'`/`'0'` (trap 6).

### `write/dispatcher.ts`
- Type: Script Include (module function), **N**. Every relative import ends `.ts`.
- Writes `erp_write.state` **as the `integration` role**; no other code path may.
- Steps in the exact order of §6.2. Each blocked state returns before any HTTP call and writes exactly one `call_log` row with `status = not_configured` or a synthetic blocked code — never zero rows, because "nothing happened" and "we refused" must be distinguishable.
- **Re-validates the approval independently of the Business Rule** (OD44). This is not redundant; it is the only layer trap 5 cannot swallow.

### `write/cutoff.ts`
- `resolve(country, effectiveDate, erpSystem)` returns `{allowed, periodLabel, nextPeriodLabel, payDate}` **or** `{allowed:false, reason:'no_calendar'}`.
- **No row is a refusal.** Message: `No payroll calendar configured for <country> covering <effective_date> — write refused.`
- Parse `cutoff_datetime` through the same `parseDate` shape detection; a parse failure is a refusal, not an absence (trap 13).

### `connector/binary-client.ts`
- Type: Script Include (module function), **N**.
- Never imports or calls `getBody()`.
- The `finally` block deletes the spool attachments **and** the spool row. It must run on every path including the MIME/magic-byte rejections — those discard bytes that are already in `sys_attachment`.
- MIME allow-list comes from `erp_system.allowed_mime_types`; **empty means refuse**, not "allow all".

### `write/approval-gate.ts`
- `check(erpWrite)` → `{ok:false, reason}` unless: policy resolved for `(logical_object, operation, country)` via `platform/country.ts`; `sysapproval_approver` exists with `state='approved'`; its `sysapproval` document resolves to `erpWrite.source_record`; `sys_updated_on < erpWrite.first_sent_at`.
- Where `policy.required = false` or no policy row exists, return `{ok:true}` — **absence of a policy is not a gate**, and NV-32/NV-46 depend on that being true.

### ACL rows (all ~40)
- Template for every deny:
```ts
Acl({
  $id: Now.ID['acl-erp-write-field-state-write'],
  type: 'record', table: 'x_335329_sn_hr_erp_erp_write',
  field: 'state', operation: 'write',
  decisionType: 'deny', script: 'answer = false;',
  adminOverrides: false,      // EXPLICIT. The SDK default is true. Trap 3 / D17.
  active: true,
  description: '…',
})
```
- **Never** omit `adminOverrides`. **Never** assert the rule works from an HTTP status code.

### React employee components
- Framework: **BYOUI React 18.2.0** in the existing bundle (D1/D9). Not UIB, not Service Portal — §2.2.
- Technology: TypeScript, strict. No `any` without a comment naming why.
- State management: the existing `state-renderer.ts` output object. **No component branches on `st`.** A tile with its own state handling fails L5-3 AC1.
- API contract: `GET /api/x_335329_sn_hr_erp/emp/*`, the `docs/api-contract.md` envelope, unwrapped from `{"result": …}` by the existing `api.ts` (trap 2).
- NDS/`@servicenow/react-components` is already a dependency and is used where it covers the need; nothing custom is written for a control it provides.
- **A control that cannot commit its decision is not rendered** — absent, not disabled (rule 1, OD47).

---

# §10 — Decisions needed from a human

Nothing below was resolved by assumption without being listed here.

## 10.1 Carried forward from the BA

OQ-1 (R5 P1 vs D1–D3 P0), OQ-1b (top-10 ranking vs real ticket volume), OQ-2 (cut-off calendar
source), OQ-3 (data residency), OQ-4 (R4 approval formality), OQ-5 (R9 approval gating), OQ-6 (D7's
`final_pay_calculation` / `leave_payout`), OQ-7 (retention periods), OQ-8 (pilot latency figures),
OQ-9 (which side renders the PDF), OQ-10 (Basic-auth exception vs OD38 non-compliance), OQ-11
(existing shared employee ID), OQ-12 (single vs fragmented landscape), OQ-13 (production API for
payslip retrieval and PDF upload), OQ-14 (manual process baseline), OQ-15 (Cegid / PHC in scope),
OQ-16 (**answered here as OD40 — confirm the answer is acceptable**).

## 10.2 Raised by this design

| # | Question | Blocks | Assumption taken meanwhile |
|---|---|---|---|
| **OQ-17** | Does the DPO accept that a payslip's bytes exist in `sys_attachment` for the duration of one transaction? There is no ServiceNow path that moves binary out of `RESTMessageV2` without it. | NV-5, NV-25, NV-37 | Assumed acceptable; OD43 documents the cost and the spool is deleted in a `finally`. |
| **OQ-18** | The delivered surface is the base Service Catalog + this app's BYOUI SPA, **not Employee Center Pro**. Is that commercially acceptable, or must a licensed instance be procured? | Epics C–K | Assumed acceptable (OD40); the polymorphic `source_table`/`source_record` keeps the swap a configuration change. |
| **OQ-19** | `sc_req_item` / `sc_request` presence is **inferred** from the base-catalog record, not probed. Confirm before build. | NV-36, every RITM attachment AC | Assumed present. |
| **OQ-20** | Will someone install `sn_pdfgeneratorutils` from the Store on the target instance? Without it, eight of the ten HR Document Center items ship as labelled HTML and **are not archived to the ERP** (OD41). | D1, D2, D4–D10, NV-37 | Assumed **no**; HTML-only, archival refused. |
| **OQ-21** | Is `RESTResponseV2.getBody()` binary-safe on this instance? If it is, OD43's spool disappears entirely. Nobody has tested it. | Simplifies NV-5 | Assumed **not** safe; the spool is built. |
| **OQ-22** | Does the ERP credential authenticate as a **dedicated integration identity** whose actions are distinguishable from a manual UI change in the ERP's own audit log (TRD §5)? Per vendor, with a citation. | NV-8, NV-49 evidence pack | Assumed unproven; renders `Integration identity not evidenced`. |
| **OQ-23** | Who is the approver for each `write_approval_policy` row — which group, per country? The BRD names the control, not the approver. | NV-9 seed rows | Assumed a single `assignment_group` per policy row, configurable, no default. |
| **OQ-24** | May an ordinary employee hold the new `employee` role by default (e.g. granted to all active users), or is enrolment explicit? | NV-53, every Epic D–J read | Assumed **explicit enrolment**; nobody gets HR data by default. |
| **OQ-25** | R6's `old_value` is `sensitive`. Storing a salary hash plus a masked display satisfies auditability without a shadow figure — is that sufficient for a payroll audit, or must the figure be retrievable? | NV-44 | Assumed hash + mask is sufficient. |
| **OQ-26** | What is the `erp_write.retention_days` value? Ships with **no default** and renders `Retention not set` (extends OQ-7 to the new table). | NV-8, NV-48 | Assumed none; nothing is purged until set. |
| **OQ-27** | Cegid and PHC still have zero research (C4). If either is in pilot scope, the TRD §4 checklist must be run against them before any commitment. **Re-raised because nothing has changed since the BA raised OQ-15.** | NV-15 | Assumed out of pilot scope. |

## 10.3 Conflicts re-stated, not resolved

- **C1 / DL-D3** — reversed *narrowly* by proposed **OD42**. The Tab 2 requisition Approve/Reject
  mirror stays deferred and stays unrendered. This must be logged before Phase 5 starts.
- **C2 / OD38** — TRD §2 forbids Basic in production; this repo's only implementation-grade Unit4
  evidence is a working Basic-auth integration. NV-1 makes the conflict visible in data. **Still
  needs the document owner** (OQ-10).
- **C3** — build gap, closed by NV-5 / OD43.
- **C4** — unchanged (OQ-27).
- **C5** — Epic H sequencing follows §6.2, except D3 (OQ-1).
- **DL-D2** — *not* in conflict with the BRD. Preserved. OD43 extends its wording, never its purpose.
