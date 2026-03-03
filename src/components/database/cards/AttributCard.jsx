import { resolveAttributeIcon, GameIcon } from '../../../utils/gameAssets'

const CATEGORIE_LABELS = {
  offensif: 'Offensif',
  'défensif': 'Défensif',
  utilitaire: 'Utilitaire',
}

const CATEGORIE_COLORS = {
  offensif: 'text-red-400 bg-red-500/10 border-red-500/30',
  'défensif': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  utilitaire: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
}

const CIBLE_LABELS = {
  arme: 'Armes',
  equipement: 'Équipements',
}

export default function AttributCard({ item }) {
  const catColor = CATEGORIE_COLORS[item.categorie] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'
  const icon = resolveAttributeIcon(item.categorie)

  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="flex items-center gap-2">
          <GameIcon src={icon} alt="" size="w-5 h-5" />
          <span className="font-bold text-sm text-white uppercase tracking-wide">{item.nom}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${catColor}`}>
            {CATEGORIE_LABELS[item.categorie] || item.categorie}
          </span>
          {item.cible?.map(c => (
            <span key={c} className="text-[9px] font-bold uppercase tracking-widest bg-tactical-bg text-gray-500 px-1.5 py-0.5 rounded border border-tactical-border">
              {CIBLE_LABELS[c] || c}
            </span>
          ))}
        </div>
      </div>

      {/* Valeurs min/max */}
      <div className="grid grid-cols-2 gap-px bg-tactical-border/30">
        <div className="bg-tactical-bg/50 p-3 text-center">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest">Min</div>
          <div className="text-sm font-bold text-gray-300">
            {item.min != null ? `${item.min}${item.unite || ''}` : '—'}
          </div>
        </div>
        <div className="bg-tactical-bg/50 p-3 text-center">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest">Max</div>
          <div className="text-sm font-bold text-shd">
            {item.max != null ? `${item.max}${item.unite || ''}` : '—'}
          </div>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <div className="px-4 py-2.5 text-[11px] text-gray-400 leading-relaxed">
          {item.description}
        </div>
      )}
    </div>
  )
}

