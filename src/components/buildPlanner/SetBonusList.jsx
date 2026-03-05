/**
 * Affiche les bonus d'ensemble (Gear Sets) et de marque (Brand Sets).
 * Chaque bonus actif est mis en surbrillance, les bonus non débloqués sont grisés.
 */

export default function SetBonusList({ setBonuses }) {
  const { gearSets, brandSets } = setBonuses

  if (gearSets.length === 0 && brandSets.length === 0) {
    return (
      <p className="text-xs text-gray-600 uppercase tracking-widest text-center py-3">
        Aucun bonus d'ensemble actif
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* Gear Sets */}
      {gearSets.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
            Gear Sets
          </h5>
          {gearSets.map(set => (
            <SetEntry key={set.slug} entry={set} accentColor="emerald" />
          ))}
        </div>
      )}

      {/* Brand Sets */}
      {brandSets.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5">
            Marques
          </h5>
          {brandSets.map(set => (
            <SetEntry key={set.slug} entry={set} accentColor="blue" />
          ))}
        </div>
      )}
    </div>
  )
}

function SetEntry({ entry, accentColor }) {
  const countColor = accentColor === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
  const bgActive = accentColor === 'emerald' ? 'bg-emerald-500/10' : 'bg-blue-500/10'

  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs font-bold text-white truncate">{entry.nom}</span>
        <span className={`text-xs font-bold ${countColor}`}>
          {entry.count}/{entry.maxPieces}
        </span>
      </div>
      <div className="space-y-0.5">
        {entry.bonuses.map((bonus, i) => (
          <div
            key={i}
            className={`flex items-start gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              bonus.active
                ? `${bgActive} text-gray-200`
                : 'text-gray-600'
            }`}
          >
            <span className={`shrink-0 font-bold ${bonus.active ? countColor : 'text-gray-600'}`}>
              {bonus.pieces}p
            </span>
            <span className="leading-relaxed line-clamp-2">{bonus.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
