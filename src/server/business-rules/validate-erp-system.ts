import { gs } from '@servicenow/glide'
import { isEmpty, isTrue } from '../util/bool.ts'

// L1-5. Config-validation business rule for erp_system.
// docs/l1-control-tower-design.md §3.3, story L1-2, tests T1-5 .. T1-8.
//
// IT VALIDATES CONTRADICTIONS. IT NEVER VALIDATES REACHABILITY.
// Story L1-2 AC6 / test T1-7: a fixture pointing at https://erp-invalid.invalid MUST save.
// L2 and L3 need a deliberately-broken system on the instance in order to prove their
// failed states. A rule that made an outbound call at save time would make that fixture
// unsavable and would also put a multi-second network round trip inside every insert.
// There is no RESTMessageV2, no sn_ws, no fetch, and no URL parsing anywhere in this file.
//
// Every Boolean read goes through isTrue(). See src/server/util/bool.ts for why.

export function validateErpSystem(current: any): void {
    var problems: string[] = []

    var authType = String(current.getValue('auth_type') || '')
    var useMid = isTrue(current.getValue('use_mid_server'))
    var midServer = current.getValue('mid_server')
    var profileBasic = current.getValue('auth_profile_basic')
    var profileOauth = current.getValue('auth_profile_oauth')

    // 1. OAuth2 tokens are minted by the instance; a MID Server call leaves the instance
    //    before that can happen. The two are mutually exclusive, not merely unusual.
    if (authType === 'oauth2' && useMid) {
        problems.push('OAuth2 cannot be combined with a MID Server. Choose one.')
    }

    // 2. Declared basic, but an OAuth profile is attached.
    if (authType === 'basic' && !isEmpty(profileOauth)) {
        problems.push('Auth profile does not match the declared auth type (basic).')
    }

    // 3. Declared oauth2, but a basic profile is attached.
    if (authType === 'oauth2' && !isEmpty(profileBasic)) {
        problems.push('Auth profile does not match the declared auth type (oauth2).')
    }

    // 4. THE BOOLEAN BRANCH. This is the one that was dead in the sibling app: with
    //    `getValue(...) === 'true'` the condition never fired, so a system could be saved
    //    claiming to use a MID Server with no MID Server selected, and every call it later
    //    made went out over the instance's own egress instead. Test T1-6 exists solely to
    //    prove this branch is alive.
    if (useMid && isEmpty(midServer)) {
        problems.push('MID Server is enabled but no MID Server is selected.')
    }

    if (problems.length === 0) {
        return
    }

    for (var i = 0; i < problems.length; i++) {
        gs.addErrorMessage(problems[i])
    }
    current.setAbortAction(true)
}
