import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DatabasePage from './pages/DatabasePage'
import BuildPlannerPage from './pages/BuildPlannerPage'
import ChangelogPage from './pages/ChangelogPage'
import GeneratorPage from './pages/GeneratorPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DatabasePage />} />
        <Route path="build" element={<BuildPlannerPage />} />
        <Route path="changelog" element={<ChangelogPage />} />
        <Route path="generator" element={<GeneratorPage />} />
      </Route>
    </Routes>
  )
}

