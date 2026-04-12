import { useState, useMemo, useEffect } from 'react'
import { normalizeText } from '../../utils/textUtils'
import { resolveAttribut, resolveAsset, GameIcon } from '../common/GameAssets.jsx'

const CAT_COLORS = {
  offensif: 'text-red-400',
  defensif: 'text-blue-400',
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
export default function AttributePicker({ attributs, ensembles, marque, piece, cible, categorie, essentiel, exclude = [], onSelect, onClose }) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = useMemo(() => {
    if (!attributs) return []
    const listRaw = Array.isArray(attributs) ? attributs : Object.entries(attributs).map(([slug, a]) => ({ ...a, slug }))
    let list = listRaw.filter(a => a.cible?.includes(cible))
    // Filtrer les attributs non sélectionnables
    list = list.filter(a => a.selectionable === true)
    // Séparer attributs essentiels et classiques
    if (essentiel === true) list = list.filter(a => a.estEssentiel === true)
    else if (essentiel === false) list = list.filter(a => !a.estEssentiel)
    if (categorie) list = list.filter(a => a.categorie === categorie)
    if (exclude.length > 0) {
      const excNorm = exclude.map(n => normalizeText(n))
      list = list.filter(a => 
        !excNorm.includes(normalizeText(a.nom)) && 
        !excNorm.includes(normalizeText(a.slug || ''))
      )
    }

    // Collecte des attributs de la pièce (priorité max)
    const pieceAttrSlugs = new Set()
    if (piece?.attributEssentiel) {
      piece.attributEssentiel.forEach(eas => {
        if (eas === 'offensif') pieceAttrSlugs.add('degats_armes')
        if (eas === 'defensif') pieceAttrSlugs.add('protection')
        if (eas === 'utilitaire') pieceAttrSlugs.add('tiers_de_competence')
        pieceAttrSlugs.add(eas)
      })
    }
    // Si la pièce a des attributs spécifiques (ex: attributs fixes sur pièces nommées)
    if (piece?.attributs) {
      piece.attributs.forEach(a => {
        if (a.nom) pieceAttrSlugs.add(a.nom)
      })
    }

    // Collecte des attributs de la marque passée en paramètre
    const currentBrandAttrSlugs = new Set()
    if (ensembles && marque && marque !== '*') {
      const ens = ensembles[marque]
      if (ens) {
        ;[ens.bonus1piece, ens.bonus2pieces, ens.bonus3pieces].forEach(bonus => {
          bonus?.attributs?.forEach(ba => currentBrandAttrSlugs.add(ba.slug))
        })
        ens.attributsEssentiels?.forEach(eas => {
          if (eas === 'offensif') currentBrandAttrSlugs.add('degats_armes')
          if (eas === 'defensif') currentBrandAttrSlugs.add('protection')
          if (eas === 'utilitaire') currentBrandAttrSlugs.add('tiers_de_competence')
          currentBrandAttrSlugs.add(eas)
        })
      }
    }

    if (search) {
      const s = normalizeText(search)
      
      // Recherche étendue aux marques : si la recherche correspond à une marque,
      // on inclut les attributs mentionnés dans ses bonus.
      const searchBrandAttrSlugs = new Set()
      if (ensembles) {
        Object.entries(ensembles).forEach(([slug, ens]) => {
          if (normalizeText(slug).includes(s) || normalizeText(ens.nom).includes(s)) {
            // Collecte des attributs de cette marque
            ;[ens.bonus1piece, ens.bonus2pieces, ens.bonus3pieces].forEach(bonus => {
              bonus?.attributs?.forEach(ba => searchBrandAttrSlugs.add(ba.slug))
            })
            ens.attributsEssentiels?.forEach(eas => {
              if (eas === 'offensif') searchBrandAttrSlugs.add('degats_armes')
              if (eas === 'defensif') searchBrandAttrSlugs.add('protection')
              if (eas === 'utilitaire') searchBrandAttrSlugs.add('tiers_de_competence')
              searchBrandAttrSlugs.add(eas)
            })
          }
        })
      }

      list = list.filter(a => 
        normalizeText(a.nom).includes(s) || 
        searchBrandAttrSlugs.has(a.slug)
      )
    }

    // Tri pour mettre les attributs de la pièce d'abord, puis de la marque actuelle en haut, puis par catégorie/nom
    return list.map(a => ({
      ...a,
      isPieceRecommended: pieceAttrSlugs.has(a.slug),
      isBrandRecommended: currentBrandAttrSlugs.has(a.slug)
    })).sort((a, b) => {
      // Priorité 1: Attributs de la pièce
      if (a.isPieceRecommended && !b.isPieceRecommended) return -1
      if (!a.isPieceRecommended && b.isPieceRecommended) return 1
      
      // Priorité 2: Attributs de la marque
      if (a.isBrandRecommended && !b.isBrandRecommended) return -1
      if (!a.isBrandRecommended && b.isBrandRecommended) return 1
      
      // Sinon tri alphabétique classique
      return a.nom.localeCompare(b.nom, 'fr')
    })
  }, [attributs, ensembles, marque, piece, cible, categorie, essentiel, exclude, search])

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
              <GameIcon src={resolveAsset(resolveAttribut(attr))} alt="" size="w-4 h-4" className="opacity-60" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white group-hover:text-shd transition-colors flex items-center gap-2">
                  <span>{attr.nom}</span>
                  {attr.isPieceRecommended && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded uppercase font-bold tracking-tighter">
                      Pièce
                    </span>
                  )}
                  {attr.isBrandRecommended && !attr.isPieceRecommended && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded uppercase font-bold tracking-tighter">
                      Marque
                    </span>
                  )}
                </div>
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

