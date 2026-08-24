# Noviq BRD + TRD vs this application — alignment analysis

**Documents read** (2026-08-23), all four, in full:

| File | Content |
|---|---|
| `202608 Noviq_BRD_ServiceNow-EmployeeServices-ERPAgnostic_v1.md` / `.docx` | Business requirements, ServiceNow side. R1–R10, HR Document Center D1–D10 |
| `202608 Noviq_TRD_ERP-Integration-Technical-Requirements_v1.md` / `.docx` | The interface contract an ERP must satisfy. INT-01–INT-23 |

**The `.docx` and `.md` of each pair are the same document.** Extracted body text matches
heading for heading; there is no content in either `.docx` that the `.md` does not carry. Read the
`.md`s; the `.docx`s add nothing.

Both are **Draft v1, 20 August 2026**, and both are derived from a third document this repo does
not have: `202608 Noviq_BRD_ServiceNow-Unit4-Integration_v1.md` — the full BRD carrying the
per-vendor findings for **Unit4, SAP, Cegid and PHC**. That file is referenced four times and is
the one with the evidence in it. Worth obtaining.

---

## 1. The short answer

**They are related, strongly, and at exactly one seam: the ERP interface contract.**

This application is a working implementation of **the read half of the TRD** — and of one BRD
requirement (**R5**, the document-generation pattern, plus **D1** and **D2**) — built on the
constraint that made the TRD's own hardest problem unavoidable: *the HR module is not installed*.

They are **not** the same product. The BRD's delivery vehicle is Employee Center Pro, HRSD case
types, Service Catalog items and RITM attachments. This app has none of those, deliberately: it
exists **because** that stack is absent. And roughly two-thirds of this application — the five
finance, procurement, inventory, asset and manufacturing tabs — has **no counterpart anywhere in
either document**. The BRD is employee services; this app is an ERP data hub that also generates
HR documents.

Read the relationship as: **this repo is a prototype of the TRD's read path and R5, with real
vendor evidence behind it, running on an instance the BRD would have ruled out.**

---

## 2. TRD §2 architecture principles — pass/fail against the code

The TRD says to treat these as pass/fail. Done honestly, including the failures.

| TRD principle | This app | Verdict |
|---|---|---|
| Token-based auth, credential-scoped | `erp_system.auth_type` = `basic` / `oauth2` / `mutual`, resolved to a ServiceNow auth profile in `rest-client.ts`. Secrets never in the app | **Pass** — but see §6, the Basic-auth conflict |
| Least privilege scope | `read_only` is a column on `erp_system` and there is no write path at all | **Pass**, though trivially — a read-only client cannot exceed its scope |
| Synchronous on-demand read | `employee_profile` and `payroll_record` are fetched **live at document-generation time and never staged** (D2). The finance objects are staged on a schedule | **Pass** for everything the TRD asks about |
| Confirmable write | **Not built.** D3 defers write-back; `read_only` makes it structural | **Fail, by decision** |
| Stable external identity | `erp_id` on every logical object, `employee_id` on the two HR ones | **Pass** |
| Idempotency | N/A — nothing is created ERP-side | **N/A** |
| Retriable vs non-retriable errors | `connector/classify.ts`, `RETRYABLE_STATUS` = 408/425/429/500/502/503/504, exponential backoff, a circuit breaker, `Retry-After` honoured | **Pass, and beyond** — this is the app's strongest area |
| JSON, ISO 8601 dates, explicit currency code | JSON only. `parseDate` takes a per-object format hint and additionally recognises OData V2 `/Date(…)/` **by shape**. `currency` is a first-class logical field and is left **unmapped** rather than defaulted when the vendor cannot supply it | **Pass** |
| Non-production tenant | PDI `dev296062` | **Pass** |
| Published rate limits / throughput | `timeout_ms`, `max_retries`, `backoff_ms` per system; per-attempt telemetry in `call_log` | **Pass** as a mechanism; no vendor figures asserted |
| Versioned API, deprecation policy | Not modelled. Version lives inside `endpoint_path` text (e.g. `/services/data/v67.0/query`) | **Gap** — no column, no check |

**The four-state contract has no TRD equivalent, and it is stricter than what the TRD asks for.**
The TRD requires that errors be *distinguishable*; this app requires that an absence is never
rendered as a `0`. TRD §9 step 2 — *"do not assume absence from silence in public documentation"* —
is the same instinct as OD31/OD37 in `docs/decision-log.md`, arrived at independently.

---

## 3. TRD §3 entities vs the 16 logical objects

| TRD entity | This app | Note |
|---|---|---|
| **Employee** | `employee_profile` | 7 logical fields vs the TRD's 13. Missing: address, phone, emergency contact, **bank account/IBAN**, cost centre, contract type, end date |
| **PayslipDocument** | — | `payroll_record` holds salary *data*, not a document. No PDF retrieval path exists |
| **IncomeStatement** | — | Not modelled |
| **LeaveBalance**, **LeaveRequest** | — | Not modelled. No leave concept anywhere in the contract |
| **ExpenseClaim** | — | Not modelled |
| **Attachment** | — | The connector parses JSON. **There is no binary retrieval or upload path at all** |
| **CompensationChange** | — | Write-shaped; D3 |
| **BenefitEnrollment** | — | Not modelled |
| **TimesheetEntry** | — | Not modelled |
| **CostCentre / Project** | — | Not modelled |
| *(no TRD equivalent)* | `balance`, `invoice`, `vendor_invoice`, `gl_summary`, `purchase_order`, `requisition`, `stock_item`, `backorder`, `fixed_asset`, `asset_depreciation`, `maintenance_schedule`, `work_order`, `production_output`, `machine_downtime` | **14 of this app's 16 objects are outside both documents entirely** |

Two entities overlap. Fourteen do not, in each direction. That asymmetry is the whole finding.

---

## 4. INT-01 to INT-23 — what actually exists

| Capability | State |
|---|---|
| **INT-01** retrieve one employee by external ID | **Built.** Live fetch, never staged |
| **INT-17** retrieve the field set a document template needs | **Built.** This is L6's whole job |
| **INT-02** search/list employees | Partial — the connector can list; no matching or identity-linkage logic exists |
| INT-08, INT-09 payslip list + PDF retrieval | **Not built.** No document listing, no binary path |
| INT-10 income/tax statement | Not built |
| INT-11, INT-13, INT-14 leave balance / status / reference data | Not built — no leave objects |
| INT-16 expense claim status | Not built |
| INT-19 list archived documents | Not built |
| INT-20 benefit enrollments | Not built |
| INT-22 cost centres/projects | Not built |
| **INT-03, 04, 05, 06, 07, 12, 15, 18, 21, 23** — every write | **Refused by D3**, not merely unbuilt. `erp_system.read_only` makes the refusal structural |

**2 of 23 built, 1 partial. 10 of the remaining 20 are writes this application has decided not to
perform.** The other 10 are reads that need entities the contract does not carry.

---

## 5. The BRD requirements, honestly scored

| BRD req | This app |
|---|---|
| **R5 — ERP-sourced document generation & archival** | **The direct match, and the reason these documents are relevant at all.** Steps 1–3 of the R5 flow (request, pull ERP fields, render from a template mapping ERP fields to placeholders) are L6, built. **Step 5 — upload the PDF back to the ERP — is not, and cannot be without reversing D3.** R5 is therefore *half* implemented, and the missing half is the half the BRD calls the point |
| **D1 Employment Verification Letter** | **Built.** Named target of L6 |
| **D2 Salary / Income Certificate** | **Built.** Approval-gated in the BRD; this app has no approval workflow, and D3 forbids drawing a control that cannot commit its decision |
| **D3 Payslip Reissue** | Not built — no document retrieval |
| **D5 Leave Balance Certificate** | Not built — no leave objects |
| D4, D6–D10 | Not built. D6/D7/D8 need position history, final settlement and contract data the contract does not model |
| **R1 — Payslip / tax document retrieval** | **Aligned in principle, absent in fact.** The BRD's rule *"never stored at rest in ServiceNow"* is **exactly D2** in this repo, reached independently. But the app has no payslip listing and no PDF streaming |
| **R2, R4, R6, R7, R8, R9, R10** | All write-shaped. All out of scope by D3 |
| **R3 — Leave & absence** | Not modelled at all |

### The delivery-vehicle conflict

The BRD assumes **Employee Center Pro, HRSD case types, Service Catalog items and RITM
attachments**. This application was specified for an instance where **the HR module is not
installed**, and ships its own BYOUI page, its own `doc_request` table and its own roles.

This is not a small mismatch, and it does not invalidate either side. The **engine** — connector,
control tower, mapping, provenance, template-to-field rendering — is surface-independent. The
**surface** is not: adopting the BRD as written means re-hosting L6 behind a catalog item on an
HRSD instance, which is a different instance and a different product from the one this repo
targets.

### Where this app is stricter than the BRD

- BRD O3: *"no shadow master data is held in ServiceNow."* This app **stages** finance objects —
  a shadow copy by design, with provenance. But it **never** stages HR or payroll data: `hr` is
  deliberately absent from `CATEGORY_CHOICES` so payroll staging cannot be selected in one
  keystroke. On the data the BRD actually cares about, this app is more conservative.
- BRD NFR *"failed syncs must not fail silently."* This app goes further: a tile with no map
  **names the map to create**, and a `0` is rendered only when an ERP genuinely returned zero.
- BRD §7 auditability. `doc_audit` stores `call_log` **sys_ids only** — an audit row quoting the
  salary would reintroduce the shadow database it is auditing.

---

## 6. Three conflicts worth raising before either document goes to v2

1. **The TRD forbids Basic auth in production. The only implementation-grade Unit4 evidence in
   this repo is a working Basic-auth integration.** TRD §2: *"Basic Auth with a shared
   username/password is not acceptable for production."* The Unit4 ERP Integration Compendium
   records a **working** ServiceNow ↔ Unit4 employee REST integration authenticating with
   *"Password (2-Way) through Connection Alias"* — a ServiceNow Basic credential (OD38,
   `docs/unit4-integration.md` §2). Both cannot be policy. Either the TRD's line needs a
   documented exception path, or that deployment is non-compliant with it. **This should be
   settled before it is discovered mid-build.**

2. **The BRD's two hardest-to-confirm capabilities are the two this app cannot do at all.**
   BRD §11 open question 6 names payslip retrieval and PDF archival as *"the two capabilities every
   ERP-specific evaluation to date has found hardest to confirm."* Both are binary-payload
   operations. This connector handles **JSON only** — there is no attachment path in either
   direction. That is a build gap, not a vendor gap, and it sits underneath R1, R5, D3 and INT-18.

3. **Vendor coverage does not line up.** The BRD's evaluated set is **Unit4, SAP, Cegid, PHC**.
   This repo has implementation-grade Unit4 evidence and verified SAP endpoints, and **nothing at
   all on Cegid or PHC** — both Iberian/French mid-market vendors absent from
   `docs/vendor-integration-research.md`. The repo additionally covers Oracle Fusion, Dynamics 365
   F&O, NetSuite and Salesforce, which the BRD does not ask for. Neither set contains the other.

---

## 7. What is directly reusable, if the BRD product is ever built

Reusable as-is, no redesign:

- **L2 connector** — retry, exponential backoff, circuit breaker, `Retry-After`, per-attempt
  `call_log` telemetry. Satisfies TRD §2 error semantics and throughput outright.
- **L1 control tower** — `erp_system` / `object_map` / `field_map` / `map_tmpl`. This *is* the
  TRD's "vendor-agnostic interface" made configurable: a second ERP is a data change, proven at
  the L1 gate with an empty `sys_metadata` delta.
- **`field-mapper.ts`** — three path syntaxes (dots, slashes, `relatedValues[relationId=A2]`
  array predicates) and shape-detected OData V2 dates. This is precisely the "any ERP's field
  names map onto these" layer TRD §3 assumes exists.
- **The four-state contract** — stricter than anything either document specifies.
- **`docs/vendor-integration-research.md`, `docs/unit4-integration.md`** — TRD §9 says to mark
  each capability Confirmed/Partial/Unconfirmed against real vendor docs. For Unit4 and SAP,
  **that work is already done and cited.**

Needed before the BRD's P0 could ship, roughly in cost order:

1. **A binary path** — retrieve a PDF, upload a PDF. Nothing in R1, R5, D3 or INT-18 works without it.
2. **Write-back** — reverses D3, and every safeguard built on `read_only`. The largest single item, and the one to decide first.
3. **New logical objects** — leave balance/request, expense claim, payslip document, attachment, cost centre.
4. **Idempotency** — keys or existence checks; nothing exists today because nothing writes.
5. **Payroll cut-off calendar** — TRD §5 and BRD §7. Not modelled anywhere.
6. **The Employee Center Pro surface** — catalog items, HRSD case types, RITM attachment. A different instance from this one.

---

## 8. Verdict

**Related: yes, and usefully.** The TRD is a clean, vendor-neutral statement of the contract this
application already implements the read half of, and it independently reaches several of this
repo's logged decisions (identity linkage, retriable-vs-not, don't-infer-absence-from-silence,
never store payslips at rest). Anyone scoping the BRD product would save real time reading
`docs/vendor-integration-research.md` and lifting L1 + L2 wholesale.

**Equivalent: no.** Two of sixteen logical objects overlap. Two of twenty-three INT capabilities
are built. Half of R5 is built and the missing half needs a decision this repo has already made in
the other direction. Fourteen of this app's objects are outside both documents entirely.

**The one line to take away:** the BRD/TRD describe an **employee-services** integration on a
full HRSD instance; this repo is an **ERP data hub with an HR document generator** on an instance
with no HR module. Same connector problem, same vendor-agnostic instinct, different product — and
their two hardest requirements (binary payloads, ERP write-back) are precisely this application's
two structural refusals.
