/**
 * Synchronise les fichiers JSONC de src/data/ vers public/data/
 * Copie uniquement les fichiers .jsonc (pas les schémas ni sous-dossiers).
 *
 * Ce script est exécuté automatiquement avant le dev et le build via npm scripts.
 * Le dossier public/data/ est dans le .gitignore — seul src/data/ est versionné.
 *
 * Usage: node scripts/sync-data.mjs
 */
import { readdirSync, copyFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'src', 'data')
const DEST = join(__dirname, '..', 'public', 'data')

// Créer le dossier destination s'il n'existe pas
if (!existsSync(DEST)) {
  mkdirSync(DEST, { recursive: true })
}

// Copier tous les .jsonc
const files = readdirSync(SRC).filter(f => f.endsWith('.jsonc'))
let count = 0

for (const file of files) {
  copyFileSync(join(SRC, file), join(DEST, file))
  count++
}

console.log(`📂 ${count} fichiers JSONC synchronisés : src/data/ → public/data/`)

