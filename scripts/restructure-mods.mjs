// Script pour restructurer les fichiers de mods
// Transforme les bonus/malus textuels en références d'attributs structurées
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_DATA = join(__dirname, '..', 'src', 'data')
const PUB_DATA = join(__dirname, '..', 'public', 'data')

function stripComments(text) {
  return text.replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, '')
}

function loadJsonc(path) {
  return JSON.parse(stripComments(readFileSync(path, 'utf-8')))
}

// Parse un bonus textuel comme "+15 Munitions" ou "+30% Stabilité"
function parseBonus(text) {
  if (!text) return null
  // Match "+N% Attribut" ou "+N Attribut" ou "-N% Attribut"
  const match = text.match(/^([+-]?\d+(?:[.,]\d+)?)\s*(%?)\s*(.+)$/i)
  if (!match) {
    // Bonus spécial non numérique (ex: "Applique une impulsion...")
    return { description: text }
  }
  const valeur = parseFloat(match[1].replace(',', '.'))
  const isPercent = match[2] === '%'
  const nomAttr = match[3].trim()
  return { valeur, unite: isPercent ? '%' : 'pts', nomAttr }
}

// Mapping nom attribut libre → slug attribut
const ATTR_SLUG_MAP = {
  'munitions': 'munitions',
  'stabilité': 'stabilite_arm',
  'cadence de tir': 'cadence_de_tir_arm',
  'vitesse de rechargement': 'vitesse_de_rechargement_arm',
  'portée optimale': 'portee_optimale_arm',
  'précision': 'precision_arm',
  'probabilité de coup critique': 'probabilite_de_coup_critique_arm',
  'probabilité coup critique': 'probabilite_de_coup_critique_arm',
  'probilité de coup critique': 'probabilite_de_coup_critique_arm',
  'dégâts de coup critique': 'degats_de_coup_critique_arm',
  'dégâts coup critique': 'degats_de_coup_critique_arm',
  'dégâts critique': 'degats_de_coup_critique_arm',
  'dégâts de headshot': 'degats_de_headshot_arm',
  'dégâts headshot': 'degats_de_headshot_arm',
  'dégâts aux headshot': 'degats_de_headshot_arm',
  'aux dégâts de headshot': 'degats_de_headshot_arm',
  'dégâts aux protections': 'degats_aux_protections_arm',
  "dégâts d'arme": 'degats_armes',
  "maniement d'arme": 'maniement_d_arme_eqp',
  'taille du chargeur': 'taille_du_chargeur_arm',
}

function resolveAttrSlug(nomAttr) {
  if (!nomAttr) return null
  const norm = nomAttr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  for (const [key, slug] of Object.entries(ATTR_SLUG_MAP)) {
    const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (norm === keyNorm || norm.includes(keyNorm) || keyNorm.includes(norm)) return slug
  }
  return null
}

// ===== MODS ARMES =====
const modsArmes = loadJsonc(join(SRC_DATA, 'mods-armes.jsonc'))
const newModsArmes = {}

for (const [slug, mod] of Object.entries(modsArmes)) {
  const newMod = { nom: mod.nom, type: mod.type }

  // Parse bonus
  const bonusParsed = parseBonus(mod.bonus)
  if (bonusParsed) {
    if (bonusParsed.description) {
      newMod.bonus = { description: bonusParsed.description }
    } else {
      const attrSlug = resolveAttrSlug(bonusParsed.nomAttr)
      newMod.bonus = { attribut: attrSlug || bonusParsed.nomAttr, valeur: bonusParsed.valeur, unite: bonusParsed.unite }
    }
  }

  // Parse malus
  if (mod.malus) {
    const malusParsed = parseBonus(mod.malus)
    if (malusParsed && !malusParsed.description) {
      const attrSlug = resolveAttrSlug(malusParsed.nomAttr)
      newMod.malus = { attribut: attrSlug || malusParsed.nomAttr, valeur: Math.abs(malusParsed.valeur), unite: malusParsed.unite }
    }
  }

  // Compatible - garder tel quel mais remplacer "unknown" par tableau vide signifiant universel
  if (mod.compatible && mod.compatible.length > 0 && !mod.compatible.includes('unknown')) {
    newMod.compatible = mod.compatible
  } else {
    // Pas de restriction connue → universel pour ce type de mod
    newMod.compatible = []
  }

  if (mod.estExotique) newMod.estExotique = true

  newModsArmes[slug] = newMod
}

const modsArmesOutput = '// Mods d\'armes — The Division 2\n' + JSON.stringify(newModsArmes, null, 2)
writeFileSync(join(SRC_DATA, 'mods-armes.jsonc'), modsArmesOutput, 'utf-8')
writeFileSync(join(PUB_DATA, 'mods-armes.jsonc'), modsArmesOutput, 'utf-8')

// ===== MODS EQUIPEMENTS =====
const EQMOD_SLUG_MAP = {
  '% durée de compétence': { attribut: 'duree_de_competence_eqp_mod', valeur: 10, unite: '%' },
  '% récup de compétence': { attribut: 'recup_de_competence_eqp', valeur: 12, unite: '%' },
  '% compétence de réparation': { attribut: 'competences_de_reparation_eqp', valeur: 20, unite: '%' },
  '% protection contre ennemi d\'élite': { attribut: 'protection_contre_ennemi_elite_mod', valeur: 13, unite: '%' },
  'protection pour élimination': { attribut: 'protection_pour_elimination_mod', valeur: 18935, unite: 'pts' },
  '% réparation subies': { attribut: 'reparation_subies_mod', valeur: 20, unite: '%' },
  '% probabilité de coup critique': { attribut: 'probabilite_de_coup_critique_eqp', valeur: 6, unite: '%' },
  '% dégâts coup critique': { attribut: 'degats_de_coup_critique_eqp', valeur: 12, unite: '%' },
  '% dégâts aux headshot': { attribut: 'degats_de_headshot_eqp', valeur: 10, unite: '%' },
}

const modsEquipements = loadJsonc(join(SRC_DATA, 'mods-equipements.jsonc'))
const newModsEquipements = {}

for (const [slug, mod] of Object.entries(modsEquipements)) {
  const statNorm = mod.statistique?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  let bonusObj = null

  // Try to find in the map
  for (const [key, mapped] of Object.entries(EQMOD_SLUG_MAP)) {
    const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (statNorm === keyNorm || statNorm?.includes(keyNorm)) {
      bonusObj = { ...mapped }
      // Parse valeurMax for actual value
      if (mod.valeurMax) {
        const numMatch = mod.valeurMax.match(/(\d+(?:[.,]\d+)?)/)
        if (numMatch) bonusObj.valeur = parseFloat(numMatch[1].replace(',', '.'))
      }
      break
    }
  }

  newModsEquipements[slug] = {
    categorie: mod.categorie,
    protocole: mod.protocole,
    nom: mod.statistique, // Keep the display name
    bonus: bonusObj || { attribut: slug, valeur: 0, unite: '%' },
  }
}

const modsEquipOutput = '// Mods d\'équipements — The Division 2\n' + JSON.stringify(newModsEquipements, null, 2)
writeFileSync(join(SRC_DATA, 'mods-equipements.jsonc'), modsEquipOutput, 'utf-8')
writeFileSync(join(PUB_DATA, 'mods-equipements.jsonc'), modsEquipOutput, 'utf-8')

// ===== MODS COMPETENCES =====
const modsCompetences = loadJsonc(join(SRC_DATA, 'mods-competences.jsonc'))
const newModsCompetences = {}

for (const [slug, mod] of Object.entries(modsCompetences)) {
  newModsCompetences[slug] = {
    competence: mod.competence,
    emplacement: mod.emplacement,
    compatible: [mod.competence],
    ...(mod.prerequis ? { prerequis: mod.prerequis } : {}),
  }
}

const modsCompOutput = '// Mods de compétences — The Division 2\n' + JSON.stringify(newModsCompetences, null, 2)
writeFileSync(join(SRC_DATA, 'mods-competences.jsonc'), modsCompOutput, 'utf-8')
writeFileSync(join(PUB_DATA, 'mods-competences.jsonc'), modsCompOutput, 'utf-8')

console.log('Done! All mod files restructured.')
console.log(`  mods-armes: ${Object.keys(newModsArmes).length} entries`)
console.log(`  mods-equipements: ${Object.keys(newModsEquipements).length} entries`)
console.log(`  mods-competences: ${Object.keys(newModsCompetences).length} entries`)

