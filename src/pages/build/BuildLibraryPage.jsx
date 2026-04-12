import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeText } from '../../utils/textUtils.js'
import { useDataLoader } from '../../hooks/useDataLoader.js'
import { decodeBuild, resolveBuild } from '../../utils/buildShare.js'
import Loader from '../../components/common/Loader.jsx'
import { GameIcon, resolveAsset, GEAR_SLOT_ICONS_IMG, WEAPON_TYPE_ICONS } from '../../components/common/GameAssets.jsx'
import { apiBuildotheque } from '../../utils/apiBuildotheque.js'
import Dialog from '../../components/common/Dialog.jsx'

/**
 * Calcule si la couleur du texte doit être noire ou blanche selon la luminosité de l'arrière-plan.
 * @param {string} hex - Couleur au format hexadécimal (ex: #ffffff)
 * @returns {string} 'white' ou 'black'
 */
const getContrastColor = (hex) => {
  if (!hex) return 'white'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return (yiq >= 128) ? 'black' : 'white'
}

function SortDropdown({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  return (
      <div className="relative flex-1 md:flex-initial" ref={dropdownRef}>
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between bg-tactical-panel/50 border border-tactical-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-shd transition-all focus:ring-1 focus:ring-shd/20 font-bold text-sm min-w-[160px]"
        >
          <span className="truncate mr-2 uppercase tracking-tight">{selectedOption.label}</span>
          <svg
              className={`w-4 h-4 text-shd transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
            <div className="absolute z-50 mt-2 w-full bg-tactical-panel border border-tactical-border rounded-lg shadow-xl overflow-hidden animate-fade-in">
              {options.map((option) => (
                  <button
                      key={option.value}
                      onClick={() => {
                        onChange(option.value)
                        setIsOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-tight transition-colors hover:bg-shd/10 ${
                          value === option.value ? 'text-shd bg-shd/5' : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    {option.label}
                  </button>
              ))}
            </div>
        )}
      </div>
  )
}

function ItemMini({ item, ensemble, slot }) {
  const isWeapon = slot === 'w1' || slot === 'w2' || slot === 'sa'
  const isSkill = slot === 's1' || slot === 's2'

  const isExotic = item?.type === 'exotique' || item?.estExotique
  const isNamed = item?.estNomme
  const isGearSet = item?.type === 'gear_set' || ensemble?.type === 'gear_set'
  const isSkillItem = isSkill && item

  let icon = null

  if (isWeapon) {
    icon = resolveAsset(item?.icon) || WEAPON_TYPE_ICONS[item?.type]
  } else if (isSkill) {
    icon = resolveAsset(item?.icon) || resolveAsset(item?.slug)
  } else {
    if (ensemble?.icon) {
      icon = resolveAsset(ensemble.icon) || resolveAsset(ensemble.slug)
    } else if (item?.marque) {
      icon = resolveAsset(item.marque)
    } else {
      icon = GEAR_SLOT_ICONS_IMG[slot]
    }
  }

  const name = isSkill ? item?.variante : item?.nom

  let colorClass = 'text-gray-400'
  let borderColor = 'border-white/10'
  let bgColor = 'bg-black/40'

  if (item) {
    if (isExotic) {
      colorClass = 'text-red-500'
      borderColor = 'border-red-500/50'
      bgColor = 'bg-red-500/5'
    } else if (isGearSet) {
      colorClass = 'text-emerald-400'
      borderColor = 'border-emerald-400/30'
      bgColor = 'bg-emerald-400/5'
    } else if (isNamed) {
      colorClass = 'text-shd'
      borderColor = 'border-shd/50'
      bgColor = 'bg-shd/10'
    } else if (isSkillItem) {
      colorClass = 'text-blue-400'
      borderColor = 'border-blue-400/30'
      bgColor = 'bg-blue-400/5'
    } else {
      colorClass = 'text-white'
      borderColor = 'border-white/10'
      bgColor = 'bg-white/5'
    }
  } else {
    colorClass = 'text-gray-600'
    borderColor = 'border-white/5 opacity-20'
  }

  return (
      <div className="flex items-center gap-2 min-w-0" title={name || slot}>
        <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded border transition-colors ${bgColor} ${borderColor}`}>
          <GameIcon
              src={icon}
              size="w-5 h-5"
              color={isGearSet ? undefined : colorClass}
          />
        </div>
        <div className="flex flex-col min-w-0 leading-tight">
        <span className={`text-xs font-bold uppercase truncate transition-colors ${colorClass}`}>
          {name || '-'}
        </span>
          {ensemble?.nom && !isWeapon && (
              <span className="text-xs text-gray-500 truncate uppercase tracking-tighter">
             {ensemble.nom}
           </span>
          )}
          {isWeapon && item?.type && (
              <span className="text-xs text-gray-500 truncate uppercase tracking-tighter">
             {item.type.replace('_', ' ')}
           </span>
          )}
          {isSkill && item?.competence && (
              <span className="text-xs text-gray-500 truncate uppercase tracking-tighter">
             {item.competence}
           </span>
          )}
        </div>
      </div>
  )
}

export default function BuildLibraryPage() {
  const { data, loading, error, progress } = useDataLoader()
  const navigate = useNavigate()
  const [localBuilds, setLocalBuilds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [sortBy, setSortBy] = useState('default')

  const [apiUrl, setApiUrl] = useState(localStorage.getItem('buildLibraryApiUrl_override') || '')
  const [showSettings, setShowSettings] = useState(false)
  const [remoteBuilds, setRemoteBuilds] = useState([])
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [topBuilds, setTopBuilds] = useState([])
  const [recentBuilds, setRecentBuilds] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearchingApi, setIsSearchingApi] = useState(false)
  const [user, setUser] = useState(apiBuildotheque.user)

  useEffect(() => {
    const saved = localStorage.getItem('div2_builds_v2')
    if (saved) {
      try {
        setLocalBuilds(JSON.parse(saved))
      } catch (e) {
        console.error("Erreur lors du chargement des builds locaux", e)
      }
    }
  }, [])

  useEffect(() => {
    const handleAuthChange = (e) => {
      setUser(e.detail?.user || null)
    }
    window.addEventListener('auth-change', handleAuthChange)

    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [])
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [publishingBuild, setPublishingBuild] = useState(null)
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    type: 'alert',
    defaultValue: '',
    defaultDescription: '',
    defaultTags: [],
    onConfirm: () => {},
    onCancel: () => setDialog(prev => ({ ...prev, open: false }))
  })

  const effectiveApiUrl = apiUrl || data.metadata?.buildLibraryApiUrl || 'https://buildotheque.ftnl.workers.dev'

  useEffect(() => {
    if (data.metadata?.buildLibraryApiUrl) {
      loadInitialBuilds()
    }
  }, [data.metadata, apiUrl])

  const loadInitialBuilds = async () => {
    setIsApiLoading(true)
    
    // On essaye de récupérer les données préchargées (cache ou promesse en cours)
    let initialData = apiBuildotheque.cachedInitialData;
    if (!initialData && apiBuildotheque.initialLoadPromise) {
      initialData = await apiBuildotheque.initialLoadPromise;
    }

    if (initialData) {
      setTopBuilds(initialData.top?.builds || [])
      setRecentBuilds(initialData.recent?.builds || [])
      setIsApiLoading(false)
      return;
    }

    // Sinon chargement classique
    const [top, recent] = await Promise.all([
      apiBuildotheque.fetchTopBuilds({ limit: 6 }, effectiveApiUrl),
      apiBuildotheque.fetchRecentBuilds({ limit: 6 }, effectiveApiUrl)
    ])
    setTopBuilds(top?.builds || [])
    setRecentBuilds(recent?.builds || [])
    setIsApiLoading(false)
  }

  const executeSearch = async (term = localSearchTerm.trim()) => {
    setSearchTerm(term)
    
    if (term || selectedTags.length > 0) {
      setIsSearchingApi(true)
      const result = await apiBuildotheque.fetchBuilds({
        text: term,
        tags: selectedTags,
        limit: 50
      }, effectiveApiUrl)
      setSearchResults(result?.builds || [])
      setIsSearchingApi(false)
    } else {
      setSearchResults([])
    }
  }

  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      executeSearch()
    }
  }

  // Déclencher la recherche quand les tags changent
  useEffect(() => {
    if (selectedTags.length > 0 || searchTerm) {
      const performSearch = async () => {
        setIsSearchingApi(true)
        const result = await apiBuildotheque.fetchBuilds({
          text: searchTerm,
          tags: selectedTags,
          limit: 50
        }, effectiveApiUrl)
        setSearchResults(result?.builds || [])
        setIsSearchingApi(false)
      }
      performSearch()
    } else {
      setSearchResults([])
    }
  }, [selectedTags, searchTerm])

  const loadRemoteBuilds = async () => {
    // Cette fonction est conservée pour la compatibilité avec confirmPublish qui l'appelle
    loadInitialBuilds()
    if (searchTerm || selectedTags.length > 0) {
      const result = await apiBuildotheque.fetchBuilds({
        text: searchTerm,
        tags: selectedTags,
        limit: 50
      }, effectiveApiUrl)
      setSearchResults(result?.builds || [])
    }
  }

  const handleLoginDiscord = () => {
    apiBuildotheque.loginDiscord(effectiveApiUrl)
  }

  const handleLogout = () => {
    apiBuildotheque.logout()
  }

  const handleSaveApiUrl = (newUrl) => {
    const trimmed = newUrl.trim()
    if (trimmed) {
      localStorage.setItem('buildLibraryApiUrl_override', trimmed)
    } else {
      localStorage.removeItem('buildLibraryApiUrl_override')
    }
    apiBuildotheque.baseUrl = trimmed || null;
    apiBuildotheque.initialLoadPromise = null;
    apiBuildotheque.cachedInitialData = null;
    setApiUrl(trimmed)
    setShowSettings(false)
  }

  const handleDeleteLocal = (encoded) => {
    if (window.confirm('Supprimer ce build de votre bibliothèque locale ?')) {
      const newBuilds = localBuilds.filter(b => b.encoded !== encoded)
      setLocalBuilds(newBuilds)
      localStorage.setItem('div2_builds_v2', JSON.stringify(newBuilds))
    }
  }

  const handleEditLocal = (build) => {
    setDialog(prev => ({
      ...prev,
      open: true,
      title: 'Modifier le build',
      message: 'Modifiez le nom, la description et les tags de votre build local.',
      type: 'prompt',
      defaultValue: build.nom || '',
      defaultDescription: build.description || '',
      defaultTags: build.tags || [],
      showDescription: true,
      showTags: true,
      availableTags: sortedTags,
      maxInputLength: 25,
      maxDescriptionLength: 500,
      onConfirm: (val) => {
        const name = typeof val === 'object' ? val.name?.trim() : val?.trim()
        const description = typeof val === 'object' ? val.description?.trim() : ''
        const tags = typeof val === 'object' ? val.tags : []

        if (!name) return

        const newBuilds = localBuilds.map(b => {
          if (b.encoded === build.encoded) {
            return { ...b, nom: name, description, tags }
          }
          return b
        })

        setLocalBuilds(newBuilds)
        localStorage.setItem('div2_builds_v2', JSON.stringify(newBuilds))
        setDialog(p => ({ ...p, open: false }))
      },
      onCancel: () => setDialog(p => ({ ...p, open: false }))
    }))
  }

  const sortedTags = useMemo(() => {
    if (!data.buildsTags) return []
    const tagsArray = Object.values(data.buildsTags)
    return [...tagsArray].sort((a, b) => (a.label || '').trim().localeCompare((b.label || '').trim()))
  }, [data.buildsTags])

  const handlePublish = (build) => {
    if (!apiBuildotheque.isAuthenticated() || !user) {
      alert("Connectez-vous via Discord pour publier un build.")
      return
    }

    setPublishingBuild(build)

    setDialog(prev => ({
      ...prev,
      open: true,
      title: 'Publier le build',
      message: 'Modifiez le nom, la description et les tags avant de publier votre build sur la Buildothèque communautaire.',
      type: 'prompt',
      defaultValue: build.nom || '',
      defaultDescription: build.description || '',
      defaultTags: build.tags || [],
      defaultAuthor: user.username || '',
      showDescription: true,
      showTags: true,
      showAuthor: true,
      availableTags: sortedTags,
      maxInputLength: 25,
      maxDescriptionLength: 500,
      onConfirm: (val) => {
        setDialog(p => ({ ...p, open: false }))
        confirmPublish(build, val)
      },
      onCancel: () => {
        setDialog(p => ({ ...p, open: false }))
        setPublishingBuild(null)
      }
    }))
  }

  const confirmPublish = async (originalBuild, editedValues) => {
    if (!originalBuild || !editedValues) return

    const result = await apiBuildotheque.publishBuild({
      nom: editedValues.name?.trim() || originalBuild.nom,
      description: editedValues.description?.trim() || '',
      tags: editedValues.tags || [],
      encoded: originalBuild.encoded,
      auteur: editedValues.author?.trim() || user?.username || 'Anonyme',
      auteurId: user?.id
    }, effectiveApiUrl)

    setPublishingBuild(null)
    if (result) {
      alert("Build publié avec succès !")
      apiBuildotheque.initialLoadPromise = null;
      loadRemoteBuilds()
    } else {
      alert("Erreur lors de la publication.")
    }
  }

  const handleDeleteRemote = async (buildId) => {
    if (window.confirm('Supprimer définitivement ce build de la Buildothèque communautaire ?')) {
      const success = await apiBuildotheque.deleteBuild(buildId, effectiveApiUrl)
      if (success) {
        alert("Build supprimé.")
        apiBuildotheque.initialLoadPromise = null;
        loadRemoteBuilds()
      } else {
        alert("Erreur lors de la suppression. Vérifiez que vous êtes bien l'auteur.")
      }
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
        prev.includes(tagId)
            ? prev.filter(id => id !== tagId)
            : [...prev, tagId]
    )
  }

  const sortBuilds = (builds) => {
    if (sortBy === 'default') return builds

    return [...builds].sort((a, b) => {
      if (sortBy === 'recent') return (b.timestamp || 0) - (a.timestamp || 0)
      if (sortBy === 'old') return (a.timestamp || 0) - (b.timestamp || 0)
      if (sortBy === 'likes_desc') return (b.likes || 0) - (a.likes || 0)
      if (sortBy === 'likes_asc') return (a.likes || 0) - (b.likes || 0)
      return 0
    })
  }

  const filteredLocalBuilds = useMemo(() => {
    const term = normalizeText(searchTerm)
    const filtered = localBuilds.filter(build => {
      const matchesSearch = !term ||
          normalizeText(build.nom).includes(term) ||
          normalizeText(build.description).includes(term) ||
          normalizeText(build.auteur).includes(term)

      const matchesTags = selectedTags.length === 0 ||
          selectedTags.every(tagId => build.tags?.includes(tagId))

      return matchesSearch && matchesTags
    })
    return sortBuilds(filtered)
  }, [localBuilds, searchTerm, selectedTags, sortBy])

  const filteredPredefinedBuilds = useMemo(() => {
    const term = normalizeText(searchTerm)
    const combined = [
      ...(data.builds || []),
      ...remoteBuilds
    ]

    const filtered = combined.filter(build => {
      const matchesSearch = !term ||
          normalizeText(build.nom).includes(term) ||
          normalizeText(build.description).includes(term) ||
          normalizeText(build.auteur).includes(term)

      const matchesTags = selectedTags.length === 0 ||
          selectedTags.every(tagId => build.tags?.includes(tagId))

      return matchesSearch && matchesTags
    })
    return sortBuilds(filtered)
  }, [data.builds, remoteBuilds, searchTerm, selectedTags, sortBy])

  const isSearching = !!(searchTerm || selectedTags.length > 0)

  if (loading) return <Loader progress={progress} />
  if (error) return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Une erreur est survenue lors du chargement des données : {error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-shd text-white rounded">Réessayer</button>
      </div>
  )

  return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
              Buildo<span className="text-shd">thèque</span>
            </h2>
            <p className="text-sm text-gray-500">Retrouvez vos configurations et les builds de la communauté</p>
          </div>
        </div>

        <div className="mb-10 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <input
                  type="text"
                  placeholder="Rechercher un build par nom, description ou auteur (Entrée pour valider)..."
                  className="w-full bg-tactical-panel/50 border border-tactical-border rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-shd transition-all focus:ring-1 focus:ring-shd/20"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  onBlur={() => executeSearch()}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              {localSearchTerm && (
                  <button
                      onClick={() => {
                          setLocalSearchTerm('')
                          executeSearch('')
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
              )}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <SortDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: 'default', label: 'Tri par défaut' },
                    { value: 'recent', label: 'Plus récents' },
                    { value: 'old', label: 'Moins récents' },
                    { value: 'likes_desc', label: 'Plus likés' },
                    { value: 'likes_asc', label: 'Moins likés' }
                  ]}
              />

              <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 bg-tactical-panel/50 border border-tactical-border rounded-lg text-gray-400 hover:text-shd hover:border-shd/50 transition-all"
                  title="Paramètres de l'API"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {showSettings && (
              <div className="p-4 bg-tactical-panel/80 border border-shd/30 rounded-lg animate-fade-in">
                <h4 className="text-xs font-black text-shd uppercase tracking-widest mb-3">Configuration de l'API</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                      type="text"
                      defaultValue={effectiveApiUrl}
                      placeholder={`URL de l'API (ex: ${data.metadata?.buildLibraryApiUrl || 'https://buildotheque.ftnl.workers.dev'})`}
                      className="flex-1 bg-black/40 border border-tactical-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-shd"
                      id="api-url-input"
                  />
                  <div className="flex gap-2">
                    <button
                        onClick={() => handleSaveApiUrl(document.getElementById('api-url-input').value)}
                        className="px-4 py-2 bg-shd text-white rounded text-xs font-bold uppercase"
                    >
                      Enregistrer
                    </button>
                    <button
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-2 bg-tactical-border text-gray-300 rounded text-xs font-bold uppercase"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 italic">
                  Laissez vide pour utiliser l'API par défaut : {data.metadata?.buildLibraryApiUrl}
                </p>
              </div>
          )}

          {sortedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Filtrer par tags :</span>
                {sortedTags.map(tag => {
                  const tagId = tag.slug || tag.id
                  const isSelected = selectedTags.includes(tagId)
                  const tagColor = tag.color || '#6b7280'
                  return (
                      <button
                          key={tagId}
                          onClick={() => toggleTag(tagId)}
                          style={{
                              backgroundColor: isSelected ? `${tagColor}` : 'rgba(30, 41, 59, 0.4)',
                              color: isSelected ? getContrastColor(tagColor) : '#9ca3af',
                              borderColor: isSelected ? tagColor : 'rgba(255, 255, 255, 0.1)',
                              boxShadow: isSelected ? `0 10px 15px -3px ${tagColor}33` : 'none'
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-black uppercase border transition-all duration-200 tracking-tighter ${
                              isSelected ? 'scale-105' : 'hover:border-gray-600'
                          }`}
                      >
                        {tag.label}
                      </button>
                  )
                })}
                {(searchTerm || selectedTags.length > 0) && (
                    <button
                        onClick={() => {setSearchTerm(''); setSelectedTags([])}}
                        className="ml-2 text-xs font-bold uppercase text-shd hover:text-shd-light transition-colors underline underline-offset-4"
                    >
                      Tout réinitialiser
                    </button>
                )}
              </div>
          )}
        </div>

        <div className="space-y-12">
          {isSearching ? (
              <section>
                <h3 className="text-sm font-bold text-shd uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-shd rounded-full animate-pulse" />
                  Résultats de la recherche ({searchResults.length + filteredLocalBuilds.length})
                </h3>
                {isSearchingApi && (
                    <div className="mb-4 text-center text-shd animate-pulse text-xs font-bold uppercase">
                      Recherche en cours sur l'API...
                    </div>
                )}
                {searchResults.length === 0 && filteredLocalBuilds.length === 0 ? (
                    <div className="p-8 border border-dashed border-tactical-border rounded-lg text-center text-gray-500">
                      Aucun build ne correspond à vos critères.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLocalBuilds.map((b, i) => (
                          <BuildCard
                              key={'local-' + (b.id || b.encoded || i)}
                              build={b}
                              data={data}
                              onView={() => navigate(b.id ? `/build?build-id=${b.id}` : `/build?b=${b.encoded}`)}
                              onPublish={() => handlePublish(b)}
                              onEdit={() => handleEditLocal(b)}
                              onDelete={() => handleDeleteLocal(b.encoded)}
                              isLocal
                              currentUser={user}
                              userHash={user?.id}
                          />
                      ))}
                      {searchResults.map((b, i) => {
                          const isLocalBuild = localBuilds.some(lb => lb.encoded === b.encoded);
                          return (
                              <BuildCard
                                  key={'api-' + (b.id || b.encoded || i)}
                                  build={b}
                                  data={data}
                                  onView={() => navigate(b.id ? `/build?build-id=${b.id}` : `/build?b=${b.encoded}`)}
                                  onEdit={isLocalBuild ? () => handleEditLocal(b) : null}
                                  onDelete={b.id ? () => handleDeleteRemote(b.id) : isLocalBuild ? () => handleDeleteLocal(b.encoded) : null}
                                  isLocal={isLocalBuild}
                                  apiUrl={effectiveApiUrl}
                                  currentUser={user}
                                  userHash={user?.id}
                              />
                          );
                      })}
                    </div>
                )}
              </section>
          ) : (
              <>
                {topBuilds.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                        Top Builds de la communauté
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topBuilds.map((b, i) => {
                            const isLocalBuild = localBuilds.some(lb => lb.encoded === b.encoded);
                            return (
                                <BuildCard
                                    key={'top-' + (b.id || i)}
                                    build={b}
                                    data={data}
                                    onView={() => navigate(`/build?build-id=${b.id}`)}
                                    onEdit={isLocalBuild ? () => handleEditLocal(b) : null}
                                    onDelete={b.id ? () => handleDeleteRemote(b.id) : isLocalBuild ? () => handleDeleteLocal(b.encoded) : null}
                                    isLocal={isLocalBuild}
                                    apiUrl={effectiveApiUrl}
                                    currentUser={user}
                                    userHash={user?.id}
                                />
                            );
                        })}
                      </div>
                    </section>
                )}

                {recentBuilds.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        Dernières publications
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentBuilds.map((b, i) => {
                            const isLocalBuild = localBuilds.some(lb => lb.encoded === b.encoded);
                            return (
                                <BuildCard
                                    key={'recent-' + (b.id || i)}
                                    build={b}
                                    data={data}
                                    onView={() => navigate(`/build?build-id=${b.id}`)}
                                    onEdit={isLocalBuild ? () => handleEditLocal(b) : null}
                                    onDelete={b.id ? () => handleDeleteRemote(b.id) : isLocalBuild ? () => handleDeleteLocal(b.encoded) : null}
                                    isLocal={isLocalBuild}
                                    apiUrl={effectiveApiUrl}
                                    currentUser={user}
                                    userHash={user?.id}
                                />
                            );
                        })}
                      </div>
                    </section>
                )}

                <section>
                  <h3 className="text-sm font-bold text-shd uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-shd rounded-full animate-pulse" />
                    Vos Builds Enregistrés ({filteredLocalBuilds.length})
                  </h3>
                  {localBuilds.length === 0 ? (
                      <div className="p-8 border border-dashed border-tactical-border rounded-lg text-center text-gray-500">
                        Aucun build enregistré localement. Utilisez le Build Planner pour en créer un !
                      </div>
                  ) : filteredLocalBuilds.length === 0 ? (
                      <div className="p-8 border border-dashed border-tactical-border rounded-lg text-center text-gray-500">
                        Aucun build local ne correspond à vos critères.
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLocalBuilds.map((b, i) => (
                            <BuildCard
                                key={'local-' + (b.encoded || i)}
                                build={b}
                                data={data}
                                onView={() => navigate(b.id ? `/build?build-id=${b.id}` : `/build?b=${b.encoded}`)}
                                onPublish={() => handlePublish(b)}
                                onDelete={() => handleDeleteLocal(b.encoded)}
                                isLocal
                                currentUser={user}
                                userHash={user?.id}
                            />
                        ))}
                      </div>
                  )}
                </section>
              </>
          )}
        </div>

        <Dialog {...dialog} />
      </div>
  )
}

function BuildCard({ build, data, onView, onPublish, onEdit, onDelete, isLocal, apiUrl, userHash }) {
  const [likes, setLikes] = useState(build.likes || 0)
  const [isLiking, setIsLiking] = useState(false)

  // La condition stricte de suppression locale OU si l'ID API correspond exactement au SHA-512 stocké dans userHash
  const isAuthor = isLocal ? true : (build.auteurId && userHash && build.auteurId === userHash)

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!apiBuildotheque.isAuthenticated()) {
      alert("Connectez-vous via Discord pour liker un build.")
      return
    }
    if (isLocal || !build.id) return

    setIsLiking(true)
    const result = await apiBuildotheque.toggleLike(build.id, apiUrl)
    if (result && result.likes !== undefined) {
      setLikes(result.likes)
    }
    setIsLiking(false)
  }

  const resolved = useMemo(() => {
    const compact = decodeBuild(build.encoded)
    return resolveBuild(compact, data)
  }, [build.encoded, data])

  if (!resolved) return null

  const spec = resolved.specialWeapon?.specialisation || 'Inconnue'
  const gearPieces = Object.values(resolved.gear).filter(Boolean)

  const resolvedEnsembles = useMemo(() => {
    const res = {}
    Object.entries(resolved.gear).forEach(([slot, item]) => {
      if (item?.marque) {
        const brandKey = item.marque.toLowerCase()
        res[slot] = data.ensembles?.[brandKey] ||
            Object.values(data.ensembles || {}).find(e =>
                (e.slug && e.slug.toLowerCase() === brandKey) ||
                (e.nom && e.nom.toLowerCase() === brandKey)
            )
      }
    })
    return res
  }, [resolved.gear, data.ensembles])

  const brandsInfo = gearPieces.reduce((acc, item) => {
    const ensemble = resolvedEnsembles[item.emplacement]
    const key = ensemble?.slug || item.marque || item.nom
    if (!acc[key]) {
      acc[key] = { count: 0, ensemble, name: ensemble?.nom || item.nom }
    }
    acc[key].count += 1
    return acc
  }, {})
  const mainBrandInfo = Object.values(brandsInfo).sort((a, b) => b.count - a.count)[0]
  const mainBrand = mainBrandInfo?.name
  const mainBrandIcon = resolveAsset(mainBrandInfo?.ensemble?.icon) || resolveAsset(mainBrandInfo?.ensemble?.slug)
  const isMainGearSet = mainBrandInfo?.ensemble?.type === 'gear_set'
  const mainBrandColor = isMainGearSet ? 'text-emerald-400' : 'text-shd'

  const statsCount = { offensif: 0, defensif: 0, utilitaire: 0 }

  const buildTags = useMemo(() => {
    if (!build.tags || !data.buildsTags) return []
    return build.tags
        .map(tagId => data.buildsTags[tagId])
        .filter(Boolean)
        .sort((a, b) => (a.label || '').trim().localeCompare((b.label || '').trim()))
  }, [build.tags, data.buildsTags])

  if (resolved.gearAttributes) {
    Object.values(resolved.gearAttributes).forEach(slotAttrs => {
      if (slotAttrs.essentiels) {
        slotAttrs.essentiels.forEach(a => {
          if (a && a.categorie) {
            const cat = a.categorie.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            if (statsCount.hasOwnProperty(cat)) statsCount[cat] += 1
          }
        })
      }
    })
  }

  const formatDate = (ts) => {
    if (!ts) return null
    return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
      <div
          onClick={onView}
          className="group bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden hover:border-shd/50 transition-all flex flex-col h-full shadow-lg cursor-pointer"
      >
        <div className="p-5 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {mainBrandIcon && (
                  <GameIcon
                      src={mainBrandIcon}
                      size="w-15 h-15"
                      color={isMainGearSet ? undefined : mainBrandColor}
                  />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white tracking-wider group-hover:text-shd transition-colors line-clamp-1">
                    {build.nom}
                  </h4>
                  {likes !== undefined && !isLocal && build.id && (
                      <button
                          onClick={handleLike}
                          disabled={isLiking}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-black transition-all ${
                              isLiking ? 'opacity-50 cursor-wait' : 'hover:scale-110'
                          } text-shd/80 bg-shd/5 border-shd/20`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        {likes}
                      </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {build.auteur && (
                      <div className="text-xs text-shd/80 font-bold tracking-[0.2em] uppercase">
                        Par {build.auteur}
                      </div>
                  )}
                  {build.timestamp && (
                      <div className="text-xs text-gray-500 font-bold tracking-widest uppercase">
                        {formatDate(build.timestamp)}
                      </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 font-bold tracking-widest flex items-center gap-2">
                  <span className="text-blue-400">{spec}</span>
                  {mainBrand && (
                      <>
                        <span className="text-gray-700">|</span>
                        <span className={mainBrandColor}>{mainBrand}</span>
                      </>
                  )}
                  <span className="text-gray-700">|</span>
                  <div className="flex gap-1">
                    <span className="text-red-500">{statsCount.offensif}</span>
                    <span className="text-blue-500">{statsCount.defensif}</span>
                    <span className="text-yellow-500">{statsCount.utilitaire}</span>
                  </div>
                </div>

                {buildTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {buildTags.map(tag => {
                  const tagId = tag.slug || tag.id
                  return (
                      <span
                          key={tagId}
                          style={{
                              backgroundColor: tag.color || '#6b7280',
                              color: getContrastColor(tag.color || '#6b7280'),
                              borderColor: `${tag.color || '#6b7280'}4d`
                          }}
                          className="px-1.5 py-0.5 rounded-xs text-xs font-bold border"
                      >
                      {tag.label}
                    </span>
                  )
                })}
                    </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isLocal && onEdit && (
                  <button
                      onClick={(e) => { e.stopPropagation(); onEdit(); }}
                      className="text-gray-600 hover:text-blue-500 p-1 transition-colors"
                      title="Modifier le build"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
              )}

              {isLocal && onPublish && apiBuildotheque.isAuthenticated() && (
                  <button
                      onClick={(e) => { e.stopPropagation(); onPublish(); }}
                      className="text-gray-600 hover:text-emerald-500 p-1 transition-colors"
                      title="Publier sur la Buildothèque"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
              )}

              {onDelete && isAuthor && (
                  <button
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      className="text-gray-600 hover:text-red-500 p-1 transition-colors"
                      title={isLocal ? "Supprimer de la bibliothèque locale" : "Supprimer de la Buildothèque communautaire"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-6 italic">
            {build.description || "Aucune description fournie."}
          </p>

          <div>
            <div className="grid grid-cols-3 gap-2 pb-3">
              <ItemMini item={resolved.weapons[0]} slot="w1" />
              <ItemMini item={resolved.weapons[1]} slot="w2" />
              <ItemMini item={resolved.sidearm} slot="sa" />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/5 pt-3 pb-3">
              <ItemMini item={resolved.gear.masque} ensemble={resolvedEnsembles.masque} slot="masque" />
              <ItemMini item={resolved.gear.sac_a_dos} ensemble={resolvedEnsembles.sac_a_dos} slot="sac_a_dos" />
              <ItemMini item={resolved.gear.torse} ensemble={resolvedEnsembles.torse} slot="torse" />
              <ItemMini item={resolved.gear.gants} ensemble={resolvedEnsembles.gants} slot="gants" />
              <ItemMini item={resolved.gear.holster} ensemble={resolvedEnsembles.holster} slot="holster" />
              <ItemMini item={resolved.gear.genouilleres} ensemble={resolvedEnsembles.genouilleres} slot="genouilleres" />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
              <ItemMini item={resolved.skills[0]} slot="s1" />
              <ItemMini item={resolved.skills[1]} slot="s2" />
            </div>
          </div>
        </div>

        <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="w-full py-3 bg-tactical-bg hover:bg-shd/10 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-shd border-t border-tactical-border transition-all flex items-center justify-center gap-2"
        >
          Consulter le build
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
  )
}