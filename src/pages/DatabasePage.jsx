import { useMemo, useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDataLoader } from '../hooks/useDataLoader'
import Loader from '../components/common/Loader'
import CategoryNav from '../components/database/CategoryNav'
import CategorySection from '../components/database/CategorySection'
import SearchBar from '../components/database/SearchBar'
import { useFilterPanel } from '../components/database/FilterPanel'
import { useSortPanel } from '../components/database/SortSelector'
import {
  getWeaponFilters, getWeaponDefaults, applyWeaponFilters,
  getGearFilters, getGearDefaults, applyGearFilters,
  getTalentArmeFilters, getTalentArmeDefaults, applyTalentArmeFilters,
  getTalentEquipFilters, getTalentEquipDefaults, applyTalentEquipFilters,
  getTalentPrototypeFilters, getTalentPrototypeDefaults, applyTalentPrototypeFilters,
  getModArmeFilters, getModArmeDefaults, applyModArmeFilters,
  getModEquipementFilters, getModEquipementDefaults, applyModEquipementFilters,
  getModCompetenceFilters, getModCompetenceDefaults, applyModCompetenceFilters,
  getEnsembleFilters, getEnsembleDefaults, applyEnsembleFilters,
  getAttributFilters, getAttributDefaults, applyAttributFilters,
  getCompetenceFilters, getCompetenceDefaults, applyCompetenceFilters,
  getDescenteFilters, getDescenteDefaults, applyDescenteFilters,

  WEAPON_SORT_OPTIONS, WEAPON_DEFAULT_SORT, applySortWeapons,
  GEAR_SORT_OPTIONS, GEAR_DEFAULT_SORT, applySortGear,
  ENSEMBLE_SORT_OPTIONS, ENSEMBLE_DEFAULT_SORT, applySortEnsembles,
  TALENT_ARME_SORT_OPTIONS, TALENT_ARME_DEFAULT_SORT, applySortTalentsArmes,
  TALENT_EQUIP_SORT_OPTIONS, TALENT_EQUIP_DEFAULT_SORT, applySortTalentsEquip,
  TALENT_PROTOTYPE_SORT_OPTIONS, TALENT_PROTOTYPE_DEFAULT_SORT, applySortTalentsPrototypes,
  MOD_ARME_SORT_OPTIONS, MOD_ARME_DEFAULT_SORT, applySortModsArmes,
  MOD_EQUIP_SORT_OPTIONS, MOD_EQUIP_DEFAULT_SORT, applySortModsEquip,
  MOD_COMP_SORT_OPTIONS, MOD_COMP_DEFAULT_SORT, applySortModsComp,
  ATTRIBUT_SORT_OPTIONS, ATTRIBUT_DEFAULT_SORT, applySortAttributs,
  SKILL_SORT_OPTIONS, SKILL_DEFAULT_SORT, applySortSkills,
  DESCENTE_SORT_OPTIONS, DESCENTE_DEFAULT_SORT, applySortDescente
} from '../config/filterConfigs'

const CATEGORIES = [
  { key: 'armes', label: 'Armes', icon: '🔫' },
  { key: 'equipements', label: 'Équipements', icon: '🛡️' },
  { key: 'ensembles', label: 'Ensembles', icon: '🔗' },
  { key: 'competences', label: 'Compétences', icon: '⚡' },
  { key: 'attributs', label: 'Attributs', icon: '📊' },
  { key: 'talentsArmes', label: "Talents d'Armes", icon: '🎯' },
  { key: 'talentsEquipements', label: "Talents d'Équipements", icon: '🏅' },
  { key: 'talentsPrototypes', label: "Talents Prototypes", icon: '🧬' },
  { key: 'modsArmes', label: "Mods d'Armes", icon: '🔧' },
  { key: 'modsEquipements', label: "Mods d'Équipements", icon: '⚙️' },
  { key: 'modsCompetences', label: 'Mods de Compétences', icon: '💎' },
  { key: 'descente', label: 'Descente', icon: '🧬' },
]

// Catégories qui ont des filtres avancés
const FILTER_CATEGORIES = new Set([
  'armes', 'equipements', 'talentsArmes', 'talentsEquipements', 'talentsPrototypes',
  'modsArmes', 'ensembles', 'attributs', 'competences',
  'modsEquipements', 'modsCompetences', 'descente'
])

// Catégories avec options de tri multi-couches
const SORT_CATEGORIES = {
  armes:              { options: WEAPON_SORT_OPTIONS, default: WEAPON_DEFAULT_SORT, apply: applySortWeapons },
  equipements:        { options: GEAR_SORT_OPTIONS, default: GEAR_DEFAULT_SORT, apply: applySortGear },
  attributs:          { options: ATTRIBUT_SORT_OPTIONS, default: ATTRIBUT_DEFAULT_SORT, apply: applySortAttributs },
  talentsArmes:       { options: TALENT_ARME_SORT_OPTIONS, default: TALENT_ARME_DEFAULT_SORT, apply: applySortTalentsArmes },
  talentsEquipements: { options: TALENT_EQUIP_SORT_OPTIONS, default: TALENT_EQUIP_DEFAULT_SORT, apply: applySortTalentsEquip },
  talentsPrototypes: { options: TALENT_PROTOTYPE_SORT_OPTIONS, default: TALENT_PROTOTYPE_DEFAULT_SORT, apply: applySortTalentsPrototypes },
  ensembles:          { options: ENSEMBLE_SORT_OPTIONS, default: ENSEMBLE_DEFAULT_SORT, apply: applySortEnsembles },
  competences:        { options: SKILL_SORT_OPTIONS, default: SKILL_DEFAULT_SORT, apply: applySortSkills },
  modsArmes:          { options: MOD_ARME_SORT_OPTIONS, default: MOD_ARME_DEFAULT_SORT, apply: applySortModsArmes },
  modsEquipements:    { options: MOD_EQUIP_SORT_OPTIONS, default: MOD_EQUIP_DEFAULT_SORT, apply: applySortModsEquip },
  modsCompetences:    { options: MOD_COMP_SORT_OPTIONS, default: MOD_COMP_DEFAULT_SORT, apply: applySortModsComp },
  descente:           { options: DESCENTE_SORT_OPTIONS, default: DESCENTE_DEFAULT_SORT, apply: applySortDescente },
}

function getFiltersConfig(category, data, values) {
  switch (category) {
    case 'armes':             return { filters: getWeaponFilters(data), defaults: getWeaponDefaults(data), apply: applyWeaponFilters }
    case 'equipements':       return { filters: getGearFilters(data), defaults: getGearDefaults(), apply: applyGearFilters }
    case 'talentsArmes':      return { filters: getTalentArmeFilters(data), defaults: getTalentArmeDefaults(), apply: applyTalentArmeFilters }
    case 'talentsEquipements':return { filters: getTalentEquipFilters(data), defaults: getTalentEquipDefaults(), apply: applyTalentEquipFilters }
    case 'talentsPrototypes': return { filters: getTalentPrototypeFilters(data), defaults: getTalentPrototypeDefaults(), apply: applyTalentPrototypeFilters }
    case 'modsArmes':         return { filters: getModArmeFilters(data), defaults: getModArmeDefaults(), apply: applyModArmeFilters }
    case 'ensembles':         return { filters: getEnsembleFilters(data), defaults: getEnsembleDefaults(), apply: applyEnsembleFilters }
    case 'attributs':         return { filters: getAttributFilters(data), defaults: getAttributDefaults(), apply: applyAttributFilters }
    case 'competences':       return { filters: getCompetenceFilters(data), defaults: getCompetenceDefaults(), apply: applyCompetenceFilters }
    case 'modsEquipements':   return { filters: getModEquipementFilters(data), defaults: getModEquipementDefaults(), apply: applyModEquipementFilters }
    case 'modsCompetences':   return { filters: getModCompetenceFilters(data, values), defaults: getModCompetenceDefaults(), apply: applyModCompetenceFilters }
    case 'descente':          return { filters: getDescenteFilters(data), defaults: getDescenteDefaults(), apply: applyDescenteFilters }
    default:                  return null
  }
}

export default function DatabasePage() {
  const { data, loading, error, progress } = useDataLoader()
  const { category, slug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCompactMode, setIsCompactMode] = useState(() => {
    return localStorage.getItem('db_compact_mode') === 'true'
  })

  const toggleCompactMode = useCallback(() => {
    setIsCompactMode(prev => {
      const newVal = !prev
      localStorage.setItem('db_compact_mode', String(newVal))
      return newVal
    })
  }, [])

  // 1. Détermination de la catégorie active
  const activeCategory = category || 'armes'
  const activeCatObj = CATEGORIES.find(c => c.key === activeCategory)

  // 2. Lecture sécurisée des états depuis l'URL
  const searchTerm = searchParams.get('q') || ''

  const activeValues = useMemo(() => {
    const rawFilters = searchParams.get('filters')
    if (!rawFilters) return {}
    try {
      const decoded = rawFilters.includes('%') ? decodeURIComponent(rawFilters) : rawFilters;
      return JSON.parse(decoded)
    } catch {
      return {}
    }
  }, [searchParams])

  const sortConfig = SORT_CATEGORIES[activeCategory] || null

  const currentSort = useMemo(() => {
    const rawSort = searchParams.get('sort')
    if (rawSort) {
      try {
        const decoded = rawSort.includes('%') ? decodeURIComponent(rawSort) : rawSort;
        return JSON.parse(decoded)
      } catch {
        return sortConfig?.default || []
      }
    }
    return sortConfig?.default || []
  }, [searchParams, sortConfig])

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
      if (val && JSON.stringify(val) !== JSON.stringify(sortConfig?.default)) {
        prev.set('sort', JSON.stringify(val))
      } else {
        prev.delete('sort')
      }
      return prev
    }, { replace: true })
  }, [setSearchParams, sortConfig])

  const handleFilterChange = useCallback((key, value) => {
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

      if (activeCategory === 'modsCompetences' && key === 'competence') {
        newValues.emplacement = ''
      }

      const cleanValues = {}
      for (const [k, v] of Object.entries(newValues)) {
        if (v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)) {
          cleanValues[k] = v
        }
      }

      if (Object.keys(cleanValues).length > 0) {
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
  // APPLICATION DES FILTRES ET DU TRI AVEC RÉSOLUTION GLOBALE
  // =========================================================
  const filteredData = useMemo(() => {
    let items = []

    if (activeCategory === 'descente') {
      const wTalents = Array.isArray(data?.talentsArmes) ? data.talentsArmes : Object.values(data?.talentsArmes || {})
      const gTalents = Array.isArray(data?.talentsEquipements) ? data.talentsEquipements : Object.values(data?.talentsEquipements || {})

      const descentWeapons = wTalents.filter(t => t.descente).map(t => ({ ...t, isWeaponTalent: true }))
      const descentGear = gTalents.filter(t => t.descente).map(t => ({ ...t, isWeaponTalent: false }))

      items = [...descentWeapons, ...descentGear]
    } else {
      items = data[activeCategory]
    }

    if (!items || !Array.isArray(items)) return []

    if (filterConfig && currentFilters) {
      items = filterConfig.apply(items, currentFilters)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()

      const slugDict = {}
      const populateDict = (source, nameField = 'nom') => {
        if (!source) return
        if (Array.isArray(source)) {
          source.forEach(item => {
            if (item.slug && item[nameField]) slugDict[item.slug] = String(item[nameField]).toLowerCase()
          })
        } else {
          Object.entries(source).forEach(([key, val]) => {
            if (val && val[nameField]) slugDict[key] = String(val[nameField]).toLowerCase()
          })
        }
      }

      populateDict(data?.ensembles)
      populateDict(data?.attributs)
      populateDict(data?.talentsArmes)
      populateDict(data?.talentsEquipements)
      populateDict(data?.statistiques)
      populateDict(data?.modsArmes)
      populateDict(data?.modsEquipements)
      populateDict(data?.armes_type || data?.armesType || data?.['armes-type'])
      populateDict(data?.equipements_type || data?.equipementsType || data?.['equipements-type'])
      populateDict(data?.attributs_type || data?.attributsType || data?.['attributs-type'])
      populateDict(data?.class_spe || data?.classSpe || data?.['class-spe'])

      const extractText = (val) => {
        if (!val) return ''
        if (typeof val === 'string') {
          const resolved = slugDict[val]
          return resolved ? `${val.toLowerCase()} ${resolved}` : val.toLowerCase()
        }
        if (typeof val === 'number' || typeof val === 'boolean') {
          return String(val).toLowerCase()
        }
        if (Array.isArray(val)) {
          return val.map(extractText).join(' ')
        }
        if (typeof val === 'object') {
          return Object.values(val).map(extractText).join(' ')
        }
        return ''
      }

      items = items.filter(item => {
        const fullItemText = extractText(item)
        const descenteText = item.descente?.levels?.base?.toLowerCase() || ''
        return fullItemText.includes(term) || descenteText.includes(term)
      })
    }

    if (sortConfig && currentSort.length > 0) {
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

  const { button: sortButton, panel: sortPanel } = useSortPanel({
    options: sortConfig?.options,
    value: currentSort,
    defaultSort: sortConfig?.default,
    onChange: handleSortChange
  })

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
                {sortConfig && sortButton}
                <button
                    onClick={toggleCompactMode}
                    className={`px-3 py-2 rounded border transition-all flex items-center gap-2 uppercase tracking-widest text-xs font-bold ${
                        isCompactMode
                            ? 'bg-shd/20 text-shd border-shd/40'
                            : 'bg-tactical-panel text-gray-400 border-tactical-border hover:border-gray-500 hover:text-gray-300'
                    }`}
                    title={isCompactMode ? 'Désactiver le mode compact' : 'Activer le mode compact'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isCompactMode ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    )}
                  </svg>
                  <span className="hidden sm:inline">Compact</span>
                </button>
              </div>

              {/* Affichage des panneaux sous les boutons */}
              {filterPanel}
              {sortPanel}
            </div>
        )}

        <CategorySection
            key={activeCategory}
            category={activeCatObj}
            items={filteredData}
            searchTerm={searchTerm}
            allData={data}
            isCompactMode={isCompactMode}
        />
      </div>
  )
}