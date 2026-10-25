/**
 * Categories de la base de donnees.
 *
 * Extrait de DatabasePage pour que les listes et le comparateur puissent
 * afficher un libelle de categorie sans importer la page (ce qui creerait un
 * cycle : la page importe ces composants).
 */
export const CATEGORIES = [
  { key: 'armes', label: 'Armes', icon: '🔫' },
  { key: 'equipements', label: 'Équipements', icon: '🛡️' },
  { key: 'ensembles', label: 'Ensembles', icon: '🔗' },
  { key: 'competences', label: 'Compétences', icon: '⚡' },
  { key: 'talentsArmes', label: "Talents d'Armes", icon: '🎯' },
  { key: 'talentsEquipements', label: "Talents d'Équipements", icon: '🏅' },
  { key: 'talentsPrototypes', label: 'Talents Prototypes', icon: '🧬' },
  { key: 'modsArmes', label: "Mods d'Armes", icon: '🔧' },
  { key: 'modsEquipements', label: "Mods d'Équipements", icon: '⚙️' },
  { key: 'modsCompetences', label: 'Mods de Compétences', icon: '💎' },
  { key: 'descente', label: 'Descente', icon: '🧬' },
]

const BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

export function categoryLabel(key) {
  return BY_KEY[key]?.label || key
}

export function categoryIcon(key) {
  return BY_KEY[key]?.icon || '•'
}
