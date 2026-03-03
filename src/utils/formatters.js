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

// Spécialisations — construites depuis class-spe.jsonc au runtime
// Utiliser buildSpecialisations(data.classSpe) pour obtenir le mapping
export function buildSpecialisations(classSpeData) {
  if (!classSpeData || !Array.isArray(classSpeData)) return {}
  const map = {}
  for (const spec of classSpeData) {
    map[spec.cle] = { label: spec.nom, arme: spec.arme?.nom || '', icon: spec.icone || '🎖️' }
  }
  return map
}

// Cache global mis à jour au premier chargement
let _speCache = null
export function getSpecialisations(classSpeData) {
  if (classSpeData) _speCache = buildSpecialisations(classSpeData)
  return _speCache || {}
}

// Mapping arme spécifique → clé spécialisation (utilise les données)
export function getSpecFromWeapon(weaponName, classSpeData) {
  if (!weaponName) return null
  const name = weaponName.toUpperCase()
  const specs = classSpeData ? buildSpecialisations(classSpeData) : (_speCache || {})
  for (const [key, spec] of Object.entries(specs)) {
    if (name.includes(spec.arme.toUpperCase()) || spec.arme.toUpperCase().includes(name)) return key
  }
  return null
}

// Mapping variante de compétence → spécialisation requise
// Préférer skill.prerequis directement depuis les données
export function getSkillRequiredSpec(variante) {
  if (!variante) return null
  const v = variante.toLowerCase()
  const mapping = {
    'artilleur': 'artilleur',
    'démolisseur': 'demolisseur', 'demolisseur': 'demolisseur',
    'technicien': 'technicien', 'tacticien': 'technicien',
    'survivaliste': 'survivaliste',
    "tireur d'élite": 'tireur_elite', "tireur d'elite": 'tireur_elite',
    'incendiaire': 'incendiaire',
  }
  for (const [keyword, key] of Object.entries(mapping)) {
    if (v.includes(keyword)) return key
  }
  return null
}

// Mapping type d'arme → attribut principal (non modifiable)
export const WEAPON_MAIN_ATTRIBUTE = {
  fusil_assaut: "Dégâts Fusil d'assaut",
  fusil: 'Dégâts Fusil',
  fusil_precision: 'Dégâts Fusil de précision',
  pistolet_mitrailleur: 'Dégâts Pistolet-mitrailleur',
  fusil_mitrailleur: 'Dégâts Fusil-mitrailleur',
  calibre_12: 'Dégâts Calibre 12',
  pistolet: 'Dégâts Pistolet',
}

// Labels des catégories d'attributs essentiels
export const ATTR_CATEGORY_LABELS = {
  offensif: 'Offensif',
  'défensif': 'Défensif',
  utilitaire: 'Utilitaire',
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

