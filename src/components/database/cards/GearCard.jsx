import { useMemo } from 'react'
import { GEAR_SLOT_LABELS, GEAR_SLOT_ICONS } from '../../../utils/formatters'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-' && v !== 'FALSE'
}

export default function GearCard({ item, ensembles }) {
  const isExotic = item.estExotique
  const isNamed = item.estNomme && !isExotic
  const isGearSet = item.source === 'gear_set' && !isExotic

  const nameColor = isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : isGearSet ? 'text-emerald-400' : 'text-shd'
  const borderColor = isExotic ? 'border-l-red-500' : isNamed ? 'border-l-yellow-500' : isGearSet ? 'border-l-emerald-500' : 'border-l-shd/50'

  // Résoudre les attributs essentiels depuis l'ensemble de la marque
  const attrsEssentiels = useMemo(() => {
    if (hasContent(item.attributEssentiel)) return [item.attributEssentiel]
    if (!ensembles || !item.marque) return []
    const ensemble = ensembles.find(e => e.nom.toLowerCase() === item.marque.toLowerCase())
    return ensemble?.attributsEssentiels || []
  }, [item, ensembles])

  const BASE = import.meta.env.BASE_URL
  const ensemble = ensembles?.find(e => e.nom.toLowerCase() === (item.marque || '').toLowerCase())

  return (
    <div className={`bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden border-l-2 ${borderColor}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center gap-2">
          {isExotic && <span className="text-[9px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Exotique</span>}
          {isNamed && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Nommé</span>}
          {isGearSet && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Gear Set</span>}
        </div>
        <div className={`font-bold text-base uppercase tracking-wide mt-1 ${nameColor}`}>{item.nom}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          {/* Logo de la marque */}
          {ensemble?.logo && (
            <img
              src={`${BASE}img/ensembles/${ensemble.logo}`}
              alt=""
              className="w-4 h-4 object-contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
          <span>{item.marque}</span>
          <span>·</span>
          <span>{GEAR_SLOT_ICONS[item.emplacement] || ''} {GEAR_SLOT_LABELS[item.emplacement] || item.emplacement}</span>
        </div>
      </div>

      {/* Attributs */}
      <div className="px-4 py-2.5 space-y-1">
        {/* Attributs essentiels (depuis l'ensemble ou la pièce) */}
        {attrsEssentiels.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-blue-400 font-bold shrink-0 uppercase tracking-widest text-[10px]">Essentiel{attrsEssentiels.length > 1 ? 's' : ''}</span>
            <div className="flex flex-wrap gap-1">
              {attrsEssentiels.map((attr, i) => (
                <span key={i} className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">{attr}</span>
              ))}
            </div>
          </div>
        )}
        {hasContent(item.attribut1) && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-purple-400 font-bold shrink-0 uppercase tracking-widest text-[10px]">Attribut</span>
            <span className="text-gray-300">{item.attribut1}</span>
          </div>
        )}
        {hasContent(item.attributUnique) && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-shd font-bold shrink-0 uppercase tracking-widest text-[10px]">Unique</span>
            <span className="text-gray-300">{item.attributUnique}</span>
          </div>
        )}
        {hasContent(item.mod) && item.mod !== 'oui' && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 font-bold shrink-0 uppercase tracking-widest text-[10px]">Mod</span>
            <span className="text-gray-400">{item.mod}</span>
          </div>
        )}
      </div>

      {/* Talents */}
      {(hasContent(item.talent) || hasContent(item.talent1)) && (
        <div className="px-4 py-2.5 border-t border-tactical-border/50 space-y-1.5">
          {hasContent(item.talent) && (
            <div className="text-[11px] text-gray-400">
              <span className="text-shd font-bold uppercase tracking-widest text-[10px]">Talent : </span>
              {item.talent}
            </div>
          )}
          {hasContent(item.talent1) && (
            <div className="text-[11px] text-gray-400 leading-relaxed">
              <span className="text-shd font-bold uppercase tracking-widest text-[10px]">Talent 1 : </span>
              {item.talent1}
            </div>
          )}
          {hasContent(item.talent2) && item.talent2 !== 'n/a' && (
            <div className="text-[11px] text-gray-400 leading-relaxed">
              <span className="text-shd font-bold uppercase tracking-widest text-[10px]">Talent 2 : </span>
              {item.talent2}
            </div>
          )}
          {hasContent(item.obtention) && (
            <div className="text-[11px] text-gray-500">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Obtention : </span>
              {item.obtention}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


