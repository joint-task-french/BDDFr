/**
 * Utilitaires de compatibilité des mods.
 * Toutes les vérifications utilisent les données structurées des fichiers JSONC.
 */

/**
 * Vérifie si un mod d'arme est compatible avec une arme donnée.
 * @param {Object} mod - Le mod (avec champ compatible contenant les slugs d'emplacements)
 * @param {Object} weapon - L'objet arme complet (avec l'objet emplacementsMods)
 * @returns {boolean}
 */
export function isWeaponModCompatible(mod, weapon) {
  if (!mod || !weapon || !weapon.emplacementsMods) return false

  // compatible vide = universel pour ce type de mod (ex: s'adapte à tous les viseurs)
  if (!mod.compatible || mod.compatible.length === 0) return true

  // Extraction des valeurs de l'objet emplacementsMods (ex: ["rail_optique", "emplacement_bouche_556", ...])
  // Compatible si l'arme possède au moins un emplacement requis par le mod
  const weaponSlots = Object.values(weapon.emplacementsMods).filter(Boolean)
  return mod.compatible.some(slotType => weaponSlots.includes(slotType))
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
      const attrDef = (allAttributs && !Array.isArray(allAttributs)) ? allAttributs[entry.attribut] : allAttributs?.find(a => a.slug === entry.attribut)
      const statDef = !attrDef && statistiques ? ((!Array.isArray(statistiques)) ? statistiques[entry.attribut] : statistiques.find(s => s.slug === entry.attribut)) : null
      const name = attrDef?.nom || statDef?.nom || resolveModAttrName(entry.attribut, allAttributs, statistiques)
      const unite = attrDef?.unite || ''
      if (entry.valeur != null) {
        // Valeur fixe définie sur le mod
        const sign = entry.valeur >= 0 ? '+' : ''
        if (unite === 'pts' || unite === 'pts/s') {
          parts.push(`${sign}${entry.valeur} de ${name}`)
        } else {
          parts.push(`${sign}${entry.valeur}${unite} de ${name}`)
        }
      } else if (attrDef && attrDef.min != null && attrDef.max != null) {
        // Pas de valeur fixe → afficher la range min–max de l'attribut
        if (unite === 'pts' || unite === 'pts/s') {
          parts.push(`+${attrDef.min} à ${attrDef.max} de ${name}`)
        } else {
          parts.push(`+${attrDef.min} à ${attrDef.max}${unite} de ${name}`)
        }
      } else if (attrDef && attrDef.max != null) {
        // Seulement un max connu
        const sign = attrDef.max >= 0 ? '+' : ''
        if (unite === 'pts' || unite === 'pts/s') {
          parts.push(`${sign}${attrDef.max} de ${name}`)
        } else {
          parts.push(`${sign}${attrDef.max}${unite} de ${name}`)
        }
      } else {
        // Aucune info de valeur
        parts.push(name)
      }
    }
  }
  if (mod.bonus && typeof mod.bonus === 'string') {
    parts.push(mod.bonus)
  }
  return parts.join('\n')
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
    const attr = (!Array.isArray(allAttributs)) ? allAttributs[slug] : allAttributs.find(a => a.slug === slug)
    if (attr) return attr.nom
  }
  if (statistiques) {
    const stat = (!Array.isArray(statistiques)) ? statistiques[slug] : statistiques.find(s => s.slug === slug)
    if (stat) return stat.nom
  }
  // Fallback: humaniser le slug
  return slug.replace(/_arm$|_eqp$|_mod$/, '').replace(/_/g, ' ')
}