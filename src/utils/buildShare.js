import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

const GEAR_ORDER = ['masque', 'torse', 'holster', 'sac_a_dos', 'gants', 'genouilleres']
const ALL_SLOTS = ['weapon0', 'weapon1', 'sidearm', ...GEAR_ORDER]

function trimArray(arr) {
  if (!arr || !Array.isArray(arr)) return null
  let i = arr.length
  while (i > 0 && (arr[i - 1] === null || arr[i - 1] === undefined)) i--
  return i === 0 ? null : arr.slice(0, i)
}

export function encodeBuild(state) {
  const wev = {}
  for (const [slotKey, vals] of Object.entries(state.weaponEssentialValues || {})) {
    if (vals && Object.keys(vals).length > 0) wev[slotKey] = vals
  }

  let mv = null
  if (state.modValues) {
    const tempMv = {}
    const gmv = state.modValues.gearMods || {}
    if (Object.keys(gmv).length > 0) tempMv.g = gmv
    const smv = state.modValues.skillMods || {}
    if (Object.keys(smv).length > 0) tempMv.s = smv
    if (Object.keys(tempMv).length > 0) mv = tempMv
  }

  const arr = [
    state.specialWeapon?.slug || state.specialWeapon?.nom || null,
    trimArray((state.weapons || []).map(w => w?.slug || w?.nom || null)),
    trimArray((state.weaponTalents || []).map(t => t?.slug || t?.nom || null)),
    state.sidearm?.slug || state.sidearm?.nom || null,
    state.sidearmTalent?.slug || state.sidearmTalent?.nom || null,
    trimArray(GEAR_ORDER.map(slot => state.gear?.[slot] ? (state.gear[slot].slug || state.gear[slot].nom) : null)),
    trimArray([
      state.gearTalents?.torse ? (state.gearTalents.torse.slug || state.gearTalents.torse.nom) : null,
      state.gearTalents?.sac_a_dos ? (state.gearTalents.sac_a_dos.slug || state.gearTalents.sac_a_dos.nom) : null
    ]),
    trimArray((state.skills || []).map(s => s ? [s.competenceSlug || s.competence, s.slug || s.variante] : null)),
    trimArray((state.weaponAttributes || []).map(a => a ? [a.slug || a.nom, a.valeur] : null)),
    state.sidearmAttribute ? [state.sidearmAttribute.slug || state.sidearmAttribute.nom, state.sidearmAttribute.valeur] : null,
    trimArray(GEAR_ORDER.map(slot => {
      const attrs = state.gearAttributes?.[slot]
      if (!attrs) return null
      const e = trimArray((attrs.essentiels || []).map(a => a ? [a.slug || a.nom, a.valeur] : null))
      const c = trimArray((attrs.classiques || []).map(a => a ? [a.slug || a.nom, a.valeur] : null))
      if (!e && !c) return null
      return [e || null, c || null]
    })),
    trimArray((state.weaponMods || []).map(mods => trimArray(mods?.map(m => m?.slug || m?.nom || null)))),
    trimArray((state.sidearmMods || []).map(m => m?.slug || m?.nom || null)),
    trimArray(GEAR_ORDER.map(slot => {
      const mods = state.gearMods?.[slot]
      if (!mods) return null
      return trimArray((Array.isArray(mods) ? mods : [mods]).map(m => m ? (m.slug || m.statistique) : null))
    })),
    trimArray((state.skillMods || []).map(m => m ? (m.slug || null) : null)),
    trimArray(ALL_SLOTS.map(slot => state.expertise?.[slot] || null)),
    trimArray(ALL_SLOTS.map(slot => state.prototypes?.[slot] ? 1 : null)),
    trimArray(ALL_SLOTS.map(slot => state.prototypeTalents?.[slot] ? (state.prototypeTalents[slot].slug || state.prototypeTalents[slot].nom) : null)),
    Object.keys(wev).length > 0 ? wev : null,
    mv
  ]

  const finalArr = trimArray(arr) || []
  if (finalArr.length === 0) return ''

  return '~' + compressToEncodedURIComponent(JSON.stringify(finalArr))
}

export function decodeBuild(encoded) {
  if (!encoded) return null
  try {
    if (encoded.startsWith('~')) {
      const json = decompressFromEncodedURIComponent(encoded.slice(1))
      const arr = JSON.parse(json)
      const compact = {}

      if (arr[0]) compact.sw = arr[0]
      if (arr[1]) compact.w = arr[1]
      if (arr[2]) compact.wt = arr[2]
      if (arr[3]) compact.sa = arr[3]
      if (arr[4]) compact.sat = arr[4]
      if (arr[5]) compact.g = arr[5]
      if (arr[6]) compact.gt = arr[6]
      if (arr[7]) compact.s = arr[7]
      if (arr[8]) compact.wa = arr[8]
      if (arr[9]) compact.saa = arr[9]
      if (arr[10]) compact.ga = arr[10]
      if (arr[11]) compact.wm = arr[11]
      if (arr[12]) compact.sam = arr[12]
      if (arr[13]) compact.gm = arr[13]
      if (arr[14]) compact.sm = arr[14]
      if (arr[15]) compact.exp = arr[15]
      if (arr[16]) compact.p = arr[16]
      if (arr[17]) compact.pt = arr[17]
      if (arr[18]) compact.wev = arr[18]
      if (arr[19]) compact.mv = arr[19]

      return compact
    }

    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function resolveBuild(compact, data) {
  if (!compact || !data) return null

  const findBySlugOrName = (items, id, nameField = 'nom') => {
    if (!id || !items) return null
    const list = Array.isArray(items) ? items : Object.values(items)
    const lower = id.toLowerCase()
    return list.find(i => i.slug === id || (i.slug && i.slug.toLowerCase() === lower)) ||
        list.find(i => (i[nameField] || '').toLowerCase() === lower) || null
  }

  const findWeapon = (id) => {
    if (!id) return null
    const found = findBySlugOrName(data.armes || [], id)
    if (found) return found
    const specs = Array.isArray(data.classSpe) ? data.classSpe : Object.values(data.classSpe || {})
    for (const spec of specs) {
      if (spec.cle === id || spec.slug === id || spec.arme?.nom?.toLowerCase() === id.toLowerCase()) {
        return {
          nom: spec.arme.nom, slug: spec.slug || spec.cle, type: 'arme_specifique',
          portee: spec.arme.portee, rpm: spec.arme.rpm, chargeur: spec.arme.chargeur,
          rechargement: spec.arme.rechargement, headshot: spec.arme.headshot, degatsBase: spec.arme.degatsBase,
        }
      }
    }
    return null
  }

  const findWeaponTalent = (id) => findBySlugOrName(data.talentsArmes || [], id)
  const findPrototypeTalent = (id) => findBySlugOrName(data.talentsPrototypes || [], id)
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

  build.specialWeapon = findWeapon(compact.sw)

  build.weapons = (compact.w || [null, null]).map(n => findWeapon(n))
  while (build.weapons.length < 2) build.weapons.push(null)

  build.weaponTalents = (compact.wt || [null, null]).map(n => findWeaponTalent(n))
  while (build.weaponTalents.length < 2) build.weaponTalents.push(null)

  build.sidearm = findWeapon(compact.sa)
  build.sidearmTalent = findWeaponTalent(compact.sat)

  build.gear = { masque: null, torse: null, holster: null, sac_a_dos: null, gants: null, genouilleres: null }
  if (compact.g) {
    if (Array.isArray(compact.g)) {
      GEAR_ORDER.forEach((slot, i) => build.gear[slot] = findGear(compact.g[i]))
    } else {
      for (const [slot, id] of Object.entries(compact.g)) build.gear[slot] = findGear(id)
    }
  }

  build.gearTalents = { torse: null, sac_a_dos: null }
  if (compact.gt) {
    if (Array.isArray(compact.gt)) {
      build.gearTalents.torse = findGearTalent(compact.gt[0])
      build.gearTalents.sac_a_dos = findGearTalent(compact.gt[1])
    } else {
      for (const [slot, id] of Object.entries(compact.gt)) build.gearTalents[slot] = findGearTalent(id)
    }
  }

  build.skills = (compact.s || [null, null]).map(s => {
    if (!s) return null
    const c = Array.isArray(s) ? s[0] : s.c
    const v = Array.isArray(s) ? s[1] : s.v
    return findSkill(c, v)
  })
  while (build.skills.length < 2) build.skills.push(null)

  const resolveAttr = (compactAttr) => {
    if (!compactAttr || !data.attributs) return null
    const n = Array.isArray(compactAttr) ? compactAttr[0] : compactAttr.n
    const v = Array.isArray(compactAttr) ? compactAttr[1] : compactAttr.v
    const ref = findBySlugOrName(data.attributs, n)
    if (!ref) return { nom: n, valeur: v }
    return { ...ref, valeur: v }
  }

  build.weaponAttributes = (compact.wa || [null, null]).map(a => resolveAttr(a))
  while (build.weaponAttributes.length < 2) build.weaponAttributes.push(null)
  build.sidearmAttribute = resolveAttr(compact.saa)

  build.gearAttributes = {}
  if (compact.ga) {
    if (Array.isArray(compact.ga)) {
      GEAR_ORDER.forEach((slot, i) => {
        if (compact.ga[i]) {
          build.gearAttributes[slot] = {
            essentiels: (compact.ga[i][0] || []).map(a => resolveAttr(a)),
            classiques: (compact.ga[i][1] || []).map(a => resolveAttr(a)),
          }
        }
      })
    } else {
      for (const [slot, entry] of Object.entries(compact.ga)) {
        build.gearAttributes[slot] = {
          essentiels: (entry.e || []).map(a => resolveAttr(a)),
          classiques: (entry.c || []).map(a => resolveAttr(a)),
        }
      }
    }
  }

  const findModArme = (id) => findBySlugOrName(data.modsArmes || [], id)
  build.weaponMods = (compact.wm || [null, null]).map(slotMods => slotMods ? slotMods.map(id => findModArme(id)) : null)
  while (build.weaponMods.length < 2) build.weaponMods.push(null)
  build.sidearmMods = compact.sam ? compact.sam.map(id => findModArme(id)) : null

  build.gearMods = {}
  if (compact.gm) {
    if (Array.isArray(compact.gm)) {
      GEAR_ORDER.forEach((slot, i) => {
        if (compact.gm[i]) build.gearMods[slot] = compact.gm[i].map(id => findBySlugOrName(data.modsEquipements || [], id, 'statistique') || null)
      })
    } else {
      for (const [slot, ids] of Object.entries(compact.gm)) {
        const idArray = Array.isArray(ids) ? ids : [ids]
        build.gearMods[slot] = idArray.map(id => findBySlugOrName(data.modsEquipements || [], id, 'statistique') || null)
      }
    }
  }

  const findModComp = (id) => findBySlugOrName(data.modsCompetences || [], id)
  build.skillMods = (compact.sm || [null, null]).map(id => {
    if (!id) return null
    if (Array.isArray(id)) return id[0] ? findModComp(id[0]) : null
    return findModComp(id)
  })
  while (build.skillMods.length < 2) build.skillMods.push(null)

  build.expertise = { weapon0: 0, weapon1: 0, sidearm: 0, masque: 0, torse: 0, holster: 0, sac_a_dos: 0, gants: 0, genouilleres: 0 }
  if (compact.exp) {
    if (Array.isArray(compact.exp)) {
      ALL_SLOTS.forEach((slot, i) => { if (compact.exp[i]) build.expertise[slot] = compact.exp[i] })
    } else {
      for (const [slot, level] of Object.entries(compact.exp)) build.expertise[slot] = level
    }
  }

  build.prototypes = { weapon0: false, weapon1: false, sidearm: false, masque: false, torse: false, holster: false, sac_a_dos: false, gants: false, genouilleres: false }
  if (compact.p) {
    if (Array.isArray(compact.p)) {
      ALL_SLOTS.forEach((slot, i) => { if (compact.p[i]) build.prototypes[slot] = true })
    } else {
      for (const [slot, val] of Object.entries(compact.p)) build.prototypes[slot] = !!val
    }
  }

  build.prototypeTalents = { weapon0: null, weapon1: null, sidearm: null, masque: null, torse: null, holster: null, sac_a_dos: null, gants: null, genouilleres: null }
  if (compact.pt) {
    if (Array.isArray(compact.pt)) {
      ALL_SLOTS.forEach((slot, i) => { if (compact.pt[i]) build.prototypeTalents[slot] = findPrototypeTalent(compact.pt[i]) })
    } else {
      for (const [slot, id] of Object.entries(compact.pt)) build.prototypeTalents[slot] = findPrototypeTalent(id)
    }
  }

  build.weaponEssentialValues = { weapon0: {}, weapon1: {}, sidearm: {} }
  if (compact.wev) {
    for (const [slotKey, vals] of Object.entries(compact.wev)) build.weaponEssentialValues[slotKey] = vals || {}
  }

  build.modValues = { gearMods: {}, skillMods: {} }
  if (compact.mv) {
    if (compact.mv.g) build.modValues.gearMods = compact.mv.g
    if (compact.mv.s) build.modValues.skillMods = compact.mv.s
  }

  return build
}

export function generateShareUrl(state) {
  const encoded = encodeBuild(state)
  if (!encoded) return null
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
  return `${window.location.origin}${base}/build?b=${encoded}`
}