function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

const TYPE_LABELS = {
  chargeur: 'Chargeur',
  canon: 'Canon',
  viseur: 'Viseur',
  accessoire: 'Accessoire',
  autre: 'Autre',
}

export default function ModArmeCard({ item }) {
  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex">
      {/* Type badge */}
      <div className="w-1.5 shrink-0 bg-shd/30" />
      <div className="px-3 py-2.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-bold text-shd text-xs uppercase tracking-wide truncate">{item.nom}</div>
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest bg-tactical-bg text-gray-500 px-1.5 py-0.5 rounded">
            {TYPE_LABELS[item.type] || item.type}
          </span>
        </div>
        <div className="flex gap-4 mt-1.5 text-[11px]">
          {hasContent(item.bonus) && (
            <span className="text-emerald-400">{item.bonus.replace(/^\.\+?\s*/, '+')}</span>
          )}
          {hasContent(item.malus) && item.malus !== "Pas d'effet négatif" && item.malus !== "Pas d'effet ngatif" && (
            <span className="text-red-400">{item.malus.replace(/^\.?-?\s*/, '-')}</span>
          )}
        </div>
      </div>
    </div>
  )
}


