import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadEmbedData, buildIconIndex } from './discord-embed.mjs'
import { writeSitePages } from './site-pages.mjs'
import { renderAppPage, markdownToHtml } from './static-page.mjs'

const BASE_URL = 'https://joint-task-french.github.io/BDDFr'

/** Gabarit minimal ayant la forme du index.html produit par Vite. */
const TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JTFr — BDDFr</title>
  <meta name="description" content="ancienne">
  <meta property="og:title" content="ancien">
  <script type="module" crossorigin src="/BDDFr/assets/index.js"></script>
</head>
<body>
<div id="root"></div>
</body>
</html>`

describe('pages statiques indexables', () => {
  let dist
  let result
  const read = (p) => fs.readFileSync(path.join(dist, p, 'index.html'), 'utf-8')

  beforeAll(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'bddfr-pages-'))
    fs.writeFileSync(path.join(dist, 'index.html'), TEMPLATE)
    result = writeSitePages({
      distDir: dist,
      baseUrl: BASE_URL,
      data: loadEmbedData('./src/data'),
      iconIndex: buildIconIndex('./src/img/game_assets'),
      pagesDir: './src/content/pages',
    })
  })
  afterAll(() => fs.rmSync(dist, { recursive: true, force: true }))

  it("sert l'app elle-meme au lieu d'une redirection JS vers /#/ (invisible pour Google)", () => {
    const html = read('db/armes/acr')
    expect(html).not.toMatch(/location\.replace/)
    expect(html).toContain('src="/BDDFr/assets/index.js"')
    expect(html).toMatch(/<div id="root"><!--prerender--><main class="prerender">[\s\S]*<h1>ACR<\/h1>/)
  })

  it('remplace les balises du gabarit par celles de la page', () => {
    const html = read('db/armes/acr')
    expect(html.match(/<title>/g)).toHaveLength(1)
    expect(html).toContain('<title>ACR — The Division 2 | BDDFr</title>')
    expect(html).not.toContain('ancien')
    expect(html).toContain(`<link rel="canonical" href="${BASE_URL}/db/armes/acr/">`)
    expect(html).toContain('id="discord:component-embed"')
  })

  it('le sitemap ne liste que des URLs canoniques (slash final) qui existent', () => {
    const urls = [...fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf-8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    expect(urls.length).toBe(result.pages)
    expect(new Set(urls).size).toBe(urls.length)
    for (const url of urls) {
      expect(url.endsWith('/'), url).toBe(true)
      const rel = url.slice(BASE_URL.length + 1)
      const html = fs.readFileSync(path.join(dist, rel, 'index.html'), 'utf-8')
      expect(html, url).toContain(`<link rel="canonical" href="${url}">`)
    }
  })

  it('les pages de categorie lient chaque fiche (exploration par les robots)', () => {
    const html = read('db/armes')
    expect(html).toContain(`href="${BASE_URL}/db/armes/acr/"`)
  })

  it("l'accueil est reecrit avec son contenu et reste un gabarit valide pour un second passage", () => {
    const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8')
    expect(home).toContain(`<link rel="canonical" href="${BASE_URL}/">`)
    // Le generateur avec images repart du index.html deja traite.
    const again = renderAppPage(home, { title: 'X — BDDFr', description: 'd', url: `${BASE_URL}/x/`, imageUrl: `${BASE_URL}/i.png`, contentHtml: '<p>x</p>' })
    expect(again.match(/<!--prerender-->/g)).toHaveLength(1)
    expect(again.match(/rel="canonical"/g)).toHaveLength(1)
  })

  it('404 et pages non publiques : noindex et hors sitemap', () => {
    expect(fs.readFileSync(path.join(dist, '404.html'), 'utf-8')).toContain('<meta name="robots" content="noindex">')
    expect(read('generator')).toContain('<meta name="robots" content="noindex">')
    expect(fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf-8')).not.toContain('/generator/')
  })

  it('echappe le HTML des donnees', () => {
    expect(markdownToHtml('<script>x</script> **gras**')).toBe('<p>&lt;script&gt;x&lt;/script&gt; <strong>gras</strong></p>')
  })
})
