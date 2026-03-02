import { GEAR_SLOT_LABELS } from '../../../utils/formatters'
import { GEAR_SLOT_ICONS_IMG, GameIcon } from '../../../utils/gameAssets'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function TalentEquipCard({ item }) {
  const slotIcon = GEAR_SLOT_ICONS_IMG[item.emplacement]
  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center justify-between">
          <div className="font-bold text-shd text-sm uppercase tracking-wide">{item.nom}</div>
          <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
            {item.emplacement === 'tous' ? (
              <>
                <GameIcon src={GEAR_SLOT_ICONS_IMG['torse']} alt="" size="w-3 h-3" className="opacity-70" />
                <GameIcon src={GEAR_SLOT_ICONS_IMG['sac_a_dos']} alt="" size="w-3 h-3" className="opacity-70" />
              </>
            ) : (
              <GameIcon src={slotIcon} alt="" size="w-3 h-3" className="opacity-70" />
            )}
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


