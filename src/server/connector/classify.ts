import { CONNECTOR_CONSTANTS } from './constants.ts'
import type { AttemptResult, Classification } from './types.ts'

/**
 * Is this failure worth retrying? (design §4.3)
 *
 * | Condition                                  | status  | retryable | errorCode   |
 * |--------------------------------------------|---------|-----------|-------------|
 * | HTTP 200-299                               | success | -         | -           |
 * | Transport error matching /tim(e|ed) ?out/i | timeout | yes       | TIMEOUT     |
 * | Any other transport error                  | failure | yes       | TRANSPORT   |
 * | HTTP 408,425,429,500,502,503,504           | failure | yes       | HTTP_<code> |
 * | Any other 4xx                              | failure | no        | HTTP_<code> |
 * | 3xx (redirect not followed, D21)           | failure | no        | HTTP_<code> |
 * | Any other 5xx (501, 505, 507, ...)         | failure | no        | HTTP_<code> |
 *
 * 4xx is NEVER retried: a 400/401/403/404 is a configuration or request defect — wrong
 * endpoint_path, wrong auth profile, non-existent external_id. Retrying fixes none of them and,
 * on a rate-limited ERP, turns one bad request into max_retries + 1. 429 is the exception.
 */

/** The only thing that yields status `timeout`. Matches "timeout", "timed out", "time out". */
const TIMEOUT_PATTERN = /tim(e|ed)\s?out/i

export function classify(attempt: AttemptResult): Classification {
    const code = attempt.httpCode
    const transportMsg = attempt.transportError || ''

    // A REAL HTTP STATUS CODE ALWAYS WINS OVER THE TRANSPORT MESSAGE.
    //
    // This ordering is load-bearing and was corrected after live testing. `RESTMessageV2` sets
    // haveError() true and getErrorMessage() to "Method failed: (/status/404) with code: 404"
    // for ordinary 4xx/5xx RESPONSES — not just for transport failures. An earlier revision of
    // this function checked the transport message first, which classified EVERY 4xx and 5xx as
    // `TRANSPORT` + retryable. That is a direct D14 breach: 404/401/403 were being retried
    // max_retries + 1 times, and it was invisible to the build and to the 503 test (which passes
    // either way). T17 caught it live. Do not reorder these branches.
    if (code !== null && code !== undefined && code > 0) {
        if (code >= 200 && code <= 299) {
            return { status: 'success', retryable: false, errorCode: '' }
        }

        // An allow-list, NOT `code >= 500`. See CONNECTOR_CONSTANTS.RETRYABLE_STATUS and D14.
        // Widened to readonly number[] only because `as const` narrows the array to a literal
        // tuple; the allow-list semantics are unchanged.
        const retryableStatuses: readonly number[] = CONNECTOR_CONSTANTS.RETRYABLE_STATUS
        return {
            status: 'failure',
            retryable: retryableStatuses.indexOf(code) !== -1,
            errorCode: 'HTTP_' + code,
        }
    }

    // No usable status code: a genuine transport-level failure. `execute()` may EITHER throw OR
    // return a response with haveError() true, and which fires for a read timeout is not
    // reliably documented — both land here, because both leave the status code absent.
    // Observed live on dev296062: a read timeout arrives as "Socket timeout" with no code.
    if (TIMEOUT_PATTERN.test(transportMsg)) {
        return { status: 'timeout', retryable: true, errorCode: 'TIMEOUT' }
    }

    // Connection refused, DNS failure, connection reset, SSL handshake failure. All are
    // plausibly transient at the network layer, so all are retryable.
    return { status: 'failure', retryable: true, errorCode: 'TRANSPORT' }
}
