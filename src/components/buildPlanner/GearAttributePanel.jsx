import { useState, useMemo, useEffect } from 'react'
import { ATTR_CATEGORY_LABELS } from '../../utils/formatters'
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
 * Trouve le premier attribut essentiel d'une catégorie donnée dans le référentiel
 */
function findDefaultAttr(allAttributs, categorie) {
  if (!allAttributs || !categorie) return null
  const ref = allAttributs.find(a => a.cible?.includes('equipement') && a.categorie === categorie && a.estEssentiel === true)
  if (!ref) return null
  return { nom: ref.nom, valeur: ref.max, min: ref.min, max: ref.max, unite: ref.unite, categorie: ref.categorie }
}

/**
 * Panneau d'attributs + mod inline pour un équipement dans le build planner.
 */
export default function GearAttributePanel({ piece, attributes, allAttributs, modsEquipements, gearMod, onChange, onChangeMod }) {
  const [pickerOpen, setPickerOpen] = useState(null)
  const [modPickerOpen, setModPickerOpen] = useState(false)

  const isExotic = piece?.type === 'exotique'
  const classicCount = getClassicSlotCount(piece)
  const hasMod = piece?.mod === true

  // Attributs essentiels de la pièce
  const essentialCategories = useMemo(() => {
    if (!piece) return []
    return Array.isArray(piece.attributEssentiel) ? piece.attributEssentiel : []
  }, [piece])

  const essentiels = attributes?.essentiels || []
  const classiques = attributes?.classiques || []

  // Pré-remplir l'attribut essentiel par défaut quand une pièce est sélectionnée
  useEffect(() => {
    if (!piece || isExotic || !allAttributs) return
    if (essentiels[0]) return // déjà rempli
    if (essentialCategories.length === 0) return
    const defaultAttr = findDefaultAttr(allAttributs, essentialCategories[0])
    if (defaultAttr) {
      onChange({ essentiels: [defaultAttr], classiques })
    }
  }, [piece?.nom]) // eslint-disable-line react-hooks/exhaustive-deps

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
      {isExotic ? (
        essentialCategories.map((cat, i) => {
          const catLabel = ATTR_CATEGORY_LABELS[cat] || cat
          const existing = essentiels[i]
          return (
            <div key={i} className="flex items-center gap-1 py-0.5">
              <span className="text-[9px] text-gray-600 uppercase tracking-widest">Essentiel {catLabel}</span>
              {existing ? (
                <span className="text-[10px] text-gray-400 ml-auto">{existing.nom}: {existing.valeur}{existing.unite || ''}</span>
              ) : (
                <span className="text-[10px] text-gray-600 ml-auto">{catLabel}</span>
              )}
            </div>
          )
        })
      ) : (
        <AttributeSlider
          attribute={essentiels[0] || null}
          onChange={(attr) => setEssential(0, attr)}
          onPick={() => setPickerOpen('essential-0')}
          onRemove={() => setEssential(0, null)}
          label={`Essentiel${essentialCategories[0] ? ` (${ATTR_CATEGORY_LABELS[essentialCategories[0]] || essentialCategories[0]})` : ''}`}
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
          <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Mod</div>
          {gearMod ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="text-[10px] text-gray-300 truncate relative group/gmod cursor-default">
                {gearMod.statistique}
                {gearMod.valeurMax && (
                  <span className="absolute left-0 bottom-full mb-1 z-50 hidden group-hover/gmod:block bg-tactical-panel border border-tactical-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
                    <span className="block text-[10px] text-green-400">{gearMod.valeurMax}</span>
                    {gearMod.categorie && <span className="block text-[10px] text-gray-500">{gearMod.categorie}</span>}
                  </span>
                )}
              </span>
              <button
                onClick={() => onChangeMod(null)}
                className="text-gray-600 hover:text-red-400 text-[10px] ml-auto shrink-0"
              >✕</button>
            </div>
          ) : (
            <button
              onClick={() => setModPickerOpen(true)}
              className="text-[10px] text-shd/40 hover:text-shd transition-colors"
            >
              + Mod
            </button>
          )}
        </div>
      )}

      {/* Picker attribut */}
      {pickerOpen && (
        <AttributePicker
          attributs={allAttributs}
          cible="equipement"
          essentiel={pickerOpen.startsWith('essential-') ? true : false}
          categorie={
            pickerOpen.startsWith('essential-') && essentialCategories[0] && !isExotic
              ? essentialCategories[0]
              : undefined
          }
          exclude={usedNames}
          onSelect={(attr) => {
            if (pickerOpen.startsWith('essential-')) {
              const idx = parseInt(pickerOpen.split('-')[1])
              setEssential(idx, attr)
            } else {
              const idx = parseInt(pickerOpen.split('-')[1])
              setClassic(idx, attr)
            }
            setPickerOpen(null)
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}

      {/* Picker mod équipement */}
      {modPickerOpen && (
        <GearModPicker
          mods={modsEquipements}
          onSelect={(mod) => { onChangeMod(mod); setModPickerOpen(false) }}
          onClose={() => setModPickerOpen(false)}
        />
      )}
    </div>
  )
}

/** Mini-picker pour sélectionner un mod d'équipement */
function GearModPicker({ mods, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!mods) return []
    if (!search) return mods
    const s = search.toLowerCase()
    return mods.filter(m => m.statistique?.toLowerCase().includes(s) || m.categorie?.toLowerCase().includes(s))
  }, [mods, search])

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
            <button key={i} onClick={() => onSelect(mod)}
              className="w-full text-left px-3 py-2 rounded hover:bg-shd/10 transition-colors group"
            >
              <div className="text-sm text-white group-hover:text-shd">{mod.statistique}</div>
              <div className="flex gap-3 text-[10px]">
                {mod.valeurMax && <span className="text-green-400">{mod.valeurMax}</span>}
                {mod.categorie && <span className="text-gray-500">{mod.categorie}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}



