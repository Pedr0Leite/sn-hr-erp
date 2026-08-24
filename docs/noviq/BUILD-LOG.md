# Noviq NV-1…NV-10 — build log

**Started:** 2026-08-23 · **Status: IN PROGRESS, build not yet verified.**

## Done

**Governance gate (required before any code — NV-3 AC1).** Five decisions logged in
`docs/decision-log.md`:

| OD | What it settles |
|---|---|
| **OD42** | Reverses **DL-D3** for the Noviq scope only. Tab 2's requisition write-back stays deferred and unrendered. `read_only` survives and gains its own refusal state. Every write goes through `rest-client.ts` — a second HTTP path is a defect, not a shortcut. |
| **OD43** | A retrieved PDF is **spooled and shredded**, not streamed — `saveResponseBodyAsAttachment()` is the only supported route. The gap against BRD R1's literal wording is disclosed, not papered over. |
| **OD44** | The approval gate is **two-layer**: a `before` rule for the message, and an independent dispatcher re-check that trap 5 cannot swallow. |
| **OD45** | `auth_type` **adds** three values, never renames the existing three (L1-1 AC6). |
| **OD46** | A production Basic-auth exception **must expire**. The vault settled this: Unit4's own §13 lists Password (2-Way) as an open finding — TRD §2 and that deployment agree. |

**Code — `src/fluent/tables/choices.ts`:** added `AUTH_TYPE_CHOICES`, `ENVIRONMENT_CHOICES`,
`WRITE_STATE_CHOICES`, `WRITE_OPERATION_CHOICES`, `IDEMPOTENCY_MODE_CHOICES`,
`CALENDAR_SOURCE_CHOICES`.

**Code — `src/fluent/tables/erp-system.now.ts`:** 16 columns added, covering
NV-1 (`environment`, `auth_exception_ref`, `auth_exception_expires`),
NV-6 (`api_version`, `version_source_note`, `deprecation_notice_days` — **no default**,
`deprecation_policy_url`),
NV-11 (`max_attachment_bytes`, `max_throughput_bytes_per_min`, `allowed_mime_types`,
`attachment_limits_source_note` — all empty, never guessed),
NV-16 (`rate_limit_per_min`, `rate_limit_safety_pct` default 80, `expected_latency_ms`,
`throughput_source_note`) and NV-3 (`confirm_timeout_ms`).

## Not yet verified

`npm run build` was interrupted at the 2-minute tool timeout — **not a failure, not a pass.**
Re-run it before trusting anything above. It is the first thing the next session does.

## Remaining, in dependency order

1. Build verification, then **NV-2** `erp_scope_grant` + the pre-flight guard in `rest-client.ts`.
2. **NV-3** `erp_write` table + dispatcher (through `rest-client.ts`) + Shape A deny ACLs with
   `adminOverrides` explicit; **NV-4** deterministic key + unique index + existence check.
3. **NV-5** `binary-client.ts` (`%PDF-` magic bytes, MIME allowlist, OD43 spool-and-shred);
   **NV-7** `payroll_calendar` + resolver; **NV-8** audit ACLs + retention property;
   **NV-9** `write_approval_policy` + two-layer gate; **NV-10** extend the existing `emp_xref`
   (V3 — do **not** create a second identity table).

Every scheduled job in the remainder ships `on_demand` + `active: false` (repo rule 4).
