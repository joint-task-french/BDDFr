/**
 * Normalise une chaîne de caractères pour faciliter la recherche :
 * - Passage en minuscules
 * - Suppression des accents (diacritiques)
 * - Suppression des espaces superflus (trim)
 * 
 * @param {string} str - La chaîne à normaliser
 * @returns {string} - La chaîne normalisée
 */
export function normalizeText(str) {
    if (!str) return '';
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/**
 * Vérifie si une chaîne contient un terme de recherche, tous deux normalisés.
 * 
 * @param {string} text - Le texte dans lequel chercher
 * @param {string} term - Le terme à chercher
 * @returns {boolean} - Vrai si le terme est trouvé
 */
export function searchIncludes(text, term) {
    if (!term) return true;
    if (!text) return false;
    return normalizeText(text).includes(normalizeText(term));
}
