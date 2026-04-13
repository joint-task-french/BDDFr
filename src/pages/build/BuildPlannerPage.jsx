import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDataLoader } from '../../hooks/useDataLoader.js'
import { BuildProvider, useBuild } from '../../context/BuildContext.jsx'
import { decodeBuild, resolveBuild } from '../../utils/buildShare.js'
import Loader from '../../components/common/Loader.jsx'
import WeaponSection from '../../components/buildPlanner/WeaponSection.jsx'
import GearSection from '../../components/buildPlanner/GearSection.jsx'
import SkillSection from '../../components/buildPlanner/SkillSection.jsx'
import BuildActions from '../../components/buildPlanner/BuildActions.jsx'
import BuildStatsPanel from '../../components/buildPlanner/BuildStatsPanel.jsx'
import { apiBuildotheque } from '../../utils/apiBuildotheque.js'

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
    <BuildProvider classSpe={data.classSpe} maxExpertiseLevel={data.metadata?.maxExpertiseLevel || 20}>
      <BuildPlannerContent data={data} />
    </BuildProvider>
  )
}

function BuildPlannerContent({ data }) {
  const { editingInfo, dispatch } = useBuild()
  const location = useLocation()

  // Charger un build depuis l'URL au montage
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const isEditing = params.get('edit') === 'true'

    const apiBuildId = params.get('build-id')
    if (apiBuildId) {
      const baseUrl = apiBuildotheque.getBaseUrl(data.metadata?.buildLibraryApiUrl)
      ;(async () => {
        const result = await apiBuildotheque.fetchBuildById(apiBuildId, baseUrl)
        const encoded = result?.encoded || result?.build?.encoded
        if (!encoded) return
        const compact = decodeBuild(encoded)
        if (!compact) return
        const build = resolveBuild(compact, data)
        if (build) {
          const editingInfo = isEditing ? {
            type: 'api',
            id: apiBuildId,
            originalMetadata: {
              nom: result?.nom || result?.build?.nom,
              description: result?.description || result?.build?.description,
              tags: result?.tags || result?.build?.tags || []
            }
          } : null
          dispatch({ type: 'LOAD_BUILD', build, editingInfo })
        }
      })()
      return
    }

    const encoded = params.get('b')
    if (!encoded) return

    const compact = decodeBuild(encoded)
    if (!compact) return

    const build = resolveBuild(compact, data)
    if (build) {
      let editingInfo = null
      if (isEditing) {
        // Tenter de retrouver les métadonnées locales si c'est un build local
        const saves = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')
        const localBuild = saves.find(s => s.encoded === encoded)
        editingInfo = {
          type: 'local',
          id: encoded,
          originalMetadata: {
            nom: localBuild?.nom || 'Nouveau Build',
            description: localBuild?.description || '',
            tags: localBuild?.tags || []
          }
        }
      }
      dispatch({ type: 'LOAD_BUILD', build, editingInfo })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1 flex items-baseline gap-3">
            <span>Build <span className="text-shd">Planner</span></span>
            {editingInfo && (
              <span className="text-xs text-shd/60 normal-case font-black italic bg-shd/5 px-2 py-1 rounded border border-shd/20 animate-pulse">
                Mode Édition : {editingInfo.originalMetadata.nom}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">Concevez votre build The Division 2</p>
        </div>
        <BuildActions data={data} />
      </div>

      {/* Layout 2 colonnes : build editor + stats sidebar */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Colonne principale — éditeur de build */}
        <div className="flex-1 min-w-0">
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

        {/* Sidebar — statistiques du build */}
        <aside className="w-full xl:w-96 shrink-0 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto pr-0 xl:pr-2 custom-scrollbar">
          <BuildStatsPanel data={data} />
        </aside>
      </div>
    </div>
  )
}
