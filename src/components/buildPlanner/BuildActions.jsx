import { useState } from 'react'
import { useBuild } from '../../context/BuildContext'
import { generateShareUrl, decodeBuild, resolveBuild } from '../../utils/buildShare'
import Dialog from '../common/Dialog'
import { apiBuildotheque } from '../../utils/apiBuildotheque'

export default function BuildActions({ data }) {
  const {
    specialWeapon, weapons, weaponTalents, weaponAttributes, weaponMods,
    specialWeaponBonusPoints,
    sidearm, sidearmTalent, sidearmAttribute, sidearmMods,
    gear, gearTalents, gearAttributes, gearMods,
    skills, skillMods, modValues,
    shdLevels,
    expertise, prototypes, prototypeTalents, weaponEssentialValues,
    editingInfo, dispatch
  } = useBuild()
  const [showSaves, setShowSaves] = useState(false)
  const [shareStatus, setShareStatus] = useState(null) // null | 'copied' | 'error'

  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    type: 'alert',
    defaultValue: '',
    onConfirm: () => {},
    onCancel: () => setDialog(prev => ({ ...prev, open: false }))
  })

  const showAlert = (title, message) => {
    setDialog(prev => ({
      ...prev,
      open: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => setDialog(p => ({ ...p, open: false })),
    }))
  }

  const showConfirm = (title, message, onConfirm) => {
    setDialog(prev => ({
      ...prev,
      open: true,
      title,
      message,
      type: 'confirm',
      onConfirm: (val) => {
        setDialog(p => ({ ...p, open: false }))
        if (val !== false) onConfirm()
      },
      onCancel: () => setDialog(p => ({ ...p, open: false }))
    }))
  }

  const showPrompt = (title, message, defaultValue, onConfirm, options = {}) => {
    setDialog(prev => ({
      ...prev,
      open: true,
      title,
      message,
      type: 'prompt',
      defaultValue,
      ...options,
      onConfirm: (val) => {
        setDialog(p => ({ ...p, open: false }))
        onConfirm(val)
      },
      onCancel: () => setDialog(p => ({ ...p, open: false }))
    }))
  }

  const buildState = {
    specialWeapon, weapons, weaponTalents, weaponAttributes, weaponMods,
    specialWeaponBonusPoints,
    sidearm, sidearmTalent, sidearmAttribute, sidearmMods,
    gear, gearTalents, gearAttributes, gearMods,
    skills, skillMods, modValues,
    shdLevels,
    expertise, prototypes, prototypeTalents, weaponEssentialValues,
  }

  const shareBuild = async () => {
    const url = generateShareUrl(buildState)
    if (!url) {
      setShareStatus('error')
      setTimeout(() => setShareStatus(null), 2000)
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('copied')
    } catch {
      // Fallback : Custom dialog instead of prompt
      showPrompt('Partager le build', 'Copiez ce lien :', url, () => {
        setShareStatus('copied')
      })
    }
    setTimeout(() => setShareStatus(null), 3000)
  }

  const saveBuild = () => {
    const isEditing = !!editingInfo
    const title = isEditing ? 'Mettre à jour le build' : 'Sauvegarder le build'
    const message = isEditing 
      ? 'Confirmez les informations pour mettre à jour votre build.' 
      : 'Donnez un nom et une description pour retrouver votre build plus tard.'
    
    const defaultNom = isEditing ? editingInfo.originalMetadata.nom : 'Mon Build'
    const defaultDesc = isEditing ? editingInfo.originalMetadata.description : ''
    const defaultTags = isEditing ? editingInfo.originalMetadata.tags : []

    showPrompt(title, message, defaultNom, async (val) => {
      const name = typeof val === 'object' ? val.name?.trim() : val?.trim()
      const description = typeof val === 'object' ? val.description?.trim() : ''
      const tags = typeof val === 'object' ? val.tags : []
      
      if (!name) return

      const encoded = generateShareUrl(buildState).split('b=')[1]
      
      if (isEditing) {
        if (editingInfo.type === 'local') {
          const saves = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')
          const index = saves.findIndex(b => b.encoded === editingInfo.id)
          
          if (index !== -1) {
            const updatedBuild = {
              ...saves[index],
              nom: name,
              description: description,
              tags: tags,
              encoded: encoded,
              timestamp: Date.now()
            }
            saves[index] = updatedBuild
            localStorage.setItem('div2_builds_v2', JSON.stringify(saves))
            
            dispatch({ 
              type: 'SET_EDITING_INFO', 
              editingInfo: { ...editingInfo, id: encoded, originalMetadata: { nom: name, description, tags } } 
            })
            
            showAlert('Succès', `Build "${name}" mis à jour localement !`)
          } else {
            // Si on ne le trouve plus par son ancien ID (encoded), on l'ajoute comme nouveau
            const buildToSave = {
              nom: name,
              description: description,
              tags: tags,
              encoded: encoded,
              timestamp: Date.now(),
              likes: 0
            }
            saves.push(buildToSave)
            localStorage.setItem('div2_builds_v2', JSON.stringify(saves))
            showAlert('Succès', `Build "${name}" sauvegardé !`)
          }
        } else if (editingInfo.type === 'api') {
           const baseUrl = apiBuildotheque.getBaseUrl(data.metadata?.buildLibraryApiUrl)
           const result = await apiBuildotheque.updateBuild(editingInfo.id, {
             nom: name,
             description,
             tags,
             encoded
           }, baseUrl)

           if (result) {
             // Mise à jour locale du cache si présent
             const saves = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')
             const localIndex = saves.findIndex(s => s.id === editingInfo.id || (s.encoded === encoded))
             if (localIndex !== -1) {
               saves[localIndex] = { ...saves[localIndex], nom: name, description, tags, encoded, timestamp: Date.now() }
               localStorage.setItem('div2_builds_v2', JSON.stringify(saves))
             }

             dispatch({ 
                type: 'SET_EDITING_INFO', 
                editingInfo: { ...editingInfo, originalMetadata: { nom: name, description, tags } } 
             })
             showAlert('Succès', `Build "${name}" mis à jour dans la Buildothèque !`)
           } else {
             showAlert('Erreur', 'Impossible de mettre à jour le build sur le serveur.')
           }
        }
        return
      }

      const saves = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')
      const exists = saves.some(b => b.nom.toLowerCase() === name.toLowerCase())
      
      if (exists) {
        showAlert('Nom déjà utilisé', `Un build nommé "${name}" existe déjà dans votre navigateur. Veuillez choisir un autre nom.`)
        return
      }

      const buildToSave = {
        nom: name,
        description: description,
        tags: tags,
        encoded: encoded,
        timestamp: Date.now(),
        likes: 0
      }

      saves.push(buildToSave)
      localStorage.setItem('div2_builds_v2', JSON.stringify(saves))
      showAlert('Succès', `Build "${name}" sauvegardé dans la Buildothèque !`)
    }, { 
      showDescription: true, 
      showTags: true, 
      defaultDescription: defaultDesc,
      defaultTags: defaultTags,
      availableTags: data?.buildsTags ? Object.values(data.buildsTags) : [],
      maxInputLength: 25,
      maxDescriptionLength: 500
    })
  }

  const loadBuild = (index) => {
    const saves = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')
    const savedBuild = saves[index]
    if (savedBuild && savedBuild.encoded) {
      const compact = decodeBuild(savedBuild.encoded)
      try {
        const build = resolveBuild(compact, data)
        if (build) {
          dispatch({ type: 'LOAD_BUILD', build })
          setShowSaves(false)
        }
      } catch (e) {
        console.error("Erreur lors du chargement du build", e)
        showAlert('Erreur', 'Impossible de charger ce build.')
      }
    }
  }

  const importFromText = () => {
    showPrompt(
      'Importer un build',
      'Collez l\'URL de partage ou le code Base64 directement :',
      '',
      (input) => {
        if (!input) return
        
        let encoded = input.trim()
        
        // Si c'est une URL, on tente d'extraire le paramètre 'b'
        if (encoded.includes('?b=')) {
          try {
            const url = new URL(encoded)
            encoded = url.searchParams.get('b') || encoded
          } catch {
            // Pas une URL valide mais contient ?b=, on tente une extraction manuelle
            encoded = encoded.split('?b=')[1]?.split('&')[0] || encoded
          }
        } else if (encoded.includes('/build/')) {
           // Autre format possible si l'URL est structurée différemment
           encoded = encoded.split('/build/')[1]?.split('?')[0] || encoded
        }

        const compact = decodeBuild(encoded)
        if (!compact) {
          showAlert('Erreur', 'Code ou URL invalide.')
          return
        }

        try {
          const build = resolveBuild(compact, data)
          if (build) {
            dispatch({ type: 'LOAD_BUILD', build })
            setShowSaves(false)
            showAlert('Succès', 'Build importé avec succès !')
          } else {
            showAlert('Erreur', 'Impossible de résoudre le build avec les données actuelles.')
          }
        } catch (error) {
          console.error('Error resolving build:', error)
          showAlert('Erreur', 'Une erreur est survenue lors de la résolution du build.')
        }
      }
    )
  }

  const deleteBuild = (index) => {
    const saves = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')
    const name = saves[index]?.nom || 'ce build'
    showConfirm('Supprimer le build', `Voulez-vous vraiment supprimer "${name}" ?`, () => {
      const newSaves = [...saves]
      newSaves.splice(index, 1)
      localStorage.setItem('div2_builds_v2', JSON.stringify(newSaves))
      setShowSaves(s => !s)
      setTimeout(() => setShowSaves(true), 10)
    })
  }

  const editBuild = (index) => {
    const saves = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')
    const build = saves[index]
    if (!build) return

    showPrompt('Modifier le build', 'Modifiez le nom, la description et les tags de votre build.', build.nom, (val) => {
      const name = typeof val === 'object' ? val.name?.trim() : val?.trim()
      const description = typeof val === 'object' ? val.description?.trim() : ''
      const tags = typeof val === 'object' ? val.tags : []
      
      if (!name) return

      const newSaves = [...saves]
      newSaves[index] = { ...build, nom: name, description, tags }
      localStorage.setItem('div2_builds_v2', JSON.stringify(newSaves))
      
      // Force refresh of the saves list in UI
      setShowSaves(false)
      setTimeout(() => setShowSaves(true), 10)
    }, { 
      showDescription: true, 
      showTags: true, 
      defaultDescription: build.description || '',
      defaultTags: build.tags || [],
      availableTags: data?.buildsTags ? Object.values(data.buildsTags) : [],
      maxInputLength: 25,
      maxDescriptionLength: 500
    })
  }

  const reset = () => {
    showConfirm('Réinitialiser', 'Voulez-vous vraiment réinitialiser tout le build ?', () => {
      dispatch({ type: 'RESET' })
    })
  }

  const saves = JSON.parse(localStorage.getItem('div2_builds_v2') || '[]')

  return (
    <div className="flex flex-wrap gap-2 relative">
      <button onClick={shareBuild}
        className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-all ${
          shareStatus === 'copied'
            ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/40'
            : shareStatus === 'error'
            ? 'bg-red-900/20 text-red-400 border-red-500/30'
            : 'bg-purple-900/20 text-purple-400 border-purple-500/30 hover:bg-purple-900/40'
        }`}>
        {shareStatus === 'copied' ? '✅ Lien copié !' : shareStatus === 'error' ? '❌ Build vide' : '🔗 Partager'}
      </button>
      <button onClick={saveBuild}
        className="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest bg-shd/20 text-shd border border-shd/40 hover:bg-shd/30 transition-all">
        {editingInfo ? '📝 Mettre à jour' : '💾 Sauvegarder'}
      </button>
      <button onClick={() => setShowSaves(!showSaves)}
        className="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest bg-blue-900/20 text-blue-400 border border-blue-500/30 hover:bg-blue-900/40 transition-all">
        📂 Charger
      </button>
      <button onClick={reset}
        className="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40 transition-all">
        🔄 Réinitialiser
      </button>

      {showSaves && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-tactical-panel border border-tactical-border rounded-lg shadow-xl z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-tactical-border flex justify-between items-center">
            <span className="text-sm font-bold text-white uppercase tracking-widest">Builds sauvegardés</span>
            <button onClick={() => setShowSaves(false)} className="text-gray-500 hover:text-shd">&times;</button>
          </div>
          <div className="p-2 border-b border-tactical-border/50">
            <button onClick={importFromText}
              className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/30 transition-all flex items-center justify-center gap-2">
              📥 Importer par texte/URL
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {saves.length === 0 ? (
              <p className="text-gray-500 text-xs p-4 text-center uppercase tracking-widest">Aucun build</p>
            ) : (
              saves.map((b, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-tactical-border/50 hover:bg-tactical-hover transition-colors">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-white text-sm font-bold truncate">{b.nom}</div>
                    <div className="text-xs text-gray-500 truncate italic">
                      {b.description || 'Pas de description'}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => loadBuild(i)} className="px-2 py-1 rounded text-xs font-bold text-shd bg-shd/10 border border-shd/30 hover:bg-shd/20" title="Charger">
                      📂
                    </button>
                    <button onClick={() => editBuild(i)} className="px-2 py-1 rounded text-xs font-bold text-blue-400 bg-blue-900/10 border border-blue-500/20 hover:bg-blue-900/30" title="Modifier">
                      ✏️
                    </button>
                    <button onClick={() => deleteBuild(i)} className="px-2 py-1 rounded text-xs font-bold text-red-400 bg-red-900/10 border border-red-500/20 hover:bg-red-900/30" title="Supprimer">
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Dialog {...dialog} />
    </div>
  )
}
