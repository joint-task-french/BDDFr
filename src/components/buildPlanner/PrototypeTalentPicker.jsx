import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import SelectionModal from '../common/SelectionModal'

export default function PrototypeTalentPicker({ data, slotKey, onClose }) {
  const { dispatch } = useBuild()
  const [search, setSearch] = useState('')

  const talents = data?.talentsPrototypes || []

  const filtered = useMemo(() => {
    if (!search) return talents
    const term = search.toLowerCase()
    return talents.filter(t =>
        t.nom.toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term)
    )
  }, [talents, search])

  const select = (talent) => {
    dispatch({ type: 'SET_PROTOTYPE_TALENT', slot: slotKey, talent })
    onClose()
  }

  return (
      <SelectionModal
          open={true}
          title="Talent Prototype"
          onClose={onClose}
          searchValue={search}
          onSearch={setSearch}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {filtered.map(t => (
              <div key={t.nom} className="modal-item group border-l-2 border-l-cyan-500/30 hover:border-l-cyan-500" onClick={() => select(t)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-cyan-400 text-sm uppercase tracking-wide group-hover:text-cyan-300 transition-colors">
                    {t.nom}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-500/70">
                    <span>{t.statMin}</span>
                    <span>→</span>
                    <span>{t.statMax}</span>
                  </div>
                </div>
                {t.description && (
                  <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
                    {t.description}
                  </div>
                )}
              </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-12 uppercase tracking-widest">
            Aucun talent prototype trouvé
          </div>
        )}
      </SelectionModal>
  )
}
