import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import { getGearSlotLabel } from '../../utils/formatters'
import SelectionModal from '../common/SelectionModal'

export default function GearTalentPicker({ data, slotKey, onClose }) {
  const { dispatch } = useBuild()
  const [search, setSearch] = useState('')

  const talents = useMemo(() => {
    if (!data.talentsEquipements) return []
    return data.talentsEquipements.filter(t =>
      t.emplacement === slotKey || t.emplacement === 'tous'
    )
  }, [data.talentsEquipements, slotKey])

  const filtered = useMemo(() => {
    if (!search) return talents
    const term = search.toLowerCase()
    return talents.filter(t =>
      t.nom.toLowerCase().includes(term) ||
      (t.description || '').toLowerCase().includes(term)
    )
  }, [talents, search])

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map(t => (
          <div key={t.nom} className="modal-item group" onClick={() => select(t)}>
            <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-shd transition-colors">
              {t.nom}
            </div>
            {t.description && (
              <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-3">{t.description}</div>
            )}
            {t.prerequis && t.prerequis !== 'n/a' && (
              <div className="text-[10px] text-yellow-500/60 mt-1">Requis : {t.prerequis}</div>
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
