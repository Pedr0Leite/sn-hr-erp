import { GlideDateTime } from '@servicenow/glide'
import { isLogicalField } from '../contract/objects.ts'
import type { FieldMapEntry } from './types.ts'

/**
 * Maps one ERP record onto LOGICAL FIELD NAMES (§4.4).
 *
 * PORTED from the sibling's src/server/remote-tables/field-mapper.ts. It lived there because
 * its consumer was a virtual table; this app declares no remote table (L2-D5), so it moves into
 * the connector and is called by the L3 sync engine.
 *
 * THE DESIGN BAR THIS FILE EXISTS TO MEET: a second ERP with a different JSON shape is
 * onboarded by editing `field_map` ROWS, not by editing code.
 *
 * A VENDOR FIELD NAME AS A STRING LITERAL IN THIS FILE IS A DESIGN FAILURE, exactly as a
 * hardcoded URL would be. There are none, and there must never be any (T1-25 / T2-16).
 *
 * The C2 rule governs every branch below: a value we could not read leaves the field ABSENT.
 * It never becomes 0, and it never becomes "now". An absent field says "we don't know"; a zero
 * says "this employee earns nothing", which is a confident wrong answer about money.
 *
 * TWO DEVIATIONS FROM §4.4, BOTH RECORDED RATHER THAN HIDDEN — see docs/l2-build-report.md:
 *
 *  (a) §4.4 restates the sibling's decimal/date rules ("a non-numeric amount leaves the column
 *      empty", "an unparseable date leaves the column empty") AND, in its last paragraph,
 *      defers typed promotion to L3. Those cannot both happen here: the sibling knew a column
 *      was decimal because it had a fixed six-column table, and this app deliberately does not.
 *      Resolution: numeric and date handling is applied here ONLY where the mapping itself
 *      declares it — the `abs` / `negate` / `percent_to_ratio` / `ratio_to_percent` transforms
 *      are numeric, `date_only` is a date. Everything else is passed through as a string and
 *      typed by L3's promotion table. `parseDate()` and `toNumber()` are exported so L3 applies
 *      the IDENTICAL primitives rather than growing a second set.
 *
 *  (b) `zeroIsMeaningful` (L1 §4.4, story L6-4) is applied here, because this is the only place
 *      that holds both the value and the flag. A 0 / '' / null on a field whose mapping has not
 *      declared zero meaningful is dropped, which is precisely how this mapper spells
 *      UNAVAILABLE. §4.4 does not say where the flag is applied; recorded as L2-D7.
 */

/** One mapped record, keyed by LOGICAL field name. Values are strings; L3 types them. */
export interface MappedRecord {
    [logicalField: string]: string
}

/** Transforms whose output is only meaningful as a number. */
const NUMERIC_TRANSFORMS = ['abs', 'negate', 'percent_to_ratio', 'ratio_to_percent']

/**
 * Walk a dotted path (`object_map.response_root`, e.g. `d.results` or `args`) into a parsed
 * body. Returns null when any segment is missing — the caller turns that into
 * RESPONSE_UNPARSEABLE rather than into an empty list, because "the path was wrong" and "there
 * are no invoices" are different answers and must not render the same way.
 */
export function walkPath(parsed: unknown, path: string): unknown {
    if (!path) {
        return parsed
    }
    const segments = path.split('.')
    let cursor: unknown = parsed
    for (let i = 0; i < segments.length; i++) {
        if (cursor === null || cursor === undefined || typeof cursor !== 'object') {
            return null
        }
        cursor = (cursor as { [k: string]: unknown })[segments[i]]
    }
    return cursor === undefined ? null : cursor
}

/**
 * Read a possibly-dotted source field out of one ERP record. `field_map.source_field` permits
 * dotted paths for nested JSON (L1 §4.2), so this is walkPath applied to a record.
 */
function readSource(record: { [k: string]: unknown }, sourceField: string): unknown {
    if (!sourceField) {
        return null
    }
    if (sourceField.indexOf('.') === -1) {
        const direct = record[sourceField]
        return direct === undefined ? null : direct
    }
    return walkPath(record, sourceField)
}

/**
 * Parse a number, or null. Exported so L3 uses this and not a second implementation.
 *
 * A non-numeric value yields null and the caller leaves the field ABSENT — the row is still
 * produced with its other fields. Showing a known invoice number with a blank amount is honest;
 * showing 0 is not.
 */
export function toNumber(raw: unknown): number | null {
    if (raw === null || raw === undefined || raw === '') {
        return null
    }
    const n = Number(raw)
    return !isNaN(n) && isFinite(n) ? n : null
}

/**
 * Parse an ERP date using the per-ERP `object_map.date_format` hint. Exported for L3.
 *
 * Returns '' when the value cannot be parsed. The caller leaves the field absent — a date we
 * could not read must NEVER silently become today's date, which would make an old invoice look
 * current.
 */
export function parseDate(raw: string, dateFormat: string): string {
    const gdt = new GlideDateTime()

    // An OData V2 `Edm.DateTime` is serialised as `/Date(1492098664000)/` -- epoch milliseconds
    // in a string wrapper, optionally with a `+0060` timezone offset. SAP S/4HANA ships most of
    // its API_* services as V2, so this arrives on the wire whatever the admin typed into
    // `date_format`. It is detected by SHAPE rather than by configuration on purpose: no other
    // format in circulation looks like this, and requiring an admin to recognise it first is
    // exactly how it stayed invisible. Every date in the set silently blanking is not a loud
    // failure -- it makes an "invoices due within N days" tile read 0, and 0 here means "we could
    // not read a date", not "nothing is due". See docs/vendor-integration-research.md §2.3.3.
    const odataV2 = /^\/Date\((-?\d+)([+-]\d+)?\)\/$/.exec(String(raw || ''))
    if (odataV2) {
        gdt.setNumericValue(parseInt(odataV2[1], 10))
        return gdt.getValue() || ''
    }

    if (dateFormat) {
        // setValueUTC honours an explicit format. If the ERP's format hint is wrong, the value
        // does not parse and we fall through to empty rather than to a wrong date.
        gdt.setValueUTC(raw, dateFormat)
        const parsed = gdt.getValue()
        if (parsed) {
            return parsed
        }
    }
    // No hint: try the platform's own parsing (ISO-8601 and friends).
    gdt.setDisplayValueInternal(raw)
    return gdt.getValue() || ''
}

/**
 * Apply one `field_map.transform`. Returns null when the transform cannot be applied, which the
 * caller turns into an ABSENT field — never a fallback value.
 *
 * `percent_to_ratio` / `ratio_to_percent` exist for OD7's OEE inputs (docs/l5-ui-design.md §5).
 */
export function applyTransform(raw: unknown, transform: string, dateFormat: string): string | null {
    const t = transform || 'none'

    if (NUMERIC_TRANSFORMS.indexOf(t) !== -1) {
        const n = toNumber(raw)
        if (n === null) {
            return null
        }
        if (t === 'abs') {
            return String(Math.abs(n))
        }
        if (t === 'negate') {
            return String(-n)
        }
        if (t === 'percent_to_ratio') {
            return String(n / 100)
        }
        return String(n * 100)
    }

    if (t === 'date_only') {
        const parsed = parseDate(String(raw), dateFormat)
        if (!parsed) {
            return null
        }
        // The platform's internal datetime is 'yyyy-MM-dd HH:mm:ss'; date_only drops the time.
        return parsed.split(' ')[0]
    }

    const s = String(raw)
    if (t === 'trim') {
        return s.replace(/^\s+/, '').replace(/\s+$/, '')
    }
    if (t === 'upper') {
        return s.toUpperCase()
    }
    if (t === 'lower') {
        return s.toLowerCase()
    }
    return s
}

/**
 * True when this raw value must be treated as UNAVAILABLE rather than as a figure.
 *
 * L1 §4.4 / story L6-4: '' , null and 0 are unavailable UNLESS the mapping explicitly declares
 * zero meaningful for that field. A 0 on `stock_item.qty` means the shelf is empty and is
 * meaningful; a 0 on `payroll_record.annual_gross_salary` means the call went wrong and must
 * fail the document rather than print a mortgage application with a zero on it.
 */
export function isUnavailable(raw: unknown, zeroIsMeaningful: boolean): boolean {
    if (raw === null || raw === undefined || raw === '') {
        return true
    }
    if (zeroIsMeaningful) {
        return false
    }
    const n = Number(raw)
    return !isNaN(n) && isFinite(n) && n === 0
}

/**
 * Map one ERP record through its `field_map` rows.
 *
 * - Unmapped SOURCE fields are ignored — an ERP sends far more than a dashboard needs.
 * - A mapped field missing from THIS record leaves the logical field absent. That is a
 *   per-record fact, not an error, and must not abort the row.
 * - A `logical_field` that is not in `object`'s contract is ignored rather than thrown on: one
 *   stale mapping row must not take out the whole list. (The L1-8 business rule already
 *   prevents such a row being saved on every path including the Table API; this is depth.)
 */
export function mapRecord(
    record: unknown,
    object: string,
    fields: FieldMapEntry[],
    dateFormat: string,
): MappedRecord {
    const out: MappedRecord = {}
    if (!record || typeof record !== 'object' || !fields) {
        return out
    }
    const src = record as { [k: string]: unknown }

    for (let i = 0; i < fields.length; i++) {
        const entry = fields[i]
        if (!entry || !entry.logicalField) {
            continue
        }
        if (!isLogicalField(object, entry.logicalField)) {
            continue
        }

        const raw = readSource(src, entry.sourceField)
        if (isUnavailable(raw, entry.zeroIsMeaningful)) {
            continue // ABSENT. Not zero. See the header.
        }

        const value = applyTransform(raw, entry.transform, dateFormat)
        if (value === null || value === '') {
            continue
        }

        out[entry.logicalField] = value
    }

    return out
}

/**
 * Map a whole response body: walk `response_root`, then map every record under it.
 *
 * Returns null when the path does not resolve to an array — the caller reports
 * RESPONSE_UNPARSEABLE, because "the path was wrong" and "there are no rows" are different
 * answers. An empty array is a legitimate empty list and returns [].
 */
export function mapResponse(
    parsedBody: unknown,
    responseRoot: string,
    object: string,
    fields: FieldMapEntry[],
    dateFormat: string,
): MappedRecord[] | null {
    const node = walkPath(parsedBody, responseRoot)
    if (Object.prototype.toString.call(node) !== '[object Array]') {
        return null
    }
    const rows = node as unknown[]
    const out: MappedRecord[] = []
    for (let i = 0; i < rows.length; i++) {
        out.push(mapRecord(rows[i], object, fields, dateFormat))
    }
    return out
}
