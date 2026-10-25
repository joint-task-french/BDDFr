/**
 * Smoke test : build reel, charge dans un vrai navigateur, echoue au moindre
 * signe de casse.
 *
 * Raison d'etre : deux pannes bloquantes (versions react/react-dom
 * desynchronisees -> ecran blanc ; 2 JSONC illisibles -> catalogue vide) sont
 * passees en production sans etre detectees. Ni le build, ni la validation des
 * schemas, ni les tests unitaires ne les voyaient — seul le chargement de la
 * page dans un navigateur les revele.
 *
 * Prerequis : `dist/` doit exister (lancer `npm run build` avant).
 * Usage : node scripts/smoke-test.mjs
 */
import { preview } from 'vite'
import puppeteer from 'puppeteer'
import { existsSync } from 'fs'
import lzString from 'lz-string'

const BASE = process.env.VITE_BASE_PATH || '/BDDFr'
const PORT = Number(process.env.SMOKE_PORT || 4179)

if (!existsSync('dist')) {
  console.error('dist/ est introuvable — lancez `npm run build` avant le smoke test.')
  process.exit(1)
}

/** Erreurs console attendues et sans consequence dans ce contexte. */
const IGNORED = [
  /ServiceWorker/i,        // pas d'enregistrement de SW sur un serveur ephemere
  /Failed to register a ServiceWorker/i,
  /favicon/i,
]

const failures = []
const note = (kind, message) => {
  if (IGNORED.some(re => re.test(message))) return
  failures.push(`[${kind}] ${message}`)
}

let server
let browser

try {
  server = await preview({
    preview: { port: PORT, strictPort: true },
    logLevel: 'error',
  })

  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  page.on('console', msg => { if (msg.type() === 'error') note('console', msg.text()) })
  page.on('pageerror', err => note('exception', err.message))
  page.on('requestfailed', req => note('requete', `${req.failure()?.errorText} ${req.url()}`))

  const visit = async (hash, label) => {
    const url = `http://localhost:${PORT}${BASE}/${hash}`
    console.log(`  -> ${label} (${url})`)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 })
    await new Promise(r => setTimeout(r, 1500))
  }

  // --- Page base de donnees -----------------------------------------------
  await visit('', 'base de donnees')

  const db = await page.evaluate(() => {
    const text = document.body.innerText
    return {
      texteVisible: text.trim().length,
      mentionneErreur: /erreur de chargement/i.test(text),
      nbCartes: document.querySelectorAll('img').length,
      imagesCassees: [...document.querySelectorAll('img')]
        .filter(i => i.complete && i.naturalWidth === 0).length,
      entrees: (text.match(/(\d+)\s+entr/i) || [])[1],
    }
  })

  if (db.texteVisible < 200) failures.push(`[rendu] page quasi vide (${db.texteVisible} caracteres) — ecran blanc probable`)
  if (db.mentionneErreur) failures.push('[rendu] la page affiche "erreur de chargement"')
  if (!db.entrees || Number(db.entrees) < 200) failures.push(`[donnees] catalogue d'armes vide ou tronque (${db.entrees ?? 'aucun compteur'})`)
  if (db.imagesCassees > 0) failures.push(`[assets] ${db.imagesCassees} image(s) cassee(s)`)

  console.log(`     ${db.entrees} entrees, ${db.nbCartes} images, ${db.imagesCassees} cassees`)

  // --- Build planner -------------------------------------------------------
  await visit('#/planner', 'build planner')
  const planner = await page.evaluate(() => ({
    texteVisible: document.body.innerText.trim().length,
    aDesEmplacements: /arme primaire/i.test(document.body.innerText),
  }))
  if (!planner.aDesEmplacements) failures.push('[rendu] le planner n affiche pas ses emplacements d armes')

  // --- Comparateur et listes ------------------------------------------------
  // Ces deux fonctions s'amorcent au clic droit : si le menu contextuel cesse de
  // s'ouvrir, plus rien n'y donne acces et la regression est invisible.
  await visit('#/db/armes', 'base de donnees (comparateur)')

  const collection = await page.evaluate(async () => {
    const attendre = (ms) => new Promise(r => setTimeout(r, ms))
    const cartes = [...document.querySelectorAll('[data-slug]')]
    if (cartes.length < 2) return { erreur: 'aucune carte' }

    const ouvrir = async (carte) => {
      carte.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 80, clientY: 80 }))
      await attendre(150)
      return document.querySelector('[role=menu]')
    }

    // 1. Le menu s'ouvre et propose les deux actions.
    const menu = await ouvrir(cartes[0])
    if (!menu) return { erreur: 'menu contextuel absent' }
    const actions = [...menu.querySelectorAll('button')].map(b => b.textContent)
    const aComparer = actions.some(t => t.includes('Comparer'))
    const aListe = actions.some(t => t.includes('Ajouter'))

    // 2. Deux armes ajoutees au comparateur.
    menu.querySelector('button').click()
    await attendre(200)
    const menu2 = await ouvrir(cartes[1])
    const refuse = menu2?.querySelector('button')?.disabled
    menu2?.querySelector('button')?.click()
    await attendre(300)

    // 3. Le tableau se construit.
    const ouvrirCompare = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Comparer' && !b.closest('[role=menu]'))
    ouvrirCompare?.click()
    await attendre(500)
    const table = document.querySelector('[role=dialog] table')
    const lignes = table ? table.querySelectorAll('tbody tr').length : 0
    const colonnes = table ? table.querySelectorAll('thead th').length : 0

    document.querySelector('[role=dialog] [aria-label="Fermer la comparaison"]')?.click()
    await attendre(200)
    ;[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Vider')?.click()

    return { aComparer, aListe, refuse, lignes, colonnes }
  })

  if (collection.erreur) failures.push(`[collection] ${collection.erreur}`)
  else {
    if (!collection.aComparer) failures.push('[collection] le menu contextuel ne propose pas « Comparer »')
    if (!collection.aListe) failures.push('[collection] le menu contextuel ne propose pas « Ajouter à une liste »')
    if (collection.refuse) failures.push('[collection] deux armes sont refusees a la comparaison')
    if (collection.lignes < 3) failures.push(`[collection] tableau de comparaison quasi vide (${collection.lignes} lignes)`)
    // 1 colonne d'intitules + 2 elements.
    if (collection.colonnes !== 3) failures.push(`[collection] ${collection.colonnes} colonnes au lieu de 3`)
    console.log(`     comparateur : ${collection.lignes} lignes x ${collection.colonnes - 1} elements`)
  }

  // --- Persistance du build ------------------------------------------------
  // Le build local est stocke sous forme de slugs (format 2) et re-resolu au
  // chargement contre les donnees courantes. Si cette resolution casse, le
  // planner repart vide sans le moindre message : on la verifie ici.
  //
  // L'ecriture se fait depuis une AUTRE page : tant que le planner est monte
  // avec un build vide, son effet de persistance efface la cle.
  await visit('', 'retour base de donnees (avant test de persistance)')

  const encoded = '~' + lzString.compressToEncodedURIComponent(JSON.stringify([null, ['m16a2']]))
  await page.evaluate((payload) => {
    localStorage.setItem('div2_current_build', JSON.stringify({ v: 2, b: payload }))
  }, encoded)

  await visit('#/planner', 'planner avec build restaure')

  const restaure = await page.evaluate(() => {
    const raw = localStorage.getItem('div2_current_build')
    return {
      armeVisible: /M16A2/i.test(document.body.innerText),
      format: raw ? JSON.parse(raw).v : null,
      brut: raw,
    }
  })

  if (!restaure.armeVisible) {
    failures.push('[persistance] le build stocke n a pas ete restaure dans le planner')
  }
  if (restaure.format !== 2) {
    failures.push(`[persistance] format de stockage inattendu apres restauration : ${restaure.brut}`)
  }

  await page.evaluate(() => localStorage.removeItem('div2_current_build'))

  // --- Bibliotheque et changelog ------------------------------------------
  await visit('#/library', 'buildotheque')
  await visit('#/changelog', 'changelog')

} catch (e) {
  failures.push(`[fatal] ${e.message}`)
} finally {
  if (browser) await browser.close().catch(() => {})
  if (server) await server.close().catch(() => {})
}

if (failures.length > 0) {
  console.error(`\nSmoke test : ECHEC (${failures.length} probleme(s))\n`)
  failures.forEach(f => console.error('  ' + f))
  process.exit(1)
}

console.log('\nSmoke test : OK — l application se charge et affiche ses donnees.')
process.exit(0)
