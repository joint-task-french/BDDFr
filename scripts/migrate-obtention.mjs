/**
 * Migre le champ "obtention" de string vers objet structuré
 * dans armes.jsonc et equipements.jsonc
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

function readJsonc(filename, dir = dataDir) {
  const raw = readFileSync(join(dir, filename), 'utf-8')
  return { raw, data: JSON.parse(stripJsoncComments(raw)) }
}

function makeObtentionObject(oldValue) {
  const desc = (typeof oldValue === 'string') ? oldValue.trim() : ''
  return {
    description: desc,
    butinCible: false,
    cachesExotiques: false,
    mission: false,
    raid: false,
    incursion: false
  }
}

function migrateFile(filename) {
  const { raw, data } = readJsonc(filename)
  let modified = false

  for (const [slug, entry] of Object.entries(data)) {
    if (typeof entry.obtention === 'string') {
      entry.obtention = makeObtentionObject(entry.obtention)
      modified = true
    } else if (entry.obtention === undefined) {
      entry.obtention = makeObtentionObject('')
      modified = true
    }
  }

  if (modified) {
    // Extract comment from first line
    const firstLine = raw.split('\n')[0]
    const comment = firstLine.startsWith('//') ? firstLine + '\n' : ''
    const json = JSON.stringify(data, null, 2)
    writeFileSync(join(dataDir, filename), comment + json + '\n', 'utf-8')
    console.log(`✅ Migré: src/data/${filename}`)

    // Also migrate public/data if it exists
    try {
      const { data: pubData } = readJsonc(filename, publicDataDir)
      for (const [slug, entry] of Object.entries(pubData)) {
        if (typeof entry.obtention === 'string') {
          entry.obtention = makeObtentionObject(entry.obtention)
        } else if (entry.obtention === undefined) {
          entry.obtention = makeObtentionObject('')
        }
      }
      writeFileSync(join(publicDataDir, filename), comment + JSON.stringify(pubData, null, 2) + '\n', 'utf-8')
      console.log(`✅ Migré: public/data/${filename}`)
    } catch {
      console.log(`⚠️  Pas de fichier public/data/${filename} ou erreur — ignoré`)
    }
  } else {
    console.log(`ℹ️  Aucune migration nécessaire pour ${filename}`)
  }
}

migrateFile('armes.jsonc')
migrateFile('equipements.jsonc')
console.log('\n✅ Migration obtention terminée')

