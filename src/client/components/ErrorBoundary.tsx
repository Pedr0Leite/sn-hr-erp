/**
 * L5 §4.6 / story L5-1 AC7. A BLANK WHITE PAGE READS AS "NO DATA" and violates this app's
 * founding rule in spirit, so an uncaught render error becomes an explicit, named region.
 *
 * THIS IS THE ONLY CLASS COMPONENT IN THE APP, and it has to be: React exposes error boundaries
 * through `componentDidCatch` / `getDerivedStateFromError` and there is no hook equivalent.
 * Recorded rather than worked around.
 */

import React from 'react'

interface State {
    message: string
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { message: '' }
    }

    static getDerivedStateFromError(error: unknown): State {
        return { message: error instanceof Error ? error.message : String(error) }
    }

    render() {
        if (this.state.message) {
            return (
                <div className="hub-error" role="alert">
                    <h2>The hub could not load this tab.</h2>
                    <p>{this.state.message}</p>
                    <p>Nothing on this page should be read as a figure. Reload, and report this message if it persists.</p>
                </div>
            )
        }
        return this.props.children
    }
}
