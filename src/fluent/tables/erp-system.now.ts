import { Table, StringColumn, ChoiceColumn, ReferenceColumn, BooleanColumn, IntegerColumn, DateTimeColumn, UrlColumn } from '@servicenow/sdk/core'
import { VENDOR_CHOICES, AUTH_TYPE_CHOICES, ENVIRONMENT_CHOICES } from './choices'

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
            choices: AUTH_TYPE_CHOICES,
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
        // ---- NV-1 (TRD §2 Authentication) -------------------------------------------------
        // `environment` is mandatory because the two rules that depend on it are both refusals:
        // production Basic auth needs a recorded, EXPIRING exception (OD46), and Unit4 states
        // non-production <-> production mapping as "not supported or allowed" (NV-15).
        environment: ChoiceColumn({
            label: 'Environment',
            mandatory: true,
            dropdown: 'none',
            choices: ENVIRONMENT_CHOICES,
        }),
        auth_exception_ref: StringColumn({
            label: 'Auth exception reference',
            maxLength: 200,
            hint: 'Required to save auth_type=basic with environment=production. The ticket or decision that recorded the exception -- TRD §2 forbids Basic in production.',
        }),
        // OD46: an exception with no expiry is how a tracked weakness becomes permanent.
        auth_exception_expires: DateTimeColumn({
            label: 'Auth exception expires',
            hint: 'Mandatory whenever auth_exception_ref is set. A production Basic-auth exception must have a remediation date.',
        }),
        // ---- NV-6 (TRD §2 Versioning) -----------------------------------------------------
        api_version: StringColumn({
            label: 'API version',
            maxLength: 40,
            hint: 'The vendor API version this connection is pinned to. Empty renders "API version not recorded" -- never silently blank.',
        }),
        version_source_note: StringColumn({
            label: 'API version source',
            maxLength: 500,
            hint: 'Citation for api_version and deprecation_notice_days. Blank beats wrong (repo rule 5).',
        }),
        // NO DEFAULT, deliberately. Empty means "the vendor did not state a policy"; 0 means the
        // vendor stated zero notice. Those are different findings and only one of them is a fact.
        deprecation_notice_days: IntegerColumn({
            label: 'Deprecation notice (days)',
            hint: 'Empty renders "Deprecation policy not stated by vendor". 0 means the vendor stated zero notice.',
        }),
        deprecation_policy_url: UrlColumn({ label: 'Deprecation policy URL', maxLength: 1024 }),
        // ---- NV-11 (TRD §5 Attachment size/type limits) ------------------------------------
        // All three ship EMPTY. A guessed limit is the invented-field-name failure wearing a
        // different hat, and NV-11 refuses to render an upload control until they are set.
        max_attachment_bytes: IntegerColumn({
            label: 'Max attachment bytes',
            hint: 'Per-file ceiling, from the vendor. Empty means attachments are unavailable, not unlimited.',
        }),
        // Unit4 publishes BOTH a per-file limit (58,368 KB) and an account-wide 350 MB/min
        // ceiling. Ten files each under the per-file limit can breach the second one.
        max_throughput_bytes_per_min: IntegerColumn({
            label: 'Max throughput (bytes/min)',
            hint: 'Rolling-window ceiling across all transfers. A per-file check alone does not satisfy the vendor limit.',
        }),
        allowed_mime_types: StringColumn({
            label: 'Allowed MIME types',
            maxLength: 500,
            hint: 'Comma-separated, from the vendor. Empty means attachments are unavailable.',
        }),
        attachment_limits_source_note: StringColumn({
            label: 'Attachment limits source',
            maxLength: 500,
        }),
        // ---- NV-16 (TRD §2 Throughput / §6) ------------------------------------------------
        rate_limit_per_min: IntegerColumn({
            label: 'Rate limit (per minute)',
            hint: 'Vendor-stated. Empty means no client-side throttle -- a guessed throttle fails NV-16.',
        }),
        // Unit4 SUSPENDS every request for a full minute once the limit trips, so a breach is a
        // tenant-wide outage rather than a slow queue for one caller. Throttle below the stated
        // figure by default.
        rate_limit_safety_pct: IntegerColumn({
            label: 'Rate limit safety (%)',
            default: 80,
            hint: 'Throttle at this percentage of rate_limit_per_min. A breach suspends ALL traffic for one minute on some vendors.',
        }),
        expected_latency_ms: IntegerColumn({ label: 'Expected latency (ms)' }),
        throughput_source_note: StringColumn({ label: 'Throughput source', maxLength: 500 }),
        // ---- NV-3 (TRD §2 Write pattern) ---------------------------------------------------
        confirm_timeout_ms: IntegerColumn({
            label: 'Write confirmation timeout (ms)',
            default: 900000,
            hint: 'An asynchronous write still in `sent` beyond this becomes `failed`, never `confirmed`.',
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
