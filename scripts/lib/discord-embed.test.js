import { describe, it, expect } from 'vitest'
import {
  loadEmbedData, loadCategoryItems, descenteLevels, itemEmbed, staticPageEmbed, documentEmbed,
  serializePayload, payloadBytes, countComponents, buildComponentEmbed, injectIntoHtml, renderEmbedTag,
  CATEGORY_FILES, COMPONENT, MAX_PAYLOAD_BYTES, MAX_COMPONENTS, MAX_GALLERY_ITEMS, MAX_URL_LENGTH,
} from './discord-embed.mjs'

const BASE_URL = 'https://joint-task-french.github.io/BDDFr'
const data = loadEmbedData('./src/data')

/** Cles autorisees par la doc Discord : toute autre cle invalide le payload entier. */
const ALLOWED_KEYS = {
  [COMPONENT.CONTAINER]: ['type', 'spoiler', 'accent_color', 'components'],
  [COMPONENT.SECTION]: ['type', 'components', 'accessory'],
  [COMPONENT.TEXT_DISPLAY]: ['type', 'content'],
  [COMPONENT.THUMBNAIL]: ['type', 'media', 'description', 'spoiler'],
  [COMPONENT.MEDIA_GALLERY]: ['type', 'items'],
  [COMPONENT.SEPARATOR]: ['type', 'spacing'],
  [COMPONENT.ACTION_ROW]: ['type', 'components'],
  [COMPONENT.BUTTON]: ['id', 'type', 'url', 'style', 'label', 'emoji', 'disabled'],
}

const isMediaUrl = (u) => typeof u === 'string' && /^https?:\/\//.test(u) && u.length <= MAX_URL_LENGTH

/** Retourne la liste des violations (vide = payload conforme). */
function violations(payload) {
  const errors = []
  if (!payload || Object.keys(payload).join() !== 'component') return ['racine != { component }']
  const root = payload.component
  if (root.type !== COMPONENT.CONTAINER) errors.push('racine non Container')
  if (payloadBytes(payload) > MAX_PAYLOAD_BYTES) errors.push(`taille ${payloadBytes(payload)} > ${MAX_PAYLOAD_BYTES}`)
  if (countComponents(root) > MAX_COMPONENTS) errors.push('trop de composants')

  let galleryItems = 0
  const visit = (node, depth) => {
    const allowed = ALLOWED_KEYS[node.type]
    if (!allowed) return errors.push(`type inconnu ${node.type}`)
    Object.keys(node).filter(k => !allowed.includes(k)).forEach(k => errors.push(`cle interdite ${k} sur type ${node.type}`))
    if (node.type === COMPONENT.CONTAINER && depth > 0) errors.push('Container imbrique')
    if (node.type === COMPONENT.TEXT_DISPLAY && !node.content) errors.push('Text Display vide')
    if (node.type === COMPONENT.BUTTON) {
      if (node.style !== 5) errors.push('bouton non lien')
      if (!node.label && !node.emoji) errors.push('bouton sans label ni emoji')
      if (!isMediaUrl(node.url)) errors.push(`url bouton invalide ${node.url}`)
    }
    if (node.type === COMPONENT.ACTION_ROW && node.components.length > 5) errors.push('plus de 5 boutons par rangee')
    if (node.type === COMPONENT.THUMBNAIL && !isMediaUrl(node.media?.url)) errors.push('miniature invalide')
    if (node.type === COMPONENT.MEDIA_GALLERY) {
      galleryItems += node.items.length
      node.items.forEach(i => { if (!isMediaUrl(i.media?.url)) errors.push('media invalide') })
    }
    ;(node.components || []).forEach(c => visit(c, depth + 1))
    if (node.accessory) visit(node.accessory, depth + 1)
  }
  visit(root, 0)
  if (galleryItems > MAX_GALLERY_ITEMS) errors.push('trop de medias')
  return errors
}

function allItemPayloads() {
  const out = []
  for (const categoryKey of [...Object.keys(CATEGORY_FILES), 'descente']) {
    for (const item of loadCategoryItems(data, categoryKey)) {
      const slug = item.slug
      const variants = categoryKey === 'descente' ? descenteLevels(item) : [null]
      if ((categoryKey === 'talentsArmes' || categoryKey === 'talentsEquipements') && item.perfectDescription) variants.push('parfait')
      if (categoryKey === 'armes' || categoryKey === 'equipements') variants.push('prototype')
      for (const variant of variants) {
        out.push({
          id: `${categoryKey}/${slug}/${variant ?? ''}`,
          payload: itemEmbed({
            data, baseUrl: BASE_URL, categoryKey, item, slug, variant,
            thumbnailPath: `og-icons/${slug}.webp`,
            imagePath: `og-images/${categoryKey}/${slug}.jpg`,
          }),
        })
      }
    }
  }
  return out
}

describe('Discord component embeds', () => {
  const items = allItemPayloads()

  it('couvre toutes les categories, descente comprise', () => {
    const categories = new Set(items.map(i => i.id.split('/')[0]))
    expect([...categories].sort()).toEqual([...Object.keys(CATEGORY_FILES), 'descente'].sort())
  })

  it('produit un payload conforme pour chaque page item', () => {
    const failures = items
      .map(({ id, payload }) => ({ id, errors: payload ? violations(payload) : ['payload null'] }))
      .filter(r => r.errors.length)
    expect(failures).toEqual([])
  })

  it('produit un payload conforme pour les pages statiques et documents', () => {
    const pages = ['', 'db', 'build', 'changelog', 'generator', 'pages', 'library', 'db/armes', 'db/descente']
    for (const pagePath of pages) {
      const payload = staticPageEmbed({ data, baseUrl: BASE_URL, pagePath, title: 'Titre — BDDFr' })
      expect(violations(payload), pagePath).toEqual([])
    }
    const doc = documentEmbed({ data, baseUrl: BASE_URL, pageId: 'prototypes', meta: { title: 'Prototypes', description: 'Guide', tags: ['a', 'b'] } })
    expect(violations(doc)).toEqual([])
  })

  it('garde les boutons vers la BDD et les variantes', () => {
    const weapon = items.find(i => i.id === 'armes/acr/')
    const buttons = weapon.payload.component.components
      .filter(c => c.type === COMPONENT.ACTION_ROW).flatMap(r => r.components)
    expect(buttons.map(b => b.url)).toEqual(expect.arrayContaining([
      `${BASE_URL}/db/armes/acr`,
      `${BASE_URL}/db/armes`,
      `${BASE_URL}/db/armes/acr/prototype`,
    ]))
  })

  it('degrade le contenu plutot que de depasser 3000 octets', () => {
    const payload = buildComponentEmbed({
      title: 'X', body: 'é'.repeat(5000), extra: ['y'.repeat(5000)], stats: Array(30).fill('z'.repeat(200)),
      buttonRows: [[{ label: 'a', url: `${BASE_URL}/a` }]],
    })
    expect(violations(payload)).toEqual([])
  })

  it("n'emet rien sans URL de base absolue", () => {
    const [item] = loadCategoryItems(data, 'armes')
    expect(itemEmbed({ data, baseUrl: '/BDDFr', categoryKey: 'armes', item, slug: item.slug })).toBeNull()
    expect(renderEmbedTag(null)).toBe('')
  })

  it('ne peut pas fermer la balise script hote', () => {
    const payload = buildComponentEmbed({ title: '</script><script>alert(1)</script>', body: '<!-- & -->' })
    expect(serializePayload(payload)).not.toMatch(/[<>]/)
    expect(JSON.parse(serializePayload(payload))).toEqual(payload)
  })

  it("injecte l'embed d'accueil de facon idempotente", () => {
    const payload = staticPageEmbed({ data, baseUrl: BASE_URL, pagePath: '', title: 'JTFr — BDDFr' })
    const once = injectIntoHtml('<html><head><title>t</title></head><body></body></html>', payload)
    const twice = injectIntoHtml(once, payload)
    expect(twice).toBe(once)
    expect(once.match(/discord:component-embed/g)).toHaveLength(1)
  })
})
