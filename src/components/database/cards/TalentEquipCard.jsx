import { useState } from 'react'
import { GEAR_SLOT_LABELS } from '../../../utils/formatters'
import { GEAR_SLOT_ICONS_IMG, resolveIcon, GameIcon } from '../../../utils/gameAssets'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function TalentEquipCard({ item }) {
  const [showPerfect, setShowPerfect] = useState(false)

  const isExotic = item.estExotique
  // Un talent exotique n'a jamais de version parfaite
  const hasPerfect = !isExotic && !!item.perfectDescription
  const nameColor = isExotic ? 'text-red-400' : 'text-shd'
  const borderColor = isExotic ? 'border-l-red-500' : ''
  const talentIcon = resolveIcon(item.icone)
  const slotIcon = GEAR_SLOT_ICONS_IMG[item.emplacement]

  const description = showPerfect && hasPerfect ? item.perfectDescription : item.description

  return (
    <div className={`bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden ${borderColor ? `border-l-2 ${borderColor}` : ''}`}>
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GameIcon src={talentIcon} alt="" size="w-6 h-6" />
            <div className={`font-bold text-sm uppercase tracking-wide ${nameColor}`}>{item.nom}</div>
            {isExotic && (
              <span className="text-[8px] font-bold text-red-400 bg-red-500/15 px-1 py-0.5 rounded uppercase tracking-widest">
                Exotique
              </span>
            )}
          </div>
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
        {hasPerfect && (
          <button
            onClick={() => setShowPerfect(!showPerfect)}
            className={`mt-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all ${
              showPerfect
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                : 'bg-tactical-bg text-gray-500 border-tactical-border hover:border-gray-500'
            }`}
          >
            <span className="w-6 h-3.5 relative rounded-full border border-current inline-block">
              <span className={`absolute top-0.5 w-2 h-2 rounded-full bg-current transition-all ${showPerfect ? 'left-3' : 'left-0.5'}`} />
            </span>
            Parfait
          </button>
        )}
      </div>

      {description && (
        <div className="px-4 py-2.5 text-[11px] text-gray-400 leading-relaxed">
          {showPerfect && <span className="text-yellow-400 font-bold text-[9px] uppercase tracking-widest mr-1">★ Parfait :</span>}
          {description}
        </div>
      )}

      {/* Équipement(s) nommé(s) portant la version parfaite */}
      {showPerfect && item.equipementsParfaits?.length > 0 && (
        <div className="px-4 pb-2 text-[10px] text-yellow-500/70 flex items-center gap-1">
          <span className="text-yellow-400 font-bold uppercase tracking-widest">Équipement :</span>
          {item.equipementsParfaits.join(', ')}
        </div>
      )}
    </div>
  )
}


