import { useState, useMemo } from 'react'
import { normalizeText } from '../../utils/textUtils'
import { useBuild } from '../../context/BuildContext'
import { getGearSlotLabel } from '../../utils/formatters'
import { getGearFilters, getGearDefaults, applyGearFilters } from '../../config/filterConfigs'
import SelectionModal from '../common/SelectionModal'
import FilterPanel from '../database/FilterPanel'
import Badge from '../common/Badge'
import { resolveAsset, GameIcon } from '../common/GameAssets'

const SLOT_ORDER = {
  'masque': 1,
  'sac_a_dos': 2,
  'torse': 3,
  'gants': 4,
  'holster': 5,
  'genouilleres': 6
}

function getSlotOrder(slot) {
  return SLOT_ORDER[slot] || 99
}

export default function GearPicker({ data, slotKey, onClose, onSelectTalent }) {
  const { dispatch, canEquipExoticGear } = useBuild()
  const [search, setSearch] = useState('')

  // Database-style filters, pre-filter on emplacement
  const filterConfig = useMemo(() => {
    const configs = getGearFilters(data)
    // Remove emplacement filter since it's already fixed by slotKey
    return configs.filter(f => f.key !== 'emplacement')
  }, [data])
  const defaultFilters = useMemo(() => {
    const d = getGearDefaults()
    d.emplacement = '' // Not used, pre-filtered
    return d
  }, [])
  const [filters, setFilters] = useState(defaultFilters)
  const handleFilterChange = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const resetFilters = () => setFilters(defaultFilters)

  const allPieces = useMemo(() => {
    const pieces = []
    const seen = new Set()
    const rawEquipements = data.equipements || {}
    const list = Array.isArray(rawEquipements) ? rawEquipements : Object.values(rawEquipements)
    list.forEach(e => {
      if (e.emplacement === slotKey && !seen.has(e.nom)) {
        seen.add(e.nom)
        pieces.push(e)
      }
    })
    return pieces
  }, [data, slotKey])

  // Apply database-style filters
  const afterFilters = useMemo(() => {
    // Inject emplacement into filters for applyGearFilters
    const f = { ...filters, emplacement: '' } // Emplacement already pre-filtered
    return applyGearFilters(allPieces, f)
  }, [allPieces, filters])

  const filtered = useMemo(() => {
    let list = afterFilters
    if (search) {
      const term = normalizeText(search)
      list = list.filter(p =>
          normalizeText(p.nom).includes(term) ||
          normalizeText(p.marque || '').includes(term)
      )
    }
    // Sort: exotics (0) > named (1) > gear sets (2) > standard (3) > improvise (4)
    list.sort((a, b) => {
      const getRarity = (p) => p.type === 'exotique' ? 0 : p.estNomme ? 1 : p.type === 'gear_set' ? 2 : p.type === 'improvise' ? 4 : 3
      const ra = getRarity(a)
      const rb = getRarity(b)

      if (ra !== rb) return ra - rb

      const marqueA = a.marque || ''
      const marqueB = b.marque || ''
      const cmpMarque = marqueA.localeCompare(marqueB, 'fr')
      if (cmpMarque !== 0) return cmpMarque

      const orderA = getSlotOrder(a.emplacement)
      const orderB = getSlotOrder(b.emplacement)
      if (orderA !== orderB) return orderA - orderB

      const nomA = a.nom || ''
      const nomB = b.nom || ''
      return nomA.localeCompare(nomB, 'fr')
    })
    return list
  }, [afterFilters, search])

  const canExotic = canEquipExoticGear(slotKey)

  const select = (piece) => {
    if (piece.type === 'exotique' && !canExotic) return
    dispatch({ type: 'SET_GEAR', slot: slotKey, piece })
    onClose()
  }

  // Résolution slug → nom pour les marques
  const marqueNames = useMemo(() => {
    const map = {}
    const rawEnsembles = data.ensembles || {}
    const list = Array.isArray(rawEnsembles) ? rawEnsembles : Object.values(rawEnsembles)
    for (const e of list) {
      if (e.slug) map[e.slug] = e.nom
      map[e.nom.toLowerCase()] = e.nom
    }
    return map
  }, [data.ensembles])

  const resolveMarque = (slug) => marqueNames[slug] || marqueNames[slug?.toLowerCase()] || slug

  return (
      <SelectionModal
          open={true}
          title={`Sélection — ${getGearSlotLabel(data.equipements_type, slotKey)}`}
          onClose={onClose}
          searchValue={search}
          onSearch={setSearch}
      >
        {/* Filtres avancés style base de données */}
        <div className="mb-4">
          <FilterPanel
              filters={filterConfig}
              values={filters}
              onChange={handleFilterChange}
              onReset={resetFilters}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map(p => {
            const blocked = p.type === 'exotique' && !canExotic
            const borderClass = p.type === 'exotique' ? 'border-shd/60 bg-shd/5'
                : p.estNomme ? 'border-yellow-600/40 bg-yellow-900/5'
                    : p.type === 'gear_set' ? 'border-emerald-600/40 bg-emerald-900/5' : ''
            const isExotic = p.type === 'exotique'
            const marqueNom = resolveMarque(p.marque)
            const mainText = isExotic ? p.nom : (marqueNom || p.nom)
            const subText = isExotic ? (p.marque ? marqueNom : 'Équipement Exotique') : (marqueNom ? p.nom : 'Équipement Improvisé')

            // Résolution de l'icône : d'abord l'icône spécifique de la pièce, 
            // sinon l'icône spécifiée dans l'ensemble (marque/gear set),
            // sinon le slug de marque, sinon l'icône générique par emplacement.
            const ensemble = data.ensembles?.[p.marque]
            const iconSlug = p.icon || ensemble?.icon || p.marque || p.emplacement

            // Résolution du nom du talent
            const talentSlug = p.talents && p.talents.length > 0 ? p.talents[0] : null
            const talentData = talentSlug ? (data.talentsEquipements?.[talentSlug] || data.talentsAutres?.[talentSlug]) : null
            const talentName = talentData?.nom || talentSlug

            return (
                <div
                    key={p.nom}
                    onClick={() => !blocked && select(p)}
                    className={`modal-item group flex gap-3 ${borderClass} ${blocked ? 'disabled' : ''}`}
                >
                  <div className="shrink-0 pt-1">
                    <GameIcon
                        src={resolveAsset(iconSlug)}
                        alt={marqueNom || p.nom}
                        size="w-10 h-10"
                        color={isExotic ? 'text-shd' : p.type === 'gear_set' ? 'text-emerald-500' : 'text-gray-400'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {p.type === 'exotique' && <Badge type="exotic" />}
                    {p.estNomme && p.type !== 'exotique' && <Badge type="named" />}
                    {p.type === 'gear_set' && <Badge type="gearset" />}
                    {blocked && <div className="text-xs text-red-400 mt-1">⚠ Exotique déjà équipé</div>}
                    <div className="font-bold text-white text-sm uppercase tracking-wide group-hover:text-shd transition-colors mt-1 truncate">
                      {mainText}
                    </div>
                    <div className="text-xs text-gray-400 font-medium truncate">{subText}</div>
                    {Array.isArray(p.attributEssentiel) && p.attributEssentiel.length > 0 && (
                        <div className="text-xs text-blue-400 mt-1">
                          {p.attributEssentiel.includes('random') ? 'Aléatoire' : p.attributEssentiel.join(', ')}
                        </div>
                    )}
                    {talentName && (
                        <div className="text-xs text-shd/70 mt-1">🏅 {talentName}</div>
                    )}
                  </div>
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