import { useMemo, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDataLoader } from '../hooks/useDataLoader'
import Loader from '../components/common/Loader'
import CategoryNav from '../components/database/CategoryNav'
import CategorySection from '../components/database/CategorySection'
import SearchBar from '../components/database/SearchBar'
import { useFilterPanel } from '../components/database/FilterPanel'
import SortSelector from '../components/database/SortSelector'
import {
  getWeaponFilters, getWeaponDefaults, applyWeaponFilters,
  getGearFilters, getGearDefaults, applyGearFilters,
  getTalentArmeFilters, getTalentArmeDefaults, applyTalentArmeFilters,
  getTalentEquipFilters, getTalentEquipDefaults, applyTalentEquipFilters,
  getModArmeFilters, getModArmeDefaults, applyModArmeFilters,
  getModEquipementFilters, getModEquipementDefaults, applyModEquipementFilters,
  getModCompetenceFilters, getModCompetenceDefaults, applyModCompetenceFilters,
  getEnsembleFilters, getEnsembleDefaults, applyEnsembleFilters,
  getAttributFilters, getAttributDefaults, applyAttributFilters,
  getCompetenceFilters, getCompetenceDefaults, applyCompetenceFilters,
  RAR_ALPHA_SORT_OPTION, GEAR_SORT_OPTIONS, GENERIC_SORT_OPTIONS,
  applySortWeapons, applySortGear, applySortGeneric,
} from '../config/filterConfigs'

const CATEGORIES = [
  { key: 'armes', label: 'Armes', icon: '🔫' },
  { key: 'equipements', label: 'Équipements', icon: '🛡️' },
  { key: 'ensembles', label: 'Ensembles', icon: '🔗' },
  { key: 'competences', label: 'Compétences', icon: '⚡' },
  { key: 'attributs', label: 'Attributs', icon: '📊' },
  { key: 'talentsArmes', label: "Talents d'Armes", icon: '🎯' },
  { key: 'talentsEquipements', label: "Talents d'Équipements", icon: '🏅' },
  { key: 'modsArmes', label: "Mods d'Armes", icon: '🔧' },
  { key: 'modsEquipements', label: "Mods d'Équipements", icon: '⚙️' },
  { key: 'modsCompetences', label: 'Mods de Compétences', icon: '💎' },
]

// Catégories qui ont des filtres avancés
const FILTER_CATEGORIES = new Set([
  'armes', 'equipements', 'talentsArmes', 'talentsEquipements',
  'modsArmes', 'ensembles', 'attributs', 'competences',
  'modsEquipements', 'modsCompetences'
])

// Catégories avec options de tri
const SORT_CATEGORIES = {
  armes:              { options: RAR_ALPHA_SORT_OPTION, apply: applySortWeapons },
  equipements:        { options: GEAR_SORT_OPTIONS, apply: applySortGear },
  attributs:          { options: GENERIC_SORT_OPTIONS, apply: applySortGeneric },
  talentsArmes:       { options: RAR_ALPHA_SORT_OPTION, apply: applySortGeneric },
  talentsEquipements: { options: RAR_ALPHA_SORT_OPTION, apply: applySortGeneric },
  ensembles:          { options: GENERIC_SORT_OPTIONS, apply: applySortGeneric },
  competences:        { options: GENERIC_SORT_OPTIONS, apply: applySortGeneric },
  modsArmes:          { options: RAR_ALPHA_SORT_OPTION, apply: applySortGeneric },
  modsEquipements:    { options: GENERIC_SORT_OPTIONS, apply: applySortGeneric },
  modsCompetences:    { options: GENERIC_SORT_OPTIONS, apply: applySortGeneric },
}

function getFiltersConfig(category, data, values) {
  switch (category) {
    case 'armes':             return { filters: getWeaponFilters(data), defaults: getWeaponDefaults(data), apply: applyWeaponFilters }
    case 'equipements':       return { filters: getGearFilters(data), defaults: getGearDefaults(), apply: applyGearFilters }
    case 'talentsArmes':      return { filters: getTalentArmeFilters(data), defaults: getTalentArmeDefaults(), apply: applyTalentArmeFilters }
    case 'talentsEquipements':return { filters: getTalentEquipFilters(data), defaults: getTalentEquipDefaults(), apply: applyTalentEquipFilters }
    case 'modsArmes':         return { filters: getModArmeFilters(), defaults: getModArmeDefaults(), apply: applyModArmeFilters }
    case 'ensembles':         return { filters: getEnsembleFilters(data), defaults: getEnsembleDefaults(), apply: applyEnsembleFilters }
    case 'attributs':         return { filters: getAttributFilters(data), defaults: getAttributDefaults(), apply: applyAttributFilters }
    case 'competences':       return { filters: getCompetenceFilters(data), defaults: getCompetenceDefaults(), apply: applyCompetenceFilters }
    case 'modsEquipements':   return { filters: getModEquipementFilters(data), defaults: getModEquipementDefaults(), apply: applyModEquipementFilters }
    case 'modsCompetences':   return { filters: getModCompetenceFilters(data, values), defaults: getModCompetenceDefaults(), apply: applyModCompetenceFilters }
    default:                  return null
  }
}

export default function DatabasePage() {
  const { data, loading, error, progress } = useDataLoader()
  const { category, slug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Détermination de la catégorie active
  const activeCategory = category || 'armes'
  const activeCatObj = CATEGORIES.find(c => c.key === activeCategory)

  // 2. Lecture sécurisée des états depuis l'URL (Source de vérité absolue)
  const searchTerm = searchParams.get('q') || ''

  const activeValues = useMemo(() => {
    const rawFilters = searchParams.get('filters')
    if (!rawFilters) return {}
    try {
      // searchParams.get() décode déjà l'URL. S'il reste des '%', c'est un double-encodage (ex: via un vieux lien copié)
      const decoded = rawFilters.includes('%') ? decodeURIComponent(rawFilters) : rawFilters;
      return JSON.parse(decoded)
    } catch {
      return {}
    }
  }, [searchParams])

  const sortConfig = SORT_CATEGORIES[activeCategory] || null
  const currentSort = searchParams.get('sort') || sortConfig?.options?.[0]?.value || 'alpha_asc'

  // Configuration des filtres
  const filterConfig = useMemo(() => getFiltersConfig(activeCategory, data, activeValues), [activeCategory, data, activeValues])
  const currentFilters = useMemo(() => {
    if (!filterConfig) return null
    return { ...filterConfig.defaults, ...activeValues }
  }, [filterConfig, activeValues])

  // =========================================================
  // ACTIONS : Mises à jour intelligentes de l'URL
  // =========================================================

  const handleCategoryChange = useCallback((cat) => {
    navigate(`/db/${cat}`)
  }, [navigate])

  const handleSearchTermChange = useCallback((val) => {
    setSearchParams(prev => {
      if (val) prev.set('q', val)
      else prev.delete('q')
      return prev
    }, { replace: true })
  }, [setSearchParams])

  const handleSortChange = useCallback((val) => {
    setSearchParams(prev => {
      if (val && val !== sortConfig?.options?.[0]?.value) prev.set('sort', val)
      else prev.delete('sort')
      return prev
    }, { replace: true })
  }, [setSearchParams, sortConfig])

  const handleFilterChange = useCallback((key, value) => {
    // L'utilisation de `prev` assure que les filtres ne s'écrasent pas entre eux
    // en cas de clics très rapides ou d'utilisation d'un slider.
    setSearchParams(prev => {
      const rawFilters = prev.get('filters')
      let currentVals = {}
      if (rawFilters) {
        try {
          const decoded = rawFilters.includes('%') ? decodeURIComponent(rawFilters) : rawFilters;
          currentVals = JSON.parse(decoded)
        } catch { /* ignore */ }
      }

      const newValues = { ...currentVals, [key]: value }

      // Sécurité : vider l'emplacement si la compétence cible change
      if (activeCategory === 'modsCompetences' && key === 'competence') {
        newValues.emplacement = ''
      }

      // Nettoyage des valeurs vides
      const cleanValues = {}
      for (const [k, v] of Object.entries(newValues)) {
        if (v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)) {
          cleanValues[k] = v
        }
      }

      if (Object.keys(cleanValues).length > 0) {
        // Plus besoin de "encodeURIComponent" ici, le navigateur s'en charge.
        prev.set('filters', JSON.stringify(cleanValues))
      } else {
        prev.delete('filters')
      }

      return prev
    }, { replace: true })
  }, [activeCategory, setSearchParams])

  const handleFilterReset = useCallback(() => {
    setSearchParams(prev => {
      prev.delete('filters')
      return prev
    }, { replace: true })
  }, [setSearchParams])

  // =========================================================
  // DÉFILEMENT AUTOMATIQUE VERS LE SLUG
  // =========================================================
  useEffect(() => {
    if (slug && !loading && data) {
      setTimeout(() => {
        const element = document.getElementById(`item-${slug}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-shd', 'transition-all', 'duration-1000');
          setTimeout(() => element.classList.remove('ring-2', 'ring-shd'), 2000);
        }
      }, 100);
    }
  }, [slug, loading, data]);

  // =========================================================
  // APPLICATION DES FILTRES ET DU TRI
  // =========================================================
  const filteredData = useMemo(() => {
    let items = data[activeCategory]
    if (!items || !Array.isArray(items)) return []

    if (filterConfig && currentFilters) {
      items = filterConfig.apply(items, currentFilters)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(item =>
          Object.values(item).some(v =>
              typeof v === 'string' && v.toLowerCase().includes(term)
          )
      )
    }

    if (sortConfig) {
      items = sortConfig.apply(items, currentSort)
    }

    return items
  }, [data, activeCategory, searchTerm, filterConfig, currentFilters, sortConfig, currentSort])

  // =========================================================
  // RENDU
  // =========================================================
  const hasFilters = FILTER_CATEGORIES.has(activeCategory)
  const filterProps = hasFilters && filterConfig && currentFilters
      ? { filters: filterConfig.filters, values: currentFilters, onChange: handleFilterChange, onReset: handleFilterReset }
      : { filters: [], values: {}, onChange: () => {}, onReset: () => {} }
  const { button: filterButton, panel: filterPanel } = useFilterPanel(filterProps)

  if (loading) return <Loader progress={progress} />
  if (error) return (
      <div className="p-8 text-center">
        <p className="text-red-400 text-lg font-bold uppercase tracking-widest mb-2">Erreur de chargement</p>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
  )

  return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
            Base de <span className='text-shd'>Données</span>
          </h2>
          <p className="text-sm text-gray-500">The Division 2 — Données en français</p>
        </div>

        <SearchBar value={searchTerm} onChange={handleSearchTermChange} />

        <CategoryNav
            categories={CATEGORIES}
            active={activeCategory}
            onSelect={handleCategoryChange}
        />

        {(hasFilters || sortConfig) && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-3">
                {hasFilters && filterConfig && currentFilters && filterButton}
                {sortConfig && (
                    <SortSelector
                        options={sortConfig.options}
                        value={currentSort}
                        onChange={handleSortChange}
                    />
                )}
              </div>
              {filterPanel}
            </div>
        )}

        <CategorySection
            key={activeCategory}
            category={activeCatObj}
            items={filteredData}
            searchTerm={searchTerm}
            allData={data}
        />
      </div>
  )
}