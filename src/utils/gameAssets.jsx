/**
 * Mapping centralisé des assets visuels du jeu.
 *
 * Icônes de types d'armes, d'équipement et d'attributs : imports statiques (fixe, peu nombreux).
 * Icônes de talents, compétences et marques : import.meta.glob dynamique (auto-découverte).
 *
 * Pour ajouter un nouvel asset talent/compétence/marque :
 *   1. Déposer le fichier .png dans le bon dossier sous src/img/game_assets/
 *   2. Renseigner le champ "icon" dans le JSONC correspondant avec le nom du fichier (sans .png)
 *   → L'icône sera automatiquement disponible, aucun code à modifier.
 */

// ================================================================
// ICÔNES TYPE D'ARME (fixes, peu nombreux)
// ================================================================
import arme_fusil_assaut from '../img/game_assets/armes/fusil_assaut.png'
import arme_fusil from '../img/game_assets/armes/fusil.png'
import arme_sniper from '../img/game_assets/armes/sniper.png'
import arme_pistolet_mitrailleur from '../img/game_assets/armes/pistolet_mitrailleur.png'
import arme_lmg from '../img/game_assets/armes/fusil_mitrailleur.png'
import arme_calibre12 from '../img/game_assets/armes/calibre12.png'
import arme_pistolet from '../img/game_assets/armes/pistolet.png'

export const WEAPON_TYPE_ICONS = {
  fusil_assaut: arme_fusil_assaut,
  fusil: arme_fusil,
  fusil_precision: arme_sniper,
  pistolet_mitrailleur: arme_pistolet_mitrailleur,
  fusil_mitrailleur: arme_lmg,
  calibre_12: arme_calibre12,
  pistolet: arme_pistolet,
}

// ================================================================
// ICÔNES TYPE D'ÉQUIPEMENT (fixes, peu nombreux)
// ================================================================
import equip_masque from '../img/game_assets/equipements/masque.png'
import equip_torse from '../img/game_assets/equipements/torse.png'
import equip_holster from '../img/game_assets/equipements/holster.png'
import equip_sac from '../img/game_assets/equipements/sac.png'
import equip_gants from '../img/game_assets/equipements/gants.png'
import equip_genouilleres from '../img/game_assets/equipements/genouilleres.png'

export const GEAR_SLOT_ICONS_IMG = {
  masque: equip_masque,
  torse: equip_torse,
  holster: equip_holster,
  sac_a_dos: equip_sac,
  gants: equip_gants,
  genouilleres: equip_genouilleres,
}

// ================================================================
// ICÔNES ATTRIBUTS (offensif / défensif / compétences)
// ================================================================
import attr_offensif from '../img/game_assets/equipements/attribute/offensif.png'
import attr_defensif from '../img/game_assets/equipements/attribute/defensif.png'
import attr_competences from '../img/game_assets/equipements/attribute/utilitaire.png'

export const ATTRIBUTE_ICONS = {
  offensif: attr_offensif,
  degats: attr_offensif,
  'défensif': attr_defensif,
  defensif: attr_defensif,
  protection: attr_defensif,
  utilitaire: attr_competences,
  competences: attr_competences,
}

/**
 * Résout l'icône d'attribut à partir d'un texte (enum ou texte libre).
 */
export function resolveAttributeIcon(text) {
  if (!text) return null
  // Match direct par enum
  const direct = ATTRIBUTE_ICONS[text]
  if (direct) return direct
  // Fallback texte libre
  const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (t.includes('degat') || t.includes('offensi') || t.includes('critique') || t.includes('headshot') || t.includes('arme')) {
    return attr_offensif
  }
  if (t.includes('protect') || t.includes('armure') || t.includes('defensi') || t.includes('vie') || t.includes('sante')) {
    return attr_defensif
  }
  if (t.includes('competence') || t.includes('hate') || t.includes('reparation') || t.includes('utilitaire')) {
    return attr_competences
  }
  return null
}

// ================================================================
// CHARGEMENT DYNAMIQUE — import.meta.glob (eager)
// Scanne automatiquement les dossiers et indexe par nom de fichier.
// Pour ajouter une icône : déposer le .png dans le dossier, c'est tout.
// ================================================================

/**
 * Construit un index slug → URL à partir d'un glob Vite.
 * Le slug est le nom de fichier sans extension ni chemin.
 */
function buildIndex(globResult) {
  const index = {}
  for (const [path, mod] of Object.entries(globResult)) {
    // path ex: "../img/game_assets/talents/arme/killer.png"
    const slug = path.split('/').pop().replace(/\.\w+$/, '')
    index[slug] = mod.default
  }
  return index
}

// Talents d'armes (classiques + exotiques)
const _talentsArmeGlob = import.meta.glob('../img/game_assets/talents/arme/**/*.png', { eager: true })
export const WEAPON_TALENT_ICONS = buildIndex(_talentsArmeGlob)

// Talents d'équipements (torse + sac)
const _talentsEquipGlob = import.meta.glob('../img/game_assets/talents/equipements/**/*.png', { eager: true })
export const GEAR_TALENT_ICONS = buildIndex(_talentsEquipGlob)

// Compétences
const _competencesGlob = import.meta.glob('../img/game_assets/competences/**/*.png', { eager: true })
export const SKILL_ICONS = buildIndex(_competencesGlob)

// Marques / Ensembles
const _marquesGlob = import.meta.glob('../img/game_assets/marques/**/*.png', { eager: true })
export const BRAND_ICONS = buildIndex(_marquesGlob)

// Icônes d'armes spécifiques (exotiques, spé, etc.)
const _armesGlob = import.meta.glob('../img/game_assets/armes/**/*.png', { eager: true })
export const WEAPON_ICONS = buildIndex(_armesGlob)

/**
 * Résout l'icône d'un talent/compétence/marque/arme par son slug.
 * Cherche dans tous les index disponibles.
 */
export function resolveIcon(slug) {
  if (!slug) return null
  return WEAPON_ICONS[slug]
    || WEAPON_TALENT_ICONS[slug]
    || GEAR_TALENT_ICONS[slug]
    || SKILL_ICONS[slug]
    || BRAND_ICONS[slug]
    || null
}

/**
 * Composant image réutilisable avec fallback transparent si l'image n'est pas trouvée.
 */
export function GameIcon({ src, alt = '', size = 'w-5 h-5', className = '' }) {
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`${size} object-contain shrink-0 ${className}`}
      onError={(e) => { e.target.style.display = 'none' }}
    />
  )
}
