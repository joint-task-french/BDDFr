import {useMemo, useState, useEffect} from 'react'
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import {getAttrCategoryLabel, getGearSlotLabel, formatNumber} from '../../../utils/formatters'
import {GameIcon, GEAR_SLOT_ICONS_IMG, resolveAttributeIcon, resolveIcon} from '../../../utils/gameAssets'
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
  if (!talentsEquipements) return item.talents.filter(t => hasContent(t))

  const isArray = Array.isArray(talentsEquipements)
  const talentsList = isArray ? talentsEquipements : Object.values(talentsEquipements)

  return item.talents.filter(t => hasContent(t)).map(slug => {
    if (!isArray && talentsEquipements[slug]) return talentsEquipements[slug]
    const found = talentsList.find(te => te.slug === slug) ||
        talentsList.find(te => te.nom?.toLowerCase() === slug.toLowerCase())
    return found || slug
  })
}

export default function GearCard({ item, ensembles, talentsEquipements, allAttributs, equipementsType, attributsType }) {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isExotic = item.type === 'exotique'

  const isUrlPrototype = params.slug === item.slug && params.modifier === 'prototype'
  const forcePrototype = searchParams.get('prototype') === 'true'

  const [isPrototype, setIsPrototype] = useState(isUrlPrototype || forcePrototype)

  useEffect(() => {
    if (params.slug === item.slug) {
      setIsPrototype(params.modifier === 'prototype' || forcePrototype)
    } else if (forcePrototype) {
      setIsPrototype(true)
    }
  }, [params.modifier, params.slug, item.slug, forcePrototype])

  const togglePrototype = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isExotic || isImprovised) return

    const nextState = !isPrototype
    setIsPrototype(nextState)

    const category = params.category || 'equipements'
    const itemSlug = item.slug || item.nom
    const basePath = `/db/${category}/${itemSlug}`

    navigate({
      pathname: nextState ? `${basePath}/prototype` : basePath,
      search: location.search
    }, {
      replace: params.slug === itemSlug
    })
  }

  const isNamed = item.estNomme && !isExotic
  const isGearSet = item.type === 'gear_set'
  const isImprovised = item.type === 'improvise'
  const isMarque = item.type === 'standard'

  const nameColor = isPrototype ? 'text-cyan-400' : isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : isGearSet ? 'text-emerald-400' : isImprovised ? 'text-indigo-400' : 'text-shd'
  const borderColor = isPrototype ? 'border-l-cyan-500' : isExotic ? 'border-l-red-500' : isNamed ? 'border-l-yellow-500' : isGearSet ? 'border-l-emerald-500' : isImprovised ? 'border-l-indigo-500' : 'border-l-shd/50'

  const ensemble = useMemo(() => {
    if (!ensembles || !item.marque) return null
    if (!Array.isArray(ensembles)) {
      const e = ensembles[item.marque]
      if (e) return e
    }
    const ensemblesList = Array.isArray(ensembles) ? ensembles : Object.values(ensembles)
    return ensemblesList.find(e => e.slug === item.marque || e.nom?.toLowerCase() === item.marque.toLowerCase())
  }, [item.marque, ensembles])

  // Résoudre les attributs essentiels : array direct ou fallback depuis l'ensemble
  const attrsEssentiels = useMemo(() => {
    if (Array.isArray(item.attributEssentiel) && item.attributEssentiel.length > 0) return item.attributEssentiel
    return ensemble?.attributsEssentiels || []
  }, [item.attributEssentiel, ensemble])

  // Résoudre les attributs essentiels en objets complets avec valeurs
  const resolvedEssentialAttrs = useMemo(() => {
    return attrsEssentiels.map(attrSlug => {
      let targetSlug = attrSlug;
      if (attrSlug === 'offensif') targetSlug = 'degats_armes';
      else if (attrSlug === 'defensif') targetSlug = 'protection';
      else if (attrSlug === 'utilitaire') targetSlug = 'tiers_de_competence';

      const ref = allAttributs && !Array.isArray(allAttributs)
          ? allAttributs[targetSlug] || allAttributs[attrSlug]
          : allAttributs?.find(a => a.slug === targetSlug || a.slug === attrSlug);

      return {
        slug: attrSlug,
        targetSlug,
        ref: ref,
        label: getAttrCategoryLabel(attributsType, attrSlug)
      };
    });
  }, [attrsEssentiels, allAttributs, attributsType]);

  // Résoudre le talent gear set pour torse/sac depuis l'ensemble (slug → objet talent)
  const gearSetTalent = useMemo(() => {
    if (!isGearSet || !ensemble) return null
    const findTalent = (slug) => {
      if (!slug || !hasContent(slug)) return null
      if (talentsEquipements && !Array.isArray(talentsEquipements) && talentsEquipements[slug]) return talentsEquipements[slug]
      const tList = Array.isArray(talentsEquipements) ? talentsEquipements : Object.values(talentsEquipements || {})
      return tList.find(t => t.slug === slug) ||
          tList.find(t => t.nom?.toLowerCase() === slug.toLowerCase())
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
        <div className={`px-4 py-3 border-b ${isPrototype ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-tactical-border/50'}`}>
          <div className="flex items-start gap-2">
            {/* Logo de la marque */}
            {resolveIcon(ensemble?.icon) && (
                <GameIcon src={resolveIcon(ensemble.icon)} alt="" size="w-10 h-10" className="rounded" />
            )}

            <div className='w-full'>
              <div className="flex flex-col">
                <div className="flex flex-row items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    {isMarque && <span className="text-xs font-bold text-shd bg-shd/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Marque</span>}
                    {isExotic && <span className="text-xs font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Exotique</span>}
                    {isNamed && <span className="text-xs font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Nommé</span>}
                    {isGearSet && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Gear Set</span>}
                    {isImprovised && <span className="text-xs font-bold text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Improvisé</span>}
                  </div>

                  {(!isExotic && !isImprovised) && (
                      <button
                          onClick={togglePrototype}
                          className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all ${
                              isPrototype
                                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                                  : 'bg-tactical-bg text-gray-500 border-tactical-border hover:border-gray-500'
                          }`}
                      >
                        <span className="w-6 h-3.5 relative rounded-full border border-current inline-block">
                          <span className={`absolute top-0.5 w-2 h-2 rounded-full bg-current transition-all ${isPrototype ? 'left-3' : 'left-0.5'}`} />
                        </span>
                        Prototype
                      </button>
                  )}
                </div>
                <div className={`font-bold text-base uppercase tracking-wide mt-1 ${nameColor}`}>{item.nom}</div>
              </div>
              { ensemble?.nom && <span className="text-xs text-gray-500 ">{ensemble?.nom}</span> }
            </div>

            {/* Logo de l'équipement */}
            <div className='flex flex-col text-xs text-gray-500 text-center items-center gap-1 ml-1'>
              <GameIcon src={GEAR_SLOT_ICONS_IMG[item.emplacement]} alt="" size="w-10 h-10" className="rounded" />
              <span>{getGearSlotLabel(equipementsType, item.emplacement)}</span>
            </div>


          </div>
          { item.description && <span className="text-xs text-gray-400 italic leading-relaxed whitespace-pre-line">{item.description}</span> }
        </div>

        {/* Attributs */}
        <div className="px-4 py-2.5 space-y-1">
          {/* Attributs essentiels (depuis l'ensemble ou la pièce) */}
          {attrsEssentiels.length > 0 && (
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="text-blue-400 font-bold shrink-0 uppercase tracking-widest text-xs">Essentiel{attrsEssentiels.length > 1 ? 's' : ''}</span>
                <div className="flex flex-col gap-1 flex-1">
                  {resolvedEssentialAttrs.map((attr, i) => {
                    const ref = attr.ref;
                    const pMax = ref?.maxPrototype ?? ref?.prototypeMax ?? ref?.max
                    const val = isPrototype ? pMax : ref?.max;
                    const min = ref?.min || 0;
                    const isSkillTier = attr.targetSlug === 'tiers_de_competence' || attr.slug === 'utilitaire';
                    return (
                        <div key={i} className="text-xs flex items-center gap-1.5 justify-between">
                          <div className="flex items-center gap-1.5 text-shd">
                            <GameIcon src={resolveAttributeIcon(attr.slug)} alt="" size="w-3.5 h-3.5" />
                            <span className="opacity-80">{attr.label} :</span>
                          </div>
                          <span className={`font-bold ${isPrototype ? 'text-cyan-400' : 'text-shd'}`}>
                            {isSkillTier ? (
                                `+${val}`
                            ) : (
                                `${formatNumber(min)}${ref?.unite || ''} - ${formatNumber(val)}${ref?.unite || ''}`
                            )}
                          </span>
                        </div>
                    )
                  })}
                </div>
              </div>
          )}
          {hasContent(item.attributUnique) && (
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-shd font-bold shrink-0 uppercase tracking-widest text-xs">Unique</span>
                <span className={`italic ${isPrototype ? 'text-cyan-400' : 'text-shd'}`}>{item.attributUnique}</span>
              </div>
          )}
          {/* Attributs fixés (référençant attributs.jsonc) */}
          {item.attributs?.length > 0 && (
              <div className="space-y-1 mt-1">
                <span className="text-purple-400 font-bold uppercase tracking-widest text-xs">Attributs</span>
                {item.attributs.map((attr, i) => {
                  const ref = allAttributs && !Array.isArray(allAttributs)
                    ? allAttributs[attr.nom]
                    : allAttributs?.find(a => a.slug === attr.nom || a.nom.toLowerCase() === attr.nom.toLowerCase())
                  const val = isPrototype && attr.prototypeValue !== undefined ? attr.prototypeValue : attr.valeur
                  const pMax = ref?.maxPrototype ?? ref?.prototypeMax ?? ref?.max
                  const max = isPrototype ? pMax : ref?.max
                  const isOverMax = ref && val > max
                  return (
                      <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-shd">
                    <GameIcon src={resolveAttributeIcon(ref?.categorie || attr.nom)} alt="" size="w-3 h-3" />
                    {ref?.nom || attr.nom}
                  </span>
                        <span className={`font-bold ${isOverMax ? 'text-yellow-400' : isPrototype ? 'text-cyan-400' : 'text-shd'}`}>
                    {typeof val === 'number' ? formatNumber(val) : val}{ref?.unite || ''}
                          {isOverMax && <span className="ml-1 text-[8px] text-yellow-500">(max {formatNumber(max)}{ref.unite})</span>}
                  </span>
                      </div>
                  )
                })}
              </div>
          )}
          {item.mod !== undefined && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-gray-500 font-bold shrink-0 tracking-widest text-xs">Emplacement de mods: </span>
                <span className="text-gray-400">{ typeof item.mod === 'number' ? item.mod : item.mod ? 1 : 0 }</span>
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
            <div className="px-3 py-2.5 border-t border-tactical-border/50 space-y-2">
              <TalentInline key={gearSetTalent} talent={gearSetTalent} isExotic={isExotic} isNamed={isNamed} />
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