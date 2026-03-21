import { formatModAttributs } from '../../../utils/modCompatibility'


function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function ModCompetencesCard({ item, allAttributs, competencesGrouped }) {
  const statsText = formatModAttributs(item, allAttributs)

  const parentCompetence = competencesGrouped?.[item.competence]
  const nomCompetence = parentCompetence ? parentCompetence.competence : item.competence;

  return (
    <div className="og-target-card bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex" data-slug={item.slug}>
      <div className="w-1.5 shrink-0 bg-shd/30" />
      <div className="px-3 py-2.5 flex-1 min-w-0">
        <div className="flex flex-col gap-1 font-bold text-xs uppercase tracking-widest">
          <span className="text-xs self-start font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">{ nomCompetence }</span>
          <div className={"text-shd"}>
            <span className='truncate'>{item.nom || item.slug}</span>
          </div>
        </div>


        {statsText && (
            <div className="mt-1.5 text-xs text-emerald-400 whitespace-pre-line">{statsText}</div>
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
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Notes</div>
            <div className="text-[11px] text-gray-400 italic leading-relaxed whitespace-pre-line">
              {item.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
