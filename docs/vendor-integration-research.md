---
title: Vendor integration research — per-vendor connector profiles
app: x_335329_sn_hr_erp
author: architect
generated: 2026-08-14
status: research + design. NOTHING HERE HAS BEEN EXECUTED AGAINST A LIVE ERP.
extends: docs/l1-control-tower-design.md §5 (mapping_template), docs/l2-connector-design.md
grounding: |
  Repo read from disk this session: src/server/contract/objects.ts (the logical contract),
  src/fluent/tables/{erp-system,object-map,field-map,map-tmpl,map-tmpl-seeds,choices}.now.ts,
  src/server/connector/{rest-client,field-mapper,config-loader}.ts, src/server/sync/engine.ts,
  src/server/api/tabs.ts, docs/{l1-control-tower-design,l2-connector-design,DEFERRED,decision-log}.md.
  External sources are cited inline with the date they were read (2026-08-14).
---

# 0. How to read this, and what it is not

**OD18 still stands.** No connector call has ever executed on this instance. Every profile below
is *theory that fits the deployed shapes*, not a profile that has fetched a row. A profile marked
"fits the connector" means **the configuration is expressible in the columns that exist** — not
that it works.

**The seed rule is unchanged (L1 §5.2, story L1-4 AC3).** Every `mapping_template` row proposed
here ships `verified: false`. A row below whose field names I could not confirm against a current
source this session is marked **UNVERIFIED — do not seed**, and it must not be written into
`map-tmpl-seeds.now.ts`. An invented template flagged `verified: false` is still an invention an
admin may apply and half-trust; that is L1-D5, and it governs this document too.

**D5 discipline applies to vendor profiles.** A vendor profile makes an *existing* dimension
configurable — auth type, endpoint, response root, pagination style, date format, field names. It
does not invent a logical field. Every `field_map` row below lands on a field that exists in
`src/server/contract/objects.ts`. Where a vendor has data the contract has no field for, the
answer is "not mapped", never a new field.

**Vendor choice values already exist** for every vendor in this document except Salesforce.
`VENDOR_CHOICES` in `src/fluent/tables/choices.ts` already carries `sap_s4`, `sap_ecc`,
`oracle_ebs`, `oracle_fusion`, `dynamics_365_fo`, `unit4`, `infor`, `netsuite`, `workday`,
`generic_rest`, `generic_odata`. Only `salesforce` is new, and adding it is an **ADD**, which the
add-never-rename rule permits.

---

# 1. Summary table

| Vendor | Auth | Pagination | Date on the wire | Response root | Fits the deployed connector? |
|---|---|---|---|---|---|
| **Salesforce** (new `salesforce`) | OAuth2 **client credentials** (or JWT bearer). Username-password is retired | `nextRecordsUrl` (relative path) | `yyyy-MM-dd` (Date), `yyyy-MM-dd'T'HH:mm:ss.SSSZ` (DateTime) | `records` | **Single page: YES.** Multi-page: **NO** — §4.1 |
| **Unit4 ERPx** | OAuth2 client credentials, U4IDS, `scope=u4erp` | `limit` + `offset` | **UNCONFIRMED — not documented anywhere I reached** | **EMPTY — the body is the array** | **YES** on every dimension I could verify — §2.2.4 |
| **SAP S/4HANA Cloud** | OAuth2 client credentials, or basic (comm. user) | OData `$skip`/`$top` **+ V4 `@odata.nextLink`** | `yyyy-MM-dd` (V4 `Edm.Date`); V2 emits `/Date(ms)/` | V2 `d.results`, **V4 `value`** | **Partly.** Existing `sap_s4` seed is wrong on both — §2.3 |
| **Oracle Fusion Cloud ERP** | OAuth2 or basic | `limit` + `offset`, `hasMore` flag | ISO-8601 (per-field type unconfirmed) | `items` | **YES** — `offset` style emits the exact parameter names |
| **Oracle NetSuite** | OAuth2 client credentials **with a signed JWT client assertion** | `limit` + `offset`, `links[rel=next]` | ISO-8601 (unconfirmed) | `items` | **NO — auth cannot be performed.** REST shape fits — §2.5, §4.3 |
| **MS Dynamics 365 F&O** | OAuth2 client credentials (Microsoft Entra ID) | **`@odata.nextLink`**, absolute, same host | ISO-8601 (unconfirmed) | `value` | **YES, unchanged** — `next_url` works out of the box |
| **Infor CloudSuite** | ION API `.ionapi` credential file — likely **not** a plain OAuth secret | **NOT RESEARCHED** | — | — | **Dropped for budget** — §2.7, §5 |
| **Workday Financials** | not researched | **NOT RESEARCHED** | — | — | **Dropped for budget** — §2.7, §5 |

---

# 2. Per-vendor profiles

## 2.1 Salesforce — new vendor value `salesforce`

Salesforce is a **CRM**, and this app is specified with **no CRM/sales content**. It is designed
here as a **vendor profile only**: an `erp_system` row like any other, staging into `erp_staging`
with provenance. **No sixth tab. No Salesforce object placed on any existing tab.** §2.1.7 raises
the one UI decision this creates and stops there.

### 2.1.1 Auth — the username-password flow is dead, and this is the decisive finding

| Fact | Source, read 2026-08-14 |
|---|---|
| The OAuth 2.0 username-password flow was **blocked by default** for connected apps from the Spring '24 (v244) release notes onward | [Salesforce release notes — username-password flow blocked by default](https://help.salesforce.com/s/articleView?language=en_US&id=release-notes.rn_security_username-password_flow_blocked_by_default.htm&release=244&type=5) |
| Salesforce **enforces the retirement** of the username-password flow in **Winter '27**, in all editions. "All connected app integrations that use the username-password flow will no longer work" | [Retirement of OAuth 2.0 Username-Password Flow](https://help.salesforce.com/s/articleView?id=release-notes.rn_security_unpw_flow_retirement.htm&release=262&type=5) |
| Salesforce's own recommendation for **server-to-server** integrations is the **client credentials flow** | same |
| **External Client Apps (ECA) do not support the username-password flow at all** | [Salesforce Ben — External Client vs Connected Apps](https://www.salesforceben.com/external-client-vs-connected-apps-comparing-salesforces-next-gen-integration/) |

**Answer to the question asked: no.** Do not plan on username-password against this org. Even if
it happened to be switchable on today, it is retired within one release cycle and the work would
be thrown away. It is also the flow that would have required the owner's password — which this
design does not want anywhere near a ServiceNow record.

### 2.1.2 Connected App or External Client App? — External Client App

| Fact | Source, read 2026-08-14 |
|---|---|
| From **Winter '26**, Connected App creation via the UI is **disabled by default in new orgs** | [Salesforce Ben](https://www.salesforceben.com/external-client-vs-connected-apps-comparing-salesforces-next-gen-integration/), [Revenue Ops — Spring '26 change](https://www.revenueopsllc.com/salesforce-is-phasing-out-connected-apps-heres-what-the-spring-26-change-really-means/) |
| From **Spring '26**, customers cannot create new Connected Apps through UI **or API** unless Salesforce Support enables it for the org | same |
| ECAs support **client credentials** and **JWT bearer**; they do **not** support username-password | [Salesforce Ben](https://www.salesforceben.com/external-client-vs-connected-apps-comparing-salesforces-next-gen-integration/) |

The owner's org (`orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com`) is a recent-generation
Developer Edition org, created well after Winter '26. **Assume Connected App creation is not
available and use an External Client App.** §3.1 is written for the ECA path; if the ECA menu is
genuinely absent, §3.1 note (a) gives the fallback.

**Grant: client credentials.** JWT bearer is the alternative and is the better choice for a
production tenant (no long-lived shared secret), but it requires generating an X.509 certificate,
uploading it, and having ServiceNow sign a JWT assertion — which is a **new outbound auth flow the
connector does not have** (§4.1). Client credentials is expressible in what is deployed today.

**Token endpoint:** `POST https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com/services/oauth2/token`
with `grant_type=client_credentials`, `client_id=<consumer key>`, `client_secret=<consumer secret>`.
The host is the org's **My Domain** host, not `login.salesforce.com`.

**Scopes.** The client credentials flow needs the token to carry API access. Select
`api` ("Manage user data via APIs") on the ECA; `refresh_token`/`offline_access` is commonly
selected alongside it. Source: [Cloudaware — ECA with client credentials](https://docs.cloudaware.com/DOCS/cmdb-api-using-external-app-with-credentials-flow),
read 2026-08-14. **The exact scope string set is confirmed only as `api`; the rest is
convention, not verified against Salesforce's own doc this session.**

**A run-as user is mandatory.** The client credentials flow has no user interaction, but
Salesforce still requires an execution user, and **that user's permissions govern every row
returned**. This is a genuine control: point it at a minimally-privileged user and the connector
physically cannot read more than that user can. Source:
[Salesforce Help — client credentials flow](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_oauth_client_credentials_flow_ca.htm&language=en_US&type=5).

### 2.1.3 Base URL, and the API version — verified live

The org's own `/services/data/` endpoint is unauthenticated, so this was checked directly:

```
GET https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com/services/data/
```

Read 2026-08-14: 34 versions, **v31.0 (Summer '14) through v67.0 (Summer '26)**. **The current
API version for this org is `v67.0`.** Use it in every path below. This is the one Salesforce fact
in this document verified against the owner's actual org rather than against documentation.

- `erp_system.base_url` = `https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com`
  (no trailing slash needed; `buildEndpoint` strips them).
- `object_map.endpoint_path` = `/services/data/v67.0/query`

**The version is in the endpoint path, not in the base URL.** That is deliberate: `base_url` is
per-system and `endpoint_path` is per-object, so a version bump is a per-object edit. Pinning it
also means a Salesforce release cannot silently change field behaviour under the app.

### 2.1.4 Read shape, response root, pagination

`GET /services/data/v67.0/query/?q=<url-encoded SOQL>` returns
([REST API Developer Guide — Query](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_query.htm), read 2026-08-14):

```json
{ "totalSize": 14, "done": true, "records": [ { "attributes": {"type":"Asset"}, "Id": "02i..." } ] }
```

- **Response root: `records`.** Expressible today.
- **Pagination: `nextRecordsUrl`**, e.g. `/services/data/v67.0/query/01gD0000002HU6KIAW-2000`,
  present only while `"done": false`. Default batch 2000 records.

**This is where Salesforce stops fitting, and it fails in two independent ways** —
see §4.1 for the fix:

1. `nextUrlFrom()` in `src/server/sync/engine.ts` (line 106) looks for
   `next`, `next_url`, `nextUrl`, `nextLink`, `@odata.nextLink`. **`nextRecordsUrl` is not in the
   list.** Pagination would silently end after page 1.
2. Even if it were, `nextRecordsUrl` is a **relative path**. `hostOf()` (engine.ts:93) returns
   `''` for it, which never equals `hostOf(base_url)`, so §4.5's host-confinement treats it as
   **off-host** and stops. That is the guard working correctly on input it was not designed for.

**Recommended v1: `pagination_style = none`, with an explicit `LIMIT` in the SOQL.** A Developer
Edition org holds tens of rows, not tens of thousands, and one 2000-row page covers it. This is a
real ceiling, not a hidden one: at 2000 rows the set is silently truncated with `done:false` and
nothing records it. Ship v1 this way, fix `nextUrlFrom` before any tenant with real volume.

### 2.1.5 Dates, errors, limits

**Dates.** Salesforce `Date` fields serialise as `2026-08-14`; `DateTime` fields as
`2026-08-14T10:00:00.000+0000`. `object_map.date_format` is **per object, not per field**, so an
object mixing both types cannot express both. `parseDate` (field-mapper.ts:106) tries the hint
first and falls through to `setDisplayValueInternal` when it yields nothing, so the mismatched
half *may* still parse — **unverified, and it is the kind of thing that returns a wrong date
rather than no date.** Keep the first Salesforce object mapped to Date-typed fields only, which
`Asset` below satisfies. Set `date_format = yyyy-MM-dd`.

**Errors — and this matters for the four-state rule.** A Salesforce error body is a **top-level
JSON array**
([Error responses](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/errorcodes.htm), read 2026-08-14):

```json
[ { "message": "The requested resource does not exist", "errorCode": "NOT_FOUND" } ]
```

With `response_root = records`, an error body has no `records` key, `walkPath()` returns `null`,
and the engine records `RESPONSE_UNPARSEABLE` — **not zero rows**. The four-state rule holds. But
note the hazard for any *other* profile: **a vendor configured with an empty `response_root`
(= "the body is the array") would parse a Salesforce-style error array as one valid record.**
That is not a Salesforce problem, it is a `generic_rest` problem, and it is raised as **OD33**.

**Rate limits.** Over the daily API request limit, Salesforce returns **HTTP 403 with
`REQUEST_LIMIT_EXCEEDED`** — *not* 429. `RETRYABLE_STATUS` is `[408,425,429,500,502,503,504]`, so
403 is correctly non-retryable and one call is spent, not six. **Developer Edition allows only 5
concurrent long-running requests** (≥20 s). Source:
[Salesforce Developers — API limits and monitoring](https://developer.salesforce.com/blogs/2024/11/api-limits-and-monitoring-your-api-usage),
read 2026-08-14. The commonly-quoted DE figure of 15,000 calls/24 h was **not confirmed** by that
source and is not asserted here.

**ServiceNow ships a Salesforce Spoke** in IntegrationHub. It is **not relevant**: D4 commits this
app to its own ported connector, the Spoke is a Flow Designer action set rather than a REST
connector this app can call, and using it would introduce the cross-scope dependency D4 removed.
Recorded so the question is answered rather than left open.

### 2.1.6 Proposed `mapping_template` — one row, and only one

Salesforce has **no general ledger, no vendor invoices, no purchase requisitions, no MES**. Most
of the contract has no honest Salesforce source and is left unmapped. Stating that is the point of
this section.

#### `salesforce` / `fixed_asset` — PROPOSE TO SEED

Salesforce `Asset` is a standard object present in Sales Cloud and Service Cloud, so it should
exist in a bare Developer Edition org. Field API names confirmed against the
[Object Reference — Asset](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_asset.htm)
field list, read 2026-08-14: `Id`, `Name`, `SerialNumber`, `StockKeepingUnit`, `Price`,
`Quantity`, `Status`, `InstallDate`, `PurchaseDate`, `UsageEndDate`, `LifecycleStartDate`,
`LifecycleEndDate`, `AssetLevel`, `Product2Id`, `AccountId`.

```
object_map:
  erp_system      = <the salesforce system row>
  logical_object  = fixed_asset
  endpoint_path   = /services/data/v67.0/query
  http_method     = get
  response_root   = records
  query_template  = q=SELECT+Id,Name,SerialNumber,Price,Status,UsageEndDate+FROM+Asset+LIMIT+2000
  pagination_style= none          (see §2.1.4 — this is a real 2000-row ceiling)
  page_size       = 100           (unused when style is none)
  date_format     = yyyy-MM-dd
  deep_link_path  = <EMPTY>       (see below — an empty path draws no link, by design)
```

| logical field | Salesforce field | transform | zero_is_meaningful | note |
|---|---|---|---|---|
| `erp_id` | `Id` | none | — | 18-char Id; also the deep-link ref |
| `name` | `Name` | none | — | |
| `asset_tag` | `SerialNumber` | none | — | `StockKeepingUnit` is the alternative; SerialNumber is the closer analogue of an asset tag |
| `value` | `Price` | none | **true** | a genuinely £0 asset is a fact, not a gap |
| `status` | `Status` | none | — | picklist: Shipped / Installed / Registered / Obsolete / Purchased |
| `eol_on` | `UsageEndDate` | none | — | Date type, matches `date_format` |
| `lifecycle_stage` | — | — | — | **NOT MAPPED.** `AssetLevel` is a hierarchy depth integer and `Status` is already taken. No honest source |
| `currency` | — | — | — | **NOT MAPPED.** `CurrencyIsoCode` exists **only in multi-currency orgs**; on a single-currency DE org, naming it in the SOQL makes the whole query fail with `INVALID_FIELD`. Map it only after §3.1 step 9 confirms it exists |

**`deep_link_path` stays empty.** The Lightning record URL is
`/lightning/r/Asset/<Id>/view`, and `joinUrl(base, path, ref)` produces `base + path + '/' + ref`
— it cannot append the trailing `/view`. A path of `/lightning/r/Asset` yields a URL missing that
segment, and whether Salesforce resolves it is **unverified**. The column's own rule is
"EMPTY MEANS NO LINK IS DRAWN — never a broken link". Leave it empty; a human can verify the
truncated URL in a browser in ten seconds and fill it in afterwards.

#### Candidates that are real but UNVERIFIED — do not seed

Each of these needs a Salesforce feature or licence that a bare Developer Edition org may not
have, and **I did not confirm their field API names against a current source this session.** They
are recorded so a later session does not re-derive them, and they are explicitly not seeds.

| logical object | Salesforce object | Blocked on |
|---|---|---|
| `stock_item` | `ProductItem` (Field Service inventory — quantity on hand at a location) | Field Service licence; field names unverified |
| `maintenance_schedule` | `MaintenanceAsset` / `MaintenancePlan` | Field Service licence; field names unverified |
| `work_order` | `WorkOrder` | Field Service / Work Orders enabled; `line` has no plausible source |
| `invoice` | `Invoice` (Revenue Cloud / Salesforce Billing) | Add-on licence; field names unverified |

#### Objects with no honest Salesforce source — say so, do not invent

`balance`, `vendor_invoice`, `gl_summary`, `purchase_order`, `requisition`, `backorder`,
`asset_depreciation`, `production_output`, `machine_downtime`, `payroll_record`. Salesforce is not
a ledger and not an MES. **No template row, for any of them, ever.**

`employee_profile` is a special case and is refused deliberately. Salesforce `User` carries
`Id`, `Name`, `Department`, `Title`, `IsActive`, `EmployeeNumber` — four of the seven logical
fields would map cleanly. But `employment_start_date` has no source on `User`, `payroll_record`
has none at all, and this object exists to render **salary certificates** (L6). A certificate
built from a CRM user record with a blank start date is exactly the failure D2 and L6-D9 were
written to prevent. **Not mapped.** If the owner wants a live-only demo target, that is a
decision, not a default — raised as **OD34**.

### 2.1.7 The UI decision this creates — OD32, and I stop here

`src/server/api/tabs.ts` filters every tile by **logical object**, never by `erp_system`. There is
no code path that scopes a tile to one system. So the moment a `salesforce` system has an active
`fixed_asset` map and a sync runs, **Salesforce `Asset` rows are counted in the existing Tab 4
asset tiles, mixed with rows from every other ERP.** They carry provenance in
`erp_staging.erp_system` and are visible in the row list, but the KPI is a single blended number.

That may be exactly right — one estate, many sources, which is the app's whole premise. It may
also be wrong: a CRM asset and an ERP fixed asset are not the same kind of thing, and blending
them silently changes what the tile means. **This is a UI decision, not an architecture one.**
Raised as **OD32**. Until it is answered, ship the Salesforce `erp_system` row with
`active = false`, which keeps it configurable and un-synced.

---

## 2.2 Unit4 ERPx — existing vendor value `unit4`

The owner's warning was half right. **The mechanism-level documentation is public and I read it
this session.** The **per-object property names are not reachable**, and this section refuses to
invent them.

### 2.2.1 What is publicly reachable, and what is not

| Reachable | Not reachable |
|---|---|
| `https://develop.unit4cloud.com/erpx/auth-security/` — auth model, grant type, scope | The per-Enterprise-Document pages. Direct URLs under `/erpx/reference/accounting/<doc>` return **404**, the index renders its links client-side, and search surfaces only the index and the ObjectAPI page |
| `https://develop.unit4cloud.com/erpx/reference/object-api` — URL shape, query params, pagination, response envelope, error shape | Any concrete property name (`invoiceNumber`? `dueDate`? `amount`?) for any object |
| `https://develop.unit4cloud.com/erpx/reference/accounting/` — the **names** of the Enterprise Documents | The date/datetime wire format — **not stated on any page I reached** |

All read 2026-08-14. Nothing below is reconstructed from a blog post.

### 2.2.2 Auth — OAuth2 client credentials against Unit4 Identity Services

> **CORRECTED 2026-08-17 by OD38.** The last line of this section — *"Basic auth: not offered for
> ERPx"* — is contradicted by implementation evidence. The Unit4 ERP Integration Compendium
> records a **working** ServiceNow ↔ Unit4 employee REST integration authenticating with
> **"Password (2-Way) through Connection Alias"**, i.e. a ServiceNow Basic Auth credential. The
> OAuth 2.0 / U4IDS path below remains what the Developer Portal documents. Both are printed in
> `docs/unit4-integration.md` §2 rather than resolved: one is vendor documentation, the other is
> an observed deployment. Ask the tenant contact which their environment accepts.

Unit4 ERPx uses **U4IDS** (Unit4 Identity Services), OpenID Connect over OAuth 2.0, issuing JWTs
validated by the ERPx API host. For machine-to-machine integration the documented flow is
**client credentials**: client ID + client secret + `grant_type=client_credentials` +
**`scope=u4erp`**, posted to the IdP token endpoint, returning a bearer token **tied to a single
tenant**. Source: [Unit4 Developer Portal — Authentication & Security](https://develop.unit4cloud.com/erpx/auth-security/), read 2026-08-14.

**The exact token endpoint URL is not stated on that page** and I did not find it. It is
tenant-specific and comes from the customer's Unit4 contact — §3.2 asks for it explicitly.

Basic auth: not offered for ERPx. `auth_type = oauth2`, and `auth_type = basic` is wrong for this
vendor.

### 2.2.3 REST shape — the ObjectAPI, and it fits the connector well

Source: [Unit4 Developer Portal — ObjectAPI](https://develop.unit4cloud.com/erpx/reference/object-api), read 2026-08-14.

- **Base URL**: `https://<unit4-api-address>` — a per-tenant host supplied by Unit4. The
  documentation writes it literally as the placeholder `unit4-api-address`.
- **Endpoint path**: `/v1/objects/<enterprise-document-name-plural>`, documented example
  `https://unit4-api-address/v1/objects/customers`. `/v1/objects/relations` is the other concrete
  path I saw, which confirms a lowercase/camelCase plural.
- **Query parameters**, standard across every endpoint: `select`, `filter`, `orderBy`, `limit`,
  `offset`, **`companyId`**. Some endpoints add transactional-state flags — `GeneralLedgerTransactions`
  requires at least one of `registered` / `posted` / `historical` to be `true`.
- **Pagination**: `limit` + `offset`. **No next-link mechanism is documented.**
- **Response root: EMPTY — the body *is* the array.** Documented example:

```json
[ { "companyId": "EN", "customerId": "1001", "customerName": "Smith & Jones Industries Ltd.",
    "invoice": { "creditLimit": 300000.000, "currencyCode": "GBP" } } ]
```

Note the **nested groups** (`invoice.creditLimit`). `field_map.source_field` supports dotted paths
via `walkPath` (field-mapper.ts:81), so `invoice.currencyCode` is expressible. Good.

- **Error body**: a JSON **object**, not an array:

```json
{ "code": 1020, "message": "At least one of the parameters 'registered', 'posted', 'historical' should be set to 'true'" }
```

**The four-state rule holds, and I checked the code path rather than assuming it.**
`mapResponse` (field-mapper.ts:250) does `walkPath(body, '')` → the whole body → then
`Object.prototype.toString.call(node) !== '[object Array]'` → **returns `null`** → the engine
records `RESPONSE_UNPARSEABLE`, not zero rows. An empty result set is `[]`, which *is* an array
and correctly renders as zero.

### 2.2.4 Connector fit — a clean match on every dimension I could verify

| Dimension | Unit4 | Existing connector | Fit |
|---|---|---|---|
| Auth | OAuth2 client credentials | `auth_type = oauth2` | yes |
| Pagination | `limit` + `offset` | `pagination_style = offset` emits **`offset=N&limit=M`** (engine.ts:81) | **yes — the parameter names match exactly** |
| Response root | body is the array | `response_root` empty = body is the array | yes |
| Tenant/company | `companyId` query param | `query_template` | yes — `companyId=EN` |
| Date format | **UNCONFIRMED** | `date_format` | unknown |
| Error shape | JSON object | non-array root → `RESPONSE_UNPARSEABLE` | yes |

**No connector change is required for Unit4** on anything I was able to verify.

### 2.2.5 The deployed `unit4` seeds are wrong and should be corrected

`src/fluent/tables/map-tmpl-seeds.now.ts` carries four `unit4` rows (lines 577–640) with
`endpoint_path_hint: '/api/v1/balance'`, `response_root_hint: 'data'`,
`pagination_style_hint: 'page'`, `date_format_hint: 'yyyy-MM-dd'`. Against the ObjectAPI
documentation, **three of those four are wrong**:

| Column | Seeded | Documented | Verdict |
|---|---|---|---|
| `endpoint_path_hint` | `/api/v1/balance` | `/v1/objects/<plural>` | **wrong** |
| `response_root_hint` | `data` | empty (bare array) | **wrong** |
| `pagination_style_hint` | `page` → `page=1&per_page=100` | `offset`/`limit` | **wrong** |
| `date_format_hint` | `yyyy-MM-dd` | not documented | **unconfirmed, not disproven** |

Their `source_note` already says "Guess from Unit4 ERP REST naming. NOT confirmed" — so the design
was honest. It is now *known* wrong, which is a different state. **Fix the three structural hints;
do not touch `field_map` on those rows** (see next).

### 2.2.6 Proposed `mapping_template` — structural hints only, NO field rows

> **SUPERSEDED 2026-08-16 by OD37 — APPLIED, and one inference below was wrong.**
> This section inferred **camelCase** plurals (`supplierInvoices`) from the `customers` /
> `relations` examples. The object reference pages print **kebab-case**:
> `/v1/objects/supplier-invoices`, `/v1/objects/customer-invoices`,
> `/v1/objects/general-ledger-transactions`, `/v1/objects/asset-objects`,
> `/v1/objects/frequency-codes`. They are reachable on **`develop.unit4rd.com`** — the
> `develop.unit4cloud.com` host used below 404s on those paths. Option **(b)** was taken: the
> structural hints are corrected and the `field_map` payloads are empty. See `docs/decision-log.md`
> OD37 for the applied result.

**I could not reach a single Unit4 property name, so no `field_map` payload is proposed.** The
existing seeded `field_map` JSON on those four rows was guessed from naming conventions and I have
nothing to replace it with. Two honest options, and the second is recommended. **This is OD31**, and it applies identically to the `sap_s4`, `oracle_fusion` and `dynamics_365_fo` seeds:

- **(a)** Leave the guessed `field_map` payloads in place, correct the three structural hints.
- **(b) Recommended.** Correct the three structural hints and **empty the `field_map` payload** on
  all four rows. An `object_map` with zero `field_map` rows is `MAP_UNMAPPED` → `not_configured`
  → the tile reads *"Not configured"* naming the object. That is L1-D5's rule applied honestly:
  **a template that carries correct plumbing and no invented field names is more useful than one
  that carries invented field names**, because the admin gets a working endpoint and a dropdown
  instead of a plausible-looking wrong answer.

Concrete structural template (Enterprise Document names taken from the accounting index page;
**the exact plural URL segment is inferred from the `customers` / `relations` examples and is
itself unverified**):

```
vendor                = unit4
endpoint_path_hint    = /v1/objects/<plural>      e.g. supplierInvoices, customerInvoices,
                                                        generalLedgerTransactions, assetObjects
response_root_hint    = <EMPTY>
pagination_style_hint = offset
date_format_hint      = <EMPTY>                   -- unknown; empty makes parseDate fall back to
                                                     the platform's own ISO-8601 parsing
```

Enterprise Documents named on the accounting index that plausibly serve this contract —
**names verified, mappings not**: `Supplier Invoices` → `vendor_invoice`;
`Customer Invoices` → `invoice`; `General Ledger Transactions` → `gl_summary`;
`Asset Objects` / `Asset Transactions` / `Asset Groups` → `fixed_asset` / `asset_depreciation`.
Procurement, Inventory management and Personnel each have their own index which I did not open.

**`generalLedgerTransactions` needs a mandatory flag.** Its `query_template` must carry at least
one of `registered=true` / `posted=true` / `historical=true`, or the call returns error 1020 —
which the connector correctly renders as a failure, but the admin will not know why. Put it in
the template: `query_template = posted=true&companyId={companyId}` (with the company hard-coded
per system; `{external_id}` is the only placeholder the connector substitutes).

---

## 2.3 SAP S/4HANA — existing vendor value `sap_s4`, and the existing profile is wrong

The brief asked what the existing `sap_s4` profile assumes and whether it is right. **It is not.**
Its `source_note` is honest — *"Guess from public SAP S/4HANA OData API naming conventions … NOT
confirmed"* — but the guess is wrong in a way that is now demonstrable, and one of the errors is
worse than a wrong URL: it produces **silently empty date columns**.

### 2.3.1 What the deployed profile assumes

Eight `sap_s4` rows in `map-tmpl-seeds.now.ts` (lines 33–160), all identical in structure:

```
endpoint_path_hint    = /sap/opu/odata/sap/API_<OBJECT>_SRV/<Object>
response_root_hint    = d.results
pagination_style_hint = odata_skiptop
date_format_hint      = yyyy-MM-dd
```

### 2.3.2 What is actually true

| Assumption | Verdict | Evidence, read 2026-08-14 |
|---|---|---|
| Path prefix `/sap/opu/odata/sap/` | **RIGHT** | Confirmed on two real services below |
| Service names `API_BALANCE_SRV`, `API_INVOICE_SRV`, `API_VENDOR_INVOICE_SRV`, `API_GL_SUMMARY_SRV`, `API_PURCHASE_ORDER_SRV`, `API_REQUISITION_SRV`, `API_STOCK_ITEM_SRV`, `API_BACKORDER_SRV` | **WRONG — every one is invented.** They are the app's own logical object names upper-snake-cased and wrapped in `API_…_SRV` | Real services are named differently: **`API_PURCHASEORDER_PROCESS_SRV`** and **`API_SUPPLIERINVOICE_PROCESS_SRV`** ([SAP Community — PO via API_PURCHASEORDER_PROCESS_SRV](https://community.sap.com/t5/spend-management-blog-posts-by-sap/purchase-order-via-api-purchaseorder-process-srv-example-api-call/ba-p/13700856), [Alteryx Community — supplier invoice OData extract](https://community.alteryx.com/discussion/887653/sap-s-4hana-cloud-extract-supplier-invoice-data-via-odata-api)) |
| Entity set named like the object (`PurchaseOrder`) | **WRONG** | The real request URIs are `/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/**A_PurchaseOrder**` and `/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/**A_SupplierInvoice**`. S/4 entity sets carry an **`A_` prefix** |
| `response_root = d.results` | **RIGHT for OData V2, WRONG for V4.** SAP ships both | OData V4 uses a flat **`value`** root ([DSAG UI5 Best Practice — V2 vs V4](https://1dsag.github.io/UI5-Best-Practice/odata/v2vsv4.html)) |
| `pagination_style = odata_skiptop` | **RIGHT**, and the connector emits `$skip=N&$top=M` verbatim | engine.ts:87 |
| **`date_format = yyyy-MM-dd`** | **WRONG, and this is the dangerous one** | An OData **V2** `Edm.DateTime` serialises as **`/Date(1492098664000)/`** — epoch milliseconds in a string wrapper, not ISO. See §2.3.3 |

### 2.3.3 The `/Date(…)/` problem — a wrong figure, not a loud failure

`parseDate` (field-mapper.ts:106) does `GlideDateTime.setValueUTC(raw, 'yyyy-MM-dd')`, gets
nothing from `/Date(1492098664000)/`, falls through to `setDisplayValueInternal`, and gets nothing
there either. The C2 rule then does the right thing: **the column is left empty, never "now"**.

So it fails safely — but it fails *invisibly*. `rows_fetched` is a healthy number, the sync is
`success`, and every `due_on` / `posting date` / `period_end` in the set is blank. A Tab 1 tile
counting invoices due within N days finds **zero**, and zero here means "we could not read any
date", not "nothing is due". That is the exact shape of failure the four-state rule exists to
prevent, arriving through a door the four-state rule does not watch.

**This needs a connector change** — `epoch_millis` date handling. §4.2.

### 2.3.4 Auth and base URL

- **Base URL**: `https://<host>` where the host is per-tenant. For S/4HANA Cloud the public
  API host is of the form `my<NNNNNN>-api.s4hana.cloud.sap`; for on-premise / private cloud it is
  the gateway host and port. **I did not verify the exact public-cloud host pattern this session**
  — take it from the tenant's Communication Arrangement, which prints it.
- **Auth**: S/4HANA Cloud Communication Arrangements offer **basic auth with a communication user**
  and **OAuth 2.0 (client credentials / SAML bearer)**. Both map to existing `auth_type` values.
  Basic is not retired here the way it is at Salesforce, but it is the weaker choice.
- **`Accept: application/json`** is already sent unconditionally by `rest-client.ts:141`, which is
  what makes an SAP OData V2 service return JSON rather than its default XML. **No change needed**
  — but adding `$format=json` to `query_template` costs nothing and removes the dependency.
- **CSRF**: SAP requires an `x-csrf-token` for **modifying** requests only. `fetch()` is read-only
  by construction (L2 §5), so this never arises. Recorded so it is not re-investigated.

### 2.3.5 Proposed correction — structural only, NO field rows

> **SUPERSEDED 2026-08-16 by OD37 — APPLIED, and four more services were verified since.**
> Point 3 below said the other six service names were not found. Four now are:
> `API_BILLING_DOCUMENT_SRV/A_BillingDocument` (`invoice`),
> `API_JOURNALENTRYITEMBASIC_SRV/A_JournalEntryItemBasic` (`gl_summary`),
> `API_PURCHASEREQ_PROCESS_SRV/A_PurchaseRequisitionHeader` (`requisition`, **deprecated by SAP**,
> and `$format=json` returns HTTP 500 on it — SAP KBA 3366726),
> `API_MATERIAL_STOCK_SRV/A_MaterialStock` (`stock_item`). Only `balance` and `backorder` are
> still blank. Point 4's `epoch_millis` parser was built — but by **shape detection** in
> `parseDate`, not as a `date_format` value, so no admin has to recognise `/Date(…)/` first.
> See `docs/decision-log.md` OD37.

**I verified two service/entity names and no field names.** The eight seeded `field_map` payloads
(`AmountInCompanyCodeCurrency`, `GLAccount`, `PostingDate`, `ObjectKey`, …) are plausible S/4
naming, but plausible is what got the service names wrong. **Do not treat them as confirmed.**

Recommended edit to `map-tmpl-seeds.now.ts`:

1. **`purchase_order`** — correct to
   `endpoint_path_hint = /sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder`.
   **Verified this session.**
2. **`vendor_invoice`** — correct to
   `endpoint_path_hint = /sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice`.
   **Verified this session.**
3. **The other six** (`balance`, `invoice`, `gl_summary`, `requisition`, `stock_item`,
   `backorder`) — their service names are invented and I did not find replacements this session.
   **Blank `endpoint_path_hint` rather than leave an invented path.** An empty hint means the
   admin must supply one, which is honest; a wrong hint means the admin applies the template and
   gets a 404 they will blame on their own configuration.
4. **`date_format_hint`** on all eight — set to whatever §4.2's new parser is named
   (`epoch_millis` if the V2 services are used, `yyyy-MM-dd` only for V4 `Edm.Date` fields).
   Until §4.2 exists, **leave it empty**: an empty format at least lets ISO-8601 values through
   the `setDisplayValueInternal` fallback, whereas `yyyy-MM-dd` on a V2 datetime is a hint that
   is guaranteed to miss.
5. Update every `source_note` to say which release of this document corrected it and which two
   names are verified.

**Note the V2/V4 split is per-service, not per-tenant.** SAP publishes some APIs as OData V2
(`d.results`) and newer ones as V4 (`value`). `response_root` is a per-`object_map` column, so the
app can already express both — it just cannot express them in one template row. That is fine: it
is one field on the form.

---

## 2.4 Oracle Fusion Cloud ERP — existing vendor value `oracle_fusion`

**The deployed profile is structurally correct.** Of the four vendors whose seeds I checked, this
is the one whose guess held up.

| Column | Seeded | Documented | Verdict |
|---|---|---|---|
| `endpoint_path_hint` prefix `/fscmRestApi/resources/11.13.18.05/` | | ERP/Financials/SCM base path is `/fscmRestApi/resources/{version}/` | **RIGHT** |
| `response_root_hint = items` | | `{ "items": [...], "count": 25, "hasMore": true, "limit": 25, "offset": 0 }` | **RIGHT** |
| `pagination_style_hint = offset` | | `limit` + `offset`, with a `hasMore` boolean | **RIGHT — and the connector emits `offset=N&limit=M`, the exact parameter names** |
| `date_format_hint = yyyy-MM-dd` | | ISO-8601; **the precise per-field type was not confirmed this session** | plausible, unconfirmed |
| Resource names `balances`, `invoices`, `vendor_invoices`, `gl_summarys`, `purchase_orders`, `requisitions` | | Real resources are camelCase, e.g. **`receivablesInvoices`** | **`gl_summarys` and `vendor_invoices` are invented.** `invoices` and `purchaseOrders` are plausible real names; **`gl_summarys` is not a word** |

Sources, read 2026-08-14:
[Oracle docs — REST API for Common Features](https://docs.oracle.com/en/cloud/saas/applications-common/26b/farca/op-fscmrestapi-resources-11.13.18.05-setuptasks-get.html),
[Oracle docs — REST API for Fusion Cloud Financials (`receivablesInvoices`)](https://docs.oracle.com/en/cloud/saas/financials/26a/farfa/op-receivablesinvoices-customertransactionid-child-receivablesinvoicelines-customertransactionlineid-child-receivablesinvoicelinegdf-get.html),
[Oracle Cloud Customer Connect — limit/offset behaviour](https://community.oracle.com/customerconnect/discussion/881457/unable-to-fetch-more-than-500-records-from-rest-api-using-limit-and-offset).

**Auth**: OAuth2 or basic; both map to existing `auth_type` values. **Gotcha**: a Cloud Customer
Connect thread reports being unable to retrieve **more than 500 records** via `limit`/`offset`.
If real, `MAX_PAGES` × `page_size` will hit a server-side ceiling before it hits the app's own.
Unconfirmed as a hard product limit — treat as a thing to watch, not a fact.

**Action**: blank the two invented resource names (`gl_summarys`, `vendor_invoices`); leave the
rest; do not touch the `field_map` payloads, which are still unverified guesses.

---

## 2.5 Oracle NetSuite — existing vendor value `netsuite`. **Auth does not fit.**

NetSuite is the one vendor here whose **authentication the deployed connector cannot perform.**

**REST shape — fits.** Base `https://<accountID>.suitetalk.api.netsuite.com`, path
`/services/rest/record/v1/<record>`, response root **`items`**, pagination **`limit`/`offset`**
(default limit 100, max 1,000, offset hard-capped at 100,000) plus a `links` array carrying
`rel: "next"`. The seeded row (`/services/rest/record/v1/invoice`, root `items`, `offset`) is
**structurally right**. Sources:
[NetSuite — Collection Paging](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156414087576.html),
[NetSuite — fetching a list with pagination](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1017083728.html), read 2026-08-14.

**Auth — does not fit.** NetSuite OAuth 2.0 machine-to-machine is **client credentials with a JWT
client assertion**, not client_id + client_secret:

```
POST https://<accountID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token
grant_type=client_credentials
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
client_assertion=<JWT signed with the integration's private key, public cert uploaded to NetSuite>
```

Source: [Boomi Community — NetSuite OAuth 2.0 client credentials with JWT client assertion](https://community.boomi.com/s/article/How-to-set-up-NetSuite-REST-API-OAuth-2-0-Client-Credentials-Flow-with-JWT-Client-Assertion-Using-the-REST-Client-Connector), read 2026-08-14. The legacy alternative is Token-Based
Authentication (OAuth 1.0a request signing), which is **also** not something
`setAuthenticationProfile('oauth2', …)` performs.

`erp_system.auth_type` offers `basic` / `oauth2` / `mutual`, and `rest-client.ts:155-158` has
exactly one branch each. **Neither covers a JWT-assertion grant.** See §4.3. Until then a NetSuite
system is configurable and will fail at the auth step — which the connector reports as a
`failure`, correctly, but for a reason no admin will diagnose from the log.

---

## 2.6 Microsoft Dynamics 365 Finance & Operations — existing vendor value `dynamics_365_fo`

**Fits the connector unchanged, and the deployed seed is structurally right.**

| Dimension | Value | Source, read 2026-08-14 |
|---|---|---|
| Base URL | `https://<env>.operations.dynamics.com` (per-environment) | [Microsoft Learn — OData](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/odata) |
| Endpoint | `/data/<DataEntity>` | same |
| Response root | **`value`** (OData V4) | same |
| Pagination | **`@odata.nextLink`**, absolute URL, same host — *and* `$skip`/`$top` work | same |
| Auth | Microsoft Entra ID, **client credentials** (shared secret or certificate) | [Microsoft Learn — service endpoints](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/services-home-page) |
| Company scoping | **`cross-company=true`** query option, otherwise you get only the user's default legal entity | [Microsoft Learn — OData](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/odata) |

**`@odata.nextLink` is already in `nextUrlFrom`'s candidate list** (engine.ts:106) and D365 emits
it as an **absolute URL on the same host**, so `hostOf()` matches and §4.5's host confinement
passes. **`pagination_style = next_url` works out of the box for this vendor** and is preferable
to the seeded `odata_skiptop`, because it lets the server decide the page boundary.

**The one thing the seed gets wrong is silent and costly**: no `cross-company=true`. Without it
the app shows one legal entity's figures and calls them the estate. Put it in `query_template`:

```
query_template = cross-company=true&$format=json
```

`legal_entity` already exists as a column on `erp_system` (for disambiguating two systems of the
same vendor). It is **not** wired to this query option and should not be — that would be a
connector reading a config column it was never given. One row per legal entity, or
`cross-company=true`, is the admin's choice.

**Action**: change `pagination_style_hint` to `next_url`, add the `cross-company=true`
`query_template` (there is no `query_template_hint` column — see §4.5), leave the rest. The
`field_map` payloads remain unverified guesses.

---

## 2.7 Infor CloudSuite and Workday Financials — DROPPED

**I did not research these.** Budget was spent on the four vendors the brief prioritised plus the
two Oracle products. Saying so is the deliverable; a section reconstructed from memory would be
worse than this sentence.

What is already in the repo for them is **one mechanism-proving seed row each**, already declared
as a known gap in `docs/l1-build-report.md` and L1 §5.2. That status is unchanged by this
document. The one fact worth recording, because it changes the shape of the work: Infor's ION API
distributes credentials as a downloadable **`.ionapi` file** containing the token endpoint, client
ID and secret — so its §3 click-path is "download the file and read six values out of it" rather
than "copy two fields", and it is likely to need a `saak`/`sask` pair that is not a plain OAuth
client secret. Treat Infor as a possible §4 auth change, not an assumed fit.

---

# 3. Human click-paths

Everything in this section needs a browser and a human. Values that cannot be known until a step
is finished are written `<from §3>` where they are consumed elsewhere in this document.

**The credential rule, and it is not negotiable.** Every secret produced below goes into a
**ServiceNow credential / OAuth record on the instance**. **No consumer key, consumer secret,
client secret, certificate, private key or password is written into this repository** — not into
a `.now.ts` file, not into a fixture, not into a comment, not into `docs/`. `map-tmpl-seeds.now.ts`
and `erp-system` fixtures carry **hostnames and paths only**. The owner's Salesforce password was
deliberately not given to this session and must not be recorded anywhere by anyone.

## 3.1 Salesforce — create an External Client App (owner, ~10 minutes)

Org: `https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com/`
User: `pedro.leite.4a4e5abc7f54@agentforce.com`

Step order is based on [Cloudaware's ECA + client-credentials walkthrough](https://docs.cloudaware.com/DOCS/cmdb-api-using-external-app-with-credentials-flow)
and [Salesforce Help — configure an ECA for client credentials](https://help.salesforce.com/s/articleView?id=xcloud.meta_configure_client_credentials_flow_for_external_client_apps.htm&language=en_US&type=5),
both read 2026-08-14. **Menu labels shift between releases — if a label below does not match, the
one on screen is right and this document is stale.**

1. Log in to the org. **Setup** (gear icon, top right) → **Setup**.
2. Quick Find → type `External Client App` → click **External Client App Manager**.
3. Click **New External Client App**.
4. **External Client App Name**: `SN HR ERP Connector`. **Contact Email**: the owner's.
   Leave **Distribution State** as **Local**.
5. Expand **API (Enable OAuth Settings)** → tick **Enable OAuth**.
6. **Callback URL**: `http://localhost:1717/OauthRedirect`. It is unused by the client
   credentials flow but the form requires one.
7. **Selected OAuth Scopes**: add **`Manage user data via APIs (api)`**. That is the one scope
   this integration needs. Add `Perform requests at any time (refresh_token, offline_access)`
   only if step 14 fails without it.
8. Under **Flow Enablement**, tick **Enable Client Credentials Flow** and accept the security
   warning. Untick **Require Proof Key for Code Exchange (PKCE)** — PKCE is for the
   browser-redirect flow and is not used here.
9. Click **Create**.
10. Open the new app → **Policies** tab → **Edit** → expand **OAuth Policies** → tick
    **Enable Client Credentials Flow** → in **Run As**, select the integration user.
    **Read §2.1.2 before choosing:** *this user's permissions are the connector's permissions.*
    For a demo org the owner's own user is fine. Save.
11. **Settings** tab → expand **OAuth Settings** → click **Consumer Key and Secret** → complete
    the emailed identity-verification code → the page shows **Consumer Key** and
    **Consumer Secret**.
12. **Hand back these two values, by a private channel, not in this repo:**
    - `<from §3.1 — CONSUMER KEY>`
    - `<from §3.1 — CONSUMER SECRET>`
13. Wait ~5–10 minutes before the first token request. A newly created app does not propagate
    instantly and an immediate call can return `invalid_client`.
14. **Verify before anything is built in ServiceNow.** From any terminal:
    ```
    curl -X POST https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com/services/oauth2/token \
      -d grant_type=client_credentials \
      -d client_id=<CONSUMER KEY> \
      -d client_secret=<CONSUMER SECRET>
    ```
    Expect JSON containing `access_token` and `instance_url`. **Do not paste the response
    anywhere.** If it returns `invalid_client_id` or `unsupported_grant_type`, step 8 or step 10
    did not save.
15. **Confirm `Asset` is queryable and which fields exist**, using the token from step 14:
    ```
    curl -H "Authorization: Bearer <ACCESS TOKEN>" \
      "https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com/services/data/v67.0/sobjects/Asset/describe"
    ```
    Report back **only**: (a) does the call succeed; (b) is `CurrencyIsoCode` in the field list
    (§2.1.6 depends on the answer); (c) the `type` of `UsageEndDate` — `date` or `datetime`.
16. Create at least **three `Asset` records** in the org by hand (App Launcher → Assets → New),
    with a `Price`, a `SerialNumber` and a `UsageEndDate` populated. **A working connector
    against an empty object renders `0`, and a `0` that is correct is indistinguishable from
    the bug this app exists to prevent.** OD18's gate needs rows to be worth running.

**Note (a) — fallback if step 2 finds no External Client App Manager.** Then this org predates
the change or has it disabled. Use **Setup → App Manager → New Connected App**, and follow the
same field names; the run-as user lives under **Manage → Edit Policies → Client Credentials Flow**.
Everything downstream in this document is identical — only the creation screen differs.

## 3.2 ServiceNow side — what the owner or a ServiceNow admin does with those values

1. **All → System OAuth → Application Registry → New → "Connect to a third party OAuth Provider"**.
2. **Name**: `Salesforce SN HR ERP`. **Client ID** = `<from §3.1 — CONSUMER KEY>`.
   **Client Secret** = `<from §3.1 — CONSUMER SECRET>`.
   **Token URL** = `https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com/services/oauth2/token`.
   **Default Grant type** = **Client Credentials**. Save.
   (Source for the navigation and the "Connect to a third party OAuth Provider" option:
   [ServiceNow docs — OAuth 2.0 tutorial: create an OAuth provider and profile](ServiceNowOfficialDocs/api-reference/web-services/t_OAuthDemoCreateProvider.md), read via `sn_search` 2026-08-14.)
3. Open the related list **OAuth Entity Profiles** → the profile created with the registry →
   confirm **Grant type = Client Credentials**. ServiceNow's own docs confirm Client Credentials
   is a supported outbound grant type on an OAuth Entity Profile
   ([platform-security/connections-and-credentials/oauth-2-credentials.md](ServiceNowOfficialDocs/platform-security/connections-and-credentials/oauth-2-credentials.md)).
   **Copy this profile's sys_id** → `<from §3.2 — OAUTH ENTITY PROFILE SYS_ID>`.
4. Create the `erp_system` record (**form, not source** — see §4.6):
   - `name` = `Salesforce Dev`  · `vendor` = `salesforce` (needs §4.4 deployed first)
   - `base_url` = `https://orgfarm-1d836b10af-dev-ed.develop.my.salesforce.com`
   - `auth_type` = `oauth2` · `auth_profile_oauth` = `<from §3.2 — OAUTH ENTITY PROFILE SYS_ID>`
   - `read_only` = **true** · `active` = **false** until OD32 is answered (§2.1.7)
5. Create the `object_map` row exactly as §2.1.6 specifies, then its six `field_map` rows.
6. **Do not tick `mapping_verified`.** It is under a Shape A hard deny-write and is set only by
   the apply action (L1 §6). If it is ticked by hand and it works, that is a security defect —
   report it.

## 3.3 Other vendors — what a human must supply, per vendor

None of these are click-paths I can write, because none of the systems exist for this project yet
(**OD3**). What they are is a **shopping list**: the values that must come back before any
`erp_system` row is worth creating. Each is a question for the customer's ERP administrator.

| Vendor | Must be supplied by a human | Why it cannot be derived |
|---|---|---|
| **Unit4 ERPx** | The tenant **API host** (`unit4-api-address`), the **U4IDS token endpoint URL**, a client ID + secret provisioned for `scope=u4erp`, and the **`companyId`** value | The token endpoint is tenant-specific and is not published on the public developer portal (§2.2.2). `companyId` is customer data |
| **SAP S/4HANA** | The API host from the tenant's **Communication Arrangement**, a **communication user** (basic) or an OAuth client, and **which OData version each service is** (V2 → `d.results`, V4 → `value`) | The V2/V4 answer changes `response_root` per object and cannot be guessed (§2.3.2) |
| **Oracle Fusion** | The pod host, an OAuth client or service account, and the **real resource names** for the objects wanted | Two of the six seeded names are invented (§2.4) |
| **NetSuite** | Account ID, an integration record, **a generated RSA key pair with the public certificate uploaded to NetSuite** | The private key is the credential. **Blocked on §4.3 regardless** — ServiceNow cannot currently sign the assertion through this connector |
| **D365 F&O** | Environment URL, an Entra ID app registration (client ID + secret), and confirmation of whether **`cross-company=true`** is wanted | Getting this wrong silently reports one legal entity as the whole estate (§2.6) |

---

# 4. Connector changes required

Everything below is a change to files that **exist and are deployed**. L2-D6 governs: *"a diff
against the sibling source is a defect unless it appears in §4 of `docs/l2-connector-design.md`."*
**Each item here is a request to add a fifth, sixth, … permitted change to that document — it is
not permission to make one.** None of these are needed for a `generic_rest`, `generic_odata`,
Oracle Fusion or D365 profile, which all fit unchanged.

## 4.1 `nextUrlFrom()` — recognise `nextRecordsUrl`, and resolve a relative next-link

**File**: `src/server/sync/engine.ts`, lines 105–117. **Needed by**: Salesforce (multi-page).
**Not needed by**: D365, which emits an absolute same-host `@odata.nextLink` already in the list.

Two independent defects for Salesforce (§2.1.4), both of which end pagination after page 1:

1. `nextRecordsUrl` is absent from the `candidates` array.
2. `hostOf()` returns `''` for a **relative** path, so the §4.5 host check treats every relative
   next-link as off-host.

**The fix must keep §4.5 intact.** The host confinement is not a nuisance; it is what stops an
`Authorization` header travelling off-estate, and it mirrors `setFollowRedirect(false)` (I6, D21).
So: add `'nextRecordsUrl'` to `candidates`, and where a candidate value **starts with `/`**,
resolve it against `hostOf(baseUrl)` **before** the comparison. A relative path is by definition
same-host, so this widens nothing — it only stops a same-host link being misread as off-host. A
value with a scheme keeps today's behaviour exactly.

**The test this needs**, in the shape T2-13 is written in: a next-link of
`https://evil.example/x` and a next-link of `//evil.example/x` (protocol-relative — note it starts
with `/` and is **not** same-host) must **both** still be refused. The protocol-relative case is
the one a naive `charAt(0) === '/'` check gets wrong, and it is the whole reason this paragraph
exists.

**Until this ships, Salesforce runs at `pagination_style = none` with a `LIMIT` in the SOQL**, and
that ceiling is stated on the `object_map` row, not hidden.

## 4.2 A `/Date(…)/` date parser — `epoch_millis`

**File**: `src/server/connector/field-mapper.ts`, `parseDate()`, line 106.
**Needed by**: SAP S/4HANA OData V2, and any other OData V2 service (`sap_ecc`, some
`generic_odata` systems).

Today `/Date(1492098664000)/` parses to nothing and the column is left empty — safe, but silent
(§2.3.3). Add one branch at the top of `parseDate`: when `dateFormat` is the literal
`epoch_millis`, extract the digits with `/^\/Date\((-?\d+)/` and construct the `GlideDateTime`
from the numeric value. **Return `''` when the regex does not match** — the C2 rule is unchanged,
a date we cannot read stays empty and never becomes "now".

`epoch_millis` is then a legal value of the free-text `object_map.date_format` column, so **no
schema change is needed**. That is the point of `date_format` being a String rather than a Choice.

**Second-order effect worth a test**: `applyTransform`'s `date_only` branch calls `parseDate` and
splits on a space; the platform's internal format is `yyyy-MM-dd HH:mm:ss`, so this keeps working.

## 4.3 A JWT-assertion OAuth flow — **do not build this yet**

**File**: `src/server/connector/rest-client.ts`, lines 151–158. **Needed by**: NetSuite. Would
also unlock Salesforce JWT bearer and SAP SAML bearer.

The auth block is one branch per `auth_type` "and nothing else". Adding a JWT-assertion grant
means a new `auth_type` choice, a new profile reference column on `erp_system`, key material
management, and a signing step. That is a layer of work, not a change.

**Recommendation: do not build it for this project.** NetSuite is not a named customer system,
and building a signing flow that nothing exercises is exactly the speculative work the rest of
this app avoids. **Record NetSuite as "REST shape fits, auth does not" and stop.** Raised as
**OD35** so the decision is visible rather than an omission.

## 4.4 Add `salesforce` to `VENDOR_CHOICES`

**File**: `src/fluent/tables/choices.ts`, `VENDOR_CHOICES`.

```ts
salesforce: 'Salesforce',
```

An **ADD**, which the add-never-rename rule permits. It flows automatically to
`erp_system.vendor` and `map_tmpl.vendor`, which both read the same object. Nothing else changes.

**`scripts/check-contract.mjs` must be run after this edit** — it is what keeps the plain-object
choice literals honest against the contract, and this is the first vendor added since it was
written.

**Watch for the `Symbol(CallExpressionShape)` trap**: the file's own header forbids `.map()`,
`.join()`, template literals and spreads in a Fluent value. A plain `key: 'string'` line is the
only correct edit.

## 4.5 A `query_template_hint` column on `mapping_template` — **proposed, not required**

`mapping_template` has hint columns for `endpoint_path`, `response_root`, `pagination_style` and
`date_format`, but **not for `query_template`**. Three vendors in this document need a query
string that is part of the vendor profile, not part of the customer's data:

- D365 F&O: `cross-company=true` — **without it the app silently reports one legal entity**
- Unit4 `generalLedgerTransactions`: `posted=true` — without it every call returns error 1020
- SAP OData V2: `$format=json` (belt-and-braces; `Accept` already covers it)

Each is currently un-templatable, so "Apply vendor defaults" leaves the admin to know it. That is
a real gap, and it is the **only** new column this whole document asks for.

**It is still a column, so it goes through governance.** `mapping_template` is
`accessibleFrom: 'package_private'`, `audit: false`, no ACLs generated — a low-risk addition, but
D18 applies (a deleted Fluent `Table()` does not drop the table) and so does the L1 §5.3 apply
algorithm, which copies `*_hint` values **only where the target column is empty**. Adding a fifth
hint is a two-line change to that loop. Raised as **OD36**.

## 4.6 No change: `erp_system` rows stay off `map-tmpl-seeds.now.ts`

**OD19** already records that the six `erp_system` fixture rows exist only on the instance and
that a source-only deploy to a fresh instance leaves dangling references. **Do not "fix" that by
putting the Salesforce system row in source.** A source `Record()` for a Salesforce system would
put a real hostname and an OAuth profile reference into git, and the next person to add the
credential alongside it will not be stopped by anything. §3.2 step 4 creates it on the form.

## 4.7 Conflicts with existing vendor handling — there are none, and that is the finding

There is **no vendor-conditional code anywhere in `src/server/connector/` or `src/server/sync/`.**
Verified by reading `rest-client.ts`, `config-loader.ts`, `field-mapper.ts`, `erp-connector.ts`
and `engine.ts`: `vendor` is read only as a key into `mapping_template`, never branched on. I5 and
T2-16 enforce it (*"no vendor name, hostname or path in `rest-client.ts`"*).

**Every change in §4 is therefore vendor-neutral by construction**: `nextRecordsUrl` is another
candidate key, `epoch_millis` is another date format string, `salesforce` is another choice value.
**Nothing in §4 introduces a per-vendor branch, and nothing should.** The first `if (vendor === …)`
in the connector is the design failing.

---

# 5. Confidence, gaps, recommended order

## 5.1 Per vendor — verified this session vs not

| Vendor | Verified against a current source | Could NOT confirm |
|---|---|---|
| **Salesforce** | **API version `v67.0`, read live from the owner's own org.** Username-password retirement (Winter '27) and Connected App creation restrictions (Winter '26 / Spring '26). ECA flow support. Client-credentials setup path and run-as requirement. `query?q=` shape, `records` root, `nextRecordsUrl` relative path, error-array shape, 403 `REQUEST_LIMIT_EXCEEDED`, DE 5-concurrent limit. `Asset` field API names | The DE daily call limit (15,000 is widely quoted; **the source I read did not state it**). Exact scope-string set beyond `api`. Whether `CurrencyIsoCode` exists in this org. Whether `/lightning/r/Asset/<Id>` resolves without `/view`. `ProductItem` / `MaintenanceAsset` / `WorkOrder` / `Invoice` field names — **not confirmed, not seeded** |
| **Unit4 ERPx** | **The public developer portal is reachable and I read it** — contrary to the brief's expectation. Auth model (U4IDS, client credentials, `scope=u4erp`), ObjectAPI URL shape `/v1/objects/<plural>`, `select`/`filter`/`orderBy`/`limit`/`offset`/`companyId`, **bare-array response**, error object `{code, message}`, GL transaction state flags, the Enterprise Document **names** | **The token endpoint URL. The date/datetime wire format. Every single property name.** Per-object pages 404 on direct fetch and the index renders client-side. **No `field_map` is proposed for Unit4, and none should be written** |
| **SAP S/4HANA** | `/sap/opu/odata/sap/` prefix; **`API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder`** and **`API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice`**; OData V2 `d.results` vs V4 `value`; **V2 `Edm.DateTime` = `/Date(ms)/`** | The other six service names. The public-cloud API host pattern. Every field name in the eight seeded payloads |
| **Oracle Fusion** | `/fscmRestApi/resources/{version}/` base path; `items` root; `limit`/`offset` + `hasMore`; `receivablesInvoices` as a real camelCase resource | Per-field date types. Whether the 500-record ceiling reported on Cloud Customer Connect is a product limit. The real names behind `gl_summarys` / `vendor_invoices` |
| **NetSuite** | `items` root; `limit`/`offset` (default 100, max 1,000, offset cap 100,000); `links[rel=next]`; **the JWT-client-assertion token request** | Field names. Whether any simpler auth remains |
| **D365 F&O** | `/data/<Entity>`; `value` root; `@odata.nextLink`; Entra ID client credentials; **`cross-company=true`** | Per-field date formats. Entity names behind the seeded guesses |
| **Infor, Workday** | Nothing — **not researched** | Everything |

## 5.2 The gap that matters more than any of the above

**OD18 is unchanged and it dominates.** No connector call has ever executed on this instance. Every
"fits the connector" verdict in this document is a **reading of source code against a reading of
vendor documentation**. Two chains of reasoning, zero packets. The single most valuable next
action in this whole project is not another vendor profile — it is **one successful HTTP call**.

Also unchanged and relevant here: **OD23** (does the sync engine's own insert survive the 19
Shape A deny-write ACLs on `erp_staging`?). If that citation is wrong, every vendor profile in
this document stages nothing while reporting success, and no amount of correct mapping helps.
**OD23 is cheaper to test than any vendor profile is to build. Do it first.**

## 5.3 Recommended order

1. **OD23** — 15 minutes, and it can invalidate everything downstream. Not a vendor task.
2. **Salesforce**, and it is not close. It is the only vendor with a **real, reachable tenant the
   owner already controls**. It clears OD18 with live packets instead of `postman-echo.com`, and
   OD3 ("a real ERP endpoint") stops being wholly open. §3.1 is ~10 minutes of the owner's time,
   §4.4 is one line, and the `fixed_asset` profile needs **no connector change** at
   `pagination_style = none`. Everything else in this document is theory; this one can be true by
   the end of the week.
   **Caveat that must not be lost:** Salesforce is a CRM, `Asset` is not a fixed asset, and
   **OD32 must be answered before that system is set `active`.** It is a superb *test target* and
   a questionable *data source*, and those are different claims.
3. **Correct the wrong seeds (OD31)** — `unit4` (3 structural hints), `sap_s4` (2 verified paths, 6
   blanked, date format), `oracle_fusion` (2 invented resource names), `dynamics_365_fo`
   (`next_url` + `cross-company=true`). **Pure deletion and correction of things now known wrong.**
   No new capability, no risk, and it removes four traps an admin would otherwise walk into.
4. **§4.2 `epoch_millis`** — small, self-contained, and it closes the one failure mode in this
   document that produces a *wrong dashboard* rather than an *error message*.
5. **§4.1 `nextRecordsUrl`** — only once Salesforce has more than 2,000 rows, which a demo org
   will not. Write the protocol-relative test first.
6. **D365 F&O** — the best-fitting real ERP here: fits unchanged, uses `next_url` out of the box.
   Worth doing the moment a tenant exists.
7. **Unit4** — the plumbing is understood and fits; it is blocked entirely on a human supplying a
   tenant host, a token endpoint and one sample response. **One captured response body unblocks
   every field name at once.** Ask for that, not for documentation.
8. **SAP, Oracle Fusion** — real work, no tenant, no urgency.
9. **NetSuite** — REST fits, auth does not. **Do not build §4.3 speculatively** (OD35).
10. **Infor, Workday** — not started. Say so.
