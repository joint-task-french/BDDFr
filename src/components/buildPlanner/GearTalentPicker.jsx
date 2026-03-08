import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import { getGearSlotLabel } from '../../utils/formatters'
import { getTalentEquipFilters, getTalentEquipDefaults, applyTalentEquipFilters } from '../../config/filterConfigs'
import SelectionModal from '../common/SelectionModal'
import FilterPanel from '../database/FilterPanel'

export default function GearTalentPicker({ data, slotKey, onClose }) {
  const { gear, dispatch } = useBuild()
  const piece = gear?.[slotKey]
  const [search, setSearch] = useState('')

  // Database-style filters
  const filterConfig = useMemo(() => getTalentEquipFilters(data), [data])
  const defaultFilters = useMemo(() => getTalentEquipDefaults(), [])
  const [filters, setFilters] = useState(defaultFilters)
  const handleFilterChange = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const resetFilters = () => setFilters(defaultFilters)

  const talents = useMemo(() => {
    if (!data.talentsEquipements) return []
    return data.talentsEquipements.filter(t =>
      t.emplacement === slotKey || t.emplacement === 'tous'
    )
  }, [data.talentsEquipements, slotKey])

  const afterFilters = useMemo(() => applyTalentEquipFilters(talents, filters), [talents, filters])

  const filtered = useMemo(() => {
    if (!search) return afterFilters
    const term = search.toLowerCase()
    return afterFilters.filter(t =>
      t.nom.toLowerCase().includes(term) ||
      (t.description || '').toLowerCase().includes(term)
    )
  }, [afterFilters, search])

  const select = (talent) => {
    dispatch({ type: 'SET_GEAR_TALENT', slot: slotKey, talent })
    onClose()
  }

  return (
    <SelectionModal
      open={true}
      title={`Talent — ${getGearSlotLabel(data.equipements_type, slotKey)}`}
      onClose={onClose}
      searchValue={search}
      onSearch={setSearch}
    >
      <div className="mb-4">
        <FilterPanel filters={filterConfig} values={filters} onChange={handleFilterChange} onReset={resetFilters} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map(t => (
          <div key={t.nom} className="modal-item group" onClick={() => select(t)}>
            <div className="flex items-center gap-2">
              <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-shd transition-colors">
                {t.nom}
              </div>
              {piece?.estNomme && t.perfectDescription && (
                <span className="text-[10px] font-bold text-shd-dark bg-shd/20 px-1 py-0.5 rounded uppercase tracking-widest leading-none">
                  ★ Parfait
                </span>
              )}
            </div>
            {piece?.estNomme && t.perfectDescription ? (
              <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">{t.perfectDescription}</div>
            ) : t.description ? (
              <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">{t.description}</div>
            ) : null}
            {t.prerequis && t.prerequis !== 'n/a' && (
              <div className="text-xs text-yellow-500/60 mt-1">Requis : {t.prerequis}</div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-12 uppercase tracking-widest">Aucun talent trouvé</div>
      )}
    </SelectionModal>
  )
}
