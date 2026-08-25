# Salesforce as a test data source — runbook

**Status:** repo side is done and built. **Nothing has run.** No Salesforce call has been made from
this instance, `call_log` is still 0 rows, and the deploy backlog is still uninstalled.

**Why Salesforce at all.** Not because it is an ERP — it is not, and this app carries no CRM or
sales content. It is here because it is the one live third-party REST endpoint the owner actually
has credentials for, which makes it the cheapest way to prove the connector, the sync engine, the
staging provenance and the four-state contract against a **real** server instead of a fixture.
One object, one tab, read-only.

Source of every Salesforce fact below: `docs/vendor-integration-research.md` §2.1 (read 2026-08-14).
That section is the evidence; this file is the order of work.

---

## 0. What ships in the repo (built 2026-08-18, not installed)

| Change | File |
|---|---|
| New vendor choice `salesforce` | `src/fluent/tables/choices.ts` — an ADD, never a rename |
| `mapping_template` row `salesforce` / `fixed_asset` | `src/fluent/tables/map-tmpl-seeds.now.ts` |

Nothing else. No new table, no new tab, no code change to the connector or the engine.

---

## 1. What only you can do

Six items. Everything else is done.

| # | Input | Where | Why it cannot be automated |
|---|---|---|---|
| 1 | `npx now-sdk auth --add https://dev296062.service-now.com --type basic --alias dev` | a **real terminal** | The masked password prompt defeats piping and a `script` pseudo-TTY. Blocks the entire deploy backlog, not just this work |
| 2 | An **External Client App** in the Salesforce org, client-credentials flow enabled, with a **run-as user** | Salesforce Setup | Browser-only. Connected Apps are disabled by default in new orgs (Winter '26); ECAs do not support username-password at all |
| 3 | The app's **client ID + client secret** | from #2 | Secret. Paste it into ServiceNow yourself — never into this repo, never into a file here |
| 4 | An **OAuth provider** + **OAuth entity profile** on the ServiceNow instance | `oauth_entity` / `oauth_entity_profile` | `erp_system.auth_profile_oauth` is a reference to a row only you can create, and it holds the secret |
| 5 | The `erp_system`, `object_map` and `field_map` rows | hub UI, or the Table API with the admin password | Writes beyond a deploy need the admin password, which is deliberately absent from this repo |
| 6 | A decision on **OD32** before setting `active = true` | you | See §5. This is the only step that changes what an existing tile *means* |

The run-as user's permissions govern every row returned. Give it read on `Asset` and nothing else.

---

## 2. Confirm the org before configuring anything

```
GET https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com/services/data
```

Unauthenticated, returns the version list. Research recorded **v67.0** for this org on 2026-08-14.
**If the list has moved on, change the version in `endpoint_path` — do not assume v67.0 still
resolves.** Everything below hardcodes it.

Token endpoint (My Domain host, **not** `login.salesforce.com`):

```
POST https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com/services/oauth2/token
grant_type=client_credentials
```

---

## 3. The `erp_system` row

| Field | Value |
|---|---|
| `name` | `Salesforce DE (test)` |
| `vendor` | `salesforce` |
| `base_url` | `https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com` |
| `auth_type` | `oauth2` |
| `auth_profile_oauth` | the profile from §1 item 4 |
| `use_mid_server` | `false` |
| `timeout_ms` | `30000` |
| `max_retries` | `2` |
| `read_only` | **`true`** |
| `active` | **`false`** — flip it only after §5 |

`legal_entity` is free text; put `DE org` so the provenance column is not blank.

---

## 4. The object map, and applying the template

Create one `object_map`: `logical_object = fixed_asset`, `http_method = get`, then press
**Apply vendor defaults**. That fills six `field_map` rows and four hints from the seeded template.

Then **type these two by hand — the template cannot carry either**:

| Field | Value | Why by hand |
|---|---|---|
| `query_template` | `q=SELECT+Id,Name,SerialNumber,Price,Status,UsageEndDate+FROM+Asset+LIMIT+2000` | `map_tmpl` has no `query_template_hint` column (OD36, still open) |
| `zero_is_meaningful` on the `value` row | `true` | The template JSON carries only `source` and `transform` |

What the template gives you:

| logical field | Salesforce field |
|---|---|
| `erp_id` | `Id` |
| `name` | `Name` |
| `asset_tag` | `SerialNumber` |
| `value` | `Price` |
| `status` | `Status` |
| `eol_on` | `UsageEndDate` |

`lifecycle_stage` and `currency` are **deliberately unmapped**. `AssetLevel` is a hierarchy depth
integer, not a stage. `CurrencyIsoCode` exists only in multi-currency orgs, and naming it in the
SOQL on a single-currency org fails the **whole query** with `INVALID_FIELD` — map it only after
you have confirmed it exists.

`deep_link_path` stays **empty**. The Lightning URL is `/lightning/r/Asset/<Id>/view` and
`joinUrl()` cannot append the trailing `/view`. Empty means no link is drawn, which is the rule.

### Two ceilings, both real, neither hidden

**Pagination is `none`, and that is a hard 2000-row ceiling.** Salesforce paginates with
`nextRecordsUrl`, which `nextUrlFrom()` (`src/server/sync/engine.ts:106`) does not look for — and
even if it did, the value is a **relative path**, so `hostOf()` returns `''` and the host-guard
correctly refuses it. A DE org holds tens of rows, so `LIMIT 2000` covers this test completely.
Past 2000 rows the set truncates silently with `done:false` and nothing records it. **Fix
`nextUrlFrom` before pointing this at a tenant with real volume.** Not fixed here: it is dead code
for the test this file exists to run.

**Rate limit is HTTP 403 `REQUEST_LIMIT_EXCEEDED`, not 429.** `RETRYABLE_STATUS` does not include
403, so one call is spent rather than six. That is correct behaviour, and it means an exhausted
daily quota shows as `failed`, not as a retry storm.

---

## 5. OD32 — read this before setting `active = true`

`src/server/api/tabs.ts` filters every tile by **logical object, never by `erp_system`.** The
moment this system is active with a synced `fixed_asset` map, **Salesforce `Asset` rows are counted
inside the existing Tab 4 asset tiles**, blended with every other ERP's fixed assets in one KPI.

Provenance survives in `erp_staging.erp_system` and in the row list. The **number** does not.

That may be exactly right — one estate, many sources is this app's premise. It may also be wrong:
a CRM asset is arguably not the same kind of thing as an ERP fixed asset. **It is a UI decision,
not an architecture one**, and it is yours. Until you answer it, the row stays `active = false`,
which keeps everything configured and nothing blended.

If you want the test without the decision: run the sync with `active = true` just long enough to
watch `call_log` and `erp_staging` fill, read the rows, then set it back to `false`. The tile
blending is only visible while it is active.

---

## 6. What is refused, and stays refused

`employee_profile` from Salesforce `User` — **no.** `Id`, `Name`, `Department`, `Title`,
`IsActive`, `EmployeeNumber` map cleanly to four of seven logical fields, but
`employment_start_date` has no source on `User` and `payroll_record` has none at all. This object
exists to render **salary certificates**. A certificate with a blank start date is precisely what
D2 and L6-D9 were written to prevent. Raised as OD34 and left refused.

`balance`, `vendor_invoice`, `gl_summary`, `purchase_order`, `requisition`, `backorder`,
`asset_depreciation`, `production_output`, `machine_downtime`, `payroll_record` — Salesforce is not
a ledger and not an MES. **No template row, for any of them, ever.**

`stock_item`, `maintenance_schedule`, `work_order`, `invoice` are real Salesforce objects but each
needs a licence a bare DE org may not have, and their field API names were **not** verified. Listed
in research §2.1.6 so nobody re-derives them; deliberately not seeded.

The ServiceNow **Salesforce Spoke** is not used. D4 commits this app to its own connector; the
Spoke is a Flow Designer action set, and using it reintroduces the cross-scope dependency D4
removed.

---

## 7. Order of work

1. Terminal: `now-sdk auth --add` (§1 item 1).
2. `npm run build && npx now-sdk install -a dev` — ships this work **and** the whole backlog.
3. Run `HRERP L2 GATE (temporary)` once. **Do this before Salesforce**: it is the first proof the
   connector executes at all, and it takes about a minute. A Salesforce failure debugged on top of
   an unproven connector costs a day.
4. Salesforce Setup: External Client App, client credentials, run-as user (§1 items 2–3).
5. ServiceNow: OAuth provider + entity profile (§1 item 4).
6. Create `erp_system` (§3), `object_map` + Apply vendor defaults, then the two hand-typed values (§4).
7. Sync once with `active = true`. Read `call_log`, then `erp_staging`, then the tile.
8. Answer OD32 (§5).

Do not shortcut step 3.
