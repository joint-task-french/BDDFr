import { useBuild } from '../../context/BuildContext'
import { SPECIALISATIONS } from '../../utils/formatters'

export default function SkillSlot({ slotIndex, skill, onSelect }) {
  const { dispatch, skillNeedsSpec } = useBuild()

  const remove = (e) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_SKILL', slot: slotIndex })
  }

  const missingSpec = skill ? skillNeedsSpec(skill) : null
  const specLabel = missingSpec ? SPECIALISATIONS[missingSpec]?.label : null

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
    </div>
  )
}

