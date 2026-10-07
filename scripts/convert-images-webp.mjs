/**
 * Convertit les images de src/img/ en WebP.
 *
 * Le WebP pese typiquement 3 a 5 fois moins qu'un PNG a qualite equivalente,
 * pour un support navigateur superieur a 97 %.
 *
 * Sans effet sur le code applicatif : `buildIndex()` dans GameAssets.jsx indexe
 * par nom de fichier SANS extension, et le glob accepte deja le webp. Les
 * champs "icon" des JSONC, eux, ne portent pas d'extension.
 *
 * Le PNG source est supprime apres conversion — conserver les deux creerait
 * une collision de slug dans l'index (meme nom sans extension).
 *
 * Usage :
 *   node scripts/convert-images-webp.mjs --dry-run   (simulation, defaut)
 *   node scripts/convert-images-webp.mjs --apply     (conversion reelle)
 */
import sharp from 'sharp'
import { readdirSync, statSync, unlinkSync, existsSync } from 'fs'
import { join, extname, basename, dirname } from 'path'

const ROOT = 'src/img'
const APPLY = process.argv.includes('--apply')
const QUALITY = 82

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (extname(name).toLowerCase() === '.png') out.push(full)
  }
  return out
}

const files = walk(ROOT)
if (files.length === 0) {
  console.log('Aucun PNG a convertir.')
  process.exit(0)
}

console.log(`${APPLY ? 'CONVERSION' : 'SIMULATION'} — ${files.length} PNG dans ${ROOT}/\n`)

let avant = 0
let apres = 0
let convertis = 0
const collisions = []
const echecs = []

for (const file of files) {
  const cible = join(dirname(file), basename(file, '.png') + '.webp')

  // Deux fichiers de meme nom de base produiraient le meme slug dans l'index.
  if (existsSync(cible)) {
    collisions.push(cible)
    continue
  }

  const tailleAvant = statSync(file).size
  try {
    const buffer = await sharp(file).webp({ quality: QUALITY, effort: 6 }).toBuffer()

    avant += tailleAvant
    apres += buffer.length
    convertis++

    const gain = Math.round((1 - buffer.length / tailleAvant) * 100)
    if (tailleAvant > 20 * 1024) {
      console.log(
        `  ${String(Math.round(tailleAvant / 1024)).padStart(5)} Ko -> ` +
        `${String(Math.round(buffer.length / 1024)).padStart(5)} Ko  (-${gain}%)  ${file}`
      )
    }

    if (APPLY) {
      await sharp(file).webp({ quality: QUALITY, effort: 6 }).toFile(cible)
      unlinkSync(file)
    }
  } catch (e) {
    echecs.push(`${file} : ${e.message}`)
  }
}

console.log(`\n${convertis} image(s) traitee(s)`)
console.log(`  avant : ${(avant / 1024 / 1024).toFixed(2)} Mo`)
console.log(`  apres : ${(apres / 1024 / 1024).toFixed(2)} Mo`)
console.log(`  gain  : ${(((avant - apres) / 1024 / 1024)).toFixed(2)} Mo (-${Math.round((1 - apres / avant) * 100)} %)`)

if (collisions.length) {
  console.log(`\n${collisions.length} collision(s) ignoree(s) — un .webp existe deja :`)
  collisions.forEach(c => console.log('  - ' + c))
}
if (echecs.length) {
  console.error(`\n${echecs.length} echec(s) :`)
  echecs.forEach(e => console.error('  - ' + e))
  process.exit(1)
}
if (!APPLY) console.log('\nSimulation uniquement. Relancer avec --apply pour ecrire.')
