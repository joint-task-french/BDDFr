import WeaponCard from './cards/WeaponCard'
import GearCard from './cards/GearCard'
import TalentArmeCard from './cards/TalentArmeCard'
import TalentEquipCard from './cards/TalentEquipCard'
import EnsembleCard from './cards/EnsembleCard'
import SkillCard from './cards/SkillCard'
import ModArmeCard from './cards/ModArmeCard'
import AttributCard from './cards/AttributCard'

// Layout grids par catégorie
const GRID_CONFIG = {
  armes:             'grid-cols-1 lg:grid-cols-2',
  equipements:       'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  attributs:         'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  talentsArmes:      'grid-cols-1 sm:grid-cols-2',
  talentsEquipements:'grid-cols-1 sm:grid-cols-2',
  ensembles:         'grid-cols-1 sm:grid-cols-2',
  competences:       'grid-cols-1 sm:grid-cols-2',
  modsArmes:         'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  modsEquipements:   'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  modsCompetences:   'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

// Quel composant card pour chaque catégorie
const CARD_COMPONENTS = {
  armes: WeaponCard,
  equipements: GearCard,
  attributs: AttributCard,
  talentsArmes: TalentArmeCard,
  talentsEquipements: TalentEquipCard,
  ensembles: EnsembleCard,
  competences: SkillCard,
  modsArmes: ModArmeCard,
}

// Fallback card générique pour mods équipement / compétences
function GenericCard({ item }) {
  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg px-4 py-3 space-y-1">
      {Object.entries(item).map(([key, val]) => {
        if (val === null || val === undefined || val === '' || val === '-' || (Array.isArray(val) && val.length === 0)) return null
        const display = Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val)
        if (typeof val === 'boolean') return null
        return (
          <div key={key} className="flex items-start gap-2 text-[11px]">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px] shrink-0">{key}</span>
            <span className="text-gray-300">{display}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function CategorySection({ category, items, searchTerm, allData }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-sm uppercase tracking-widest">
          {searchTerm ? 'Aucun résultat trouvé' : 'Aucune donnée disponible'}
        </p>
      </div>
    )
  }

  const CardComponent = CARD_COMPONENTS[category?.key] || GenericCard
  const gridClass = GRID_CONFIG[category?.key] || 'grid-cols-1 sm:grid-cols-2'

  // Props supplémentaires pour certaines cards
  const extraProps = {}
  if (category?.key === 'armes') {
    if (allData?.talentsArmes) extraProps.talentsArmes = allData.talentsArmes
    if (allData?.attributs) extraProps.allAttributs = allData.attributs
  }
  if (category?.key === 'equipements') {
    if (allData?.ensembles) extraProps.ensembles = allData.ensembles
    if (allData?.talentsEquipements) extraProps.talentsEquipements = allData.talentsEquipements
    if (allData?.attributs) extraProps.allAttributs = allData.attributs
  }
  if (category?.key === 'talentsArmes') {
    if (allData?.armes) extraProps.armes = allData.armes
  }
  if (category?.key === 'talentsEquipements') {
    if (allData?.equipements) extraProps.equipements = allData.equipements
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-widest">
          <span className="mr-2">{category?.icon}</span>
          {category?.label}
        </h3>
        <span className="text-xs text-gray-500 font-bold">{items.length} entrées</span>
      </div>
      <div className={`grid ${gridClass} gap-3`}>
        {items.map((item, i) => (
          <CardComponent key={item.nom || item.variante || item.statistique || i} item={item} {...extraProps} />
        ))}
      </div>
    </div>
  )
}
