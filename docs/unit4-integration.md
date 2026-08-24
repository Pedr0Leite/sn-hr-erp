---
title: Connecting SN HR&ERP to a Unit4 ERPx tenant
app: x_335329_sn_hr_erp
updated: 2026-08-17
sources: Unit4 ERP Integration Compendium (17 Aug 2026); Unit4 Developer Portal (develop.unit4rd.com), read 2026-08-16
---

# What this document is

A runbook for pointing this application at a real Unit4 ERPx tenant. Every endpoint, parameter and
limit below is taken either from the **Unit4 ERP Integration Compendium** — which documents a
*working* ServiceNow ↔ Unit4 integration (`unit4dev1`) — or from the public Unit4 Developer Portal.

**Nothing here has been executed against a tenant from this instance.** `call_log` is still 0 rows.
This is a well-evidenced plan, not a tested one. Where the two sources disagree, the disagreement
is printed rather than resolved.

---

# 1. What to obtain from Unit4 before you start

| # | Item | Why | Where it goes |
|---|---|---|---|
| 1 | **API base URL** for your tenant | Per-tenant, per-region | `erp_system.base_url` |
| 2 | **Company ID** (the ERPx `companyId`) | Mandatory on essentially every ObjectAPI call | `object_map.query_template` |
| 3 | **Service account** — username + password | The documented working integration authenticates this way | ServiceNow Basic Auth credential |
| 4 | Confirmation of **which environment** the account belongs to | Unit4 forbids crossing environment types (§6) | — |
| 5 | Which **Enterprise Documents** your licence exposes | Not every tenant serves every object | `object_map.endpoint_path` |

The compendium's observed base URL is `https://eu01.erpx-api.unit4rd.com` — region prefix
(`eu01`), then `.erpx-api.`, then the environment domain. `unit4rd.com` is the non-production
domain; Unit4's own connectivity guidance tells customers to allow **`unit4cloud.com` and
subdomains**, so expect production to differ. **Ask, do not infer.**

---

# 2. Create the ERP system

**SN HR&ERP → ERP Systems → New.**

| Field | Value | Note |
|---|---|---|
| `name` | e.g. `Unit4 ERPx — EU01 acceptance` | Appears on every tile it feeds. Put the environment in the name |
| `vendor` | `unit4` | |
| `base_url` | `https://<region>.erpx-api.<domain>` | No trailing slash, no path |
| `auth_type` | `basic` | See the auth note below |
| `auth_profile_basic` | your Basic Auth credential record | |
| `use_mid_server` | `false` | Cloud-to-cloud. The compendium states no MID Server is used for the REST path |
| `timeout_ms` | `30000` | Unit4's API gateway allows up to 240 s, but a 30 s client timeout is the right default — see §5 |
| `max_retries` | `2` | |
| `backoff_ms` | `500` | |
| `read_only` | `true` | This application only ever reads. Leave it on |
| `active` | **`false`** | Turn it on after §4 |

## The auth disagreement, printed rather than resolved

- The **Unit4 Developer Portal** documents machine-to-machine access as **OAuth 2.0 client
  credentials** against Unit4 Identity Services (U4IDS), `scope=u4erp`, returning a
  tenant-scoped JWT.
- The **compendium** records the actually-deployed ServiceNow integration using
  **"Password (2-Way) through Connection Alias"** — a ServiceNow Basic Auth credential — for the
  employee REST calls.

Both `auth_type` values exist in this application, so either is configurable. **Start with what
your Unit4 contact tells you their tenant accepts**, and prefer OAuth 2.0 if both are offered.
A working integration using basic auth is evidence that basic works somewhere, not that it is
the intended long-term path.

---

# 3. Create the object maps

**SN HR&ERP → Object Mappings → New**, one per logical object.

Every Unit4 map takes the same structural values:

| Field | Value |
|---|---|
| `http_method` | `get` |
| `response_root` | **empty** — the ObjectAPI body *is* the array |
| `pagination_style` | `offset` — emits `offset=N&limit=M`, which is exactly what Unit4 documents |
| `page_size` | `100` |
| `date_format` | **empty** — see §7 |
| `query_template` | at minimum `companyId=<your company>` |

Endpoints, verified on the Unit4 Developer Portal:

| Logical object | `endpoint_path` | `query_template` |
|---|---|---|
| `invoice` | `/v1/objects/customer-invoices` | `companyId=<company>` |
| `vendor_invoice` | `/v1/objects/supplier-invoices` | `companyId=<company>` |
| `gl_summary` | `/v1/objects/general-ledger-transactions` | **`posted=true&companyId=<company>`** |
| `fixed_asset` | `/v1/objects/asset-objects` | `companyId=<company>` |
| `balance` | *no verified endpoint* | — |

> **`general-ledger-transactions` fails without a state flag.** It requires at least one of
> `registered=true` / `posted=true` / `historical=true` and returns **HTTP 400, error 1020**
> without one. This is not optional and the application cannot supply it for you: put it in
> `query_template`.

Applying the `unit4` **Mapping Template** fills the structural fields for the first three. It
deliberately ships **no field mappings** — see §4.

Object names are **kebab-case plural**: `supplier-invoices`, not `supplierInvoices`. Your tenant's
full catalogue is on the Unit4 Developer Portal under `Accounting`, `Procurement`,
`Inventory management` and `Personnel`.

---

# 4. Map the fields — and why none are shipped

**No `field_map` rows ship for Unit4.** Not one Unit4 property name is reachable in public
documentation; the schema is per-tenant and comes back only from an authenticated call. A guessed
mapping does not fail loudly — it renders a confident wrong number (OD37).

## Read your tenant's actual schema first

The ObjectAPI returns its own schema when you ask for one. Send the request you intend to send,
but with a schema `Accept` header:

```
GET  {base_url}/v1/objects/customer-invoices?companyId=<company>&limit=1
Accept: application/schema+json
```

`select=*` includes all properties and nested structures; `select=*.*` also expands
`CustomFields`, `ContactPoints` and `RelatedValues`. Map from that, not from this document.

## The three path syntaxes `source_field` accepts

Unit4 nests, and it does not nest the way the other vendors do. `field_map.source_field`
understands all three of these:

| Syntax | Example | Reads |
|---|---|---|
| Flat | `customerId` | a top-level property |
| Slash **or** dot | `invoice/currencyCode` | a nested group. `invoice.currencyCode` is identical |
| Array predicate | `relatedValues[relationId=A2]/description` | the element of the `relatedValues` array whose `relationId` is `A2`, then its `description` |

The predicate form matters: Unit4 returns coded look-ups as an **array** of
`{relationId, relatedValue, description}`, and the useful element is picked by key, never by
index. `relatedValue` is the code, `description` is the label — so a currency is typically
`relatedValues[relationId=A2]/relatedValue` for `EUR` and
`relatedValues[relationId=A2]/description` for `Euro`.

A predicate that matches nothing resolves to **absent**, never to `0` and never to an empty
string that a tile could count.

> **`relationId` values are tenant configuration.** `A2` for currency and `X750` for bonus type
> come from the documented `unit4dev1` implementation. They are not guaranteed to mean the same
> thing in your tenant. Confirm each one before you tick `active`.

---

# 5. Limits, timeouts and rate handling

| Limit | Value | What this application does |
|---|---|---|
| HTTP requests / minute | **500 per environment** (non-ERPx tiers; ACPT03-11 share 1,500) | `page_size` and `max_retries` are the levers. Do not run several syncs concurrently against one tenant |
| Inbound/outbound size | 350 MB / minute | |
| ERPx public API gateway timeout | **240 s** | `timeout_ms` defaults to 30 s. Raise it only for an object you have measured |
| ERPx web request timeout | 110 s | Not on this path |
| Over-limit response | **HTTP 429 + `Retry-After`**, then connection close, then TCP termination | Already handled: the connector classifies 429 as retryable and **honours `Retry-After`** (D15), clamped to its maximum sleep. The circuit breaker opens on repeated failure |
| TLS | **1.2 minimum**, HTTPS on 443 | Platform-level |

Unit4's own recommended handling — monitoring, batching, caching, throttling, exponential backoff,
honouring `Retry-After` — is what the connector already implements. `call_log` carries the
per-attempt telemetry to prove it once anything runs.

---

# 6. Environment rules

Unit4 states plainly: **PROD talks to PROD, non-production talks to matching non-production
types, and non-production ↔ production is not supported or allowed.**

This application has no field that enforces it. Put the environment in `erp_system.name` and
keep one `erp_system` row per Unit4 environment. A single row edited to swing between
environments is how a test acceptance tenant ends up feeding a production tile.

---

# 7. Dates

Unit4 does **not** document its date/datetime wire format on any page reached. `date_format` is
therefore left **empty**, which lets the platform's own ISO-8601 parsing take the value.

Confirm this against a real response before trusting any date-derived tile. A date that fails to
parse leaves the column empty, an empty column reads as absent, and a "due within N days" tile
then reads `0` — meaning *no date was readable*, not *nothing is due*. That is the one failure
mode in this application that looks like an answer. See `CLAUDE.md` trap 13.

---

# 8. HR documents — employee and payroll

L6 generates employment verification letters and salary certificates. Those two objects are
**live-only and never staged** (D2): they are fetched at generation time and written nowhere.

The compendium documents the working employee read:

```
GET {base_url}/objects/employees
      ?companyId={companyId}
      &filter=personId eq {employeeId}
      &select={comma-separated property paths}
```

Note two things. The `filter` is **OData syntax** — `personId eq {id}`. And this path is written
`objects/employees` in the source, without the `/v1` the ObjectAPI reference shows; confirm which
your tenant serves.

Configure it as an `object_map` with `logical_object = employee_profile`, and a second with
`payroll_record`. Both are excluded from staging by the L3 guard, so there is nothing to switch
off.

Logical fields to map:

| `employee_profile` | `payroll_record` |
|---|---|
| `employee_id`, `employee_full_name`, `department`, `job_title`, `employment_start_date`, `employment_status`, `erp_id` | `employee_id`, `annual_gross_salary`, `salary_currency`, `pay_period`, `effective_on`, `erp_id` |

## A worked example — and a warning about it

The documented `unit4dev1` mapping looks like this:

```json
{
  "full_name_fx":      "customFieldGroups/hrna0102/full_name_fx",
  "id_type_fx":        "customFieldGroups/cia00hr07/id_type_fx",
  "id_number_fx":      "customFieldGroups/cia00hr07/id_number_fx",
  "contract_type_fx":  "customFieldGroups/hrc0100/contract_type_fx",
  "bonus_type":        "relatedValues[relationId=X750]/description",
  "currency":          "relatedValues[relationId=A2]/description",
  "currency_iso3_code":"relatedValues[relationId=A2]/relatedValue"
}
```

Every one of those paths now resolves correctly through `source_field` (§4).

> **`hrna0102`, `cia00hr07`, `hrc0100` are custom field group IDs belonging to that tenant.**
> They are not a Unit4 standard, and the compendium itself records that country-specific builders
> use different groups — `hrc0116` for Belgium, `hrc0100` for others. **This is a worked example
> of the syntax, not a mapping to copy.** Copying it is precisely the mistake OD37 exists to
> prevent: it would produce a salary certificate populated from the wrong field, or from nothing,
> with no error anywhere.
>
> This is why the shipped Unit4 template contains no field rows and why these two objects are
> never templated at all.

L6 runs a **pre-flight before any ERP call**: if a template placeholder has no mapped field, it
stops, makes no call, and records why. An unmapped salary certificate is not generated — it is
refused with a reason.

---

# 9. What this application does not do with Unit4

The compendium describes a much larger integration surface. Deliberately out of scope here:

| In the compendium | Status here |
|---|---|
| Employee **PATCH** (`application/json-patch+json`) | **Not built.** This application is read-only (`erp_system.read_only`), and write-back is deferred by D3 |
| Contract/rates **SOAP** `AddFlexiFieldRows` | **Not built.** The connector speaks REST only. A SOAP path would also need a MID Server per ServiceNow's framework guidance |
| Sending generated documents **to** Unit4 | **Not built.** L6 attaches the document to the ServiceNow request |
| Inbound Scripted REST APIs (`/api/u4bsh/…`) | Different application. Not this one |
| ERPx Discovery / tracking endpoints | Operational tooling, not ERP data |

---

# 10. Order of work

1. Obtain §1. Create the `erp_system` row with `active = false`.
2. Create **one** object map — `vendor_invoice` is the simplest — and one field map for
   `erp_id` alone.
3. Run `HRERP L2 GATE (temporary)` once. Read `call_log`: HTTP code, duration, attempts, breaker
   state. **This is the first proof anything works.**
4. Pull the schema (§4) and complete that object's field maps against it.
5. Set `active = true` on that object map only. Run `HRERP L3 SCHEDULED SYNC`. Read `sync_run`.
6. Compare the tile against the same figure in Unit4's own UI. Only then tick `mapping_verified`.
7. Repeat per object.

Do not shortcut step 6. A wrong field mapping is the one failure in this application that
produces a number instead of an error.
