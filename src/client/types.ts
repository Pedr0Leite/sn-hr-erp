/**
 * L5. The client's view of `docs/api-contract.md`. THAT FILE IS AUTHORITATIVE; this one is a
 * transcription of it and nothing more.
 *
 * EVERY OPTIONAL KEY HERE IS OPTIONAL IN THE PAYLOAD FOR A REASON. `v`, `sub`, `cat`, `s`, `r`
 * and `link` are ABSENT -- never `null`, never `[]`, never `0` (trap T17). Read them with
 * `'v' in tile`, never with `tile.v || 0`, which renders a wrong number for an absence and
 * passes a happy-path smoke test.
 */

export type Fmt = 'number' | 'currency' | 'percent'

export interface Thr {
    name: string
    kind: 'property' | 'per_row'
    value?: number
}

export interface Prev {
    v: number
    as_of: string
    age_h: number
}

export interface Subtotal {
    cur: string
    v: number
}

/** The tile envelope -- every tile, every type, no exceptions. */
export interface Tile {
    id: string
    lab: string
    obj: string
    fmt?: Fmt
    note?: string
    /** May be missing or unrecognised. The renderer's default branch exists for exactly that. */
    st?: string
    sys?: string[]
    v?: number
    sub?: Subtotal[]
    as_of?: string
    age_h?: number
    deg?: string
    prev?: Prev
    no_prev?: boolean
    missing?: string
    thr?: Thr
    /** OEE tile only. */
    origin?: string
    unweighted?: boolean
    out_of_range?: boolean
}

export interface Series {
    lab: string
    /** `null` marks a category this series has no value for — an absence, never a zero. */
    d: (number | null)[]
}

export interface ChartTile extends Tile {
    type: string
    cat?: string[]
    s?: Series[]
    miss?: string[]
}

export interface Col {
    k: string
    lab: string
    fmt?: Fmt
}

export interface Row {
    [k: string]: string | undefined
    link?: string
}

export interface ListTile extends Tile {
    cols: Col[]
    r?: Row[]
    caveat?: string
}

export interface TabPayload {
    tab: string
    lab: string
    gen: string
    stale_h: number
    note?: string
    k: Tile[]
    c: ChartTile[]
    l: ListTile[]
}

export const TABS = ['financial', 'procurement', 'inventory', 'assets', 'manufacturing'] as const
export type TabName = (typeof TABS)[number]

export const TAB_LABELS: { [k: string]: string } = {
    financial: 'Financial',
    procurement: 'Procurement',
    inventory: 'Inventory',
    assets: 'Fixed Assets',
    manufacturing: 'Manufacturing',
}
