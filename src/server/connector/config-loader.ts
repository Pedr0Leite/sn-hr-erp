import { GlideDateTime, GlideRecord } from '@servicenow/glide'
import { isTrue } from './util.ts'
import type { FieldMapEntry, ObjectMapConfig, SystemConfig } from './types.ts'

/**
 * GlideRecord in, plain objects out.
 *
 * PORTED from the sibling app. Changes: the table constants (§2.1), the `object` ->
 * `logical_object` column rename (L1 §4.1), and §4.1 — `loadMap()` reads `field_map` child
 * rows and `ObjectMapConfig` gains its six extra fields. `loadSystem()` is UNCHANGED,
 * comments included.
 *
 * This is the ONLY file in the layer that may construct a GlideRecord against `erp_system`,
 * `object_map` or `field_map`. Everything downstream sees plain objects, which keeps the
 * Boolean gotcha contained to one file and makes the rest of the layer trivially reviewable.
 */

const T_ERP_SYSTEM = 'x_335329_sn_hr_erp_erp_system'
const T_OBJECT_MAP = 'x_335329_sn_hr_erp_object_map'
const T_FIELD_MAP = 'x_335329_sn_hr_erp_field_map'

/** Returned instead of a config when `base_url` comes back empty. See loadSystem(). */
export const CONFIG_UNREADABLE = 'CONFIG_UNREADABLE'

export interface LoadSystemResult {
    config: SystemConfig | null
    /** null on success; CONFIG_UNREADABLE when the row was found but its connection fields were not. */
    errorCode: string | null
}

function toInt(raw: string | null, fallback: number): number {
    const n = parseInt(String(raw || ''), 10)
    return isNaN(n) ? fallback : n
}

/**
 * Read `circuit_open_until` as epoch ms, or null.
 *
 * RULE 3: empty string and null must BOTH map to null. An empty GlideDateTime reads as an
 * epoch-zero date, which is in the past, and "populated but in the past" is how the breaker
 * encodes HALF_OPEN — so returning 0 here would make every healthy system look like it were
 * mid-probe. This is why the emptiness check is on the RAW STRING and the GlideDateTime is
 * only constructed afterwards.
 */
function readCircuitOpenUntilMs(gr: GlideRecord<typeof T_ERP_SYSTEM>): number | null {
    const raw = gr.getValue('circuit_open_until')
    if (!raw || String(raw).trim() === '') {
        return null
    }
    const ms = new GlideDateTime(raw).getNumericValue()
    return ms > 0 ? ms : null
}

export function loadSystem(erpSystemSysId: string): LoadSystemResult {
    if (!erpSystemSysId) {
        return { config: null, errorCode: null }
    }

    const gr = new GlideRecord(T_ERP_SYSTEM)
    if (!gr.get(erpSystemSysId)) {
        return { config: null, errorCode: null }
    }

    const baseUrl = gr.getValue('base_url') || ''

    const config: SystemConfig = {
        sysId: gr.getUniqueValue(),
        name: gr.getValue('name') || '',
        baseUrl: baseUrl,
        authType: gr.getValue('auth_type') || '',
        authProfileBasic: gr.getValue('auth_profile_basic') || '',
        authProfileOauth: gr.getValue('auth_profile_oauth') || '',
        authProfileMutual: gr.getValue('auth_profile_mutual') || '',

        // RULE 1: every Boolean read goes through isTrue(). getValue() returns '1'/'0' here,
        // not 'true'/'false'. See util.isTrue for the full post-mortem.
        useMidServer: isTrue(gr.getValue('use_mid_server')),
        readOnly: isTrue(gr.getValue('read_only')),
        active: isTrue(gr.getValue('active')),

        // RULE 2: setMIDServer() takes the MID Server's NAME; `mid_server` holds a reference
        // sys_id. Passing the sys_id produces a call that silently never routes — no error, no
        // MID, just a direct call from the instance. getDisplayValue resolves the name.
        midServerName: gr.getDisplayValue('mid_server') || '',

        timeoutMs: toInt(gr.getValue('timeout_ms'), 30000),
        maxRetries: toInt(gr.getValue('max_retries'), 2),
        backoffMs: toInt(gr.getValue('backoff_ms'), 500),
        circuitOpenUntilMs: readCircuitOpenUntilMs(gr),
    }

    // RULE 4: base_url must be non-empty after loading.
    //
    // This is not defensive noise. Field-level read ACLs restrict `base_url`, `auth_profile_*`
    // and `mid_server` to admin. If scoped server-side GlideRecord enforces field ACLs, a
    // viewer-invoked connector reads them as EMPTY STRINGS and would cheerfully dial "". That
    // has to be a loud, logged failure rather than a mysterious malformed-URL error from inside
    // the platform's HTTP stack.
    if (baseUrl.trim() === '') {
        return { config: config, errorCode: CONFIG_UNREADABLE }
    }

    return { config: config, errorCode: null }
}

/**
 * §4.1 — read the `field_map` child rows of one `object_map`.
 *
 * BOUNDED, not an N+1 over data: one query per (system x object), never per record. L2-D3
 * rejected caching the resolved mapping — a cached mapping is a mapping that can be stale, and
 * kickoff §9 records what a cached empty ERP response cost.
 */
function loadFields(objectMapSysId: string): FieldMapEntry[] {
    const out: FieldMapEntry[] = []
    if (!objectMapSysId) {
        return out
    }

    const gr = new GlideRecord(T_FIELD_MAP)
    gr.addQuery('object_map', objectMapSysId)
    gr.orderBy('logical_field')
    gr.query()

    while (gr.next()) {
        out.push({
            logicalField: gr.getValue('logical_field') || '',
            sourceField: gr.getValue('source_field') || '',
            transform: gr.getValue('transform') || 'none',
            // RULE 1 again, and this one is the expensive column: at L6 a wrong reading here
            // is a salary certificate with a 0 on it (R2-5).
            zeroIsMeaningful: isTrue(gr.getValue('zero_is_meaningful')),
        })
    }

    return out
}

/**
 * §4.1 — resolve one (system, logical object) pair into a flat mapping config.
 *
 * TWO queries: one on `object_map`, one on `field_map` filtered to the resolved map's sys_id.
 * The `object` argument is matched against the `logical_object` COLUMN (L1 §4.1); the returned
 * property keeps the name `object` so nothing downstream changes (§2.1).
 */
export function loadMap(erpSystemSysId: string, object: string): ObjectMapConfig | null {
    if (!erpSystemSysId || !object) {
        return null
    }

    const gr = new GlideRecord(T_OBJECT_MAP)
    gr.addQuery('erp_system', erpSystemSysId)
    gr.addQuery('logical_object', object)
    gr.setLimit(1)
    gr.query()

    if (!gr.next()) {
        return null
    }

    const sysId = gr.getUniqueValue()

    return {
        sysId: sysId,
        object: gr.getValue('logical_object') || '',
        endpointPath: gr.getValue('endpoint_path') || '',
        httpMethod: (gr.getValue('http_method') || 'get').toLowerCase(),
        responseRoot: gr.getValue('response_root') || '',
        queryTemplate: gr.getValue('query_template') || '',
        paginationStyle: gr.getValue('pagination_style') || 'none',
        pageSize: toInt(gr.getValue('page_size'), 100),
        dateFormat: gr.getValue('date_format') || '',
        deepLinkPath: gr.getValue('deep_link_path') || '',
        // L3 addition (OD7). Empty is a MEANINGFUL value here -- it is what makes the Tab 5
        // tile render not_configured naming the column rather than guessing a scale.
        oeeInputScale: gr.getValue('oee_input_scale') || '',
        fields: loadFields(sysId),
        mappingSource: gr.getValue('mapping_source') || '',
        // RULE 1 again.
        mappingVerified: isTrue(gr.getValue('mapping_verified')),
        active: isTrue(gr.getValue('active')),
    }
}
