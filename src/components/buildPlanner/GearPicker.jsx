import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import { GEAR_SLOT_LABELS } from '../../utils/formatters'
import SelectionModal from '../common/SelectionModal'
import Badge from '../common/Badge'

export default function GearPicker({ data, slotKey, onClose, onSelectTalent }) {
  const { dispatch, canEquipExoticGear } = useBuild()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')

  const allPieces = useMemo(() => {
    const pieces = []
    const seen = new Set()

    ;(data.equipements || []).forEach(e => {
      if (e.emplacement === slotKey && !seen.has(e.nom)) {
        seen.add(e.nom)
        pieces.push(e)
      }
    })


    return pieces
  }, [data, slotKey])

  const brands = useMemo(() =>
    [...new Set(allPieces.map(p => p.marque))].filter(Boolean).sort(),
    [allPieces]
  )

  const filtered = useMemo(() => {
    let list = allPieces
    if (brandFilter !== 'all') list = list.filter(p => p.marque === brandFilter)
    if (search) {
      const term = search.toLowerCase()
      list = list.filter(p =>
        p.nom.toLowerCase().includes(term) ||
        (p.marque || '').toLowerCase().includes(term)
      )
    }
    // Sort: exotics first, then named, then gear sets, then standard
    const order = { exotic: 0, named: 1, gear_set: 2, marque: 3 }
    list.sort((a, b) => {
      const oa = a.type === 'exotique' ? 0 : a.estNomme ? 1 : a.type === 'gear_set' ? 2 : 3
      const ob = b.type === 'exotique' ? 0 : b.estNomme ? 1 : b.type === 'gear_set' ? 2 : 3
      return oa - ob
    })
    return list
  }, [allPieces, brandFilter, search])

  const canExotic = canEquipExoticGear(slotKey)

  const select = (piece) => {
    if (piece.type === 'exotique' && !canExotic) return
    dispatch({ type: 'SET_GEAR', slot: slotKey, piece })
    onSelectTalent(slotKey)
  }

  // Résolution slug → nom pour les marques
  const marqueNames = useMemo(() => {
    const map = {}
    for (const e of (data.ensembles || [])) {
      if (e.slug) map[e.slug] = e.nom
      map[e.nom.toLowerCase()] = e.nom
    }
    return map
  }, [data.ensembles])

  const resolveMarque = (slug) => marqueNames[slug] || marqueNames[slug?.toLowerCase()] || slug

  const filterButtons = (
    <>
      <button
        onClick={() => setBrandFilter('all')}
        className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest border transition-all ${
          brandFilter === 'all' ? 'bg-shd/20 text-shd border-shd/40' : 'text-gray-500 border-tactical-border hover:text-gray-300'
        }`}
      >
        Tout ({allPieces.length})
      </button>
      {brands.map(b => (
        <button
          key={b}
          onClick={() => setBrandFilter(b)}
          className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
            brandFilter === b ? 'bg-shd/20 text-shd border-shd/40' : 'text-gray-500 border-tactical-border hover:text-gray-300'
          }`}
        >
          {resolveMarque(b)}
        </button>
      ))}
    </>
  )

  return (
    <SelectionModal
      open={true}
      title={`Sélection — ${GEAR_SLOT_LABELS[slotKey]}`}
      onClose={onClose}
      searchValue={search}
      onSearch={setSearch}
      filters={filterButtons}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map(p => {
          const blocked = p.type === 'exotique' && !canExotic
          const borderClass = p.type === 'exotique' ? 'border-shd/60 bg-shd/5'
            : p.estNomme ? 'border-yellow-600/40 bg-yellow-900/5'
            : p.type === 'gear_set' ? 'border-emerald-600/40 bg-emerald-900/5' : ''
          return (
            <div
              key={p.nom}
              onClick={() => !blocked && select(p)}
              className={`modal-item group ${borderClass} ${blocked ? 'disabled' : ''}`}
            >
              {p.type === 'exotique' && <Badge type="exotic" />}
              {p.estNomme && p.type !== 'exotique' && <Badge type="named" />}
              {p.type === 'gear_set' && <Badge type="gearset" />}
              {blocked && <div className="text-[10px] text-red-400 mt-1">⚠ Exotique déjà équipé</div>}
              <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-shd transition-colors mt-1">
                {p.nom}
              </div>
              <div className="text-xs text-gray-500">{resolveMarque(p.marque)}</div>
              {Array.isArray(p.attributEssentiel) && p.attributEssentiel.length > 0 && <div className="text-[10px] text-blue-400 mt-1">{p.attributEssentiel.join(', ')}</div>}
              {p.talents && p.talents.length > 0 && (
                <div className="text-[10px] text-shd/70 mt-1 line-clamp-2">🏅 {p.talents[0]}</div>
              )}
            </div>
          )
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-12 uppercase tracking-widest">Aucun équipement trouvé</div>
      )}
    </SelectionModal>
  )
}

