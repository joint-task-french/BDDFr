import { WEAPON_TYPE_LABELS } from '../../../utils/formatters'

function fmt(n) {
  if (!n) return '—'
  return Number(n).toLocaleString('fr-FR')
}

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function WeaponCard({ item }) {
  const nameColor = item.estExotique ? 'text-red-400' : 'text-shd'

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden hover:border-tactical-border/80 transition-colors">
      {/* Header : Nom + Type + Fabricant */}
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className={`font-bold text-base uppercase tracking-wide ${nameColor}`}>
          {item.estExotique && <span className="mr-1">★</span>}
          {item.nom}
        </div>
        <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
          <span>{WEAPON_TYPE_LABELS[item.type] || item.type}</span>
          <span>·</span>
          <span>{item.fabricant}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-px bg-tactical-border/30">
        <Stat label="Portée" value={item.portee ? `${item.portee}m` : null} />
        <Stat label="CPM" value={item.rpm || null} />
        <Stat label="Dégâts base" value={fmt(item.degatsBase)} accent />
        <Stat label="Chargeur" value={item.chargeur || null} />
        <Stat label="Rechargement" value={item.rechargement ? `${item.rechargement}s` : null} />
        <Stat label="Dégâts max" value={fmt(item.degatsMax)} accent />
        <Stat label="Headshot" value={item.headshot || null} span2 />
        <Stat label="Attribut" value={item.attributEssentiel?.replace(/^\.\+?/, '') || null} />
      </div>

      {/* Talents exotiques / Obtention */}
      {(hasContent(item.talent1) || hasContent(item.obtention)) && (
        <div className="px-4 py-2.5 border-t border-tactical-border/50 space-y-1.5">
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
            <div className="text-[11px] text-gray-500 leading-relaxed">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Obtention : </span>
              {item.obtention}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent, span2 }) {
  if (!value || value === '—' || value === '0') return <div className="bg-tactical-bg/50 p-2" />
  return (
    <div className={`bg-tactical-bg/50 p-2 ${span2 ? 'col-span-2' : ''}`}>
      <div className="text-[10px] text-gray-600 uppercase tracking-widest">{label}</div>
      <div className={`text-sm font-bold ${accent ? 'text-red-400' : 'text-gray-200'}`}>{value}</div>
    </div>
  )
}


