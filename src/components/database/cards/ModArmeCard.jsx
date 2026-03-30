import { formatModAttributs } from '../../../utils/modCompatibility'
import MarkdownText from '../../common/MarkdownText'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function ModArmeCard({ item, allAttributs, modsArmesType }) {
  const statsText = formatModAttributs(item, allAttributs)

  const getTypeLabel = (type) => {
    return modsArmesType?.[type]?.nom || type
  }

  const getCompatibilityLabel = (slug) => {
    return modsArmesType?.[slug]?.nom || slug
  }

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex">
      <div className="w-1.5 shrink-0 bg-shd/30" />
      <div className="px-3 py-2.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className={"flex flex-row gap-1 items-center font-bold text-xs uppercase tracking-widest " + (item.estExotique ? 'text-red-400' : 'text-shd')}>
            {item.estExotique && <span className=" text-red-400 bg-red-500/15 px-1 py-0.5 rounded ">EXOTIQUE</span>}
            <span className='truncate'>{item.nom}</span>
          </div>
          <span className="shrink-0 text-xs font-bold uppercase tracking-widest bg-tactical-bg text-gray-500 px-1.5 py-0.5 rounded">
            {getTypeLabel(item.type)}
          </span>
        </div>
        {item.description && (
            <MarkdownText className="text-xs text-gray-400 italic leading-relaxed mt-1">
              {item.description}
            </MarkdownText>
        )}

        {statsText && (
          <MarkdownText className="mt-1.5 text-xs text-emerald-400">
            {statsText}
          </MarkdownText>
        )}
        {item.compatible && item.compatible.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.compatible.map(c => (
              <span key={c} className="text-xs text-gray-500 bg-tactical-bg px-1.5 py-0.5 rounded">
                {getCompatibilityLabel(c)}
              </span>
            ))}
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
