/**
 * Extrait le changelog du fichier 1.json historique (via git) et le restructure.
 * Usage: node scripts/extract-changelog.mjs
 */
import { execSync } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')

// Récupérer le 1.json depuis git
const raw = execSync('git show 0d240c9:src/data/1.json', { cwd: join(__dirname, '..'), encoding: 'utf8' })
const oldData = JSON.parse(raw)

// Le changelog est dans la dernière entrée du tableau data
const changelogEntry = oldData.data.find(d =>
  (d.element_name || '').includes('Change logs') ||
  (d.element_name || '').includes('Le 25/02/2026')
)

// Le gros texte est dans element_name de l'entrée suivante ou dans Colonne_2
let changelogRaw = ''
for (const entry of oldData.data) {
  const text = entry.element_name || ''
  if (text.includes('Le 25/02/2026') || text.includes('Le 20/11/2024')) {
    changelogRaw = text
    break
  }
}

// Parser : on split sur le pattern "Le DD/MM/YYYY" ou "Du DD/MM" ou "le DD/MM" ou "Entre le"
const entries = []
const datePattern = /(Le \d{1,2}[\s/]\d{1,2}[\s/]\d{2,4}|Du \d{1,2}[\s/]\d{1,2}[\s/]\d{2,4}|du \d{1,2}[\s/]\d{1,2}[\s/]\d{2,4}|le \d{1,2}[\s/]\d{1,2}[\s/]\d{2,4}|Entre le \d{1,2}[\s/]\d{1,2})/gi

// Split par dates
const parts = changelogRaw.split(datePattern).filter(Boolean)

for (let i = 0; i < parts.length; i += 2) {
  const datePart = parts[i] || ''
  const contentPart = parts[i + 1] || ''

  if (!datePart.match(/\d/)) continue

  // Nettoyer le contenu : séparer les entrées par les majuscules qui suivent
  let content = (datePart + contentPart).trim()

  // Séparer sur les patterns "Ajout ", "Mise à jour", "Création", "Rework", etc.
  const items = content
    .split(/(?=Ajout |Mise à jour|Mise a jour|Création |Cr├ation |Rework |Buff |Nerf |Changement |Modification |M├j |Màj |Up |Suppression |Traduction )/)
    .map(s => s.trim())
    .filter(s => s.length > 5)

  if (items.length > 0) {
    // La première partie contient la date et éventuellement le patch
    const header = items[0]
    const changes = items.slice(1)

    entries.push({
      date: header.split(':')[0]?.trim() || header.substring(0, 30),
      patch: header.includes(':') ? header.split(':').slice(1).join(':').trim() : '',
      changements: changes.length > 0 ? changes : [header]
    })
  }
}

// Lire le metadata actuel
function stripComments(t) { return t.replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, '') }
const metaPath = join(DATA_DIR, 'metadata.jsonc')
const meta = JSON.parse(stripComments(readFileSync(metaPath, 'utf8')))

// Ajouter le changelog
meta.changelog = entries

const content = '// Métadonnées et changelog — The Division 2\n' + JSON.stringify(meta, null, 2) + '\n'
writeFileSync(metaPath, content, 'utf8')

console.log(`✅ Changelog extrait : ${entries.length} entrées ajoutées au metadata.jsonc`)

