import { GEAR_SLOT_LABELS } from '../../../utils/formatters'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function TalentEquipCard({ item }) {
  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center justify-between">
          <div className="font-bold text-shd text-sm uppercase tracking-wide">{item.nom}</div>
          <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">
            {GEAR_SLOT_LABELS[item.emplacement] || item.emplacement}
          </span>
        </div>
        {hasContent(item.prerequis) && (
          <div className="text-[10px] text-yellow-500/70 mt-0.5">Requis : {item.prerequis}</div>
        )}
      </div>

      {item.description && (
        <div className="px-4 py-2.5 text-[11px] text-gray-400 leading-relaxed">
          {item.description}
        </div>
      )}
    </div>
  )
}


