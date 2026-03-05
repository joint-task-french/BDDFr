/**
 * Barres de core attributs : 6 segments pour offensif/défensif/utilitaire.
 * Couleurs et labels récupérés dynamiquement depuis attributs-type.jsonc.
 */

const CATEGORY_KEYS = ['offensif', 'defensif', 'utilitaire']

const TAILWIND_COLORS = {
  red: { filled: 'bg-red-500', empty: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  blue: { filled: 'bg-blue-500', empty: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  yellow: { filled: 'bg-yellow-500', empty: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
}

function resolveColor(attributsType, catKey) {
  // attributsType keys are unaccented ('defensif')
  const normalizedKey = catKey.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const typeData = attributsType?.[normalizedKey] || attributsType?.[catKey]
  const color = typeData?.color || 'gray'
  return TAILWIND_COLORS[color] || TAILWIND_COLORS.yellow
}

function resolveLabel(attributsType, catKey) {
  const normalizedKey = catKey.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return attributsType?.[normalizedKey]?.nom || attributsType?.[catKey]?.nom || catKey
}

export default function CoreAttributeBars({ coreStats, attributsType }) {
  const maxCores = 6

  return (
    <div className="space-y-2">
      {CATEGORY_KEYS.map(catKey => {
        const count = coreStats[catKey] || 0
        const colors = resolveColor(attributsType, catKey)
        const label = resolveLabel(attributsType, catKey)

        return (
          <div key={catKey} className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-widest w-20 shrink-0 ${colors.text}`}>
              {label}
            </span>
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: maxCores }).map((_, i) => (
                <div
                  key={i}
                  className={`h-5 flex-1 rounded-sm transition-colors ${
                    i < count ? colors.filled : colors.empty
                  }`}
                />
              ))}
            </div>
            <span className={`text-sm font-bold w-6 text-right ${colors.text}`}>
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}


