/**
 * Fusionne ensembles-gear.jsonc et ensembles-marque.jsonc en un seul ensembles.jsonc
 * Usage: node scripts/merge-ensembles.mjs
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')
const PUBLIC_DIR = join(__dirname, '..', 'public', 'data')

function readJsonc(dir, name) {
  const raw = readFileSync(join(dir, name), 'utf8')
  return JSON.parse(raw.replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, ''))
}

function writeJsonc(name, obj, comment = '') {
  const header = comment ? `// ${comment}\n` : ''
  const content = header + JSON.stringify(obj, null, 2) + '\n'
  writeFileSync(join(DATA_DIR, name), content, 'utf8')
  writeFileSync(join(PUBLIC_DIR, name), content, 'utf8')
  console.log(`  ✔ ${name} (${Array.isArray(obj) ? obj.length + ' entrées' : 'objet'})`)
}

console.log('\n=== Fusion gear sets + marques → ensembles.jsonc ===')

const gearSets = readJsonc(PUBLIC_DIR, 'ensembles-gear.jsonc')
const brandSets = readJsonc(PUBLIC_DIR, 'ensembles-marque.jsonc')

const ensembles = []

// Gear sets
for (const gs of gearSets) {
  ensembles.push({
    nom: gs.nom,
    type: 'gear_set',
    // Logo à remplir manuellement — nom de fichier dans public/img/ensembles/
    logo: '',
    // Attributs essentiels par défaut de l'ensemble — à remplir
    attributsEssentiels: [],
    bonus1piece: '',
    bonus2pieces: gs.bonus2pieces || '',
    bonus3pieces: gs.bonus3pieces || '',
    bonus4pieces: gs.bonus4pieces || '',
    talentTorse: gs.talentTorse || '',
    talentSac: gs.talentSac || '',
  })
}

// Marques
for (const bm of brandSets) {
  ensembles.push({
    nom: bm.nom,
    type: 'marque',
    logo: '',
    attributsEssentiels: [],
    bonus1piece: bm.bonus1piece || '',
    bonus2pieces: bm.bonus2pieces || '',
    bonus3pieces: bm.bonus3pieces || '',
    bonus4pieces: '',
    talentTorse: '',
    talentSac: '',
  })
}

writeJsonc('ensembles.jsonc', ensembles, 'Tous les ensembles (gear sets + marques) — The Division 2')

// Supprimer les anciens fichiers
for (const f of ['ensembles-gear.jsonc', 'ensembles-marque.jsonc']) {
  for (const dir of [DATA_DIR, PUBLIC_DIR]) {
    const p = join(dir, f)
    if (existsSync(p)) {
      unlinkSync(p)
      console.log(`  ✔ Supprimé ${f} de ${dir === DATA_DIR ? 'src/data' : 'public/data'}`)
    }
  }
}

console.log('\n✅ Fusion terminée !')

