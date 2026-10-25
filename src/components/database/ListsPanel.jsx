import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCollection } from '../../context/collectionStore'
import { categoryIcon, categoryLabel } from '../../config/categories'
import { itemLabel } from '../../utils/itemIdentity'

const EXPORT_FORMAT = 'bddfr-listes'
const EXPORT_VERSION = 1

/** Declenche le telechargement d'un JSON cote navigateur. */
function downloadJSON(nomFichier, contenu) {
    const blob = new Blob([JSON.stringify(contenu, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nomFichier
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Liberation differee : Safari peut encore lire l'URL au moment du clic.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function slugFichier(nom) {
    return String(nom).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'liste'
}

export default function ListsPanel({ onClose }) {
    const {
        lists, createList, renameList, deleteList, removeFromList,
        resolveListItems, importLists,
    } = useCollection()

    const [activeId, setActiveId] = useState(() => lists[0]?.id || null)
    const [draft, setDraft] = useState('')
    const [renaming, setRenaming] = useState(null)
    const [renameDraft, setRenameDraft] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [message, setMessage] = useState(null)
    const fileRef = useRef(null)
    const navigate = useNavigate()

    // Derive plutot que corrige : si la liste selectionnee disparait (suppression,
    // import), on retombe sur la premiere sans passer par un effet correctif.
    const active = useMemo(
        () => lists.find(l => l.id === activeId) || lists[0] || null,
        [lists, activeId]
    )
    const entries = useMemo(() => resolveListItems(active), [active, resolveListItems])

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        const overflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = overflow
        }
    }, [onClose])

    useEffect(() => {
        if (!message) return
        const t = setTimeout(() => setMessage(null), 4000)
        return () => clearTimeout(t)
    }, [message])

    const handleCreate = () => {
        const id = createList(draft)
        if (id) { setDraft(''); setActiveId(id) }
    }

    const handleExportAll = () => {
        downloadJSON(`bddfr-listes-${new Date().toISOString().slice(0, 10)}.json`, {
            format: EXPORT_FORMAT, version: EXPORT_VERSION, exporte: new Date().toISOString(), listes: lists,
        })
    }

    const handleExportOne = (list) => {
        downloadJSON(`bddfr-${slugFichier(list.nom)}.json`, {
            format: EXPORT_FORMAT, version: EXPORT_VERSION, exporte: new Date().toISOString(), listes: [list],
        })
    }

    const handleImport = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = '' // permet de reimporter le meme fichier
        if (!file) return
        try {
            const texte = await file.text()
            const n = importLists(JSON.parse(texte))
            setMessage(n > 0
                ? `${n} liste${n > 1 ? 's' : ''} importée${n > 1 ? 's' : ''}.`
                : 'Aucune liste valide dans ce fichier.')
        } catch {
            setMessage('Fichier illisible : JSON invalide.')
        }
    }

    const openItem = (entry) => {
        const slug = entry.item?.slug || entry.key
        navigate(`/db/${entry.category}/${slug}`)
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-6 overflow-y-auto"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Mes listes"
        >
            <div
                className="w-full max-w-4xl bg-tactical-panel border border-tactical-border rounded-lg my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-tactical-border">
                    <div>
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest">Mes listes</h2>
                        <p className="text-xs text-gray-500">
                            Enregistrées dans ce navigateur · clic droit sur un élément pour l’y ajouter
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fermer"
                        className="px-3 py-1.5 text-lg leading-none text-gray-400 border border-tactical-border rounded hover:text-gray-200 hover:bg-tactical-hover transition-colors"
                    >
                        ×
                    </button>
                </header>

                {message && (
                    <p role="status" className="mx-4 mt-3 px-3 py-2 text-xs text-shd bg-shd/10 border border-shd/30 rounded">
                        {message}
                    </p>
                )}

                <div className="grid md:grid-cols-[16rem_1fr] gap-px bg-tactical-border/50">
                    {/* --- Colonne des listes --- */}
                    <div className="bg-tactical-panel p-3 space-y-2">
                        <div className="flex gap-1">
                            <input
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                maxLength={80}
                                placeholder="Nouvelle liste"
                                aria-label="Nom de la nouvelle liste"
                                className="flex-1 min-w-0 bg-tactical-bg border border-tactical-border rounded px-2 py-1.5 text-sm text-gray-200 focus:border-shd focus:outline-none"
                            />
                            <button
                                onClick={handleCreate}
                                disabled={!draft.trim()}
                                className="px-3 py-1.5 text-xs font-bold rounded bg-shd/20 text-shd border border-shd/40 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                +
                            </button>
                        </div>

                        {lists.length === 0 && (
                            <p className="text-xs text-gray-600 py-4 text-center">
                                Aucune liste. Créez-en une ci-dessus.
                            </p>
                        )}

                        <ul className="space-y-1">
                            {lists.map(list => (
                                <li key={list.id}>
                                    {renaming === list.id ? (
                                        <div className="flex gap-1">
                                            <input
                                                value={renameDraft}
                                                onChange={(e) => setRenameDraft(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { renameList(list.id, renameDraft); setRenaming(null) }
                                                    if (e.key === 'Escape') setRenaming(null)
                                                }}
                                                maxLength={80}
                                                aria-label={`Renommer ${list.nom}`}
                                                className="flex-1 min-w-0 bg-tactical-bg border border-shd rounded px-2 py-1 text-sm text-gray-200 focus:outline-none"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => { renameList(list.id, renameDraft); setRenaming(null) }}
                                                className="px-2 text-xs text-shd"
                                            >
                                                OK
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className={`group flex items-center gap-1 rounded border transition-colors ${
                                                active?.id === list.id
                                                    ? 'bg-shd/10 border-shd/40'
                                                    : 'border-transparent hover:bg-tactical-hover'
                                            }`}
                                        >
                                            <button
                                                onClick={() => setActiveId(list.id)}
                                                className="flex-1 min-w-0 text-left px-2 py-1.5"
                                            >
                                                <span className={`block truncate text-sm ${active?.id === list.id ? 'text-shd font-bold' : 'text-gray-300'}`}>
                                                    {list.nom}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                    {list.items.length} élément{list.items.length > 1 ? 's' : ''}
                                                </span>
                                            </button>
                                            <div className="flex items-center pr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setRenaming(list.id); setRenameDraft(list.nom) }}
                                                    aria-label={`Renommer ${list.nom}`}
                                                    className="px-1 text-xs text-gray-500 hover:text-gray-200"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    onClick={() => handleExportOne(list)}
                                                    aria-label={`Exporter ${list.nom}`}
                                                    className="px-1 text-xs text-gray-500 hover:text-gray-200"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(list.id)}
                                                    aria-label={`Supprimer ${list.nom}`}
                                                    className="px-1 text-xs text-gray-500 hover:text-red-400"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {confirmDelete === list.id && (
                                        <div className="mt-1 p-2 bg-red-500/10 border border-red-500/40 rounded text-xs">
                                            <p className="text-gray-300 mb-2">Supprimer « {list.nom} » ?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { deleteList(list.id); setConfirmDelete(null) }}
                                                    className="px-2 py-1 font-bold text-red-300 border border-red-500/50 rounded hover:bg-red-500/20"
                                                >
                                                    Supprimer
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(null)}
                                                    className="px-2 py-1 text-gray-400 border border-tactical-border rounded hover:bg-tactical-hover"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <div className="pt-2 border-t border-tactical-border/50 flex gap-2">
                            <button
                                onClick={handleExportAll}
                                disabled={lists.length === 0}
                                className="flex-1 px-2 py-1.5 text-xs uppercase tracking-wider font-bold text-gray-400 border border-tactical-border rounded hover:text-gray-200 hover:bg-tactical-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Exporter
                            </button>
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="flex-1 px-2 py-1.5 text-xs uppercase tracking-wider font-bold text-gray-400 border border-tactical-border rounded hover:text-gray-200 hover:bg-tactical-hover transition-colors"
                            >
                                Importer
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="application/json,.json"
                                onChange={handleImport}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* --- Contenu de la liste active --- */}
                    <div className="bg-tactical-panel p-3 min-h-[16rem]">
                        {!active && (
                            <p className="text-sm text-gray-600 text-center py-12">
                                Sélectionnez une liste.
                            </p>
                        )}

                        {active && entries.length === 0 && (
                            <p className="text-sm text-gray-600 text-center py-12">
                                Liste vide. Faites un clic droit sur un élément de la base pour l’ajouter.
                            </p>
                        )}

                        {active && entries.length > 0 && (
                            <ul className="space-y-1">
                                {entries.map(entry => (
                                    <li
                                        key={`${entry.category}:${entry.key}`}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded border border-tactical-border/50 hover:bg-tactical-hover transition-colors"
                                    >
                                        <span aria-hidden="true" className="shrink-0">{categoryIcon(entry.category)}</span>
                                        <button
                                            onClick={() => openItem(entry)}
                                            className="flex-1 min-w-0 text-left"
                                        >
                                            <span className="block truncate text-sm text-gray-200">
                                                {itemLabel(entry.item) || entry.nom}
                                                {!entry.item && (
                                                    <span className="ml-2 text-xs text-amber-500/80">(introuvable)</span>
                                                )}
                                            </span>
                                            <span className="text-xs text-gray-600">{categoryLabel(entry.category)}</span>
                                        </button>
                                        <button
                                            onClick={() => removeFromList(active.id, entry.category, entry.key)}
                                            aria-label={`Retirer ${itemLabel(entry.item) || entry.nom}`}
                                            className="shrink-0 px-1 text-gray-600 hover:text-red-400 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
