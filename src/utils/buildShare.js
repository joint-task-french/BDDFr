// Encodage/décodage de builds pour partage par URL
// Le build est compressé en un objet compact avec uniquement les slugs,
// puis encodé en base64 dans le hash de l'URL.

/**
 * Sérialise le state du build en un objet compact (slugs)
 */
export function serializeBuild(state) {
  const b = {}

  // Arme spécifique (slug ou nom)
  if (state.specialWeapon) b.sw = state.specialWeapon.slug || state.specialWeapon.nom

  // Armes classiques (slugs)
  const w = (state.weapons || []).map(w => w?.slug || w?.nom || null)
  if (w.some(Boolean)) b.w = w

  // Talents d'armes (slugs)
  const wt = (state.weaponTalents || []).map(t => t?.slug || t?.nom || null)
  if (wt.some(Boolean)) b.wt = wt

  // Arme de poing
  if (state.sidearm) b.sa = state.sidearm.slug || state.sidearm.nom
  if (state.sidearmTalent) b.sat = state.sidearmTalent.slug || state.sidearmTalent.nom

  // Équipements (par slot — slugs)
  const g = {}
  for (const [slot, piece] of Object.entries(state.gear || {})) {
    if (piece) g[slot] = piece.slug || piece.nom
  }
  if (Object.keys(g).length > 0) b.g = g

  // Talents d'équipement (slugs)
  const gt = {}
  for (const [slot, talent] of Object.entries(state.gearTalents || {})) {
    if (talent) gt[slot] = talent.slug || talent.nom
  }
  if (Object.keys(gt).length > 0) b.gt = gt

  // Compétences (slugs compétence + variante)
  const s = (state.skills || []).map(s => s ? { c: s.competenceSlug || s.competence, v: s.slug || s.variante } : null)
  if (s.some(Boolean)) b.s = s

  // Attributs d'armes (slug + valeur)
  const wa = (state.weaponAttributes || []).map(a => a ? { n: a.slug || a.nom, v: a.valeur } : null)
  if (wa.some(Boolean)) b.wa = wa
  if (state.sidearmAttribute) b.saa = { n: state.sidearmAttribute.slug || state.sidearmAttribute.nom, v: state.sidearmAttribute.valeur }

  // Attributs d'équipements
  const ga = {}
  for (const [slot, attrs] of Object.entries(state.gearAttributes || {})) {
    if (!attrs) continue
    const entry = {}
    if (attrs.essentiels?.some(Boolean)) entry.e = attrs.essentiels.map(a => a ? { n: a.slug || a.nom, v: a.valeur } : null)
    if (attrs.classiques?.some(Boolean)) entry.c = attrs.classiques.map(a => a ? { n: a.slug || a.nom, v: a.valeur } : null)
    if (Object.keys(entry).length > 0) ga[slot] = entry
  }
  if (Object.keys(ga).length > 0) b.ga = ga

  // Mods d'armes (slugs)
  const wm = (state.weaponMods || []).map(m => m ? m.map(mod => mod?.slug || mod?.nom || null) : null)
  if (wm.some(Boolean)) b.wm = wm
  if (state.sidearmMods) b.sam = state.sidearmMods.map(mod => mod?.slug || mod?.nom || null)

  // Mods d'équipements (slugs)
  const gm = {}
  for (const [slot, mods] of Object.entries(state.gearMods || {})) {
    const modArray = Array.isArray(mods) ? mods : [mods]
    const slugs = modArray.map(m => m ? (m.slug || m.statistique) : null)
    if (slugs.some(Boolean)) gm[slot] = slugs
  }
  if (Object.keys(gm).length > 0) b.gm = gm

  // Mods de compétences (slugs)
  const sm = (state.skillMods || []).map(m => m ? (m.slug || null) : null)
  if (sm.some(Boolean)) b.sm = sm

  // Expertise (niveaux par slot — seulement si > 0)
  const exp = {}
  for (const [slot, level] of Object.entries(state.expertise || {})) {
    if (level > 0) exp[slot] = level
  }
  if (Object.keys(exp).length > 0) b.exp = exp

  // Valeurs des attributs essentiels d'arme (par slot — seulement si modifiées)
  const wev = {}
  for (const [slotKey, vals] of Object.entries(state.weaponEssentialValues || {})) {
    if (vals && Object.keys(vals).length > 0) wev[slotKey] = vals
  }
  if (Object.keys(wev).length > 0) b.wev = wev

  return b
}

/**
 * Encode un build sérialisé en string base64 URL-safe
 */
export function encodeBuild(state) {
  const compact = serializeBuild(state)
  if (Object.keys(compact).length === 0) return ''
  const json = JSON.stringify(compact)
  // Encode en base64 URL-safe
  return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
}

/**
 * Décode un string base64 URL-safe en objet compact de build
 */
export function decodeBuild(encoded) {
  if (!encoded) return null
  try {
    // Restaurer base64 standard
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Résout un build compact (slugs) vers un build complet (objets) en utilisant les données.
 * Compatible avec les anciens liens qui utilisent des noms.
 */
export function resolveBuild(compact, data) {
  if (!compact || !data) return null

  // Helper: cherche par slug puis par nom (rétrocompatibilité)
  const findBySlugOrName = (items, id, nameField = 'nom') => {
    if (!id || !items) return null
    const lower = id.toLowerCase()
    return items.find(i => i.slug === id || i.slug === lower) || items.find(i => (i[nameField] || '').toLowerCase() === lower) || null
  }

  const findWeapon = (id) => {
    if (!id) return null
    const found = findBySlugOrName(data.armes || [], id)
    if (found) return found
    // Search in specialisation weapons (class-spe.jsonc)
    for (const spec of (data.classSpe || [])) {
      if (spec.cle === id || spec.slug === id || spec.arme?.nom?.toLowerCase() === id.toLowerCase()) {
        return {
          nom: spec.arme.nom,
          slug: spec.slug || spec.cle,
          type: 'arme_specifique',
          portee: spec.arme.portee,
          rpm: spec.arme.rpm,
          chargeur: spec.arme.chargeur,
          rechargement: spec.arme.rechargement,
          headshot: spec.arme.headshot,
          degatsBase: spec.arme.degatsBase,
        }
      }
    }
    return null
  }

  const findWeaponTalent = (id) => findBySlugOrName(data.talentsArmes || [], id)
  const findGear = (id) => findBySlugOrName(data.equipements || [], id)
  const findGearTalent = (id) => findBySlugOrName(data.talentsEquipements || [], id)

  const findSkill = (compId, varId) => {
    if (!compId || !varId) return null
    const lc = compId.toLowerCase()
    const lv = varId.toLowerCase()
    return (data.competences || []).find(s =>
        (s.competenceSlug === compId || s.competenceSlug === lc || s.competence.toLowerCase() === lc) &&
        (s.slug === varId || s.slug === lv || s.variante.toLowerCase() === lv)
    ) || null
  }

  const build = {}

  // Arme spécifique
  build.specialWeapon = findWeapon(compact.sw)

  // Armes classiques
  build.weapons = (compact.w || [null, null]).map(n => findWeapon(n))
  while (build.weapons.length < 2) build.weapons.push(null)

  // Talents d'armes
  build.weaponTalents = (compact.wt || [null, null]).map(n => findWeaponTalent(n))
  while (build.weaponTalents.length < 2) build.weaponTalents.push(null)

  // Arme de poing
  build.sidearm = findWeapon(compact.sa)
  build.sidearmTalent = findWeaponTalent(compact.sat)

  // Équipements
  build.gear = { masque: null, torse: null, holster: null, sac_a_dos: null, gants: null, genouilleres: null }
  if (compact.g) {
    for (const [slot, id] of Object.entries(compact.g)) {
      build.gear[slot] = findGear(id)
    }
  }

  // Talents d'équipement
  build.gearTalents = { torse: null, sac_a_dos: null }
  if (compact.gt) {
    for (const [slot, id] of Object.entries(compact.gt)) {
      build.gearTalents[slot] = findGearTalent(id)
    }
  }

  // Compétences
  build.skills = (compact.s || [null, null]).map(s => s ? findSkill(s.c, s.v) : null)
  while (build.skills.length < 2) build.skills.push(null)

  // Attributs d'armes
  const resolveAttr = (compactAttr) => {
    if (!compactAttr || !data.attributs) return null
    const ref = findBySlugOrName(data.attributs, compactAttr.n)
    if (!ref) return { nom: compactAttr.n, valeur: compactAttr.v }
    return { ...ref, valeur: compactAttr.v }
  }
  build.weaponAttributes = (compact.wa || [null, null]).map(a => resolveAttr(a))
  while (build.weaponAttributes.length < 2) build.weaponAttributes.push(null)
  build.sidearmAttribute = resolveAttr(compact.saa)

  // Attributs d'équipements
  build.gearAttributes = {}
  if (compact.ga) {
    for (const [slot, entry] of Object.entries(compact.ga)) {
      build.gearAttributes[slot] = {
        essentiels: (entry.e || []).map(a => resolveAttr(a)),
        classiques: (entry.c || []).map(a => resolveAttr(a)),
      }
    }
  }

  // Mods d'armes
  const findModArme = (id) => findBySlugOrName(data.modsArmes || [], id)
  build.weaponMods = (compact.wm || [null, null]).map(slotMods => slotMods ? slotMods.map(id => findModArme(id)) : null)
  while (build.weaponMods.length < 2) build.weaponMods.push(null)
  build.sidearmMods = compact.sam ? compact.sam.map(id => findModArme(id)) : null

  // Mods d'équipements
  build.gearMods = {}
  if (compact.gm) {
    for (const [slot, ids] of Object.entries(compact.gm)) {
      const idArray = Array.isArray(ids) ? ids : [ids]
      build.gearMods[slot] = idArray.map(id => findBySlugOrName(data.modsEquipements || [], id, 'statistique') || null)
    }
  }

  // Mods de compétences
  const findModComp = (id) => findBySlugOrName(data.modsCompetences || [], id)
  build.skillMods = (compact.sm || [null, null]).map(id => {
    if (!id) return null
    // Ancien format: tableau → prendre le premier
    if (Array.isArray(id)) return id[0] ? findModComp(id[0]) : null
    return findModComp(id)
  })
  while (build.skillMods.length < 2) build.skillMods.push(null)

  // Expertise (niveaux par slot)
  build.expertise = {
    weapon0: 0, weapon1: 0, sidearm: 0,
    masque: 0, torse: 0, holster: 0, sac_a_dos: 0, gants: 0, genouilleres: 0,
  }
  if (compact.exp) {
    for (const [slot, level] of Object.entries(compact.exp)) {
      build.expertise[slot] = level
    }
  }

  // Valeurs des attributs essentiels d'arme
  build.weaponEssentialValues = { weapon0: {}, weapon1: {}, sidearm: {} }
  if (compact.wev) {
    for (const [slotKey, vals] of Object.entries(compact.wev)) {
      build.weaponEssentialValues[slotKey] = vals || {}
    }
  }

  return build
}

export function generateShareUrl(state) {
  const encoded = encodeBuild(state)
  if (!encoded) return null

  const origin = window.location.origin
  const base = import.meta.env.BASE_URL
  return `${origin}${base}build?b=${encoded}`
}