/**
 * Validation des fichiers JSONC contre les schémas JSON.
 * Utilisé en CI (GitHub Actions) pour valider les données lors des PR.
 *
 * Usage: node scripts/validate/validate-schemas.mjs
 * Exit code 0 = OK, 1 = erreurs trouvées
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname, basename, relative } from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', '..', 'src', 'data')
const SCHEMA_DIR = join(__dirname, '..', '..', 'src', 'data', 'schemas')

function stripComments(text) {
  text = text.replace(/^\uFEFF/, '');
  return text.replace(/("(?:\\.|[^\\"])*")|(\/\*[\s\S]*?\*\/)|(\/\/(?:.*)$)/gm, (match, string) => {
    if (string) return string;
    return '';
  });
}

// Mapping fichier JSONC → fichier schema
const VALIDATIONS = [
  { data: 'armes/armes.jsonc', schema: 'armes/armes.schema.json' },
  { data: 'armes/armes-type.jsonc', schema: 'types/armes-type.schema.json' },
  { data: 'equipements/equipements.jsonc', schema: 'equipements/equipements.schema.json' },
  { data: 'equipements/equipements-type.jsonc', schema: 'types/equipements-type.schema.json' },
  { data: 'attributs/attributs.jsonc', schema: 'autres/attributs.schema.json' },
  { data: 'attributs/attributs-type.jsonc', schema: 'types/attributs-type.schema.json' },
  { data: 'armes/talents-armes.jsonc', schema: 'armes/talents-armes.schema.json' },
  { data: 'equipements/talents-equipements.jsonc', schema: 'equipements/talents-equipements.schema.json' },
  { data: 'equipements/ensembles.jsonc', schema: 'equipements/ensembles.schema.json' },
  { data: 'competences.jsonc', schema: 'autres/competences.schema.json' },
  { data: 'class-spe.jsonc', schema: 'autres/class-spe.schema.json' },
  { data: 'armes/mods-armes.jsonc', schema: 'armes/mods-armes.schema.json' },
  { data: 'equipements/mods-equipements.jsonc', schema: 'equipements/mods-equipements.schema.json' },
  { data: 'mods-competences.jsonc', schema: 'autres/mods-competences.schema.json' },
  { data: 'armes/mods-armes-type.jsonc', schema: 'types/mods-armes-type.schema.json' },
  { data: 'metadata.jsonc', schema: 'autres/metadata.schema.json' },
  { data: 'builds/builds.jsonc', schema: 'autres/builds.schema.json' },
  { data: 'builds/tags.jsonc', schema: 'autres/tags.schema.json' },
]

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

// Précharger tous les schémas (récursif) pour permettre les $ref relatifs
function listSchemaFiles(dir, base = '') {
  const entries = readdirSync(dir)
  const files = []
  for (const name of entries) {
    const full = join(dir, name)
    const rel = base ? `${base}/${name}` : name
    const stat = statSync(full)
    if (stat.isDirectory()) {
      files.push(...listSchemaFiles(full, rel))
    } else if (name.endsWith('.schema.json')) {
      files.push(rel.replace(/\\/g, '/'))
    }
  }
  return files
}

const schemaFiles = listSchemaFiles(SCHEMA_DIR)
for (const relPath of schemaFiles) {
  const content = JSON.parse(readFileSync(join(SCHEMA_DIR, relPath), 'utf8'))
  // Utiliser le chemin relatif comme clé d'identité pour résoudre les $ref relatifs
  ajv.addSchema(content, relPath)
}

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
    const count = Array.isArray(data)
        ? `${data.length} entrées`
        : typeof data === 'object' && data !== null
            ? `${Object.keys(data).length} entrées`
            : 'objet'
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