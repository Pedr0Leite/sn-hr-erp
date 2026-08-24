# Noviq NV-51 and NV-52 — build log

**2026-08-24.** Build clean, `npm run check` green. Sixth in the series. **Nothing has executed.**

These two are the backlog's enablers: NV-51 is the one BRD calls "from the outset — retrofitting is
the risk", and NV-52 is the gate that decides whether anything publishes at all.

---

## NV-51 — a country-aware data model

### What the story actually demanded, and what it found

AC3 is unusually specific: **three different fallback rules fail this story.** There were exactly
three, and none was wrong alone —

| Table | Rule it had |
|---|---|
| `write_approval_policy` | exact match on country |
| `doc_tmpl` | its own three-step ladder |
| `payroll_calendar` | exact match, **no fallback at all** |

Together they meant "what does this app do for a country it has no row for?" had three answers.
`src/server/country.ts` is now the only definition — **this country's row, the blank row, nothing**
(OD53). All five country-aware tables resolve through it.

**There is deliberately no third step.** A configuration written for another jurisdiction is not a
fallback, it is a wrong answer shaped like a right one: the wrong legal wording on a certificate,
the wrong cut-off on a pay run, the wrong approver on a banking change.

### Delivered

- **`src/server/country.ts`** — `countryOrder()`, `notConfiguredFor()`. **Imports nothing**: the
  rule is needed by `config-loader`, which the dispatcher needs, which the AC4 mismatch check
  needs — keeping both halves in one file closes a cycle a bundler resolves to `undefined` at
  module-init rather than to an error. The side-effecting half is `write/country-check.ts`.
- **`object_map.country`**, unique index now `(erp_system, logical_object, operation, country)`.
- **`field_map.country` + `field_map.mandatory`**, unique index `(object_map, logical_field, country)`.
  Per-field precedence resolves by the same rule: the country row overwrites the blank row for that
  field, expressed once by walking the order backwards rather than by a comparison at every insert.
- **`loadMap(system, object, operation, country)`** and `FetchParams.country`, threaded through the
  connector and the dispatcher — which now resolves the payroll country **once** and uses it for
  both the map lookup and the cut-off, so the two cannot disagree.
- **`missingMandatory()` in `read-service`** — AC2's teeth. A field this jurisdiction declares
  mandatory, absent from every returned row, makes the read **`partial` and names the field**.
  Rendering it as a blank cell is how a country-specific requirement quietly stops being met.
- **AC4, the mismatch.** The ERP's country wins — payroll jurisdiction is an ERP fact, and a
  secondee's desk follows the ServiceNow user record while their payroll does not. But silently
  preferring one of two disagreeing sources is how somebody is paid under the wrong jurisdiction's
  rules for a year, so the disagreement **raises an `erp_exception`** (one open row per user, not
  one per read) and the ERP value is still used. Checked on the `employee_profile` read only — the
  one object whose response is about the employee themselves.

**Guard:** `check-store-readiness.mjs` rule 8c fails any module querying by `country` without
`countryOrder()`.

---

## NV-52 — landscape discovery as a gate

### The shape of the decision

The gate is on **publication**, not on a warning banner. An area whose discovery is incomplete, or
whose authority is another system, publishes **nothing**. An empty HR Document Center is a visible,
answerable state; a partially-correct one is not (AC6) — and an employee filing leave in a system
that does not hold their leave discovers BRD §9 risk 3 as a support queue.

### Delivered

- **`landscape_discovery` table.** One row per requirement area per deployment. `authority` is
  mandatory and carries an explicit **`none_identified`** value, because "nobody owns this today"
  is a finding a delivery lead can act on and a blank is a question nobody asked.
- **Three-state answers, not Booleans.** `native_timesheet_workflow` is
  `not_answered` / `yes` / `no`. A Boolean would make `false` and "unanswered" the same value —
  the absence-read-as-an-answer failure this application refuses everywhere else. **`not_answered`
  blocks NV-47.**
- **`src/server/governance/landscape.ts`** — `publicationAllowed()` with four distinct refusals
  (each needs a different action from a different person), `discoveryStatus()` including the BRD
  §4.2 multi-system scoping stop, `timesheetBuildAllowed()` for NV-47, and `buildVsBuyAssessed()`.
- **Build-vs-buy is a required, cited decision.** `zero_copy_connector` and
  `hrsd_advanced_integration` both default to `not_assessed`, which fails the check — committing to
  a custom build without recording why the shipped product was not used is the exact mistake the AC
  prevents. The platform **facts** ship as column hints (Zero Copy Connector: SAP ECC/S4HANA only
  through the Australia release; HRSD Advanced Integration: Workday / Oracle HCM / SuccessFactors,
  including a *Get Time Off Balance* that is R3/INT-11 by another name). The **decision** is the
  deployment's and lives in the record — this app does not seed somebody else's scoping answer.
- **ACLs for `landscape_discovery` and `usage_event`**, which NV-49 AC3 requires and which the two
  newest tables did not have. `usage_event.write` is a Shape A hard deny: a usage event is a fact
  about something that already happened, and editing one rewrites the evidence a scope decision is
  made from.

---

## State

| Story | State |
|---|---|
| NV-51 | **Done** — schema, one shared rule, mandatory-field partial state, mismatch exception, regression guard |
| NV-52 | **Done** — table, gate module, ACLs. No seed: a discovery record is a deployment's own data |
| NV-47 | **Unblocked in mechanism, still not started.** The gate exists; it stays closed until a deployment answers R10 |

## Not done, deliberately

- **No `landscape_discovery` seed.** A row asserting who owns R3 for a customer we have never met
  would be an invented answer to the one question this table exists to force somebody to ask.
- The control-tower surface that renders `publicationAllowed()`'s refusals — same OQ-16 / OD40
  surface decision as everything else.

## Backlog position

**All 52 NV stories are now built or explicitly, reasonably deferred.** What remains is not story
work: the business rules outstanding from NV-1…NV-20, the UI surfaces gated on OQ-16 / OD40, and
the one thing that would change what any of this is worth — **running it**. `call_log` is 0 rows.
