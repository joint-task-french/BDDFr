import { useState, useMemo } from 'react'
import { normalizeText } from '../../utils/textUtils'
import { useBuild } from '../../context/BuildContext'
import { getWeaponTypeLabel, getClassicWeaponTypes } from '../../utils/formatters'
import { getWeaponFilters, getWeaponDefaults, applyWeaponFilters } from '../../config/filterConfigs'
import SelectionModal from '../common/SelectionModal'
import FilterPanel from '../database/FilterPanel'
import Badge from '../common/Badge'
import StatChip from '../common/StatChip'
import { resolveAsset, GameIcon } from '../common/GameAssets'

const MODE_TITLES = {
  special: 'Arme Spécifique (Spécialisation)',
  classic: 'Arme Classique',
  sidearm: 'Arme de Poing',
}

export default function WeaponPicker({ data, mode, slotIndex, onClose, onSelect }) {
  const { canEquipExoticWeapon, canEquipExoticSidearm } = useBuild()
  const [search, setSearch] = useState('')

  // Database-style filters
  const filterConfig = useMemo(() => mode !== 'special' ? getWeaponFilters(data) : [], [data, mode])
  const defaultFilters = useMemo(() => mode !== 'special' ? getWeaponDefaults(data) : {}, [data, mode])
  const [filters, setFilters] = useState(defaultFilters)
  const handleFilterChange = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const resetFilters = () => setFilters(defaultFilters)

  const classicTypes = useMemo(() => getClassicWeaponTypes(data.armes_type), [data.armes_type])

  const allWeapons = useMemo(() => {
    const rawArmes = data.armes || {}
    const armes = Array.isArray(rawArmes) ? rawArmes : Object.values(rawArmes)
    switch (mode) {
      case 'special':
        const rawClassSpe = data.classSpe || {}
        const classSpeList = Array.isArray(rawClassSpe) ? rawClassSpe : Object.values(rawClassSpe)
        return classSpeList.map(spec => ({
          ...spec.arme,
          specialisation: spec.nom,
          _specCle: spec.cle,
          _specNom: spec.nom,
          _specIcone: spec.icon,
        }))
      case 'sidearm':
        return armes.filter(w => w.type === 'pistolet' || w.armePoing === true)
      case 'classic':
      default:
        return armes.filter(w => classicTypes.includes(w.type) && w.armePoing !== true)
    }
  }, [data, mode])

  // Apply database-style filters
  const afterFilters = useMemo(() => {
    if (mode === 'special') return allWeapons
    return applyWeaponFilters(allWeapons, filters)
  }, [allWeapons, filters, mode])

  const filtered = useMemo(() => {
    let list = afterFilters
    if (search) {
      const term = normalizeText(search)
      list = list.filter(w =>
        normalizeText(w.nom).includes(term) ||
        normalizeText(w.fabricant || '').includes(term) ||
        normalizeText(getWeaponTypeLabel(data.armes_type, w.type)).includes(term)
      )
    }
    return list
  }, [afterFilters, search, data.armes_type])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(w => {
      const t = w.armePoing ? 'armePoing' : (w.type || 'autre')
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

  return (
    <SelectionModal
      open={true}
      title={MODE_TITLES[mode] || 'Arme'}
      onClose={onClose}
      searchValue={search}
      onSearch={setSearch}
    >
      {/* Filtres avancés style base de données */}
      {mode !== 'special' && (
        <div className="mb-4">
          <FilterPanel
            filters={filterConfig}
            values={filters}
            onChange={handleFilterChange}
            onReset={resetFilters}
          />
        </div>
      )}

      {mode === 'special' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(w => (
            <div
              key={w.nom}
              onClick={() => onSelect(w)}
              className="modal-item group flex gap-3 border-purple-500/30 bg-purple-500/5"
            >
              <div className="shrink-0 pt-1">
                <GameIcon
                  src={resolveAsset(w.icon || w._specIcone)}
                  alt={w.nom}
                  size="w-10 h-10"
                  color="text-purple-400"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded inline-block mb-1">
                  {w._specNom}
                </div>
                <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-purple-400 transition-colors truncate">
                  {w.nom}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([type, weapons]) => (
          <div key={type} className="mb-4">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2 px-2 sticky top-0 bg-tactical-panel/90 py-2 z-10 border-b border-red-500/20">
              {type === 'armePoing' ? 'Arme de poing' : getWeaponTypeLabel(data.armes_type, type)} ({weapons.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {weapons.map(w => {
                const blocked = w.estExotique && !canEquipExotic
                const isExotic = w.estExotique
                const mainText = isExotic ? w.nom : (w.fabricant || getWeaponTypeLabel(data.armes_type, w.type))
                const subText = isExotic ? w.fabricant : w.nom

                return (
                  <div
                    key={w.nom}
                    onClick={() => !blocked && onSelect(w)}
                    className={`modal-item group flex gap-3 ${w.estExotique ? 'border-shd/40 bg-shd/5' : ''} ${blocked ? 'disabled' : ''}`}
                  >
                    <div className="shrink-0 pt-1">
                      <GameIcon
                        src={resolveAsset(w.type)}
                        alt={w.type}
                        size="w-10 h-10"
                        color={isExotic ? 'text-red-400' : 'text-gray-400'}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {w.estExotique && <Badge type="exotic" />}
                      {blocked && (
                        <div className="text-xs text-red-400 mt-1">⚠ Exotique déjà équipée</div>
                      )}
                      <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-shd transition-colors mt-1 truncate">
                        {mainText}
                      </div>
                      <div className="text-xs text-gray-400 font-medium truncate">{subText}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <StatChip icon="⚡" value={w.rpm ? `${w.rpm} CPM` : null} />
                        <StatChip icon="📦" value={w.chargeur || null} />
                        <StatChip icon="💥" value={w.degatsBase ? w.degatsBase.toLocaleString('fr-FR') : null} color="text-red-400" />
                      </div>
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

