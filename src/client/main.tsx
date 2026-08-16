import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'
import { ErrorBoundary } from './components/ErrorBoundary'

const root = document.getElementById('root')
if (root) {
    ReactDOM.createRoot(root).render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>,
    )
}
