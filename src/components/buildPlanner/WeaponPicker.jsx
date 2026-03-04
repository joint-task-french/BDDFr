import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import { getWeaponTypeLabel, getClassicWeaponTypes } from '../../utils/formatters'
import SelectionModal from '../common/SelectionModal'
import Badge from '../common/Badge'
import StatChip from '../common/StatChip'

const MODE_TITLES = {
  special: 'Arme Spécifique (Spécialisation)',
  classic: 'Arme Classique',
  sidearm: 'Arme de Poing',
}

export default function WeaponPicker({ data, mode, slotIndex, onClose, onSelect }) {
  const { canEquipExoticWeapon, canEquipExoticSidearm } = useBuild()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const classicTypes = useMemo(() => getClassicWeaponTypes(data.armes_type), [data.armes_type])

  const allWeapons = useMemo(() => {
    const armes = data.armes || []
    switch (mode) {
      case 'special':
        // Armes spécifiques viennent de classSpe
        return (data.classSpe || []).map(spec => ({
          nom: spec.arme.nom,
          type: 'arme_specifique',
          portee: spec.arme.portee,
          rpm: spec.arme.rpm,
          chargeur: spec.arme.chargeur,
          rechargement: spec.arme.rechargement,
          headshot: spec.arme.headshot,
          degatsBase: spec.arme.degatsBase,
          _specCle: spec.cle,
          _specNom: spec.nom,
          _specIcone: spec.icone,
        }))
      case 'sidearm':
        return armes.filter(w => w.type === 'pistolet')
      case 'classic':
      default:
        return armes.filter(w => classicTypes.includes(w.type))
    }
  }, [data, mode])

  const types = useMemo(() =>
    [...new Set(allWeapons.map(w => w.type))].filter(Boolean).sort(),
    [allWeapons]
  )

  const filtered = useMemo(() => {
    let list = allWeapons
    if (typeFilter !== 'all') list = list.filter(w => w.type === typeFilter)
    if (search) {
      const term = search.toLowerCase()
      list = list.filter(w =>
        w.nom.toLowerCase().includes(term) ||
        (w.fabricant || '').toLowerCase().includes(term) ||
        (getWeaponTypeLabel(data.armes_type, w.type)).toLowerCase().includes(term)
      )
    }
    return list
  }, [allWeapons, typeFilter, search])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(w => {
      const t = w.type || 'autre'
      if (!g[t]) g[t] = []
      g[t].push(w)
    })
    return g
  }, [filtered])

  const canEquipExotic = mode === 'sidearm'
    ? canEquipExoticSidearm()
    : mode === 'classic'
      ? canEquipExoticWeapon(slotIndex)
      : true // armes spécifiques ne sont pas exotiques

  const filterButtons = mode !== 'special' && mode !== 'sidearm' && (
    <>
      <button
        onClick={() => setTypeFilter('all')}
        className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest border transition-all ${
          typeFilter === 'all' ? 'bg-shd/20 text-shd border-shd/40' : 'text-gray-500 border-tactical-border hover:text-gray-300'
        }`}
      >
        Tout
      </button>
      {types.map(t => (
        <button
          key={t}
          onClick={() => setTypeFilter(t)}
          className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest border transition-all ${
            typeFilter === t ? 'bg-shd/20 text-shd border-shd/40' : 'text-gray-500 border-tactical-border hover:text-gray-300'
          }`}
        >
          {getWeaponTypeLabel(data.armes_type, t)}
        </button>
      ))}
    </>
  )

  return (
    <SelectionModal
      open={true}
      title={MODE_TITLES[mode] || 'Arme'}
      onClose={onClose}
      searchValue={search}
      onSearch={setSearch}
      filters={filterButtons}
    >
      {mode === 'special' ? (
        /* Armes spécifiques — affichage dédié par spécialisation */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(w => {
            const specLabel = w._specNom || ''
            const specIcon = w._specIcone || '🎖️'

            return (
              <div
                key={w.nom}
                onClick={() => onSelect(w)}
                className="modal-item group border-purple-500/30 bg-purple-500/5"
              >
                <div className="text-[9px] font-bold uppercase tracking-widest bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded inline-block mb-1">
                  {specIcon} {specLabel}
                </div>
                <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-purple-400 transition-colors">
                  {w.nom}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Armes classiques / pistolets */
        Object.entries(grouped).map(([type, weapons]) => (
          <div key={type} className="mb-4">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2 px-2 sticky top-0 bg-tactical-panel/90 py-2 z-10 border-b border-red-500/20">
              {getWeaponTypeLabel(data.armes_type, type)} ({weapons.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {weapons.map(w => {
                const blocked = w.estExotique && !canEquipExotic
                return (
                  <div
                    key={w.nom}
                    onClick={() => !blocked && onSelect(w)}
                    className={`modal-item group ${w.estExotique ? 'border-shd/40 bg-shd/5' : ''} ${blocked ? 'disabled' : ''}`}
                  >
                    {w.estExotique && <Badge type="exotic" />}
                    {blocked && (
                      <div className="text-[10px] text-red-400 mt-1">⚠ Exotique déjà équipée</div>
                    )}
                    <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-shd transition-colors mt-1">
                      {w.nom}
                    </div>
                    <div className="text-xs text-gray-500">{w.fabricant}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <StatChip icon="⚡" value={w.rpm ? `${w.rpm} CPM` : null} />
                      <StatChip icon="📦" value={w.chargeur || null} />
                      <StatChip icon="💥" value={w.degatsBase ? w.degatsBase.toLocaleString('fr-FR') : null} color="text-red-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-12 uppercase tracking-widest">Aucune arme trouvée</div>
      )}
    </SelectionModal>
  )
}

