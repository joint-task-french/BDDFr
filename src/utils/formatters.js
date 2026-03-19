// Formatteurs et utilitaires d'affichage
// Toutes les données de référence proviennent des fichiers JSONC type
// (armes-type.jsonc, equipements-type.jsonc, attributs-type.jsonc)

// ================================================================
// Fonctions dynamiques — utilisent les données type chargées
// ================================================================

/**
 * Retourne le label d'un type d'arme depuis armes_type.
 * @param {Object} armesType - Le contenu de armes-type.jsonc (clé slug → objet)
 * @param {string} key - La clé du type (ex: 'fusil_assaut')
 * @returns {string}
 */
export function getWeaponTypeLabel(armesType, key) {
  return armesType?.[key]?.nom || key || ''
}

/**
 * Retourne le label d'un emplacement d'équipement depuis equipements_type.
 * @param {Object} eqType - Le contenu de equipements-type.jsonc (clé slug → objet)
 * @param {string} key - La clé de l'emplacement (ex: 'sac_a_dos')
 * @returns {string}
 */
export function getGearSlotLabel(eqType, key) {
  return eqType?.[key]?.nom || key || ''
}

/**
 * Retourne l'emoji d'un emplacement d'équipement depuis equipements_type.
 * @param {Object} eqType - Le contenu de equipements-type.jsonc
 * @param {string} key - La clé de l'emplacement
 * @returns {string}
 */
export function getGearSlotEmoji(eqType, key) {
  return eqType?.[key]?.emoji || ''
}

/**
 * Retourne le label d'une catégorie d'attribut depuis attributs_type.
 * Gère les variantes avec/sans accent (défensif → defensif).
 * @param {Object} attrType - Le contenu de attributs-type.jsonc (clé slug → objet)
 * @param {string} key - La clé de la catégorie (ex: 'offensif', 'défensif' ou 'defensif')
 * @returns {string}
 */
export function getAttrCategoryLabel(attrType, key) {
  if (!key) return ''
  if (attrType?.[key]) return attrType[key].nom
  // Fallback: normaliser la clé (retirer accents)
  const normalized = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (attrType?.[normalized]) return attrType[normalized].nom
  return key
}

/**
 * Retourne la liste ordonnée des slugs des types d'armes (entries [slug, obj]).
 * @param {Object} armesType
 * @returns {Array<[string, Object]>}
 */
export function getWeaponTypeEntries(armesType) {
  if (!armesType) return []
  return Object.entries(armesType)
}

/**
 * Construit les labels type d'arme sous forme { slug: nom }.
 * @param {Object} armesType
 * @returns {Object}
 */
export function buildWeaponTypeLabels(armesType) {
  if (!armesType) return {}
  const labels = {}
  for (const [key, val] of Object.entries(armesType)) {
    labels[key] = val.nom
  }
  return labels
}

/**
 * Construit les labels emplacements d'équipement sous forme { slug: nom }.
 * @param {Object} eqType
 * @returns {Object}
 */
export function buildGearSlotLabels(eqType) {
  if (!eqType) return {}
  const labels = {}
  for (const [key, val] of Object.entries(eqType)) {
    labels[key] = val.nom
  }
  return labels
}

/**
 * Construit les labels catégories d'attributs sous forme { slug: nom }.
 * @param {Object} attrType
 * @returns {Object}
 */
export function buildAttrCategoryLabels(attrType) {
  if (!attrType) return {}
  const labels = {}
  for (const [key, val] of Object.entries(attrType)) {
    labels[key] = val.nom
  }
  return labels
}

/**
 * Retourne les slugs des types d'armes classiques (principale).
 * Exclut pistolet (secondaire) et arme_specifique (specifique).
 * @param {Object} armesType
 * @returns {string[]}
 */
export function getClassicWeaponTypes(armesType) {
  if (!armesType) return []
  return Object.entries(armesType)
    .filter(([, val]) => val.type === 'principale')
    .map(([key]) => key)
}

/**
 * Retourne la liste ordonnée des slugs d'emplacements d'équipement.
 * @param {Object} eqType
 * @returns {string[]}
 */
export function getGearSlots(eqType) {
  if (!eqType) return []
  return Object.keys(eqType)
}

/**
 * Construit les emojis emplacements d'équipement sous forme { slug: emoji }.
 * @param {Object} eqType
 * @returns {Object}
 */
export function buildGearSlotEmojis(eqType) {
  if (!eqType) return {}
  const emojis = {}
  for (const [key, val] of Object.entries(eqType)) {
    emojis[key] = val.emoji || ''
  }
  return emojis
}

/**
 * Retourne le nom de l'attribut principal d'un type d'arme.
 * Le premier attribut essentiel du type est l'attribut principal non modifiable.
 * @param {Object} armesType - Le contenu de armes-type.jsonc
 * @param {string} typeKey - Le slug du type d'arme
 * @param {Array} allAttributs - Le référentiel des attributs
 * @returns {string|null} Nom de l'attribut principal ou null
 */
export function getWeaponMainAttributeName(armesType, typeKey, allAttributs) {
  if (!armesType || !typeKey || !allAttributs) return null
  const typeData = armesType[typeKey]
  if (!typeData?.attributs_essentiels?.length) return null
  const mainSlug = typeData.attributs_essentiels[0]
  const attr = allAttributs.find(a => a.slug === mainSlug)
  return attr?.nom || null
}

/**
 * Retourne tous les attributs essentiels résolus d'un type d'arme.
 * Chaque attribut est enrichi avec les données du référentiel (nom, min, max, unité, catégorie).
 * @param {Object} armesType - Le contenu de armes-type.jsonc
 * @param {string} typeKey - Le slug du type d'arme (ex: 'fusil_assaut')
 * @param {Array} allAttributs - Le référentiel des attributs (tableau avec slug)
 * @param {Array} essentials - Attributs spéciaux de l'arme (écrase les attributs_essentiels du type)
 * @returns {Array<Object>} [{slug, nom, min, max, unite, categorie}, ...]
 */
export function getWeaponEssentialAttributes(armesType, typeKey, allAttributs, essentials) {
  if (!armesType || !typeKey || !allAttributs) return []
  if (essentials && essentials.length > 0) {
    const weaponEssentialsAttributs = essentials.map(essential => {
      const attr = allAttributs.find(a => a.slug === essential.nom)
      if (!attr) return null
      return { slug: essential.nom, nom: attr.nom, min: attr.min, max: attr.max, unite: attr.unite, categorie: attr.categorie, value: essential.valeur }
    })
    return weaponEssentialsAttributs.filter(Boolean)
  }
  const typeData = armesType[typeKey]
  if (!typeData?.attributs_essentiels?.length) return []
  return typeData.attributs_essentiels
    .map(slug => {
      const attr = allAttributs.find(a => a.slug === slug)
      if (!attr) return null
      return { slug, nom: attr.nom, min: attr.min, max: attr.max, unite: attr.unite, categorie: attr.categorie }
    })
    .filter(Boolean)
}

/**
 * Formate un nombre en français (séparateur de milliers).
 */
export function formatNumber(n) {
  if (!n) return 0
  return Number(n).toLocaleString('fr-FR')
}

/**
 * Calcule les dégâts maximum d'une arme en appliquant les bonus.
 */
export function calculateMaxDamage(n) {
  if (!n || n === 0) return 0
  // TODO : récupérer ces valeurs depuis la base de données si possible
  const gearWeaponMaxPercent = 90
  const shdWeaponMaxPercent = 10
  const expWeaponMaxPercent = 30
  const weaponTypeMaxPercent = 15
  const specialisationMaxPercent = 15

  const maxPercent = gearWeaponMaxPercent + shdWeaponMaxPercent + expWeaponMaxPercent + weaponTypeMaxPercent + specialisationMaxPercent
  const max = Math.round(n * (maxPercent / 100))
  return (max > 0 ? max : 0) + n
}

// ================================================================
// Spécialisations — depuis class-spe.jsonc
// ================================================================

export function buildSpecialisations(classSpeData) {
  if (!classSpeData || !Array.isArray(classSpeData)) return {}
  const map = {}
  for (const spec of classSpeData) {
    map[spec.cle] = { label: spec.nom, arme: spec.arme?.nom || '', icon: spec.icon || '🎖️' }
  }
  return map
}

let _speCache = null
export function getSpecialisations(classSpeData) {
  if (classSpeData) _speCache = buildSpecialisations(classSpeData)
  return _speCache || {}
}

export function getSpecFromWeapon(weaponName, classSpeData) {
  if (!weaponName) return null
  const name = weaponName.toUpperCase()
  const specs = classSpeData ? buildSpecialisations(classSpeData) : (_speCache || {})
  for (const [key, spec] of Object.entries(specs)) {
    if (name.includes(spec.arme.toUpperCase()) || spec.arme.toUpperCase().includes(name)) return key
  }
  return null
}

// ================================================================
// Formatage
// ================================================================

export function formatText(text) {
  if (!text || text === '-' || text === 'n/a') return null
  return text.replace(/\.(?=[a-zA-Zà-ÿÀ-ß+])/g, '.\n')
}

