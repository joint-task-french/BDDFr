import WeaponCard from '../database/cards/WeaponCard'
import GearCard from '../database/cards/GearCard'
import TalentArmeCard from '../database/cards/TalentArmeCard'
import TalentEquipCard from '../database/cards/TalentEquipCard'
import DescentTalentCard from '../database/cards/DescentTalentCard'
import TalentPrototypeCard from '../database/cards/TalentPrototypeCard'
import EnsembleCard from '../database/cards/EnsembleCard'
import SkillCard from '../database/cards/SkillCard'
import AttributCard from '../database/cards/AttributCard'
import ModArmeCard from '../database/cards/ModArmeCard'
import ModEquipementCard from '../database/cards/ModEquipementCard'
import ModCompetencesCard from '../database/cards/ModCompetencesCard'

import { getSpecialisations } from '../../utils/formatters'

export default function CardPreview({ category, data, loadedData }) {
  if (!data) return null

  // Initialisation du cache des spécialisations pour SkillCard et autres
  if (loadedData?.classSpe) {
    getSpecialisations(loadedData.classSpe)
  }

  // On prépare les props communes ou spécifiques
  const commonProps = {
    item: data,
    allAttributs: loadedData?.attributs,
    attributsType: loadedData?.attributs_type,
    isStatic: true,
  }

  switch (category) {
    case 'armes':
      return <WeaponCard {...commonProps} talentsArmes={loadedData?.talentsArmes} armesType={loadedData?.armes_type} modsArmes={loadedData?.modsArmes} modsArmesType={loadedData?.modsArmesType} />
    
    case 'equipements':
      return <GearCard {...commonProps} ensembles={loadedData?.ensembles} talentsEquipements={loadedData?.talentsEquipements} equipementsType={loadedData?.equipements_type} />
    
    case 'talentsArmes':
      if (data.descente) {
        return <DescentTalentCard item={data} isStatic={true} />
      }
      return <TalentArmeCard item={data} armes={loadedData?.armes} isStatic={true} />
    
    case 'talentsEquipements':
      if (data.descente) {
        return <DescentTalentCard item={data} isStatic={true} />
      }
      return <TalentEquipCard item={data} equipements={loadedData?.equipements} equipementsType={loadedData?.equipements_type} isStatic={true} />
    
    case 'talentsAutres':
      return <DescentTalentCard item={data} isStatic={true} />
    
    case 'talentsPrototypes':
      return <TalentPrototypeCard item={data} />
    
    case 'ensembles':
      return <EnsembleCard item={data} talentsEquipements={loadedData?.talentsEquipements} statistiques={loadedData?.statistiques} allAttributs={loadedData?.attributs} />
    
    case 'competences':
      return <SkillCard item={data} />
    
    case 'attributs':
      return <AttributCard item={data} attributsType={loadedData?.attributs_type} />
    
    case 'modsArmes':
      return <ModArmeCard item={data} allAttributs={loadedData?.attributs} modsArmesType={loadedData?.armes_type} />
    
    case 'modsEquipements':
      return <ModEquipementCard item={data} allAttributs={loadedData?.attributs} />
    
    case 'modsCompetences':
      return <ModCompetencesCard item={data} allAttributs={loadedData?.attributs} competencesGrouped={loadedData?.competences} />

    default:
      return (
        <div className="p-8 border-2 border-dashed border-tactical-border rounded-lg text-center text-gray-500 italic">
          Aucun aperçu visuel disponible pour cette catégorie.
        </div>
      )
  }
}
