/**
 * Nettoie les champs obtention vides dans armes.jsonc et equipements.jsonc.
 * - Si tous les sous-champs sont false/vides → supprime le champ obtention entièrement
 * - Si un sous-champ est false → le supprime (on ne garde que ceux avec une valeur définie true/string)
 * - Garde description seulement si non vide
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'src', 'data')
const publicDataDir = join(__dirname, '..', 'public', 'data')

function stripJsoncComments(text) {
  return text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}

function readJsonc(filename, dir) {
  const raw = readFileSync(join(dir, filename), 'utf-8')
  return { raw, data: JSON.parse(stripJsoncComments(raw)) }
}

const METHODS = ['butinCible', 'cachesExotiques', 'mission', 'raid', 'incursion']

function cleanObtention(obt) {
  if (!obt || typeof obt !== 'object') return undefined

  const cleaned = {}

  // Garder description seulement si non vide
  if (obt.description && obt.description.trim()) {
    cleaned.description = obt.description.trim()
  }

  // Garder les méthodes seulement si elles ont une valeur définie (true ou string non vide)
  // On retire les false — absence = non défini
  for (const key of METHODS) {
    if (obt[key] === true) cleaned[key] = true
    else if (typeof obt[key] === 'string' && obt[key].length > 0) cleaned[key] = obt[key]
    // false => on ne l'inclut pas
  }

  // Garder represail si non vide
  if (obt.represail && obt.represail.trim()) {
    cleaned.represail = obt.represail.trim()
  }

  // Si l'objet est vide, retourner undefined pour le supprimer
  if (Object.keys(cleaned).length === 0) return undefined
  return cleaned
}

function cleanFile(filename, dir) {
  let fileData
  try {
    fileData = readJsonc(filename, dir)
  } catch { return }

  const { raw, data } = fileData
  let changed = 0

  for (const [slug, entry] of Object.entries(data)) {
    if ('obtention' in entry) {
      const cleaned = cleanObtention(entry.obtention)
      if (cleaned === undefined) {
        delete entry.obtention
        changed++
      } else {
        const before = JSON.stringify(entry.obtention)
        const after = JSON.stringify(cleaned)
        if (before !== after) {
          entry.obtention = cleaned
          changed++
        }
      }
    }
  }

  if (changed > 0) {
    const firstLine = raw.split('\n')[0]
    const comment = firstLine.startsWith('//') ? firstLine + '\n' : ''
    writeFileSync(join(dir, filename), comment + JSON.stringify(data, null, 2) + '\n', 'utf-8')
    console.log(`✅ ${dir.includes('public') ? 'public' : 'src'}/data/${filename} — ${changed} entrée(s) nettoyée(s)`)
  } else {
    console.log(`ℹ️  ${dir.includes('public') ? 'public' : 'src'}/data/${filename} — rien à nettoyer`)
  }
}

for (const file of ['armes.jsonc', 'equipements.jsonc']) {
  cleanFile(file, dataDir)
  cleanFile(file, publicDataDir)
}

console.log('\n✅ Nettoyage obtention terminé')

