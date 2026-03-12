/**
 * Utilitaires de compatibilité des mods.
 * Toutes les vérifications utilisent les données structurées des fichiers JSONC.
 */

/**
 * Vérifie si un mod d'arme est compatible avec un type d'arme donné.
 * @param {Object} mod - Le mod (avec champ compatible: string[])
 * @param {string} weaponType - Le slug du type d'arme (ex: 'fusil_assaut')
 * @returns {boolean}
 */
export function isWeaponModCompatible(mod, weaponType) {
  if (!mod || !weaponType) return false
  // compatible vide = universel pour ce type de mod
  if (!mod.compatible || mod.compatible.length === 0) return true
  return mod.compatible.includes(weaponType)
}

/**
 * Vérifie si un mod d'équipement est compatible avec un slot d'équipement.
 * Tous les mods d'équipement sont compatibles avec tout slot ayant mod=true.
 * @param {Object} mod - Le mod d'équipement
 * @param {Object} piece - La pièce d'équipement (avec champ mod: boolean)
 * @returns {boolean}
 */
export function isGearModCompatible(mod, piece) {
  if (!mod || !piece) return false
  return piece.mod === true
}

/**
 * Vérifie si un mod de compétence est compatible avec une compétence donnée.
 * @param {Object} mod - Le mod de compétence (avec champ compatible: string[])
 * @param {Object} skill - La compétence (avec champ competenceSlug ou competence)
 * @returns {boolean}
 */
export function isSkillModCompatible(mod, skill) {
  if (!mod || !skill) return false
  if (!mod.compatible || mod.compatible.length === 0) return true
  const skillId = (skill.competenceSlug || skill.competence || '').toLowerCase()
  return mod.compatible.some(c => c.toLowerCase() === skillId)
}

/**
 * Vérifie si un mod est autorisé par la spécialisation active.
 * @param {Object} mod - Le mod (avec champ optionnel prerequis: string)
 * @param {string|null} currentSpec - La clé de spécialisation active
 * @returns {boolean}
 */
export function isModAllowedBySpec(mod, currentSpec) {
  if (!mod?.prerequis) return true
  return mod.prerequis === currentSpec
}

/**
 * Formatte les attributs d'un mod pour l'affichage.
 * Lit le tableau `mod.attributs` et résout chaque slug vers le nom affiché.
 * Cherche d'abord dans attributs, puis dans statistiques.
 * @param {Object} mod - Le mod avec attributs[] et optionnellement bonus (texte)
 * @param {Array} allAttributs - Référentiel des attributs
 * @param {Array} [statistiques] - Référentiel des statistiques (optionnel)
 * @returns {string}
 */
export function formatModAttributs(mod, allAttributs, statistiques) {
  if (!mod) return ''
  const parts = []
  if (mod.attributs && Array.isArray(mod.attributs)) {
    for (const entry of mod.attributs) {
      const attrDef = allAttributs?.find(a => a.slug === entry.attribut)
      const statDef = !attrDef && statistiques ? statistiques.find(s => s.slug === entry.attribut) : null
      const name = attrDef?.nom || statDef?.nom || resolveModAttrName(entry.attribut, allAttributs, statistiques)
      const unite = attrDef?.unite || ''
      const sign = entry.valeur >= 0 ? '+' : ''
      if (unite === 'pts' || unite === 'pts/s') {
        parts.push(`${sign}${entry.valeur} ${name}`)
      } else {
        parts.push(`${sign}${entry.valeur}${unite} ${name}`)
      }
    }
  }
  if (mod.bonus && typeof mod.bonus === 'string') {
    parts.push(mod.bonus)
  }
  return parts.join('\n')
}

/**
 * Formatte un objet bonus/malus legacy (rétrocompatibilité).
 * @deprecated Utiliser formatModAttributs à la place
 */
export function formatModBonus(bonusOrMalus, allAttributs, isMalus = false) {
  if (!bonusOrMalus) return ''
  // Nouveau format: c'est un mod complet avec attributs[]
  if (bonusOrMalus.attributs && Array.isArray(bonusOrMalus.attributs)) {
    return formatModAttributs(bonusOrMalus, allAttributs)
  }
  // Texte libre
  if (typeof bonusOrMalus === 'string') return bonusOrMalus
  if (bonusOrMalus.description) return bonusOrMalus.description
  // Legacy format: { attribut, valeur, unite }
  const sign = isMalus ? '-' : '+'
  const attrName = resolveModAttrName(bonusOrMalus.attribut, allAttributs)
  const val = bonusOrMalus.valeur
  const unite = bonusOrMalus.unite || ''
  if (unite === 'pts') return `${sign}${val} ${attrName}`
  return `${sign}${val}${unite} ${attrName}`
}

/**
 * Résout un slug d'attribut de mod vers un nom affichable.
 * Cherche dans attributs puis dans statistiques.
 * @param {string} slug - Le slug (ex: 'stabilite_arm', 'duree_competence')
 * @param {Array} allAttributs - Référentiel des attributs
 * @param {Array} [statistiques] - Référentiel des statistiques
 * @returns {string}
 */
export function resolveModAttrName(slug, allAttributs, statistiques) {
  if (!slug) return ''
  if (allAttributs) {
    const attr = allAttributs.find(a => a.slug === slug)
    if (attr) return attr.nom
  }
  if (statistiques) {
    const stat = statistiques.find(s => s.slug === slug)
    if (stat) return stat.nom
  }
  // Fallback: humaniser le slug
  return slug.replace(/_arm$|_eqp$|_mod$/, '').replace(/_/g, ' ')
}


