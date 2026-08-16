import { gs } from '@servicenow/glide'
import { fetch } from './erp-connector.ts'
import { nowMs } from './util.ts'

/**
 * Connector test harness (§2 module inventory).
 *
 * Demo-only, default-INACTIVE, `on_demand`. It reads its target from system properties so an
 * operator can point it at any system/object pair without a code change -- which is itself a
 * small proof of the "second ERP = zero code" bar.
 *
 * WHY A SCHEDULED SCRIPT AND NOT SOMETHING MORE CONVENIENT: the Script Include facade is
 * `package_private` (L2-D4), so a Global background script cannot call it. The rejected
 * alternatives were (a) making the Script Include `public`, which permanently widens the
 * connector's access surface just to make testing convenient, and (b) a Scripted REST API,
 * which ships an authenticated endpoint this layer does not need.
 *
 * IT MUST NEVER LOG `result.body`. This is the single most likely place in the whole app for a
 * payload to reach a log, which would breach C1 just as surely as persisting it would. The
 * field list below is deliberate and exhaustive: `body` is named and reduced to its LENGTH, not
 * forgotten. Do not "helpfully" log the result object directly.
 */

const P_SYSTEM = 'x_335329_sn_hr_erp.harness.erp_system'
const P_OBJECT = 'x_335329_sn_hr_erp.harness.object'
const P_EXTERNAL_ID = 'x_335329_sn_hr_erp.harness.external_id'

export function runHarness(): void {
    const erpSystemSysId = gs.getProperty(P_SYSTEM, '') || ''
    const object = gs.getProperty(P_OBJECT, 'invoice') || 'invoice'
    const externalId = gs.getProperty(P_EXTERNAL_ID, '') || ''

    if (!erpSystemSysId) {
        gs.error('[HRERP-L2-HARNESS] Property ' + P_SYSTEM + ' is not set -- nothing to call.')
        return
    }

    gs.info('[HRERP-L2-HARNESS] ---- BEGIN system=' + erpSystemSysId + ' object=' + object + ' ----')

    const t0 = nowMs()
    const result = fetch(erpSystemSysId, object, externalId ? { externalId: externalId } : {})
    const totalElapsed = nowMs() - t0

    gs.info(
        '[HRERP-L2-HARNESS] ok=' +
            result.ok +
            ' status=' +
            result.status +
            ' httpCode=' +
            result.httpCode +
            ' attempts=' +
            result.attempts +
            ' rowsReturned=' +
            result.rowsReturned +
            ' durationMs=' +
            result.durationMs +
            ' errorCode=' +
            (result.errorCode || '(none)') +
            ' errorMessage=' +
            (result.errorMessage || '(none)') +
            ' callLogId=' +
            (result.callLogId || '(none)') +
            ' mapping=' +
            result.resolvedMapping.origin +
            '/' +
            result.resolvedMapping.fieldCount +
            ' fields, source=' +
            (result.resolvedMapping.mappingSource || '(none)') +
            ', verified=' +
            result.resolvedMapping.mappingVerified +
            ' bodyLength=' +
            (result.body === null || result.body === undefined ? 'null' : String(result.body.length)) +
            ' totalElapsedMs=' +
            totalElapsed,
    )

    gs.info('[HRERP-L2-HARNESS] ---- END ----')
}
