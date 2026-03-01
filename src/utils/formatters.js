// Formatteurs et utilitaires d'affichage

export const WEAPON_TYPE_LABELS = {
  fusil_assaut: "Fusil d'assaut",
  fusil: 'Fusil',
  fusil_precision: 'Fusil de précision',
  pistolet_mitrailleur: 'Pistolet mitrailleur',
  fusil_mitrailleur: 'Fusil mitrailleur',
  calibre_12: 'Calibre 12',
  pistolet: 'Pistolet',
  arme_specifique: 'Arme spécifique',
  autre: 'Autre'
}

// Types d'armes classiques (exclut pistolet et arme_specifique)
export const CLASSIC_WEAPON_TYPES = [
  'fusil_assaut', 'fusil', 'fusil_precision',
  'pistolet_mitrailleur', 'fusil_mitrailleur', 'calibre_12'
]

// Spécialisations et leurs armes spécifiques
export const SPECIALISATIONS = {
  demolisseur:    { label: 'Démolisseur',     arme: 'LANCE-GRENADES MULTIPLE M32A1', icon: '💥' },
  survivaliste:   { label: 'Survivaliste',    arme: 'CARREAUX',                      icon: '🏹' },
  tireur_elite:   { label: "Tireur d'élite",  arme: 'FUSIL TAC-50',                  icon: '🎯' },
  artilleur:      { label: 'Artilleur',       arme: 'MINIGUN',                       icon: '⚙️' },
  technicien:     { label: 'Technicien',      arme: 'LANCEUR P-017',                 icon: '🔧' },
  incendiaire:    { label: 'Incendiaire',     arme: 'LANCE-FLAMMES K8-JETSTREAM',    icon: '🔥' },
}

// Mapping arme spécifique → clé spécialisation
export function getSpecFromWeapon(weaponName) {
  if (!weaponName) return null
  const name = weaponName.toUpperCase()
  for (const [key, spec] of Object.entries(SPECIALISATIONS)) {
    if (name.includes(spec.arme) || spec.arme.includes(name)) return key
  }
  return null
}

// Mapping variante de compétence → spécialisation requise
// Les variantes contenant "(spécialisation xxx)" nécessitent cette spé
export function getSkillRequiredSpec(variante) {
  if (!variante) return null
  const v = variante.toLowerCase()
  if (v.includes('artilleur'))       return 'artilleur'
  if (v.includes('démolisseur') || v.includes('demolisseur')) return 'demolisseur'
  if (v.includes('technicien') || v.includes('tacticien'))    return 'technicien'
  if (v.includes('survivaliste'))    return 'survivaliste'
  if (v.includes("tireur d'élite") || v.includes("tireur d'elite")) return 'tireur_elite'
  if (v.includes('incendiaire'))     return 'incendiaire'
  return null
}

export const GEAR_SLOT_LABELS = {
  masque: 'Masque',
  torse: 'Torse',
  holster: 'Holster',
  sac_a_dos: 'Sac à dos',
  gants: 'Gants',
  genouilleres: 'Genouillères'
}

export const GEAR_SLOT_ICONS = {
  masque: '🎭',
  torse: '🦺',
  holster: '🔧',
  sac_a_dos: '🎒',
  gants: '🧤',
  genouilleres: '🦿'
}

export const GEAR_SLOTS = ['masque', 'torse', 'holster', 'sac_a_dos', 'gants', 'genouilleres']

export function formatNumber(n) {
  if (!n) return '—'
  return Number(n).toLocaleString('fr-FR')
}

export function formatText(text) {
  if (!text || text === '-' || text === 'n/a') return null
  // Ajoute des retours à la ligne après les points suivis de lettres
  return text.replace(/\.(?=[a-zA-Zà-ÿÀ-ß+])/g, '.\n')
}

