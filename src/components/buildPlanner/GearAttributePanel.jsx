import { useState, useMemo, useEffect } from 'react'
import { getAttrCategoryLabel } from '../../utils/formatters'
import { formatModAttributs } from '../../utils/modCompatibility'
import AttributeSlider from './AttributeSlider'
import AttributePicker from './AttributePicker'

/**
 * Determine le nombre d'attributs classiques autorisés.
 */
function getClassicSlotCount(piece) {
  if (!piece) return 0
  if (piece.type === 'gear_set') return 1
  if (piece.type === 'exotique') {
    const essCount = Array.isArray(piece.attributEssentiel) ? piece.attributEssentiel.length : 0
    return essCount >= 3 ? 1 : 2
  }
  return 2
}

/**
 * Trouve le premier attribut essentiel d'une catégorie donnée dans le référentiel.
 * Pour les équipements, l'attribut essentiel est l'un des 3 core attributes (offensif/défensif/utilitaire).
 */
function findDefaultEssentialAttr(allAttributs, categorie) {
  if (!allAttributs || !categorie) return null
  const ref = allAttributs.find(a =>
    a.cible?.includes('equipement') &&
    a.categorie === categorie &&
    a.estEssentiel === true
  )
  if (!ref) return null
  return {
    nom: ref.nom,
    slug: ref.slug,
    valeur: ref.max,
    min: ref.min,
    max: ref.max,
    unite: ref.unite,
    categorie: ref.categorie,
  }
}

/**
 * Résout la catégorie essentielle initiale depuis l'ensemble lié.
 * Retourne la catégorie par défaut pour le premier attribut essentiel.
 */
function resolveInitialEssentialCategory(piece, ensembles) {
  if (!piece) return null
  // Exotiques avec attributEssentiel: utiliser les catégories listées
  if (Array.isArray(piece.attributEssentiel) && piece.attributEssentiel.length > 0) {
    return piece.attributEssentiel
  }
  // Sinon chercher dans l'ensemble lié pour pré-remplir
  if (piece.marque && piece.marque !== '*' && ensembles) {
    const ens = ensembles.find(e => e.slug === piece.marque || e.nom === piece.marque)
    if (ens?.attributsEssentiels && ens.attributsEssentiels.length > 0) {
      return mapEssentialNames(ens.attributsEssentiels)
    }
  }
  return null
}

/**
 * Mappe les valeurs d'attributsEssentiels depuis les ensembles vers les catégories.
 * Les ensembles utilisent des slugs (degats_arme, protection, tiers_de_competence)
 * et parfois des noms textuels français.
 */
function mapEssentialNames(names) {
  const map = {
    // Slugs utilisés dans ensembles.jsonc
    'degats_arme': 'offensif',
    'protection': 'défensif',
    'tiers_de_competence': 'utilitaire',
    // Noms textuels (rétrocompatibilité)
    "Dégâts d'armes": 'offensif',
    "Dégâts d'arme": 'offensif',
    'Protection': 'défensif',
    'Tier de compétence': 'utilitaire',
    'Tiers de compétence': 'utilitaire',
  }
  return names.map(n => map[n] || n).filter(Boolean)
}

/**
 * Panneau d'attributs + mod inline pour un équipement dans le build planner.
 *
 * L'attribut essentiel d'un équipement est l'un des 3 core attributes
 * (Dégâts d'armes / Protection / Tier de compétence) et peut être changé
 * entre les 3 sans restriction. Sa valeur est modifiable dans la range.
 *
 * Pour les exotiques avec attributEssentiel fixé par la pièce, l'attribut
 * est pré-rempli et non remplaçable.
 */
export default function GearAttributePanel({ piece, attributes, allAttributs, modsEquipements, gearMod, onChange, onChangeMod, attributsType, ensembles }) {
  const [pickerOpen, setPickerOpen] = useState(null)
  const [modPickerOpen, setModPickerOpen] = useState(false)

  const isExotic = piece?.type === 'exotique'
  const classicCount = getClassicSlotCount(piece)
  const hasMod = piece?.mod === true

  // Est-ce que l'attribut essentiel est fixé par la pièce elle-même ?
  // (exotiques avec attributEssentiel listé dans la donnée de la pièce)
  const isEssentialFixedByPiece = useMemo(() => {
    return Array.isArray(piece?.attributEssentiel) && piece.attributEssentiel.length > 0
  }, [piece])

  // Catégories essentielles fixées par la pièce (exotiques uniquement)
  const fixedEssentialCategories = useMemo(() => {
    if (!isEssentialFixedByPiece) return []
    return piece.attributEssentiel
  }, [piece, isEssentialFixedByPiece])

  // Catégorie par défaut initiale depuis l'ensemble (pour pré-remplissage)
  const initialCategories = useMemo(() => {
    return resolveInitialEssentialCategory(piece, ensembles)
  }, [piece, ensembles])

  const essentiels = attributes?.essentiels || []
  const classiques = attributes?.classiques || []

  // Pré-remplir les attributs essentiels par défaut
  useEffect(() => {
    if (!piece || !allAttributs || !allAttributs.length) return
    if (essentiels.length > 0 && essentiels[0]) return

    if (isEssentialFixedByPiece) {
      // Exotiques : pré-remplir avec les catégories fixées
      const newEss = fixedEssentialCategories
        .map(cat => findDefaultEssentialAttr(allAttributs, cat))
        .filter(Boolean)
      if (newEss.length > 0) {
        onChange({ essentiels: newEss, classiques })
      }
    } else {
      // Résoudre la catégorie depuis l'ensemble
      const cats = initialCategories
      if (cats && cats.length > 0) {
        const defaultAttr = findDefaultEssentialAttr(allAttributs, cats[0])
        if (defaultAttr) {
          onChange({ essentiels: [defaultAttr], classiques })
        }
      }
    }
  }, [piece?.nom, allAttributs?.length, ensembles?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Noms déjà utilisés
  const usedNames = useMemo(() => {
    const names = []
    essentiels.forEach(a => { if (a?.nom) names.push(a.nom) })
    classiques.forEach(a => { if (a?.nom) names.push(a.nom) })
    return names
  }, [essentiels, classiques])

  const updateAttributes = (newEss, newClassiques) => {
    onChange({ essentiels: newEss, classiques: newClassiques })
  }

  const setEssential = (idx, attr) => {
    const ess = [...essentiels]
    ess[idx] = attr
    updateAttributes(ess, classiques)
  }

  const setClassic = (idx, attr) => {
    const cls = [...classiques]
    cls[idx] = attr
    updateAttributes(essentiels, cls)
  }

  if (!piece) return null

  return (
    <div className="mt-2 pt-2 border-t border-tactical-border/30 space-y-0.5">
      {/* Attributs essentiels */}
      {isExotic && isEssentialFixedByPiece ? (
        /* Exotiques avec attributs fixés : un slider par catégorie fixée, non remplaçable */
        fixedEssentialCategories.map((cat, i) => {
          const catLabel = getAttrCategoryLabel(attributsType, cat)
          const existing = essentiels[i]
          return (
            <AttributeSlider
              key={`ess-${i}`}
              attribute={existing || null}
              readOnly={false}
              locked
              onChange={(attr) => setEssential(i, attr)}
              label={`Essentiel ${catLabel}`}
            />
          )
        })
      ) : (
        /* Équipement normal : 1 attribut essentiel, interchangeable entre les 3 core attributes */
        <AttributeSlider
          attribute={essentiels[0] || null}
          onChange={(attr) => setEssential(0, attr)}
          onPick={() => setPickerOpen('essential-0')}
          onRemove={() => setEssential(0, null)}
          label="Essentiel"
        />
      )}

      {/* Attributs classiques */}
      {Array.from({ length: classicCount }).map((_, i) => (
        <AttributeSlider
          key={`classic-${i}`}
          attribute={classiques[i] || null}
          onChange={(attr) => setClassic(i, attr)}
          onPick={() => setPickerOpen(`classic-${i}`)}
          onRemove={() => setClassic(i, null)}
          label={`Attribut ${i + 1}`}
        />
      ))}

      {/* Mod d'équipement */}
      {hasMod && (
        <div className="pt-1">
          <div className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Mod</div>
          {gearMod ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="text-xs text-gray-300 truncate relative group/gmod cursor-default">
                {gearMod.nom}
                {(gearMod.attributs || gearMod.bonus) && (
                  <span className="absolute left-0 bottom-full mb-1 z-50 hidden group-hover/gmod:block bg-tactical-panel border border-tactical-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
                    <span className="block text-xs text-green-400">{formatModAttributs(gearMod, allAttributs)}</span>
                    {gearMod.categorie && <span className="block text-xs text-gray-500">{gearMod.categorie}</span>}
                  </span>
                )}
              </span>
              <button
                onClick={() => onChangeMod(null)}
                className="text-gray-600 hover:text-red-400 text-xs ml-auto shrink-0"
              >✕</button>
            </div>
          ) : (
            <button
              onClick={() => setModPickerOpen(true)}
              className="text-xs text-shd/40 hover:text-shd transition-colors"
            >
              + Mod
            </button>
          )}
        </div>
      )}

      {/* Picker attribut essentiel : pas de filtre catégorie, uniquement les essentiels d'équipement */}
      {pickerOpen === 'essential-0' && (
        <AttributePicker
          attributs={allAttributs}
          cible="equipement"
          essentiel={true}
          exclude={usedNames}
          onSelect={(attr) => { setEssential(0, attr); setPickerOpen(null) }}
          onClose={() => setPickerOpen(null)}
        />
      )}

      {/* Picker attribut classique */}
      {pickerOpen && pickerOpen.startsWith('classic-') && (
        <AttributePicker
          attributs={allAttributs}
          cible="equipement"
          essentiel={false}
          exclude={usedNames}
          onSelect={(attr) => {
            const idx = parseInt(pickerOpen.split('-')[1])
            setClassic(idx, attr)
            setPickerOpen(null)
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}

      {/* Picker mod équipement */}
      {modPickerOpen && (
        <GearModPicker
          mods={modsEquipements}
          allAttributs={allAttributs}
          onSelect={(mod) => { onChangeMod(mod); setModPickerOpen(false) }}
          onClose={() => setModPickerOpen(false)}
        />
      )}
    </div>
  )
}

/** Mini-picker pour sélectionner un mod d'équipement */
function GearModPicker({ mods, allAttributs, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = useMemo(() => {
    if (!mods) return []
    if (!search) return mods
    const s = search.toLowerCase()
    return mods.filter(m =>
      (m.nom || '').toLowerCase().includes(s) ||
      (m.categorie || '').toLowerCase().includes(s) ||
      formatModAttributs(m, allAttributs).toLowerCase().includes(s)
    )
  }, [mods, allAttributs, search])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-tactical-panel border border-tactical-border rounded-lg w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-tactical-border flex justify-between items-center">
          <span className="text-sm text-white font-bold uppercase tracking-widest">Mod d'équipement</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>
        <div className="px-4 py-2 border-b border-tactical-border/50">
          <input
            type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-tactical-bg border border-tactical-border rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-shd/50"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto p-2 flex-1">
          {filtered.length === 0 && <p className="text-center text-gray-600 text-sm py-4">Aucun mod</p>}
          {filtered.map((mod, i) => (
            <button key={mod.slug || i} onClick={() => onSelect(mod)}
              className="w-full text-left px-3 py-2 rounded hover:bg-shd/10 transition-colors group"
            >
              <div className="text-sm text-white group-hover:text-shd">{mod.nom}</div>
              <div className="flex gap-3 text-xs">
                <span className="text-green-400">{formatModAttributs(mod, allAttributs)}</span>
                {mod.categorie && <span className="text-gray-500">{mod.categorie}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

