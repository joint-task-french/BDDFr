import { useState, useMemo } from 'react'
import { getWeaponEssentialAttributes } from '../../utils/formatters'
import { resolveAttributeIcon, GameIcon } from '../../utils/gameAssets'
import AttributeSlider from './AttributeSlider'
import AttributePicker from './AttributePicker'

/**
 * Panneau d'attributs + mods inline pour une arme dans le build planner.
 *
 * Règles :
 * - Attributs essentiels (hérités du type d'arme) : lecture seule, toujours affichés
 * - Si weapon.attributs[] existe : attributs fixés en lecture seule
 * - Sinon : 1 attribut personnalisable (sauf exotique)
 * - Mods : emplacementsMods[] = slots disponibles
 * - Armes exotiques : mods pré-insérés et NON modifiables
 */
export default function WeaponAttributePanel({ weapon, attribute, allAttributs, modsArmes, weaponMods, onChangeAttribute, onChangeMods, armesType }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [modPickerSlot, setModPickerSlot] = useState(null)

  const isExotic = weapon?.estExotique

  // Attributs essentiels hérités du type d'arme (tous)
  const essentialAttrs = useMemo(() =>
    getWeaponEssentialAttributes(armesType, weapon?.type, allAttributs),
    [armesType, weapon?.type, allAttributs]
  )

  // Attributs fixés depuis weapon.attributs[]
  const fixedAttributes = useMemo(() => {
    if (!weapon?.attributs?.length || !allAttributs) return []
    return weapon.attributs.map(fixed => {
      const ref = allAttributs.find(a => a.slug === fixed.nom || a.nom.toLowerCase() === fixed.nom.toLowerCase())
      return {
        nom: ref?.nom || fixed.nom,
        slug: ref?.slug || fixed.nom,
        valeur: fixed.valeur,
        min: ref?.min ?? fixed.valeur,
        max: ref?.max ?? fixed.valeur,
        unite: ref?.unite || '%',
        categorie: ref?.categorie || 'offensif',
      }
    })
  }, [weapon, allAttributs])

  const hasFixedAttributes = fixedAttributes.length > 0

  // Noms déjà pris (pour le picker)
  const excluded = useMemo(() => {
    const ex = []
    essentialAttrs.forEach(a => ex.push(a.nom))
    fixedAttributes.forEach(a => ex.push(a.nom))
    if (attribute?.nom) ex.push(attribute.nom)
    return ex
  }, [essentialAttrs, fixedAttributes, attribute])

  // Emplacements de mods
  const modSlots = weapon?.emplacementsMods || []
  const predefMods = weapon?.modsPredefinis || []

  if (!weapon || weapon.type === 'arme_specifique') return null

  return (
    <div className="mt-2 pt-2 border-t border-tactical-border/30 space-y-0.5">
      {/* Attributs essentiels (hérités du type d'arme) — toujours lecture seule */}
      {essentialAttrs.map((attr, i) => (
        <div key={`ess-${i}`} className="flex items-center gap-1.5 py-0.5">
          <GameIcon src={resolveAttributeIcon(attr.categorie)} alt="" size="w-3 h-3" className="opacity-50" />
          <span className="text-[10px] text-gray-500 truncate">{attr.nom}</span>
          <span className="text-[10px] text-gray-600 ml-auto">{attr.min}–{attr.max}{attr.unite || ''}</span>
        </div>
      ))}

      {/* Attributs fixés depuis les données (lecture seule) */}
      {fixedAttributes.map((attr, i) => (
        <AttributeSlider key={`fixed-${i}`} attribute={attr} readOnly label={i === 0 ? 'Attribut fixé' : undefined} />
      ))}

      {/* Attribut personnalisable (si pas d'attribut fixé et pas exotique) */}
      {!hasFixedAttributes && !isExotic && (
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
          <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Mods</div>
          {modSlots.map((slotType, i) => {
            // Exotiques : mods pré-remplis non modifiables
            if (isExotic) {
              const predefName = predefMods[i]
              const predefMod = predefName ? (
                modsArmes?.find(m => m.slug === predefName) ||
                modsArmes?.find(m => m.nom.toLowerCase() === predefName.toLowerCase())
              ) : null
              return (
                <div key={i} className="flex items-center gap-1.5 py-0.5">
                  <span className="text-[9px] text-gray-600 uppercase w-16 shrink-0">{slotType}</span>
                  {predefMod ? (
                    <ModName mod={predefMod} className="text-gray-500" />
                  ) : predefName ? (
                    <ModName mod={{ nom: predefName }} className="text-gray-500" />
                  ) : (
                    <span className="text-[10px] text-gray-600 italic">—</span>
                  )}
                </div>
              )
            }

            // Non-exotiques : mods modifiables
            const equipped = weaponMods?.[i] || null
            return (
              <div key={i} className="flex items-center gap-1.5 py-0.5">
                <span className="text-[9px] text-gray-600 uppercase w-16 shrink-0">{slotType}</span>
                {equipped ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <ModName mod={equipped} className="text-gray-300" />
                    <button
                      onClick={() => { const m = [...(weaponMods || [])]; m[i] = null; onChangeMods(m) }}
                      className="text-gray-600 hover:text-red-400 text-[10px] ml-auto shrink-0"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setModPickerSlot({ idx: i, type: slotType })}
                    className="text-[10px] text-shd/40 hover:text-shd transition-colors"
                  >
                    + Mod
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Picker attribut */}
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

      {/* Picker mod — uniquement pour les non-exotiques */}
      {modPickerSlot && !isExotic && (
        <ModPicker
          mods={modsArmes}
          type={modPickerSlot.type}
          weaponType={weapon?.type}
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

/**
 * Affiche le nom du mod avec un tooltip hover montrant bonus/malus
 */
function ModName({ mod, className = '' }) {
  return (
    <span className={`text-[10px] truncate relative group/mod cursor-default ${className}`}>
      {mod.nom}
      {(mod.bonus || mod.malus) && (
        <span className="absolute left-0 bottom-full mb-1 z-50 hidden group-hover/mod:block bg-tactical-panel border border-tactical-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
          {mod.bonus && <span className="block text-[10px] text-green-400">{mod.bonus}</span>}
          {mod.malus && mod.malus !== "Pas d'effet négatif" && (
            <span className="block text-[10px] text-red-400">{mod.malus}</span>
          )}
        </span>
      )}
    </span>
  )
}

/**
 * Mapping calibre dans le nom du mod → types d'arme compatibles.
 * Les mods sans calibre spécifique (viseurs, accessoires, certains canons) sont universels.
 */
const CALIBER_WEAPON_MAP = [
  { pattern: '.45 acp',   types: ['pistolet_mitrailleur', 'pistolet'] },
  { pattern: '.45',       types: ['pistolet_mitrailleur', 'pistolet'] },
  { pattern: '5.56',      types: ['fusil_assaut', 'fusil'] },
  { pattern: '7.62',      types: ['fusil_assaut', 'fusil', 'fusil_precision', 'fusil_mitrailleur'] },
  { pattern: '9mm',       types: ['pistolet_mitrailleur', 'pistolet'] },
  { pattern: 'precision', types: ['fusil', 'fusil_precision'] },
  { pattern: 'pistolet',  types: ['pistolet'] },
  { pattern: 'tubulaire', types: ['calibre_12'] },
  { pattern: 'barillet',  types: ['calibre_12', 'pistolet'] },
  { pattern: 'ceinture',  types: ['fusil_mitrailleur'] },
  { pattern: 'sacoche',   types: ['fusil_mitrailleur'] },
]

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function isModCompatible(mod, weaponType) {
  if (!weaponType || !mod?.nom) return true

  // Viseurs et accessoires sont universels
  if (mod.type === 'viseur' || mod.type === 'accessoire') return true

  const nomNorm = normalize(mod.nom)

  // Chercher un pattern de calibre dans le nom du mod
  for (const { pattern, types } of CALIBER_WEAPON_MAP) {
    if (nomNorm.includes(pattern)) {
      return types.includes(weaponType)
    }
  }

  // Si aucun calibre identifié, le mod est compatible avec tout
  return true
}

/** Mini-picker pour sélectionner un mod d'arme, filtré par type de slot ET type d'arme */
function ModPicker({ mods, type, weaponType, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!mods) return []
    let list = mods.filter(m => m.type === type)
    // Filtrer par compatibilité avec le type d'arme
    list = list.filter(m => isModCompatible(m, weaponType))
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(m => m.nom.toLowerCase().includes(s) || m.bonus?.toLowerCase().includes(s))
    }
    return list
  }, [mods, type, weaponType, search])

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
            <button key={mod.nom} onClick={() => onSelect(mod)}
              className="w-full text-left px-3 py-2 rounded hover:bg-shd/10 transition-colors group"
            >
              <div className="text-sm text-white group-hover:text-shd">{mod.nom}</div>
              <div className="flex gap-3 text-[10px]">
                {mod.bonus && <span className="text-green-400">{mod.bonus}</span>}
                {mod.malus && mod.malus !== "Pas d'effet négatif" && <span className="text-red-400">{mod.malus}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

