import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CollectionContext } from './collectionStore'
import { itemKey, itemLabel, resolveItem } from '../utils/itemIdentity'
import { COMPARISON_MAX, comparisonGroupKey, comparisonGroupLabel, isComparable } from '../config/comparisonConfig'

/**
 * Etat partage de la base de donnees : listes personnelles et selection de
 * comparaison.
 *
 * - Les listes sont persistees dans le localStorage (aucun compte requis) et
 *   exportables en JSON.
 * - La selection du comparateur vit en sessionStorage : elle doit survivre a
 *   une navigation entre pages, mais pas devenir un etat permanent.
 */

const LISTS_KEY = 'bddfr_listes'
const COMPARE_KEY = 'bddfr_comparaison'

// --- Persistance tolerante --------------------------------------------------

function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    // Navigation privee, quota, donnees corrompues : on repart proprement.
    return fallback
  }
}

function writeJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Sauvegarde impossible', e)
  }
}

function newId() {
  return `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Valide et normalise des listes venant du stockage ou d'un import. */
function normalizeLists(raw) {
  const source = Array.isArray(raw) ? raw : raw?.listes
  if (!Array.isArray(source)) return []

  return source
    .filter(l => l && typeof l.nom === 'string')
    .map(l => ({
      id: typeof l.id === 'string' ? l.id : newId(),
      nom: l.nom.slice(0, 80),
      createdAt: Number(l.createdAt) || Date.now(),
      updatedAt: Number(l.updatedAt) || Date.now(),
      items: Array.isArray(l.items)
        ? l.items
            .filter(i => i && typeof i.category === 'string' && typeof i.key === 'string')
            .map(i => ({ category: i.category, key: i.key, nom: typeof i.nom === 'string' ? i.nom : '' }))
        : [],
    }))
}

export function CollectionProvider({ data, children }) {
  const [lists, setLists] = useState(() => normalizeLists(readJSON(localStorage, LISTS_KEY, [])))
  const [selection, setSelection] = useState(() => {
    const stored = readJSON(sessionStorage, COMPARE_KEY, null)
    if (!stored || !Array.isArray(stored.items)) return { category: null, groupKey: null, items: [] }
    return stored
  })

  useEffect(() => {
    writeJSON(localStorage, LISTS_KEY, lists)
  }, [lists])

  useEffect(() => {
    writeJSON(sessionStorage, COMPARE_KEY, selection)
  }, [selection])

  // --- Listes ---------------------------------------------------------------

  const createList = useCallback((nom) => {
    const clean = String(nom || '').trim().slice(0, 80)
    if (!clean) return null
    const list = { id: newId(), nom: clean, createdAt: Date.now(), updatedAt: Date.now(), items: [] }
    setLists(prev => [...prev, list])
    return list.id
  }, [])

  const renameList = useCallback((id, nom) => {
    const clean = String(nom || '').trim().slice(0, 80)
    if (!clean) return
    setLists(prev => prev.map(l => (l.id === id ? { ...l, nom: clean, updatedAt: Date.now() } : l)))
  }, [])

  const deleteList = useCallback((id) => {
    setLists(prev => prev.filter(l => l.id !== id))
  }, [])

  const addToList = useCallback((listId, category, item) => {
    const key = itemKey(category, item)
    if (!key) return false
    let added = false
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l
      if (l.items.some(i => i.category === category && i.key === key)) return l
      added = true
      return {
        ...l,
        updatedAt: Date.now(),
        // Le nom est mis en cache pour rester lisible si l'item disparait des
        // donnees (renommage, suppression).
        items: [...l.items, { category, key, nom: itemLabel(item) || key }],
      }
    }))
    return added
  }, [])

  const removeFromList = useCallback((listId, category, key) => {
    setLists(prev => prev.map(l => (
      l.id === listId
        ? { ...l, updatedAt: Date.now(), items: l.items.filter(i => !(i.category === category && i.key === key)) }
        : l
    )))
  }, [])

  /** Ids des listes contenant deja cet item. */
  const listsContaining = useCallback((category, item) => {
    const key = itemKey(category, item)
    if (!key) return []
    return lists.filter(l => l.items.some(i => i.category === category && i.key === key)).map(l => l.id)
  }, [lists])

  /** Items d'une liste, re-resolus contre les donnees courantes. */
  const resolveListItems = useCallback((list) => {
    if (!list) return []
    return list.items.map(entry => ({
      ...entry,
      item: resolveItem(data, entry.category, entry.key),
    }))
  }, [data])

  const importLists = useCallback((raw) => {
    const imported = normalizeLists(raw)
    if (imported.length === 0) return 0
    setLists(prev => {
      const existants = new Set(prev.map(l => l.id))
      // Un id deja present recoit un nouvel id : l'import complete, il n'ecrase
      // jamais une liste existante.
      const ajouts = imported.map(l => (existants.has(l.id) ? { ...l, id: newId() } : l))
      return [...prev, ...ajouts]
    })
    return imported.length
  }, [])

  // --- Menu contextuel ------------------------------------------------------

  const [menu, setMenu] = useState(null) // { x, y, category, item }
  const longPress = useRef(null)

  const openMenu = useCallback((event, category, item) => {
    event.preventDefault()
    event.stopPropagation()
    const source = event.touches?.[0] || event.changedTouches?.[0] || event
    setMenu({ x: source.clientX, y: source.clientY, category, item })
  }, [])

  const closeMenu = useCallback(() => setMenu(null), [])

  /**
   * Handlers a poser sur chaque item de la base.
   * Clic droit au bureau, appui long (500 ms) au tactile — un glissement du
   * doigt annule l'appui pour ne pas interrompre le defilement.
   */
  const itemMenuHandlers = useCallback((category, item) => ({
    onContextMenu: (e) => openMenu(e, category, item),
    onTouchStart: (e) => {
      const touch = e.touches?.[0]
      if (!touch) return
      const start = { x: touch.clientX, y: touch.clientY }
      longPress.current = {
        start,
        timer: setTimeout(() => {
          longPress.current = null
          setMenu({ x: start.x, y: start.y, category, item })
        }, 500),
      }
    },
    onTouchMove: (e) => {
      const touch = e.touches?.[0]
      if (!longPress.current || !touch) return
      const { start } = longPress.current
      if (Math.abs(touch.clientX - start.x) > 10 || Math.abs(touch.clientY - start.y) > 10) {
        clearTimeout(longPress.current.timer)
        longPress.current = null
      }
    },
    onTouchEnd: () => {
      if (longPress.current) {
        clearTimeout(longPress.current.timer)
        longPress.current = null
      }
    },
  }), [openMenu])

  // --- Comparateur ----------------------------------------------------------

  const comparisonItems = useMemo(() => {
    if (!selection.category) return []
    return selection.items
      .map(key => resolveItem(data, selection.category, key))
      .filter(Boolean)
  }, [selection, data])

  const isSelected = useCallback((category, item) => {
    const key = itemKey(category, item)
    return Boolean(key && selection.category === category && selection.items.includes(key))
  }, [selection])

  /**
   * L'item peut-il rejoindre la comparaison en cours ?
   * Renvoie `{ ok, reason }` — la raison sert a expliquer le refus dans le menu
   * plutot que de simplement griser une entree.
   */
  const canCompare = useCallback((category, item) => {
    if (!isComparable(category)) {
      return { ok: false, reason: 'Comparaison indisponible pour cette catégorie' }
    }
    if (!itemKey(category, item)) return { ok: false, reason: 'Élément non identifiable' }

    if (isSelected(category, item)) return { ok: true, reason: null, selected: true }

    if (selection.items.length >= COMPARISON_MAX) {
      return { ok: false, reason: `Maximum ${COMPARISON_MAX} éléments` }
    }
    if (selection.items.length > 0) {
      const key = comparisonGroupKey(category, item)
      if (key !== selection.groupKey) {
        const attendu = selection.groupLabel || 'la sélection en cours'
        return { ok: false, reason: `Comparable uniquement avec : ${attendu}` }
      }
    }
    return { ok: true, reason: null, selected: false }
  }, [selection, isSelected])

  const toggleCompare = useCallback((category, item) => {
    const key = itemKey(category, item)
    if (!key) return

    setSelection(prev => {
      // Deselection.
      if (prev.category === category && prev.items.includes(key)) {
        const items = prev.items.filter(k => k !== key)
        return items.length === 0
          ? { category: null, groupKey: null, groupLabel: null, items: [] }
          : { ...prev, items }
      }

      const groupKey = comparisonGroupKey(category, item)
      // Premier element : il fixe le groupe de compatibilite.
      if (prev.items.length === 0) {
        return {
          category,
          groupKey,
          groupLabel: comparisonGroupLabel(category, item, data),
          items: [key],
        }
      }
      if (prev.category !== category || prev.groupKey !== groupKey) return prev
      if (prev.items.length >= COMPARISON_MAX) return prev
      return { ...prev, items: [...prev.items, key] }
    })
  }, [data])

  const clearComparison = useCallback(() => {
    setSelection({ category: null, groupKey: null, groupLabel: null, items: [] })
  }, [])

  const value = useMemo(() => ({
    data,
    lists,
    createList,
    renameList,
    deleteList,
    addToList,
    removeFromList,
    listsContaining,
    resolveListItems,
    importLists,
    menu,
    openMenu,
    closeMenu,
    itemMenuHandlers,
    selection,
    comparisonItems,
    isSelected,
    canCompare,
    toggleCompare,
    clearComparison,
  }), [
    data, lists, createList, renameList, deleteList, addToList, removeFromList,
    listsContaining, resolveListItems, importLists, menu, openMenu, closeMenu,
    itemMenuHandlers, selection, comparisonItems,
    isSelected, canCompare, toggleCompare, clearComparison,
  ])

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

