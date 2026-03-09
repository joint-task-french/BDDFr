/**
 * Utilitaires pour la gestion des compétences.
 * Convertit la structure groupée (par type) en tableau plat enrichi.
 */

/**
 * Aplatit le tableau groupé de compétences en tableau plat.
 * Chaque variante est enrichie avec les infos du parent (emplacementsMods, competence).
 *
 * @param {Array} grouped - Structure groupée [{competence, variantes: [...], emplacementsMods: [...]}]
 * @returns {Array} Tableau plat [{competence, variante, emplacementsMods, prerequis?, ...}]
 */
export function flattenCompetences(grouped) {
  if (!Array.isArray(grouped)) return []
  const flat = []
  for (const comp of grouped) {
    if (!comp.variantes) continue
    for (const v of comp.variantes) {
      flat.push({
        ...v,
        competence: comp.competence,
        competenceSlug: comp.slug,
        notesType: comp.notes,
        emplacementsMods: comp.emplacementsMods || [],
      })
    }
  }
  return flat
}


