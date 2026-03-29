import MarkdownText from '../common/MarkdownText'

/**
 * Affiche les bonus d'ensemble (Gear Sets) et de marque (Brand Sets).
 * Chaque bonus actif est mis en surbrillance, les bonus non débloqués sont grisés.
 */

export default function SetBonusList({ setBonuses, data }) {
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
            <SetEntry key={set.slug} entry={set} accentColor="emerald" data={data} />
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
            <SetEntry key={set.slug} entry={set} accentColor="blue" data={data} />
          ))}
        </div>
      )}
    </div>
  )
}

function SetEntry({ entry, accentColor, data }) {
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
            <div className="flex-1 min-w-0">
              <BonusDisplay bonus={bonus.text} data={data} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BonusDisplay({ bonus, data }) {
  if (typeof bonus === 'string') {
    return (
      <MarkdownText className="leading-relaxed">
        {bonus.replace(/^\.\+?/, '+')}
      </MarkdownText>
    )
  }

  if (!bonus || !data) return null

  const resolveAttrName = (slug) => {
    if (!slug) return slug
    const attr = data.attributs?.[slug]
    if (attr) return attr.nom
    const stat = data.statistiques?.[slug]
    if (stat) return stat.nom
    return slug.replace(/_/g, ' ')
  }

  const talent = bonus.talent ? (data.talents_equipements?.[bonus.talent] || data.talentsEquipements?.[bonus.talent]) : null

  return (
    <div className="flex flex-col gap-0.5">
      {bonus.attributs && bonus.attributs.map((attr, i) => (
        <span key={i} className="leading-tight">
          <strong className="text-shd">{attr.value > 0 ? '+' : ''}{attr.value}{
            attr.slug.includes('taille_chargeur') ||
            attr.slug.includes('capacite_munitions') ||
            attr.slug.includes('utilitaire') ||
            attr.slug.includes('menace') ||
            attr.slug.includes('portee_optimale')
                ? '' : '%'
          }</strong>{' '}
          {resolveAttrName(attr.slug)}
        </span>
      ))}
      {talent && (
        <div className="mt-0.5">
          <div className="text-shd font-bold truncate">{talent.nom}</div>
        </div>
      )}
    </div>
  )
}
