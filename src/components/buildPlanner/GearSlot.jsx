import { useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import GearAttributePanel from './GearAttributePanel'
import ExpertiseSlider from './ExpertiseSlider'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function GearSlot({ slotKey, label, icon, piece, talent, hasTalentSlot, onSelect, onSelectTalent, ensembles, talentsEquipements, allAttributs, gearAttributes, onSetAttributes, modsEquipements, gearMods, onSetMod, attributsType, expertiseLevel, onExpertiseChange, maxExpertiseLevel }) {
  const { dispatch } = useBuild()

  const remove = (e) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_GEAR', slot: slotKey })
  }

  // Résoudre le talent gear set depuis l'ensemble (slug → objet talent)
  const gearSetTalent = useMemo(() => {
    if (!piece || piece.type !== 'gear_set') return null
    if (!ensembles || !piece.marque) return null
    const ens = ensembles.find(e => e.slug === piece.marque || e.nom.toLowerCase() === piece.marque.toLowerCase())
    if (!ens) return null
    let slug = null
    if (slotKey === 'torse' && hasContent(ens.talentTorse)) slug = ens.talentTorse
    if (slotKey === 'sac_a_dos' && hasContent(ens.talentSac)) slug = ens.talentSac
    if (!slug) return null
    // Resolve slug to full talent object
    const resolved = talentsEquipements?.find(t => t.slug === slug)
    return resolved || { nom: slug, description: slug }
  }, [piece, ensembles, slotKey, talentsEquipements])

  // Résoudre le nom de la marque (slug → nom)
  const marqueLabel = useMemo(() => {
    if (!piece?.marque || !ensembles) return piece?.marque || ''
    if (piece.marque === '*') return ''
    const ens = ensembles.find(e => e.slug === piece.marque || e.nom.toLowerCase() === piece.marque.toLowerCase())
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
    const base = talentsEquipements.find(t => t.slug === slug || t.nom === slug)
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

  const borderColor = piece?.type === 'exotique'
      ? 'border-l-shd'
      : piece?.estNomme
          ? 'border-l-yellow-500'
          : piece?.type === 'gear_set'
              ? 'border-l-emerald-500'
              : 'border-l-blue-500'

  return (
      <div className="build-slot group" onClick={piece ? undefined : onSelect}>
        <div className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/30 flex justify-between items-center">
          <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">{icon} {label}</span>
          {piece && <button onClick={remove} className="text-red-400 hover:text-red-300 text-xs p-1">✕</button>}
        </div>
        <div className="p-3 min-h-25">
          {piece ? (
              <div className={`border-l-2 ${borderColor} pl-3`}>
                <div className="flex items-center gap-2">
                  {piece.type === 'exotique' && <span className="text-shd text-xs font-bold">EXOTIQUE</span>}
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
                />
                {/* Expertise */}
                {onExpertiseChange && (
                    <ExpertiseSlider slot={slotKey} level={expertiseLevel || 0} onChange={onExpertiseChange} maxLevel={maxExpertiseLevel} />
                )}
                {/* Talents exotiques (depuis talents[]) — toujours affichés, non modifiables */}
                {piece.type === 'exotique' && piece.talents && piece.talents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-tactical-border">
                      {piece.talents.filter(t => t && t !== 'n/a').map((slug, i) => {
                        const resolved = talentsEquipements?.find(t => t.slug === slug || t.nom === slug)
                        return (
                            <div key={i} className={i > 0 ? "mt-3" : ""}>
                              <div className="text-xs text-shd font-bold uppercase tracking-widest">
                                {resolved?.nom ? `Talent : ${resolved.nom}` : 'Talent Exotique'}
                              </div>
                              <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
                                {resolved?.description || slug}
                              </div>
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
                          <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">{gearSetTalent.description}</div>
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
                            <span className="text-[10px] font-bold text-shd-dark bg-shd/20 px-1 py-0.5 rounded uppercase tracking-widest leading-none">
                      ★ Parfait
                    </span>
                        )}
                      </div>
                      {resolvedPredefinedTalent?.description && (
                          <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{resolvedPredefinedTalent.description}</div>
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
                              <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{gearTalentToDisplay.description}</div>
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