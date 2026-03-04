import { useState } from 'react'
import { resolveIcon, WEAPON_TYPE_ICONS, GameIcon } from '../../../utils/gameAssets'

const COMPAT_LABELS = {
  fusil: 'Fusil',
  calibre_12: 'Cal.12',
  fusil_assaut: 'FA',
  fusil_mitrailleur: 'FM',
  fusil_precision: 'FP',
  pistolet: 'Pistolet',
  pistolet_mitrailleur: 'PM',
}

/**
 * Affiche un talent résolu inline (dans une WeaponCard, GearCard, etc.)
 * Même présentation que TalentArmeCard mais en version compacte.
 * Si le talent a une perfectDescription, un switch permet de basculer.
 */
export default function TalentInline({ talent, isExotic = false, allArmes, allEquipements, isNamed }) {

  if (!talent) return null

  // Talent non résolu (texte brut depuis les anciennes données)
  if (typeof talent === 'string') {
    return (
      <div className="text-xs text-gray-400 leading-relaxed">
        <span className={`font-bold uppercase tracking-widest text-xs ${isExotic ? 'text-red-400' : 'text-shd'}`}>
          Talent :{' '}
        </span>
        {talent}
      </div>
    )
  }

  // Talent résolu (objet complet depuis talents-armes ou talents-equipements)
  const icon = resolveIcon(talent.icone)
  const nameColor = talent.estExotique ? 'text-red-400' : 'text-shd'
  const isPerfectNamed = isNamed && talent.perfectDescription

  const [showPerfect, setShowPerfect] = useState(isPerfectNamed)

  const description = showPerfect ? talent.perfectDescription : talent.description
  const compatTypes = talent.compatibilite
    ? Object.entries(talent.compatibilite).filter(([, v]) => v).map(([k]) => k)
    : []


  return (
    <div className="bg-tactical-bg/40 rounded px-3 py-2 space-y-1.5">
      {/* Header : icone + nom + badge exo + switch parfait */}
      <div className="flex items-center gap-2 flex-wrap">
        <GameIcon src={icon} alt="" size="w-5 h-5" />
        <span className={`font-bold text-xs uppercase tracking-wide ${nameColor}`}>
          {talent.nom}
        </span>
        {talent.estExotique && (
            <span className="text-xs font-bold text-red-400 bg-red-500/15 px-1 py-0.5 rounded uppercase tracking-widest">
            Exotique
          </span>
        )}
        {showPerfect && (
            <span className="text-xs font-bold text-shd-dark bg-shd/15 px-1 py-0.5 rounded uppercase tracking-widest">
            ★ Parfait
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="text-xs text-gray-400 leading-relaxed">
          {description}
        </div>
      )}

      {/* Armes/équipements nommés portant la version parfaite */}
      {showPerfect && talent.armesParfaites?.length > 0 && (
        <div className="text-xs text-yellow-500/70 mt-0.5 flex items-center gap-1">
          <span className="text-yellow-400 font-bold uppercase tracking-widest">Arme :</span>
          {talent.armesParfaites.map(slug => {
            const arme = allArmes?.find(a => a.slug === slug)
            return arme?.nom || slug
          }).join(', ')}
        </div>
      )}
      {showPerfect && talent.equipementsParfaits?.length > 0 && (
        <div className="text-xs text-yellow-500/70 mt-0.5 flex items-center gap-1">
          <span className="text-yellow-400 font-bold uppercase tracking-widest">Équipement :</span>
          {talent.equipementsParfaits.map(slug => {
            const eq = allEquipements?.find(e => e.slug === slug)
            return eq?.nom || slug
          }).join(', ')}
        </div>
      )}

      {/* Compatibilité armes */}
      {compatTypes.length > 0 && !talent.estExotique && (
        <div className="flex flex-wrap gap-1">
          {compatTypes.map(t => (
            <span key={t} className="text-xs font-bold uppercase tracking-widest bg-shd/10 text-shd/70 px-1 py-0.5 rounded flex items-center gap-0.5">
              <GameIcon src={WEAPON_TYPE_ICONS[t]} alt="" size="w-2.5 h-2.5" className="opacity-60" />
              {COMPAT_LABELS[t] || t}
            </span>
          ))}
        </div>
      )}

      {/* Prérequis */}
      {talent.prerequis && talent.prerequis !== 'n/a' && (
        <div className="text-xs text-yellow-500/70">Requis : {talent.prerequis}</div>
      )}
    </div>
  )
}



