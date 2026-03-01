import { useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import { GEAR_SLOT_LABELS, SPECIALISATIONS } from '../../utils/formatters'

export default function BuildSummary({ data }) {
  const { specialWeapon, weapons, weaponTalents, sidearm, sidearmTalent, gear, gearTalents, skills, specialisation } = useBuild()

  const weaponCount = (specialWeapon ? 1 : 0) + weapons.filter(Boolean).length + (sidearm ? 1 : 0)
  const gearCount = Object.values(gear).filter(Boolean).length
  const skillCount = skills.filter(Boolean).length

  // Brand bonuses
  const brandCount = useMemo(() => {
    const counts = {}
    Object.values(gear).forEach(piece => {
      if (piece && piece.marque && piece.marque !== 'Exotique') {
        counts[piece.marque] = (counts[piece.marque] || 0) + 1
      }
    })
    return counts
  }, [gear])

  // Build stats estimation
  const stats = useMemo(() => {
    const s = {
      degatsArme: 0,
      bonusActifs: [],
    }

    // Sum weapon damages
    weapons.forEach(w => {
      if (w?.degatsBase) s.degatsArme += w.degatsBase
    })
    if (sidearm?.degatsBase) s.degatsArme += sidearm.degatsBase

    // Brand/gear set bonuses
    for (const [brand, count] of Object.entries(brandCount)) {
      const ensemble = (data.ensembles || []).find(e =>
        e.nom.toLowerCase() === brand.toLowerCase()
      )
      if (!ensemble) continue

      if (ensemble.type === 'gear_set') {
        if (count >= 2 && ensemble.bonus2pieces) s.bonusActifs.push({ marque: brand, niveau: '2p', bonus: ensemble.bonus2pieces })
        if (count >= 3 && ensemble.bonus3pieces) s.bonusActifs.push({ marque: brand, niveau: '3p', bonus: ensemble.bonus3pieces })
        if (count >= 4 && ensemble.bonus4pieces) s.bonusActifs.push({ marque: brand, niveau: '4p', bonus: ensemble.bonus4pieces })
      } else {
        if (count >= 1 && ensemble.bonus1piece) s.bonusActifs.push({ marque: brand, niveau: '1p', bonus: ensemble.bonus1piece })
        if (count >= 2 && ensemble.bonus2pieces) s.bonusActifs.push({ marque: brand, niveau: '2p', bonus: ensemble.bonus2pieces })
        if (count >= 3 && ensemble.bonus3pieces) s.bonusActifs.push({ marque: brand, niveau: '3p', bonus: ensemble.bonus3pieces })
      }
    }

    return s
  }, [weapons, sidearm, brandCount, data])

  const specInfo = specialisation ? SPECIALISATIONS[specialisation] : null

  if (weaponCount === 0 && gearCount === 0 && skillCount === 0) {
    return (
      <div className="bg-tactical-panel border border-tactical-border rounded-lg p-6 text-center">
        <p className="text-gray-500 text-sm uppercase tracking-widest italic">
          Sélectionnez des éléments pour voir le récapitulatif...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Spécialisation + Armes */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest border-b border-red-500/30 pb-2">
            🔫 Armement ({weaponCount}/4)
          </h4>
          {/* Spécialisation */}
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Spécialisation : </span>
            {specialWeapon ? (
              <>
                <span className="text-purple-400 font-bold">{specInfo?.icon} {specInfo?.label}</span>
                <span className="text-gray-500 text-xs ml-1">({specialWeapon.nom})</span>
              </>
            ) : (
              <span className="text-gray-600">—</span>
            )}
          </div>
          {/* Primaire / Secondaire */}
          {['Primaire', 'Secondaire'].map((label, i) => {
            const w = weapons[i]
            const t = weaponTalents[i]
            return (
              <div key={i} className="text-sm">
                <span className="text-gray-500 text-xs">{label} : </span>
                {w ? (
                  <>
                    <span className="text-white font-bold">{w.nom}</span>
                    {w.estExotique && <span className="text-shd text-xs ml-1">★</span>}
                    {t && <span className="text-shd text-xs ml-1">[{t.nom}]</span>}
                  </>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </div>
            )
          })}
          {/* Arme de poing */}
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Arme de poing : </span>
            {sidearm ? (
              <>
                <span className="text-white font-bold">{sidearm.nom}</span>
                {sidearm.estExotique && <span className="text-shd text-xs ml-1">★</span>}
                {sidearmTalent && <span className="text-shd text-xs ml-1">[{sidearmTalent.nom}]</span>}
              </>
            ) : (
              <span className="text-gray-600">—</span>
            )}
          </div>
        </div>

        {/* Équipements */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/30 pb-2">
            🛡️ Équipements ({gearCount}/6)
          </h4>
          {Object.entries(GEAR_SLOT_LABELS).map(([key, label]) => {
            const g = gear[key]
            return (
              <div key={key} className="text-sm">
                <span className="text-gray-500 text-xs">{label} : </span>
                {g ? (
                  <>
                    <span className="text-white font-bold">{g.nom}</span>
                    <span className="text-gray-500 text-xs ml-1">({g.marque})</span>
                    {g.estExotique && <span className="text-shd text-xs ml-1">★</span>}
                  </>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Bonus activés */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-500/30 pb-2">
            🏷️ Bonus Activés
          </h4>
          {stats.bonusActifs.length > 0 ? (
            stats.bonusActifs.map((b, i) => (
              <div key={i} className="text-[11px] text-emerald-400">
                <span className="text-white font-bold">{b.marque}</span>
                <span className="text-gray-500 ml-1">({b.niveau})</span>
                <span className="ml-1">{b.bonus}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-600 italic">Aucun bonus actif</div>
          )}
        </div>

        {/* Compétences */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-widest border-b border-yellow-500/30 pb-2">
            ⚡ Compétences ({skillCount}/2)
          </h4>
          {skills.map((s, i) => (
            <div key={i} className="text-sm">
              {s ? (
                <>
                  <span className="text-white font-bold">{s.competence}</span>
                  <span className="text-yellow-400 text-xs ml-1">[{s.variante}]</span>
                </>
              ) : (
                <span className="text-gray-600">Compétence {i + 1} : —</span>
              )}
            </div>
          ))}
        </div>

        {/* Talents d'équipement */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/30 pb-2">
            🏅 Talents d'Équipement
          </h4>
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Torse : </span>
            {gearTalents.torse
              ? <span className="text-white font-bold">{gearTalents.torse.nom}</span>
              : <span className="text-gray-600">—</span>}
          </div>
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Sac à dos : </span>
            {gearTalents.sac_a_dos
              ? <span className="text-white font-bold">{gearTalents.sac_a_dos.nom}</span>
              : <span className="text-gray-600">—</span>}
          </div>
        </div>

        {/* Statistiques indicatives */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-shd uppercase tracking-widest border-b border-shd/30 pb-2">
            📊 Statistiques
          </h4>
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Dégâts arme cumulés : </span>
            <span className="text-red-400 font-bold">
              {stats.degatsArme > 0 ? stats.degatsArme.toLocaleString('fr-FR') : '—'}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Pièces de marque : </span>
            {Object.entries(brandCount).length > 0
              ? Object.entries(brandCount).map(([brand, count]) => (
                  <span key={brand} className="inline-block mr-2 text-xs">
                    <span className="text-white font-bold">{brand}</span>
                    <span className="text-shd ml-0.5">×{count}</span>
                  </span>
                ))
              : <span className="text-gray-600">—</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
