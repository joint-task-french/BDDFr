import {lazy, Suspense, useEffect} from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Loader from './components/common/Loader'
import PageViewer from "./pages/PageViewer.jsx";
import { apiBuildotheque } from './utils/apiBuildotheque'

const DatabasePage = lazy(() => import('./pages/DatabasePage'))
const BuildPlannerPage = lazy(() => import('./pages/BuildPlannerPage'))
const BuildLibraryPage = lazy(() => import('./pages/BuildLibraryPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const GeneratorPage = lazy(() => import('./pages/GeneratorPage'))
const MarkdownViewerPage = lazy(() => import('./pages/PageViewer'))

function SuspensePage({ children }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>
}

export default function App() {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const token = params.get('token')
        const userParam = params.get('user')

        if (token) {
            console.log("App: Auth parameters found in URL");
            apiBuildotheque.handleAuthCallback(token, userParam)
            
            // Nettoyer l'URL
            params.delete('token')
            params.delete('user')
            const newSearch = params.toString()
            const cleanUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
            console.log("App: Cleaning URL to", cleanUrl);
            navigate(cleanUrl, { replace: true })
        }
    }, [location.search, location.pathname, navigate])

    useEffect(() => {
        const preloadPages = () => {
            import('./pages/DatabasePage');
            import('./pages/BuildPlannerPage');
            import('./pages/BuildLibraryPage');
            import('./pages/ChangelogPage');
            import('./pages/GeneratorPage');
            import('./pages/PageViewer');
        };
        if ('requestIdleCallback' in window) {
            requestIdleCallback(preloadPages);
        } else {
            setTimeout(preloadPages, 2000);
        }
    }, []);


    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<SuspensePage><DatabasePage /></SuspensePage>} />
                <Route path="db/:category/:slug?/:modifier?" element={<SuspensePage><DatabasePage /></SuspensePage>} />
                <Route path="planner" element={<SuspensePage><BuildPlannerPage /></SuspensePage>} />
                <Route path="library" element={<SuspensePage><BuildLibraryPage /></SuspensePage>} />
                <Route path="build" element={<SuspensePage><BuildPlannerPage /></SuspensePage>} />
                <Route path="changelog" element={<SuspensePage><ChangelogPage /></SuspensePage>} />
                <Route path="generator" element={<SuspensePage><GeneratorPage /></SuspensePage>} />
                <Route path="pages/:pageId?" element={<SuspensePage><PageViewer /></SuspensePage>} />
            </Route>
        </Routes>
    )
}