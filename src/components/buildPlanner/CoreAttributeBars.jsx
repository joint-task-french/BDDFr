import { useState } from 'react'

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

export default function CoreAttributeBars({ coreStats, coreSources, attributsType }) {
  const [expanded, setExpanded] = useState(null)
  const maxCores = 6

  return (
    <div className="space-y-2">
      {CATEGORY_KEYS.map(catKey => {
        const count = coreStats[catKey] || 0
        const sources = coreSources?.[catKey] || []
        const colors = resolveColor(attributsType, catKey)
        const label = resolveLabel(attributsType, catKey)
        const isExpanded = expanded === catKey

        return (
          <div key={catKey} className="group">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 -mx-1"
              onClick={() => setExpanded(isExpanded ? null : catKey)}
            >
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
            
            {/* Sources des coeurs */}
            {isExpanded && sources.length > 0 && (
              <div className="mt-1 mb-2 ml-22 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {sources.map((src, i) => (
                  <div key={i} className="flex justify-between text-2xs text-gray-500 italic">
                    <span>{src.nom}</span>
                    <span className="font-bold">+{src.valeur}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


