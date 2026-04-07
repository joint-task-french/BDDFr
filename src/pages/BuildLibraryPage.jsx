import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataLoader } from '../hooks/useDataLoader'
import { decodeBuild, resolveBuild } from '../utils/buildShare'
import Loader from '../components/common/Loader'
import { GameIcon, resolveAsset, GEAR_SLOT_ICONS_IMG, WEAPON_TYPE_ICONS } from '../components/common/GameAssets'
import { apiBuildotheque } from '../utils/apiBuildotheque'

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
    // Équipement : Priorité à l'icône de la marque/set (comme dans la DB)
    if (ensemble?.icon) {
      icon = resolveAsset(ensemble.icon) || resolveAsset(ensemble.slug)
    } else if (item?.marque) {
      icon = resolveAsset(item.marque)
    } else {
      icon = GEAR_SLOT_ICONS_IMG[slot]
    }
  }

  const name = isSkill ? item?.variante : item?.nom
  
  // Détermination des couleurs unifiées selon la rareté
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
      // Arme ou équipement classique -> Blanc (demande utilisateur)
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
  
  // API Integration states
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('buildLibraryApiUrl_override') || '')
  const [showSettings, setShowSettings] = useState(false)
  const [remoteBuilds, setRemoteBuilds] = useState([])
  const [user, setUser] = useState(apiBuildotheque.user)
  const [isApiLoading, setIsApiLoading] = useState(false)

  const effectiveApiUrl = apiUrl || data.metadata?.buildLibraryApiUrl || 'https://api.buildotheque.com'

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
    // Handle OAuth callback
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userData = params.get('user')
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        localStorage.setItem('buildLibrary_token', token)
        localStorage.setItem('buildLibrary_user', JSON.stringify(parsedUser))
        apiBuildotheque.token = token
        apiBuildotheque.user = parsedUser
        setUser(parsedUser)
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (e) {
        console.error("Erreur login Discord", e)
      }
    }
  }, [])

  useEffect(() => {
    if (data.metadata?.buildLibraryApiUrl) {
      loadRemoteBuilds()
    }
  }, [data.metadata, apiUrl])

  const loadRemoteBuilds = async () => {
    setIsApiLoading(true)
    const builds = await apiBuildotheque.fetchBuilds(effectiveApiUrl)
    setRemoteBuilds(Array.isArray(builds) ? builds : [])
    setIsApiLoading(false)
  }

  const handleLoginDiscord = () => {
    apiBuildotheque.loginDiscord(effectiveApiUrl)
  }

  const handleLogout = () => {
    apiBuildotheque.logout()
    setUser(null)
  }

  const handleSaveApiUrl = (newUrl) => {
    const trimmed = newUrl.trim()
    if (trimmed) {
      localStorage.setItem('buildLibraryApiUrl_override', trimmed)
    } else {
      localStorage.removeItem('buildLibraryApiUrl_override')
    }
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

  const handleEdit = (encoded) => {
    navigate(`/build?b=${encoded}`)
  }

  const handlePublish = async (build) => {
    if (!apiBuildotheque.isAuthenticated()) {
      alert("Connectez-vous via Discord pour publier un build.")
      return
    }

    if (window.confirm(`Publier "${build.nom}" sur la Buildothèque communautaire ?`)) {
      const result = await apiBuildotheque.publishBuild({
        nom: build.nom,
        description: build.description,
        tags: build.tags,
        encoded: build.encoded,
        auteur: user?.username || 'Anonyme'
      }, effectiveApiUrl)

      if (result) {
        alert("Build publié avec succès !")
        loadRemoteBuilds()
      } else {
        alert("Erreur lors de la publication.")
      }
    }
  }

  const handleDeleteRemote = async (buildId) => {
    if (window.confirm('Supprimer ce build de la Buildothèque communautaire ?')) {
      const success = await apiBuildotheque.deleteBuild(buildId, effectiveApiUrl)
      if (success) {
        alert("Build supprimé.")
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
    const filtered = localBuilds.filter(build => {
      const matchesSearch = !searchTerm || 
        build.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        build.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        build.auteur?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tagId => build.tags?.includes(tagId))
        
      return matchesSearch && matchesTags
    })
    return sortBuilds(filtered)
  }, [localBuilds, searchTerm, selectedTags, sortBy])

  const filteredPredefinedBuilds = useMemo(() => {
    // On combine les builds du fichier statique et ceux de l'API
    const combined = [
      ...(data.builds || []),
      ...remoteBuilds
    ]
    
    const filtered = combined.filter(build => {
      const matchesSearch = !searchTerm || 
        build.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        build.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        build.auteur?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tagId => build.tags?.includes(tagId))
        
      return matchesSearch && matchesTags
    })
    return sortBuilds(filtered)
  }, [data.builds, remoteBuilds, searchTerm, selectedTags, sortBy])

  const isSearching = !!(searchTerm || selectedTags.length > 0)

  const allFilteredBuilds = useMemo(() => {
    if (!isSearching) return []
    const combined = [
      ...filteredLocalBuilds.map(b => ({ ...b, isLocal: true })),
      ...filteredPredefinedBuilds.map(b => ({ ...b, isLocal: false }))
    ]
    
    // Si on a un tri spécifique, on trie globalement, sinon on garde l'ordre (local -> recommandé)
    if (sortBy === 'default') return combined
    return sortBuilds(combined)
  }, [isSearching, filteredLocalBuilds, filteredPredefinedBuilds, sortBy])

  if (loading) return <Loader progress={progress} />
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-4">Une erreur est survenue lors du chargement des données : {error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-shd text-white rounded">Réessayer</button>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
          Buildo<span className="text-shd">thèque</span>
        </h2>
        <p className="text-sm text-gray-500">Retrouvez vos configurations et les builds de la communauté</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-10 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <input 
              type="text"
              placeholder="Rechercher un build par nom, description ou auteur..."
              className="w-full bg-tactical-panel/50 border border-tactical-border rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-shd transition-all focus:ring-1 focus:ring-shd/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 md:flex-initial bg-tactical-panel/50 border border-tactical-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-shd transition-all focus:ring-1 focus:ring-shd/20 font-bold text-sm"
            >
              <option value="default">Tri par défaut</option>
              <option value="recent">Plus récents</option>
              <option value="old">Moins récents</option>
              <option value="likes_desc">Plus likés</option>
              <option value="likes_asc">Moins likés</option>
            </select>

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

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-tactical-border ml-2">
                {user.avatar && (
                  <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-shd/50" />
                )}
                <div className="hidden lg:block">
                  <div className="text-[10px] text-gray-500 uppercase font-black">Connecté en tant que</div>
                  <div className="text-xs text-white font-bold">{user.username}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Déconnexion"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLoginDiscord}
                className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-3 rounded-lg font-bold text-sm transition-colors ml-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.966 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.946 2.419-2.157 2.419z"/>
                </svg>
                Connexion
              </button>
            )}
          </div>
        </div>

        {/* API Settings Modal */}
        {showSettings && (
          <div className="p-4 bg-tactical-panel/80 border border-shd/30 rounded-lg animate-fade-in">
            <h4 className="text-xs font-black text-shd uppercase tracking-widest mb-3">Configuration de l'API</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                defaultValue={effectiveApiUrl}
                placeholder="URL de l'API (ex: https://api.buildotheque.com)"
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
            <p className="mt-2 text-[10px] text-gray-500 italic">
              Laissez vide pour utiliser l'API par défaut : {data.metadata?.buildLibraryApiUrl}
            </p>
          </div>
        )}

        {data.buildsTags && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Filtrer par tags :</span>
            {data.buildsTags.map(tag => {
              const isSelected = selectedTags.includes(tag.id)
              const colorBase = tag.color || 'gray'
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded text-xs font-black uppercase border transition-all duration-200 tracking-tighter ${
                    isSelected 
                      ? `bg-${colorBase}-500 text-white border-${colorBase}-500 shadow-lg shadow-${colorBase}-500/20 scale-105`
                      : `bg-tactical-panel/40 text-gray-400 border-tactical-border hover:border-gray-600`
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
              Résultats de la recherche ({allFilteredBuilds.length})
            </h3>
            {allFilteredBuilds.length === 0 ? (
              <div className="p-8 border border-dashed border-tactical-border rounded-lg text-center text-gray-500">
                Aucun build ne correspond à vos critères.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allFilteredBuilds.map((b, i) => (
                  <BuildCard 
                    key={b.id || b.encoded || i} 
                    build={b} 
                    data={data} 
                    onView={() => navigate(`/build?b=${b.encoded}`)}
                    onPublish={b.isLocal ? () => handlePublish(b) : undefined}
                    onDelete={b.isLocal ? () => handleDeleteLocal(b.encoded) : undefined}
                    isLocal={b.isLocal}
                    currentUser={user}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Section Local */}
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
                      key={b.encoded || i} 
                      build={b} 
                      data={data} 
                      onView={() => navigate(`/build?b=${b.encoded}`)}
                      onPublish={() => handlePublish(b)}
                      onDelete={() => handleDeleteLocal(b.encoded)}
                      isLocal
                      currentUser={user}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Section Prédéfinis */}
            {(data.builds?.length > 0 || remoteBuilds.length > 0) && (
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    Builds de la communauté ({filteredPredefinedBuilds.length})
                  </h3>
                  {isApiLoading && (
                    <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase animate-pulse">
                      Chargement API...
                    </div>
                  )}
                </div>
                {filteredPredefinedBuilds.length === 0 ? (
                  <div className="p-8 border border-dashed border-tactical-border rounded-lg text-center text-gray-500">
                    Aucun build communautaire ne correspond à vos critères.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPredefinedBuilds.map((b, i) => (
                      <BuildCard 
                        key={b.id || b.encoded || i} 
                        build={b} 
                        data={data} 
                        onView={() => navigate(`/build?b=${b.encoded}`)}
                        apiUrl={effectiveApiUrl}
                        currentUser={user}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function BuildCard({ build, data, onView, onEdit, onPublish, onDelete, isLocal, apiUrl, currentUser }) {
  const [likes, setLikes] = useState(build.likes || 0)
  const [isLiking, setIsLiking] = useState(false)

  const isAuthor = build.auteurId === currentUser?.id || (build.isLocal && !build.id)

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!apiBuildotheque.isAuthenticated()) {
      alert("Connectez-vous via Discord pour liker un build.")
      return
    }
    if (isLocal || !build.id) return // Ne peut pas liker un build local ou sans ID API

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

  // Extraction des éléments clés pour la vue rapide
  const spec = resolved.specialWeapon?.specialisation || 'Inconnue'
  const weapons = resolved.weapons.filter(Boolean)
  const gearPieces = Object.values(resolved.gear).filter(Boolean)
  
  // Compter les marques d'équipement pour identifier le set principal
  const resolvedEnsembles = useMemo(() => {
    const res = {}
    Object.entries(resolved.gear).forEach(([slot, item]) => {
      if (item?.marque) {
        // Recherche robuste de l'ensemble (insensible à la casse, slug ou clé directe)
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
    return build.tags.map(tagId => data.buildsTags.find(t => t.id === tagId)).filter(Boolean)
  }, [build.tags, data.buildsTags])

  // Utiliser les attributs résolus du build pour le compte des stats
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
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-black transition-all ${
                      isLiking ? 'opacity-50 cursor-wait' : 'hover:scale-110'
                    } text-shd/80 bg-shd/5 border-shd/20`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    {likes}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {build.auteur && (
                  <div className="text-[10px] text-shd/80 font-bold tracking-[0.2em] uppercase">
                    Par {build.auteur}
                  </div>
                )}
                {build.timestamp && (
                  <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
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

              {/* Tags display */}
              {buildTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {buildTags.map(tag => (
                    <span 
                      key={tag.id}
                      className={`px-1.5 py-0.5 rounded-xs text-xs font-bold border bg-${tag.color}-500/10 text-${tag.color}-400 border-${tag.color}-500/30`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {isLocal && onPublish && (
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

        <p className="text-sm text-gray-400 mb-6 line-clamp-2 h-10 italic">
          {build.description || "Aucune description fournie."}
        </p>

        {/* Vue Rapide Elements */}
        <div>
          {/* Ligne principale : Armes (Principal 1, 2 + Pistolet) */}
          <div className="grid grid-cols-3 gap-2 pb-3">
            <ItemMini item={resolved.weapons[0]} slot="w1" />
            <ItemMini item={resolved.weapons[1]} slot="w2" />
            <ItemMini item={resolved.sidearm} slot="sa" />
          </div>
          
          {/* Grille d'équipement (2 colonnes, 3 lignes) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/5 pt-3 pb-3">
            <ItemMini item={resolved.gear.masque} ensemble={resolvedEnsembles.masque} slot="masque" />
            <ItemMini item={resolved.gear.sac_a_dos} ensemble={resolvedEnsembles.sac_a_dos} slot="sac_a_dos" />

            <ItemMini item={resolved.gear.torse} ensemble={resolvedEnsembles.torse} slot="torse" />
            <ItemMini item={resolved.gear.gants} ensemble={resolvedEnsembles.gants} slot="gants" />

            <ItemMini item={resolved.gear.holster} ensemble={resolvedEnsembles.holster} slot="holster" />
            <ItemMini item={resolved.gear.genouilleres} ensemble={resolvedEnsembles.genouilleres} slot="genouilleres" />
          </div>

          {/* Ligne Compétences */}
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
