import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useDataLoader } from '../../hooks/useDataLoader.js'
import { useBuild } from '../../context/BuildContext.jsx'
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
    <BuildPlannerContent data={data} />
  )
}

function BuildPlannerContent({ data }) {
  const { editingInfo, activeBuildSource, dispatch } = useBuild()
  const location = useLocation()
  const [apiBuildMeta, setApiBuildMeta] = useState(null)
  const [isLiking, setIsLiking] = useState(false)
  const [authUser, setAuthUser] = useState(apiBuildotheque.user)

  const effectiveApiUrl = useMemo(
    () => apiBuildotheque.getBaseUrl(data.metadata?.buildLibraryApiUrl),
    [data.metadata?.buildLibraryApiUrl]
  )

  const formatDate = (value) => {
    if (!value) return null
    const date = typeof value === 'number' ? new Date(value) : new Date(String(value))
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const normalizeApiBuildMeta = (apiBuildId, result) => {
    const payload = result?.build || result || {}
    const likedIds = apiBuildotheque.getUserLikes().map(String)
    const likes = Number.isFinite(payload.likes) ? payload.likes : 0
    return {
      id: String(payload.id || apiBuildId),
      nom: payload.nom || 'Build communautaire',
      description: payload.description || '',
      auteur: payload.auteur || 'Anonyme',
      timestamp: payload.timestamp || payload.createdAt || null,
      likes,
      isLiked: payload.isLiked ?? likedIds.includes(String(payload.id || apiBuildId))
    }
  }

  useEffect(() => {
    const handleAuthChange = (event) => {
      setAuthUser(event.detail?.user || null)
    }
    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [])

  const buildCleanPlannerUrl = (pathname, search = '') => {
    const rawBase = import.meta.env.BASE_URL || '/'
    const basePath = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
    const normalizedPath = pathname?.startsWith('/') ? pathname : `/${pathname || 'build'}`
    return `${basePath}${normalizedPath}${search}`
  }

  // Charger un build depuis l'URL au montage
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const isEditing = params.get('edit') === 'true'

    let apiBuildId = params.get('build-id')
    const encoded = params.get('b')

    // Si le build est déjà persisté depuis l'API, on réinjecte build-id dans l'URL au retour.
    if (!apiBuildId && !encoded && activeBuildSource?.type === 'api' && activeBuildSource.id) {
      const restored = new URLSearchParams()
      restored.set('build-id', String(activeBuildSource.id))
      if (editingInfo?.type === 'api' && editingInfo.id === activeBuildSource.id) {
        restored.set('edit', 'true')
      }
      const routePath = location.pathname || '/build'
      const cleanUrl = buildCleanPlannerUrl(routePath, `?${restored.toString()}`)
      window.history.replaceState(null, '', cleanUrl)
      apiBuildId = String(activeBuildSource.id)
    }

    if (apiBuildId) {
      const baseUrl = effectiveApiUrl
      ;(async () => {
        if (apiBuildotheque.isAuthenticated()) {
          await apiBuildotheque.fetchUserLikes(baseUrl)
        }
        const result = await apiBuildotheque.fetchBuildById(apiBuildId, baseUrl)
        if (result) {
          setApiBuildMeta(normalizeApiBuildMeta(apiBuildId, result))
        }
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
          dispatch({
            type: 'LOAD_BUILD',
            build,
            editingInfo,
            activeBuildSource: { type: 'api', id: String(apiBuildId) }
          })
        }
      })()
      return
    }

    setApiBuildMeta(null)

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
      dispatch({
        type: 'LOAD_BUILD',
        build,
        editingInfo,
        activeBuildSource: { type: 'share', encoded }
      })
    }
  }, [location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLikeApiBuild = async () => {
    if (!apiBuildMeta?.id || isLiking) return

    if (!apiBuildotheque.isAuthenticated() || !authUser) {
      alert('Connectez-vous via Discord pour liker un build.')
      return
    }

    const previous = apiBuildMeta
    const nextIsLiked = !apiBuildMeta.isLiked
    setApiBuildMeta(prev => ({
      ...prev,
      isLiked: nextIsLiked,
      likes: nextIsLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)
    }))
    setIsLiking(true)

    try {
      const result = await apiBuildotheque.toggleLike(apiBuildMeta.id, effectiveApiUrl)
      if (!result) {
        setApiBuildMeta(previous)
        return
      }

      setApiBuildMeta(prev => ({
        ...prev,
        likes: Number.isFinite(result.likes) ? result.likes : prev.likes,
        isLiked: result.isLiked ?? prev.isLiked
      }))
    } catch (error) {
      console.error('Erreur lors du like du build affiché:', error)
      setApiBuildMeta(previous)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
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

          {apiBuildMeta && (
            <section className="mb-6 p-4 sm:p-5 bg-tactical-panel/60 border border-shd/30 rounded-lg">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">
                    {apiBuildMeta.nom}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400 italic">
                    {apiBuildMeta.description || 'Aucune description fournie.'}
                  </p>
                  <div className="mt-2 flex items-center gap-3 flex-wrap text-xs font-bold uppercase tracking-wider">
                    <span className="text-shd/90">Par {apiBuildMeta.auteur}</span>
                    {formatDate(apiBuildMeta.timestamp) && (
                      <span className="text-gray-500">Le {formatDate(apiBuildMeta.timestamp)}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLikeApiBuild}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-black uppercase tracking-wide transition-all ${
                    isLiking ? 'opacity-50 cursor-wait' : 'hover:scale-105 active:scale-95'
                  } ${apiBuildMeta.isLiked ? 'text-shd bg-shd/20 border-shd/40' : 'text-white/70 bg-white/5 border-white/10'}`}
                  title={apiBuildMeta.isLiked ? 'Retirer mon like' : 'Liker ce build'}
                >
                  <svg className="w-4 h-4" fill={apiBuildMeta.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={apiBuildMeta.isLiked ? 0 : 2} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {apiBuildMeta.likes}
                </button>
              </div>
            </section>
          )}

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
        <aside className="w-full xl:w-96 shrink-0 xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto pr-0 xl:pr-2 custom-scrollbar">
          <BuildStatsPanel data={data} />
        </aside>
      </div>
    </div>
  )
}
