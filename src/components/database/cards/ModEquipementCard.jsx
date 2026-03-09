import { formatModAttributs } from '../../../utils/modCompatibility'

const TYPE_LABELS = {
  chargeur: 'Chargeur',
  canon: 'Canon',
  viseur: 'Viseur',
  bouche: 'bouche',
  autre: 'Autre',
}

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function ModEquipementCard({ item, allAttributs }) {
  const statsText = formatModAttributs(item, allAttributs)

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex">
      <div className="w-1.5 shrink-0 bg-shd/30" />
      <div className="px-3 py-2.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">

          <span className="shrink-0 text-xs font-bold uppercase tracking-widest bg-tactical-bg text-gray-500 px-1.5 py-0.5 rounded">
            {TYPE_LABELS[item.type] || item.type}
          </span>
        </div>
        {statsText && (
          <div className="mt-1.5 text-xs text-emerald-400 whitespace-pre-line">{statsText}</div>
        )}
        {item.compatible && item.compatible.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.compatible.map(c => (
              <span key={c} className="text-xs text-gray-500 bg-tactical-bg px-1.5 py-0.5 rounded">{c}</span>
            ))}
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
