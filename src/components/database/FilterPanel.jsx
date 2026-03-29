import { useState } from 'react'

/**
 * Panneau de filtres qui s'affiche en overlay quand on clique sur le bouton "Filtres".
 * Reçoit une configuration de filtres spécifique à chaque catégorie.
 */
/**
 * Panneau de filtres : le bouton est rendu inline, le panneau se déploie
 * en pleine largeur en dessous via la prop renderPanel (callback).
 */
/**
 * Panneau de filtres séparé en deux éléments :
 * - FilterButton : le bouton toggle (inline dans le flux)
 * - FilterPanelContent : le panneau déplié (pleine largeur, sous la barre)
 */

export function useFilterPanel({ filters, values, onChange, onReset }) {
  const [open, setOpen] = useState(false)

  const activeCount = Object.entries(values).filter(([key, val]) => {
    const f = filters.find(x => x.key === key)
    if (!f) return false
    if (f.type === 'range') return val[0] !== f.min || val[1] !== f.max
    if (f.type === 'select' || f.type === 'multiselect') return val !== '' && val !== 'all'
    if (f.type === 'toggle') return val === true
    if (f.type === 'checkboxes') return val && val.length > 0
    if (f.type === 'tri-state') return val === true || val === false
    return false
  }).length

  const button = (
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
  )

  const panel = open ? (
    <div className="bg-tactical-panel border border-tactical-border rounded-lg p-4 shadow-xl">
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
        {[...filters]
          .sort((a, b) => {
            const getOrder = (f) => {
              if (f.type === 'select' || f.type === 'multiselect') return 1
              if (f.type === 'range') return 2
              if (f.type === 'checkboxes') return 3
              if (f.type === 'tri-state') return 4
              if (f.type === 'toggle') return 5
              return 6
            }
            return getOrder(a) - getOrder(b)
          })
          .map(filter => (
            <FilterField key={filter.key} filter={filter} value={values[filter.key]} onChange={v => onChange(filter.key, v)} />
          ))}
      </div>
    </div>
  ) : null

  return { button, panel }
}

// Default export kept for backward compat — wraps the hook
export default function FilterPanel(props) {
  const { button, panel } = useFilterPanel(props)
  return (
    <div>
      {button}
      {panel && <div className="mt-2">{panel}</div>}
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
        <div className="flex flex-col gap-1 py-1">
          <label className="block text-xs font-bold uppercase tracking-widest invisible">Invisible Label</label>
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
        </div>
      )

    case 'tri-state':
      const status = value === true ? 'true' : value === false ? 'false' : 'null'
      const cycle = () => {
        if (status === 'null') onChange(true)
        else if (status === 'true') onChange(false)
        else onChange(null)
      }

      const isGst = !!filter.isGearSetType
      return (
        <div className="flex flex-col gap-1 py-1">
          <label className="block text-xs font-bold uppercase tracking-widest invisible">Invisible Label</label>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={cycle}
              className={`relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all shrink-0 ${
                status === 'true' ? (isGst ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-shd/20 border-shd text-shd') :
                status === 'false' ? (isGst ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-red-500/20 border-red-500 text-red-400') :
                'bg-tactical-bg border-tactical-border hover:border-gray-500'
              }`}
            >
              {status === 'true' && (
                isGst ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )
              )}
              {status === 'false' && (
                isGst ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )
              )}
              {status === 'null' && (
                <span className="w-2 h-0.5 bg-gray-600 rounded-full" />
              )}
            </button>
            <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${
              status === 'true' ? (isGst ? 'text-emerald-400' : 'text-shd') :
              status === 'false' ? (isGst ? 'text-orange-400' : 'text-red-400') :
              'text-gray-500'
            }`}>
              {filter.label}
              <span className="ml-1.5 text-xs opacity-60 font-normal normal-case tracking-normal">
                {status === 'true' && `(${filter.trueLabel || 'oui'})`}
                {status === 'false' && `(${filter.falseLabel || 'non'})`}
                {status === 'null' && '(tous)'}
              </span>
            </span>
          </div>
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



