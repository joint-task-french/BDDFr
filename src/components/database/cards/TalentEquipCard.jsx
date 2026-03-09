import { useState } from 'react'
import { getGearSlotLabel } from '../../../utils/formatters'
import { GEAR_SLOT_ICONS_IMG, resolveIcon, GameIcon } from '../../../utils/gameAssets'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function TalentEquipCard({ item, equipements, equipementsType }) {
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
              <span className="text-xs font-bold text-red-400 bg-red-500/15 px-1 py-0.5 rounded uppercase tracking-widest">
                Exotique
              </span>
            )}

            {hasPerfect && (
                <button
                    onClick={() => setShowPerfect(!showPerfect)}
                    className={`ml-auto flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all ${
                        showPerfect
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                            : 'bg-tactical-bg text-gray-500 border-tactical-border hover:border-gray-500'
                    }`}
                >
            <span className="w-6 h-3.5 relative rounded-full border border-current inline-block">
              <span className={`absolute top-0.5 w-2 h-2 rounded-full bg-current transition-all ${showPerfect ? 'left-3' : 'left-0.5'}`} />
            </span>
                  {showPerfect?'★ ':''}Parfait
                </button>
            )}
          </div>
          <span className="text-xs font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
            <GameIcon src={slotIcon} alt="" size="w-3 h-3" className="opacity-70" />
            {getGearSlotLabel(equipementsType, item.emplacement)}
          </span>
        </div>
        {hasContent(item.prerequis) && (
          <div className="text-xs text-yellow-500/70 mt-0.5">Requis : {item.prerequis}</div>
        )}
      </div>

      {description && (
        <div className="px-4 py-2.5 text-xs text-gray-400 leading-relaxed">
          {description}
        </div>
      )}

      {/* Équipement(s) nommé(s) portant la version parfaite */}
      {showPerfect && item.equipementsParfaits?.length > 0 && (
        <div className="px-4 pb-2 text-xs text-yellow-500/70 flex flex-col items-start gap-1 ">
          <span className="text-yellow-400 font-bold uppercase tracking-widest">Équipement :</span>
          <span className='whitespace-pre-line text-xs'>
            - {item.equipementsParfaits.map(slug => {
              const eq = equipements?.find(e => e.slug === slug)
              return eq?.nom || slug
            }).join('\n- ')}
          </span>
        </div>
      )}
    </div>
  )
}

