import { WEAPON_TYPE_LABELS } from '../../../utils/formatters'
import { WEAPON_TYPE_ICONS, resolveIcon, resolveAttributeIcon, GameIcon } from '../../../utils/gameAssets'

function fmt(n) {
  if (!n) return '—'
  return Number(n).toLocaleString('fr-FR')
}

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function WeaponCard({ item }) {
  const isExotic = item.estExotique
  const isNamed = item.estNomme && !isExotic
  const nameColor = isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : 'text-shd'
  const typeIcon = WEAPON_TYPE_ICONS[item.type]
  const attrIcon = resolveAttributeIcon(item.attributEssentiel)

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden hover:border-tactical-border/80 transition-colors">
      {/* Header : Nom + Type + Fabricant */}
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center gap-2">
          {isExotic && <span className="text-[9px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Exotique</span>}
          {isNamed && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Nommé</span>}
        </div>
        <div className={`font-bold text-base uppercase tracking-wide ${isExotic || isNamed ? 'mt-1' : ''} ${nameColor} flex items-center gap-2`}>
          {isExotic && <span className="mr-0.5">★</span>}
          {item.nom}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <GameIcon src={typeIcon} alt={item.type} size="w-4 h-4" className="opacity-60" />
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
        <StatWithIcon label="Attribut" value={item.attributEssentiel?.replace(/^\.\+?/, '') || null} icon={attrIcon} />
      </div>

      {/* Talents exotiques / nommés / Obtention */}
      {(hasContent(item.talent1) || hasContent(item.talentNomme) || hasContent(item.obtention)) && (
        <div className="px-4 py-2.5 border-t border-tactical-border/50 space-y-1.5">
          {/* Talent dédié arme nommée */}
          {hasContent(item.talentNomme) && (
            <TalentLine color="text-yellow-400" label="Talent" text={item.talentNomme} icone={item.icone} />
          )}
          {hasContent(item.talent1) && (
            <TalentLine color="text-shd" label="Talent 1" text={item.talent1} icone={item.icone} />
          )}
          {hasContent(item.talent2) && item.talent2 !== 'n/a' && (
            <TalentLine color="text-shd" label="Talent 2" text={item.talent2} />
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

function TalentLine({ color, label, text, icone }) {
  const icon = resolveIcon(icone)
  return (
    <div className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-1.5">
      <GameIcon src={icon} alt="" size="w-4 h-4 mt-0.5" />
      <div>
        <span className={`${color} font-bold uppercase tracking-widest text-[10px]`}>{label} : </span>
        {text}
      </div>
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

function StatWithIcon({ label, value, icon }) {
  if (!value || value === '—' || value === '0') return <div className="bg-tactical-bg/50 p-2" />
  return (
    <div className="bg-tactical-bg/50 p-2">
      <div className="text-[10px] text-gray-600 uppercase tracking-widest">{label}</div>
      <div className="flex items-center gap-1 text-sm font-bold text-gray-200">
        <GameIcon src={icon} alt="" size="w-3.5 h-3.5" />
        <span>{value}</span>
      </div>
    </div>
  )
}


