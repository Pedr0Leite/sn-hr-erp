/**
 * L5-4. The ONLY origin this client talks to is this instance, and the only API is
 * `/api/x_335329_sn_hr_erp/hub`. No CDN, ever (story L5-1 AC5).
 *
 * ONE FAT `GET /data` PER TAB. There is deliberately no per-tile fetch and no way to express
 * one: a tab that needs two calls fails story L4-1 AC1 / T5-1.
 */

import { TabPayload } from './types'

const BASE = '/api/x_335329_sn_hr_erp/hub'

function token(): string {
    const w = window as unknown as { g_ck?: string }
    return w.g_ck || ''
}

async function call(path: string, init?: RequestInit): Promise<any> {
    const response = await fetch(BASE + path, {
        ...(init || {}),
        headers: {
            Accept: 'application/json',
            'X-UserToken': token(),
            ...((init && init.headers) || {}),
        },
    })
    const wrapped = await response.json().catch(() => null)
    // A Scripted REST API wraps EVERY body in `{"result": …}`, error responses included:
    // `setStatus` + `setBody` still wraps, and only `sn_ws_err` produces an unwrapped shape.
    // Unwrap before either branch reads it, or the API's own 400 sentence — which names the bad
    // tab or the missing parameter — is discarded in favour of a generic status-code message.
    const parsed = wrapped && typeof wrapped === 'object' && 'result' in wrapped ? wrapped.result : wrapped
    if (!response.ok) {
        // The API's own sentence is preferred over an invented one: it names the tab or the
        // parameter, which is what the reader needs. 401 is stated as a session problem
        // because `authentication: true` is what produces it.
        const stated = parsed && parsed.error ? String(parsed.error) : ''
        if (response.status === 401) {
            throw new Error('Your session is not authenticated. Sign in and reload.')
        }
        throw new Error(stated || 'The hub API returned HTTP ' + response.status + '.')
    }
    return parsed
}

/** One tab, one call. */
export function getTab(tab: string): Promise<TabPayload> {
    return call('/data?tab=' + encodeURIComponent(tab))
}

export interface RefreshResult {
    queued: boolean
    objects: string[]
    systems: number
}

/**
 * T16 -- `POST /refresh` ENQUEUES. Nothing drains it while the drainer ships `on_demand` +
 * `active: false`, so the caller must say "queued" and never "refreshing" or "refreshed".
 * The wording lives in the component, and the honesty of it is the deliverable.
 */
export function postRefresh(tab: string): Promise<RefreshResult> {
    return call('/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab: tab }),
    })
}
