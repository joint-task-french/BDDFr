import { useState } from 'react'

/**
 * Panneau de filtres qui s'affiche en overlay quand on clique sur le bouton "Filtres".
 * Reçoit une configuration de filtres spécifique à chaque catégorie.
 */
export default function FilterPanel({ filters, values, onChange, onReset }) {
  const [open, setOpen] = useState(false)

  const activeCount = Object.entries(values).filter(([key, val]) => {
    const f = filters.find(x => x.key === key)
    if (!f) return false
    if (f.type === 'range') return val[0] !== f.min || val[1] !== f.max
    if (f.type === 'select' || f.type === 'multiselect') return val !== '' && val !== 'all'
    if (f.type === 'toggle') return val === true
    if (f.type === 'checkboxes') return val && val.length > 0
    return false
  }).length

  return (
    <div className="relative mb-4">
      {/* Bouton toggle */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-all ${
          open || activeCount > 0
            ? 'bg-shd/20 text-shd border-shd/40'
            : 'bg-tactical-panel text-gray-400 border-tactical-border hover:border-gray-500'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filtres
        {activeCount > 0 && (
          <span className="bg-shd text-black px-1.5 py-0.5 rounded-full text-xs font-black">{activeCount}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-2 bg-tactical-panel border border-tactical-border rounded-lg p-4 shadow-xl z-30 relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Filtres avancés</span>
            <div className="flex gap-2">
              {activeCount > 0 && (
                <button onClick={onReset}
                  className="text-xs text-red-400 font-bold uppercase tracking-widest hover:text-red-300 transition-colors">
                  Réinitialiser
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-shd text-lg leading-none">&times;</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {filters.map(filter => (
              <FilterField key={filter.key} filter={filter} value={values[filter.key]} onChange={v => onChange(filter.key, v)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterField({ filter, value, onChange }) {
  switch (filter.type) {
    case 'select':
      return (
        <div>
          <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{filter.label}</label>
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-tactical-bg border border-tactical-border rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-shd"
          >
            <option value="">Tous</option>
            {filter.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )

    case 'checkboxes':
      return (
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-1.5">{filter.label}</label>
          <div className="flex flex-wrap gap-1.5">
            {filter.options.map(opt => {
              const checked = (value || []).includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    const current = value || []
                    onChange(checked ? current.filter(v => v !== opt.value) : [...current, opt.value])
                  }}
                  className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border transition-all ${
                    checked
                      ? 'bg-shd/20 text-shd border-shd/40'
                      : 'bg-tactical-bg text-gray-500 border-tactical-border hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )

    case 'range':
      return <DualRangeSlider filter={filter} value={value} onChange={onChange} />

    case 'toggle':
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(!value)}
            className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-shd' : 'bg-tactical-border'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : ''}`} />
          </button>
          <span className={`text-xs font-bold uppercase tracking-widest ${value ? 'text-shd' : 'text-gray-500'}`}>
            {filter.label}
          </span>
        </div>
      )

    default:
      return null
  }
}

/**
 * Slider à double poignée sur une seule barre.
 * Deux <input type="range"> superposés avec une piste colorée entre les deux thumbs.
 */
function DualRangeSlider({ filter, value, onChange }) {
  const min = filter.min
  const max = filter.max
  const step = filter.step || 1
  const lo = value[0]
  const hi = value[1]

  // Pourcentages pour la barre colorée
  const loPercent = ((lo - min) / (max - min)) * 100
  const hiPercent = ((hi - min) / (max - min)) * 100

  const handleLo = (e) => {
    const v = Number(e.target.value)
    onChange([Math.min(v, hi), hi])
  }

  const handleHi = (e) => {
    const v = Number(e.target.value)
    onChange([lo, Math.max(v, lo)])
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
        {filter.label}
        <span className="text-shd ml-1.5">{lo} — {hi}</span>
      </label>
      <div className="relative h-6 flex items-center">
        {/* Piste de fond */}
        <div className="absolute left-0 right-0 h-1 rounded-full bg-tactical-border" />
        {/* Piste active (entre les deux thumbs) */}
        <div
          className="absolute h-1 rounded-full bg-shd/60"
          style={{ left: `${loPercent}%`, right: `${100 - hiPercent}%` }}
        />
        {/* Input min — z-index plus haut quand les deux sont proches du max */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={handleLo}
          className="dual-range-thumb absolute w-full"
          style={{ zIndex: lo > max - step ? 4 : 3 }}
        />
        {/* Input max */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={handleHi}
          className="dual-range-thumb absolute w-full"
          style={{ zIndex: hi <= min + step ? 3 : 4 }}
        />
      </div>
    </div>
  )
}



