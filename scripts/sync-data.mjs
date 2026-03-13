/**
 * Synchronise les fichiers JSONC de src/data/ vers public/data/
 * Copie uniquement les fichiers .jsonc.
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

function syncFolder(srcDir, destDir) {
  let filesCount = 0;
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  const items = readdirSync(srcDir, { withFileTypes: true });
  for (const item of items) {
    const srcPath = join(srcDir, item.name);
    const destPath = join(destDir, item.name);

    if (item.isDirectory() && item.name === 'schemas') continue;

    if (item.isDirectory()) {
      filesCount += syncFolder(srcPath, destPath);
    } else if (item.isFile() && item.name.endsWith('.jsonc')) {
      copyFileSync(srcPath, destPath);
      filesCount++;
    }
  }
  return filesCount;
}

let count = syncFolder(SRC, DEST);

console.log(`📂 ${count} fichiers JSONC synchronisés : src/data/ → public/data/`)
