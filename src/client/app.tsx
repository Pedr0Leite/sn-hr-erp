/**
 * L5 §4.1 -- the view state machine.
 *
 * LAZY LOADING IS THE CONTRACT, NOT AN OPTIMISATION:
 *   page open                 -> EXACTLY ONE `GET /data` (the tab in the URL, or financial)
 *   switch to an unloaded tab -> exactly one further call
 *   return to a loaded tab    -> ZERO calls, rendered from `byTab`
 *   explicit refresh          -> POST /refresh for that tab, then re-GET that tab only
 * A page open that calls /data five times fails story L5-1 AC3.
 *
 * Navigation is `?tab=<name>` via URLSearchParams with a `popstate` listener, so a tab is
 * linkable and the back button works. Inside the Polaris shell the permalink is set through
 * `CustomEvent.fireTop`; standalone it is `history.pushState`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Tabs } from '@servicenow/react-components/Tabs'
import { TabPayload, TABS, TAB_LABELS } from './types'
import { getTab, postRefresh } from './api'
import { TabView } from './components/TabView'
import './app.css'

type Entry = { status: 'loading' | 'ready' | 'error'; payload?: TabPayload; error?: string }

function tabFromUrl(): string {
    const requested = new URLSearchParams(window.location.search).get('tab') || ''
    return (TABS as readonly string[]).indexOf(requested) === -1 ? 'financial' : requested
}

function setPermalink(tab: string): void {
    const relativePath = window.location.pathname + '?tab=' + tab
    const title = 'SN HR&ERP — ' + TAB_LABELS[tab]
    if (window.self !== window.top) {
        const w = window as unknown as { CustomEvent: { fireTop: (n: string, d: unknown) => void } }
        w.CustomEvent.fireTop('magellanNavigator.permalink.set', { relativePath: relativePath, title: title })
    }
    window.history.pushState({ tab: tab }, '', relativePath)
    document.title = title
}

/**
 * Light/dark toggle. Three states, not two: `system` follows the OS and is the default, and the
 * two explicit choices override it. `data-theme` is stamped on the root element, which is what
 * app.css's `[data-theme=…]` blocks key off; `system` REMOVES the attribute rather than guessing,
 * so the `prefers-color-scheme` media query resolves on its own.
 *
 * The choice persists in localStorage. If storage is unavailable — a locked-down browser, or a
 * ServiceNow page opened in a sandboxed frame — every access here fails soft and the toggle still
 * works for the session; it simply does not survive a reload.
 */
type Theme = 'system' | 'light' | 'dark'

const THEME_KEY = 'x_335329_sn_hr_erp.theme'

function readTheme(): Theme {
    try {
        const v = window.localStorage.getItem(THEME_KEY)
        return v === 'light' || v === 'dark' ? v : 'system'
    } catch (e) {
        return 'system'
    }
}

function applyTheme(theme: Theme) {
    const root = document.documentElement
    if (theme === 'system') {
        root.removeAttribute('data-theme')
    } else {
        root.setAttribute('data-theme', theme)
    }
    try {
        if (theme === 'system') {
            window.localStorage.removeItem(THEME_KEY)
        } else {
            window.localStorage.setItem(THEME_KEY, theme)
        }
    } catch (e) {
        /* Storage denied. The attribute is already set, so the current view is correct. */
    }
}

function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(readTheme)

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    // system → dark → light → system. One control, no menu.
    const next: Theme = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system'
    const label = theme === 'system' ? 'Theme: system' : theme === 'dark' ? 'Theme: dark' : 'Theme: light'
    const glyph = theme === 'system' ? '◐' : theme === 'dark' ? '●' : '○'

    return (
        <button
            type="button"
            className="hub__theme"
            onClick={() => setTheme(next)}
            aria-label={label + '. Activate for ' + next + '.'}
        >
            <span aria-hidden="true">{glyph}</span>
            {label}
        </button>
    )
}

export default function App() {
    const [tab, setTab] = useState<string>(tabFromUrl)
    const [byTab, setByTab] = useState<{ [k: string]: Entry }>({})
    const [refreshNote, setRefreshNote] = useState('')

    const load = useCallback((name: string) => {
        setByTab((prev) => ({ ...prev, [name]: { status: 'loading' } }))
        getTab(name).then(
            (payload) => setByTab((prev) => ({ ...prev, [name]: { status: 'ready', payload: payload } })),
            (e: Error) => setByTab((prev) => ({ ...prev, [name]: { status: 'error', error: e.message } })),
        )
    }, [])

    // One effect, one guard: a tab already requested is NEVER re-fetched (T5-2's "zero calls").
    //
    // The guard lives in a ref, not inside a `setByTab` updater. React treats updaters as pure and
    // may run them more than once for a single logical update under concurrent rendering — and an
    // updater that fires `load()` would turn each extra invocation into another `GET /data`, which
    // is exactly what story L5-1 AC3 counts. Adding `<StrictMode>` later would make that two calls
    // per tab. A ref is read synchronously and is not replayed. See BUG-011.
    const requested = useRef<{ [k: string]: boolean }>({})
    useEffect(() => {
        if (!requested.current[tab]) {
            requested.current[tab] = true
            load(tab)
        }
    }, [tab, load])

    useEffect(() => {
        const onPop = () => setTab(tabFromUrl())
        window.addEventListener('popstate', onPop)
        return () => window.removeEventListener('popstate', onPop)
    }, [])

    const go = useCallback((name: string) => {
        setRefreshNote('')
        setPermalink(name)
        setTab(name)
    }, [])

    const refresh = useCallback(() => {
        setRefreshNote('Queuing…')
        postRefresh(tab).then(
            (res) =>
                setRefreshNote(
                    'Refresh QUEUED for ' +
                        res.objects.join(', ') +
                        ' across ' +
                        res.systems +
                        ' system(s). Nothing has been fetched yet: the queue is drained by a scheduled job that ships disarmed, so these figures will not move until an administrator runs it.',
                ),
            (e: Error) => setRefreshNote('The refresh could not be queued. ' + e.message),
        )
    }, [tab])

    const entry: Entry = byTab[tab] || { status: 'loading' }

    return (
        <main className="hub">
            {/* The branded band. It carries the product name, what the screen actually is, and
                the theme control — and nothing else. Portal guidance pushes hard for a hero with
                search and imagery; neither applies here. There is nothing to search (five fixed
                tabs), and a stock photograph behind a screen whose job is to say "this figure
                cannot be trusted" would undercut the only thing this app sells. */}
            <header className="hub__band">
                <div className="hub__brand">
                    <span className="hub__mark" aria-hidden="true">
                        ⬢
                    </span>
                    <div>
                        <h1 className="hub__title">SN HR&amp;ERP</h1>
                        <p className="hub__subtitle">Consolidated ERP hub — staged data, with its provenance</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <div className="hub__tabs">
                <Tabs
                    items={TABS.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
                    selectedItem={tab}
                    onSelectedItemSet={(e) => go(String(e.detail.payload.value))}
                />
            </div>
            {entry.status === 'loading' ? <p className="hub__loading">Loading {TAB_LABELS[tab]}…</p> : null}
            {entry.status === 'error' ? (
                <div className="hub-error" role="alert">
                    <h2>The hub could not load this tab.</h2>
                    <p>{entry.error}</p>
                    <p>No figure on this tab has been read. This is not an empty tab.</p>
                </div>
            ) : null}
            {entry.status === 'ready' && entry.payload ? (
                <TabView payload={entry.payload} onRefresh={refresh} refreshNote={refreshNote} busy={false} />
            ) : null}
        </main>
    )
}
