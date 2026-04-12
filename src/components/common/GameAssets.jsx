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
import arme_fusil_assaut from '../../img/game_assets/armes/fusil_assaut.png'
import arme_fusil from '../../img/game_assets/armes/fusil.png'
import arme_sniper from '../../img/game_assets/armes/sniper.png'
import arme_pistolet_mitrailleur from '../../img/game_assets/armes/pistolet_mitrailleur.png'
import arme_lmg from '../../img/game_assets/armes/fusil_mitrailleur.png'
import arme_calibre12 from '../../img/game_assets/armes/calibre12.png'
import arme_pistolet from '../../img/game_assets/armes/pistolet.png'

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
import equip_masque from '../../img/game_assets/equipements-type/masque.png'
import equip_torse from '../../img/game_assets/equipements-type/torse.png'
import equip_holster from '../../img/game_assets/equipements-type/holster.png'
import equip_sac from '../../img/game_assets/equipements-type/sac.png'
import equip_gants from '../../img/game_assets/equipements-type/gants.png'
import equip_genouilleres from '../../img/game_assets/equipements-type/genouilleres.png'

export const GEAR_SLOT_ICONS_IMG = {
  masque: equip_masque,
  torse: equip_torse,
  holster: equip_holster,
  sac_a_dos: equip_sac,
  gants: equip_gants,
  genouilleres: equip_genouilleres,
}

// ================================================================
// RÉSOLUTION D'ICÔNES D'ATTRIBUTS
// ================================================================

/**
 * Détermine le slug d'asset pour un attribut à partir de ses propriétés.
 *
 * Règles :
 *  - Attribut essentiel        → "essentiel_{categorie}"  (ex: essentiel_offensif)
 *  - Attribut mod               → "mod_{categorie}"       (ex: mod_utilitaire)
 *  - Attribut classique         → "attribut_{categorie}"  (ex: attribut_defensif)
 *
 * @param {{ categorie?: string, estEssentiel?: boolean, estMod?: boolean }} attr
 * @returns {string|null} slug utilisable avec resolveAsset()
 */
export function resolveAttribut(attr) {
  if (!attr) return null
  const cat = attr.categorie
  if (!cat) return null
  const normalizedCat = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  // Cas spécial pour l'icône random
  if (normalizedCat === 'random') return 'random'

  if (attr.estEssentiel) return `essentiel_${normalizedCat}`
  if (attr.estMod) return `mod_${normalizedCat}`
  return `attribut_${normalizedCat}`
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
const _allAssets = import.meta.glob('../../img/**/*.{png,jpg,jpeg,webp,svg}', { eager: true })
export const ALL_ASSETS = buildIndex(_allAssets)

/**
 * Résout l'icône d'un talent/compétence/marque/arme par son slug.
 * Cherche dans tous les index disponibles.
 */
export function resolveAsset(slug) {
  if (!slug) return null
  return ALL_ASSETS[slug] || null
}

/**
 * Composant image réutilisable avec fallback transparent si l'image n'est pas trouvée.
 *
 * @param {string}  src        — URL de l'image
 * @param {string}  [alt]      — texte alternatif
 * @param {string}  [size]     — classes Tailwind de taille (ex: 'w-5 h-5')
 * @param {string}  [className] — classes CSS supplémentaires
 * @param {string}  [color]    — filtre de couleur appliqué à l'icône :
 *                                 • classe Tailwind (ex: 'text-red-500', 'text-amber-300')
 *                                 • couleur hex arbitraire (ex: '#ff6600', '#fff')
 *                                Utilise CSS mask-image : l'image sert de masque,
 *                                la couleur remplit la forme visible.
 */
export function GameIcon({ src, alt = '', size = 'w-5 h-5', className = '', color }) {
  if (!src) return null

  if (color) {
    const isHex = color.startsWith('#')
    // Classe Tailwind : on convertit text-* en bg-* pour le background
    const colorClass = !isHex ? color.replace(/^text-/, 'bg-') : ''

    return (
        <span
            role="img"
            aria-label={alt}
            className={`${size} shrink-0 inline-block ${colorClass} ${className}`}
            style={{
              maskImage: `url(${src})`,
              WebkitMaskImage: `url(${src})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              ...(isHex ? { backgroundColor: color } : {}),
            }}
        />
    )
  }

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