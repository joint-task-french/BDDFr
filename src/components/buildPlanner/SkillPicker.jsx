import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import { flattenCompetences } from '../../utils/competenceUtils'
import SelectionModal from '../common/SelectionModal'

export default function SkillPicker({ data, slotIndex, onClose }) {
  const { dispatch, canEquipSkill, skillNeedsSpec, SPECIALISATIONS } = useBuild()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const skills = useMemo(() => flattenCompetences(data.competencesGrouped || data.competences), [data])

  const skillTypes = useMemo(() =>
    [...new Set(skills.map(s => s.competence))].filter(Boolean),
    [skills]
  )

  const filtered = useMemo(() => {
    let list = skills
    if (typeFilter !== 'all') list = list.filter(s => s.competence === typeFilter)
    if (search) {
      const term = search.toLowerCase()
      list = list.filter(s =>
        s.competence.toLowerCase().includes(term) ||
        s.variante.toLowerCase().includes(term)
      )
    }
    return list
  }, [skills, typeFilter, search])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(s => {
      if (!g[s.competence]) g[s.competence] = []
      g[s.competence].push(s)
    })
    return g
  }, [filtered])

  const select = (skill) => {
    if (!canEquipSkill(skill, slotIndex)) return
    dispatch({ type: 'SET_SKILL', slot: slotIndex, skill })
    onClose()
  }

  const filterButtons = (
    <>
      <button
        onClick={() => setTypeFilter('all')}
        className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border transition-all ${
          typeFilter === 'all' ? 'bg-shd/20 text-shd border-shd/40' : 'text-gray-500 border-tactical-border hover:text-gray-300'
        }`}
      >
        Tout
      </button>
      {skillTypes.map(t => (
        <button
          key={t}
          onClick={() => setTypeFilter(t)}
          className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
            typeFilter === t ? 'bg-shd/20 text-shd border-shd/40' : 'text-gray-500 border-tactical-border hover:text-gray-300'
          }`}
        >
          {t}
        </button>
      ))}
    </>
  )

  return (
    <SelectionModal
      open={true}
      title={`Compétence ${slotIndex + 1}`}
      onClose={onClose}
      searchValue={search}
      onSearch={setSearch}
      filters={filterButtons}
    >
      {Object.entries(grouped).map(([name, variants]) => (
        <div key={name} className="mb-4">
          <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-2 px-2 sticky top-0 bg-tactical-panel/90 py-2 z-10 border-b border-yellow-500/20">
            {name}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {variants.map(s => {
              const blocked = !canEquipSkill(s, slotIndex)
              const missingSpec = skillNeedsSpec(s)
              const specLabel = missingSpec ? SPECIALISATIONS?.[missingSpec]?.label : null
              return (
                <div
                  key={s.variante}
                  onClick={() => !blocked && select(s)}
                  className={`modal-item group ${blocked ? 'disabled' : ''} ${missingSpec ? 'border-yellow-500/30' : ''}`}
                >
                  {blocked && <div className="text-xs text-red-400 mb-1">⚠ Même type déjà équipé</div>}
                  {missingSpec && !blocked && (
                    <div className="text-xs text-yellow-500 mb-1">⚠ Nécessite la spé {specLabel}</div>
                  )}
                  <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-shd transition-colors">
                    {s.variante}
                  </div>
                  <div className="text-xs text-gray-500">{s.competence}</div>
                  {s.statistiques && (
                    <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
                      {s.statistiques}
                    </div>
                  )}
                  {s.effetEtat && s.effetEtat !== 'N/A' && (
                    <div className="text-xs text-purple-400 mt-1">⚡ {s.effetEtat}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-12 uppercase tracking-widest">Aucune compétence trouvée</div>
      )}
    </SelectionModal>
  )
}

