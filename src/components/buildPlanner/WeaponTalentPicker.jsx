import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import SelectionModal from '../common/SelectionModal'

export default function WeaponTalentPicker({ data, slotIndex, weaponType, onClose }) {
  const { weapons, sidearm, dispatch } = useBuild()
  const isSidearm = slotIndex === 'sidearm'
  const weapon = isSidearm ? sidearm : weapons[slotIndex]
  const wType = weaponType || weapon?.type
  const [search, setSearch] = useState('')

  const compatibleTalents = useMemo(() => {
    if (!wType || !data.talentsArmes) return []
    return data.talentsArmes.filter(t => {
      if (!t.compatibilite) return true
      return t.compatibilite[wType] === true
    })
  }, [data.talentsArmes, wType])

  const filtered = useMemo(() => {
    if (!search) return compatibleTalents
    const term = search.toLowerCase()
    return compatibleTalents.filter(t =>
      t.nom.toLowerCase().includes(term) ||
      (t.description || '').toLowerCase().includes(term)
    )
  }, [compatibleTalents, search])

  const select = (talent) => {
    if (isSidearm) {
      dispatch({ type: 'SET_SIDEARM_TALENT', talent })
    } else {
      dispatch({ type: 'SET_WEAPON_TALENT', slot: slotIndex, talent })
    }
    onClose()
  }

  if (!weapon) return null

  return (
    <SelectionModal
      open={true}
      title={`Talent — ${weapon.nom}`}
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
        <div className="text-center text-gray-500 py-12 uppercase tracking-widest">Aucun talent compatible</div>
      )}
    </SelectionModal>
  )
}

