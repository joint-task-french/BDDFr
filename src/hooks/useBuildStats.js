import { useMemo } from 'react'
import { useBuild } from '../context/BuildContext'

/**
 * Mapping attribut essentiel → catégorie de core.
 * Les ensembles utilisent des slugs (degats_arme, protection, tiers_de_competence).
 */
function resolveCoreCategory(essentialName, attributs) {
  if (!essentialName) return null
  // Mapping direct des slugs utilisés dans les ensembles
  const slugMap = {
    'degats_arme': 'offensif',
    'protection': 'défensif',
    'tiers_de_competence': 'utilitaire',
  }
  if (slugMap[essentialName]) return slugMap[essentialName]
  // Fallback : chercher par nom dans les attributs
  if (!attributs) return null
  const norm = essentialName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const match = attributs.find(a => {
    if (!a.estEssentiel || !a.cible?.includes('equipement')) return false
    const aNorm = a.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return aNorm === norm || aNorm.includes(norm) || norm.includes(aNorm)
  })
  if (match) return match.categorie
  if (norm.includes('degat') || norm.includes('arme')) return 'offensif'
  if (norm.includes('protect') || norm.includes('armure')) return 'defensif'
  if (norm.includes('competence') || norm.includes('tier')) return 'utilitaire'
  return null
}

function normCat(cat) {
  if (!cat) return 'autre'
  return cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Hook qui calcule toutes les statistiques du build actuel.
 * Toutes les données viennent du context et des fichiers JSONC.
 */
export function useBuildStats(data) {
  const build = useBuild()

  // Ensembles indexés par slug
  const ensemblesMap = useMemo(() => {
    const map = {}
    if (data.ensembles) {
      for (const e of data.ensembles) {
        if (e.slug) map[e.slug] = e
      }
    }
    return map
  }, [data.ensembles])

  // Comptage des cores — basé sur l'attribut essentiel réellement sélectionné
  const coreStats = useMemo(() => {
    const counts = { offensif: 0, defensif: 0, utilitaire: 0 }
    for (const slot of Object.keys(build.gear || {})) {
      const piece = build.gear[slot]
      if (!piece) continue
      const attrs = build.gearAttributes[slot]
      if (attrs?.essentiels) {
        for (const ess of attrs.essentiels) {
          if (!ess?.categorie) continue
          const nc = normCat(ess.categorie)
          if (counts[nc] !== undefined) counts[nc]++
        }
      } else {
        // Fallback: si pas encore d'attribut sélectionné, utiliser l'ensemble
        const ensemble = (piece.marque && piece.marque !== '*') ? ensemblesMap[piece.marque] : null
        if (ensemble?.attributsEssentiels?.length > 0) {
          for (const essName of ensemble.attributsEssentiels) {
            const cat = resolveCoreCategory(essName, data.attributs)
            if (!cat) continue
            const nc = normCat(cat)
            if (counts[nc] !== undefined) counts[nc]++
          }
        }
      }
    }
    return counts
  }, [build.gear, build.gearAttributes, ensemblesMap, data.attributs])

  // Agrégation des attributs d'équipement
  // Les attributs offensifs d'équipement affectent toutes les armes (comme les mods d'équipement)
  const { gearAttributeTotals, offensiveGearAttributeTotals } = useMemo(() => {
    const totals = {}
    const offensiveTotals = {}
    const addAttr = (a) => {
      if (!a?.nom || a.valeur == null) return
      const key = a.slug || a.nom
      if (!totals[key]) totals[key] = { nom: a.nom, slug: a.slug, total: 0, unite: a.unite || '', categorie: a.categorie || '' }
      totals[key].total += a.valeur
      // Les attributs offensifs d'équipement affectent les armes
      const cat = normCat(a.categorie)
      if (cat === 'offensif') {
        if (!offensiveTotals[key]) offensiveTotals[key] = { nom: a.nom, slug: a.slug, total: 0, unite: a.unite || '', categorie: a.categorie || '' }
        offensiveTotals[key].total += a.valeur
      }
    }
    for (const slot of Object.keys(build.gear || {})) {
      const attrs = build.gearAttributes[slot]
      if (!attrs) continue
      if (attrs.essentiels) attrs.essentiels.forEach(addAttr)
      if (attrs.classiques) attrs.classiques.forEach(addAttr)
    }
    return { gearAttributeTotals: totals, offensiveGearAttributeTotals: offensiveTotals }
  }, [build.gear, build.gearAttributes])

  // Agrégation des attributs d'armes (attribut libre choisi par le joueur)
  const weaponAttributeTotals = useMemo(() => {
    const totals = {}
    const addAttr = (a) => {
      if (!a?.nom || a.valeur == null) return
      const key = a.slug || a.nom
      if (!totals[key]) totals[key] = { nom: a.nom, slug: a.slug, total: 0, unite: a.unite || '', categorie: a.categorie || '' }
      totals[key].total += a.valeur
    }
    if (build.weaponAttributes) build.weaponAttributes.forEach(a => addAttr(a))
    if (build.sidearmAttribute) addAttr(build.sidearmAttribute)
    return totals
  }, [build.weaponAttributes, build.sidearmAttribute])

  // Helper: résoudre unité + nom depuis le référentiel d'attributs ou statistiques
  const resolveAttrInfo = (attrSlug) => {
    const def = data.attributs?.find(a => a.slug === attrSlug)
    if (def) return { nom: def.nom, unite: def.unite || '%', categorie: def.categorie || '' }
    const stat = data.statistiques?.find(s => s.slug === attrSlug)
    if (stat) return { nom: stat.nom, unite: '%', categorie: '' }
    return { nom: attrSlug.replace(/_arm$|_eqp$|_mod$/, '').replace(/_/g, ' '), unite: '%', categorie: '' }
  }

  /**
   * Calcule les stats de mods pour un ensemble de mods donné.
   */
  const computeModStats = (mods) => {
    const totals = {}
    if (!mods) return totals
    const arr = Array.isArray(mods) ? mods : [mods]
    for (const mod of arr) {
      if (!mod?.attributs || !Array.isArray(mod.attributs)) continue
      for (const entry of mod.attributs) {
        if (!entry.attribut || entry.valeur == null) continue
        const info = resolveAttrInfo(entry.attribut)
        const key = entry.attribut
        if (!totals[key]) totals[key] = { nom: info.nom, total: 0, unite: info.unite, categorie: info.categorie }
        totals[key].total += entry.valeur
      }
    }
    return totals
  }

  // Bonus de mods d'équipement (affectent le joueur globalement → s'appliquent à toutes les armes)
  const gearModTotals = useMemo(() => {
    const totals = {}
    for (const slotMods of Object.values(build.gearMods || {})) {
      const modArray = Array.isArray(slotMods) ? slotMods : [slotMods]
      for (const mod of modArray) {
        if (!mod?.attributs || !Array.isArray(mod.attributs)) continue
        for (const entry of mod.attributs) {
          if (!entry.attribut || entry.valeur == null) continue
          const info = resolveAttrInfo(entry.attribut)
          const key = entry.attribut
          if (!totals[key]) totals[key] = { nom: info.nom, total: 0, unite: info.unite, categorie: info.categorie }
          totals[key].total += entry.valeur
        }
      }
    }
    return totals
  }, [build.gearMods, data.attributs])

  /**
   * Résout le slug de statistique cible pour un attribut ou un mod.
   * Un attribut dans attributs.jsonc a un champ statistiques: [slug1, slug2, ...].
   * Un slug de mod d'arme peut déjà être un slug de statistique.
   */
  const resolveStatSlugs = (attrSlug) => {
    // D'abord chercher dans attributs.jsonc
    const attrDef = data.attributs?.find(a => a.slug === attrSlug)
    if (attrDef?.statistiques?.length) return attrDef.statistiques
    // Vérifier si c'est directement un slug de statistique
    const stat = data.statistiques?.find(s => s.slug === attrSlug)
    if (stat) return [attrSlug]
    return [attrSlug] // fallback
  }

  /**
   * Regroupe un objet totalStats par statistique cible.
   * Chaque attribut est regroupé sous la statistique qu'il affecte.
   */
  const groupStatsByTarget = (totalStats) => {
    const grouped = {} // { statSlug: { nom, total, unite, categorie, sources: [{nom, valeur, unite}] } }
    for (const [attrKey, entry] of Object.entries(totalStats)) {
      const statSlugs = resolveStatSlugs(attrKey)
      for (const statSlug of statSlugs) {
        const statDef = data.statistiques?.find(s => s.slug === statSlug)
        const statName = statDef?.nom || entry.nom
        if (!grouped[statSlug]) {
          grouped[statSlug] = {
            nom: statName,
            total: 0,
            unite: entry.unite,
            categorie: entry.categorie,
            sources: [],
          }
        }
        grouped[statSlug].total += entry.total
        grouped[statSlug].sources.push({ nom: entry.nom, valeur: entry.total, unite: entry.unite })
      }
    }
    return grouped
  }

  /**
   * Statistiques PAR ARME : chaque arme a ses propres mods d'arme + les mods d'équipement +
   * les attributs offensifs d'équipement + les valeurs essentielles de l'arme.
   * Les stats d'arme ne se cumulent PAS entre les armes.
   */
  const weaponStats = useMemo(() => {
    const exp = build.expertise || {}
    const essVals = build.weaponEssentialValues || {}
    const stats = []

    const buildWeaponStat = (weapon, weaponMods, expertiseKey, slotLabel, weaponAttr) => {
      if (!weapon) return null
      const base = weapon.degatsBase || 0
      const lvl = exp[expertiseKey] || 0
      // Mods spécifiques à cette arme
      const ownModStats = computeModStats(weaponMods)
      // Fusionner : mods d'arme + mods d'équipement + attributs offensifs d'équipement
      const allStats = {}
      const mergeIn = (source) => {
        for (const [key, entry] of Object.entries(source)) {
          if (!allStats[key]) allStats[key] = { ...entry }
          else allStats[key] = { ...allStats[key], total: allStats[key].total + entry.total }
        }
      }
      mergeIn(ownModStats)
      mergeIn(gearModTotals)
      mergeIn(offensiveGearAttributeTotals)

      // Attributs essentiels de l'arme (valeurs personnalisées par le joueur)
      const slotEssVals = essVals[expertiseKey] || {}
      const essentials = weapon.attributs_essentiels || []
      for (const ess of essentials) {
        if (!ess?.nom) continue
        const attrDef = data.attributs?.find(a => a.slug === ess.nom)
        if (!attrDef) continue
        const hasPredef = ess.valeur != null
        const val = hasPredef ? ess.valeur : (slotEssVals[ess.nom] != null ? slotEssVals[ess.nom] : attrDef.max)
        const key = ess.nom
        if (!allStats[key]) allStats[key] = { nom: attrDef.nom, total: 0, unite: attrDef.unite || '%', categorie: attrDef.categorie || '' }
        allStats[key].total += val
      }
      // Si pas d'attributs_essentiels sur l'arme, utiliser ceux du type
      if (!essentials.length && data.armes_type) {
        const typeData = data.armes_type[weapon.type]
        if (typeData?.attributs_essentiels) {
          for (const slug of typeData.attributs_essentiels) {
            const attrDef = data.attributs?.find(a => a.slug === slug)
            if (!attrDef) continue
            const val = slotEssVals[slug] != null ? slotEssVals[slug] : attrDef.max
            if (!allStats[slug]) allStats[slug] = { nom: attrDef.nom, total: 0, unite: attrDef.unite || '%', categorie: attrDef.categorie || '' }
            allStats[slug].total += val
          }
        }
      }

      // Attribut libre choisi par le joueur
      if (weaponAttr?.nom && weaponAttr.valeur != null) {
        const key = weaponAttr.slug || weaponAttr.nom
        if (!allStats[key]) allStats[key] = { nom: weaponAttr.nom, total: 0, unite: weaponAttr.unite || '%', categorie: weaponAttr.categorie || '' }
        allStats[key].total += weaponAttr.valeur
      }

      return {
        nom: weapon.nom,
        type: weapon.type,
        slot: slotLabel,
        degatsBase: base,
        degatsExpertise: Math.round(base * (1 + lvl * 0.01)),
        expertise: lvl,
        modStats: ownModStats,
        totalStats: allStats,
        groupedStats: groupStatsByTarget(allStats),
      }
    }

    const w0 = buildWeaponStat(build.weapons?.[0], build.weaponMods?.[0], 'weapon0', 'Primaire', build.weaponAttributes?.[0])
    if (w0) stats.push(w0)
    const w1 = buildWeaponStat(build.weapons?.[1], build.weaponMods?.[1], 'weapon1', 'Secondaire', build.weaponAttributes?.[1])
    if (w1) stats.push(w1)
    const ws = buildWeaponStat(build.sidearm, build.sidearmMods, 'sidearm', 'Poing', build.sidearmAttribute)
    if (ws) stats.push(ws)

    return stats
  }, [build.weapons, build.sidearm, build.weaponMods, build.sidearmMods, build.expertise, build.weaponEssentialValues, build.weaponAttributes, build.sidearmAttribute, gearModTotals, offensiveGearAttributeTotals, data.attributs, data.armes_type, data.statistiques])

  // Totaux combinés (équipement + attributs d'armes choisis + mods d'équipement)
  // Les mods d'armes ne sont PAS inclus ici — ils sont spécifiques à chaque arme
  const allAttributeTotals = useMemo(() => {
    const combined = {}
    const mergeIn = (source) => {
      for (const [nom, entry] of Object.entries(source)) {
        if (!combined[nom]) combined[nom] = { ...entry }
        else combined[nom].total += entry.total
      }
    }
    mergeIn(gearAttributeTotals)
    mergeIn(weaponAttributeTotals)
    mergeIn(gearModTotals)
    return combined
  }, [gearAttributeTotals, weaponAttributeTotals, gearModTotals])

  // Attributs groupés par catégorie
  const attributesByCategory = useMemo(() => {
    const groups = { offensif: [], defensif: [], utilitaire: [], autre: [] }
    for (const entry of Object.values(allAttributeTotals)) {
      const nc = normCat(entry.categorie)
      if (groups[nc]) groups[nc].push(entry)
      else groups.autre.push(entry)
    }
    return groups
  }, [allAttributeTotals])

  // Bonus d'ensemble / marque
  // Les pièces avec marque "*" (wildcard, ex: Sac Ninja Bike) comptent comme +1 pièce
  // pour CHAQUE autre ensemble/marque présent dans le build.
  const setBonuses = useMemo(() => {
    const counts = {}
    let wildcardCount = 0
    for (const slot of Object.keys(build.gear || {})) {
      const piece = build.gear[slot]
      if (!piece?.marque) continue
      if (piece.marque === '*') {
        wildcardCount++
      } else {
        counts[piece.marque] = (counts[piece.marque] || 0) + 1
      }
    }
    // Les wildcards ajoutent +1 à chaque ensemble déjà présent
    if (wildcardCount > 0) {
      for (const marqueSlug of Object.keys(counts)) {
        counts[marqueSlug] += wildcardCount
      }
    }
    const gearSets = []
    const brandSets = []
    for (const [marqueSlug, count] of Object.entries(counts)) {
      const ensemble = ensemblesMap[marqueSlug]
      if (!ensemble) continue
      const bonuses = []
      if (ensemble.bonus1piece) bonuses.push({ pieces: 1, text: ensemble.bonus1piece, active: count >= 1 })
      if (ensemble.bonus2pieces) bonuses.push({ pieces: 2, text: ensemble.bonus2pieces, active: count >= 2 })
      if (ensemble.bonus3pieces) bonuses.push({ pieces: 3, text: ensemble.bonus3pieces, active: count >= 3 })
      if (ensemble.bonus4pieces) bonuses.push({ pieces: 4, text: ensemble.bonus4pieces, active: count >= 4 })
      const entry = { slug: marqueSlug, nom: ensemble.nom, type: ensemble.type, count, maxPieces: ensemble.type === 'gear_set' ? 6 : 3, bonuses }
      if (ensemble.type === 'gear_set') gearSets.push(entry)
      else brandSets.push(entry)
    }
    gearSets.sort((a, b) => b.count - a.count)
    brandSets.sort((a, b) => b.count - a.count)
    return { gearSets, brandSets }
  }, [build.gear, ensemblesMap])

  // Mods d'armes équipés
  const equippedWeaponMods = useMemo(() => {
    const mods = []
    if (build.weaponMods) {
      build.weaponMods.forEach((slotMods, i) => {
        if (!slotMods) return
        const arr = Array.isArray(slotMods) ? slotMods : [slotMods]
        arr.forEach(m => { if (m) mods.push({ slot: `Arme ${i + 1}`, ...m }) })
      })
    }
    if (build.sidearmMods) {
      const arr = Array.isArray(build.sidearmMods) ? build.sidearmMods : [build.sidearmMods]
      arr.forEach(m => { if (m) mods.push({ slot: 'Poing', ...m }) })
    }
    return mods
  }, [build.weaponMods, build.sidearmMods])

  // Mods d'équipement équipés
  const equippedGearMods = useMemo(() => {
    const mods = []
    for (const [slot, slotMods] of Object.entries(build.gearMods || {})) {
      const modArray = Array.isArray(slotMods) ? slotMods : [slotMods]
      modArray.forEach((mod, idx) => {
        if (mod) mods.push({ slot: modArray.length > 1 ? `${slot} (${idx + 1})` : slot, ...mod })
      })
    }
    return mods
  }, [build.gearMods])

  // Compétences
  const equippedSkills = useMemo(() => (build.skills || []).filter(Boolean), [build.skills])

  // Spécialisation
  const specialisation = build.specialisation
  const specialisationLabel = specialisation ? build.SPECIALISATIONS?.[specialisation]?.label : null

  // Compteurs
  const totalGearPieces = useMemo(() => Object.values(build.gear || {}).filter(Boolean).length, [build.gear])
  const totalWeapons = useMemo(() => {
    let c = 0
    if (build.specialWeapon) c++
    if (build.weapons?.[0]) c++
    if (build.weapons?.[1]) c++
    if (build.sidearm) c++
    return c
  }, [build.specialWeapon, build.weapons, build.sidearm])

  // Talents équipés
  const equippedTalents = useMemo(() => {
    const talents = []
    // Armes
    if (build.weaponTalents) build.weaponTalents.forEach((t, i) => { if (t) talents.push({ slot: `Arme ${i + 1}`, ...t }) })
    if (build.sidearmTalent) talents.push({ slot: 'Poing', ...build.sidearmTalent })
    // Équipement
    if (build.gearTalents) {
      for (const [slot, t] of Object.entries(build.gearTalents)) {
        if (t) talents.push({ slot, ...t })
      }
    }
    return talents
  }, [build.weaponTalents, build.sidearmTalent, build.gearTalents])

  return {
    coreStats,
    allAttributeTotals,
    attributesByCategory,
    weaponStats,
    gearModTotals,
    setBonuses,
    equippedWeaponMods,
    equippedGearMods,
    equippedSkills,
    equippedTalents,
    specialisation,
    specialisationLabel,
    totalGearPieces,
    totalWeapons,
  }
}