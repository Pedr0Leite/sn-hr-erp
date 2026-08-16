import { Table, StringColumn, ChoiceColumn, IntegerColumn, ReferenceColumn, DateTimeColumn } from '@servicenow/sdk/core'
import { CATEGORY_CHOICES, STAGED_OBJECT_CHOICES } from './choices'

// L3-1. sync_run -- THE AUDIT SPINE. docs/l3-staging-design.md §2.
//
// BUILT BEFORE erp_staging AND THAT ORDER IS THE DESIGN. Zero staged rows is three different
// sentences -- "the ERP returned nothing", "the ERP did not answer", "nothing was ever
// configured" -- and only the latest run for a (system x object) tells them apart. A staging
// table with a fetched_at and no run table cannot distinguish them, which is the one failure
// mode this whole app exists to prevent (kickoff §7).
//
// ONE ROW PER (system x object) PER EXECUTION (stories.md assumption 4).
//
// rows_fetched IS LEFT EMPTY, NOT 0, ON ANY NON-SUCCESS PATH (story L3-2 AC3b). `0` means the
// ERP said zero; empty means we do not know. The engine never calls setValue('rows_fetched', 0)
// off the success path -- see src/server/sync/engine.ts.
//
// audit: false / textIndex: false -- volume tuning, matching call_log. Deliberate, not a default
// to "improve". The variable name equals the table name (TS213).

export const x_335329_sn_hr_erp_sync_run = Table({
    name: 'x_335329_sn_hr_erp_sync_run',
    label: 'ERP Sync Run',
    display: 'started',
    audit: false,
    textIndex: false,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        erp_system: ReferenceColumn({
            label: 'ERP System',
            referenceTable: 'x_335329_sn_hr_erp_erp_system',
            mandatory: true,
            // Keep the history even if the system row is later removed, and never
            // cascade-delete an audit trail.
            cascadeRule: 'none',
        }),
        logical_object: ChoiceColumn({
            label: 'Logical object',
            mandatory: true,
            dropdown: 'none',
            choices: STAGED_OBJECT_CHOICES,
        }),
        // Denormalised from the object contract so L4 filters one tab's runs in ONE query
        // (l4 §7.1 query 3) instead of one per object.
        erp_category: ChoiceColumn({
            label: 'ERP category',
            dropdown: 'none',
            choices: CATEGORY_CHOICES,
        }),
        started: DateTimeColumn({ label: 'Started', mandatory: true }),
        finished: DateTimeColumn({ label: 'Finished', hint: 'Empty while the run is in flight.' }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            dropdown: 'none',
            // EXACTLY FOUR (story L3-2 AC2). There is no `queued` and no `running`: a run in
            // flight is a row with an empty `finished`, and adding a fifth value here would
            // give L4's state resolver a case kickoff §7 does not define a sentence for.
            choices: {
                success: { label: 'Success', sequence: 100 },
                partial: { label: 'Partial', sequence: 200 },
                failed: { label: 'Failed', sequence: 300 },
                not_configured: { label: 'Not Configured', sequence: 400 },
            },
        }),
        rows_fetched: IntegerColumn({
            label: 'Rows fetched',
            hint: 'EMPTY, NOT ZERO, on any non-success run. Zero means the ERP returned zero rows.',
        }),
        rows_upserted: IntegerColumn({ label: 'Rows upserted' }),
        rows_deleted: IntegerColumn({ label: 'Rows deleted' }),
        http_status: IntegerColumn({ label: 'HTTP status' }),
        error_message: StringColumn({
            label: 'Error message',
            maxLength: 1000,
            // FIELD-READ admin ONLY (L0 §5.4, l3 §2). It can name a host or an endpoint.
            // The viewer sees `status`, never this. T3-3.
            hint: 'Admin-only field read. Status line only -- never a response body (C1).',
        }),
        duration_ms: IntegerColumn({ label: 'Duration (ms)' }),
        call_log: ReferenceColumn({
            label: 'Call log',
            referenceTable: 'x_335329_sn_hr_erp_call_log',
            cascadeRule: 'none',
            hint: 'The last attempt this run made.',
        }),
        object_map: ReferenceColumn({
            label: 'Object mapping',
            referenceTable: 'x_335329_sn_hr_erp_object_map',
            cascadeRule: 'none',
            hint: 'Which mapping produced these rows.',
        }),
        pages_fetched: IntegerColumn({
            label: 'Pages fetched',
            hint: 'On a `partial` run, error_message names the page that failed.',
        }),
    },
    index: [
        // The state resolver's query: latest run per (system x object).
        { name: 'idx_sync_run_sys_obj_started', unique: false, element: ['erp_system', 'logical_object', 'started'] },
        { name: 'idx_sync_run_status_started', unique: false, element: ['status', 'started'] },
        // One tab's runs in one query.
        { name: 'idx_sync_run_cat_started', unique: false, element: ['erp_category', 'started'] },
    ],
})
