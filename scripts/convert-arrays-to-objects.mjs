/**
 * Convertit les fichiers JSONC de format array vers format objet
 * avec le slug comme clé de chaque entrée.
 *
 * Gère automatiquement les doublons :
 * - armes.jsonc : favorise la version exotique sur la classique
 * - autres : fusionne les propriétés (le premier vu est la base, le second écrase les champs non vides)
 *
 * Usage: node scripts/convert-arrays-to-objects.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')

const DRY_RUN = process.argv.includes('--dry-run')

function stripComments(text) {
  return text.replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, '')
}

/**
 * Fusionne deux entrées ayant le même slug.
 * Pour les armes : si l'une est exotique, on la prend comme base.
 * Sinon : on garde la première et on complète avec la seconde.
 */
function mergeEntries(existing, incoming, file) {
  if (file === 'armes.jsonc') {
    // Favoriser l'entrée exotique
    if (incoming.estExotique && !existing.estExotique) return incoming
    if (existing.estExotique && !incoming.estExotique) return existing
  }
  // Pour les doublons identiques, garder le premier
  return existing
}

const FILES_TO_CONVERT = [
  { file: 'armes.jsonc', comment: '// Armes — The Division 2' },
  { file: 'attributs.jsonc', comment: '// Attributs — The Division 2' },
  { file: 'class-spe.jsonc', comment: '// Classes de spécialisation — The Division 2' },
  { file: 'competences.jsonc', comment: '// Compétences — The Division 2' },
  { file: 'ensembles.jsonc', comment: '// Ensembles (Gear Sets + Marques) — The Division 2' },
  { file: 'equipements.jsonc', comment: '// Équipements — The Division 2' },
  { file: 'mods-armes.jsonc', comment: "// Mods d'armes — The Division 2" },
  { file: 'mods-competences.jsonc', comment: '// Mods de compétences — The Division 2' },
  { file: 'mods-equipements.jsonc', comment: "// Mods d'équipements — The Division 2" },
  { file: 'talents-armes.jsonc', comment: "// Talents d'armes — The Division 2" },
  { file: 'talents-equipements.jsonc', comment: "// Talents d'équipements — The Division 2" },
]

console.log(`${DRY_RUN ? '🔍 [DRY RUN] ' : '🔄 '}Conversion des fichiers JSONC : array → objet (slug comme clé)\n`)

let converted = 0
let skipped = 0
let errors = 0

for (const { file, comment } of FILES_TO_CONVERT) {
  const filePath = join(DATA_DIR, file)

  let raw
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    console.log(`  ⚠️  ${file} — fichier introuvable, ignoré`)
    skipped++
    continue
  }

  let data
  try {
    data = JSON.parse(stripComments(raw))
  } catch (e) {
    console.log(`  ❌ ${file} — erreur de parsing : ${e.message}`)
    errors++
    continue
  }

  // Vérifier que c'est un array
  if (!Array.isArray(data)) {
    console.log(`  ⏭️  ${file} — déjà un objet, ignoré`)
    skipped++
    continue
  }

  // Convertir array → objet avec gestion des doublons
  const obj = {}
  let duplicates = 0
  let missing = 0
  for (const item of data) {
    const slug = item.slug
    if (!slug) {
      missing++
      console.log(`  ⚠️  ${file} — entrée sans slug (nom: ${item.nom || item.competence || item.statistique || '?'}), ignorée`)
      continue
    }

    // Retirer le champ slug de la valeur
    const { slug: _slug, ...rest } = item

    if (obj[slug]) {
      duplicates++
      const merged = mergeEntries(obj[slug], rest, file)
      // Retirer le slug du merged aussi (au cas où)
      const { slug: _s2, ...cleanMerged } = merged
      obj[slug] = cleanMerged
      console.log(`  🔀 ${file} — doublon "${slug}" fusionné`)
    } else {
      obj[slug] = rest
    }
  }

  const keyCount = Object.keys(obj).length

  if (DRY_RUN) {
    console.log(`  📝 ${file} — ${data.length} entrées → ${keyCount} clés${duplicates ? ` (${duplicates} doublons fusionnés)` : ''} (dry run)`)
  } else {
    const jsonContent = JSON.stringify(obj, null, 2)
    const output = `${comment}\n${jsonContent}\n`
    writeFileSync(filePath, output, 'utf8')
    console.log(`  ✅ ${file} — ${data.length} entrées → ${keyCount} clés${duplicates ? ` (${duplicates} doublons fusionnés)` : ''}`)
  }
  converted++
}

console.log(`\n${'─'.repeat(50)}`)
console.log(`📊 Résultat : ${converted} converti(s), ${skipped} ignoré(s), ${errors} erreur(s)`)

if (errors > 0) {
  process.exit(1)
}
