import {lazy, Suspense, useEffect} from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Loader from './components/common/Loader'
import { GameProvider } from './context/GameContext'

const DatabasePage = lazy(() => import('./pages/DatabasePage'))
const BuildPlannerPage = lazy(() => import('./pages/BuildPlannerPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const GeneratorPage = lazy(() => import('./pages/GeneratorPage'))

function SuspensePage({ children }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>
}

export default function App() {
    useEffect(() => {
        const preloadPages = () => {
            import('./pages/DatabasePage');
            import('./pages/BuildPlannerPage');
            import('./pages/ChangelogPage');
            import('./pages/GeneratorPage');
        };
        if ('requestIdleCallback' in window) {
            requestIdleCallback(preloadPages);
        } else {
            setTimeout(preloadPages, 2000);
        }
    }, []);


  return (
    <GameProvider>
      <Routes>
        <Route element={<Layout />}>
            <Route index element={<SuspensePage><DatabasePage /></SuspensePage>} />
            <Route path="db/:category/:slug?" element={<SuspensePage><DatabasePage /></SuspensePage>} />
            <Route path="build" element={<SuspensePage><BuildPlannerPage /></SuspensePage>} />
            <Route path="changelog" element={<SuspensePage><ChangelogPage /></SuspensePage>} />
            <Route path="generator" element={<SuspensePage><GeneratorPage /></SuspensePage>} />
        </Route>
      </Routes>
    </GameProvider>
  )
}
