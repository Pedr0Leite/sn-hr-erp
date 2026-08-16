import { GlideDateTime } from '@servicenow/glide'
import { RESTMessageV2 } from '@servicenow/glide/sn_ws'
import type { AttemptResult, FetchParams, ObjectMapConfig, SystemConfig } from './types.ts'

/**
 * One attempt. No retry awareness, no breaker knowledge, no call_log knowledge (design §4.2).
 *
 * DESIGN BAR (§2): this file contains NO vendor name, NO hostname and NO path. Every one of
 * those comes from `erp_system` / `object_map` at call time. That is what makes "a second ERP
 * is added as data, with zero new code" true rather than aspirational.
 *
 * `getBody()` MUST NOT APPEAR IN THIS FILE. The single call site for the whole layer is in
 * erp-connector.ts. Build-order step 15 greps for it.
 */

/** Returned as `transportError` when auth_type is `mutual`. See sendOnce(). */
export const AUTH_UNSUPPORTED = 'AUTH_UNSUPPORTED'

function nowMsLocal(): number {
    return new GlideDateTime().getNumericValue()
}

/**
 * baseUrl + endpointPath joined on exactly one '/', then the query template appended.
 *
 * The finished string goes to setEndpoint(). setQueryParameter() is deliberately NOT used for
 * the template: it would re-encode an already-encoded ERP filter expression such as OData
 * `$filter=Customer eq '0001000123'`, silently corrupting the query.
 */
export function buildEndpoint(system: SystemConfig, map: ObjectMapConfig, params: FetchParams): string {
    // L3-D10. An absolute URL supplied by the caller wins, and it is ONLY ever supplied by the
    // L3 pagination loop after that loop has verified the host matches `system.baseUrl`
    // (l3 §4.5). Nothing else in the app sets it. Still no vendor name, host or path in this
    // file — the value came from the ERP's own response, validated against configuration.
    if (params.absoluteUrl) {
        return params.absoluteUrl
    }

    let base = system.baseUrl || ''
    let path = map.endpointPath || ''

    while (base.length > 0 && base.charAt(base.length - 1) === '/') {
        base = base.substring(0, base.length - 1)
    }
    if (path.length > 0 && path.charAt(0) !== '/') {
        path = '/' + path
    }

    let url = base + path

    const queryParts: string[] = []

    if (map.queryTemplate) {
        // {external_id} is the only placeholder. encodeURIComponent on the VALUE only — the
        // template around it is ERP filter syntax and must survive verbatim.
        const externalId = params.externalId === undefined || params.externalId === null ? '' : String(params.externalId)
        queryParts.push(map.queryTemplate.split('{external_id}').join(encodeURIComponent(externalId)))
    }
    if (params.extraQuery) {
        queryParts.push(params.extraQuery)
    }

    if (queryParts.length > 0) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + queryParts.join('&')
    }

    return url
}

/**
 * Parse `Retry-After`. Accepts delay-seconds or an HTTP-date; null if it does not parse.
 * Honouring it is D15 — it is the ERP telling us exactly when to come back, and ignoring it is
 * the fastest way to get rate-limit-banned. The caller clamps it to the per-sleep cap.
 */
export function parseRetryAfterMs(raw: string | null): number | null {
    if (!raw) {
        return null
    }
    const trimmed = String(raw).trim()
    if (trimmed === '') {
        return null
    }

    // delay-seconds
    if (/^\d+$/.test(trimmed)) {
        return parseInt(trimmed, 10) * 1000
    }

    // HTTP-date
    try {
        const when = Date.parse(trimmed)
        if (!isNaN(when)) {
            const delta = when - nowMsLocal()
            return delta > 0 ? delta : 0
        }
    } catch (e) {
        return null
    }
    return null
}

export function sendOnce(system: SystemConfig, map: ObjectMapConfig, params: FetchParams): AttemptResult {
    const started = nowMsLocal()

    // `mutual` is refused on EVIDENCE, not caution (D20): setMutualAuth() takes a protocol
    // profile NAME, while Phase 1's `auth_profile_mutual` is a 32-char string holding a SYS_ID
    // (sys_auth_profile_mutual does not exist on this instance — Phase 1 OD6). The two are
    // structurally incompatible, so wiring them would be guaranteed-wrong code that builds
    // clean. Mutual TLS is out of scope for Phase 2; this guard exists so a `mutual` system
    // fails loudly at the top rather than obscurely inside the platform's HTTP stack.
    //
    // Refused BEFORE the message is even constructed, so no outbound request is made — T18
    // asserts that via near-zero elapsed time.
    if (system.authType === 'mutual') {
        return {
            httpCode: null,
            transportError: AUTH_UNSUPPORTED,
            response: null,
            retryAfterMs: null,
            durationMs: nowMsLocal() - started,
        }
    }

    try {
        const msg = new RESTMessageV2()

        msg.setEndpoint(buildEndpoint(system, map, params))
        msg.setHttpMethod(map.httpMethod === 'post' ? 'post' : 'get')
        msg.setHttpTimeout(system.timeoutMs)

        // D21: a followed redirect can carry the Authorization header to a host that is not in
        // our configuration. setAllowedRedirectURIs() exists precisely because that is a real
        // leak; not following at all is simpler and loses nothing an ERP integration needs.
        // 3xx therefore becomes a non-retryable failure (classify.ts).
        msg.setFollowRedirect(false)

        // The endpoint is assembled from configuration that may legitimately contain `${...}`.
        // We declare no variables, so substitution is pure silent-corruption risk for no benefit.
        msg.disableForcedVariableSubstitution()

        msg.setRequestHeader('Accept', 'application/json')

        if (params.headers) {
            for (const name in params.headers) {
                if (Object.prototype.hasOwnProperty.call(params.headers, name)) {
                    msg.setRequestHeader(name, params.headers[name])
                }
            }
        }

        // One branch per auth_type, and nothing else. L2 does NOT re-validate that the profile
        // matches the type — Phase 1's `ERP System Config Validation` business rule already
        // guarantees any saved row is internally consistent (D28). Duplicating it here would
        // create two sources of truth that will drift.
        if (system.authType === 'basic') {
            msg.setAuthenticationProfile('basic', system.authProfileBasic)
        } else if (system.authType === 'oauth2') {
            msg.setAuthenticationProfile('oauth2', system.authProfileOauth)
        }

        // setMIDServer takes the MID Server's NAME. config-loader resolved it via
        // getDisplayValue('mid_server'); passing the sys_id would silently never route.
        //
        // NOT LIVE-TESTED: dev296062 has zero ecc_agent records (spike 0.5, confirmed). T29
        // reviews this branch structurally and is recorded REVIEWED, never PASS (OD14).
        if (system.useMidServer && system.midServerName) {
            msg.setMIDServer(system.midServerName)
        }

        if (map.httpMethod === 'post' && params.body) {
            msg.setRequestBody(params.body)
        }

        const response = msg.execute()

        // execute() may EITHER throw OR return a response with haveError() true, and which one
        // fires for a read timeout is not reliably documented — so BOTH paths are handled.
        // getErrorMessage() is a platform transport message ("Read timed out") and is safe to
        // keep. getBody() is not called here at all.
        const haveError = response.haveError()
        const errorMessage = haveError ? response.getErrorMessage() || 'transport error' : null

        let httpCode: number | null = null
        try {
            const code = response.getStatusCode()
            httpCode = code && code > 0 ? code : null
        } catch (e) {
            httpCode = null
        }

        let retryAfterMs: number | null = null
        try {
            retryAfterMs = parseRetryAfterMs(response.getHeader('Retry-After'))
        } catch (e) {
            retryAfterMs = null
        }

        return {
            httpCode: httpCode,
            transportError: errorMessage,
            // The response HANDLE travels to the orchestrator, which is the only place getBody()
            // may be called. Its value is never handed to the call_log writer (C1).
            response: response,
            retryAfterMs: retryAfterMs,
            durationMs: nowMsLocal() - started,
        }
    } catch (e) {
        return {
            httpCode: null,
            transportError: e && (e as Error).message ? (e as Error).message : String(e),
            response: null,
            retryAfterMs: null,
            durationMs: nowMsLocal() - started,
        }
    }
}
