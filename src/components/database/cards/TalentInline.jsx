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
        <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
          {description}
        </div>
      )}

      {/* Prérequis */}
      {talent.prerequis && talent.prerequis !== 'n/a' && (
        <div className="text-xs text-yellow-500/70">Requis : {talent.prerequis}</div>
      )}

      {/* Notes */}
      {talent.notes && talent.notes !== 'n/a' && talent.notes !== '-' && (
        <div className="mt-1 pt-1 border-t border-tactical-border/30">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Notes</div>
          <div className="text-[11px] text-gray-400 italic leading-relaxed whitespace-pre-line">
            {talent.notes}
          </div>
        </div>
      )}
    </div>
  )
}



