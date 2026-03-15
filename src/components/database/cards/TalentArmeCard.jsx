import { useState } from 'react'
import { resolveIcon, WEAPON_TYPE_ICONS, GameIcon } from '../../../utils/gameAssets'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

const COMPAT_LABELS = {
  fusil: 'Fusil',
  calibre_12: 'Cal.12',
  fusil_assaut: 'FA',
  fusil_mitrailleur: 'FM',
  fusil_precision: 'FP',
  pistolet: 'Pistolet',
  pistolet_mitrailleur: 'PM',
}

export default function TalentArmeCard({ item, armes }) {

  const isExotic = item.estExotique
  const compatTypes = item.compatibilite
    ? Object.entries(item.compatibilite).filter(([, v]) => v).map(([k]) => k)
    : []
  const talentIcon = resolveIcon(item.icone)
  // Un talent exotique n'a jamais de version parfaite
  const hasPerfect = !isExotic && !!item.perfectDescription
  const nameColor = isExotic ? 'text-red-400' : 'text-shd'
  const borderColor = isExotic ? 'border-l-red-500' : ''

  const [showPerfect, setShowPerfect] = useState(false)
  const description = showPerfect && hasPerfect ? item.perfectDescription : item.description

  return (
    <div className={`bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden ${borderColor ? `border-l-2 ${borderColor}` : ''}`}>
      <div className="px-4 py-3 border-b border-tactical-border/50">
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
        {hasContent(item.prerequis) && (
          <div className="text-xs text-yellow-500/70 mt-0.5">Requis : {item.prerequis}</div>
        )}
      </div>

      {description && (
        <div className="px-4 py-2.5 text-xs text-gray-400 leading-relaxed whitespace-pre-line">
          {description}
        </div>
      )}

      {/* Arme(s) nommée(s) portant la version parfaite */}
      {showPerfect && item.armesParfaites?.length > 0 && (
        <div className="px-4 pb-2 text-xs text-yellow-500/70 flex items-center gap-1">
          <span className="text-yellow-400 font-bold uppercase tracking-widest">Arme :</span>
          {item.armesParfaites.map(slug => {
            const arme = armes?.find(a => a.slug === slug)
            return arme?.nom || slug
          }).join(', ')}
        </div>
      )}

      {compatTypes.length > 0 && (
        <div className="px-4 py-2 border-t border-tactical-border/50 flex flex-wrap gap-1">
          {compatTypes.map(t => (
            <span key={t} className="text-xs font-bold uppercase tracking-widest bg-shd/10 text-shd/80 px-1.5 py-0.5 rounded flex items-center gap-1">
              <GameIcon src={WEAPON_TYPE_ICONS[t]} alt="" size="w-3 h-3" className="opacity-70" />
              {COMPAT_LABELS[t] || t}
            </span>
          ))}
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


