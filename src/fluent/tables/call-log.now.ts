import { Table, StringColumn, ChoiceColumn, BooleanColumn, IntegerColumn, ReferenceColumn, DateTimeColumn } from '@servicenow/sdk/core'
import { OBJECT_CHOICES } from './choices'

// L2-3. call_log -- the connector's telemetry. docs/l2-connector-design.md §2.1, §4.2, §4.3.
// Ported from the sibling's call_log table; tuned for volume, not richness.
//
// HARD RULE (C1): this table must NEVER store a request or response body. An ERP error
// response routinely quotes an invoice total or a salary, so persisting a payload would import
// financial data through the back door. `error` is capped at 1000 characters and L2 writes a
// status line only, never response.getBody(). The CallLogEntry type in
// src/server/connector/types.ts is the primary enforcement (I2); this column list is the second.
//
// audit: false / textIndex: false are deliberate volume tuning, not defaults to "improve".
// Immutable after insert -- no app role gets write (L2-4).
//
// accessibleFrom: 'package_private' -- governance condition C1, as on all four L1 tables. The
// sibling shipped 'public'; D4 removed every cross-scope consumer.
// actions: ['read'] -- an array, not { read: true } (L0 F2).
// The variable name equals the table name -- TS213 (L0 trap T3).

export const x_335329_sn_hr_erp_call_log = Table({
    name: 'x_335329_sn_hr_erp_call_log',
    label: 'ERP Call Log',
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
            // Deliberately different from object_map / field_map: keep history even if the
            // system row is later removed, and never cascade-delete millions of rows.
            cascadeRule: 'none',
        }),
        // The column is `logical_object`, not the sibling's `object`, for consistency with
        // erp_staging and sync_run (L1 §4.1 / §2.1). config-loader and call-log are the only
        // two files that change; everything downstream reads ObjectMapConfig.object.
        logical_object: ChoiceColumn({
            label: 'Logical object',
            dropdown: 'none',
            choices: OBJECT_CHOICES,
        }),
        started: DateTimeColumn({ label: 'Started', mandatory: true }),
        duration_ms: IntegerColumn({ label: 'Duration (ms)' }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            dropdown: 'none',
            choices: {
                success: { label: 'Success', sequence: 100 },
                failure: { label: 'Failure', sequence: 200 },
                timeout: { label: 'Timeout', sequence: 300 },
                // An open breaker can generate hundreds of refusal rows per minute. Logged as
                // `failure` they would drown the real error in the Failed Calls module AND
                // poison the breaker's own derived failure counter, which must count evidence
                // about the ERP, not evidence about us.
                circuit_open: { label: 'Circuit Open', sequence: 400 },
                // L2-D1 / §4.2. ADDITIVE ONLY: `status != success` still catches it, so the
                // Failed Calls module needs no change. It exists because at L4 a `failure`
                // renders "ERP did not answer" and a missing map must render
                // "Not configured -- create an Object Map for <object>". Two different
                // sentences, and kickoff §7 says that distinction is the product.
                //
                // It is EXCLUDED from the breaker's failure counter alongside circuit_open
                // (circuit-breaker.recordFailure, T2-13): configuration noise must never trip
                // the breaker on a healthy ERP.
                not_configured: { label: 'Not Configured', sequence: 500 },
            },
        }),
        http_code: IntegerColumn({ label: 'HTTP Code' }),
        error: StringColumn({
            label: 'Error',
            maxLength: 1000,
            hint: 'Truncated status line only. Never a response body (C1).',
        }),
        rows_returned: IntegerColumn({ label: 'Rows Returned', hint: 'Count only, never content.' }),
        // §4.3 -- provenance. A wrong figure is traced: tile -> sync_run -> call_log -> the
        // object_map row -> its field_map rows. cascadeRule 'none' for the same reason as
        // erp_system above: telemetry outlives the configuration it describes.
        object_map: ReferenceColumn({
            label: 'Object mapping',
            referenceTable: 'x_335329_sn_hr_erp_object_map',
            cascadeRule: 'none',
            hint: 'The mapping this call actually resolved. Empty means none resolved -- which is itself the evidence for a MAP_MISSING outcome.',
        }),
        mapping_verified: BooleanColumn({
            label: 'Mapping verified',
            default: false,
            hint: 'The resolved mapping\'s verified flag AT CALL TIME. Copied, not referenced, so later re-verification does not rewrite history.',
        }),
        cache_hit: BooleanColumn({ label: 'Cache Hit', default: false }),
    },
    index: [
        { name: 'idx_call_log_system_started', unique: false, element: ['erp_system', 'started'] },
        { name: 'idx_call_log_status_started', unique: false, element: ['status', 'started'] },
        { name: 'idx_call_log_started', unique: false, element: 'started' },
    ],
})
