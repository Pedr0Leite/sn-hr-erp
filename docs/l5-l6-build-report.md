---
title: L5 + L6 — BYOUI hub and HR document generation — build report
app: x_335329_sn_hr_erp
instance: https://dev296062.service-now.com (PDI)
generated: 2026-08-13
scope note: product owner — ship code, defer testing. Neither gate is claimed or reworded.
rollback context: 597fec3347224b100739b71f316d434c
---

# The hub

**https://dev296062.service-now.com/x_335329_sn_hr_erp_hub.do**
(`?tab=financial|procurement|inventory|assets|manufacturing`; `sys_ui_page` `89336782e4924a5bbf1f126fde0e6383`, `direct: true`)

# Shipped and DEPLOYED

**L5**
- `sys_ui_page` at `x_335329_sn_hr_erp_hub.do` hosting a bundled **React 18.2.0** SPA
  (`@servicenow/react-components@0.1.8`, 168 KB chunk). No `sys_ux_lib_asset` (L5-D1); `uxpcb`
  cache-buster in `index.html` (L5-D2).
- `src/client/` — `state-renderer.ts` is the **only** place any component branches on `st`; tiles,
  charts and lists receive its output. Eight branches incl. the default: an unknown or absent `st`
  renders `State unavailable — this tile cannot be trusted` with **no numeral**.
- Absent-key contract read explicitly (`hasOwnProperty('v')`). No `|| 0` anywhere in the client.
- Charts: hand-drawn SVG, four shapes; **no SVG element is emitted at all** unless `st` ∈
  live/stale/partial and `cat`/`s` are present. `miss` is a sentence, never a zero series. Each
  chart has a "View as data" table.
- Lists: columns come from `cols` (gated columns are already dropped server-side); rows only when
  present; **no anchor element** when `link` is absent; `caveat` renders in every state.
- **Zero Approve/Reject controls** — no component, no handler, no dead branch. Bundle grep for
  `approve|reject|opportunity|lead|deal|pipeline|real-time` = **0 hits** (the Tab 2 caveat lives in
  the payload, not the bundle).
- One `GET /data` per tab, cached in `byTab`; `?tab=` + `popstate` + Polaris `fireTop` permalink.
- Error boundary + per-tab error region — never a blank page.
- `Workspace()` over `erp_system` / `object_map` / `sync_run` / `doc_req`, and a `viewer`-gated
  **ERP Hub** module. The app menu now carries `viewer` as well as `admin` (L5-D9).

**L6**
- 4 tables — `emp_xref` (4 columns, unique `user`+`erp_system`), `doc_type`, `doc_tmpl`,
  `doc_req` (auto-number `HRDOC`, `audit: true`).
- 2 document types + 2 templates seeded and active; placeholder names = the contract's logical field
  names.
- 3 `before` rules — type activation, template↔type placeholder validation, **the self-service
  boundary** (`requester` overwritten unconditionally; a non-`hr_viewer` naming somebody else is
  refused on every path including the Table API).
- 19 ACLs — incl. **7 Shape A deny-write** rules on `doc_req`, every one `adminOverrides: false`,
  and a script read ACL so a requester sees only their own requests.
- `src/server/hr/{assemble,render,rules}.ts` — pre-flight **before** any ERP call; live fetch only;
  `source_call_ids` written as calls happen; `DocumentContext` never persisted; every failure names
  the **field**, never its value.
- Runtime PDF probe; `resolveFormat()` is the single source of extension + content type + label.
  Output today is **HTML labelled HTML**. `grep -rn '\.pdf\|application/pdf' src/` hits exactly one
  line: the `PDF_FORMAT` constant `resolveFormat()` returns.
- Record producer on the base Service Catalog; drainer `ScheduledScript`.

**Verified by query after deploy:** 10 scheduled jobs, every one `active=false`,
`run_type=on_demand`. `grep -rn "x_335329_erpcrm" src/` = 0. D19 `.ts`-extension check = 0
violations. `node scripts/check-contract.mjs` passes.

# NOT met, NOT attempted

- **The L5 gate and the L6 gate.** Not run, not reworded, no partial credit (OD24).
- **Not one line of `src/client/` or `src/server/hr/` has executed.** The page builds, installs and
  is served; that proves the delivery mechanism, nothing about the sentences on it.
- **No staging fixtures still** (OD22 carried forward), so every tile on the deployed hub currently
  renders `not_configured` or `failed`. That is correct for an unsynced instance and is evidence of
  nothing.
- **§4.3's eight-sentence assertion harness was not written** (OD25) — the design calls those
  sentences the deliverable, and they are unverified.
- **`docs/l6-platform-seam.md` was not written** (OD26, build step L6-14).

# Contradictions found against the designs

1. **`objects.ts` and `l6 §3.2` named different fields.** The design says `employee_full_name` /
   `employment_start_date` / `annual_gross_salary` "are also the logical field names in
   `src/server/contract/objects.ts`". They were not — it had `full_name`, `hire_date`, `currency`.
   **Renamed, against this file's own add-never-rename rule**, after verifying zero `object_map`
   rows exist for either live-only object (L6-D9). `employment_status` added.
2. **`l6 §4.1` demands "the same mechanism L4 uses" AND "never `gs.hasRole()`".** L4 uses
   `gs.hasRole()` (L4-D9, because `sys_user_has_role` is unreadable to the roles it protects here).
   Story L6-3 AC4 recorded **superseded** (L6-D8).
3. **The design's `typeof` half of the PDF probe cannot be written** — the platform build rejects
   `global`/`globalThis` in a scoped module. The probe reports presence; the `%PDF-` byte check is
   what actually gates the label (L6-D10).
4. **`l5 §4.5`'s `target="_blank" rel="noopener noreferrer"` do not exist on `TextLink`@0.1.8.**
   `opensWindow` is the supported prop (L5-D11).
5. **`l5 §4.2`'s failed-with-history row is two sentences**, so `renderState()` returns a
   `detail` field alongside `headline`/`sub`/`tone`/`icon`. The strings are unchanged.
6. **A `currency` tile carries no currency code** unless it is mixed-currency. No symbol is printed
   (L5-D10) — the honest fix is a `currency` key in the L4 envelope.
7. **`l5 §3`'s workspace is a list-and-navigation shell only.** Unchanged from L5-D7 and restated
   in source: no `sys_ux_macroponent` is authored, so story L5-2 AC3 is satisfied *vacuously*.
8. **Design forbids class components; React error boundaries require one.** `ErrorBoundary` is the
   only class in the client, and the alternative is a blank white page.

# Open questions for the human

1. **§3.3's seam conflict (OD27).** Option (a) shipped. (b) reverses D2; (c) splits the catalogue.
2. **Arming.** Both the refresh drainer and the document drainer are disarmed, so `POST /refresh`
   queues into a void and no document is ever generated until someone runs the job. The UI says so
   verbatim (OD30). Arming = a source diff on `frequency` **and** `active`.
3. **`subject_employee` is visible to everyone on the producer form** (OD28). The refusal is
   server-side and stated; the hide was not built.
4. **The producer's `purpose` variable was dropped** (OD29) — it maps to no column.
5. **A currency symbol on monetary tiles** — needs an L4 envelope change, not a client guess.
6. Carried forward and unchanged: OD1 (retention arming), OD3/OD15 (no real vendor proven), OD12
   (empty `acltest` shell), OD20–OD23.
