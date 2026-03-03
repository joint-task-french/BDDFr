/**
 * Génère un slug à partir d'un nom.
 * Lowercase, sans accents, espaces/caractères spéciaux → underscore, pas de _ en début/fin.
 *
 * @param {string} name
 * @returns {string}
 */
export function slugify(name) {
  if (!name) return ''
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

