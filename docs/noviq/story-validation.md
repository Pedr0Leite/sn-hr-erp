# Story validation pass — second brain restored

**Date:** 2026-08-23 · **Scope:** all 52 `NV-*` stories in `docs/noviq/stories.md`, plus `NV-53`
proposed in `docs/noviq/architecture.md`.

**Why this file exists.** The BA and architect passes both ran with the `sn-rag` MCP server
unreachable and both recorded that honestly rather than claiming vault coverage. The server was
restored at `192.168.1.90:8079`; this is the prior-art pass they were denied, plus a full
story-by-story read.

**Index queried:** 51,605 files · 506,089 chunks · drift 0 · consistent. Sources: 51,254 official
ServiceNow docs, 334 personal notes, 40 wiki pages, 29 custom-app documents, 2 code graphs.

**Verdict in one line:** the backlog is sound. **Twelve stories changed** — nine from vault
evidence, three from defects found by reading the stories against each other. Forty stories needed
no change. Nothing was found that invalidates an epic, a priority or a dependency chain.

---

## 1. What the vault actually contained

The decisive source is
`other-applications/unit4-erp/Unit4_ERP_Integration_Compendium_ServiceNow.md` — a **working,
in-production ServiceNow ↔ Unit4 integration**, TLP Green internal material, compiled 17 August
2026. It had been mined once before, for OD38, but only for its employee-API and auth sections.
**Sections 8 and 11–13 had never been read**, and they are the ones that bear on this backlog.

| Vault finding | Bears on | Effect |
|---|---|---|
| §8 — four named components of a shipped HR-document integration: *Generate document template - HTML* (HTML→PDF), *Unit4 Send Document to ERP* (low-level REST PDF send), *Unit4 ERP Document Integration*, *Move Attachment from HR Case to HR Task* | NV-5, NV-25, NV-36, NV-37 | **Closes the "which side renders the PDF" gap** and confirms every working path is `sys_attachment`-mediated, not streamed |
| §8.1 — the Promotion Letter flow, step by step | NV-36, NV-42 (D8) | Gives a reference implementation, incl. **alias resolved per company** and **terminate-on-generation-error** |
| §12.1 — 500 req/min per environment; 1,500/min shared on ACPT03–11; 350 MB/min; breach ⇒ **all requests suspended for one minute**; 429 + `Retry-After` documented | NV-16 | Real figures replace "state on request"; suspension changes the throttle design |
| §12.2/12.3 — file upload 58,368 KB; ERPx gateway 240 s, web app 110 s; ERP CR REST/SOAP 120 s; REST concurrency 10 | NV-11, NV-16 | **Exposes a conflict with this app's own 30 s default** |
| §11 — API lifecycle: use latest version, **EOL announced ≥18 months ahead** | NV-6 | First vendor row in the backlog that can be populated without guessing |
| §11 + §13 — environment matching PROD↔PROD, non-prod↔prod *"not supported or allowed"*, listed as a live finding | NV-15 | Upgrades a warning to a rejection |
| §13 — the deployment's **own** security backlog lists *"Employee REST uses Password (2-Way)"* as an open finding | NV-1 | **Shrinks conflict C2** |
| Zero Copy Connector for ERP — official ServiceNow app, remote tables, **SAP ECC/S4 only** through the Australia release | NV-52 | A build-vs-buy question no story asked |
| HRSD Advanced Integration with Workday / Oracle HCM / SuccessFactors — ships *Get Time Off Balance* | NV-52 | Same, for a fragmented HCM landscape |
| **Cegid, PHC — zero results, whole vault** | NV-15 | Conflict C4 stands unchanged |

---

## 2. The nine stories changed by vault evidence

**NV-1 — conflict C2 is smaller than the backlog claims.** The banner framed TRD §2 ("Basic Auth is
not acceptable for production") against a working Basic-auth deployment, as policy versus practice.
The compendium's §13 puts *"Employee REST uses Password (2-Way)"* on its **own** open-findings list,
action *"Validate credential rotation, ACLs and alias/environment separation"*, beside *"Discovery
endpoint has no authentication"*. Nobody is defending it. Both documents agree Basic is a weakness
and differ only on whether it blocks production today — which is exactly what an exception path is
for. **Added:** `auth_exception_ref` must carry a remediation target date; an exception with no
expiry is how a flagged finding becomes permanent.

**NV-5 — the stream is a fiction; design the spool.** Every documented working path moves documents
as `sys_attachment` records. This confirms the architect's V13/OD43 from the opposite direction:
`saveResponseBodyAsAttachment()` is not merely the only supported API, it is what the only working
deployment does. Design spool-and-shred deliberately rather than discovering it at build.

**NV-6 — Unit4's row ships populated.** `deprecation_notice_days = 540`, cited verbatim. Rule 5
permits it precisely because the citation exists.

**NV-11 — two limits, not one.** Per-file 58,368 KB **and** 350 MB/min account-wide. Ten 50 MB
uploads each pass the per-file check and together breach the second. Added
`max_throughput_bytes_per_min` as a rolling window; a per-file-only check now fails the AC.

**NV-15 — environment mixing is rejected, not warned.** The vendor states it as not allowed. A
warning on a prohibition is a warning someone clicks through.

**NV-16 — three additions, one of which is a live bug.** Real figures seeded. **The app's
`timeout_ms` default of 30000 is shorter than Unit4's own 240 s Public API allowance** — a
legitimately slow call is cut off by our own client and rendered `failed`: an ERP that answered,
reported as one that did not. That is the four-state rule leaking through a door nobody was
watching, and it is the most valuable single thing this pass found. Also: a rate breach suspends
**all** traffic for a minute, so it is a tenant-wide outage rather than a slow queue — the throttle
now ships at 80% of the stated limit and a breach raises a **high**-priority exception.

**NV-25 — inherits NV-5's spool.** No AC rewritten here; the "nothing stored" assertions stay, but
they are now assertions about net state after the transaction, not about a stream that cannot exist.

**NV-36 — the gap closes and a reference implementation arrives.** ServiceNow renders the PDF. Two
details adopted from the working flow: the **connection alias resolves per company** (a multi-company
tenant needs one each — the backlog assumed one per system), and the flow **terminates on a
generation error rather than continuing to archival**, which is repo rule 3 arriving from
production.

**NV-52 — discovery must answer build-vs-buy.** Zero Copy Connector serves BRD O3 natively but is
SAP-only, so it cannot serve an ERP-agnostic product — and for a SAP-only deployment it may already
be most of the read path. HRSD Advanced Integrations cover R3/INT-11 for three HCMs. Neither
displaces this backlog; committing to a custom build without recording why is the mistake the AC
prevents.

---

## 3. Three defects found by reading the stories against each other

These are not vault findings. They are contradictions inside the backlog.

**D1 — NV-3 sets a state its own column cannot hold.** The `read_only` refusal AC set
`erp_write.state=blocked`; the state list two ACs above is
`queued|sent|confirmed|failed|blocked_cutoff|blocked_approval`. A state that is not a member is a
test nobody can write. **Fixed:** added `blocked_readonly`. Kept distinct from the other two on
purpose — read-only is a configuration choice, cut-off is a timing outcome, approval is a governance
outcome, and collapsing them destroys the reason a write did not happen.

**D2 — NV-10 specifies a table that already exists.** The story said "a scoped extension table or
`x_..._employee_link`". The architect's V3 found `emp_xref` already present **with the required
unique index**. **Fixed:** the story now says EXTENDS, and three `Table(s)` lines were corrected.
Building the duplicate would have produced two identity tables and no error.

**D3 — NV-16's queue and NV-13's timeout budget fight each other.** NV-16 queues the 61st call
rather than dropping it; NV-13 gives every employee-facing read a synchronous timeout budget. A
queued *read* burns that budget waiting and then renders `failed` — again reporting an ERP that
would have answered as one that did not. **Fixed:** queue time counts against `read_timeout_ms`, and
a read that cannot dispatch inside its budget renders `Too many requests right now — try again
shortly`, which is a distinct fourth thing from `failed`, `not configured` and `0`.

---

## 4. Two judgement calls recorded rather than changed

**NV-13's session cache.** "Where a prior successful figure exists within the same user session it
may be shown as `Last good figure`" sits close to DL-D2 and to NV-25's absolute "nothing is stored".
It is defensible — in-memory, request-scoped, never persisted — but the story does not say so, and
the difference between a memory cache and a table write is the whole of D2. **Recommend** an
explicit AC: the session figure lives in memory only, is never written to any table or attachment,
and does not survive the session. Not changed unilaterally: it is a data-protection decision.

**NV-28's cache TTL "with a published default".** Every other configuration value in this backlog
ships empty rather than guessed, because a guessed default is rule 5's failure wearing a different
hat. A leave-type TTL is low-risk, but the inconsistency is real. **Recommend** the TTL ship empty
with reference data uncached until an admin sets it, or that the default be justified in the story.

---

## 5. The forty stories that needed no change

Read in full, checked against the source documents, the repo's decision log and the vault. No
defect found:

- **Epic A:** NV-2, NV-4, NV-7, NV-8, NV-9, NV-12, NV-14
- **Epic B:** NV-17, NV-18, NV-19, NV-20, NV-21
- **Epic C:** NV-22, NV-23
- **Epic D:** NV-24, NV-26
- **Epic E:** NV-27, NV-28*, NV-29, NV-30
- **Epic F:** NV-31, NV-32, NV-33
- **Epic G:** NV-34, NV-35
- **Epic H:** NV-37, NV-38, NV-39, NV-40, NV-41, NV-42, NV-43
- **Epic I:** NV-44, NV-45
- **Epic J:** NV-46, NV-47
- **Epic K:** NV-48, NV-49, NV-50, NV-51

\* NV-28 carries the §4 recommendation, not a defect.

**Dependency graph checked for cycles: none.** NV-8 → NV-9 → NV-3 → NV-1/NV-2 terminates cleanly.
Every P1/P2 story depends on a foundation story rather than floating, as BRD §4.3 requires.

Three ACs deserve naming as the best work in the set, because they are the ones that would actually
catch a shipped bug:

- **NV-26** — `tax_withheld` of zero. A `0` on a tax return is acted upon by a tax authority.
- **NV-41** — a certified zero leave balance on D5. Acted upon by a new employer.
- **NV-39** — D3 re-delivers the ERP's stored payslip and does **not** render one from data, with a
  byte-hash test. A rendered payslip is not the payslip that was issued.

---

## 6. What this pass did not settle

- **OQ-16 / architect V1 stands.** HRSD and Employee Center Pro are absent from `dev296062`. The
  vault confirms the *reference* deployment (`unit4dev1`) has HRSD — it uses HR Cases, HR Tasks and
  HR Profiles throughout — which strengthens the case that the Noviq product targets a different,
  HRSD-licensed instance, and that this repo's app is the non-HRSD variant. **Still a human
  decision.**
- **Cegid and PHC remain unresearched anywhere.** C4 unchanged.
- **Nothing has executed.** `call_log` is 0 rows, the credential store is empty, and no test in
  `docs/noviq/test-plan.md` has run. This pass improved a plan; it did not test one.
