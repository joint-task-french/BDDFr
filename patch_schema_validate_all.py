with open("scripts/validate-schemas.mjs", "r") as f:
    content = f.read()

new_content = """import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')

function stripComments(text) {
  text = text.replace(/^\\uFEFF/, '');
  return text.replace(/("(?:\\\\.|[^\\\\"])*")|(\\/\\*[\\s\\S]*?\\*\\/)|(\\//(?:.*)$)/gm, (match, string) => {
    if (string) return string;
    return '';
  });
}

const VALIDATIONS = [
  { data: 'armes.jsonc', schema: 'armes.schema.json' },
  { data: 'armes-type.jsonc', schema: 'armes-type.schema.json' },
  { data: 'equipements.jsonc', schema: 'equipements.schema.json' },
  { data: 'equipements-type.jsonc', schema: 'equipements-type.schema.json' },
  { data: 'attributs.jsonc', schema: 'attributs.schema.json' },
  { data: 'attributs-type.jsonc', schema: 'attributs-type.schema.json' },
  { data: 'talents-armes.jsonc', schema: 'talents-armes.schema.json' },
  { data: 'talents-equipements.jsonc', schema: 'talents-equipements.schema.json' },
  { data: 'ensembles.jsonc', schema: 'ensembles.schema.json' },
  { data: 'competences.jsonc', schema: 'competences.schema.json' },
  { data: 'class-spe.jsonc', schema: 'class-spe.schema.json' },
  { data: 'mods-armes.jsonc', schema: 'mods-armes.schema.json' },
  { data: 'mods-equipements.jsonc', schema: 'mods-equipements.schema.json' },
  { data: 'mods-competences.jsonc', schema: 'mods-competences.schema.json' },
  { data: 'statistiques.jsonc', schema: 'statistiques.schema.json' },
]

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

let hasErrors = false
let totalFiles = 0
let passedFiles = 0

console.log('🔍 Validation des données JSONC contre les schémas JSON...\\n')

const games = readdirSync(DATA_DIR).filter(d => statSync(join(DATA_DIR, d)).isDirectory() && d !== 'schemas')

for (const game of games) {
    console.log(`--- Validation du jeu ${game} ---`)
    const GAME_DIR = join(DATA_DIR, game)
    // On suppose que les schemas sont partagés dans le dossier td2/schemas pour l'instant (à refactorer plus tard si besoin)
    // Mais dans le projet actuel, ils ont été déplacés dans td2/schemas
    const SCHEMA_DIR = join(DATA_DIR, 'td2', 'schemas')

    for (const { data: dataFile, schema: schemaFile } of VALIDATIONS) {
      totalFiles++
      const dataPath = join(GAME_DIR, dataFile)
      const schemaPath = join(SCHEMA_DIR, schemaFile)

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

      let data
      try {
        data = JSON.parse(stripComments(dataContent))
      } catch (e) {
        console.log(`  ❌ ${dataFile} — Erreur de parsing JSON : ${e.message}`)
        hasErrors = true
        continue
      }

      let schema
      try {
        schema = JSON.parse(schemaContent)
      } catch (e) {
        console.log(`  ❌ ${schemaFile} — Erreur de parsing du schéma : ${e.message}`)
        hasErrors = true
        continue
      }

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
}

// Validate global metadata
try {
    const metaSchemaContent = readFileSync(join(DATA_DIR, 'td2', 'schemas', 'metadata.schema.json'), 'utf8')
    const metaDataContent = readFileSync(join(DATA_DIR, 'metadata.jsonc'), 'utf8')
    const validate = ajv.compile(JSON.parse(metaSchemaContent))
    totalFiles++
    if (validate(JSON.parse(stripComments(metaDataContent)))) {
        console.log(`  ✅ metadata.jsonc — OK`)
        passedFiles++
    } else {
        console.log(`  ❌ metadata.jsonc — erreur(s) de validation`)
        hasErrors = true
    }
} catch (e) {
    console.log(`  ⚠️  metadata.jsonc — Schéma ou fichier introuvable (ignoré)`)
}


console.log(`\\n${'─'.repeat(50)}`)
console.log(`📊 Résultat : ${passedFiles}/${totalFiles} fichiers validés`)

if (hasErrors) {
  console.log('❌ La validation a échoué.\\n')
  process.exit(1)
} else {
  console.log('✅ Toutes les données sont valides !\\n')
  process.exit(0)
}
"""

with open("scripts/validate-schemas.mjs", "w") as f:
    f.write(new_content)
