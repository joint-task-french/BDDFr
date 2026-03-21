import { formatModAttributs } from '../../../utils/modCompatibility'
import {GameIcon, resolveAttributeIcon, resolveIcon} from "../../../utils/gameAssets.jsx";

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
  const icon = resolveAttributeIcon(item.categorie)

  return (
      <div className="og-target-card bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex" data-slug={item.slug}>
        <div className="w-1.5 shrink-0 bg-shd/30" />
        <div className="px-3 py-2.5 flex-1 min-w-0">
          <div className="flex items-center flex-row gap-1 font-bold text-xs uppercase tracking-widest">
            <GameIcon src={icon} alt="" size="w-5 h-5" />
            <span className='text-shd truncate'>{item.nom || item.slug}</span>
          </div>


          {statsText && (
              <div className="mt-1.5 text-xs text-emerald-400 whitespace-pre-line">{statsText}</div>
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
