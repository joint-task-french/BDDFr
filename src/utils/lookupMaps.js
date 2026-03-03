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

  const buildMap = (items, slugField = 'slug') => {
    const map = new Map()
    if (!Array.isArray(items)) return map
    for (const item of items) {
      if (item[slugField]) map.set(item[slugField], item)
    }
    return map
  }

  maps.armes = buildMap(data.armes || [])
  maps.equipements = buildMap(data.equipements || [])
  maps.attributs = buildMap(data.attributs || [])
  maps.talentsArmes = buildMap(data.talentsArmes || [])
  maps.talentsEquipements = buildMap(data.talentsEquipements || [])
  maps.ensembles = buildMap(data.ensembles || [])
  maps.modsArmes = buildMap(data.modsArmes || [])
  maps.modsEquipements = buildMap(data.modsEquipements || [])
  maps.modsCompetences = buildMap(data.modsCompetences || [])

  // Competences flat (slug variante → objet)
  maps.competences = buildMap(data.competences || [])

  // Class spe (cle → objet)
  const speMap = new Map()
  for (const spec of (data.classSpe || [])) {
    speMap.set(spec.cle, spec)
    if (spec.slug) speMap.set(spec.slug, spec)
  }
  maps.classSpe = speMap

  return maps
}

/**
 * Résout un slug vers le nom affiché.
 * @param {Map} map - La map de lookup pour la catégorie
 * @param {string} slug - Le slug à résoudre
 * @param {string} [nameField='nom'] - Le champ nom à retourner
 * @returns {string} Le nom affiché ou le slug si non trouvé
 */
export function resolveSlug(map, slug, nameField = 'nom') {
  if (!map || !slug) return slug || ''
  const item = map.get(slug)
  return item ? (item[nameField] || slug) : slug
}

