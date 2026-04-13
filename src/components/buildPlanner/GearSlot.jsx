import { useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import MarkdownText from '../common/MarkdownText'
import GearAttributePanel from './GearAttributePanel'
import ExpertiseSlider from './ExpertiseSlider'

import Badge from '../common/Badge'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function GearSlot({ slotKey, label, icon, piece, talent, hasTalentSlot, onSelect, onSelectTalent, ensembles, talentsEquipements, allAttributs, gearAttributes, onSetAttributes, modsEquipements, gearMods, onSetMod, attributsType, expertiseLevel, onExpertiseChange, maxExpertiseLevel, isPrototype, prototypeTalent, onSelectPrototypeTalent, equipementsType }) {
  const { dispatch } = useBuild()

  const remove = (e) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_GEAR', slot: slotKey })
  }

  // Résoudre le talent gear set depuis l'ensemble (slug → objet talent)
  const gearSetTalent = useMemo(() => {
    if (!piece || piece.type !== 'gear_set') return null
    if (!ensembles || !piece.marque) return null
    const ens = (ensembles && !Array.isArray(ensembles))
      ? ensembles[piece.marque]
      : ensembles?.find(e => e.slug === piece.marque || e.nom?.toLowerCase() === piece.marque.toLowerCase())
    if (!ens) return null
    let slug = null
    if (slotKey === 'torse' && hasContent(ens.talentTorse)) slug = ens.talentTorse
    if (slotKey === 'sac_a_dos' && hasContent(ens.talentSac)) slug = ens.talentSac
    if (!slug) return null
    // Resolve slug to full talent object
    const resolved = (talentsEquipements && !Array.isArray(talentsEquipements))
      ? talentsEquipements[slug]
      : talentsEquipements?.find(t => t.slug === slug)
    return resolved || { nom: slug, description: slug }
  }, [piece, ensembles, slotKey, talentsEquipements])

  // Résoudre le nom de la marque (slug → nom)
  const marqueLabel = useMemo(() => {
    if (!piece?.marque || !ensembles) return piece?.marque || ''
    if (piece.marque === '*') return ''
    const ens = (ensembles && !Array.isArray(ensembles))
      ? ensembles[piece.marque]
      : ensembles?.find(e => e.slug === piece.marque || e.nom?.toLowerCase() === piece.marque.toLowerCase())
    return ens?.nom || piece.marque
  }, [piece, ensembles])

  // Talent pré-inscrit (nommé ou équipement avec talents[] non vide, hors exotique/gear set)
  const hasPredefinedTalent = useMemo(() => {
    if (!piece || piece.type === 'exotique' || piece.type === 'gear_set') return false
    return Array.isArray(piece.talents) && piece.talents.length > 0 && piece.talents.some(t => t && t !== 'n/a' && t !== '')
  }, [piece])

  const resolvedPredefinedTalent = useMemo(() => {
    if (!hasPredefinedTalent || !talentsEquipements) return null
    const slug = piece.talents.find(t => t && t !== 'n/a' && t !== '')
    if (!slug) return null
    const base = (talentsEquipements && !Array.isArray(talentsEquipements))
      ? talentsEquipements[slug]
      : talentsEquipements.find(t => t.slug === slug || t.nom === slug)
    if (!base) return { nom: slug, description: '' }
    if (piece.estNomme && base.perfectDescription) {
      return {
        ...base,
        description: base.perfectDescription,
        isPerfect: true
      }
    }
    return base
  }, [hasPredefinedTalent, piece, talentsEquipements])

  const gearTalentToDisplay = useMemo(() => {
    if (!talent) return null
    // Un talent sélectionné manuellement ne peut pas être parfait
    return talent
  }, [talent])

  const borderColor = isPrototype
      ? 'border-l-cyan-500'
      : piece?.type === 'exotique'
          ? 'border-l-red-400'
          : piece?.estNomme
              ? 'border-l-shd'
              : piece?.type === 'gear_set'
                  ? 'border-l-emerald-500'
                  : 'border-l-blue-500'

  const headerBg = isPrototype ? 'bg-cyan-500/10' : 'bg-blue-500/10'
  const headerBorder = isPrototype ? 'border-cyan-500/30' : 'border-blue-500/30'
  const headerText = isPrototype ? 'text-cyan-400' : (piece?.estNomme ? 'text-shd' : 'text-blue-400')

  return (
      <div className="build-slot group" onClick={piece ? undefined : onSelect}>
        <div className={`px-3 py-2 ${headerBg} ${headerBorder} border-b flex justify-between items-center`}>
          <span className={`${headerText} text-xs font-bold uppercase tracking-widest`}>{icon} {label}</span>
          <div className="flex items-center gap-2">
            {piece && piece.type !== 'exotique' && (
                <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const newActive = !isPrototype
                      dispatch({ type: 'SET_PROTOTYPE', slot: slotKey, active: newActive })
                      if (!newActive && gearAttributes) {
                        const clamp = (a) => (a && a.max != null && a.valeur > a.max) ? { ...a, valeur: a.max } : a
                        const newAttrs = {
                          essentiels: gearAttributes.essentiels?.map(clamp),
                          classiques: gearAttributes.classiques?.map(clamp)
                        }
                        onSetAttributes(newAttrs)
                      }
                    }}
                    className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-1 py-0.5 rounded border transition-all ${
                        isPrototype
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                            : 'bg-tactical-bg/50 text-gray-500 border-tactical-border hover:border-gray-500'
                    }`}
                >
                  <span className="w-4 h-2.5 relative rounded-full border border-current inline-block">
                    <span className={`absolute top-0.5 w-1.5 h-1.5 rounded-full bg-current transition-all ${isPrototype ? 'left-2' : 'left-0.5'}`} />
                  </span>
                  Prototype
                </button>
            )}
            {piece && <button onClick={remove} className="text-red-400 hover:text-red-300 text-xs p-1">✕</button>}
          </div>
        </div>
        <div className="p-3 min-h-25">
          {piece ? (
              <div className={`border-l-2 ${borderColor} pl-3`}>
                <div className="flex items-center gap-2">
                  {piece.type === 'exotique' && <span className="text-red-400 text-xs font-bold">EXOTIQUE</span>}
                  {piece.estNomme && piece.type !== 'exotique' && <span className="text-yellow-500 text-xs font-bold">NOMMÉ</span>}
                  {piece.type === 'gear_set' && <span className="text-emerald-400 text-xs font-bold">GEAR SET</span>}
                </div>
                <div className="font-bold text-white text-sm uppercase tracking-wide">{piece.nom}</div>
                <div className="text-xs text-gray-500">{marqueLabel}</div>
                {piece.attributUnique && (
                    <div className="text-xs text-purple-400 mt-1">✦ {piece.attributUnique}</div>
                )}
                {/* Panneau d'attributs */}
                <GearAttributePanel
                    piece={piece}
                    attributes={gearAttributes}
                    allAttributs={allAttributs}
                    modsEquipements={modsEquipements}
                    gearMods={gearMods}
                    onChange={onSetAttributes}
                    onChangeMod={onSetMod}
                    attributsType={attributsType}
                    ensembles={ensembles}
                    isPrototype={isPrototype}
                    slotKey={slotKey}
                    equipementsType={equipementsType}
                />
                {/* Expertise */}
                {onExpertiseChange && (
                  <ExpertiseSlider
                      slot={slotKey}
                      level={expertiseLevel || 0}
                      onChange={onExpertiseChange}
                      maxLevel={maxExpertiseLevel}
                      disabled={isPrototype}
                  />
                )}
                {/* Talents exotiques (depuis talents[]) — toujours affichés, non modifiables */}
                {piece.type === 'exotique' && piece.talents && piece.talents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-tactical-border">
                      {piece.talents.filter(t => t && t !== 'n/a').map((slug, i) => {
                        const resolved = (talentsEquipements && !Array.isArray(talentsEquipements))
                            ? talentsEquipements[slug]
                            : talentsEquipements?.find(t => t.slug === slug || t.nom === slug)
                        return (
                            <div key={i} className={i > 0 ? "mt-3" : ""}>
                              <div className="text-xs text-red-400 font-bold uppercase tracking-widest">
                                {resolved?.nom ? `Talent : ${resolved.nom}` : 'Talent Exotique'}
                              </div>
                              <MarkdownText className="text-xs text-gray-400 mt-1 leading-relaxed">
                                {resolved?.description || slug}
                              </MarkdownText>
                            </div>
                        )
                      })}
                    </div>
                )}
                {/* Talent gear set résolu depuis l'ensemble — non modifiable */}
                {gearSetTalent && piece.type !== 'exotique' && (
                    <div className="mt-3 pt-3 border-t border-tactical-border">
                      <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
                        {gearSetTalent.nom}
                      </div>
                      {gearSetTalent.description && (
                          <MarkdownText className="text-xs text-gray-400 mt-1 leading-relaxed">{gearSetTalent.description}</MarkdownText>
                      )}
                    </div>
                )}
                {/* Talent pré-inscrit (nommé avec talents[] non vide) — non modifiable */}
                {piece.type !== 'exotique' && !gearSetTalent && hasPredefinedTalent && (
                    <div className="mt-3 pt-3 border-t border-tactical-border">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-yellow-400 font-bold uppercase tracking-widest">
                          Talent : {resolvedPredefinedTalent?.nom || piece.talents[0]}
                        </div>
                        {resolvedPredefinedTalent?.isPerfect && (
                            <span className="text-xs font-bold text-shd-dark bg-shd/20 px-1 py-0.5 rounded uppercase tracking-widest leading-none">
                      ★ Parfait
                    </span>
                        )}
                      </div>
                      {resolvedPredefinedTalent?.description && (
                          <MarkdownText className="text-xs text-gray-400 mt-1 leading-relaxed">{resolvedPredefinedTalent.description}</MarkdownText>
                      )}
                    </div>
                )}
                {/* Talent libre (torse/sac hors gear set, sans talent pré-inscrit) */}
                {hasTalentSlot && piece.type !== 'exotique' && !gearSetTalent && !hasPredefinedTalent && (
                    gearTalentToDisplay ? (
                        <div className="mt-3 pt-3 border-t border-tactical-border">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-shd font-bold uppercase tracking-widest">Talent : {gearTalentToDisplay.nom}</div>
                            </div>
                            {onSelectTalent && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSelectTalent() }}
                                    className="text-xs text-gray-600 hover:text-shd transition-colors"
                                    title="Changer le talent"
                                >✎</button>
                            )}
                          </div>
                          {gearTalentToDisplay.description && (
                              <MarkdownText className="text-xs text-gray-400 mt-1 leading-relaxed">{gearTalentToDisplay.description}</MarkdownText>
                          )}
                        </div>
                    ) : (
                        <div className="mt-3 pt-3 border-t border-tactical-border">
                          <button
                              onClick={(e) => { e.stopPropagation(); onSelectTalent() }}
                              className="text-xs text-shd/60 hover:text-shd uppercase tracking-widest"
                          >
                            + Ajouter un talent
                          </button>
                        </div>
                    )
                )}

                {/* Talent Prototype supplémentaire */}
                {isPrototype && (
                    <div className="mt-3 pt-3 border-t border-cyan-500/30">
                        {prototypeTalent ? (
                            <div className="py-1">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <div className="text-xs text-gray-600 uppercase tracking-widest">Talent Prototype</div>
                                    {onSelectPrototypeTalent && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSelectPrototypeTalent() }}
                                            className="text-xs text-gray-600 hover:text-cyan-400 transition-colors"
                                            title="Changer le talent prototype"
                                        >✎</button>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="text-xs text-cyan-400 font-bold uppercase truncate" title={prototypeTalent.nom}>
                                        {prototypeTalent.nom}
                                    </div>
                                    <span className="text-xs font-bold ml-auto shrink-0 text-cyan-400">
                                        {prototypeTalent.valeur !== undefined ? prototypeTalent.valeur.toFixed(1) : prototypeTalent.statMax}
                                    </span>
                                </div>
                                {prototypeTalent.statMin != null && prototypeTalent.statMax != null && prototypeTalent.statMin !== prototypeTalent.statMax && (
                                    <input
                                        type="range"
                                        min={prototypeTalent.statMin}
                                        max={prototypeTalent.statMax}
                                        step={prototypeTalent.pas || 0.1}
                                        value={prototypeTalent.valeur ?? prototypeTalent.statMax}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            dispatch({
                                                type: 'SET_PROTOTYPE_TALENT',
                                                slot: slotKey,
                                                talent: { ...prototypeTalent, valeur: parseFloat(e.target.value) }
                                            })
                                        }}
                                        className="attr-slider mt-1 accent-cyan-400"
                                    />
                                )}
                                {prototypeTalent.description && (
                                    <MarkdownText className="text-xs text-gray-400 mt-1 leading-relaxed italic">{prototypeTalent.description.replace(/\{value\}/g, prototypeTalent.valeur !== undefined ? prototypeTalent.valeur : prototypeTalent.statMax)}</MarkdownText>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onSelectPrototypeTalent() }}
                                className="text-xs text-cyan-500/60 hover:text-cyan-400 uppercase tracking-widest flex items-center gap-1 py-1"
                            >
                                <span className="text-lg leading-none">+</span> Talent Prototype
                            </button>
                        )}
                    </div>
                )}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 py-4">
                <svg className="w-10 h-10 group-hover:text-blue-500/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm uppercase tracking-widest mt-2">Sélectionner</span>
              </div>
          )}
        </div>
      </div>
  )
}