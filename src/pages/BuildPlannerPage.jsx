import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDataLoader } from '../hooks/useDataLoader'
import { BuildProvider, useBuild } from '../context/BuildContext'
import { decodeBuild, resolveBuild } from '../utils/buildShare'
import Loader from '../components/common/Loader'
import WeaponSection from '../components/buildPlanner/WeaponSection'
import GearSection from '../components/buildPlanner/GearSection'
import SkillSection from '../components/buildPlanner/SkillSection'
import BuildActions from '../components/buildPlanner/BuildActions'

export default function BuildPlannerPage() {
  const { data, loading, error, progress } = useDataLoader()

  if (loading) return <Loader progress={progress} />
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-400 text-lg font-bold uppercase tracking-widest mb-2">Erreur de chargement</p>
      <p className="text-gray-400 text-sm">{error}</p>
    </div>
  )

  return (
    <BuildProvider classSpe={data.classSpe}>
      <BuildPlannerContent data={data} />
    </BuildProvider>
  )
}

function BuildPlannerContent({ data }) {
  const { dispatch } = useBuild()
  const location = useLocation()

  // Charger un build depuis l'URL au montage
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const encoded = params.get('b')
    if (!encoded) return

    const compact = decodeBuild(encoded)
    if (!compact) return

    const build = resolveBuild(compact, data)
    if (build) {
      dispatch({ type: 'LOAD_BUILD', build })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
            Build <span className="text-shd">Planner</span>
          </h2>
          <p className="text-sm text-gray-500">Concevez votre build The Division 2</p>
        </div>
        <BuildActions />
      </div>

      {/* Armes */}
      <section className="mb-8" id="section-weapons">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span>🔫</span> Armement
          <span className="text-gray-600 text-xs font-normal">(1 spé + 2 armes + 1 arme de poing — 1 arme exotique max.)</span>
        </h3>
        <WeaponSection data={data} />
      </section>

      {/* Équipements */}
      <section className="mb-8" id="section-gear">
        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span>🛡️</span> Équipements
          <span className="text-gray-600 text-xs font-normal">(1 pièce exotique max.)</span>
        </h3>
        <GearSection data={data} />
      </section>

      {/* Compétences */}
      <section className="mb-8" id="section-skills">
        <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span>⚡</span> Compétences
          <span className="text-gray-600 text-xs font-normal">(1 seule par type)</span>
        </h3>
        <SkillSection data={data} />
      </section>
    </div>
  )
}
