import type { RESTResponseV2 } from '@servicenow/glide/sn_ws'

/**
 * Shared types for the L2 connector layer.
 *
 * PORTED from the sibling app (repo `sn-erp-crm-360`), src/server/connector/types.ts (D4). Changes are limited to
 * docs/l2-connector-design.md §4.1 (FieldMapEntry / ResolvedMapping, the six new
 * ObjectMapConfig fields), §4.2 (`not_configured` CallStatus) and §4.3 (resolvedMapping on
 * the result, object_map + mapping_verified on the log entry). A diff beyond §4 is a defect
 * (L2-D6).
 *
 * Kept in one file so the C1 enforcement is visible in one place: note that `CallLogEntry`
 * (below) has NO field that could hold a response body. That type signature IS the C1
 * enforcement mechanism, not documentation of it (I2).
 */

/** Result of ONE HTTP attempt. Produced by rest-client, consumed by classify. */
export interface AttemptResult {
    httpCode: number | null
    /** Platform transport message, e.g. "Read timed out". NEVER a response body. */
    transportError: string | null
    /**
     * The raw response HANDLE, not its body.
     *
     * rest-client deliberately does not call `getBody()` — the single call site for the whole
     * layer is in erp-connector.ts, which is what makes the L2-12 grep meaningful. Passing the
     * handle keeps that property while still letting the orchestrator return a body in memory.
     */
    response: RESTResponseV2 | null
    retryAfterMs: number | null
    durationMs: number
}

/**
 * §4.2 — `not_configured` is a FIRST-CLASS status, not a flavour of `failure` (L2-D1).
 *
 * At L4 a `failure` renders "ERP did not answer" and a missing map must render
 * "Not configured — create an Object Map for `stock_item`". Two different sentences; kickoff
 * §7 says the distinction is the product.
 */
export type CallStatus = 'success' | 'failure' | 'timeout' | 'circuit_open' | 'not_configured'

/** Output of classify(). */
export interface Classification {
    status: 'success' | 'failure' | 'timeout'
    retryable: boolean
    errorCode: string
}

/** One `erp_system` row, flattened. Produced by config-loader; the rest of the layer never sees a GlideRecord. */
export interface SystemConfig {
    sysId: string
    name: string
    baseUrl: string
    authType: string
    authProfileBasic: string
    authProfileOauth: string
    authProfileMutual: string
    useMidServer: boolean
    /** The MID Server NAME, not its sys_id — setMIDServer() takes a name (I8). */
    midServerName: string
    timeoutMs: number
    maxRetries: number
    backoffMs: number
    /** Epoch ms, or null when the column is empty. Empty and epoch-zero must BOTH map to null. */
    circuitOpenUntilMs: number | null
    readOnly: boolean
    active: boolean
}

/**
 * §4.1 — one `field_map` child row, flattened.
 *
 * Forced by L1-D3 / OD4: `object_map.field_map` (the sibling's JSON column) does not exist in
 * this app. Mapping rows are records in the child `field_map` table.
 */
export interface FieldMapEntry {
    logicalField: string
    sourceField: string
    /** 'none' | 'trim' | 'upper' | 'lower' | 'abs' | 'negate' | 'percent_to_ratio' | 'ratio_to_percent' | 'date_only' (L1 §4.2). */
    transform: string
    /**
     * L1 §4.4 — L6 depends on this. Read with isTrue() (I4): it is a Boolean column and this
     * is the exact shape of the defect that killed three of four branches in the sibling's
     * Phase 1 rule.
     */
    zeroIsMeaningful: boolean
}

/** One `object_map` row, flattened. */
export interface ObjectMapConfig {
    sysId: string
    /**
     * The logical object name. The COLUMN is `logical_object` in this app (L1 §4.1); this
     * property keeps the sibling's name `object` deliberately, so that nothing downstream
     * of config-loader has to change (§2.1).
     */
    object: string
    endpointPath: string
    httpMethod: string
    responseRoot: string
    queryTemplate: string
    paginationStyle: string
    pageSize: number
    dateFormat: string
    deepLinkPath: string
    /**
     * L3 ADDITION (OD7 / L5-D6). `ratio_0_1` | `percent_0_100` | '' (unset).
     * Empty is meaningful: with the three OEE components mapped and `oee` unmapped, an unset
     * scale makes the Tab 5 tile `not_configured` naming this column rather than guessing.
     */
    oeeInputScale: string
    /** §4.1 — replaces the sibling's fieldMap JSON. */
    fields: FieldMapEntry[]
    mappingSource: string
    mappingVerified: boolean
    active: boolean
}

/**
 * §4.3 — what mapping actually resolved for this call, logged per call.
 *
 * `origin` is ALWAYS 'object_map' or 'none'. There is no 'template' origin: in this app a
 * template is never resolved at call time (L1-D4 / L2-D2). "Apply vendor defaults" expands a
 * template into real `field_map` rows, so by the time the connector runs every mapping is an
 * `object_map` mapping. `mappingSource` records where those rows came from.
 */
export interface ResolvedMapping {
    objectMapSysId: string
    fieldCount: number
    origin: 'object_map' | 'none'
    /** 'manual' | 'template' | '' */
    mappingSource: string
    mappingVerified: boolean
}

/** Caller-supplied per-call parameters. */
export interface FetchParams {
    externalId?: string
    extraQuery?: string
    headers?: { [name: string]: string }
    body?: string
    /**
     * L3 ADDITION (L3-D10), additive and off by default — every existing caller is unchanged.
     *
     * `pagination_style = next_url` means the ERP hands back the URL of the next page, and
     * there is no way to express that as an extra query string. The L3 pagination loop
     * VALIDATES THE HOST AGAINST `erp_system.base_url` before passing it here (l3 §4.5), the
     * same host-confinement reasoning as the connector's `setFollowRedirect(false)` rule.
     * A next URL on another host is treated as end-of-pages and recorded — it never gets this
     * far, and it never carries the Authorization header off-estate.
     */
    absoluteUrl?: string
}

/**
 * What gets written to `x_335329_sn_hr_erp_call_log`.
 *
 * C1 ENFORCEMENT (I2): there is deliberately no `body`, `response`, `payload` or `raw` field
 * here, and there must never be one. `errorDetail` may only ever carry
 * `RESTResponseV2.getErrorMessage()` (a platform transport message) or a synthesised
 * `HTTP <code>` line. Never `getBody()`.
 */
export interface CallLogEntry {
    erpSystemSysId: string
    object: string
    startedMs: number
    durationMs: number
    status: CallStatus
    httpCode: number | null
    errorCode: string | null
    errorDetail: string | null
    rowsReturned: number | null
    /** §4.3 — the object_map row this call resolved, or '' when none did. */
    objectMapSysId: string | null
    mappingVerified: boolean
}

/** What the orchestrator returns to its caller. */
export interface ConnectorResult {
    ok: boolean
    status: CallStatus
    httpCode: number | null
    durationMs: number
    attempts: number
    rowsReturned: number | null
    /**
     * The response body, in memory only. L3 inherits the obligation not to store it, and the
     * test drivers must never log it.
     */
    body: string | null
    errorCode: string | null
    errorMessage: string | null
    callLogId: string | null
    /** §4.3. */
    resolvedMapping: ResolvedMapping
}
