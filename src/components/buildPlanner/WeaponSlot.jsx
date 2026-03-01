import { WEAPON_TYPE_LABELS } from '../../utils/formatters'
import StatChip from '../common/StatChip'

const HEADER_COLORS = {
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    hover: 'group-hover:text-red-500/50' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', hover: 'group-hover:text-purple-500/50' },
  gray:   { bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   text: 'text-gray-400',   hover: 'group-hover:text-gray-500/50' },
}

export default function WeaponSlot({ label, weapon, talent, onSelect, onRemove, onSelectTalent, headerColor = 'red', badge }) {
  const colors = HEADER_COLORS[headerColor] || HEADER_COLORS.red
  const isSpecific = weapon?.type === 'arme_specifique'

  return (
    <div className="build-slot group" onClick={weapon ? undefined : onSelect}>
      <div className={`px-3 py-2 ${colors.bg} ${colors.border} border-b flex justify-between items-center`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`${colors.text} text-xs font-bold uppercase tracking-widest`}>🔫 {label}</span>
          {badge}
        </div>
        {weapon && (
          <button onClick={(e) => { e.stopPropagation(); onRemove?.() }} className={`${colors.text} hover:text-white text-xs p-1`}>✕</button>
        )}
      </div>
      <div className="p-3 min-h-25">
        {weapon ? (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-white text-sm uppercase tracking-wide">
                  {weapon.estExotique && <span className="text-shd mr-1">★</span>}
                  {weapon.nom}
                </div>
                <div className="text-xs text-gray-500">
                  {WEAPON_TYPE_LABELS[weapon.type] || weapon.type}
                  {weapon.fabricant && ` — ${weapon.fabricant}`}
                </div>
              </div>
            </div>
            {/* Stats (pas pour les armes spécifiques si pas de données) */}
            {!isSpecific && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <StatChip icon="⚡" value={weapon.rpm ? `${weapon.rpm} CPM` : null} />
                <StatChip icon="📦" value={weapon.chargeur || null} />
                <StatChip icon="💥" value={weapon.degatsBase ? weapon.degatsBase.toLocaleString('fr-FR') : null} color="text-red-400" />
                <StatChip icon="🎯" value={weapon.headshot ? `${weapon.headshot} HS` : null} color="text-yellow-400" />
              </div>
            )}
            {/* Talents exotiques */}
            {weapon.estExotique && weapon.talent1 ? (
              <div className="mt-3 pt-3 border-t border-tactical-border">
                <div className="text-xs text-shd font-bold uppercase tracking-widest">Talent Exotique</div>
                <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-3">{weapon.talent1}</div>
                {weapon.talent2 && weapon.talent2 !== 'n/a' && (
                  <div className="text-[11px] text-gray-400 mt-2 leading-relaxed line-clamp-2">{weapon.talent2}</div>
                )}
              </div>
            ) : weapon.estNomme && weapon.talentNomme ? (
              <div className="mt-3 pt-3 border-t border-tactical-border">
                <div className="text-xs text-yellow-400 font-bold uppercase tracking-widest">Talent Nommé</div>
                <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-3">{weapon.talentNomme}</div>
              </div>
            ) : talent ? (
              <div className="mt-3 pt-3 border-t border-tactical-border">
                <div className="text-xs text-shd font-bold uppercase tracking-widest">Talent : {talent.nom}</div>
                {talent.description && (
                  <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-3">{talent.description}</div>
                )}
              </div>
            ) : (!weapon.estExotique && !isSpecific && onSelectTalent) ? (
              <div className="mt-3 pt-3 border-t border-tactical-border">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectTalent() }}
                  className="text-xs text-shd/60 hover:text-shd uppercase tracking-widest"
                >
                  + Ajouter un talent
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 py-4">
            <svg className={`w-10 h-10 ${colors.hover} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm uppercase tracking-widest mt-2">Sélectionner</span>
          </div>
        )}
      </div>
    </div>
  )
}

