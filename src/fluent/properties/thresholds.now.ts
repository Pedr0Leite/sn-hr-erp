import { Property } from '@servicenow/sdk/core'
import { admin, viewer } from '../security/roles.now'

// L0 §7 / D5. Every unquantified threshold in the spec is a sys_property with a published
// default, read by the L4 API and echoed into the tile payload so the number on screen is
// attributable and changeable without a redeploy.
//
// F1 / L0-D5: declared via Property() + Now.ID. No hand-written sys_id appears anywhere.
// The kickoff §9 "create it in the browser and paste the sys_id" workaround is deliberately
// NOT designed in -- it is the practice now-id-guide names as the cause of the original trap.
//
// read: viewer / write: admin on all six -- a viewer must be able to read the threshold
// because the tile renders the threshold it actually used (D5).

Property({
    $id: Now.ID['prop-stale-after-hours'],
    name: 'x_335329_sn_hr_erp.stale_after_hours',
    type: 'integer',
    value: 24,
    description: 'Hours after which a staged figure is rendered as stale (spec §7 four-state rule).',
    roles: { read: [viewer], write: [admin] },
})

Property({
    $id: Now.ID['prop-asset-maintenance-due-days'],
    name: 'x_335329_sn_hr_erp.asset_maintenance_due_days',
    type: 'integer',
    value: 30,
    description: 'Days ahead within which an asset counts as due for maintenance (Tab 4).',
    roles: { read: [viewer], write: [admin] },
})

Property({
    $id: Now.ID['prop-asset-high-value-amount'],
    name: 'x_335329_sn_hr_erp.asset_high_value_amount',
    type: 'integer',
    value: 50000,
    description: 'Amount at or above which a capital asset counts as high value (Tab 4).',
    roles: { read: [viewer], write: [admin] },
})

Property({
    $id: Now.ID['prop-asset-eol-within-days'],
    name: 'x_335329_sn_hr_erp.asset_eol_within_days',
    type: 'integer',
    value: 180,
    description: 'Days ahead within which an asset counts as nearing end-of-life (Tab 4).',
    roles: { read: [viewer], write: [admin] },
})

Property({
    $id: Now.ID['prop-staging-retention-days'],
    name: 'x_335329_sn_hr_erp.staging_retention_days',
    type: 'integer',
    value: 90,
    description:
        'Days staged ERP data is retained before the L3 RetentionCleaner removes it (OD1, governance-approved).',
    roles: { read: [viewer], write: [admin] },
})

Property({
    $id: Now.ID['prop-sync-run-retention-days'],
    name: 'x_335329_sn_hr_erp.sync_run_retention_days',
    type: 'integer',
    value: 730,
    description:
        'Days sync_run audit rows are retained. Deliberately outlives the data it describes (OD1).',
    roles: { read: [viewer], write: [admin] },
})
