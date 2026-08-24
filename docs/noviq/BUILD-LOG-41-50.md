# Noviq NV-41…NV-50 — build log

**Session:** 2026-08-24 · **Build: clean.** `npm run check` passes — four scripts, one of which
prints a certification blocker on every run (OD50, deliberate).

Fifth in the series: `BUILD-LOG.md` (NV-1…10), `-11-20`, `-21-30`, `-31-40`, this one.

---

## The two checks are the most valuable thing in this batch

NV-48 and NV-49 asked for governance to be *provable*. Both are now build-time scripts rather than
paragraphs, and **both found something on their first run**:

### `scripts/check-store-readiness.mjs` found a shipped credential

`l2-fixtures.now.ts` seeds a `sys_auth_profile_basic` with the literal `postman`/`password`. It is
not a secret — postman-echo publishes those — but it **is a credential stored in an app record**,
which is what NV-49 AC2 forbids and how a Store reviewer will read it. Deleting it disarms the L2
gate driver, so it stays and is **named**: the script carries a one-entry `KNOWN_BLOCKERS` list and
prints `! CERTIFICATION BLOCKER (OD50)` on every single run. It is not suppressed by relaxing the
pattern, because a pattern relaxed for this credential would also miss the next real one.

### `scripts/check-minimisation.mjs` made the retention gap visible

Two tables have a retention window. **Seventeen do not**, and the script now lists them by name on
every run instead of leaving OQ-7 as a sentence in a document nobody re-reads.

### And a documentation error

Both `CLAUDE.md` and `README.md` claimed **11** scheduled jobs. There are **10** — counted three
ways (source, `ScheduledScript(` blocks, and `sysauto_script` keys in the generated registry). Both
corrected.

What the checks enforce: no `var` in Fluent, no `gs.nowDateTime()`, no `eval`, every relative
import under `src/server/` carrying `.ts` (trap 1), every deny ACL setting `adminOverrides`
explicitly (trap 3, **36 deny rules verified**), every scheduled job shipping `active: false` +
`on_demand`, no literal credentials, and the seven sensitive objects being unstageable **by
construction** rather than by policy. Instance-bound sys_id literals are reported (10 of them) but
do not fail — making them fail would need a suppression list, and a check with suppressions stops
being read.

**Second brain, NV-49:** `t_PublishAppsToTheServiceNowStore.md` states that **an application in
global scope cannot be published to the Store at all**, and that certification requires Technology
Partner Program membership. AC1's "zero Global records" is a hard publish gate, not hygiene; TPP
membership is a commercial prerequisite no code here can satisfy. Recorded in OD50.

---

## Delivered

| File | Story | What it does |
|---|---|---|
| `src/server/hr/template-resolver.ts` | NV-43 | Three-step fallback that **stops** — never another country's template |
| `src/server/hr/assemble.ts` | NV-43, NV-42 | Template resolved *before* the pre-flight; per-country mandatory-field override; optional-field literal defaults |
| `src/server/write/compensation-change.ts` | NV-44 | Manager → HR → Finance chain, Finance required for salary only; effective date refused when empty |
| `src/server/write/offboarding.ts` | NV-45 | Phase 1 read-back verification; phase 2 write hard-coded to `update` |
| `src/server/ess/benefits.ts` | NV-46 | Enrollment view; plan options from ERP reference data, never free text |
| `src/server/telemetry.ts` | NV-50 | Best-effort usage events, area resolved from the logical object |
| `usage_event` table + 3 choice sets | NV-50 | No employee, no payload, no value — by construction |
| `doc_tmpl.country/language/required_fields_override`, `doc_req.template_country/language` | NV-43 | Jurisdiction as data |
| `doc_type.optional_defaults` | NV-42 D9 | `Permanent -- no end date` as a literal, never for a required field |
| `nv-doc-seeds.now.ts` | NV-41, NV-42 | D4, D5, D9 live; D10 seeded **unpublished** |
| `nv-policy-seeds.now.ts` (+3 rows) | NV-42, NV-44, NV-45 | D9, compensation, termination gates |
| `scripts/check-minimisation.mjs`, `check-store-readiness.mjs` | NV-48, NV-49 | Above |
| `npm run check` | — | All four scripts in one command |

### Five things worth naming

**NV-43's fallback deliberately has no fourth step.** Exact (type, country, language) → that
country, any language → the country-agnostic default → **refuse**. A template written for another
country is never reached by any code path, because the wrong legal wording is worse than no
document: a missing document gets chased, a document citing the wrong jurisdiction's law gets
filed and relied on.

**The template is resolved before the pre-flight, not at render time.** A jurisdiction may declare
a different mandatory field set (AC4), and a pre-flight run against the wrong set validates the
wrong document.

**D9's "Permanent — no end date" is data, not a code branch.** `doc_type.optional_defaults` fills a
literal for an *optional* field the ERP did not return. It cannot reach a required field — the
required loop has already aborted — so no figure can be defaulted into existence.

**`sent` is not a telemetry success.** The dashboard's `success` count means the ERP confirmed it
recorded the change. And `blocked_cutoff` and `blocked_approval` stay distinct all the way into the
chart: "employees are blocked by cut-off" and "employees do not want this" call for opposite
responses from a product owner.

**Telemetry is instrumented once, in the shared read and write paths**, with the requirement area
derived from the logical object. A per-widget hook is a hook someone forgets, and a feature that
looks unused because nobody instrumented it is the exact wrong input to a scope decision.

---

## Per-story state — honest

| Story | State |
|---|---|
| NV-41 D4, D5, D10 | **D4 and D5 done** (types + templates + live read path). **D10 seeded unpublished** per AC3 — it activates when `benefit_enrollment` is mapped |
| NV-42 D6–D9 | **D9 done + gated.** **D6, D7, D8 deliberately not built** — see below |
| NV-43 localisation | **Done** — schema, resolver, override, recorded on the request |
| NV-44 compensation change | **Server complete**, policy seeded. HRSD case type + approval flow outstanding |
| NV-45 offboarding | **Phase 1 server complete**; phase 2 built and policy-gated but unreachable by design. Case type and task outstanding |
| NV-46 benefits | **Server complete.** Widget + catalog item outstanding |
| NV-47 timesheet | **Not started, correctly** — AC8 blocks it on NV-52's landscape record, which does not exist yet |
| NV-48 minimisation | **Build-time half done and passing.** Runtime sweep needs an instance |
| NV-49 Store readiness | **Lint done and passing**, one blocker named. Evidence-pack generator outstanding |
| NV-50 telemetry | **Table + instrumentation done.** Dashboard outstanding |

## Deliberately not built

- **D6 Work Certificate** — needs a `position_history` collection the model does not carry. NV-42
  AC2 permits it to be unpublished with a stated reason and **explicitly fails a flattened
  single-position substitute**.
- **D7 Final Settlement** — needs `final_pay_calculation` and `leave_payout`, neither modelled by
  the TRD (OQ-6).
- **D8 Contract Copy** — the signed contract is *retrieved*, never regenerated (AC4). It is an
  NV-25 retrieval item, blocked on the same streaming surface as D3.
- No approval policy for any of the three: a policy naming a document code nothing generates is a
  control that looks present and enforces nothing.

## A configuration trap this batch created, written down before it bites

**D5's `balance_value` needs `zero_is_meaningful` set on its `field_map` row.** Without it the
shared mapper omits a zero (L1 §4.4), the required-field check aborts, and a genuine zero balance
reads as "the ERP did not return it". That is the *safe* failure — a refusal rather than a false
certificate — but it is still the wrong answer, and the fix is one checkbox on the mapping. Noted
in the seed itself, not only here.

---

## Next

1. **NV-51** (country-aware `object_map`/`field_map`) and **NV-52** (landscape discovery) — NV-52
   unblocks NV-47.
2. The business rules still outstanding from NV-1…NV-20.
3. The surfaces, still gated on OQ-16 / OD40.

**Nothing has executed.** `call_log` is 0 rows.
