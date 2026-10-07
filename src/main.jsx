import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import URLCleaner from "./components/common/URLCleaner";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { initErrorReporting } from "./utils/errorReporter";


initErrorReporting()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <HashRouter>
                <URLCleaner />
                <App />
            </HashRouter>
        </ErrorBoundary>
    </React.StrictMode>
)
