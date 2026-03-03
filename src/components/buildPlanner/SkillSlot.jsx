import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'

/**
 * Normalise un nom de compétence pour la comparaison (sans accents, en majuscules).
 */
function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
}

/**
 * Trouve le(s) mod(s) de compétence compatible(s).
 * Utilise les emplacementsMods directement depuis les données enrichies de la compétence.
 * Filtre par spécialisation si nécessaire.
 */
function findCompatibleMods(skill, modsCompetences, specialisation, speMap) {
  if (!skill) return []

  // Utiliser emplacementsMods du skill (enrichi par flattenCompetences)
  if (skill.emplacementsMods && skill.emplacementsMods.length > 0) {
    // Filtrer : emplacements sans prerequis OU dont le prerequis match la spé active
    return skill.emplacementsMods.filter(em =>
      !em.prerequis || em.prerequis === specialisation
    )
  }

  // Fallback : chercher dans modsCompetences (ancienne logique)
  if (!modsCompetences) return []
  const compNorm = normalize(skill.competence)

  if (specialisation) {
    const specLabel = speMap?.[specialisation]?.label || ''
    const specNorm = normalize(specLabel)
    const specMod = modsCompetences.find(m => {
      const mNorm = normalize(m.competence)
      return mNorm.includes(compNorm) && mNorm.includes(specNorm)
    })
    if (specMod) return [specMod]
  }

  const baseMods = modsCompetences.filter(m => {
    const mNorm = normalize(m.competence)
    return mNorm === compNorm || (mNorm.startsWith(compNorm) && !mNorm.includes('('))
  })
  if (baseMods.length > 0) return baseMods

  return modsCompetences.filter(m => normalize(m.competence).includes(compNorm))
}

export default function SkillSlot({ slotIndex, skill, skillMod, modsCompetences, modsEquipements, onSelect }) {
  const { dispatch, skillNeedsSpec, specialisation, SPECIALISATIONS } = useBuild()
  const [modPickerOpen, setModPickerOpen] = useState(false)

  const remove = (e) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_SKILL', slot: slotIndex })
  }

  const missingSpec = skill ? skillNeedsSpec(skill) : null
  const specLabel = missingSpec ? SPECIALISATIONS?.[missingSpec]?.label : null

  // Mods compatibles avec cette compétence
  const compatibleMods = useMemo(
    () => findCompatibleMods(skill, modsCompetences, specialisation, SPECIALISATIONS),
    [skill, modsCompetences, specialisation, SPECIALISATIONS]
  )

  const modInfo = compatibleMods.length > 0 ? compatibleMods[0] : null

  return (
    <div className="build-slot group" onClick={skill ? undefined : onSelect}>
      <div className="px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/30 flex justify-between items-center">
        <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">⚡ Compétence {slotIndex + 1}</span>
        {skill && <button onClick={remove} className="text-red-400 hover:text-red-300 text-xs p-1">✕</button>}
      </div>
      <div className="p-3 min-h-[100px]">
        {skill ? (
          <div className="border-l-2 border-l-yellow-500 pl-3">
            <div className="font-bold text-white text-sm uppercase tracking-wide">{skill.variante}</div>
            <div className="text-xs text-yellow-400 font-bold">{skill.competence}</div>
            {missingSpec && (
              <div className="text-[10px] text-yellow-500 mt-1 bg-yellow-500/10 px-2 py-1 rounded">
                ⚠ Nécessite la spé {specLabel}
              </div>
            )}
            {skill.statistiques && (
              <div className="text-[10px] text-gray-400 mt-2 leading-relaxed whitespace-pre-line">
                {skill.statistiques}
              </div>
            )}
            {skill.effetEtat && skill.effetEtat !== 'N/A' && (
              <div className="text-[10px] text-purple-400 mt-1">⚡ {skill.effetEtat}</div>
            )}
            {skill.surcharge && (
              <div className="text-[10px] text-shd mt-1">🔥 Surcharge : {skill.surcharge}</div>
            )}

            {/* Mod de compétence */}
            {modInfo && (
              <div className="mt-2 pt-2 border-t border-tactical-border/30">
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">
                  Mod — {modInfo.emplacement}
                </div>
                {skillMod ? (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="text-[10px] text-gray-300 relative group/smod cursor-default truncate">
                      {skillMod.statistique || skillMod.nom || skillMod.emplacement}
                      {(skillMod.valeurMax || skillMod.categorie) && (
                        <span className="absolute left-0 bottom-full mb-1 z-50 hidden group-hover/smod:block bg-tactical-panel border border-tactical-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
                          {skillMod.valeurMax && <span className="block text-[10px] text-green-400">{skillMod.valeurMax}</span>}
                          {skillMod.categorie && <span className="block text-[10px] text-gray-500">{skillMod.categorie}</span>}
                        </span>
                      )}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_SKILL_MOD', slot: slotIndex, mod: null }) }}
                      className="text-gray-600 hover:text-red-400 text-[10px] ml-auto shrink-0"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setModPickerOpen(true) }}
                    className="text-[10px] text-shd/40 hover:text-shd transition-colors"
                  >
                    + Mod
                  </button>
                )}
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

      {/* Picker mod de compétence */}
      {modPickerOpen && modInfo && (
        <SkillModPicker
          modInfo={modInfo}
          modsEquipements={modsEquipements}
          onSelect={(mod) => {
            dispatch({ type: 'SET_SKILL_MOD', slot: slotIndex, mod })
            setModPickerOpen(false)
          }}
          onClose={() => setModPickerOpen(false)}
        />
      )}
    </div>
  )
}

/**
 * Picker de mod de compétence.
 * Dans Division 2, les mods de compétences sont les mêmes que les mods d'équipement
 * (protocoles offensif/défensif/utilitaire). On propose donc les mods d'équipements.
 */
function SkillModPicker({ modInfo, modsEquipements, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  const allMods = useMemo(() => {
    if (!modsEquipements) return []
    return modsEquipements
  }, [modsEquipements])

  const filtered = useMemo(() => {
    if (!search) return allMods
    const s = search.toLowerCase()
    return allMods.filter(m =>
      m.statistique?.toLowerCase().includes(s) ||
      m.categorie?.toLowerCase().includes(s) ||
      m.protocole?.toLowerCase().includes(s)
    )
  }, [allMods, search])

  const CAT_COLORS = { offensif: 'text-red-400', défensif: 'text-blue-400', utilitaire: 'text-yellow-400' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-tactical-panel border border-tactical-border rounded-lg w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-tactical-border flex justify-between items-center">
          <span className="text-sm text-white font-bold uppercase tracking-widest">Mod — {modInfo.emplacement}</span>
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
                {mod.categorie && <span className={CAT_COLORS[mod.categorie] || 'text-gray-500'}>{mod.categorie}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

