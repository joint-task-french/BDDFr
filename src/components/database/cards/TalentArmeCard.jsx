import { WEAPON_TALENT_ICONS, WEAPON_TYPE_ICONS, GameIcon } from '../../../utils/gameAssets'

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

export default function TalentArmeCard({ item }) {
  const compatTypes = item.compatibilite
    ? Object.entries(item.compatibilite).filter(([, v]) => v).map(([k]) => k)
    : []
  const talentIcon = item.icone ? WEAPON_TALENT_ICONS[item.icone] : null

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center gap-2">
          <GameIcon src={talentIcon} alt="" size="w-6 h-6" />
          <div className="font-bold text-shd text-sm uppercase tracking-wide">{item.nom}</div>
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

      {compatTypes.length > 0 && (
        <div className="px-4 py-2 border-t border-tactical-border/50 flex flex-wrap gap-1">
          {compatTypes.map(t => (
            <span key={t} className="text-[9px] font-bold uppercase tracking-widest bg-shd/10 text-shd/80 px-1.5 py-0.5 rounded flex items-center gap-1">
              <GameIcon src={WEAPON_TYPE_ICONS[t]} alt="" size="w-3 h-3" className="opacity-70" />
              {COMPAT_LABELS[t] || t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}


