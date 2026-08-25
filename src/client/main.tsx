import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'
import { EssView } from './ess'
import { ErrorBoundary } from './components/ErrorBoundary'

/**
 * `?view=me` mounts the employee-services surface INSTEAD of the finance tabs.
 *
 * A SEPARATE VIEW, NOT A SIXTH TAB. The five tabs are a finance dashboard read by analysts; the
 * employee surface answers "what am I owed" for somebody who will never open the others. Mixing
 * them would put an employee one mis-click from a procurement figure they hold no role for, and
 * would make the tab strip mean two things at once.
 *
 * The choice is made HERE, at the root, and not as an early return inside `App`. An early return
 * ahead of `App`'s hooks would make the hook order depend on the URL — which happens to be safe
 * today only because the link back to the hub is a real navigation. Deciding at the mount point
 * removes the hazard rather than relying on that staying true.
 */
const showEss = new URLSearchParams(window.location.search).get('view') === 'me'

const root = document.getElementById('root')
if (root) {
    ReactDOM.createRoot(root).render(
        <ErrorBoundary>
            {showEss ? <EssView /> : <App />}
        </ErrorBoundary>,
    )
}
