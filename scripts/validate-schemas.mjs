/**
 * Validation des fichiers JSONC contre les schémas JSON.
 * Utilisé en CI (GitHub Actions) pour valider les données lors des PR.
 *
 * Usage: node scripts/validate-schemas.mjs
 * Exit code 0 = OK, 1 = erreurs trouvées
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')
const SCHEMA_DIR = join(__dirname, '..', 'src', 'data', 'schemas')

function stripComments(text) {
  return text.replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, '')
}

// Mapping fichier JSONC → fichier schema
const VALIDATIONS = [
  { data: 'armes.jsonc', schema: 'armes.schema.json' },
  { data: 'equipements.jsonc', schema: 'equipements.schema.json' },
  { data: 'attributs.jsonc', schema: 'attributs.schema.json' },
  { data: 'talents-armes.jsonc', schema: 'talents-armes.schema.json' },
  { data: 'talents-equipements.jsonc', schema: 'talents-equipements.schema.json' },
  { data: 'ensembles.jsonc', schema: 'ensembles.schema.json' },
  { data: 'competences.jsonc', schema: 'competences.schema.json' },
  { data: 'class-spe.jsonc', schema: 'class-spe.schema.json' },
  { data: 'mods-armes.jsonc', schema: 'mods-armes.schema.json' },
  { data: 'mods-equipements.jsonc', schema: 'mods-equipements.schema.json' },
  { data: 'mods-competences.jsonc', schema: 'mods-competences.schema.json' },
  { data: 'changelog.jsonc', schema: 'changelog.schema.json' },
  { data: 'metadata.jsonc', schema: 'metadata.schema.json' },
]

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

let hasErrors = false
let totalFiles = 0
let passedFiles = 0

console.log('🔍 Validation des données JSONC contre les schémas JSON...\n')

for (const { data: dataFile, schema: schemaFile } of VALIDATIONS) {
  totalFiles++
  const dataPath = join(DATA_DIR, dataFile)
  const schemaPath = join(SCHEMA_DIR, schemaFile)

  // Vérifier que les fichiers existent
  let dataContent, schemaContent
  try {
    dataContent = readFileSync(dataPath, 'utf8')
  } catch {
    console.log(`  ❌ ${dataFile} — Fichier de données introuvable : ${dataPath}`)
    hasErrors = true
    continue
  }
  try {
    schemaContent = readFileSync(schemaPath, 'utf8')
  } catch {
    console.log(`  ⚠️  ${dataFile} — Schéma introuvable : ${schemaFile} (ignoré)`)
    continue
  }

  // Parser le JSONC
  let data
  try {
    data = JSON.parse(stripComments(dataContent))
  } catch (e) {
    console.log(`  ❌ ${dataFile} — Erreur de parsing JSON : ${e.message}`)
    hasErrors = true
    continue
  }

  // Parser le schéma
  let schema
  try {
    schema = JSON.parse(schemaContent)
  } catch (e) {
    console.log(`  ❌ ${schemaFile} — Erreur de parsing du schéma : ${e.message}`)
    hasErrors = true
    continue
  }

  // Valider
  const validate = ajv.compile(schema)
  const valid = validate(data)

  if (valid) {
    const count = Array.isArray(data) ? `${data.length} entrées` : 'objet'
    console.log(`  ✅ ${dataFile} — OK (${count})`)
    passedFiles++
  } else {
    console.log(`  ❌ ${dataFile} — ${validate.errors.length} erreur(s) :`)
    // Afficher les 10 premières erreurs max
    validate.errors.slice(0, 10).forEach(err => {
      const path = err.instancePath || '/'
      console.log(`     → ${path} : ${err.message}`)
      if (err.params) {
        if (err.params.allowedValues) {
          console.log(`       Valeurs autorisées : ${err.params.allowedValues.join(', ')}`)
        }
        if (err.params.additionalProperty) {
          console.log(`       Propriété inconnue : ${err.params.additionalProperty}`)
        }
      }
    })
    if (validate.errors.length > 10) {
      console.log(`     ... et ${validate.errors.length - 10} autre(s) erreur(s)`)
    }
    hasErrors = true
  }
}

console.log(`\n${'─'.repeat(50)}`)
console.log(`📊 Résultat : ${passedFiles}/${totalFiles} fichiers validés`)

if (hasErrors) {
  console.log('❌ La validation a échoué.\n')
  process.exit(1)
} else {
  console.log('✅ Toutes les données sont valides !\n')
  process.exit(0)
}


