/**
 * Genere src/types/data.d.ts a partir des schemas JSON de src/data/schemas/.
 *
 * Les schemas sont deja la source de verite pour la validation ; ils le
 * deviennent aussi pour l'autocompletion. Le projet reste en JavaScript : le
 * .d.ts genere sert a l'IDE (et aux annotations JSDoc), pas a une compilation.
 *
 * A relancer apres toute modification d'un schema :
 *   npm run generate-types
 */
import { compile } from 'json-schema-to-typescript'
import { readdirSync, readFileSync, mkdirSync, writeFileSync, statSync } from 'fs'
import { join, basename } from 'path'

const SCHEMA_DIR = 'src/data/schemas'
const OUT_FILE = 'src/types/data.d.ts'

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.schema.json')) out.push(full)
  }
  return out
}

/** "talents-armes.schema.json" -> "TalentsArmes" */
function typeName(file) {
  return basename(file, '.schema.json')
    .split(/[-_.]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

const schemas = walk(SCHEMA_DIR).sort()
if (schemas.length === 0) {
  console.error(`Aucun schema trouvé dans ${SCHEMA_DIR}/`)
  process.exit(1)
}

const blocs = [
  '// FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.',
  '// Source : src/data/schemas/**/*.schema.json',
  '// Régénérer : npm run generate-types',
  '',
]

let erreurs = 0

for (const file of schemas) {
  const name = typeName(file)
  try {
    const schema = JSON.parse(readFileSync(file, 'utf8'))
    const ts = await compile(schema, name, {
      bannerComment: '',
      additionalProperties: false,
      unknownAny: false,
      style: { singleQuote: true },
    })
    blocs.push(`// --- ${file.split(/[\\/]/).join('/')} ---`)
    blocs.push(ts.trim())
    blocs.push('')
    console.log(`  ok  ${name.padEnd(24)} <- ${file}`)
  } catch (e) {
    erreurs++
    console.error(`  ÉCHEC ${name} <- ${file} : ${e.message}`)
  }
}

mkdirSync('src/types', { recursive: true })
writeFileSync(OUT_FILE, blocs.join('\n'), 'utf8')

console.log(`\n${schemas.length - erreurs}/${schemas.length} schémas convertis -> ${OUT_FILE}`)
if (erreurs > 0) process.exit(1)
