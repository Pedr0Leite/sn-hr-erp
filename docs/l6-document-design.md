---
title: L6 — HR document generation
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-12
status: design-only. Raises one genuine spec-vs-decision conflict needing a human (§3.3).
grounding: |
  Fluent shapes from `@servicenow/sdk` 4.9.0 `explain` (catalogitemrecordproducer-api,
  service-catalog-guide, businessrule-api, acl-api, scriptinclude-api, table-api).
  Instance capability re-probed live 2026-08-12 (§2). Table names per
  `docs/l0-scaffold-design.md` §2.2.
---

# 1. The rule this layer is governed by

> **A document that cannot be generated correctly is not generated at all, and says why.**

Spec §8.3 non-negotiable 2: *"A blank or a zero on a salary certificate is a document someone
applies for a mortgage with."*

Everything below follows from that. There is **no** partial document, **no** placeholder standing
in for a figure, **no** fallback to a stored value, and **no** file labelled PDF that is not one.

---

# 2. OD2 — the PDF probe, re-run today

Re-probed live on `dev296062`, 2026-08-12, read-only:

| Probe | Result |
|---|---|
| `sys_scope` where `scope = sn_pdfgeneratorutils` | **0 rows — absent** |
| `sys_script_include` where `name = PDFGenerationAPI` (any scope) | **0 rows — absent** |
| `sys_db_object` where `name IN (sys_document_template, document_template)` | **0 rows — absent** |
| `sys_db_object` where `name = sn_hr_core_case` | **0 rows — absent** |

**Confirms the decision log's OD2 findings unchanged. Branch (a) — labelled HTML — is what gets
built.**

L6 is designed so that OD2 resolving the other way **changes the renderer only**:

```
assemble()  →  DocumentContext (plain object, template-variable keys)
                   ↓
             renderHtml(context, template)  →  html string
                   ↓
             ┌── PDF capability probed at runtime? ──┐
            no                                      yes
             ↓                                       ↓
   attach .html, text/html            PDFGenerationAPI.convertToPDF(...)
   output_format = 'HTML'             attach .pdf; verify %PDF-; format = 'PDF'
                                      any check fails → status=failed, NO attachment
```

**The probe runs at generation time, not at deploy time**, and its result is recorded on the
request. Installing the store app later needs no redeploy of this app: the next generation probes,
finds the API, and produces a PDF. Story L6-5 AC1 requires the probe result be *evidence from the
instance, not an inference from the plugin list* — `com.snc.apppdfgenerator` and `com.snc.whtp` are
both active and neither supplies a scoped API.

The probe is `new GlideRecord('sys_script_include')` on `name=PDFGenerationAPI` **plus** a guarded
`typeof` check on the class before calling it. Plugin state is not the question; callability is.

---

# 3. Data model

## 3.1 `employee_xref` — a join key and nothing more

`x_335329_sn_hr_erp_emp_xref`.

| Column | Type | Notes |
|---|---|---|
| `user` | Reference `sys_user`, mandatory | |
| `erp_system` | Reference, mandatory | |
| `erp_employee_key` | String(120), mandatory | the ERP-side employee id |
| `active` | Boolean, default true | |

`index: [{ name: 'idx_emp_xref_user_system', unique: true, element: ['user', 'erp_system'] }]`

**There is no name, salary, grade, address, contract or start-date column, and there must never
be.** Story L6-1 AC2: a dictionary scan at sign-off returns no column that could hold HR content.
**Four columns is the whole table**, and that is the point — the schema is the enforcement.

Read requires `hr_viewer` or `admin`. A `finance_viewer`-only user is refused (story L6-1 AC5).

**Never populated by a sync.** No code path writes it as a side effect of an ERP fetch
(story L6-1 AC6) — asserted by grep: the table name appears in `src/server/hr/` and in ACL/table
declarations, and nowhere under `src/server/sync/` or `src/server/connector/`.

## 3.2 `document_type` — declares what a document needs

`x_335329_sn_hr_erp_doc_type`.

| Column | Type | Notes |
|---|---|---|
| `name` | String(120), mandatory | e.g. `Salary Certificate` |
| `code` | String(60), mandatory, unique | `salary_certificate` |
| `required_objects` | String(200) | comma-separated logical objects, e.g. `employee_profile,payroll_record` |
| `required_fields` | String(1000), mandatory | comma-separated `object.logical_field` pairs |
| `optional_fields` | String(1000) | rendered when present, omitted when not |
| `active` | Boolean, default false | **cannot be set true with an empty `required_fields`** — story L6-2 AC2 |

Two seeded rows:

| code | required_fields |
|---|---|
| `employment_verification` | `employee_profile.employee_full_name`, `employee_profile.employment_start_date`, `employee_profile.job_title`, `employee_profile.employment_status` |
| `salary_certificate` | `employee_profile.employee_full_name`, `employee_profile.employment_start_date`, `employee_profile.job_title`, `payroll_record.annual_gross_salary`, `payroll_record.salary_currency`, `payroll_record.pay_period` |

**These field names are the deliverable** (spec §8.1: *"Naming is load-bearing here, not
cosmetic"*). They read as template variables a human would pick from a list —
`employee_full_name`, `annual_gross_salary`, `employment_start_date` — never `field_1` or `u_val3`.
They are also the logical field names in `src/server/contract/objects.ts` for `employee_profile`
and `payroll_record`, so an admin maps `PERNR` → `employee_full_name` in the same L1 surface as
everything else.

## 3.3 `document_template`, and the seam conflict a human must resolve

`x_335329_sn_hr_erp_doc_tmpl`.

| Column | Type | Notes |
|---|---|---|
| `document_type` | Reference, mandatory | |
| `body` | Html, mandatory | placeholders as `${employee_full_name}` |
| `placeholders` | String(1000) | the declared contract, validated against `body` and against the type |
| `active` | Boolean | |

A `before` Business Rule enforces story L6-2 AC7 in both directions: a placeholder the type does
not provide is refused with
`Template references 'annual_gross_salary', which Employment Verification Letter does not provide.`
A declared field with no placeholder is reported by a validation action.

### The conflict — and it is real, not a wording problem

**Spec §8.1** promises: *"on a licensed instance an admin points a real Document Template at that
exact table and picks those exact fields from a list. … The hand-rolled renderer consumes the
**same** row and the **same** placeholder names, so swapping in the platform feature later changes
the renderer, not the data contract."*

A platform Document Template is **bound to a table**, and its available variables are **that
table's fields**.

**D2** forbids any table with `annual_gross_salary` on it. Story L6-4 AC2 tests it directly:
*"generating a document and then querying every table in the scope for the salary figure that
appeared in it; zero hits required."*

**These cannot both hold for the Salary Certificate.** A row whose fields a Document Template can
pick from is a row that exists in the database; a salary in the database is a queryable salary.

**What is built:** the seam is preserved at the **placeholder-name level**, not the table level.
`DocumentContext` is an **in-memory object** whose keys are exactly the names above; the
hand-rolled renderer substitutes from it; `document_type.required_fields` is the machine-readable
declaration of what a platform template would bind to. The Employment Verification Letter carries
no monetary figure and could be table-backed today; the Salary Certificate cannot.

**Flagged for the human. Three options, and this design does not choose:**

| Option | Effect |
|---|---|
| **(a) Accept the narrower seam.** Placeholder names match; the swap is renderer-only for the verification letter and needs a transient row for the salary certificate | **What is built.** No D2 change |
| **(b) A transient source row** written, rendered, and deleted in the same transaction | Salary lands in the database for seconds and in `sys_audit`/`sys_journal` for longer. **A D2 reversal**, needs a new decision entry |
| **(c) Platform Document Templates only for non-monetary types** | Honest, and splits the document catalogue into two mechanisms |

Recorded here because §8.1 and D2 are both binding and both were written without the other in view.

## 3.4 `document_request`

`x_335329_sn_hr_erp_doc_req`.

| Column | Type | Notes |
|---|---|---|
| `number` | String, auto-number `HRDOC` | |
| `requester` | Reference `sys_user`, mandatory | **deny-write**; set server-side from `gs.getUserID()`, never from the payload |
| `subject_employee` | Reference `sys_user`, mandatory | |
| `document_type` | Reference, mandatory | |
| `status` | Choice, default `pending` | **exactly** `pending` / `generated` / `failed` (story L6-3 AC7) |
| `failure_reason` | String(1000) | readable by the requester (AC8) |
| `generated_on` | DateTime | deny-write |
| `output_format` | Choice | `HTML` / `PDF` — **deny-write**, set by the renderer from what it actually produced |
| `source_call_ids` | String(1000) | comma-separated `call_log` sys_ids — deny-write |
| `pdf_probe_result` | String(200) | deny-write; what the runtime probe found |

Deny-write with `adminOverrides: false` on `requester`, `generated_on`, `output_format`,
`source_call_ids`, `status`, `failure_reason`, `pdf_probe_result` — story L6-6 AC5:
*"an admin cannot retro-edit who requested what."*

`audit: true`. Read is the script ACL of `docs/l0-scaffold-design.md` §5.7 plus a broad `hr_viewer`
allow.

---

# 4. Intake

`CatalogItemRecordProducer` against `doc_req`, on the base **Service Catalog**
(sys_id `e0d08b13c3330100c8b837659bba8fb4`, verified live). No Employee Center dependency —
`com.snc.employee_center` is absent.

Variables: `document_type` (reference, active types only), `subject_employee` (reference `sys_user`,
**defaulted to the caller and hidden unless the caller holds `hr_viewer`**), `purpose` (optional).

## 4.1 The self-service boundary is a Business Rule, not a producer script

Story L6-3 AC3: *"a request submitted via the **Table API** (bypassing the form entirely) naming a
subject employee other than the caller is refused. **A boundary enforced only by hiding a field on
the producer fails this story.**"*

`before` insert on `doc_req`:

```
1. current.requester = gs.getUserID()          // ALWAYS. Never trusted from the payload.
2. if subject_employee is empty → subject_employee = gs.getUserID()
3. if subject_employee != gs.getUserID():
       if NOT caller holds hr_viewer  (per Spike A's mechanism — L0 §6.3)
           abort: "You may only request documents for yourself."
4. if subject_employee does not resolve to an active sys_user:
       abort: "Employee <value> does not exist."       // AC6 — refused at submission, not later
5. if document_type is inactive: abort naming it.
```

Step 1 is why `requester` is deny-write: a Table API caller can put anything in the field, and the
rule overwrites it unconditionally before it is stored.

The role check in step 3 uses the **same single mechanism** L4 uses (L0 §6.3, decided by Spike A).
**Never `gs.hasRole()`** — story L6-3 AC4 is explicit.

---

# 5. Assembly

`src/server/hr/assemble.ts`, invoked by a `ScheduledScript` drainer (`on_demand`, `active: false`
until armed) so that a slow ERP never blocks the submit transaction.

```
generate(requestSysId):
  1. req = load; if status != 'pending' → stop (idempotent)
  2. type = req.document_type; if inactive → fail("Document type <name> is not active.")
  3. xref = employee_xref[user = req.subject_employee, active]
        none → fail("Cannot generate <type>: no employee cross-reference exists for <user>.")   // L6-1 AC4
  4. PRE-FLIGHT, BEFORE ANY RENDERING:
        for each object in type.required_objects:
            map = active object_map[xref.erp_system, object]
            none → fail("Cannot generate <type>: '<object>' is not mapped for system <name>.")
        for each object.field in type.required_fields:
            field_map row present? no → fail("Cannot generate <type>: '<field>' is not mapped for system <name>.")
  5. LIVE FETCH — ErpConnector.fetch(xref.erp_system, 'employee_profile' | 'payroll_record',
                                     { externalId: xref.erp_employee_key })
        record every callLogId onto req.source_call_ids AS IT HAPPENS
        not ok → fail("Cannot generate <type>: the payroll ERP did not answer (<classified error>).")
  6. context = map each required field through field_map into DocumentContext
        value empty/null  → UNAVAILABLE
        value 0 and field_map.zero_is_meaningful == false → UNAVAILABLE          // L1 §4.4
        any UNAVAILABLE → fail("Cannot generate <type>: '<field>' was not returned by <system>.")
  7. render (§6)
  8. attach; status = 'generated'; generated_on = now; output_format = what was produced
```

**Step 4 runs before step 5 and before any rendering** (story L6-4's implementation note). A
document that cannot be completed should not cost an ERP call, and a mapping gap should be
reported as a mapping gap rather than surfacing later as a missing figure.

**Step 6 is where story L6-4 AC6 lives.** A `0` from the ERP is **unavailable** unless the mapping
declares otherwise. `zero_is_meaningful` defaults to `false` (L1 §4.4), so the safe direction is
the default: *"A salary certificate reading `0` is a FAIL, not an edge case."*

## 5.1 Nothing is persisted

`DocumentContext` lives in a local variable and is passed to the renderer. It is **never** written
to a table, a property, a cache, or a log line.

- Every failure message names the **field**, never its value.
- `source_call_ids` holds sys_ids and nothing else — story L6-6 AC4: *"An audit row quoting the
  salary reintroduces the shadow database through the back door."*
- The connector's own C1 chokepoint already guarantees `call_log` cannot hold a body: `CallLogEntry`
  has no field that could (L2 §3, I2).
- The rendered document **is** persisted, as a `sys_attachment` on the request. That is the
  deliverable and is authorised by §8.3 non-negotiable 1.

## 5.2 No fallback, ever

Story L6-4 AC5: *"There is no code path that substitutes a previously-seen value when the live call
fails."* There is nothing to substitute *from* — `payroll_record` and `employee_profile` cannot be
staged (L3 §3.5, enforced three ways), so the fallback is not merely omitted, it is unreachable.

---

# 6. Rendering

`renderHtml(context, template)`: substitute `${placeholder}` from `DocumentContext`.

- **Every placeholder must resolve.** An unresolved one at render time is an internal error →
  `status = failed`, **no attachment**. It cannot happen after step 4's pre-flight, and the check
  exists because "cannot happen" is how a blank lands on a mortgage application.
- All substituted values are HTML-escaped.
- Optional fields are omitted **with their surrounding sentence**, never left as an empty line.

## 6.1 Format labelling

| Probe | Extension | Content type | `output_format` |
|---|---|---|---|
| PDF not callable | `.html` | `text/html` | `HTML` |
| PDF callable and every check passes | `.pdf` | `application/pdf` | `PDF` |

Story L6-5 AC2 requires **four** assertions before a file may be called a PDF: extension `.pdf`,
content type `application/pdf`, **first bytes `%PDF-`**, and the record saying PDF. **Any one
failing means the output is relabelled HTML** — and per AC6, if the conversion call itself fails,
the request ends `failed` with **no attachment**. It does not silently downgrade to HTML while
still reporting PDF, and it does not attach a zero-byte file.

The `%PDF-` byte check is the one that catches the realistic failure: a converter that returns an
HTML error page with a 200 status.

**Story L6-5 AC4:** no hard-coded `.pdf` filename or `application/pdf` content type on any path
that can emit HTML. Both come from one `resolveFormat()` return value; T6-14 greps.

---

# 7. Audit

Story L6-6. Every request — successful **or failed** — records requester, subject, type, timestamp,
status, reason, `output_format`, `pdf_probe_result` and `source_call_ids`.

A related list on the form resolves `source_call_ids` to `call_log` rows, so a figure printed on a
letter traces to the call that produced it.

**A failed request is audited as thoroughly as a successful one** (AC3) — including the failed
call's id. `source_call_ids` is written **as calls happen** (step 5), not on success, precisely so
a failure still has its trail.

---

# 8. Build order

| # | Step | Depends on | Verify |
|---|---|---|---|
| **L6-1** | `employee_xref` + unique index + ACLs (`hr_viewer` read) | L0-7 | T6-1, T6-2 |
| **L6-2** | `employee_profile` / `payroll_record` logical field contracts in `src/server/contract/objects.ts` | L1-1 | names read as template variables (T6-4) |
| **L6-3** | `document_type` + the two seeded rows | L6-2 | T6-3 |
| **L6-4** | `before` BR: cannot activate a type with empty `required_fields` | L6-3 | T6-5 |
| **L6-5** | `document_template` + placeholder validation BR | L6-3 | T6-6 |
| **L6-6** | `document_request` + auto-number + ACLs + deny-write on 7 fields | L6-3, L0-7 | T6-7, T6-16 |
| **L6-7** | **`before` BR: the self-service boundary** (§4.1) | L6-6 | **T6-8, T6-9** |
| **L6-8** | Record producer on the Service Catalog | L6-7 | T6-10 |
| **L6-9** | `assemble.ts` — pre-flight (step 4) **before** any fetch | L6-7, L2-14 | T6-11 |
| **L6-10** | Live fetch + context mapping + the zero rule (steps 5–6) | L6-9 | T6-12, T6-13 |
| **L6-11** | Renderer + PDF probe + `resolveFormat()` (§6) | L6-10 | T6-14, T6-15 |
| **L6-12** | Audit fields + `call_log` related list | L6-11 | T6-17 |
| **L6-13** | Drainer `ScheduledScript`, `on_demand`, **`active: false`** | L6-11 | T6-18 |
| **L6-14** | Write `docs/l6-platform-seam.md` — each hand-rolled piece and the platform feature it stands in for (story L6-2 AC6) | L6-11 | exists |
| **L6-15** | **The L6 gate** (§9) | all | T6-19 |

---

# 9. The L6 gate

Spec §4.2: *"Both document types generate end to end; the failure path produces no document and a
stated reason."*

Story L6-4 AC7 requires **four** recorded outcomes: both types generated **successfully** at least
once, and both generated **unsuccessfully** at least once.

| # | Scenario | Expected |
|---|---|---|
| 1 | Employment Verification, working fixture | `generated`, attachment present, format matches the record |
| 2 | Salary Certificate, working fixture | `generated`, attachment present, **and the salary figure appears in no table in the scope** |
| 3 | Salary Certificate, `annual_gross_salary` unmapped | `failed`, reason names the field and the system, **zero attachments** |
| 4 | Employment Verification, payroll ERP unreachable | `failed`, reason names the classified error, **zero attachments** |

"Zero attachments" is proven by querying `sys_attachment` for the request and getting no rows
(story L6-4 AC3) — not by looking at the form.

---

# 10. Test plan

**NON-ADMIN** cases run as that user's own session.

| ID | Test | Precondition | Steps | Expected | Validates |
|---|---|---|---|---|---|
| **T6-1** | xref holds no HR content | L6-1 | dictionary scan of `emp_xref` | four columns; none could hold a name, salary, grade, address or contract field | L6-1 AC1, AC2 |
| **T6-2** **NON-ADMIN** | finance_viewer refused the xref | L6-1 | as `hrerp_finance_only`, `GET` the table | refused | L6-1 AC5 |
| **T6-3** | xref uniqueness | L6-1 | duplicate (`user`, `erp_system`) | refused | L6-1 AC3 |
| **T6-4** | Names read as template variables | L6-3 | review `required_fields` | `employee_full_name`, `annual_gross_salary`, `employment_start_date` — **explicitly signed off, because naming is the deliverable** | L6-2 AC5 |
| **T6-5** | Empty requirement list cannot activate | L6-4 | set `active=true` with `required_fields` empty | refused | L6-2 AC2 |
| **T6-6** | Placeholder mismatch refused | L6-5 | template with `${annual_gross_salary}` on the verification type | `Template references 'annual_gross_salary', which Employment Verification Letter does not provide.` | L6-2 AC7 |
| **T6-7** | Status choices exact | L6-6 | read choices | exactly `pending`, `generated`, `failed` | L6-3 AC7 |
| **T6-8** **NON-ADMIN** | **Boundary holds via the Table API** | L6-7 | as a user with **no** app role, `POST` a `doc_req` naming someone else | refused: `You may only request documents for yourself.` Refusal pasted as evidence. **Producer-only enforcement fails this** | **L6-3 AC3, AC5** |
| **T6-9** **NON-ADMIN** | hr_viewer may request for others | L6-7 | as `hrerp_hr_only`, same POST | accepted. Role checked via Spike A's mechanism, **not `gs.hasRole()`**, not a client script | L6-3 AC4 |
| **T6-10** | Non-existent employee refused at submit | L6-7 | POST naming an unresolvable subject | refused naming the problem — not accepted-then-failed | L6-3 AC6 |
| **T6-11** | Pre-flight precedes the fetch | L6-9 | unmap a required field; instrument outbound calls | `failed` naming the field; **zero outbound calls** | L6-4's note |
| **T6-12** | Missing figure ⇒ no document | L6-10 | unmap `annual_gross_salary` | `status=failed`; reason = `Cannot generate Salary Certificate: 'annual_gross_salary' is not mapped for system <name>.`; `sys_attachment` for the request returns **zero rows** | L6-4 AC3 |
| **T6-13** | ERP down ⇒ no document | L6-10 | point payroll at `erp-invalid.invalid` | `failed`, reason names the classified error, zero attachments | L6-4 AC4 |
| **T6-14** | Zero is unavailable by default | L6-10 | fixture returning `annual_gross_salary: 0`, `zero_is_meaningful=false` | `failed`. **A certificate reading `0` is a FAIL, not an edge case.** Then set the flag true and confirm `0` renders | L6-4 AC6, L1 §4.4 |
| **T6-15** | **No payroll persisted anywhere** | L6-15 | generate scenario 2; then query **every table in the scope** for the salary figure | **zero hits.** A hit anywhere fails this and breaches D2 | **L6-4 AC2** |
| **T6-16** | No fallback path exists | L6-10 | grep `src/server/hr/` for any read of a staged value on the failure path | zero. Unreachable by construction — payroll cannot be staged | L6-4 AC5 |
| **T6-17** | Format truth, three ways | L6-11 | generate; compare attachment extension, content type, first bytes, and `output_format` | all agree. Under branch (a): `.html`, `text/html`, `HTML`. **A record claiming PDF for an HTML file fails** | L6-5 AC3, AC5 |
| **T6-18** | No hard-coded PDF labels | L6-11 | `grep -rn "\.pdf\|application/pdf" src/` | only inside `resolveFormat()`'s PDF branch | L6-5 AC4 |
| **T6-19** | Conversion failure ⇒ no file | L6-11 | force the PDF call to fail (where callable) | `failed`, stated reason, **no attachment, and no zero-byte file** | L6-5 AC6 |
| **T6-20** | Probe result recorded | L6-11 | generate | `pdf_probe_result` populated from the runtime probe, closing OD2 with instance evidence | L6-5 AC1 |
| **T6-21** | Failed requests audited too | L6-12 | scenario 3 | requester, subject, type, timestamp, reason **and the failed call id** all present | L6-6 AC3 |
| **T6-22** | Audit quotes no figures | L6-12 | read every audit field after scenario 2 | call ids and timestamps only; **no salary anywhere** | L6-6 AC4 |
| **T6-23** | Admin cannot retro-edit | L6-6 | **as full `admin`**, `PATCH` `requester`; re-read | refused, unchanged | L6-6 AC5 |
| **T6-24** **NON-ADMIN** | Requester sees own, not others | L6-6 | as two ordinary users | each sees only their own; `failure_reason` readable | L6-6 AC6, L6-3 AC8 |
| **T6-25** | Source calls resolvable | L6-12 | open a generated request | `call_log` related list populated and the rows still resolve | L6-6 AC2 |
| **T6-26** | Drainer disarmed | L6-13 | `sysauto_script` after the final deploy | `active=false`, `run_type=on_demand` | §9 |
| **T6-27** | **GATE — four outcomes** | L6-15 | §9's four scenarios | all four recorded; the two failures produce **zero attachments**, proven by query | L6 gate, L6-4 AC7 |
| **T6-28** | Every failure names a specific cause | all failures | read each `failure_reason` | each names the missing figure or the failed call. **`Document generation failed` alone is a FAIL** | L6-4 AC8 |

---

# 11. Decision log — L6

### L6-D1 — The seam is preserved at placeholder-name level, not table level; **§3.3 needs a human**
**Chosen:** option (a) — `DocumentContext` is in-memory; `document_type.required_fields` is the
machine-readable declaration a platform Document Template would bind to; placeholder names are
identical.
**Rejected — (b) a transient source row.** Puts a salary in the database, and in `sys_audit`, for
as long as the transaction and its history live. A D2 reversal needing its own decision entry.
**Rejected — (c) platform templates only for non-monetary types.** Viable and honest; splits the
catalogue across two mechanisms.
**Flagged:** §8.1 and D2 were each written without the other in view, and only the Salary
Certificate is affected.

### L6-D2 — Generation is asynchronous, drained by a `ScheduledScript`
**Chosen:** §5. **Rejected — generate inline in the record producer.** A live payroll call inside
the submit transaction means a slow ERP holds a user-facing transaction near the 300 s quota, and
the connector's own budget guard exists because that is a real failure mode.
**Cost accepted:** the requester sees `pending` briefly. Honest — the document genuinely does not
exist yet.

### L6-D3 — Pre-flight before any ERP call
**Chosen:** step 4. **Rejected — fetch first, discover the gap when mapping.** Costs a live payroll
call to learn something readable from configuration, and turns a mapping gap into a
missing-figure error, which is a less actionable sentence.

### L6-D4 — `requester` is always overwritten server-side
**Chosen:** §4.1 step 1. **Rejected — trust the submitted value and validate it.** Validation can
be bypassed by a field the rule does not check; unconditional overwrite cannot.

### L6-D5 — A zero is unavailable unless the mapping says otherwise
**Chosen:** §5 step 6, using `field_map.zero_is_meaningful` (L1 §4.4), default `false`.
**Rejected — treat `0` as a value.** A salary certificate reading `0` is the exact document
story L6-4 AC6 exists to prevent.
**Rejected — a global "zeros are never meaningful" rule.** Wrong for `stock_item.qty`, where zero
means the shelf is empty and is the most important number on the tile.

### L6-D6 — The `%PDF-` byte check is mandatory, not belt-and-braces
**Chosen:** §6.1. **Rejected — trust the API's return.** The realistic failure is a converter
returning an HTML error page with a 200 status, which passes extension, content-type and
record-field checks and fails only on the bytes.

### L6-D7 — `source_call_ids` is written as calls happen, not on success
**Chosen:** §5 step 5. **Rejected — write it at the end.** A failure would then have no trail,
and story L6-6 AC3 requires a failed request be audited as thoroughly as a successful one.

---

# 12. Risks and flags

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R6-1 | §3.3 unresolved | The platform-swap promise means something narrower than §8.1 implies | Flagged with three options. Affects the Salary Certificate only, and does not block the build |
| R6-2 | A failure message quotes a value | Payroll leaks into `failure_reason`, a readable, audited column | Messages are composed from **field names** only; T6-22 reads every audit field after a real generation |
| R6-3 | `zero_is_meaningful` set true on a payroll field by a well-meaning admin | A certificate reading `0` | Default `false`; the flag is per (object × field); T6-14 exercises both directions |
| R6-4 | PDF store app installed later, format handling untested on that path | A file labelled PDF that is not one | The probe is at generation time and `resolveFormat()` is one function; T6-17's four assertions run whichever branch is live |
| R6-5 | `employee_profile` / `payroll_record` mapped against a fixture that returns a plausible salary | An end-to-end pass that proves nothing about a real ERP | Same OD3 limitation as every other layer. Stated, not hidden. The **failure** paths are the ones fully proven today, and they are the ones that matter here |
| R6-6 | A future contributor stages payroll "for performance" | D2 breached; a queryable salary table exists | Blocked three ways at L3 (§3.5) plus T3-20's dictionary scan plus T6-15's value scan |

**Cross-scope:** none. **Global-scope records:** none. The producer attaches to the existing base
Service Catalog by sys_id, which is a reference, not a Global record.
