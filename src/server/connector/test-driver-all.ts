import { runDriverA } from './test-driver-a.ts'
import { runDriverB } from './test-driver-b.ts'
import { runDriverL2 } from './test-driver-l2.ts'

/**
 * Runs the admin-context test plan IN ORDER, in one job.
 *
 * Order is not cosmetic. Driver A's cases are single-call cases that must NOT run against a
 * tripped breaker; driver B deliberately trips it; the L2 driver ends with the gate sequence and
 * needs a clean starting state. Running them as three independently-scheduled jobs would let
 * them overlap on the same fixture rows and fail for the wrong reason.
 *
 * The viewer cases (T30/T31/T2-14) are deliberately NOT here -- they need `runAs` set to
 * `hrerp_viewer_only`, so they live in their own scheduled job.
 */
export function runAllAdminTests(): void {
    runDriverA()
    runDriverB()
    runDriverL2()
}
