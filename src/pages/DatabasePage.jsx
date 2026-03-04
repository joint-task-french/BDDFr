import { useState, useMemo, useCallback } from 'react'
import { useDataLoader } from '../hooks/useDataLoader'
import Loader from '../components/common/Loader'
import CategoryNav from '../components/database/CategoryNav'
import CategorySection from '../components/database/CategorySection'
import SearchBar from '../components/database/SearchBar'
import FilterPanel from '../components/database/FilterPanel'
import {
  getWeaponFilters, getWeaponDefaults, applyWeaponFilters,
  getGearFilters, getGearDefaults, applyGearFilters,
  getTalentArmeFilters, getTalentArmeDefaults, applyTalentArmeFilters,
  getTalentEquipFilters, getTalentEquipDefaults, applyTalentEquipFilters,
  getModArmeFilters, getModArmeDefaults, applyModArmeFilters,
} from '../config/filterConfigs'

const CATEGORIES = [
  { key: 'armes', label: 'Armes', icon: '🔫' },
  { key: 'equipements', label: 'Équipements', icon: '🛡️' },
  { key: 'attributs', label: 'Attributs', icon: '📊' },
  { key: 'talentsArmes', label: "Talents d'Armes", icon: '🎯' },
  { key: 'talentsEquipements', label: "Talents d'Équipements", icon: '🏅' },
  { key: 'ensembles', label: 'Ensembles', icon: '🔗' },
  { key: 'competences', label: 'Compétences', icon: '⚡' },
  { key: 'modsArmes', label: "Mods d'Armes", icon: '🔧' },
  { key: 'modsEquipements', label: "Mods d'Équipements", icon: '⚙️' },
  { key: 'modsCompetences', label: 'Mods de Compétences', icon: '💎' },
]

// Catégories qui ont des filtres avancés
const FILTER_CATEGORIES = new Set(['armes', 'equipements', 'talentsArmes', 'talentsEquipements', 'modsArmes'])

function getFiltersConfig(category, data) {
  switch (category) {
    case 'armes':             return { filters: getWeaponFilters(data), defaults: getWeaponDefaults(data), apply: applyWeaponFilters }
    case 'equipements':       return { filters: getGearFilters(data), defaults: getGearDefaults(), apply: applyGearFilters }
    case 'talentsArmes':      return { filters: getTalentArmeFilters(data), defaults: getTalentArmeDefaults(), apply: applyTalentArmeFilters }
    case 'talentsEquipements':return { filters: getTalentEquipFilters(data), defaults: getTalentEquipDefaults(), apply: applyTalentEquipFilters }
    case 'modsArmes':         return { filters: getModArmeFilters(), defaults: getModArmeDefaults(), apply: applyModArmeFilters }
    default:                  return null
  }
}

export default function DatabasePage() {
  const { data, loading, error, progress } = useDataLoader()
  const [activeCategory, setActiveCategory] = useState('armes')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterValues, setFilterValues] = useState({})

  const filterConfig = useMemo(() => getFiltersConfig(activeCategory, data), [activeCategory, data])

  // Valeurs de filtres courantes (avec defaults si pas encore initialisés)
  const currentFilters = useMemo(() => {
    if (!filterConfig) return null
    return { ...filterConfig.defaults, ...(filterValues[activeCategory] || {}) }
  }, [filterConfig, filterValues, activeCategory])

  const handleFilterChange = useCallback((key, value) => {
    setFilterValues(prev => ({
      ...prev,
      [activeCategory]: { ...(prev[activeCategory] || {}), [key]: value }
    }))
  }, [activeCategory])

  const handleFilterReset = useCallback(() => {
    setFilterValues(prev => ({ ...prev, [activeCategory]: {} }))
  }, [activeCategory])

  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat)
    setSearchTerm('')
  }, [])

  const filteredData = useMemo(() => {
    let items = data[activeCategory]
    if (!items || !Array.isArray(items)) return []

    // Appliquer les filtres avancés
    if (filterConfig && currentFilters) {
      items = filterConfig.apply(items, currentFilters)
    }

    // Appliquer la recherche textuelle
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(item =>
        Object.values(item).some(v =>
          typeof v === 'string' && v.toLowerCase().includes(term)
        )
      )
    }

    return items
  }, [data, activeCategory, searchTerm, filterConfig, currentFilters])

  if (loading) return <Loader progress={progress} />
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-400 text-lg font-bold uppercase tracking-widest mb-2">Erreur de chargement</p>
      <p className="text-gray-400 text-sm">{error}</p>
    </div>
  )

  const activeCat = CATEGORIES.find(c => c.key === activeCategory)
  const hasFilters = FILTER_CATEGORIES.has(activeCategory)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
          Base de Données
        </h2>
        <p className="text-sm text-gray-500">The Division 2 — Données en français</p>
      </div>

      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      <CategoryNav
        categories={CATEGORIES}
        active={activeCategory}
        onSelect={handleCategoryChange}
      />

      {hasFilters && filterConfig && currentFilters && (
          <FilterPanel
              filters={filterConfig.filters}
              values={currentFilters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
          />
      )}

      <CategorySection
        key={activeCategory}
        category={activeCat}
        items={filteredData}
        searchTerm={searchTerm}
        allData={data}
      />
    </div>
  )
}
