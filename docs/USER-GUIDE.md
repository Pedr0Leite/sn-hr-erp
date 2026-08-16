---
title: SN HR&ERP — what you can do, and how
app: x_335329_sn_hr_erp
instance: https://dev296062.service-now.com
hub: https://dev296062.service-now.com/x_335329_sn_hr_erp_hub.do
updated: 2026-08-14
---

# Before anything else

**Nothing has ever synced.** `erp_staging`, `sync_run` and `call_log` are all 0 rows. Every tile
on the hub will read *not configured* or *failed* until you complete §3 and §4. That is correct
behaviour, not a fault — the app refuses to show a number it cannot stand behind.

**No scheduled job is armed.** All 11 ship `on_demand` + `active: false`. Nothing runs until a
human runs it. This is deliberate and should stay true.

---

# 1. Read the hub

**https://dev296062.service-now.com/x_335329_sn_hr_erp_hub.do**
Or: navigator → **SN HR&ERP → ERP Hub**.

Five tabs, reachable directly by URL:

| Tab | URL |
|---|---|
| Financial | `?tab=financial` |
| Procurement | `?tab=procurement` |
| Inventory | `?tab=inventory` |
| Fixed Assets | `?tab=assets` |
| Manufacturing | `?tab=manufacturing` |

Each tab shows **Key figures** (KPI tiles), **Trends** (charts) and **Details** (tables), plus a
state census strip at the top counting how many tiles are in each state.

## What a tile is telling you

| Chip | Meaning | What to do |
|---|---|---|
| **Live** | Fetched successfully, within the freshness threshold | Nothing |
| **Stale** | Real data, but older than `stale_after_hours`. Shows its age | Run a sync (§4) |
| **Partial** | Some systems answered, others did not. Names which | Investigate the named system |
| **Failed** | The ERP did not answer. Shows the last known figure and its age, or says there is none | Check `call_log` (§8) |
| **Not configured** | No mapping exists. **Names the map to create** | Create it (§3) |
| **Restricted** | You lack `finance_viewer`. The figure is absent from the response entirely, not hidden | Request the role (§7) |

**A `0` only ever appears with "Live"**, and only when the ERP genuinely returned zero. If you see
a number, a system answered.

## Switch theme

The control in the top-right cycles **system → dark → light**. It follows your OS by default and
remembers an explicit choice in this browser.

---

# 2. Queue a refresh

**Queue refresh** on any tab enqueues a sync for that tab's objects only.

**It does not fetch anything.** It writes a row to `sync_request`. The drainer that acts on it
(`HRERP L3 REFRESH DRAINER`) ships disarmed, so figures will not move until someone runs it (§4).
The wording on screen says "queued" and never "refreshing" — that is intentional.

If the queue write is refused, you get an error, not a false success.

---

# 3. Connect an ERP

Navigator → **SN HR&ERP**. Requires `x_335329_sn_hr_erp.admin`.

## 3.1 Create the system

**ERP Systems → New.**

| Field | Notes |
|---|---|
| `name` | Display name; appears on every tile it feeds |
| `vendor` | `sap_s4`, `unit4`, `oracle_fusion`, `netsuite`, `dynamics_365_fo`, `generic_rest`, `generic_odata` |
| `base_url` | Tenant/pod host |
| `auth_type` | `basic` or `oauth2` |
| `pagination_style` | `none`, `limit_offset`, `odata_skiptop`, … |
| `date_format` | How the ERP writes dates on the wire |
| `response_root` | Where the record array sits in the body (**empty** for a bare array) |
| `active` | Leave **false** until mappings are verified |

`docs/vendor-integration-research.md` has verified profiles per vendor, and §3.3 there lists what
you must obtain from the ERP administrator.

## 3.2 Map the objects

**Object Mappings → New.** One row per logical object (`invoice`, `stock_item`, `fixed_asset`…),
naming the ERP endpoint that serves it.

Then **field mappings** beneath it — one row per logical field, giving its path in the ERP's
response.

> **An active object map with zero field maps refuses to dial** and reports `not_configured`.
> That is a guard, not a bug: dialling with no mapping produces rows of nulls.

## 3.3 Or apply a template

**Mapping Templates → open a vendor template → Apply.** Seeds the object and field maps with that
vendor's defaults, which you then correct.

**Do not tick `mapping_verified` by hand.** It is under a hard deny-write and is set only by the
apply action. If you can tick it and it sticks, that is a security defect — report it.

## 3.4 Check your work

**Unverified Mappings** lists every map not yet verified. Work it to empty before going live.

> **The biggest risk in this whole application.** A wrong field mapping does not fail loudly — it
> renders a confident wrong number on a tile. The `sap_s4` and `unit4` seeds currently shipped are
> known-wrong (invented service names; a date format that silently blanks every date). **Compare
> `field_map` against a real ERP response before setting `active = true`.**

---

# 4. Run a sync

All jobs live at `sysauto_script_list.do` and all ship disarmed. To run one: open it, right-click
the form header, **Execute Now**.

| Job | What it does |
|---|---|
| `HRERP L3 SCHEDULED SYNC` | Fetches every active system's mapped objects into staging |
| `HRERP L3 REFRESH DRAINER` | Drains `sync_request` — what **Queue refresh** feeds |
| `HRERP L3 RETENTION CLEANER` | Deletes staged rows past retention |
| `HRERP L6 DOCUMENT DRAINER` | Generates queued HR documents |
| `HRERP L2 GATE (temporary)` | **Run this first.** Proves the connector: one live call, one forced failure, breaker opening |

**Arming a job for production** means setting a frequency and `active: true` — a deliberate,
reviewed change. Do not leave a driver armed.

---

# 5. Generate an HR document

Navigator → **SN HR&ERP → HR Document Requests → New**.

Two types ship: **Employment verification** and **Salary certificate**.

How it works:
1. You submit a request. Requesting a document **about someone else** requires `hr_viewer` and is
   refused **at submission**, not accepted and failed later.
2. The generator runs a **pre-flight before any ERP call**: if a template placeholder has no mapped
   field, it stops, makes no call, and records why.
3. Payroll and employee profile are fetched **live** and **never stored anywhere**.
4. The document is attached to the request.

**Output is HTML, labelled HTML.** There is no PDF generator on this instance. Installing the free
*PDF Generator Utilities* store app changes that.

**A document that cannot be produced correctly is not produced at all**, and the request says why.

Supporting lists: **HR Document Types**, **HR Document Templates**, **Employee Cross-Reference**.

---

# 6. Tune thresholds and retention

`sys_properties`, all prefixed `x_335329_sn_hr_erp.`:

| Property | Default | Effect |
|---|---|---|
| `stale_after_hours` | 24 | When a figure is marked stale |
| `staging_retention_days` | 90 | How long staged rows survive |
| `sync_run_retention_days` | 730 | How long the run log survives |
| `asset_maintenance_due_days` | — | "Maintenance due" window |
| `asset_high_value_amount` | — | "High value asset" threshold |
| `asset_eol_within_days` | — | "Approaching end of life" window |

> A threshold property makes a **comparison** configurable. It does not invent a **field**. If the
> ERP never supplied the underlying value, the tile stays `not configured` whatever you set.

---

# 7. Roles

| Role | Grants |
|---|---|
| `viewer` | The hub and its non-sensitive staged data |
| `finance_viewer` | **Every monetary figure, on every tab** |
| `hr_viewer` | Employee/payroll data and requesting documents on behalf of others |
| `admin` | ERP systems, mappings, templates, properties |

**No role implies any other** — `sys_user_role_contains` is empty by design. An `hr_viewer` does
not see money; a `finance_viewer` does not see payroll. Grant both if someone needs both.

---

# 8. Diagnose a problem

| Symptom | Look at |
|---|---|
| Tile says *not configured* | **Unverified Mappings**; does the object map have field maps? |
| Tile says *failed* | `call_log` — HTTP code, duration, attempt count, breaker state |
| Everything failed at once | `call_log` for `circuit_open` — the breaker tripped |
| Figures will not move | Did anything drain the queue? All jobs are disarmed by default |
| Refresh reported queued, nothing happened | Correct. Run the drainer (§4) |
| Numbers look wrong | `field_map` against a real ERP response. This is the likeliest cause |
| Wondering what ran | `sync_run` — start, status, counts, and its reason on failure |

Application logs: `syslog_app_scope`, filtered to this scope.

---

# 9. What you cannot do

- **Approve or reject a requisition.** Write-back is deferred (D3). No such button is drawn
  anywhere — the app will not render a control it cannot honour.
- **Export to XLSX.** Out of scope (D8).
- **Get a real PDF.** See §5.
- **See a "real-time" figure.** Everything staged is as old as its last sync, and the tile says so.
- **Store payroll data.** Enforced three ways; not a setting.

---

# 10. Honest status

Every layer is deployed. **Almost nothing has executed.** No connector call has been made, no sync
has run, no layer gate and no test has been executed. The first sync will be the first time most
of this code runs at all.

`docs/DEFERRED.md` lists everything blocked or unverified. `docs/BUGS.md` lists known defects.

**Start here:** run `HRERP L2 GATE (temporary)` once (§4). It is the first real proof the connector
works, and it takes about a minute.
