import {resolveAttributeIcon, GameIcon, resolveIcon} from '../../../utils/gameAssets'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function EnsembleCard({ item, talentsEquipements, statistiques }) {
  const isGearSet = item.type === 'gear_set'
  const isImprovised = item.type === 'improvise'

  const nameColor = isGearSet ? 'text-emerald-400' : isImprovised ? 'text-indigo-400' : 'text-shd'
  const borderColor = isGearSet ? 'border-l-emerald-500' : isImprovised ? 'border-l-indigo-500' : 'border-l-shd/50'
  const badgeColor = isGearSet ? 'bg-emerald-500/15 text-emerald-400' : isImprovised ? 'bg-indigo-500/15 text-indigo-400' : 'bg-shd/15 text-shd'
  const bonusColor = isGearSet ? 'bg-emerald-500/15 text-emerald-400' : isImprovised ? 'bg-indigo-500/15 text-indigo-400' : 'bg-shd/15 text-shd'
  const badgeText = isGearSet ? 'Gear Set' : isImprovised ? 'Improvisé' : 'Marque'

  const BASE = import.meta.env.BASE_URL

  // Résoudre les slugs d'attributs essentiels vers leurs noms
  const resolveAttrName = (slug) => {
    if (!slug) return slug
    if (statistiques && !Array.isArray(statistiques)) {
      if (statistiques[slug]) return statistiques[slug].nom
      const normalized = slug.replace(/_de_/g, '_')
      if (statistiques[normalized]) return statistiques[normalized].nom
    }
    const statList = Array.isArray(statistiques) ? statistiques : Object.values(statistiques || {})
    // Chercher correspondance exacte
    const stat = statList.find(s => s.slug === slug)
    if (stat) return stat.nom
    // Chercher correspondance approximative (ex: tiers_de_competence → tiers_competence)
    const normalized = slug.replace(/_de_/g, '_')
    const approx = statList.find(s => s.slug === normalized)
    if (approx) return approx.nom
    return slug
  }

  return (
      <div className={`bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden border-l-2 ${borderColor}`}>
        {/* Header : icon + nom + type + attributs essentiels */}
        <div className="px-4 py-3 border-b border-tactical-border/50">
          <div className="flex items-start gap-3">
            {/* Logo */}
            {resolveIcon(item.icon) ? (
                <GameIcon src={resolveIcon(item.icon)} alt="" size="w-10 h-10" className="rounded" />
            ) : (
                <div className={`w-10 h-10 shrink-0 rounded flex items-center justify-center text-lg ${isGearSet ? 'bg-emerald-500/10' : isImprovised ? 'bg-indigo-500/10' : 'bg-shd/10'}`}>
                  {isGearSet ? '🔗' : isImprovised ? '🛠️' : '🏷️'}
                </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeColor}`}>
                {badgeText}
              </span>
              </div>
              <div className={`font-bold text-base uppercase tracking-wide mt-0.5 ${nameColor}`}>{item.nom}</div>

              {/* Attributs essentiels */}
              {item.attributsEssentiels && item.attributsEssentiels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.attributsEssentiels.map((attr, i) => (
                        <span key={i} className="text-xs font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <GameIcon src={resolveAttributeIcon(attr)} alt="" size="w-3 h-3" />
                          {resolveAttrName(attr)}
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
                const tKey = item.talentTorse
                const talent = (talentsEquipements && !Array.isArray(talentsEquipements))
                    ? talentsEquipements[tKey]
                    : talentsEquipements?.find(t => t.slug === tKey)
                return (
                    <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                      <span className="text-shd font-bold uppercase tracking-widest text-xs">Torse : </span>
                      <span className="text-shd/80 font-semibold">{talent?.nom || item.talentTorse}</span>
                      {talent?.description && <> — {talent.description}</>}
                    </div>
                )
              })()}
              {hasContent(item.talentSac) && (() => {
                const tKey = item.talentSac
                const talent = (talentsEquipements && !Array.isArray(talentsEquipements))
                    ? talentsEquipements[tKey]
                    : talentsEquipements?.find(t => t.slug === tKey)
                return (
                    <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                      <span className="text-shd font-bold uppercase tracking-widest text-xs">Sac : </span>
                      <span className="text-shd/80 font-semibold">{talent?.nom || item.talentSac}</span>
                      {talent?.description && <> — {talent.description}</>}
                    </div>
                )
              })()}
            </div>
        )}

        {/* Notes */}
        {hasContent(item.notes) && (
            <div className="px-4 py-2 border-t border-tactical-border/50 bg-black/10">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Notes</div>
              <div className="text-xs text-gray-400 italic leading-relaxed whitespace-pre-line">
                {item.notes}
              </div>
            </div>
        )}
      </div>
  )
}

function BonusRow({ level, bonus, color }) {
  return (
      <div className="flex items-start gap-2 text-xs">
      <span className={`shrink-0 text-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded whitespace-pre-line ${color}`}>
        {level}
      </span>
        <span className="text-gray-300">{bonus.replace(/^\.\+?/, '+')}</span>
      </div>
  )
}