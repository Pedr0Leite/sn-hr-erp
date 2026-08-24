# Noviq NV-31…NV-40 — build log

**Session:** 2026-08-24 · **Build: clean** after every step below. `node scripts/check-nv-logic.mjs`
passes. **Nothing has executed on the instance** — `call_log` is still 0 rows.

Fourth in the series: `BUILD-LOG.md` (NV-1…10), `BUILD-LOG-11-20.md`, `BUILD-LOG-21-30.md`, this one.

---

## What was already built, and therefore not rebuilt

NV-36 asks for "a `document_template` table mapping each document type to the logical fields it
needs", live-read generation, a mandatory-field abort and a real-PDF check. **L6 already is that.**
`doc_type` (`required_objects`, `required_fields`, `optional_fields`), `doc_tmpl`, `doc_req` and
`src/server/hr/assemble.ts` implement the generic R5 pattern down to the `%PDF-` byte check and the
"names the field, never its value" failure message. D1 and D2 already ship as seeded document types.

So NV-36 is **mostly satisfied by reuse**, and this session built only its three genuine gaps: the
release gate (NV-40), the archival (NV-37) and the reconciliation (NV-38). Rebuilding a second
generation engine beside the L6 one would have given the application two answers to "was this
document generated correctly".

---

## Three design decisions, all logged

### OD47 — the vendor's own prefill mechanism is refused

The second brain confirmed the supported prefill path is `sysparm_variable_values={...}` **in the
URL**. It works. It also puts every prefilled value in browser history, the `Referer` header and
every proxy log between the employee and the instance. NV-31 AC3 requires the full IBAN never to
appear in the page payload, so the prefill is server-side and the URL mechanism is banned for any
masked field. The documented answer being the wrong answer is worth a decision record.

### OD48 — a conflict found between two stories, fixed in the schema

**NV-32 (address) and NV-33 (banking) are the same `logical_object` and the same `operation`.** The
approval gate derived its policy key from exactly that pair, so the BRD's mandated banking gate
could only be implemented by gating every address change in the company — or by not gating banking.
`erp_write.policy_key` now carries the key when the caller sets one. NV-33 sets
`employee_profile.bank_account_iban`; NV-32 sets nothing and stays ungated **by design, in a way a
test can assert**; NV-40 reuses the seam as `document.salary_certificate`.

### OD49 — the archival shares the pre-flight, not just the spirit of it

`preflight()` was extracted from `dispatch()` so `archiveDocument()` runs the identical five gates.
The binary transport is a necessity (trap 15); a binary *governance* path would have been a choice,
and the wrong one.

---

## Delivered

| File | Story | What it does |
|---|---|---|
| `src/server/ess/prefill.ts` | NV-31 | Live prefill, IBAN masked to last four, `Not returned by the ERP` as a **rendered** label, read-only form on `failed` |
| `src/server/write/personal-update.ts` | NV-32, NV-33 | Changed-fields diff, banking refusal, prior-of-record capture, masked notification value |
| `src/server/write/expense-claim.ts` | NV-34, NV-35 | Totals in cents, mixed-currency refusal, receipt validation, receipts-after-confirmation, status mapping |
| `src/server/hr/archive.ts` | NV-37, NV-38 | Idempotent archival via existence check, vendor-gap reporting, three-count reconciliation that refuses to show a number when either side failed |
| `src/server/hr/release-gate.ts` | NV-40 | The PDF does not exist before approval — not hidden, absent |
| `src/server/connector/binary-client.ts` | NV-5 | `uploadBinary()` added, with `call_log` telemetry the binary path previously had none of |
| `src/fluent/data/nv-policy-seeds.now.ts` | NV-33, NV-34, NV-40 | The three approval policies whose keys exist in this repo |
| `src/fluent/tables/noviq-tables.now.ts` | OD48 | `erp_write.policy_key` |
| `scripts/check-nv-logic.mjs` | — | 20 assertions over the pure decision logic |

### Four things worth naming

**Receipts are uploaded only after the claim is confirmed.** NV-34 AC6 asks for orphaned receipts
to be cleaned up *or* the claim retried with the same key. Ordering removes the failure instead of
compensating for it: a receipt cannot be orphaned by a claim that does not exist yet.

**A failed existence check refuses the archival *retry*, not the first attempt.** After a timeout we
cannot prove the document is absent, and BRD R5's key requirement is exactly one archived copy. The
first attempt proceeds; a retry that cannot confirm absence goes back to `queued` and says why.

**The vendor gap is a state, not an error.** An ERP with no `erp_attachment.create` scope grant
leaves the employee's document attached to their request and records
`<system> does not expose document archival — R5 archival unavailable.` BRD §11 Q6 names this as
one of the two hardest capabilities to confirm for any ERP.

**Claim totals are compared in cents.** `0.10 + 0.20 !== 0.30` in floating point, and an expenses
form that refuses a correct claim gets worked around rather than fixed.

---

## Per-story state — honest

| Story | State |
|---|---|
| NV-31 prefill | **Server complete.** Catalog client script / Scripted REST surface outstanding |
| NV-32 personal update | **Server complete.** Catalog item + flow outstanding |
| NV-33 banking update | **Server complete**, policy seeded. Approval subflow and the notification record outstanding |
| NV-34 expense claim | **Server complete**, policy seeded. Multi-row variable set outstanding |
| NV-35 claim status | **Server complete.** RITM view outstanding |
| NV-36 R5 pattern | **Satisfied by L6 reuse** for generation. Catalog category and per-country templates (NV-43) outstanding |
| NV-37 archival | **Server complete** |
| NV-38 reconciliation | **Server complete.** HR-facing view outstanding |
| NV-39 D1/D3 | **D1 done** — seeded type + template, no policy row, archival fires. **D3 blocked** on NV-25's streaming endpoint, which is surface-gated |
| NV-40 D2 | **Server complete**, policy seeded, gate at generation. Approval subflow outstanding |

Every "outstanding" above is a **UI surface**, and all of them wait on the same human decision:
**OQ-16 / OD40**, the surface choice, still open because HRSD is not installed on `dev296062`.

---

## Deliberately not seeded

`write_approval_policy` rows for **D6, D7, D8, D9** and for NV-45's termination gate. Those document
codes and that operation do not exist in this repo yet, and a policy row naming a key nothing ever
writes is a control that looks present and enforces nothing — repo rule 5, applied to governance
data rather than to endpoints.

`vendor_onboarding` seeds remain outstanding from the previous session.

---

## Next

1. The **business rules** still outstanding from NV-1…NV-20: auth validation with the OD46 exception
   expiry, elevated-sensitivity distinctness, no-write-without-case, idempotency-before-create, and
   gate layer one.
2. **NV-41…NV-52.**
3. The surfaces, once OQ-16 / OD40 is decided.
