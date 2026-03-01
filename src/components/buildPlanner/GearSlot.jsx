import { useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function GearSlot({ slotKey, label, icon, piece, talent, hasTalentSlot, onSelect, onSelectTalent, ensembles }) {
  const { dispatch } = useBuild()

  const remove = (e) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_GEAR', slot: slotKey })
  }

  // Résoudre le talent gear set depuis l'ensemble
  const gearSetTalent = useMemo(() => {
    if (!piece || piece.source !== 'gear_set' || piece.estExotique) return null
    if (!ensembles || !piece.marque) return null
    const ens = ensembles.find(e => e.nom.toLowerCase() === piece.marque.toLowerCase())
    if (!ens) return null
    if (slotKey === 'torse' && hasContent(ens.talentTorse)) return ens.talentTorse
    if (slotKey === 'sac_a_dos' && hasContent(ens.talentSac)) return ens.talentSac
    return null
  }, [piece, ensembles, slotKey])

  const borderColor = piece?.estExotique
    ? 'border-l-shd'
    : piece?.estNomme
    ? 'border-l-yellow-500'
    : piece?.source === 'gear_set'
    ? 'border-l-emerald-500'
    : 'border-l-blue-500'

  return (
    <div className="build-slot group" onClick={piece ? undefined : onSelect}>
      <div className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/30 flex justify-between items-center">
        <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">{icon} {label}</span>
        {piece && <button onClick={remove} className="text-red-400 hover:text-red-300 text-xs p-1">✕</button>}
      </div>
      <div className="p-3 min-h-[100px]">
        {piece ? (
          <div className={`border-l-2 ${borderColor} pl-3`}>
            <div className="flex items-center gap-2">
              {piece.estExotique && <span className="text-shd text-[9px] font-bold">EXOTIQUE</span>}
              {piece.estNomme && !piece.estExotique && <span className="text-yellow-500 text-[9px] font-bold">NOMMÉ</span>}
              {piece.source === 'gear_set' && <span className="text-emerald-400 text-[9px] font-bold">GEAR SET</span>}
            </div>
            <div className="font-bold text-white text-sm uppercase tracking-wide">{piece.nom}</div>
            <div className="text-xs text-gray-500">{piece.marque}</div>
            {piece.attributEssentiel && (
              <div className="text-[10px] text-blue-400 mt-1">{piece.attributEssentiel}</div>
            )}
            {piece.attributUnique && (
              <div className="text-[10px] text-purple-400 mt-1">✦ {piece.attributUnique}</div>
            )}
            {/* Talents exotiques intégrés */}
            {piece.estExotique && piece.talent1 && (
              <div className="mt-3 pt-3 border-t border-tactical-border">
                <div className="text-xs text-shd font-bold uppercase tracking-widest">Talent Exotique</div>
                <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-3">{piece.talent1}</div>
                {piece.talent2 && piece.talent2 !== 'n/a' && (
                  <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{piece.talent2}</div>
                )}
              </div>
            )}
            {/* Talent nommé dédié */}
            {piece.estNomme && !piece.estExotique && hasContent(piece.talent) && (
              <div className="mt-3 pt-3 border-t border-tactical-border">
                <div className="text-xs text-yellow-400 font-bold uppercase tracking-widest">Talent Nommé</div>
                <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-3">{piece.talent}</div>
              </div>
            )}
            {/* Talent gear set résolu depuis l'ensemble */}
            {gearSetTalent && !piece.estExotique && (
              <div className="mt-3 pt-3 border-t border-tactical-border">
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
                  Talent {slotKey === 'torse' ? 'Torse' : 'Sac'} (Set)
                </div>
                <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-3">{gearSetTalent}</div>
              </div>
            )}
            {/* Talent libre (torse/sac hors gear set) */}
            {hasTalentSlot && !piece.estExotique && !gearSetTalent && (
              talent ? (
                <div className="mt-3 pt-3 border-t border-tactical-border">
                  <div className="text-xs text-shd font-bold uppercase tracking-widest">Talent : {talent.nom}</div>
                  {talent.description && (
                    <div className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{talent.description}</div>
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

