import { WEAPON_TYPE_LABELS } from '../../../utils/formatters'
import { WEAPON_TYPE_ICONS, resolveAttributeIcon, GameIcon } from '../../../utils/gameAssets'
import TalentInline from './TalentInline'

function fmt(n) {
  if (!n) return '—'
  return Number(n).toLocaleString('fr-FR')
}

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

/**
 * Résout les talents d'une arme : cherche chaque slug dans talentsArmes.
 * Si le slug ne matche pas un nom de talent connu, on le retourne tel quel (texte brut).
 */
function resolveTalents(item, talentsArmes) {
  if (!item.talents || item.talents.length === 0) return []
  if (!talentsArmes || talentsArmes.length === 0) {
    return item.talents.filter(t => hasContent(t))
  }

  return item.talents.filter(t => hasContent(t)).map(slug => {
    // Chercher par slug d'abord, puis par nom (rétrocompatibilité)
    const found = talentsArmes.find(ta => ta.slug === slug) ||
                  talentsArmes.find(ta => ta.nom.toLowerCase() === slug.toLowerCase())
    return found || slug // retourne l'objet talent ou le texte brut
  })
}

export default function WeaponCard({ item, talentsArmes, allAttributs }) {
  const isExotic = item.estExotique
  const isNamed = item.estNomme && !isExotic
  const isSpecific = item.type === 'arme_specifique'
  const nameColor = isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : isSpecific ? 'text-purple-400' : 'text-shd'
  const typeIcon = WEAPON_TYPE_ICONS[item.type]
  const attrIcon = resolveAttributeIcon(item.attributEssentiel)

  const resolvedTalents = resolveTalents(item, talentsArmes)

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden hover:border-tactical-border/80 transition-colors">
      {/* Header : Nom + Type + Fabricant */}
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center gap-2">
          {isExotic && <span className="text-[9px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Exotique</span>}
          {isNamed && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Nommé</span>}
          {isSpecific && <span className="text-[9px] font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Arme spécifique</span>}
        </div>
        <div className={`font-bold text-base uppercase tracking-wide ${(isExotic || isNamed || isSpecific) ? 'mt-1' : ''} ${nameColor} flex items-center gap-2`}>
          {isExotic && <span className="mr-0.5">★</span>}
          {item.nom}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <GameIcon src={typeIcon} alt={item.type} size="w-4 h-4" className="opacity-60" />
          <span>{WEAPON_TYPE_LABELS[item.type] || item.type}</span>
          <span>·</span>
          <span>{item.fabricant}</span>
          {isSpecific && item.specialisation && (
            <>
              <span>·</span>
              <span className="text-purple-400">🎖️ {item.specialisation}</span>
            </>
          )}
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

      {/* Attributs fixés */}
      {item.attributs?.length > 0 && (
        <div className="px-4 py-2 border-t border-tactical-border/50 space-y-1">
          {item.attributs.map((attr, i) => {
            const ref = allAttributs?.find(a => a.nom.toLowerCase() === attr.nom.toLowerCase())
            const isOverMax = ref && attr.valeur > ref.max
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <GameIcon src={resolveAttributeIcon(ref?.categorie || attr.nom)} alt="" size="w-3 h-3" />
                  {attr.nom}
                </span>
                <span className={`font-bold ${isOverMax ? 'text-yellow-400' : 'text-gray-200'}`}>
                  {attr.valeur}{ref?.unite || ''}
                  {isOverMax && <span className="ml-1 text-[8px] text-yellow-500">(max {ref.max}{ref.unite})</span>}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Talents résolus */}
      {resolvedTalents.length > 0 && (
        <div className="px-3 py-2.5 border-t border-tactical-border/50 space-y-2">
          {resolvedTalents.map((talent, i) => (
            <TalentInline key={i} talent={talent} isExotic={isExotic} />
          ))}
        </div>
      )}

      {/* Obtention */}
      {hasContent(item.obtention) && (
        <div className="px-4 py-2 border-t border-tactical-border/50">
          <div className="text-[11px] text-gray-500 leading-relaxed">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Obtention : </span>
            {item.obtention}
          </div>
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
