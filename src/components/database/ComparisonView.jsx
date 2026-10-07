import { useEffect, useMemo } from 'react'
import { useCollection } from '../../context/collectionStore'
import { buildComparison } from '../../config/comparisonConfig'
import { itemKey, itemLabel } from '../../utils/itemIdentity'
import { GameIcon, resolveAsset, WEAPON_TYPE_ICONS, GEAR_SLOT_ICONS_IMG } from '../common/GameAssets'
import MarkdownText from '../common/MarkdownText'

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

/** Icone la plus pertinente selon la categorie. */
function iconFor(category, item) {
    return resolveAsset(item.icon)
        || (category === 'armes' ? WEAPON_TYPE_ICONS[item.type] : null)
        || (item.emplacement ? GEAR_SLOT_ICONS_IMG[item.emplacement] : null)
        || resolveAsset(item.slug)
}

/** Le texte merite-t-il un rendu markdown ? */
function isRich(value) {
    return value.length > 60 || /[*_`\n]/.test(value)
}

function Cell({ cell, isBest }) {
    if (!cell) return <span className="text-gray-700">—</span>

    if (cell.t === 'num') {
        return (
            <span className={isBest ? 'text-shd font-bold' : 'text-gray-200'}>
                {nf.format(cell.v)}
                {cell.u && <span className="text-gray-500 text-xs ml-1">{cell.u}</span>}
            </span>
        )
    }

    if (cell.t === 'bool') {
        return cell.v
            ? <span className="text-shd font-bold">Oui</span>
            : <span className="text-gray-600">Non</span>
    }

    if (cell.t === 'talents') {
        return (
            <ul className="space-y-2">
                {cell.v.map((talent, i) => (
                    <li key={i}>
                        <p className="text-gray-100 font-bold text-xs flex items-center gap-1.5 flex-wrap">
                            {talent.nom}
                            {talent.parfait && (
                                <span className="text-shd-dark bg-shd/20 px-1 py-0.5 rounded uppercase tracking-widest leading-none text-[0.6rem]">
                                    ★ Parfait
                                </span>
                            )}
                        </p>
                        {talent.description && (
                            <MarkdownText className="text-xs [&_p]:mb-1 [&_p]:leading-snug">
                                {talent.description}
                            </MarkdownText>
                        )}
                    </li>
                ))}
            </ul>
        )
    }

    if (cell.t === 'list') {
        return (
            <ul className="space-y-0.5">
                {cell.v.map((entry, i) => (
                    <li key={i} className="text-gray-300 text-xs leading-relaxed">{entry}</li>
                ))}
            </ul>
        )
    }

    return isRich(cell.v)
        ? <MarkdownText className="text-xs [&_p]:mb-1">{cell.v}</MarkdownText>
        : <span className="text-gray-200">{cell.v}</span>
}

export default function ComparisonView({ onClose }) {
    const { comparisonItems, selection, toggleCompare, clearComparison, data } = useCollection()

    const rows = useMemo(
        () => buildComparison(selection.category, comparisonItems, data),
        [selection.category, comparisonItems, data]
    )

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        // Empeche le defilement de l'arriere-plan pendant la comparaison.
        const overflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = overflow
        }
    }, [onClose])

    // Le dernier element retire ferme la vue.
    useEffect(() => {
        if (comparisonItems.length === 0) onClose()
    }, [comparisonItems.length, onClose])

    if (comparisonItems.length === 0) return null

    const colonnes = comparisonItems.length

    return (
        <div
            className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-6 overflow-y-auto"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Comparaison"
        >
            <div
                className="w-full max-w-6xl bg-tactical-panel border border-tactical-border rounded-lg my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-tactical-border">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest">Comparaison</h2>
                        <p className="text-xs text-gray-500 truncate">
                            {selection.groupLabel} · {colonnes} élément{colonnes > 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => { clearComparison(); onClose() }}
                            className="px-3 py-1.5 text-xs uppercase tracking-wider font-bold text-gray-400 border border-tactical-border rounded hover:text-gray-200 hover:bg-tactical-hover transition-colors"
                        >
                            Tout vider
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Fermer la comparaison"
                            className="px-3 py-1.5 text-lg leading-none text-gray-400 border border-tactical-border rounded hover:text-gray-200 hover:bg-tactical-hover transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </header>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="sticky left-0 z-10 bg-tactical-panel border-b border-r border-tactical-border p-3 text-left w-40 min-w-40" />
                                {comparisonItems.map((item) => {
                                    const icon = iconFor(selection.category, item)
                                    return (
                                        <th
                                            key={itemKey(selection.category, item)}
                                            className="border-b border-tactical-border p-3 text-left align-top min-w-[11rem]"
                                        >
                                            <div className="flex items-start gap-2">
                                                {icon && <GameIcon src={icon} alt="" size="w-8 h-8" />}
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-gray-100 leading-tight break-words">
                                                        {itemLabel(item)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => toggleCompare(selection.category, item)}
                                                    aria-label={`Retirer ${itemLabel(item)} de la comparaison`}
                                                    className="text-gray-600 hover:text-red-400 transition-colors leading-none shrink-0"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.key} className="align-top">
                                    <th
                                        scope="row"
                                        className="sticky left-0 z-10 bg-tactical-panel border-b border-r border-tactical-border/50 p-3 text-left font-bold text-gray-500 uppercase tracking-wider text-xs"
                                    >
                                        {row.label}
                                        {row.better && (
                                            <span className="block font-normal normal-case tracking-normal text-gray-700">
                                                {row.better === 'high' ? 'plus = mieux' : 'moins = mieux'}
                                            </span>
                                        )}
                                    </th>
                                    {row.cells.map((cell, i) => (
                                        <td
                                            key={i}
                                            className={`border-b border-tactical-border/30 p-3 ${
                                                row.best.includes(i) ? 'bg-shd/10' : ''
                                            }`}
                                        >
                                            <Cell cell={cell} isBest={row.best.includes(i)} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {rows.length === 0 && (
                    <p className="p-8 text-center text-sm text-gray-500">
                        Aucun champ comparable renseigné sur ces éléments.
                    </p>
                )}
            </div>
        </div>
    )
}
