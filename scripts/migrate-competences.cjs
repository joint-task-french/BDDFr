/**
 * Migration: competences.jsonc flat array → grouped by competence type
 * Adds emplacementsMods from mods-competences.jsonc and prerequis from variante names.
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'src', 'data')

function stripComments(text) {
  return text.replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, '')
}

// Mapping spé names in variante parentheses → spé keys
const SPEC_MAP = {
  'artilleur': 'artilleur',
  'démolisseur': 'demolisseur',
  'demolisseur': 'demolisseur',
  'technicien': 'technicien',
  'tacticien': 'technicien',
  'survivaliste': 'survivaliste',
  "tireur d'élite": 'tireur_elite',
  "tireur d'elite": 'tireur_elite',
  'incendiaire': 'incendiaire',
}

function extractPrerequisFromVariante(variante) {
  const match = variante.match(/\(([^)]+)\)/i)
  if (!match) return { cleanName: variante, prerequis: null }
  const specName = match[1].toLowerCase().replace('spécialisation ', '').replace('specialisation ', '').trim()
  const prerequis = SPEC_MAP[specName] || null
  const cleanName = variante.replace(/\s*\([^)]+\)\s*/, '').trim()
  return { cleanName, prerequis }
}

function extractPrerequisFromMod(competenceName) {
  const match = competenceName.match(/\(([^)]+)\)/i)
  if (!match) return { baseName: competenceName.trim(), prerequis: null }
  const specName = match[1].toLowerCase().replace('spécialisation ', '').replace('specialisation ', '').trim()
  const prerequis = SPEC_MAP[specName] || null
  const baseName = competenceName.replace(/\s*\([^)]+\)\s*/, '').trim()
  return { baseName, prerequis }
}

// Load data
const flatCompetences = JSON.parse(stripComments(fs.readFileSync(path.join(DATA_DIR, 'competences.jsonc'), 'utf8')))
const modsCompetences = JSON.parse(stripComments(fs.readFileSync(path.join(DATA_DIR, 'mods-competences.jsonc'), 'utf8')))

// Group competences by type
const grouped = {}
for (const item of flatCompetences) {
  const compName = item.competence
  if (!grouped[compName]) {
    grouped[compName] = { competence: compName, variantes: [] }
  }

  const { cleanName, prerequis } = extractPrerequisFromVariante(item.variante)
  const variante = {
    variante: cleanName,
    ...(prerequis ? { prerequis } : {}),
    ...(item.icon ? { icon: item.icon } : {}),
    ...(item.expertise ? { expertise: item.expertise } : {}),
    ...(item.statistiques ? { statistiques: item.statistiques } : {}),
    ...(item.effetEtat ? { effetEtat: item.effetEtat } : {}),
    tier1: item.tier1,
    tier2: item.tier2,
    tier3: item.tier3,
    tier4: item.tier4,
    tier5: item.tier5,
    tier6: item.tier6,
    surcharge: item.surcharge,
  }
  grouped[compName].variantes.push(variante)
}

// Attach emplacementsMods from mods-competences.jsonc
for (const mod of modsCompetences) {
  const { baseName, prerequis } = extractPrerequisFromMod(mod.competence)
  // Find matching competence group (case-insensitive, accent-insensitive)
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9 ]/gi, '').toUpperCase().trim()
  const baseNorm = norm(baseName)
  // Exact match first, then fuzzy (starts-with or contains)
  let compKey = Object.keys(grouped).find(k => norm(k) === baseNorm)
  if (!compKey) compKey = Object.keys(grouped).find(k => baseNorm.startsWith(norm(k)) || norm(k).startsWith(baseNorm))
  if (!compKey) {
    // Auto-create group from mod
    console.log(`  ℹ Création automatique du type "${baseName}" depuis mods-competences`)
    grouped[baseName] = { competence: baseName, variantes: [] }
    compKey = baseName
  }
  if (!grouped[compKey].emplacementsMods) grouped[compKey].emplacementsMods = []
  const entry = { emplacement: mod.emplacement }
  if (prerequis) entry.prerequis = prerequis
  // Avoid duplicates
  const exists = grouped[compKey].emplacementsMods.some(
    e => e.emplacement === entry.emplacement && (e.prerequis || null) === (entry.prerequis || null)
  )
  if (!exists) grouped[compKey].emplacementsMods.push(entry)
}

const result = Object.values(grouped)

// Write
const header = '// Compétences et variantes — The Division 2\n// Structure: objet par type de compétence, avec variantes en sous-tableau\n'
const output = header + JSON.stringify(result, null, 2)
fs.writeFileSync(path.join(DATA_DIR, 'competences.jsonc'), output, 'utf8')

console.log(`✅ Migration terminée: ${result.length} types de compétences, ${flatCompetences.length} variantes`)
console.log('Types:', result.map(r => `${r.competence} (${r.variantes.length} variantes, ${(r.emplacementsMods||[]).length} emplacements mods)`).join(', '))



