import { Table, StringColumn, ChoiceColumn, ReferenceColumn, BooleanColumn, IntegerColumn, DateTimeColumn, UrlColumn } from '@servicenow/sdk/core'
import { VENDOR_CHOICES } from './choices'

// L1-3. erp_system -- the connection registry. docs/l1-control-tower-design.md §3.
//
// accessibleFrom: 'package_private' -- GOVERNANCE CONDITION C1, NOT the design doc's original
// 'public'. This table holds base_url, three auth-profile references and MID-server config;
// 'public' (the SDK default) would let any other scoped app on the instance read this app's
// connection configuration. D4 removed every cross-scope consumer, so no consumer justifying
// 'public' exists or is planned. §3.0.
//
// allowWebServiceAccess: true -- explicit. The SDK default is false and ~40 acceptance
// criteria are worded "verified via the Table API" (L0 F3).
// actions: ['read'] -- an array, not { read: true } (L0 F2).
// The variable name equals the table name -- TS213 (L0 trap T3).

export const x_335329_sn_hr_erp_erp_system = Table({
    name: 'x_335329_sn_hr_erp_erp_system',
    label: 'ERP System',
    display: 'name',
    audit: true,
    accessibleFrom: 'package_private',
    callerAccess: 'tracking',
    actions: ['read'],
    allowWebServiceAccess: true,
    createAccessControls: false,
    schema: {
        name: StringColumn({ label: 'Name', maxLength: 100, mandatory: true }),
        vendor: ChoiceColumn({
            label: 'Vendor',
            mandatory: true,
            dropdown: 'none',
            choices: VENDOR_CHOICES,
        }),
        legal_entity: StringColumn({
            label: 'Legal entity',
            maxLength: 100,
            hint: 'Disambiguates two systems of the same vendor (story L1-1 AC5).',
        }),
        base_url: UrlColumn({ label: 'Base URL', maxLength: 1024, mandatory: true }),
        auth_type: ChoiceColumn({
            label: 'Auth type',
            mandatory: true,
            dropdown: 'none',
            choices: {
                basic: 'Basic',
                oauth2: 'OAuth 2.0',
                mutual: 'Mutual TLS',
            },
        }),
        auth_profile_basic: ReferenceColumn({
            label: 'Basic auth profile',
            referenceTable: 'sys_auth_profile_basic',
        }),
        auth_profile_oauth: ReferenceColumn({
            label: 'OAuth entity profile',
            referenceTable: 'oauth_entity_profile',
        }),
        // String, NOT Reference. sys_auth_profile_mutual does not exist on this instance and a
        // reference to a nonexistent table fails the build (§3.1).
        auth_profile_mutual: StringColumn({
            label: 'Mutual TLS profile',
            maxLength: 32,
            hint: 'sys_id of the mutual-auth profile. String, not a reference: sys_auth_profile_mutual does not exist on this instance.',
        }),
        use_mid_server: BooleanColumn({ label: 'Use MID Server', default: false }),
        // Read at runtime with getDisplayValue(): setMIDServer() takes the NAME, not the sys_id.
        // A sys_id silently never routes (kickoff §9).
        mid_server: ReferenceColumn({ label: 'MID Server', referenceTable: 'ecc_agent' }),
        timeout_ms: IntegerColumn({ label: 'Timeout (ms)', default: 30000 }),
        max_retries: IntegerColumn({ label: 'Max retries', default: 2 }),
        backoff_ms: IntegerColumn({ label: 'Backoff (ms)', default: 500 }),
        // Three states in one column: empty = closed, future = open, PAST = half-open.
        // Deliberately NOT deny-write (§6): the breaker writes it and spec §5.1 calls it
        // "admin-editable for manual reset". Operational state, not provenance.
        circuit_open_until: DateTimeColumn({
            label: 'Circuit open until',
            hint: 'Empty = closed. Future = open. Past = half-open. Admin-editable for manual reset.',
        }),
        read_only: BooleanColumn({
            label: 'Read only',
            default: true,
            hint: 'Story L1-1 AC2: a system is read-only unless someone deliberately says otherwise.',
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    index: [{ name: 'idx_erp_system_name', unique: true, element: 'name' }],
})
