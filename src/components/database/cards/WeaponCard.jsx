import { getWeaponTypeLabel, getWeaponEssentialAttributes, formatNumber, calculateMaxDamage } from '../../../utils/formatters'
import { WEAPON_TYPE_ICONS, resolveAttributeIcon, GameIcon, resolveIcon } from '../../../utils/gameAssets'
import { formatModAttributs } from '../../../utils/modCompatibility'
import TalentInline from './TalentInline'
import ObtentionDisplay from './ObtentionDisplay'
import {InfoToolTip} from "../../common/InfoToolTip.jsx";

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

export default function WeaponCard({ item, talentsArmes, allAttributs, armesType, modsArmes }) {
  const isExotic = item.estExotique
  const isNamed = item.estNomme && !isExotic
  const isSpecific = item.type === 'arme_specifique'
  const nameColor = isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : isSpecific ? 'text-purple-400' : 'text-shd'

  // Priorité : icône personnalisée de l'arme > icône par défaut du type d'arme
  const customIcon = resolveIcon(item.icone)
  const typeIcon = customIcon || WEAPON_TYPE_ICONS[item.type]

  // Résoudre les attributs essentiels hérités du type d'arme
  const essentialAttrs = getWeaponEssentialAttributes(armesType, item.type, allAttributs, item.attributs_essentiels)

  const resolvedTalents = resolveTalents(item, talentsArmes)

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden hover:border-tactical-border/80 transition-colors">
      {/* Header : Nom + Type + Fabricant */}
      <div className="px-4 py-3 border-b border-tactical-border/50 flex flex-col gap-1">
        <div className="flex flex-row gap-2">
          <GameIcon src={typeIcon} alt={item.type} size="w-10 h-10" className={ isSpecific ? '' : 'opacity-60' } />
          <div className="w-full">
            <div className={`font-bold text-base uppercase tracking-wide ${nameColor} flex items-center gap-2 justify-between`}>
            <span>
              {isExotic && <span className="mr-0.5">★</span>}
              {item.nom}
            </span>

              <div className="flex items-center gap-2">
                {isExotic && <span className="text-xs font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Exotique</span>}
                {isNamed && <span className="text-xs font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Nommé</span>}
                {isSpecific && <span className="text-xs font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Arme spécifique</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{getWeaponTypeLabel(armesType, item.type)}</span>
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
        </div>
        { item.description && <span className="text-xs text-gray-400 italic leading-relaxed whitespace-pre-line">{item.description}</span> }
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-px bg-tactical-border/30">
        <Stat label="Portée" value={item.portee ? `${item.portee}m` : '0m'} />
        <Stat label="CPM" value={item.rpm || '0\u200B'} />
        <Stat label="Dégâts base" value={formatNumber(item.degatsBase) + "\u200B"} accent />
        <Stat label="Chargeur" value={item.chargeur || '0\u200B'} />
        <Stat label="Rechargement" value={item.rechargement ? `${item.rechargement}s` : '0s'} />
        <Stat label="Dégâts max" value={formatNumber(calculateMaxDamage(item.degatsBase)) + "\u200B"} accent info="Calcul des Dégâts Max (+160%)\n\n• Équipement : +90%\n• Expertise : +30%\n• Type d'arme : +15%\n• Spécialisation : +15%\n• Montre SHD : +10%\n\nLe total est calculé par l'addition de ces bonus." />
        <Stat label="Headshot" value={item.headshot != null ? `${item.headshot}%` : '0%%'} span2={essentialAttrs.length === 0} />
      </div>

      {/* Attributs essentiels (hérités du type d'arme) */}
      {essentialAttrs.length > 0 && (
        <div className="px-4 py-2 border-t border-tactical-border/50 space-y-1">
          <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-1">Attributs essentiels</div>
          {essentialAttrs.map((attr, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-400">
                <GameIcon src={resolveAttributeIcon(attr.categorie)} alt="" size="w-3 h-3" />
                {attr.nom}
              </span>
              <span className="text-shd font-bold">
                {attr.value ? attr.value : `${attr.min}--${attr.max}`}{attr.unite || ''}
              </span>
            </div>
          ))}
        </div>
      )}

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
            <TalentInline key={i} talent={talent} isExotic={isExotic} isNamed={isNamed} />
          ))}
        </div>
      )}

      {/* Mods prédéfinis (armes exotiques) */}
      {item.modsPredefinis?.length > 0 && modsArmes && (
        <div className="px-4 py-2 border-t border-tactical-border/50 space-y-1.5">
          <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">Mods prédéfinis</div>
          {item.modsPredefinis.map((slug, i) => {
            const mod = modsArmes.find(m => m.slug === slug)
            if (!mod) return (
              <div key={i} className="text-xs text-gray-500 italic">{slug}</div>
            )
            const stats = formatModAttributs(mod, allAttributs)
            return (
              <div key={i} className="flex flex-col text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-shd font-bold shrink-0">{mod.nom}</span>
                  {stats && <span className="text-emerald-400/80">{stats}</span>}
                </div>
                {hasContent(mod.notes) && (
                  <div className="mt-0.5 text-[10px] text-gray-500 italic leading-relaxed whitespace-pre-line border-l border-tactical-border/30 pl-2 ml-1">
                    {mod.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Obtention */}
      <ObtentionDisplay obtention={item.obtention} />

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

function Stat({ label, value, accent, span2, info }) {
  if (!value || value === '—' || value === '0') return <div className="bg-tactical-bg/50 p-2" />
  return (
    <div className={`bg-tactical-bg/50 p-2 ${span2 ? 'col-span-2' : ''}`}>
      <div className="text-xs text-gray-600 uppercase tracking-widest flex flex-row items-center">
        {label}
        {info && <InfoToolTip text={info} />}
      </div>
      <div className={`text-sm font-bold ${accent ? 'text-red-400' : 'text-gray-200'}`}>{value}</div>
    </div>
  )
}

