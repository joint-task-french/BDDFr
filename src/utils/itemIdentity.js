/**
 * Identite stable d'un item de la base, pour le comparateur et les listes.
 *
 * Le slug suffit dans la plupart des categories, avec deux exceptions :
 *  - `competences` est un tableau APLATI de variantes (cf. flattenCompetences) :
 *    deux competences differentes peuvent avoir une variante de meme slug, il
 *    faut donc y adjoindre le slug de la competence parente ;
 *  - `descente` est une vue synthetique agregeant des talents d'armes,
 *    d'equipements et « autres » : la resolution doit rechercher dans ces trois
 *    sources.
 */
import { slugify } from './slugify'

/** Identifiant d'un item au sein de sa categorie. */
export function itemKey(category, item) {
  if (!item) return null
  const slug = item.slug || (item.nom ? slugify(item.nom) : null)
  if (!slug) return null
  if (category === 'competences' && item.competenceSlug) {
    return `${item.competenceSlug}:${slug}`
  }
  return slug
}

/**
 * Libelle lisible d'un item.
 * Les variantes de competences n'ont pas de champ `nom` : elles portent
 * `competence` + `variante`. Sans ce repli, listes et comparateur affichaient
 * un slug brut.
 */
export function itemLabel(item) {
  if (!item) return ''
  if (item.nom) return item.nom
  if (item.competence && item.variante) return `${item.competence} — ${item.variante}`
  return item.variante || item.slug || ''
}

/** Identifiant global, categorie comprise. */
export function itemRef(category, item) {
  const key = itemKey(category, item)
  return key ? `${category}::${key}` : null
}

/** Sources agregees par la vue Descente. */
function descenteItems(data) {
  const sources = [
    [data?.talentsArmes, true],
    [data?.talentsEquipements, false],
    [data?.talentsAutres, false],
  ]
  const out = []
  for (const [source, isWeaponTalent] of sources) {
    if (!source) continue
    for (const talent of Object.values(source)) {
      if (talent?.descente) out.push({ ...talent, isWeaponTalent })
    }
  }
  return out
}

/** Tous les items d'une categorie, sous forme de tableau. */
export function categoryItems(data, category) {
  if (!data) return []
  if (category === 'descente') return descenteItems(data)
  const raw = data[category]
  if (!raw) return []
  return Array.isArray(raw) ? raw : Object.values(raw)
}

/**
 * Retrouve un item a partir de sa reference stockee.
 * Renvoie `null` si l'item n'existe plus — un slug supprime ou renomme ne doit
 * pas casser une liste, seulement disparaitre de l'affichage.
 */
export function resolveItem(data, category, key) {
  if (!data || !category || !key) return null
  return categoryItems(data, category).find(item => itemKey(category, item) === key) || null
}
