import { createContext, useContext } from 'react'

/**
 * Contexte et hook de la collection, isoles du composant Provider.
 *
 * Un fichier qui exporte a la fois un composant et un contexte casse le Fast
 * Refresh : a chaque modification, le module est reexecute et `createContext`
 * cree un NOUVEL objet, tandis que les composants deja montes lisent encore
 * l'ancien. `useContext` renvoie alors `null` et l'application plante sur
 * « useCollection doit être utilisé dans un CollectionProvider », alors que
 * l'arbre est parfaitement correct.
 *
 * Garder le contexte dans un module sans composant supprime le probleme.
 */
export const CollectionContext = createContext(null)

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection doit être utilisé dans un CollectionProvider')
  return ctx
}
