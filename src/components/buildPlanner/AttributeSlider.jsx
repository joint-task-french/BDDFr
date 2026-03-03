import { resolveAttributeIcon, GameIcon } from '../../utils/gameAssets'

const CAT_COLORS = {
  offensif: 'text-red-400',
  'défensif': 'text-blue-400',
  utilitaire: 'text-yellow-400',
}

/**
 * Affiche un attribut sélectionné avec slider min/max.
 * @param {{ nom, valeur, min, max, unite, categorie }} attribute
 * @param {function} onChange - (newAttribute) quand la valeur du slider change
 * @param {function} onPick - Ouvre le picker pour changer l'attribut
 * @param {function} [onRemove] - Retirer l'attribut
 * @param {boolean} [readOnly] - Slider désactivé
 * @param {string} [label] - Label au-dessus (ex: "Attribut Essentiel")
 */
export default function AttributeSlider({ attribute, onChange, onPick, onRemove, readOnly = false, label }) {
  if (!attribute) {
    return (
      <button
        onClick={onPick}
        className="w-full text-left text-[11px] text-shd/50 hover:text-shd uppercase tracking-widest py-1 transition-colors"
      >
        + {label || 'Attribut'}
      </button>
    )
  }

  const icon = resolveAttributeIcon(attribute.categorie || attribute.nom)
  const color = CAT_COLORS[attribute.categorie] || 'text-gray-400'

  const handleSlider = (e) => {
    if (readOnly) return
    const v = parseFloat(e.target.value)
    onChange({ ...attribute, valeur: v })
  }

  return (
    <div className="py-1">
      {label && <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">{label}</div>}
      <div className="flex items-center gap-1.5">
        <GameIcon src={icon} alt="" size="w-3.5 h-3.5" className="opacity-60 shrink-0" />
        <button
          onClick={readOnly ? undefined : onPick}
          className={`text-[11px] ${color} font-medium truncate ${readOnly ? 'cursor-default' : 'hover:underline cursor-pointer'}`}
          title={attribute.nom}
        >
          {attribute.nom}
        </button>
        <span className={`text-[11px] font-bold ml-auto shrink-0 ${color}`}>
          {typeof attribute.valeur === 'number' ? (
            attribute.unite === 'pts' || attribute.unite === 'pts/s'
              ? attribute.valeur.toLocaleString('fr-FR')
              : attribute.valeur
          ) : '—'}{attribute.unite || ''}
        </span>
        {!readOnly && onRemove && (
          <button onClick={onRemove} className="text-gray-600 hover:text-red-400 text-[10px] ml-0.5" title="Retirer">✕</button>
        )}
      </div>
      {attribute.min != null && attribute.max != null && attribute.min !== attribute.max && (
        <input
          type="range"
          min={attribute.min}
          max={attribute.max}
          step={attribute.unite === 'pts' || attribute.unite === 'pts/s' ? 1 : 0.1}
          value={attribute.valeur ?? attribute.max}
          onChange={handleSlider}
          disabled={readOnly}
          className="attr-slider mt-1"
        />
      )}
    </div>
  )
}



