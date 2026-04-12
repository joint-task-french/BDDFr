import { useState, useMemo, useEffect } from 'react'
import { getAttrCategoryLabel } from '../../utils/formatters'
import { formatModAttributs } from '../../utils/modCompatibility'
import AttributeSlider from './AttributeSlider'
import AttributePicker from './AttributePicker'
import { useBuild } from '../../context/BuildContext'

/**
 * Determine le nombre d'attributs classiques autorisés.
 */
function getClassicSlotCount(piece) {
  if (!piece) return 0
  if (piece.attributs && Array.isArray(piece.attributs)) return piece.attributs.length
  if (piece.type === 'gear_set') return 1
  if (piece.type === 'improvise') return 2
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
  const attrList = Array.isArray(allAttributs) ? allAttributs : Object.values(allAttributs || {})
  const ref = attrList.find(a =>
      a.cible?.includes('equipement') &&
      a.categorie === categorie &&
      a.estEssentiel === true
  )
  if (!ref) return null
  return {
    ...ref,
    valeur: ref.max,
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
    const ens = (ensembles && !Array.isArray(ensembles))
        ? ensembles[piece.marque]
        : ensembles.find(e => e.slug === piece.marque || e.nom === piece.marque)
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
    'degats_armes': 'offensif',
    'protection': 'defensif',
    'tiers_de_competence': 'utilitaire',
    'tier_de_competence': 'utilitaire',
    // Noms textuels
    "Dégâts d'armes": 'offensif',
    "Dégâts d'arme": 'offensif',
    'Protection': 'defensif',
    'Tier de compétence': 'utilitaire',
    'Tiers de compétence': 'utilitaire',
    // Valeurs directes
    'offensif': 'offensif',
    'defensif': 'defensif',
    'défensif': 'defensif',
    'utilitaire': 'utilitaire',
    'random': 'random'
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
export default function GearAttributePanel({ piece, attributes, allAttributs, modsEquipements, gearMods, onChange, onChangeMod, attributsType, ensembles, isPrototype, slotKey, equipementsType, expertiseLevel }) {
  const { dispatch, modValues } = useBuild()
  const [pickerOpen, setPickerOpen] = useState(null)
  const [modPickerIndex, setModPickerIndex] = useState(null)

  const isExotic = piece?.type === 'exotique'
  const classicCount = getClassicSlotCount(piece)

  const pb = useMemo(() => {
    if (!slotKey || !equipementsType) return 0
    const base = equipementsType[slotKey]?.protectionBase || 0
    const grade = expertiseLevel || 0
    return Math.floor(base * (1 + grade * 0.01))
  }, [slotKey, equipementsType, expertiseLevel])

  // Calcul du nombre de mods possibles en fonction de piece.mod (booléen ou entier)
  const modCount = useMemo(() => {
    if (typeof piece?.mod === 'number') return piece.mod
    return piece?.mod ? 1 : 0
  }, [piece])

  // Sécurisation de gearMods pour s'assurer que c'est toujours un tableau
  const currentMods = useMemo(() => {
    if (!gearMods) return []
    return Array.isArray(gearMods) ? gearMods : [gearMods]
  }, [gearMods])

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

  // Pré-remplir les attributs par défaut (essentiels et classiques pour nommés/exos)
  useEffect(() => {
    if (!piece || !allAttributs) return
    const hasData = Array.isArray(allAttributs) ? allAttributs.length > 0 : Object.keys(allAttributs).length > 0
    if (!hasData) return

    let nextEss = [...essentiels]
    let nextCls = [...classiques]
    let changed = false

    // 1. Initialisation des essentiels si vide
    if (nextEss.length === 0) {
      if (isEssentialFixedByPiece) {
        nextEss = fixedEssentialCategories
            .map(cat => findDefaultEssentialAttr(allAttributs, cat))
            .filter(Boolean)
        if (nextEss.length > 0) changed = true
      } else {
        const cats = initialCategories
        if (cats && cats.length > 0) {
          const defaultAttr = findDefaultEssentialAttr(allAttributs, cats[0])
          if (defaultAttr) {
            nextEss = [defaultAttr]
            changed = true
          }
        }
      }
    }

    // 2. Initialisation des classiques si vide et présents sur la pièce (exotiques/nommés)
    if (nextCls.length === 0 && piece.attributs?.length > 0) {
      nextCls = piece.attributs.map(pa => {
        if (!pa || !pa.nom) return null // Slot vide

        // Recherche par slug direct d'abord, puis par nom
        const ref = allAttributs[pa.nom] || Object.values(allAttributs).find(a => a.nom === pa.nom || a.slug === pa.nom)
        if (!ref) return null
        const pMax = ref.maxPrototype ?? ref.prototypeMax ?? ref.max
        return {
          ...ref,
          valeur: pa.valeur ?? (isPrototype ? pMax : ref.max),
        }
      })
      if (nextCls.length > 0) changed = true
    }

    if (changed) {
      onChange({ essentiels: nextEss, classiques: nextCls })
    }
  }, [piece?.nom, allAttributs, ensembles]) // eslint-disable-line react-hooks/exhaustive-deps

  // Noms déjà utilisés
  const usedNames = useMemo(() => {
    const names = []
    essentiels.forEach(a => {
      if (a?.nom) names.push(a.nom)
      if (a?.slug) names.push(a.slug)
    })
    classiques.forEach(a => {
      if (a?.nom) names.push(a.nom)
      if (a?.slug) names.push(a.slug)
    })
    return names
  }, [essentiels, classiques])

  // Est-ce que l'attribut classique est fixé par la pièce ?
  // (nommés/exotiques avec attributs listés dans la donnée de la pièce)
  const isClassicFixedByIndex = (idx) => {
    if (!piece?.attributs || !Array.isArray(piece.attributs)) return false
    const attr = piece.attributs[idx]
    return !!(attr && attr.nom)
  }

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
        {/* Protection de base */}
        {pb > 0 && (
            <div className="flex items-center justify-between text-xs py-0.5 mb-1 px-1 bg-blue-500/5 rounded border border-blue-500/10">
              <div className="flex flex-col">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Protection de base</span>
                {expertiseLevel > 0 && <span className="text-xs text-blue-400/60 font-medium">Inclut Expertise (+{expertiseLevel}%)</span>}
              </div>
              <span className="text-blue-300 font-bold">{pb.toLocaleString('fr-FR')} pts</span>
            </div>
        )}

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
                isPrototype={isPrototype}
            />
        )}

        {/* Attributs classiques */}
        {Array.from({ length: classicCount }).map((_, i) => (
            <AttributeSlider
                key={`classic-${i}`}
                attribute={classiques[i] || null}
                readOnly={isClassicFixedByIndex(i)}
                onChange={(attr) => setClassic(i, attr)}
                onPick={() => setPickerOpen(`classic-${i}`)}
                onRemove={isClassicFixedByIndex(i) ? null : () => setClassic(i, null)}
                label={`Attribut ${i + 1}`}
                isPrototype={isPrototype}
            />
        ))}

        {/* Mods d'équipement */}
        {modCount > 0 && (
            <div className="pt-1">
              <div className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">
                {modCount > 1 ? 'Mods' : 'Mod'}
              </div>
              {Array.from({ length: modCount }).map((_, idx) => {
                const currentMod = currentMods[idx]
                return (
                    <div key={`mod-${idx}`} className="mb-1">
                      {currentMod ? (
                          <>
                            <div className="flex items-center gap-1.5 py-0.5">
                    <span className="text-xs text-gray-300 truncate relative group/gmod cursor-default">
                      {modCount > 1 && <span className="text-gray-500 mr-1">{idx + 1}.</span>}
                      {currentMod.nom}
                      {(currentMod.attributs || currentMod.bonus) && (
                          <span className="absolute left-0 bottom-full mb-1 z-50 hidden group-hover/gmod:block bg-tactical-panel border border-tactical-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
                          <span className="block text-xs text-green-400">{formatModAttributs(currentMod, allAttributs)}</span>
                            {currentMod.categorie && <span className="block text-xs text-gray-500">{currentMod.categorie}</span>}
                        </span>
                      )}
                    </span>
                              <button
                                  onClick={() => onChangeMod(null, idx)}
                                  className="text-gray-600 hover:text-red-400 text-xs ml-auto shrink-0"
                              >✕</button>
                            </div>
                            {currentMod.attributs && currentMod.attributs.map((entry) => {
                              if (entry.valeur != null) return null
                              const attrDef = allAttributs?.[entry.attribut]
                              if (!attrDef || attrDef.min == null || attrDef.max == null || attrDef.min === attrDef.max) return null
                              const userVal = modValues?.gearMods?.[slotKey]?.[idx]?.[entry.attribut]
                              const val = userVal != null ? userVal : attrDef.max
                              const unite = attrDef.unite || '%'
                              const step = unite === 'pts' || unite === 'pts/s' ? 1 : 0.1
                              return (
                                  <div key={entry.attribut} className="mt-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-400 truncate">{attrDef.nom}</span>
                                      <span className="text-green-400 font-bold shrink-0">{unite === 'pts' || unite === 'pts/s' ? val.toLocaleString('fr-FR') : val}{unite}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={attrDef.min}
                                        max={attrDef.max}
                                        step={step}
                                        value={val}
                                        onChange={(e) => dispatch({ type: 'SET_GEAR_MOD_VALUE', slot: slotKey, modIndex: idx, attrSlug: entry.attribut, valeur: parseFloat(e.target.value) })}
                                        className="attr-slider mt-0.5"
                                    />
                                  </div>
                              )
                            })}
                          </>
                      ) : (
                          <button
                              onClick={() => setModPickerIndex(idx)}
                              className="text-xs text-shd/40 hover:text-shd transition-colors"
                          >
                            + Mod {modCount > 1 ? idx + 1 : ''}
                          </button>
                      )}
                    </div>
                )
              })}
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
        {modPickerIndex !== null && (
            <GearModPicker
                mods={modsEquipements}
                allAttributs={allAttributs}
                onSelect={(mod) => { onChangeMod(mod, modPickerIndex); setModPickerIndex(null) }}
                onClose={() => setModPickerIndex(null)}
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
    const modsList = Array.isArray(mods) ? mods : Object.values(mods)
    let list = modsList.filter(m => !m.estExotique)
    if (!search) return list
    const s = search.toLowerCase()
    return list.filter(m =>
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