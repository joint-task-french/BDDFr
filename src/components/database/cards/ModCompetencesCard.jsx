import { formatModAttributs } from '../../../utils/modCompatibility'
import { getSpecialisations } from '../../../utils/formatters'
import MarkdownText from '../../common/MarkdownText'
import { Link } from 'react-router-dom'
import {GameIcon, resolveIcon} from "../../common/gameAssets.jsx";


function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function ModCompetencesCard({ item, allAttributs, competencesGrouped, classSpe }) {
  const statsText = formatModAttributs(item, allAttributs)

  const parentCompetence = competencesGrouped?.[item.competence]
  const nomCompetence = parentCompetence ? parentCompetence.competence : item.competence;

  // Récupération de la spécialisation si le mod a un prerequis
  let specialisation = null
  if (item.prerequis && classSpe) {
    const specialisations = getSpecialisations(classSpe)
    specialisation = specialisations[item.prerequis] || null
  }

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex">
      <div className="w-1.5 shrink-0 bg-shd/30" />
      <div className="px-3 py-2.5 flex-1 min-w-0">
        <div className="flex flex-col gap-1 font-bold text-xs uppercase tracking-widest">
          <div className='flex flex-row gap-1'>
            <span className="text-xs self-start font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">{ nomCompetence }</span>
            { specialisation && (
                <div className='flex flex-row gap-1 text-xs self-start font-bold text-shd bg-shd-dark/15 px-1.5 py-0.5 rounded uppercase tracking-widest'>
                  <GameIcon src={resolveIcon(specialisation.icon)} />
                  {specialisation.label}
                </div>
            ) }
            { !specialisation && item.prerequis && (
              <span className="text-xs self-start font-bold text-shd bg-shd-dark/15 px-1.5 py-0.5 rounded uppercase tracking-widest">{item.prerequis}</span>
            ) }
          </div>
          <div className={"text-shd"}>
            <span className='truncate'>{item.nom || item.slug}</span>
          </div>
        </div>


        {statsText && (
            <MarkdownText className="mt-1.5 text-xs text-emerald-400">
              {statsText}
            </MarkdownText>
        )}

        {item.emplacement && (
            <div className="mt-1.5 text-xs flex flex-row gap-2">
              <span className='text-shd whitespace-pre-line'>Emplacement :</span>
              <span className='text-gray-400 whitespace-pre-line'>{item.emplacement}</span>
            </div>
        )}


        {/* Notes */}
        {hasContent(item.notes) && (
          <div className="mt-2 pt-2 border-t border-tactical-border/50">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">Notes</div>
            <MarkdownText className="text-xs text-gray-400 italic leading-relaxed">
              {item.notes}
            </MarkdownText>
          </div>
        )}
      </div>
    </div>
  )
}
