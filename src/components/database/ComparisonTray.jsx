import { useCollection } from '../../context/collectionStore'
import { COMPARISON_MAX } from '../../config/comparisonConfig'
import { itemKey, itemLabel } from '../../utils/itemIdentity'

/**
 * Barre flottante recapitulant la selection du comparateur.
 * Sert aussi d'indice de decouverte : le comparateur s'alimente au clic droit,
 * ce qui ne s'invente pas — le message l'explique tant qu'il reste de la place.
 */
export default function ComparisonTray({ onOpen }) {
    const { selection, comparisonItems, toggleCompare, clearComparison } = useCollection()

    if (selection.items.length === 0) return null

    const total = comparisonItems.length

    return (
        <div className="fixed bottom-0 inset-x-0 z-[120] pointer-events-none px-3 pb-3">
            <div className="pointer-events-auto max-w-4xl mx-auto bg-tactical-panel/95 backdrop-blur border border-tactical-border rounded-lg shadow-2xl p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-400">
                        Comparateur
                        <span className="text-shd ml-2">{total}/{COMPARISON_MAX}</span>
                    </p>
                    <p className="text-xs text-gray-600 hidden sm:block truncate">
                        {selection.groupLabel}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {comparisonItems.map(item => (
                        <span
                            key={itemKey(selection.category, item)}
                            className="inline-flex items-center gap-1.5 bg-tactical-hover border border-tactical-border rounded px-2 py-1 text-xs text-gray-200 max-w-[14rem]"
                        >
                            <span className="truncate">{itemLabel(item)}</span>
                            <button
                                onClick={() => toggleCompare(selection.category, item)}
                                aria-label={`Retirer ${itemLabel(item)}`}
                                className="text-gray-500 hover:text-red-400 transition-colors leading-none"
                            >
                                ×
                            </button>
                        </span>
                    ))}

                    {total < COMPARISON_MAX && (
                        <span className="text-xs text-gray-600 italic">
                            clic droit sur un élément pour l’ajouter
                        </span>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={clearComparison}
                            className="px-3 py-1.5 text-xs uppercase tracking-wider font-bold text-gray-400 border border-tactical-border rounded hover:text-gray-200 hover:bg-tactical-hover transition-colors"
                        >
                            Vider
                        </button>
                        <button
                            onClick={onOpen}
                            disabled={total < 2}
                            className="px-4 py-1.5 text-xs uppercase tracking-wider font-bold rounded border transition-colors bg-shd/20 text-shd border-shd/40 hover:bg-shd/30 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={total < 2 ? 'Sélectionnez au moins 2 éléments' : undefined}
                        >
                            Comparer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
