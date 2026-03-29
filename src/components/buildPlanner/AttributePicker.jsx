import { useState, useMemo, useEffect } from 'react'
import { resolveAttributeIcon, GameIcon } from '../../utils/gameAssets'

const CAT_COLORS = {
  offensif: 'text-red-400',
  'défensif': 'text-blue-400',
  utilitaire: 'text-yellow-400',
}

/**
 * Modal de sélection d'un attribut depuis le référentiel attributs.jsonc.
 * @param {Array} attributs - Liste complète des attributs (data.attributs)
 * @param {string} cible - "arme" ou "equipement"
 * @param {string} [categorie] - Filtre optionnel : "offensif", "defensif", "utilitaire"
 * @param {boolean} [essentiel] - Si true, affiche uniquement les attributs essentiels ; si false, uniquement les classiques
 * @param {string[]} [exclude] - Noms d'attributs déjà sélectionnés à exclure
 * @param {function} onSelect - Callback({nom, valeur, min, max, unite, categorie})
 * @param {function} onClose
 */
export default function AttributePicker({ attributs, cible, categorie, essentiel, exclude = [], onSelect, onClose }) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = useMemo(() => {
    if (!attributs) return []
    const listRaw = Array.isArray(attributs) ? attributs : Object.values(attributs)
    let list = listRaw.filter(a => a.cible?.includes(cible))
    // Filtrer les attributs non sélectionnables
    list = list.filter(a => a.selectionable === true)
    // Séparer attributs essentiels et classiques
    if (essentiel === true) list = list.filter(a => a.estEssentiel === true)
    else if (essentiel === false) list = list.filter(a => !a.estEssentiel)
    if (categorie) list = list.filter(a => a.categorie === categorie)
    if (exclude.length > 0) {
      const excLow = exclude.map(n => (n || '').toLowerCase())
      list = list.filter(a => 
        !excLow.includes(a.nom.toLowerCase()) && 
        !excLow.includes((a.slug || '').toLowerCase())
      )
    }
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(a => a.nom.toLowerCase().includes(s))
    }
    return list
  }, [attributs, cible, categorie, exclude, search])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-tactical-panel border border-tactical-border rounded-lg w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-tactical-border flex justify-between items-center">
          <span className="text-sm text-white font-bold uppercase tracking-widest">Choisir un attribut</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>
        <div className="px-4 py-2 border-b border-tactical-border/50">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-tactical-bg border border-tactical-border rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-shd/50"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto p-2 flex-1">
          {filtered.length === 0 && (
            <p className="text-center text-gray-600 text-sm py-4">Aucun attribut disponible</p>
          )}
          {filtered.map(attr => (
            <button
              key={attr.slug || attr.nom}
              onClick={() => onSelect({ ...attr, valeur: attr.max })}
              className="w-full text-left px-3 py-2.5 rounded hover:bg-shd/10 transition-colors flex items-center gap-3 group"
            >
              <GameIcon src={resolveAttributeIcon(attr.categorie)} alt="" size="w-4 h-4" className="opacity-60" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white group-hover:text-shd transition-colors">{attr.nom}</div>
                <div className="text-xs text-gray-600">
                  <span className={CAT_COLORS[attr.categorie]}>{attr.categorie}</span>
                  {' · '}{attr.min}–{attr.max}{attr.unite}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

