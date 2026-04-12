import WeaponCard from './cards/WeaponCard'
import GearCard from './cards/GearCard'
import TalentArmeCard from './cards/TalentArmeCard'
import TalentEquipCard from './cards/TalentEquipCard'
import TalentPrototypeCard from './cards/TalentPrototypeCard'
import EnsembleCard from './cards/EnsembleCard'
import SkillCard from './cards/SkillCard'
import ModArmeCard from './cards/ModArmeCard'
import ModCompetencesCard from "./cards/ModCompetencesCard.jsx";
import ModEquipementCard from "./cards/ModEquipementCard.jsx";
import DescentTalentCard from './cards/DescentTalentCard.jsx';
import CompactListView from './CompactListView'
import MarkdownText from '../common/MarkdownText'
import {useLocation, useNavigate} from "react-router-dom";
import {slugify} from "../../utils/slugify.js";

// Layout grids par catégorie
const GRID_CONFIG = {
  armes:             'grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3',
  equipements:       'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4',
  talentsArmes:      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 3xl:grid-cols-3',
  talentsEquipements:'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 3xl:grid-cols-3',
  talentsPrototypes: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 3xl:grid-cols-3',
  ensembles:         'grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3',
  competences:       'grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3',
  modsArmes:         'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4',
  modsEquipements:   'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4',
  modsCompetences:   'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4',
  descente:          'grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3',
}

// Quel composant card pour chaque catégorie
const CARD_COMPONENTS = {
  armes: WeaponCard,
  equipements: GearCard,
  talentsArmes: TalentArmeCard,
  talentsEquipements: TalentEquipCard,
  talentsPrototypes: TalentPrototypeCard,
  ensembles: EnsembleCard,
  competences: SkillCard,
  modsArmes: ModArmeCard,
  modsCompetences: ModCompetencesCard,
  modsEquipements: ModEquipementCard,
  descente: DescentTalentCard
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
          <div key={key} className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-xs shrink-0">{key}</span>
            <MarkdownText className="text-gray-300">{display}</MarkdownText>
          </div>
        )
      })}
    </div>
  )
}

export default function CategorySection({ category, items, searchTerm, allData, isCompactMode }) {
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

  // Type data disponibles pour toutes les catégories qui en ont besoin
  if (allData?.armes_type) extraProps.armesType = allData.armes_type
  if (allData?.equipements_type) extraProps.equipementsType = allData.equipements_type
  if (allData?.attributs_type) extraProps.attributsType = allData.attributs_type

  if (category?.key === 'armes') {
    if (allData?.talentsArmes) extraProps.talentsArmes = allData.talentsArmes
    if (allData?.attributs) extraProps.allAttributs = allData.attributs
    if (allData?.modsArmes) extraProps.modsArmes = allData.modsArmes
    if (allData?.modsArmesType) extraProps.modsArmesType = allData.modsArmesType
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
    if (allData?.ensembles) extraProps.ensembles = allData.ensembles
  }
  if (category?.key === 'ensembles') {
    if (allData?.talentsEquipements) extraProps.talentsEquipements = allData.talentsEquipements
    if (allData?.statistiques) extraProps.statistiques = allData.statistiques
    if (allData?.attributs) extraProps.allAttributs = allData.attributs
  }
  if (category?.key === 'modsArmes') {
    if (allData?.attributs) extraProps.allAttributs = allData.attributs
    if (allData?.modsArmesType) extraProps.modsArmesType = allData.modsArmesType
  }
  if (category?.key === 'modsEquipements') {
    if (allData?.attributs) extraProps.allAttributs = allData.attributs
  }
  if (category?.key === 'modsCompetences') {
    if (allData?.competencesGrouped) extraProps.competencesGrouped = allData.competencesGrouped
    if (allData?.attributs) extraProps.allAttributs = allData.attributs
    if (allData?.classSpe) extraProps.classSpe = allData.classSpe
  }

  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (item) => {
    const itemSlug = item.slug || item.nom;
    const pathParts = location.pathname.split('/');
    const currentSlug = pathParts[3];
    const currentModifier = pathParts[4];

    let newPath = `/db/${category.key}/${itemSlug}`;
    if (currentSlug === itemSlug && currentModifier) {
      newPath += `/${currentModifier}`;
    }

    navigate(`${newPath}${location.search}`, { replace: true });
  };

  if (isCompactMode) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest">
            <span className="mr-2">{category?.icon}</span>
            {category?.label}
          </h3>
          <span className="text-xs text-gray-500 font-bold">{items.length} entrées</span>
        </div>
        <CompactListView
          items={items}
          category={category}
          CardComponent={CardComponent}
          extraProps={extraProps}
        />
      </div>
    )
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
          <div
              key={item.slug || slugify(item.nom)}
              id={`item-${item.slug || slugify(item.nom)}`}
              className="h-full grid cursor-pointer transition-all hover:ring-2 hover:ring-shd/50 rounded-lg og-target-card"
              onClick={() => handleItemClick(item)}
              data-slug={item.slug || slugify(item.nom)}
          >
            <CardComponent item={item} {...extraProps} />
          </div>

        ))}
      </div>
    </div>
  )
}
