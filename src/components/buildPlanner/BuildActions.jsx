import { useState } from 'react'
import { useBuild } from '../../context/BuildContext'
import { generateShareUrl } from '../../utils/buildShare'

export default function BuildActions() {
  const {
    specialWeapon, weapons, weaponTalents, weaponAttributes, weaponMods,
    sidearm, sidearmTalent, sidearmAttribute, sidearmMods,
    gear, gearTalents, gearAttributes, gearMods,
    skills, skillMods,
    dispatch
  } = useBuild()
  const [showSaves, setShowSaves] = useState(false)
  const [shareStatus, setShareStatus] = useState(null) // null | 'copied' | 'error'

  const buildState = {
    specialWeapon, weapons, weaponTalents, weaponAttributes, weaponMods,
    sidearm, sidearmTalent, sidearmAttribute, sidearmMods,
    gear, gearTalents, gearAttributes, gearMods,
    skills, skillMods,
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
      // Fallback : prompt
      prompt('Copiez ce lien :', url)
      setShareStatus('copied')
    }
    setTimeout(() => setShareStatus(null), 3000)
  }

  const saveBuild = () => {
    const name = prompt('Nom du build :')
    if (!name) return
    const saves = JSON.parse(localStorage.getItem('div2_builds') || '{}')
    saves[name] = { ...buildState, savedAt: new Date().toISOString() }
    localStorage.setItem('div2_builds', JSON.stringify(saves))
    alert(`Build "${name}" sauvegardé !`)
  }

  const loadBuild = (name) => {
    const saves = JSON.parse(localStorage.getItem('div2_builds') || '{}')
    if (saves[name]) {
      dispatch({ type: 'LOAD_BUILD', build: saves[name] })
      setShowSaves(false)
    }
  }

  const deleteBuild = (name) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    const saves = JSON.parse(localStorage.getItem('div2_builds') || '{}')
    delete saves[name]
    localStorage.setItem('div2_builds', JSON.stringify(saves))
    setShowSaves(s => !s)
    setTimeout(() => setShowSaves(true), 10)
  }

  const reset = () => {
    if (confirm('Réinitialiser le build ?')) dispatch({ type: 'RESET' })
  }

  const saves = JSON.parse(localStorage.getItem('div2_builds') || '{}')
  const saveKeys = Object.keys(saves)

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
        💾 Sauvegarder
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
          <div className="max-h-64 overflow-y-auto">
            {saveKeys.length === 0 ? (
              <p className="text-gray-500 text-xs p-4 text-center uppercase tracking-widest">Aucun build</p>
            ) : (
              saveKeys.map(name => (
                <div key={name} className="flex items-center justify-between px-4 py-3 border-b border-tactical-border/50 hover:bg-tactical-hover transition-colors">
                  <div>
                    <div className="text-white text-sm font-bold">{name}</div>
                    <div className="text-xs text-gray-500">
                      {saves[name].savedAt ? new Date(saves[name].savedAt).toLocaleDateString('fr-FR') : ''}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => loadBuild(name)} className="px-2 py-1 rounded text-xs font-bold text-shd bg-shd/10 border border-shd/30 hover:bg-shd/20">
                      Charger
                    </button>
                    <button onClick={() => deleteBuild(name)} className="px-2 py-1 rounded text-xs font-bold text-red-400 bg-red-900/10 border border-red-500/20 hover:bg-red-900/30">
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
