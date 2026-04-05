import { resolveAttribut, resolveAsset, GameIcon } from '../common/GameAssets.jsx'

const CAT_COLORS = {
  offensif: 'text-red-400',
  defensif: 'text-blue-400',
  utilitaire: 'text-yellow-400',
}

/**
 * Affiche un attribut sélectionné avec slider min/max.
 *
 * Props:
 * - readOnly: valeur ET attribut non modifiables (tout grisé)
 * - locked: attribut non remplaçable/supprimable, mais la valeur reste ajustable dans la range
 */
export default function AttributeSlider({ attribute, onChange, onPick, onRemove, readOnly = false, locked = false, label, isPrototype = false }) {
  if (!attribute) {
    if (locked || readOnly) return null
    return (
      <button
        onClick={onPick}
        className="w-full text-left text-xs text-shd/50 hover:text-shd uppercase tracking-widest py-1 transition-colors"
      >
        + {label || 'Attribut'}
      </button>
    )
  }

  const icon = resolveAsset(resolveAttribut(attribute))
  const color = isPrototype ? 'text-cyan-400' : (CAT_COLORS[attribute.categorie] || 'text-gray-400')

  // La valeur est ajustable sauf en readOnly
  const canAdjustValue = !readOnly
  // L'attribut peut être changé/retiré sauf en readOnly ou locked
  const canChangeAttribute = !readOnly && !locked

  const handleSlider = (e) => {
    if (!canAdjustValue) return
    const v = parseFloat(e.target.value)
    onChange?.({ ...attribute, valeur: v })
  }

  const max = isPrototype ? (attribute.maxPrototype ?? attribute.prototypeMax ?? attribute.max) : attribute.max
  const min = isPrototype ? (attribute.minPrototype ?? attribute.prototypeMin ?? attribute.min) : attribute.min

  return (
    <div className="py-1">
      {label && <div className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">{label}</div>}
      <div className="flex items-center gap-1.5">
        <GameIcon src={icon} alt="" size="w-3.5 h-3.5" className="opacity-60 shrink-0" />
        <button
          onClick={canChangeAttribute ? onPick : undefined}
          className={`text-xs ${color} font-medium truncate ${canChangeAttribute ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
          title={attribute.nom}
        >
          {attribute.nom}
        </button>
        <span className={`text-xs font-bold ml-auto shrink-0 ${color}`}>
          {typeof attribute.valeur === 'number' ? (
            attribute.unite === 'pts' || attribute.unite === 'pts/s'
              ? attribute.valeur.toLocaleString('fr-FR')
              : attribute.valeur
          ) : '—'}{attribute.unite || ''}
        </span>
        {canChangeAttribute && onRemove && (
          <button onClick={onRemove} className="text-gray-600 hover:text-red-400 text-xs ml-0.5" title="Retirer">✕</button>
        )}
      </div>
      {!readOnly && min != null && max != null && min !== max && (
        <input
          type="range"
          min={min}
          max={max}
          step={attribute.unite === 'pts' || attribute.unite === 'pts/s' ? 1 : 0.1}
          value={attribute.valeur ?? max}
          onChange={handleSlider}
          className={`attr-slider mt-1 ${isPrototype ? 'accent-cyan-400' : ''}`}
        />
      )}
    </div>
  )
}



