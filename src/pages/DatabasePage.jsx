import { useState, useMemo } from 'react'
import { useDataLoader } from '../hooks/useDataLoader'
import Loader from '../components/common/Loader'
import CategoryNav from '../components/database/CategoryNav'
import CategorySection from '../components/database/CategorySection'
import SearchBar from '../components/database/SearchBar'

const CATEGORIES = [
  { key: 'armes', label: 'Armes', icon: '🔫' },
  { key: 'equipements', label: 'Équipements', icon: '🛡️' },
  { key: 'talentsArmes', label: "Talents d'Armes", icon: '🎯' },
  { key: 'talentsEquipements', label: "Talents d'Équipements", icon: '🏅' },
  { key: 'ensembles', label: 'Ensembles', icon: '🔗' },
  { key: 'competences', label: 'Compétences', icon: '⚡' },
  { key: 'modsArmes', label: "Mods d'Armes", icon: '🔧' },
  { key: 'modsEquipements', label: "Mods d'Équipements", icon: '⚙️' },
  { key: 'modsCompetences', label: 'Mods de Compétences', icon: '💎' },
]

export default function DatabasePage() {
  const { data, loading, progress } = useDataLoader()
  const [activeCategory, setActiveCategory] = useState('armes')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = useMemo(() => {
    const items = data[activeCategory]
    if (!items || !Array.isArray(items)) return []
    if (!searchTerm) return items
    const term = searchTerm.toLowerCase()
    return items.filter(item =>
      Object.values(item).some(v =>
        typeof v === 'string' && v.toLowerCase().includes(term)
      )
    )
  }, [data, activeCategory, searchTerm])

  if (loading) return <Loader progress={progress} />

  const activeCat = CATEGORIES.find(c => c.key === activeCategory)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
          Base de Données <span className="text-shd">SHD</span>
        </h2>
        <p className="text-sm text-gray-500">The Division 2 — Données en français</p>
      </div>

      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <CategoryNav
        categories={CATEGORIES}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

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

