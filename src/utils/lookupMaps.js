/**
 * Construit des maps de résolution slug → objet pour chaque catégorie de données.
 * Utilisé pour résoudre les références croisées (slug → nom pour l'affichage).
 */

/**
 * @param {Object} data - L'objet data retourné par useDataLoader
 * @returns {Object} Maps de résolution { armes: Map, equipements: Map, ... }
 */
export function buildLookupMaps(data) {
  const maps = {}

  // Les données sont maintenant des objets indexés par slug (clé/valeur)
  // On les garde tels quels pour les lookups ultra-rapides
  maps.armes = data.armes || {}
  maps.equipements = data.equipements || {}
  maps.attributs = data.attributs || {}
  maps.talentsArmes = data.talentsArmes || {}
  maps.talentsEquipements = data.talentsEquipements || {}
  maps.ensembles = data.ensembles || {}
  maps.modsArmes = data.modsArmes || {}
  maps.modsEquipements = data.modsEquipements || {}
  maps.modsCompetences = data.modsCompetences || {}
  maps.statistiques = data.statistiques || {}

  // Competences flat reste un tableau transformé en objet pour le lookup
  const compMap = {}
  if (Array.isArray(data.competences)) {
    data.competences.forEach(c => {
      if (c.slug) compMap[c.slug] = c
    })
  }
  maps.competences = compMap

  // Class spe (clé et slug comme entrées)
  const speMap = {}
  if (data.classSpe) {
    Object.values(data.classSpe).forEach(spec => {
      if (spec.cle) speMap[spec.cle] = spec
      if (spec.slug) speMap[spec.slug] = spec
    })
  }
  maps.classSpe = speMap

  return maps
}

/**
 * Résout un slug vers le nom affiché.
 * @param {Object} map - L'objet de lookup pour la catégorie
 * @param {string} slug - Le slug à résoudre
 * @param {string} [nameField='nom'] - Le champ nom à retourner
 * @returns {string} Le nom affiché ou le slug si non trouvé
 */
export function resolveSlug(map, slug, nameField = 'nom') {
  if (!map || !slug) return slug || ''
  const item = map[slug]
  return item ? (item[nameField] || slug) : slug
}

