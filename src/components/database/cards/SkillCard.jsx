function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-' && v !== 'N/A'
}

export default function SkillCard({ item }) {
  return (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-tactical-border/50">
        <div className="font-bold text-yellow-400 text-sm uppercase tracking-wide">{item.variante}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          <span className="text-yellow-500/70 font-bold">{item.competence}</span>
          {hasContent(item.expertise) && <span className="ml-2 text-gray-600">· {item.expertise}</span>}
        </div>
      </div>

      <div className="px-4 py-2.5 space-y-1.5">
        {hasContent(item.statistiques) && (
          <div className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-line">
            {item.statistiques}
          </div>
        )}
        {hasContent(item.effetEtat) && (
          <div className="text-[11px]">
            <span className="text-purple-400 font-bold uppercase tracking-widest text-[10px]">Effet d'état : </span>
            <span className="text-gray-400">{item.effetEtat}</span>
          </div>
        )}
        {hasContent(item.surcharge) && (
          <div className="text-[11px]">
            <span className="text-shd font-bold uppercase tracking-widest text-[10px]">Surcharge : </span>
            <span className="text-gray-400">{item.surcharge}</span>
          </div>
        )}
      </div>

      {/* Tiers */}
      {(hasContent(item.tier1) || hasContent(item.tier6)) && (
        <div className="px-4 py-2 border-t border-tactical-border/50">
          <div className="flex flex-wrap gap-1">
            {[1,2,3,4,5,6].map(n => {
              const val = item[`tier${n}`]
              if (!hasContent(val)) return null
              return (
                <span key={n} className="text-[9px] font-bold bg-yellow-500/10 text-yellow-400/80 px-1.5 py-0.5 rounded uppercase tracking-widest">
                  T{n}: {val}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

