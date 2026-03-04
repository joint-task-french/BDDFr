import {resolveAttributeIcon, GameIcon, resolveIcon} from '../../../utils/gameAssets'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function EnsembleCard({ item, talentsEquipements }) {
  const isGearSet = item.type === 'gear_set'
  const nameColor = isGearSet ? 'text-emerald-400' : 'text-shd'
  const borderColor = isGearSet ? 'border-l-emerald-500' : 'border-l-shd/50'
  const badgeColor = isGearSet ? 'bg-emerald-500/15 text-emerald-400' : 'bg-shd/15 text-shd'
  const bonusColor = isGearSet ? 'bg-emerald-500/15 text-emerald-400' : 'bg-shd/15 text-shd'

  const BASE = import.meta.env.BASE_URL


    /* TODO : migré vers webp + au build envoyé logo vers public */
  return (
    <div className={`bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden border-l-2 ${borderColor}`}>
      {/* Header : logo + nom + type + attributs essentiels */}
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-start gap-3">
          {/* Logo */}
          {resolveIcon(item.logo) ? (
            <GameIcon src={resolveIcon(item.logo)} alt="" size="w-10 h-10" className="rounded" />
          ) : (
            <div className={`w-10 h-10 shrink-0 rounded flex items-center justify-center text-lg ${isGearSet ? 'bg-emerald-500/10' : 'bg-shd/10'}`}>
              {isGearSet ? '🔗' : '🏷️'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeColor}`}>
                {isGearSet ? 'Gear Set' : 'Marque'}
              </span>
            </div>
            <div className={`font-bold text-base uppercase tracking-wide mt-0.5 ${nameColor}`}>{item.nom}</div>

            {/* Attributs essentiels */}
            {item.attributsEssentiels && item.attributsEssentiels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.attributsEssentiels.map((attr, i) => (
                  <span key={i} className="text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <GameIcon src={resolveAttributeIcon(attr)} alt="" size="w-3 h-3" />
                    {attr}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bonus par palier */}
      <div className="px-4 py-2.5 space-y-2">
        {hasContent(item.bonus1piece) && (
          <BonusRow level="1p" bonus={item.bonus1piece} color={bonusColor} />
        )}
        {hasContent(item.bonus2pieces) && (
          <BonusRow level="2p" bonus={item.bonus2pieces} color={bonusColor} />
        )}
        {hasContent(item.bonus3pieces) && (
          <BonusRow level="3p" bonus={item.bonus3pieces} color={bonusColor} />
        )}
        {hasContent(item.bonus4pieces) && (
          <BonusRow level="4p" bonus={item.bonus4pieces} color={bonusColor} />
        )}
      </div>

      {/* Talents torse/sac (gear sets uniquement) */}
      {(hasContent(item.talentTorse) || hasContent(item.talentSac)) && (
        <div className="px-4 py-2.5 border-t border-tactical-border/50 space-y-1.5">
          {hasContent(item.talentTorse) && (() => {
            const talent = talentsEquipements?.find(t => t.slug === item.talentTorse)
            return (
              <div className="text-[11px] text-gray-400 leading-relaxed">
                <span className="text-shd font-bold uppercase tracking-widest text-[10px]">Torse : </span>
                <span className="text-shd/80 font-semibold">{talent?.nom || item.talentTorse}</span>
                {talent?.description && <> — {talent.description}</>}
              </div>
            )
          })()}
          {hasContent(item.talentSac) && (() => {
            const talent = talentsEquipements?.find(t => t.slug === item.talentSac)
            return (
              <div className="text-[11px] text-gray-400 leading-relaxed">
                <span className="text-shd font-bold uppercase tracking-widest text-[10px]">Sac : </span>
                <span className="text-shd/80 font-semibold">{talent?.nom || item.talentSac}</span>
                {talent?.description && <> — {talent.description}</>}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function BonusRow({ level, bonus, color }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${color}`}>
        {level}
      </span>
      <span className="text-gray-300">{bonus.replace(/^\.\+?/, '+')}</span>
    </div>
  )
}

