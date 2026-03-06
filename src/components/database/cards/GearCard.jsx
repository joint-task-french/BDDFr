import { useMemo } from 'react'
import { getGearSlotLabel, getAttrCategoryLabel } from '../../../utils/formatters'
import {GEAR_SLOT_ICONS_IMG, resolveAttributeIcon, GameIcon, resolveIcon} from '../../../utils/gameAssets'
import TalentInline from './TalentInline'
import ObtentionDisplay from './ObtentionDisplay'

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

export default function GearCard({ item, ensembles, talentsEquipements, allAttributs, equipementsType, attributsType }) {
  const isExotic = item.type === 'exotique'
  const isNamed = item.estNomme && !isExotic
  const isGearSet = item.type === 'gear_set'

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

  // Résoudre le talent gear set pour torse/sac depuis l'ensemble (slug → objet talent)
  const gearSetTalent = useMemo(() => {
    if (!isGearSet || !ensemble) return null
    const findTalent = (slug) => {
      if (!slug || !hasContent(slug)) return null
      const found = talentsEquipements?.find(t => t.slug === slug) ||
                    talentsEquipements?.find(t => t.nom.toLowerCase() === slug.toLowerCase())
      if (found) return { label: found.nom, text: found.description || '' }
      // Fallback: afficher le slug/texte tel quel
      return { label: slug, text: '' }
    }
    if (item.emplacement === 'torse' && hasContent(ensemble.talentTorse)) return findTalent(ensemble.talentTorse)
    if (item.emplacement === 'sac_a_dos' && hasContent(ensemble.talentSac)) return findTalent(ensemble.talentSac)
    return null
  }, [isGearSet, ensemble, item.emplacement, talentsEquipements])

  const resolvedTalents = resolveTalents(item, talentsEquipements)
  const hasResolvedTalents = resolvedTalents.length > 0
  const hasGearSetTalent = !hasResolvedTalents && gearSetTalent

  return (
    <div className={`bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden border-l-2 ${borderColor}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-start gap-2">
          <div className='flex flex-col text-xs text-gray-500 text-center items-center gap-1'>
            {/* Logo de la marque */}
            {resolveIcon(ensemble?.logo) && (
                <GameIcon src={resolveIcon(ensemble.logo)} alt="" size="w-10 h-10" className="rounded" />
            )}
            <span>{ensemble?.nom || item.marque}</span>
          </div>

          <div className='w-full'>
            <div className="flex items-center gap-2">
              {isExotic && <span className="text-xs font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Exotique</span>}
              {isNamed && <span className="text-xs font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Nommé</span>}
              {isGearSet && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Gear Set</span>}
            </div>
            <div className={`font-bold text-base uppercase tracking-wide mt-1 ${nameColor}`}>{item.nom}</div>
          </div>

          {/* Logo de l'équipement */}
          <div className='flex flex-col text-xs text-gray-500 text-center items-center gap-1 ml-1'>
            <GameIcon src={GEAR_SLOT_ICONS_IMG[item.emplacement]} alt="" size="w-10 h-10" className="rounded" />
            <span>{getGearSlotLabel(equipementsType, item.emplacement)}</span>
          </div>


        </div>
      </div>

      {/* Attributs */}
      <div className="px-4 py-2.5 space-y-1">
        {/* Attributs essentiels (depuis l'ensemble ou la pièce) */}
        {attrsEssentiels.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-blue-400 font-bold shrink-0 uppercase tracking-widest text-xs">Essentiel{attrsEssentiels.length > 1 ? 's' : ''}</span>
            <div className="flex flex-wrap gap-1">
              {attrsEssentiels.map((attr, i) => (
                <span key={i} className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                  <GameIcon src={resolveAttributeIcon(attr)} alt="" size="w-3 h-3" />
                  {getAttrCategoryLabel(attributsType, attr)}
                </span>
              ))}
            </div>
          </div>
        )}
        {hasContent(item.attributUnique) && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-shd font-bold shrink-0 uppercase tracking-widest text-xs">Unique</span>
            <span className="text-gray-300">{item.attributUnique}</span>
          </div>
        )}
        {/* Attributs fixés (référençant attributs.jsonc) */}
        {item.attributs?.length > 0 && (
          <div className="space-y-1 mt-1">
            <span className="text-purple-400 font-bold uppercase tracking-widest text-xs">Attributs</span>
            {item.attributs.map((attr, i) => {
              const ref = allAttributs?.find(a => a.slug === attr.nom || a.nom.toLowerCase() === attr.nom.toLowerCase())
              const isOverMax = ref && attr.valeur > ref.max
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <GameIcon src={resolveAttributeIcon(ref?.categorie || attr.nom)} alt="" size="w-3 h-3" />
                    {ref?.nom || attr.nom}
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
        {item.mod !== undefined && typeof item.mod !== 'boolean' && hasContent(item.mod) && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 font-bold shrink-0 uppercase tracking-widest text-xs">Mod</span>
            <span className="text-gray-400">{String(item.mod)}</span>
          </div>
        )}
      </div>

      {/* Talents résolus */}
      {hasResolvedTalents && (
        <div className="px-3 py-2.5 border-t border-tactical-border/50 space-y-2">
          {resolvedTalents.map((talent, i) => (
            <TalentInline key={i} talent={talent} isExotic={isExotic} isNamed={isNamed} />
          ))}
        </div>
      )}

      {/* Talent gear set résolu depuis l'ensemble */}
      {hasGearSetTalent && (
        <div className="px-4 py-2.5 border-t border-tactical-border/50">
          <div className="text-xs text-gray-400 leading-relaxed">
            <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs">{gearSetTalent.label} : </span>
            {gearSetTalent.text}
          </div>
        </div>
      )}

      {/* Obtention */}
      <ObtentionDisplay obtention={item.obtention} />
    </div>
  )
}


