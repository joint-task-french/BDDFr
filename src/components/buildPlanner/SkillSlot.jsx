import { useState, useMemo, useEffect } from 'react'
import { useBuild } from '../../context/BuildContext'
import { formatModAttributs } from '../../utils/modCompatibility'
import MarkdownText from '../common/MarkdownText'

/**
 * Normalise un nom pour comparaison.
 */
function normalize(s) {
  if (!s) return ''
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
}

/**
 * Trouve les emplacements de mods compatibles pour une compétence donnée.
 * Se base sur les emplacementsMods du skill (enrichi par flattenCompetences depuis competences.jsonc).
 */
function getSkillModSlots(skill) {
  if (!skill?.emplacementsMods) return []
  return skill.emplacementsMods
}

/**
 * Filtre les mods de compétences (mods-competences.jsonc) compatibles avec un slot donné.
 * @param {string} competenceSlug - slug de la compétence (ex: "tourelle")
 * @param {string} emplacement - nom de l'emplacement (ex: "MÉCANISME DE TIR")
 * @param {Array} modsCompetences - données de mods-competences.jsonc
 * @param {string} specialisation - spécialisation active
 */
function getCompatibleSkillMods(competenceSlug, emplacement, modsCompetences, specialisation) {
  if (!modsCompetences || !competenceSlug) return []
  const modsList = Array.isArray(modsCompetences) ? modsCompetences : Object.values(modsCompetences)
  const compNorm = normalize(competenceSlug)
  const empNorm = normalize(emplacement)

  return modsList.filter(m => {
    // Vérifier la compatibilité avec la compétence
    if (m.compatible && m.compatible.length > 0) {
      const isCompat = m.compatible.some(c => normalize(c) === compNorm)
      if (!isCompat) return false
    } else if (m.competence) {
      // Fallback sur le champ competence
      if (normalize(m.competence) !== compNorm) return false
    }
    // Vérifier la compatibilité avec l'emplacement
    if (emplacement && m.emplacement) {
      if (normalize(m.emplacement) !== empNorm) return false
    }
    // Vérifier prerequis de spécialisation
    if (m.prerequis && m.prerequis !== specialisation) return false
    return true
  })
}

export default function SkillSlot({ slotIndex, skill, skillMod, modsCompetences, allAttributs, statistiques, onSelect }) {
  const { dispatch, skillNeedsSpec, specialisation, SPECIALISATIONS, modValues } = useBuild()
  const [modPickerOpen, setModPickerOpen] = useState(null) // emplacement index or null

  const remove = (e) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_SKILL', slot: slotIndex })
  }

  const missingSpec = skill ? skillNeedsSpec(skill) : null
  const specLabel = missingSpec ? SPECIALISATIONS?.[missingSpec]?.label : null

  // Emplacements de mods pour cette compétence (filtrés par spécialisation)
  const modSlots = useMemo(() => {
    const slots = getSkillModSlots(skill)
    return slots.filter(s => !s.prerequis || s.prerequis === specialisation)
  }, [skill, specialisation])

  return (
    <div className="build-slot group" onClick={skill ? undefined : onSelect}>
      <div className="px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/30 flex justify-between items-center">
        <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">⚡ Compétence {slotIndex + 1}</span>
        {skill && <button onClick={remove} className="text-red-400 hover:text-red-300 text-xs p-1">✕</button>}
      </div>
      <div className="p-3 min-h-25">
        {skill ? (
          <div className="border-l-2 border-l-yellow-500 pl-3">
            <div className="font-bold text-white text-sm uppercase tracking-wide">{skill.variante}</div>
            <div className="text-xs text-yellow-400 font-bold">{skill.competence}</div>
            {missingSpec && (
              <div className="text-xs text-yellow-500 mt-1 bg-yellow-500/10 px-2 py-1 rounded">
                ⚠ Nécessite la spé {specLabel}
              </div>
            )}
            {skill.statistiques && (
              <MarkdownText className="text-xs text-gray-400 mt-2 leading-relaxed">
                {skill.statistiques}
              </MarkdownText>
            )}
            {skill.effetEtat && skill.effetEtat !== 'N/A' && (
              <div className="text-xs text-purple-400 mt-1">⚡ {skill.effetEtat}</div>
            )}
            {skill.surcharge && (
              <div className="text-xs text-shd mt-1">🔥 Surcharge : {skill.surcharge}</div>
            )}

            {/* Emplacements de mods de compétence */}
            {modSlots.length > 0 && (
              <div className="mt-2 pt-2 border-t border-tactical-border/30">
                <div className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Mods</div>
                {modSlots.map((slot, i) => {
                  const equipped = skillMod && i === 0 ? skillMod : null // un seul mod de compétence pour l'instant
                  return (
                    <div key={i} className="py-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-600 uppercase shrink-0">{slot.emplacement}</span>
                        {equipped ? (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-300 truncate relative group/smod cursor-default">
                                {equipped.nom || equipped.slug}
                                {equipped.attributs && (
                                  <span className="absolute left-0 bottom-full mb-1 z-50 hidden group-hover/smod:block bg-tactical-panel border border-tactical-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
                                    <span className="block text-xs text-green-400">{formatModAttributs(equipped, allAttributs, statistiques)}</span>
                                  </span>
                                )}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_SKILL_MOD', slot: slotIndex, mod: null }) }}
                                className="text-gray-600 hover:text-red-400 text-xs ml-auto shrink-0"
                              >✕</button>
                            </div>
                            {equipped.attributs && equipped.attributs.map((entry) => {
                              if (entry.valeur != null) return null
                              const attrDef = allAttributs?.[entry.attribut]
                              if (!attrDef || attrDef.min == null || attrDef.max == null || attrDef.min === attrDef.max) return null
                              const userVal = modValues?.skillMods?.[slotIndex]?.[entry.attribut]
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
                                    onChange={(e) => { e.stopPropagation(); dispatch({ type: 'SET_SKILL_MOD_VALUE', slot: slotIndex, attrSlug: entry.attribut, valeur: parseFloat(e.target.value) }) }}
                                    className="attr-slider mt-0.5"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setModPickerOpen(i) }}
                            className="text-xs text-shd/40 hover:text-shd transition-colors"
                          >
                            + Mod
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 py-4">
            <svg className="w-10 h-10 group-hover:text-yellow-500/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm uppercase tracking-widest mt-2">Sélectionner</span>
          </div>
        )}
      </div>

      {/* Picker mod de compétence — filtré depuis mods-competences.jsonc */}
      {modPickerOpen !== null && skill && modSlots[modPickerOpen] && (
        <SkillModPicker
          competenceSlug={skill.competenceSlug}
          emplacement={modSlots[modPickerOpen].emplacement}
          modsCompetences={modsCompetences}
          allAttributs={allAttributs}
          statistiques={statistiques}
          specialisation={specialisation}
          onSelect={(mod) => {
            dispatch({ type: 'SET_SKILL_MOD', slot: slotIndex, mod })
            setModPickerOpen(null)
          }}
          onClose={() => setModPickerOpen(null)}
        />
      )}
    </div>
  )
}

/**
 * Picker de mod de compétence — utilise mods-competences.jsonc.
 * Filtre par compatibilité compétence + emplacement.
 */
function SkillModPicker({ competenceSlug, emplacement, modsCompetences, allAttributs, statistiques, specialisation, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const compatibleMods = useMemo(
    () => getCompatibleSkillMods(competenceSlug, emplacement, modsCompetences, specialisation),
    [competenceSlug, emplacement, modsCompetences, specialisation]
  )

  const filtered = useMemo(() => {
    if (!search) return compatibleMods
    const s = search.toLowerCase()
    return compatibleMods.filter(m =>
      (m.nom || m.slug || '').toLowerCase().includes(s) ||
      (m.emplacement || '').toLowerCase().includes(s) ||
      formatModAttributs(m, allAttributs, statistiques).toLowerCase().includes(s)
    )
  }, [compatibleMods, allAttributs, statistiques, search])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-tactical-panel border border-tactical-border rounded-lg w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-tactical-border flex justify-between items-center">
          <span className="text-sm text-white font-bold uppercase tracking-widest">Mod — {emplacement}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>
        {compatibleMods.length > 3 && (
          <div className="px-4 py-2 border-b border-tactical-border/50">
            <input
              type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-tactical-bg border border-tactical-border rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-shd/50"
              autoFocus
            />
          </div>
        )}
        <div className="overflow-y-auto p-2 flex-1">
          {filtered.length === 0 && <p className="text-center text-gray-600 text-sm py-4">Aucun mod compatible</p>}
          {filtered.map((mod, i) => {
            const statsText = formatModAttributs(mod, allAttributs, statistiques)
            return (
              <button key={mod.slug || i} onClick={() => onSelect(mod)}
                className="w-full text-left px-3 py-2 rounded hover:bg-shd/10 transition-colors group"
              >
                <div className="text-sm text-white group-hover:text-shd">{mod.nom || mod.slug}</div>
                {statsText && <div className="text-xs text-green-400">{statsText}</div>}
                {mod.bonus && <MarkdownText className="text-xs text-gray-500">{mod.bonus}</MarkdownText>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

