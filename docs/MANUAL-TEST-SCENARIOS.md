# Manual test scenarios

**Written:** 2026-08-25, after the first driver runs on dev296062.
**Companion to** `docs/noviq/test-plan.md`, which carries the per-story ACs. This file is the
**operator's** version: what to click, in what order, and what result means what.

---

# Rule 0 — run ONE driver at a time. This is not a style preference.

The first multi-driver run on this instance produced 89 PASS and 9 FAIL, and **every one of the
nine is explained by concurrency, not by product code.** Three jobs ran on three scheduler workers
with overlapping windows:

| Thread | Job | Window |
|---|---|---|
| `glide.scheduler.worker.6` | L2 DRIVER ADMIN | 13:20:25 → 13:21:16 |
| `glide.scheduler.worker.1` | L2 DRIVER VIEWER | 13:20:30 → 13:20:32 |
| `glide.scheduler.worker.2` | L2 CONNECTOR HARNESS | 13:20:34 |

Every one of those drivers targets **System A** (`ECHO-PRIMARY`) and every one calls
`clearCallLog(systemA)` and `clearBreaker(systemA)` as its own setup. Running them together means
each driver deletes the others' evidence and resets the others' circuit breaker in the middle of
their assertions. The observed damage:

| Failure | What actually happened |
|---|---|
| `T15 exactly one call_log row \| observed: 3` | Two other drivers' rows landed in the window |
| `T21 exactly 3 rows (1 + max_retries 2) \| observed: 4` | Same |
| `T19b refused with MAP_INACTIVE \| observed: MAP_INACTIVE` | Observed **equals** expected — the assertion spans all rows, and a foreign `balance/503` row was among them |
| `T31 viewer logged 6 attempt rows \| observed: 1` | The admin driver's `clearCallLog` deleted the viewer's rows mid-test |
| `T31 viewer WROTE circuit_open_until \| observed: ""` | The admin driver's `clearBreaker` wiped it |
| `T2-8 ... \| observed: substitutionDisabled=false` | The call never completed (`http=null`) because another driver had opened the breaker, so nothing reached the wire to be inspected |

**The run is void as evidence — including its 89 passes.** A contaminated environment produces
accidental passes as readily as accidental failures. Do not record that run anywhere as a result.

> **Wait for the previous job to finish before starting the next.** `sysauto_script` *Execute Now*
> returns immediately; it does not block. Confirm the previous driver logged its `===== ... END =====`
> line before clicking the next one.

---

# How to read every result in this file

| Rule | Why |
|---|---|
| **Re-read the value, and write a control field in the same request** | A Shape A deny is **silent** — HTTP 200, normal body, field unchanged. A test asserting on status code passes against a completely broken ACL. The control field moving is the only thing that makes the result interpretable. (trap 4) |
| **Unwrap `{"result": …}` before reading any Scripted REST body** | Error bodies are wrapped too. (trap 2) |
| **Never infer a business rule ran from the record's state** | A `before` rule that throws is swallowed and the record saves with HTTP 201. Check `syslog` for `fluent-module` errors in the same window. (trap 5) |
| **Booleans: `isTrue()`, never `getValue() == 'true'`** | `getValue()` on a Boolean returns `'1'`/`'0'`, so the comparison passes vacuously. (trap 6) |
| **Filter app tables on business fields only** | `sys_created_on` / `sys_class_name` return `403 Insufficient rights to query records` even as full admin — the field-level ACL gates the *query*. |
| **A clean build + clean install + HTTP 2xx prove nothing together** | End every scenario with a `syslog` check. |

---

# Scenario 1 — Re-run the three L2 drivers, serially

**Proves:** whether the 9 failures were concurrency or code. Nothing else can settle it.
**Needs:** browser. No ERP.
**Time:** ~5 minutes.

1. `sysauto_script.do?sys_id=7f94b1844de2493bb5bbd19eced38aa0` — **L2 DRIVER ADMIN** → *Execute Now*.
2. Wait for `[HRERP-L2-T] ===== DRIVER L2 END =====` in `syslog_app_scope`. **Do not skip this wait.**
3. `88f0d9f8f9f44a3285ebc95ac498b768` — **L2 DRIVER VIEWER** → *Execute Now*. Wait for its end line.
4. `c991a186a3d24e1380b04c6b9f37451a` — **L2 CONNECTOR HARNESS** → *Execute Now*. Wait.

**PASS:** zero `FAIL` lines under `[HRERP-L2-T]`, `[HRERP-L2-TV]`, `[HRERP-L2-HARNESS]`.

**If a failure survives serial execution it is real.** Two to watch specifically:

- **T2-8** — `rest-client.ts:144` does call `disableForcedVariableSubstitution()`. If T2-8 still
  fails *with a real `http_code`* (not `null`), substitution is happening despite that call, and a
  literal `${x}` in a mapped endpoint is being rewritten before it reaches the ERP. That is a data
  corruption path, not a cosmetic one. If it fails with `http=null` again, the call still isn't
  completing and the test has told you nothing.
- **T31** — the viewer test expects the viewer to be *able* to write `erp_system`. If it still
  reports `observed: ""` in a clean run, then either the viewer genuinely cannot write (and the
  test's expectation is wrong) or a deny is firing silently. **Do not accept either reading without
  Scenario 2.**

---

# Scenario 2 — The ACL matrix as a real non-admin

**Proves:** that 21 NV ACLs, every deny written Shape A, actually deny.
**Needs:** browser, logged in as a non-admin. **No ERP.**
**Time:** ~20 minutes.
**Why this is first among the security tests:** every ACL test run as admin passes against a
completely absent ACL. Nothing verified so far distinguishes a working deny from a missing one.

Basic auth as a non-admin returns instance-level `401` on this PDI, so this must be a **browser
session** — impersonation or a real login, not curl.

For each row: log in as the user, attempt the write **in a form**, then re-read the record.

| # | User | Target | Attempt | Expected |
|---|---|---|---|---|
| 2.1 | `employee` | `erp_write` | Edit `state` from `pending` to `confirmed` | Value **unchanged** on re-read |
| 2.2 | `employee` | another employee's `erp_write` | Open it at all | Not visible in the list, and the direct `.do` link shows no data |
| 2.3 | `employee` | `usage_event` | Edit any field | Unchanged — this is a hard Shape A deny; a usage event is a fact about something that already happened |
| 2.4 | `hr_agent` | `erp_scope_grant` | Add a scope to themselves | Unchanged |
| 2.5 | `employee` | `payroll_calendar` | Change a cut-off date | Unchanged |

**The control-field technique, and you must use it:** in the same form save, also change a field
you *are* allowed to change (a description, a comment). Then re-read both.

- Protected field unchanged **and** control field changed → **the ACL denied it. PASS.**
- Both changed → **the ACL did not fire. FAIL.**
- Both unchanged → **the save never happened at all.** Inconclusive — nothing was tested. Retry.

That third outcome is why "I got HTTP 200 and the field didn't change" is not a pass on its own.

---

# Scenario 3 — The silent mapping-template deny (OD14)

**Proves:** whether §6's deny beats §5.3 step 5's write.
**Needs:** browser. No ERP.
**Time:** ~2 minutes. **Highest value-per-minute test in this file.**

1. Open any `erp_system`. Apply a `mapping_template` via the UI Action.
2. Note that it reports success.
3. **Re-read `mapping_source` and `mapping_verified` on the generated `object_map` rows.**

**PASS:** both fields carry the values the template set.

**FAIL:** they are blank or unchanged. And this failure is invisible in normal use — the rows
insert, success is reported, and the unverified-mapping banner **never appears**. An admin then
believes a mapping was verified when nothing verified it, which is the precondition for shipping a
confidently wrong number.

---

# Scenario 4 — Open the hub and hunt for a zero

**Proves:** the four-state contract end to end, in the only place a user sees it.
**Needs:** browser. No ERP.
**URL:** `https://dev296062.service-now.com/x_335329_sn_hr_erp_hub.do`

Five tabs: Financial, Procurement, Inventory, Fixed Assets, Manufacturing. Never rendered once.

For every tile on every tab, classify it:

| Sighting | Verdict |
|---|---|
| A figure with a fetch time | `live` — fine |
| "not configured", **naming the object map to create** | Correct. A tile that says "not configured" without naming the map is a **FAIL** |
| "the ERP did not answer", no number | Correct |
| A figure **with its age** shown | `stale` — correct |
| **`0`** | **Investigate immediately.** A `0` is only legitimate when an ERP genuinely returned an empty set on a successful run. Any other `0` is the defect this whole application exists to prevent |

Then check the payload directly — `/api/x_335329_sn_hr_erp/hub?tab=financial` — and assert on the
**key**, not the rendered value: `'v' in tile`, never `tile.v == 0`. A tile that omits `v` and a
tile with `v: 0` look identical once rendered and mean opposite things.

Also confirm as a non-`finance_viewer` user that monetary figures are **absent from the response
body**, not merely hidden in the UI.

---

# Scenario 5 — The write path, against postman-echo. No ERP needed.

**Proves:** the two repairs that no static check can confirm — **OD51** and the idempotency key.
**Needs:** browser + an `object_map` row you create. **No real ERP.**
**Time:** ~15 minutes. This is the highest-value test in the file.

Both repairs fixed defects that reported **success for a write that never happened**. Neither has
ever been exercised.

**Setup.** Create an `object_map` on `ECHO-PRIMARY` with:
`logical_object` = the object you are testing · **`operation` = the write verb, not `read`** ·
`endpoint_path` = `/post` · `http_method` = `post` · `active` = true.
Set `read_only = false` on a **sandbox** system — never on a production-flagged one.

**5.1 — the request actually leaves, with its body.** Submit one write. Then read the `call_log`
row.

- `http_method` recorded as **POST**, and postman-echo's response echoes your body back → **PASS.**
- Recorded as GET, or the echoed body is empty → **the write resolved the READ map.** That is the
  OD51 defect alive: the body is dropped, and `extractAck()` then reads an `id` out of the read's
  own response and reports `confirmed` for a request that never left the instance.

**5.2 — idempotency.** Submit the *same* change twice.

- Second attempt collides on `(erp_system, idempotency_key)` → **PASS.**
- Two `erp_write` rows both with a **blank** `idempotency_key` → the key is not being set at
  insert. Every blank collides with every other blank, so the unique index is protecting nothing.

**5.3 — the cut-off refusal.** Delete every `payroll_calendar` row for the country, then submit a
payroll-affecting write.

- **Refused** → PASS. An absent calendar must refuse.
- **Allowed** → FAIL, and it is the four-state rule failing in a new costume: an absence read as a
  permission.

**5.4 — the three blocked states stay distinct.** Force each: set `read_only = true`
(`blocked_readonly`); submit past a cut-off (`blocked_cutoff`); submit something requiring an
approval that has not been given (`blocked_approval`). Three different values. A generic `blocked`
anywhere is a FAIL — the reason is the only part the employee and the auditor need.

**5.5 — a 2xx is not success.** Point the map at an endpoint returning `200` with a body carrying
**no** identifier.

- Result `failed` → **PASS.**
- Result `confirmed` → FAIL. "The ERP accepted my request" and "the ERP recorded my change" are
  different claims.

**5.6 — nothing leaked.** Read the `erp_write` row. It must carry `request_hash` and **no payload
value**. If a salary or an IBAN is in that row, the audit table has become the shadow database the
design exists to prevent.

---

# Scenario 6 — A real ERP, read path

**Needs:** a real ERP endpoint and credentials. Everything above is cheaper — do it first.

**6.1 — the riskiest action in the application.** Map one object. **Before setting `active = true`,
compare every mapped figure against what the ERP's own UI shows for the same record.** A wrong
mapping does not fail loudly; it renders a confident wrong number that nobody investigates. No
`field_map` payload ships for any vendor precisely because none could be verified from
documentation.

**6.2 — dates (trap 13).** Map a real date column and confirm the value survives.

The failure to look for: a date that fails to parse leaves the column **empty**, an empty column
reads as *absent* rather than *failed*, `rows_fetched` stays healthy, the run reports `success`,
and a "due within N days" tile shows `0` — meaning "no date was readable", not "nothing is due".
This trap is traced in code and **has never been observed live**. Confirming or killing it is worth
more than any other single ERP test.

**6.3 — pagination.** Fetch an object with more rows than one page. No pagination style in this
connector has ever fetched a second page. On **Dynamics 365 F&O** also confirm `cross-company=true`
is applied — without it the connector silently reports one legal entity and the number looks
perfectly reasonable.

**6.4 — auth (trap 17).** Save a system with `oauth2_client_credentials`, then with `oauth2_jwt`,
and confirm authentication **actually happens**. Both values were added to the choice list before
`rest-client.ts` knew about them, and a system saved with either sent **no authentication at all** —
surfacing as a `401` that looks exactly like bad credentials. Verify by inspecting the outgoing
request, not by concluding "it worked" from a 200.

---

# Scenario 7 — Documents

**7.1 — no ERP needed.** Generate a document now. It will be **HTML labelled HTML** — that is
correct, not a failure. `PDFGenerationAPI` is absent, so `resolveFormat()` refuses to call anything
PDF. **FAIL only if** you get a `.pdf` extension, `application/pdf`, or `PDF` in
`doc_req.output_format` while the bytes are HTML.

**7.2 — after installing the PDF Store app.** Regenerate and check the first bytes are `%PDF-`.
The magic-byte check reads `getContentStream()` through `GlideTextReader` — scoped `getContent()`
supports CSV, JSON and TXT only, and written the obvious way this check mis-reads every PDF and
fails **open**, which is worse than no check.

**7.3 — the release gate.** Request a document whose type has an approval policy, without the
approval. Nothing should be generated — the gate sits at *generation*, so no PDF exists before
approval. A generated-then-withheld document is a FAIL.

---

# What a green run still would not prove

State this next to any result you record.

| Not covered | Why |
|---|---|
| A real ERP **recording** a write | postman-echo echoes; it does not persist. Scenario 5 proves the verb, the body and the key — not that a payroll system holds the change |
| MID Server routing | `ecc_agent` has zero rows. Record **REVIEWED**, never **PASS** |
| Cegid / PHC | Zero research exists. Their `vendor_onboarding` rows are `Not confirmed` by design |
| Whether `getBody()` is binary-safe | Never probed. OD43's spool is built defensively |
