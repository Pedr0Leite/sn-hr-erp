import { Table, ChoiceColumn, BooleanColumn, DateTimeColumn } from '@servicenow/sdk/core'
import { CATEGORY_CHOICES } from './choices'

// L3-13 support. The refresh queue. docs/l3-staging-design.md §4.6 / docs/l4-api-design.md §8.
//
// L3-D9, and it is an addition the designs imply but do not name. §4.6 says "the L4 API
// enqueues; a ScheduledScript with frequency: 'on_demand' drains the queue" and never says
// what the queue IS. It cannot be erp_staging (no create ACL, by design), it cannot be a fifth
// sync_run status (story L3-2 AC2 fixes that list at exactly four), and it cannot be a
// sys_property (write is admin-only, and a viewer must be able to press Refresh). So: the
// smallest possible table, two meaningful columns.
//
// CREATE IS GRANTED TO viewer AND THAT IS THE POINT -- the same reasoning as call_log's create
// ACL (L2-4). The REST route runs in the caller's real session; if create were admin-only,
// every viewer-pressed Refresh would silently enqueue nothing.
//
// THE QUEUE HOLDS A CATEGORY, NEVER "everything". There is no way to express a fan-out
// (story L3-3 AC6). That guard is the column list, not a condition someone can relax.

export const x_335329_sn_hr_erp_sync_request = Table({
    name: 'x_335329_sn_hr_erp_sync_request',
    label: 'ERP Sync Request',
    display: 'erp_category',
    audit: false,
    textIndex: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        erp_category: ChoiceColumn({
            label: 'ERP category',
            mandatory: true,
            dropdown: 'none',
            choices: CATEGORY_CHOICES,
        }),
        requested_at: DateTimeColumn({ label: 'Requested at', mandatory: true }),
        drained: BooleanColumn({
            label: 'Drained',
            default: false,
            hint: 'Set by the drainer after the sync completes. Read with isTrue(): getValue() returns \'1\'/\'0\' here, not \'true\'/\'false\' (kickoff §9).',
        }),
    },
    index: [{ name: 'idx_sync_request_drained', unique: false, element: ['drained', 'requested_at'] }],
})
