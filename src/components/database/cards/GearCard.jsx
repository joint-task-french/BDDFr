import { useMemo } from 'react'
import { GEAR_SLOT_LABELS } from '../../../utils/formatters'
import { GEAR_SLOT_ICONS_IMG, resolveAttributeIcon, GameIcon } from '../../../utils/gameAssets'
import TalentInline from './TalentInline'

const ATTR_LABELS = {
  offensif: 'Offensif',
  'défensif': 'Défensif',
  utilitaire: 'Utilitaire',
}

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-' && v !== 'FALSE' && v !== 'TRUE'
}

/**
 * Résout les talents d'un équipement : cherche chaque slug dans talentsEquipements.
 */
function resolveTalents(item, talentsEquipements) {
  if (!item.talents || item.talents.length === 0) return []
  if (!talentsEquipements || talentsEquipements.length === 0) {
    return item.talents.filter(t => hasContent(t))
  }
  return item.talents.filter(t => hasContent(t)).map(slug => {
    const found = talentsEquipements.find(te => te.slug === slug) ||
                  talentsEquipements.find(te => te.nom.toLowerCase() === slug.toLowerCase())
    return found || slug
  })
}

export default function GearCard({ item, ensembles, talentsEquipements, allAttributs }) {
  const isExotic = item.estExotique
  const isNamed = item.estNomme && !isExotic
  const isGearSet = item.source === 'gear_set' && !isExotic

  const nameColor = isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : isGearSet ? 'text-emerald-400' : 'text-shd'
  const borderColor = isExotic ? 'border-l-red-500' : isNamed ? 'border-l-yellow-500' : isGearSet ? 'border-l-emerald-500' : 'border-l-shd/50'

  // Résoudre les attributs essentiels : array direct ou fallback depuis l'ensemble
  const attrsEssentiels = useMemo(() => {
    if (Array.isArray(item.attributEssentiel) && item.attributEssentiel.length > 0) return item.attributEssentiel
    if (!ensembles || !item.marque) return []
    const ensemble = ensembles.find(e => e.slug === item.marque || e.nom.toLowerCase() === item.marque.toLowerCase())
    return ensemble?.attributsEssentiels || []
  }, [item, ensembles])

  const BASE = import.meta.env.BASE_URL
  const ensemble = ensembles?.find(e => e.slug === (item.marque || '') || e.nom.toLowerCase() === (item.marque || '').toLowerCase())

  // Résoudre le talent gear set pour torse/sac depuis l'ensemble
  const gearSetTalent = useMemo(() => {
    if (!isGearSet || !ensemble) return null
    if (item.emplacement === 'torse' && hasContent(ensemble.talentTorse)) return { label: 'Talent Torse', text: ensemble.talentTorse }
    if (item.emplacement === 'sac_a_dos' && hasContent(ensemble.talentSac)) return { label: 'Talent Sac', text: ensemble.talentSac }
    return null
  }, [isGearSet, ensemble, item.emplacement])

  const resolvedTalents = resolveTalents(item, talentsEquipements)
  const hasResolvedTalents = resolvedTalents.length > 0
  const hasGearSetTalent = !hasResolvedTalents && gearSetTalent

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
          <span>{ensemble?.nom || item.marque}</span>
          <span>·</span>
          <GameIcon src={GEAR_SLOT_ICONS_IMG[item.emplacement]} alt="" size="w-4 h-4" className="opacity-60" />
          <span>{GEAR_SLOT_LABELS[item.emplacement] || item.emplacement}</span>
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
                <span key={i} className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                  <GameIcon src={resolveAttributeIcon(attr)} alt="" size="w-3 h-3" />
                  {ATTR_LABELS[attr] || attr}
                </span>
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
        {item.mod !== undefined && typeof item.mod !== 'boolean' && hasContent(item.mod) && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 font-bold shrink-0 uppercase tracking-widest text-[10px]">Mod</span>
            <span className="text-gray-400">{String(item.mod)}</span>
          </div>
        )}
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
      {hasResolvedTalents && (
        <div className="px-3 py-2.5 border-t border-tactical-border/50 space-y-2">
          {resolvedTalents.map((talent, i) => (
            <TalentInline key={i} talent={talent} isExotic={isExotic} />
          ))}
        </div>
      )}

      {/* Talent gear set résolu depuis l'ensemble */}
      {hasGearSetTalent && (
        <div className="px-4 py-2.5 border-t border-tactical-border/50">
          <div className="text-[11px] text-gray-400 leading-relaxed">
            <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">{gearSetTalent.label} : </span>
            {gearSetTalent.text}
          </div>
        </div>
      )}

      {/* Obtention */}
      {hasContent(item.obtention) && (
        <div className="px-4 py-2 border-t border-tactical-border/50">
          <div className="text-[11px] text-gray-500">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Obtention : </span>
            {item.obtention}
          </div>
        </div>
      )}
    </div>
  )
}


