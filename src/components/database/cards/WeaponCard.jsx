import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { getWeaponTypeLabel, getWeaponEssentialAttributes, formatNumber, calculateMaxDamage } from '../../../utils/formatters'
import { WEAPON_TYPE_ICONS, resolveAttributeIcon, GameIcon, resolveIcon } from '../../../utils/gameAssets'
import { formatModAttributs } from '../../../utils/modCompatibility'
import TalentInline from './TalentInline'
import ObtentionDisplay from './ObtentionDisplay'
import MarkdownText from '../../common/MarkdownText'
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
  if (!talentsArmes) {
    return item.talents.filter(t => hasContent(t))
  }

  const isArray = Array.isArray(talentsArmes)
  const talentsList = isArray ? talentsArmes : Object.values(talentsArmes)

  return item.talents.filter(t => hasContent(t)).map(slug => {
    // Accès direct par slug si c'est un objet
    if (!isArray && talentsArmes[slug]) return talentsArmes[slug]

    // Chercher par slug d'abord, puis par nom (rétrocompatibilité)
    const found = talentsList.find(ta => ta.slug === slug) ||
        talentsList.find(ta => ta.nom?.toLowerCase() === slug.toLowerCase())
    return found || slug // retourne l'objet talent ou le texte brut
  })
}

export default function WeaponCard({ item, talentsArmes, allAttributs, armesType, modsArmes }) {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isExotic = item.estExotique
  const isSpecific = item.type === 'arme_specifique'
  const isNamed = item.estNomme && !isExotic

  const isUrlPrototype = params.slug === item.slug && params.modifier === 'prototype'
  const forcePrototype = searchParams.get('prototype') === 'true'

  const [isPrototype, setIsPrototype] = useState((isUrlPrototype || forcePrototype) && !isExotic && !isSpecific)

  useEffect(() => {
    if (params.slug === item.slug) {
      setIsPrototype((params.modifier === 'prototype' || forcePrototype) && !isExotic && !isSpecific)
    } else if (forcePrototype && !isExotic && !isSpecific) {
      setIsPrototype(true)
    }
  }, [params.modifier, params.slug, item.slug, forcePrototype, isExotic, isSpecific])

  const togglePrototype = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isExotic || isSpecific) return

    const nextState = !isPrototype
    setIsPrototype(nextState)

    const category = params.category || 'armes'
    const itemSlug = item.slug || item.nom
    const basePath = `/db/${category}/${itemSlug}`

    navigate({
      pathname: nextState ? `${basePath}/prototype` : basePath,
      search: location.search
    }, {
      replace: params.slug === itemSlug
    })
  }

  const nameColor = isPrototype ? 'text-cyan-400' : isExotic ? 'text-red-400' : isNamed ? 'text-yellow-400' : isSpecific ? 'text-purple-400' : 'text-shd'
  const borderColor = isPrototype ? 'border-cyan-500/50' : ''

  // Priorité : icône personnalisée de l'arme > icône par défaut du type d'arme
  const customIcon = resolveIcon(item.icon)
  const typeIcon = customIcon || WEAPON_TYPE_ICONS[item.type]

  // Résoudre les attributs essentiels hérités du type d'arme
  const essentialAttrs = getWeaponEssentialAttributes(armesType, item.type, allAttributs, item.attributs_essentiels)

  const resolvedTalents = resolveTalents(item, talentsArmes)

  const degatsBase = isPrototype && item.prototypeDegatsBase !== undefined ? item.prototypeDegatsBase : item.degatsBase
  const portee = isPrototype && item.prototypePortee !== undefined ? item.prototypePortee : item.portee
  const rpm = isPrototype && item.prototypeRpm !== undefined ? item.prototypeRpm : item.rpm
  const chargeur = isPrototype && item.prototypeChargeur !== undefined ? item.prototypeChargeur : item.chargeur
  const rechargement = isPrototype && item.prototypeRechargement !== undefined ? item.prototypeRechargement : item.rechargement
  const headshot = isPrototype && item.prototypeHeadshot !== undefined ? item.prototypeHeadshot : item.headshot

  return (
      <div className={`bg-tactical-panel border ${borderColor || 'border-tactical-border'} rounded-lg overflow-hidden hover:border-tactical-border/80 transition-colors flex flex-col h-full`}>
        {/* Header : Nom + Type + Fabricant */}
        <div className={`px-4 py-3 border-b ${isPrototype ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-tactical-border/50'} flex flex-col gap-1`}>
          <div className="flex flex-row gap-2">
            <GameIcon src={typeIcon} alt={item.type} size="w-10 h-10" className={ isSpecific ? '' : 'opacity-60' } />
            <div className="w-full">
              <div className={`font-bold text-base uppercase tracking-wide ${nameColor} flex items-center gap-2 justify-between`}>
            <span>
              {isExotic && <span className="mr-0.5">★</span>}
              {item.nom}
            </span>

                <div className="flex items-center gap-2">
                  {!isExotic && !isSpecific && (
                      <button
                          onClick={togglePrototype}
                          className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all ${
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
                  {isExotic && <span className="text-xs font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Exotique</span>}
                  {isNamed && <span className="text-xs font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Nommé</span>}
                  {isSpecific && <span className="text-xs font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded uppercase tracking-widest">Arme spécifique</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span>{item.armePoing ? 'Arme de poing' : getWeaponTypeLabel(armesType, item.type)}</span>
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
          { item.description && (
            <MarkdownText className="text-xs text-gray-400 italic leading-relaxed">
              {item.description}
            </MarkdownText>
          ) }
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-px bg-tactical-border/30">
          <Stat label="Portée" value={portee ? `${portee}m` : '0m'} isPrototype={isPrototype && item.prototypePortee !== undefined} />
          <Stat label="CPM" value={rpm || '0\u200B'} isPrototype={isPrototype && item.prototypeRpm !== undefined} />
          <Stat label="Dégâts base" value={formatNumber(degatsBase) + "\u200B"} accent isPrototype={isPrototype && item.prototypeDegatsBase !== undefined} />
          <Stat label="Chargeur" value={chargeur || '0\u200B'} isPrototype={isPrototype && item.prototypeChargeur !== undefined} />
          <Stat label="Rechargement" value={rechargement ? `${rechargement}s` : '0s'} isPrototype={isPrototype && item.prototypeRechargement !== undefined} />
          <Stat label="Dégâts max" value={formatNumber(calculateMaxDamage(degatsBase)) + "\u200B"} accent info="Calcul des Dégâts Max (+160%)\n\n• Équipement : +90%\n• Expertise : +30%\n• Type d'arme : +15%\n• Spécialisation : +15%\n• Montre SHD : +10%\n\nLe total est calculé par l'addition de ces bonus." isPrototype={isPrototype && item.prototypeDegatsBase !== undefined} />
          <Stat label="Headshot" value={headshot != null ? `${headshot}%` : '0%'} span2={essentialAttrs.length === 0} isPrototype={isPrototype && item.prototypeHeadshot !== undefined} />
        </div>

        {/* Attributs essentiels (hérités du type d'arme) */}
        {essentialAttrs.length > 0 && (
            <div className="px-4 py-2 border-t border-tactical-border/50 space-y-1">
              <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-1">Attributs essentiels</div>
              {essentialAttrs.map((attr, i) => {
                const val = isPrototype && attr.prototypeValue !== undefined ? attr.prototypeValue : attr.value
                const pMax = attr.maxPrototype ?? attr.prototypeMax ?? attr.max
                const pMin = attr.minPrototype ?? attr.prototypeMin ?? attr.min
                const range = isPrototype ? `${pMin}--${pMax}` : `${attr.min}--${attr.max}`
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-400">
                <GameIcon src={resolveAttributeIcon(attr.categorie)} alt="" size="w-3 h-3" />
                {attr.nom}
              </span>
                    <span className={`font-bold ${isPrototype ? 'text-cyan-400' : 'text-shd'}`}>
                {val ? val : range}{attr.unite || ''}
              </span>
                  </div>
              )})}
            </div>
        )}

        {/* Attributs fixés */}
        {item.attributs?.length > 0 && (
            <div className="px-4 py-2 border-t border-tactical-border/50 space-y-1">
              {item.attributs.map((attr, i) => {
                const ref = allAttributs && !Array.isArray(allAttributs) 
                  ? allAttributs[attr.nom] 
                  : allAttributs?.find(a => a.slug === attr.nom || a.nom.toLowerCase() === attr.nom.toLowerCase())
                const val = isPrototype && attr.prototypeValue !== undefined ? attr.prototypeValue : attr.valeur
                const pMax = ref?.maxPrototype ?? ref?.prototypeMax ?? ref?.max
                const max = isPrototype ? pMax : ref?.max
                const isOverMax = ref && val > max
                const displayName = ref?.nom || attr.nom

                return (
                    <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <GameIcon src={resolveAttributeIcon(ref?.categorie || attr.nom)} alt="" size="w-3 h-3" />
                  {displayName}
                </span>
                      <span className={`font-bold ${isOverMax ? 'text-yellow-400' : isPrototype ? 'text-cyan-400' : 'text-shd'}`}>
                  {val}{ref?.unite || ''}
                        {isOverMax && <span className="ml-1 text-xs text-yellow-500">(max {max}{ref.unite})</span>}
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
                const mod = modsArmes && !Array.isArray(modsArmes) ? modsArmes[slug] : modsArmes.find(m => m.slug === slug)
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
                          <MarkdownText className="mt-0.5 text-xs text-gray-500 italic leading-relaxed border-l border-tactical-border/30 pl-2 ml-1">
                            {mod.notes}
                          </MarkdownText>
                      )}
                    </div>
                )
              })}
            </div>
        )}

        {/* Obtention */}
        <div className="flex-1" />
        <ObtentionDisplay obtention={item.obtention} />

        {/* Notes */}
        {(hasContent(item.notes) || item.armePoing) && (
            <div className="px-4 py-2 border-t border-tactical-border/50 bg-black/10">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Notes</div>
              <MarkdownText className="text-xs text-gray-400 italic leading-relaxed">
                {hasContent(item.notes) && item.notes}
                {hasContent(item.notes) && item.armePoing && '\n'}
                {item.armePoing && "Cette arme s'équipe dans l'emplacement Arme de poing."}
              </MarkdownText>
            </div>
        )}
      </div>
  )
}

function Stat({ label, value, accent, span2, info, isPrototype }) {
  if (!value || value === '—' || value === '0') return <div className="bg-tactical-bg/50 p-2" />
  const valueColor = isPrototype ? 'text-cyan-400' : accent ? 'text-red-400' : 'text-gray-200'
  return (
      <div className={`bg-tactical-bg/50 p-2 ${span2 ? 'col-span-2' : ''}`}>
        <div className="text-xs text-gray-600 uppercase tracking-widest flex flex-row items-center">
          {label}
          {info && <InfoToolTip text={info} />}
        </div>
        <div className={`text-sm font-bold ${valueColor}`}>{value}</div>
      </div>
  )
}