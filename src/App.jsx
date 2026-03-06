import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Loader from './components/common/Loader'

const DatabasePage = lazy(() => import('./pages/DatabasePage'))
const BuildPlannerPage = lazy(() => import('./pages/BuildPlannerPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const GeneratorPage = lazy(() => import('./pages/GeneratorPage'))

function SuspensePage({ children }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SuspensePage><DatabasePage /></SuspensePage>} />
        <Route path="build" element={<SuspensePage><BuildPlannerPage /></SuspensePage>} />
        <Route path="changelog" element={<SuspensePage><ChangelogPage /></SuspensePage>} />
        <Route path="generator" element={<SuspensePage><GeneratorPage /></SuspensePage>} />
      </Route>
    </Routes>
  )
}

