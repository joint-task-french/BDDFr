import { useState, useMemo, useEffect } from 'react'
import { getWeaponEssentialAttributes } from '../../utils/formatters'
import { isWeaponModCompatible, formatModAttributs } from '../../utils/modCompatibility'
import AttributeSlider from './AttributeSlider'
import AttributePicker from './AttributePicker'

/**
 * Panneau d'attributs + mods inline pour une arme dans le build planner.
 *
 * Règles des attributs :
 * - Attributs essentiels (depuis le type d'arme ou weapon.attributs_essentiels) :
 * Non remplaçables (locked). Valeur modifiable dans la range (step 0.1).
 * Si une valeur est prédéfinie par l'arme, elle est fixée (readOnly si pas de range).
 * - Attribut classique libre : remplaçable et modifiable (si l'arme n'est pas exotique
 * et n'a pas d'attributs prédéfinis qui occupent tous les slots).
 */
export default function WeaponAttributePanel({ weapon, attribute, allAttributs, modsArmes, weaponMods, onChangeAttribute, onChangeMods, armesType, essentialSlotKey, essentialValues, dispatch }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [modPickerSlot, setModPickerSlot] = useState(null)

  const isExotic = weapon?.estExotique

  // Attributs essentiels hérités du type d'arme ou définis par l'arme
  // getWeaponEssentialAttributes gère les deux cas :
  // - weapon.attributs_essentiels présent → utilise ceux-ci (avec valeur prédéfinie si présente)
  // - sinon → utilise ceux du type d'arme (armesType)
  const essentialAttrs = useMemo(() =>
          getWeaponEssentialAttributes(armesType, weapon?.type, allAttributs, weapon?.attributs_essentiels),
      [armesType, weapon?.type, allAttributs, weapon?.attributs_essentiels]
  )

  // Noms déjà pris (essentiels + attribut libre)
  const excluded = useMemo(() => {
    const ex = []
    essentialAttrs.forEach(a => { if (a?.nom) ex.push(a.nom) })
    if (attribute?.nom) ex.push(attribute.nom)
    return ex
  }, [essentialAttrs, attribute])

  // Emplacements de mods : transformation de l'objet en tableau de clés/valeurs
  const modSlots = weapon?.emplacementsMods ? Object.entries(weapon.emplacementsMods) : []
  const predefMods = weapon?.modsPredefinis || []

  if (!weapon || weapon.type === 'arme_specifique') return null

  // Valeurs personnalisées des essentiels (depuis le state du build)
  const essVals = essentialValues || {}

  return (
      <div className="mt-2 pt-2 border-t border-tactical-border/30 space-y-0.5">
        {/* Attributs essentiels — locked (non remplaçables), valeur ajustable dans la range
           SAUF si une valeur est explicitement indiquée par l'arme (readOnly) */}
        {essentialAttrs.map((attr, i) => {
          if (!attr) return null
          const hasPredefValue = attr.value != null
          // Utiliser la valeur personnalisée du state, sinon la valeur prédéfinie, sinon max
          const currentValue = essVals[attr.slug] != null ? essVals[attr.slug] : (hasPredefValue ? attr.value : attr.max)
          const sliderAttr = {
            nom: attr.nom,
            slug: attr.slug,
            valeur: currentValue,
            min: attr.min,
            max: attr.max,
            unite: attr.unite || '%',
            categorie: attr.categorie,
          }
          // readOnly uniquement si l'arme définit explicitement une valeur fixe
          const isReadOnly = hasPredefValue
          return (
              <AttributeSlider
                  key={`ess-${i}`}
                  attribute={sliderAttr}
                  locked
                  readOnly={isReadOnly}
                  onChange={isReadOnly ? undefined : (updated) => {
                    if (dispatch && essentialSlotKey) {
                      dispatch({ type: 'SET_WEAPON_ESSENTIAL_VALUE', slotKey: essentialSlotKey, slug: attr.slug, valeur: updated.valeur })
                    }
                  }}
                  label={i === 0 ? 'Essentiel' : undefined}
              />
          )
        })}

        {/* Attribut classique libre (si pas exotique et si l'arme le permet) */}
        {!isExotic && (
            <AttributeSlider
                attribute={attribute}
                onChange={onChangeAttribute}
                onPick={() => setPickerOpen(true)}
                onRemove={() => onChangeAttribute(null)}
                label="Attribut"
            />
        )}

        {/* Mods */}
        {modSlots.length > 0 && (
            <div className="pt-1">
              <div className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Mods</div>
              {modSlots.map(([globalType, specificSlot], i) => {
                if (isExotic) {
                  const predefName = predefMods[i]
                  const predefMod = predefName ? (
                      modsArmes?.find(m => m.slug === predefName) ||
                      modsArmes?.find(m => m.nom.toLowerCase() === predefName.toLowerCase())
                  ) : null
                  return (
                      <div key={i} className="flex items-center gap-1.5 py-0.5">
                        <span className="text-xs text-gray-600 uppercase w-16 shrink-0">{globalType}</span>
                        {predefMod ? (
                            <ModName mod={predefMod} allAttributs={allAttributs} className="text-gray-500" />
                        ) : predefName ? (
                            <span className="text-xs text-gray-500 truncate">{predefName}</span>
                        ) : (
                            <span className="text-xs text-gray-600 italic">—</span>
                        )}
                      </div>
                  )
                }

                const equipped = weaponMods?.[i] || null
                return (
                    <div key={i} className="flex items-center gap-1.5 py-0.5">
                      <span className="text-xs text-gray-600 uppercase w-16 shrink-0">{globalType}</span>
                      {equipped ? (
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <ModName mod={equipped} allAttributs={allAttributs} className="text-gray-300" />
                            <button
                                onClick={() => { const m = [...(weaponMods || [])]; m[i] = null; onChangeMods(m) }}
                                className="text-gray-600 hover:text-red-400 text-xs ml-auto shrink-0"
                            >✕</button>
                          </div>
                      ) : (
                          <button
                              onClick={() => setModPickerSlot({ idx: i, type: globalType })}
                              className="text-xs text-shd/40 hover:text-shd transition-colors"
                          >
                            + Mod
                          </button>
                      )}
                    </div>
                )
              })}
            </div>
        )}

        {/* Picker attribut classique */}
        {pickerOpen && (
            <AttributePicker
                attributs={allAttributs}
                cible="arme"
                essentiel={false}
                exclude={excluded}
                onSelect={(attr) => { onChangeAttribute(attr); setPickerOpen(false) }}
                onClose={() => setPickerOpen(false)}
            />
        )}

        {/* Picker mod */}
        {modPickerSlot && !isExotic && (
            <ModPicker
                mods={modsArmes}
                type={modPickerSlot.type}
                weapon={weapon}
                allAttributs={allAttributs}
                onSelect={(mod) => {
                  const m = [...(weaponMods || Array(modSlots.length).fill(null))]
                  m[modPickerSlot.idx] = mod
                  onChangeMods(m)
                  setModPickerSlot(null)
                }}
                onClose={() => setModPickerSlot(null)}
            />
        )}
      </div>
  )
}

function ModName({ mod, allAttributs, className = '' }) {
  const statsText = formatModAttributs(mod, allAttributs)
  return (
      <span className={`text-xs truncate relative group/mod cursor-default ${className}`}>
      {mod.nom}
        {statsText && (
            <span className="absolute left-0 bottom-full mb-1 z-50 hidden group-hover/mod:block bg-tactical-panel border border-tactical-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
          <span className="block text-xs text-green-400">{statsText}</span>
        </span>
        )}
    </span>
  )
}

/** Picker de mod d'arme avec compatibilité structurée */
function ModPicker({ mods, type, weapon, allAttributs, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = useMemo(() => {
    if (!mods) return []
    let list = mods.filter(m => m.type === type)
    list = list.filter(m => isWeaponModCompatible(m, weapon))
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(m =>
          m.nom.toLowerCase().includes(s) ||
          formatModAttributs(m, allAttributs).toLowerCase().includes(s)
      )
    }
    return list
  }, [mods, type, weapon, allAttributs, search])

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-tactical-panel border border-tactical-border rounded-lg w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-tactical-border flex justify-between items-center">
            <span className="text-sm text-white font-bold uppercase tracking-widest">Mod — {type}</span>
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
            {filtered.length === 0 && <p className="text-center text-gray-600 text-sm py-4">Aucun mod compatible</p>}
            {filtered.map(mod => (
                <button key={mod.slug || mod.nom} onClick={() => onSelect(mod)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-shd/10 transition-colors group"
                >
                  <div className="text-sm text-white group-hover:text-shd">{mod.nom}</div>
                  <div className="text-xs text-green-400">{formatModAttributs(mod, allAttributs)}</div>
                </button>
            ))}
          </div>
        </div>
      </div>
  )
}