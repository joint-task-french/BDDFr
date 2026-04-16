import {lazy, Suspense, useEffect, useState} from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Loader from './components/common/Loader'
import { apiBuildotheque } from './utils/apiBuildotheque'
import { useDataLoader } from './hooks/useDataLoader'
import { useKonamiCode } from './hooks/useKonamiCode'
import InvestisseurReroll from './pages/InvestisseurReroll.jsx'
import { BuildProvider } from './context/BuildContext.jsx'

const DatabasePage = lazy(() => import('./pages/DatabasePage'))
const BuildPlannerPage = lazy(() => import('./pages/build/BuildPlannerPage.jsx'))
const BuildLibraryPage = lazy(() => import('./pages/build/BuildLibraryPage.jsx'))
const SHDWatchPage = lazy(() => import('./pages/build/SHDWatchPage.jsx'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const GeneratorPage = lazy(() => import('./pages/GeneratorPage'))
const PageViewer = lazy(() => import('./pages/PageViewer.jsx'))

function SuspensePage({ children }) {
    return <Suspense fallback={<Loader />}>{children}</Suspense>
}

export default function App() {
    const location = useLocation()
    const navigate = useNavigate()
    const { data } = useDataLoader()
    const [secretSession, setSecretSession] = useState(0)

    useKonamiCode(() => setSecretSession(prev => prev + 1))

    useEffect(() => {
        setSecretSession(0);
    }, [location.pathname]);

    useEffect(() => {
        if (data.metadata?.buildLibraryApiUrl) {
            apiBuildotheque.preloadInitialBuilds(data.metadata.buildLibraryApiUrl);
        }
    }, [data.metadata]);

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const token = params.get('token')

        if (token) {
            console.log("App: Auth parameters found in URL");
            apiBuildotheque.handleAuthCallback(token)

            // Nettoyer l'URL
            params.delete('token')
            const newSearch = params.toString()
            const cleanUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
            console.log("App: Cleaning URL to", cleanUrl);
            navigate(cleanUrl, { replace: true })
        }
    }, [location.search, location.pathname, navigate])

    useEffect(() => {
        const preloadPages = () => {
            import('./pages/DatabasePage');
            import('./pages/build/BuildPlannerPage.jsx');
            import('./pages/build/BuildLibraryPage.jsx');
            import('./pages/build/SHDWatchPage.jsx');
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
            <Route element={<Layout children={secretSession > 0 ? <InvestisseurReroll key={secretSession} allAttributs={data.attributs} allEquipements={data.equipements} allTalents={data.talentsEquipements} onClose={() => setSecretSession(0)} /> : null} />}>
                <Route index element={<SuspensePage><DatabasePage /></SuspensePage>} />
                <Route path="db/:category/:slug?/:modifier?" element={<SuspensePage><DatabasePage /></SuspensePage>} />
                <Route path="planner" element={<SuspensePage><BuildProvider classSpe={data.classSpe} montreConfig={data.montre} maxExpertiseLevel={data.metadata?.maxExpertiseLevel || 20}><BuildPlannerPage /></BuildProvider></SuspensePage>} />
                <Route path="library" element={<SuspensePage><BuildProvider classSpe={data.classSpe} montreConfig={data.montre} maxExpertiseLevel={data.metadata?.maxExpertiseLevel || 20}><BuildLibraryPage /></BuildProvider></SuspensePage>} />
                <Route path="build" element={<SuspensePage><BuildProvider classSpe={data.classSpe} montreConfig={data.montre} maxExpertiseLevel={data.metadata?.maxExpertiseLevel || 20}><BuildPlannerPage /></BuildProvider></SuspensePage>} />
                <Route path="shd" element={<SuspensePage><SHDWatchPage /></SuspensePage>} />
                <Route path="changelog" element={<SuspensePage><ChangelogPage /></SuspensePage>} />
                <Route path="generator" element={<SuspensePage><GeneratorPage /></SuspensePage>} />
                <Route path="pages/:pageId?" element={<SuspensePage><PageViewer /></SuspensePage>} />
            </Route>
        </Routes>
    )
}