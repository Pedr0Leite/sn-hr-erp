# CLAUDE.md — SN HR&ERP

ServiceNow scoped app `x_335329_sn_hr_erp`. Connects to any ERP over REST, stages the data with
full provenance, renders it in a 5-tab hub, and generates HR documents on an instance where the
HR module is not installed.

**Instance:** https://dev296062.service-now.com (PDI) · alias `dev`
**Hub:** https://dev296062.service-now.com/x_335329_sn_hr_erp_hub.do

---

## The four rules that override any convenience

> **Never** draw a button that can't commit its decision.
> **Never** label HTML as PDF.
> **Never** display `0` for an absence.
> **Never** ship a test driver armed.
> **Never** seed an invented endpoint or field name. Blank beats wrong.

These are the product. A tile that shows `0` because a field was unmapped is a worse failure than
a tile that errors, because nobody investigates a number. If a change makes one of these harder to
guarantee, the change is wrong.

The fifth rule is the same failure arriving through the seed data. A blank
`endpoint_path_hint` makes an admin supply one; a plausible wrong one gives them a 404 they blame
on their own configuration — or worse, a 200 full of nulls. Every `*_hint` and every `field_map`
entry shipped in `src/fluent/tables/map-tmpl-seeds.now.ts` must cite its source in `source_note`
or be empty. OD37 emptied twelve rows for exactly this reason.

## The four-state contract

Every tile, every tab, resolves to exactly one of: **live · not configured · failed · stale**
(plus `partial` and `restricted`).

- A tile with no object map **names the map to create**.
- A tile whose ERP didn't answer **says so**, and never shows `0`.
- Stale data **shows its age**.
- A document that can't be generated correctly **isn't generated**, and says why.
- `v: 0` occurs **only** with `st: "live"`, and only when a successful run returned an empty set.

`docs/api-contract.md` is **binding**. The client binds to that file, not to observed output.

---

## The write path — five rules that outrank convenience

Everything under `src/server/write/` pushes changes into a payroll system. These are not style
preferences.

> **Every write goes through `erp-connector.fetch()`.** A dispatcher issuing its own
> `RESTMessageV2` is shorter and forfeits retry classification, backoff, the circuit breaker,
> `Retry-After` and `call_log`. A second HTTP path in this app is a defect, not a shortcut (OD42).
>
> **A write resolves its OWN `object_map` row** (OD51). `object_map` is keyed
> `(erp_system, logical_object, operation)`. A write that resolves the read map is sent with the
> read's verb, `rest-client` drops the body, and `extractAck()` reads an `id` out of the read's own
> response — reporting `confirmed` for a request that never left the instance. `npm run check`
> rule 8a fails any `fetch()` passing a `body` without an `operation`.
>
> **Every `erp_write` row is created by `write/create-write.ts`**, which sets the idempotency key
> **at insert**. The unique index is on `(erp_system, idempotency_key)`; a row inserted with a
> blank key collides with every other blank one. Rule 8b fails a module that inserts its own.
>
> **A 2xx is never success on its own.** No confirmable identifier in the body means `failed`,
> never `confirmed`. "The ERP accepted my request" and "the ERP recorded my change" are different
> claims and only the second is worth telling an employee.
>
> **The three `blocked_*` states stay distinct.** `blocked_readonly` is a configuration choice,
> `blocked_cutoff` a timing outcome, `blocked_approval` a governance outcome. Collapsing them into
> one `blocked` destroys the only thing the employee and the auditor need — the reason.
>
> **The approval gate is two-layer, and the second layer is not a business rule** (OD44). Trap 5
> means a `before` rule that throws is swallowed and the record saves; the dispatcher re-checks
> independently, immediately before the call, because that layer cannot be swallowed.
>
> **No payload value is ever stored.** `erp_write` keeps `request_hash`, never the body. An audit
> row carrying the salary or the IBAN recreates the shadow database D2 exists to prevent.

An **absent payroll calendar refuses the write.** Treating "no calendar configured" as "no cut-off
applies" is the four-state rule's failure in a new costume: an absence read as a permission.

---

## Read before changing anything

| File | Why |
|---|---|
| `docs/SESSION-RESUME.md` | Cold-start state. Read first. |
| `docs/DEFERRED.md` | Everything blocked or unverified. Read second. |
| `docs/decision-log.md` | D1–D19, per-layer decisions, OD1–OD46 — each with its rejected alternative. OD42–OD46 govern the write path. |
| `docs/BUGS.md` | Known defects and their fix status. |
| `docs/api-contract.md` | The binding L4↔L5 payload shape. |
| `docs/SN-HR-ERP-master-kickoff-prompt.md` | The normative spec. §7 four-state rule, §9 traps. |
| `docs/USER-GUIDE.md` | What an operator can actually do, and how. Written from live ground truth. |
| `docs/vendor-integration-research.md` | Per-vendor profiles. §2.2.2, §2.2.6 and §2.3.5 carry supersede banners — read those first. |
| `docs/unit4-integration.md` | Unit4 ERPx runbook. The only vendor with implementation-grade evidence behind it. |
| `docs/salesforce-integration-design.md` | Salesforce as the live test target. §1 is the list of things only a human can do. |
| `docs/noviq-brd-trd-alignment.md` | The Noviq BRD/TRD vs this app. §6 carries three conflicts to settle before either goes to v2. |
| `docs/noviq/stories.md` | 52 `NV-*` stories with falsifiable ACs. The Noviq backlog. |
| `docs/noviq/architecture.md` | §0 is the verification pass — 15 findings the story coverage matrix hid. |
| `docs/noviq/story-validation.md` | Second-brain prior-art pass. §2 carries the 30s-vs-240s timeout bug. |
| `docs/noviq/BUILD-LOG*.md` | What of the NV backlog is actually built, per session. Read before adding to it. |

Do not relitigate a logged decision. If you disagree, add a new `OD` with the reasoning.

---

## Commands

```bash
npm run build                      # now-sdk build — ALWAYS before install
npm run check                      # contract + NV logic + data minimisation + Store readiness
npx now-sdk install -a dev         # deploy (install does NOT build)
npx now-sdk query <table> -a dev -q "<encoded query>"
```

`now-sdk query` takes the table **positionally**; `-q` is **required**; a banner precedes output
(slice from the first `{`).

**On app tables, filter on business fields only.** Filtering on `sys_created_on` or
`sys_class_name` returns `403 Insufficient rights to query records` even as full admin — field-level
read ACLs gate the *query*, not just the response.

Writes beyond a deploy need the admin password. It is deliberately absent from this repo. Ask for
it, use it inline, **never write it to a file and never commit it**.

---

## Traps — each established live on this instance, none theoretical

1. **A relative import under `src/server/` without a `.ts` extension** builds clean, installs
   clean, and is **dead at runtime**. Cost two deploy cycles.
2. **A Scripted REST response is wrapped in `{"result": …}`** — including error bodies. Unwrap
   before reading either branch.
3. **`Acl.adminOverrides` defaults to `true`.** A deny rule omitting it is silently
   admin-overridable. Set it explicitly, every time.
4. **A Shape A deny refusal is SILENT** — HTTP 200, normal body, field unchanged. Any test
   asserting on status code passes against a completely broken ACL. Re-read the value, and write a
   control field in the same request so the result is interpretable.
5. **A `before` business rule that throws is swallowed and the record saves.** A crashed rule is
   indistinguishable from an approving one. Never infer a rule ran from a record's state.
6. **`GlideRecord.getValue()` on a Boolean returns `'1'`/`'0'`**, not `'true'`/`'false'`.
7. **`Record()` data values are build-time strings, not executed JavaScript.** `.join()` and `+`
   silently write the literal expression. Use `Now.include('./file')` for multi-line content.
8. **Deleting a Fluent `Table()` does not drop the table** — it strips the ACL and the columns and
   leaves an unprotected shell. Uninstall defaults to *"Retain tables and data"*.
9. **`sys_user_has_role` read is ACL-gated**; a role check by query fails closed while every admin
   test passes. Resolved by D14 — `gs.hasRole()` inside the REST API, ACLs enforce.
10. **`sys_trigger` silently drops `name`/`document`/`document_key`/`trigger_type` on REST insert**
    (HTTP 201, row self-consumes, runs nothing). A follow-up `PATCH` sets them.
11. **`now-sdk install` does not build.** A failed build empties the output dir and the next
    install fails with "No files found".
12. **Never invent a sys_id.** `Now.ID['key']` only.

### Two more, traced in code rather than observed live — treat as unconfirmed

13. **A date that fails to parse leaves the column empty, and an empty column reads as absent,
    not as a failure.** `rows_fetched` stays healthy, the run says `success`, and a "due within N
    days" tile reads `0` — meaning "no date was readable", not "nothing is due". The four-state
    rule leaking through a door it does not watch. `parseDate` now recognises OData V2's
    `/Date(1492098664000)/` **by shape, not by `date_format` config** (OD37). Any new wire format
    needs the same treatment: an admin who has to recognise the format first is how it stays
    invisible. **Derived from reading `field-mapper.ts` + SAP docs. No S/4 response has been
    fetched on this instance.**
14. **Whether an over-length seed literal is rejected at build or silently truncated on install
    is UNTESTED.** `map_tmpl.source_note` is String(500). Over-length literals were shortened
    pre-emptively rather than probed. If you need to know, probe it — do not assume either way.

### Binary payloads — read this before touching `binary-client.ts`

15. **`getBody()` is unusable on a response saved as an attachment.** The `RESTResponseV2` docs say
    so explicitly. This is the whole reason `src/server/connector/binary-client.ts` exists as a
    separate file rather than a branch inside `rest-client.ts`: the JSON path and the binary path
    cannot share a response reader without one of them being silently wrong.
16. **Scoped `getContent()` supports CSV, JSON and TXT only.** It is **not** a way to read PDF
    bytes. The `%PDF-` magic-byte check reads `getContentStream()` through `GlideTextReader`.
    Written the obvious way, that check mis-reads every PDF and fails **open** — which is worse
    than no check, because a check that is trusted and wrong is how HTML gets delivered as PDF.
17. **A new `auth_type` choice value does not authenticate itself.** `oauth2_client_credentials`
    and `oauth2_jwt` were added to the choice list (OD45) before `rest-client.ts` knew about them,
    and a system saved with either sent **no authentication at all** — surfacing as a 401 that
    looks exactly like bad credentials. Adding a choice value means auditing every branch that
    switches on it.

### Fluent / `.now.ts` syntax

- `var` is rejected — `const` only.
- ES6 shorthand property assignment is rejected (TS304).
- `Table()` must be a **named export whose variable name equals the table name** (TS213).
- `gs.nowDateTime()` is not allowed in scoped apps — use `new GlideDateTime()`.
- In `src/server/**` modules, Glide APIs are **not** global and must be imported. In `Class.create`
  Script Includes they **are** global and must not be imported.
- `ScriptInclude` / `ClientScript` `script` is string-only — `Now.include()`.

---

## Layout

```
src/fluent/        tables, ACLs, roles, properties, navigation  (.now.ts, metadata-as-code)
src/server/        connector/ sync/ api/ hr/ contract/          (runtime modules)
src/client/        React 18.2.0 SPA bundled into the BYOUI page
docs/              spec, designs, decisions, build reports
```

**L0** scaffold · **L1** control tower · **L2** connector · **L3** staging + sync ·
**L4** hub API · **L5** BYOUI SPA · **L6** HR documents.

**NV — the Noviq employee-services increment** (`docs/noviq/`) sits on top of those six. It is the
first thing in this repo that **writes to an ERP**, and it exists because OD42 reversed D3 for
that scope only.

```
src/fluent/tables/noviq-tables.now.ts    erp_scope_grant · erp_write · erp_exception
                                         payroll_calendar · write_approval_policy · vendor_onboarding
src/fluent/security/noviq-acls.now.ts    21 rules. Every deny is Shape A with adminOverrides false
src/server/write/                        dispatcher · approval-gate · cutoff · idempotency
                                         identity · exception-queue
src/server/ess/read-service.ts           the ONE read path every employee-facing widget uses
src/server/connector/binary-client.ts    PDF in/out, spool-and-shred (OD43)
src/server/connector/throttle.ts         vendor-stated limits only, 80% margin
```

**D3 is reversed narrowly, not generally.** Tab 2's requisition write-back stays deferred and
stays unrendered — no Approve/Reject control is drawn anywhere in the hub. Un-deferring the
capability was not permission to draw that button.

---

## Current state — be honest about this

All six layers are **deployed**. Almost none of the code has ever **executed**: `call_log` is 0
rows, `erp_staging` and `sync_run` are empty, no layer gate has been run, and no test has been
executed. **A clean build proves nothing. A passing happy-path fixture proves nothing.**

All 10 scheduled jobs ship `on_demand` + `active: false`. "Nothing happened" is the designed
default, not a fault.

**The NV increment is being built now** and is at roughly a third: six tables, 21 ACLs, the
dispatcher and nine server modules compile clean; the business rules, seeds and every UI surface
are outstanding. `docs/noviq/BUILD-LOG-21-30.md` is the current state — trust it over this
paragraph.

**There is a deploy backlog.** Everything since the `payload.k` envelope fix — the styling and
theme work, nine bug fixes, and the OD37 seed corrections — is built clean but **not installed**.
The SDK credential store is empty (`now-sdk auth --list` → "No credentials found") and re-adding
it needs a real terminal, because the masked prompt defeats both `printf` piping and a `script`
pseudo-TTY:

```
npx now-sdk auth --add https://dev296062.service-now.com --type basic --alias dev
```

The highest-value unblock is running the L2 gate driver once — see `docs/DEFERRED.md` §1.
