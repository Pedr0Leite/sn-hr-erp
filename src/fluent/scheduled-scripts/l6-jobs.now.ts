import { ScheduledScript } from '@servicenow/sdk/core'
import { drainDocumentQueue } from '../../server/hr/assemble'

// L6-13. THE DOCUMENT DRAINER, AND IT SHIPS DISARMED.
//
// `frequency: 'on_demand'` + `active: false`, the standing zero-armed-jobs constraint. An
// on_demand job has no interval to fire on even if `active` is flipped by accident, so arming
// it for production means changing BOTH fields in source -- a change with a diff.
//
// AND NOTE: `installMethod: 'demo'` records ignore a redeploy for their `active` field.
// Flipping `active` here does NOT change an already-installed instance. T6-26 is therefore
// checked by QUERYING sysauto_script AFTER the final deploy, never by reading this file.
//
// L6-D2 -- generation is asynchronous. A live payroll call inside the submit transaction means
// a slow ERP holds a user-facing transaction near the 300 s quota. The requester sees `pending`
// briefly, which is honest: the document genuinely does not exist yet.

export const l6DocumentDrainer = ScheduledScript({
    $id: Now.ID['l6-document-drainer'],
    $meta: { installMethod: 'demo' },
    name: 'HRERP L6 DOCUMENT DRAINER',
    script: drainDocumentQueue,
    frequency: 'on_demand',
    active: false,
})
