import { gs } from '@servicenow/glide'

/**
 * L4-3. The role check, and it is ONE CALL SITE for the whole app.
 *
 * D14 RESOLVES OD11, AND IT REVERSES THE STORIES' BLANKET RULE. The stories say "every
 * security-relevant check must query `sys_user_has_role`, because gs.hasRole() lies under
 * runAs". §9's trap is narrower than that generalisation: gs.hasRole() lies UNDER `runAs` --
 * inside a scheduled job executing as an impersonated user. It is accurate in a genuine user
 * session, and a Scripted REST API executes in the caller's real session.
 *
 * QUERYING sys_user_has_role IS VERIFIED IMPOSSIBLE ON THIS INSTANCE FOR EXACTLY THE ROLES IT
 * WAS MEANT TO PROTECT. Three active read ACLs restrict that table to `role_delegator`,
 * `user_admin`, `itil`, `role_delegator_admin` and `ai_user_admin`. A plain
 * x_335329_sn_hr_erp.finance_viewer holds NONE of them, and scoped GlideRecord is
 * security-aware -- so the query returns zero rows and the check answers "this user does not
 * hold the role" ABOUT A USER WHO DOES. D6 would fail CLOSED and SILENTLY, and it would pass
 * every test run as admin, because the first of those ACLs has admin_overrides: true.
 *
 * SO: T4-19 ("grep for gs.hasRole, expect zero hits") IS OBSOLETE AND IS RECORDED AS SUPERSEDED
 * rather than quietly worked around. It was written before OD11 was verified.
 *
 * THIS IS BELT-AND-BRACES, NOT THE SECURITY BOUNDARY. The platform's own table and field ACLs
 * on this app's tables are what actually enforce access. The only thing this file decides is
 * whether a monetary tile renders a figure or renders `restricted` (D6). If it were ever wrong,
 * the ACLs still hold.
 *
 * IT MUST NEVER BE CALLED FROM A SCHEDULED JOB. The sync jobs make no role checks at all --
 * they run as system, fetch from ERPs and write staging rows, and there is no user whose
 * entitlements matter in that path. That is why the runAs caveat never reaches them.
 */

const FINANCE_VIEWER = 'x_335329_sn_hr_erp.finance_viewer'
const HR_VIEWER = 'x_335329_sn_hr_erp.hr_viewer'

/** Cached for the life of one request. One call site, one lookup. */
let cachedFinance: boolean | null = null

/**
 * D6 -- may this caller see monetary figures?
 *
 * `finance_viewer` is NEVER implied by any other role, including `hr_viewer` and including
 * `viewer` (L0-D2: all four containsRoles lists are empty and sys_user_role_contains returns
 * zero rows for this scope). T4-15 asserts an hr_viewer-only caller gets `restricted` on Tab 1.
 */
export function canSeeMoney(): boolean {
    if (cachedFinance === null) {
        cachedFinance = gs.hasRole(FINANCE_VIEWER) === true
    }
    return cachedFinance
}

/**
 * L6 ADDITION. §4.1 step 3 -- may this caller request a document ON BEHALF OF someone else?
 *
 * THE SAME SINGLE MECHANISM, AND THE SAME REASONING. docs/l6-document-design.md §4.1 says
 * "never gs.hasRole()", quoting story L6-3 AC4. That criterion predates OD11's verification and
 * is superseded by L4-D9 exactly as T4-19 was: querying sys_user_has_role on this instance
 * returns ZERO ROWS for a plain x_335329_sn_hr_erp.hr_viewer, because three active read ACLs
 * restrict that table to roles they do not hold and scoped GlideRecord is security-aware. The
 * check would fail CLOSED and SILENTLY, refusing an hr_viewer their own privilege, and it would
 * pass every test run as admin. Recorded as L6-D8 rather than quietly worked around.
 *
 * NOT CACHED, unlike canSeeMoney(): this runs inside a `before insert` rule that may fire more
 * than once per transaction on different records, and a cache keyed on nothing is a cache that
 * outlives its question.
 *
 * The runAs caveat does not reach here. This executes in the submitting user's real session --
 * a Table API POST or a record producer -- never inside a scheduled job.
 */
export function hasHrViewer(): boolean {
    return gs.hasRole(HR_VIEWER) === true
}

/** Test seam and per-request reset. The route handler calls this first. */
export function resetRoleCache(): void {
    cachedFinance = null
}
