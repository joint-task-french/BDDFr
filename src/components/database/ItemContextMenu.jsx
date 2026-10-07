import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCollection } from '../../context/collectionStore'
import { itemKey, itemLabel } from '../../utils/itemIdentity'
import { COMPARISON_MAX } from '../../config/comparisonConfig'

/**
 * Menu contextuel d'un element de la base (clic droit / appui long).
 *
 * Rendu une seule fois par la page : les cartes se contentent d'ouvrir le menu
 * via `itemMenuHandlers()`, elles n'embarquent aucune UI de menu.
 */
export default function ItemContextMenu() {
    const { menu } = useCollection()
    if (!menu) return null
    // La `key` remonte le menu a chaque ouverture : l'etat des sous-menus repart
    // a zero sans avoir a le remettre a plat dans un effet.
    return <MenuContent key={`${menu.category}:${menu.x}:${menu.y}`} menu={menu} />
}

function MenuContent({ menu }) {
    const { closeMenu, lists, createList, addToList, removeFromList, listsContaining,
        canCompare, toggleCompare, isSelected, selection } = useCollection()

    const ref = useRef(null)
    const inputRef = useRef(null)
    const [showLists, setShowLists] = useState(false)
    const [creating, setCreating] = useState(false)
    const [draft, setDraft] = useState('')
    const [pos, setPos] = useState({ x: 0, y: 0 })

    // Repositionne le menu pour qu'il reste entierement visible.
    useLayoutEffect(() => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const marge = 8
        const x = Math.min(menu.x, window.innerWidth - rect.width - marge)
        const y = Math.min(menu.y, window.innerHeight - rect.height - marge)
        setPos({ x: Math.max(marge, x), y: Math.max(marge, y) })
    }, [menu, showLists, creating, lists.length])

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') closeMenu() }
        const onPointer = (e) => { if (!ref.current?.contains(e.target)) closeMenu() }
        // Un defilement deplacerait le menu loin de son element d'origine.
        const onScroll = () => closeMenu()

        document.addEventListener('keydown', onKey)
        document.addEventListener('mousedown', onPointer)
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll)
        return () => {
            document.removeEventListener('keydown', onKey)
            document.removeEventListener('mousedown', onPointer)
            window.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('resize', onScroll)
        }
    }, [menu, closeMenu])

    useEffect(() => {
        if (creating) inputRef.current?.focus()
    }, [creating])

    const { category, item } = menu
    const key = itemKey(category, item)
    const compare = canCompare(category, item)
    const dejaCompare = isSelected(category, item)
    const listesAvec = listsContaining(category, item)

    const handleCompare = () => {
        if (!compare.ok) return
        toggleCompare(category, item)
        closeMenu()
    }

    const handleToggleList = (listId) => {
        if (listesAvec.includes(listId)) removeFromList(listId, category, key)
        else addToList(listId, category, item)
    }

    const handleCreate = () => {
        const id = createList(draft)
        if (!id) return
        addToList(id, category, item)
        setCreating(false)
        setDraft('')
    }

    return (
        <div
            ref={ref}
            role="menu"
            aria-label={`Actions pour ${itemLabel(item) || 'cet élément'}`}
            style={{ left: pos.x, top: pos.y }}
            className="fixed z-[200] w-64 bg-tactical-panel border border-tactical-border rounded-lg shadow-2xl overflow-hidden text-sm"
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-3 py-2 border-b border-tactical-border bg-tactical-hover/40">
                <p className="font-bold text-gray-200 truncate">{itemLabel(item) || key}</p>
            </div>

            <div className="py-1">
                {/* --- Comparateur --- */}
                <button
                    role="menuitem"
                    onClick={handleCompare}
                    disabled={!compare.ok}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                        compare.ok
                            ? 'text-gray-200 hover:bg-tactical-hover'
                            : 'text-gray-600 cursor-not-allowed'
                    }`}
                >
                    <span>{dejaCompare ? 'Retirer du comparateur' : 'Comparer'}</span>
                    {compare.ok
                        ? <span className="text-xs text-gray-500">{selection.items.length}/{COMPARISON_MAX}</span>
                        : <span className="text-shd">•</span>}
                </button>
                {!compare.ok && compare.reason && (
                    <p className="px-3 pb-2 -mt-1 text-xs text-gray-500 leading-snug">{compare.reason}</p>
                )}

                {/* --- Listes --- */}
                <button
                    role="menuitem"
                    aria-expanded={showLists}
                    onClick={() => setShowLists(v => !v)}
                    className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-gray-200 hover:bg-tactical-hover transition-colors"
                >
                    <span>Ajouter à une liste</span>
                    <span className="text-xs text-gray-500">
                        {listesAvec.length > 0 && <span className="text-shd mr-1">{listesAvec.length}</span>}
                        {showLists ? '▾' : '▸'}
                    </span>
                </button>

                {showLists && (
                    <div className="border-t border-tactical-border/50 bg-tactical-bg/40 max-h-56 overflow-y-auto">
                        {lists.length === 0 && !creating && (
                            <p className="px-3 py-2 text-xs text-gray-500">Aucune liste pour le moment.</p>
                        )}

                        {lists.map(list => {
                            const dedans = listesAvec.includes(list.id)
                            return (
                                <button
                                    key={list.id}
                                    role="menuitemcheckbox"
                                    aria-checked={dedans}
                                    onClick={() => handleToggleList(list.id)}
                                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-tactical-hover transition-colors"
                                >
                                    <span className={`w-4 shrink-0 ${dedans ? 'text-shd' : 'text-gray-700'}`}>
                                        {dedans ? '✓' : '·'}
                                    </span>
                                    <span className={`truncate ${dedans ? 'text-shd' : 'text-gray-300'}`}>{list.nom}</span>
                                    <span className="ml-auto text-xs text-gray-600">{list.items.length}</span>
                                </button>
                            )
                        })}

                        {creating ? (
                            <div className="p-2 flex gap-1">
                                <input
                                    ref={inputRef}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreate()
                                        if (e.key === 'Escape') { e.stopPropagation(); setCreating(false) }
                                    }}
                                    maxLength={80}
                                    placeholder="Nom de la liste"
                                    aria-label="Nom de la nouvelle liste"
                                    className="flex-1 min-w-0 bg-tactical-bg border border-tactical-border rounded px-2 py-1 text-xs text-gray-200 focus:border-shd focus:outline-none"
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={!draft.trim()}
                                    className="px-2 py-1 text-xs font-bold rounded bg-shd/20 text-shd border border-shd/40 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    OK
                                </button>
                            </div>
                        ) : (
                            <button
                                role="menuitem"
                                onClick={() => setCreating(true)}
                                className="w-full text-left px-3 py-2 text-shd hover:bg-tactical-hover transition-colors border-t border-tactical-border/50"
                            >
                                + Nouvelle liste…
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}
