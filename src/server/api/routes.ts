import { buildTab, queueRefresh } from './hub-data.ts'

/**
 * L4-6 / L4-8. The two route bodies. THIN BY DESIGN.
 *
 * Story L4-1's implementation note: "backed by a Script Include so no business logic lives in
 * the resource script". These functions parse, delegate and serialise. Every decision is in
 * hub-data.ts and state-resolver.ts.
 *
 * `authentication: true` on both routes is what produces the 401 story L4-3 AC5 requires. An
 * `enforceAcl` list alone does NOT: the corpus states that resource ACLs "are only checked for
 * authenticated users" (api-reference/rest-api-explorer/t_WbSvcOpRqACL.md), so an anonymous
 * caller would sail past an ACL-only configuration.
 */

/** GET /api/x_335329_sn_hr_erp/hub/data?tab=<name> */
export function getData(request: any, response: any): void {
    const tab = request && request.queryParams && request.queryParams.tab
        ? String([].concat(request.queryParams.tab)[0])
        : ''

    const result = buildTab(tab)
    response.setStatus(result.status)
    response.setBody(result.body)
}

/** POST /api/x_335329_sn_hr_erp/hub/refresh  body: { "tab": "inventory" } */
export function postRefresh(request: any, response: any): void {
    let tab = ''
    try {
        const raw = request && request.body ? request.body.dataString : ''
        const parsed = raw ? JSON.parse(String(raw)) : null
        tab = parsed && parsed.tab ? String(parsed.tab) : ''
    } catch (e) {
        // A malformed body is a client error naming the parameter, never a 500. The parse
        // message is deliberately not echoed: it quotes the request fragment.
        response.setStatus(400)
        response.setBody({ error: "Missing required parameter 'tab'." })
        return
    }

    const result = queueRefresh(tab)
    response.setStatus(result.status)
    response.setBody(result.body)
}
