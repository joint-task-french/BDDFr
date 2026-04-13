import { useMemo } from 'react'
import { useBuild } from '../context/BuildContext'

/**
 * Mapping attribut essentiel → catégorie de core.
 * Les ensembles utilisent des slugs (degats_arme, protection, tiers_de_competence).
 */
function resolveCoreCategory(essentialName, attributs) {
  if (!essentialName) return null
  const norm = essentialName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Mapping direct des slugs et catégories courants
  const slugMap = {
    'degats_arme': 'offensif',
    'degats_armes': 'offensif',
    'protection': 'defensif',
    'tiers_de_competence': 'utilitaire',
    'tier_de_competence': 'utilitaire',
    'offensif': 'offensif',
    'defensif': 'defensif',
    'utilitaire': 'utilitaire'
  }
  if (slugMap[norm] || slugMap[essentialName]) return slugMap[norm] || slugMap[essentialName]

  // Fallback : chercher par nom dans les attributs
  if (!attributs) return null
  const match = Object.values(attributs).find(a => {
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

  // Helper: résoudre unité + nom depuis le référentiel d'attributs ou statistiques
  const resolveAttrInfo = (attrSlug) => {
    const def = data.attributs?.[attrSlug]
    if (def) return { nom: def.nom, unite: def.unite || '%', categorie: def.categorie || '', min: def.min, max: def.max }
    const stat = data.statistiques?.[attrSlug]
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

  /**
   * Résout le slug de statistique cible pour un attribut ou un mod.
   */
  const resolveStatSlugs = (attrSlug) => {
    const attrDef = data.attributs?.[attrSlug]
    if (attrDef?.statistiques?.length) return attrDef.statistiques
    const stat = data.statistiques?.[attrSlug]
    if (stat) return [attrSlug]
    return [attrSlug]
  }

  /**
   * Regroupe un objet totalStats par statistique cible.
   */
  const groupStatsByTarget = (totalStats) => {
    const grouped = {}
    for (const [attrKey, entry] of Object.entries(totalStats)) {
      const statSlugs = resolveStatSlugs(attrKey)
      for (const statSlug of statSlugs) {
        const statDef = data.statistiques?.[statSlug]
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

  // Ensembles indexés par slug
  const ensemblesMap = useMemo(() => {
    return data.ensembles || {}
  }, [data.ensembles])

  // Bonus d'ensemble / marque
  const { setBonuses, setAttributeTotals } = useMemo(() => {
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
    if (wildcardCount > 0) {
      for (const marqueSlug of Object.keys(counts)) {
        counts[marqueSlug] += wildcardCount
      }
    }

    const gearSets = []
    const brandSets = []
    const setTotals = {}

    const parseAndAddBonus = (bonus) => {
      if (!bonus) return
      
      if (typeof bonus === 'string') {
        const match = bonus.match(/^\+?([0-9.,]+)(%?)\s+(.+)$/)
        if (match) {
          const val = parseFloat(match[1].replace(',', '.'))
          const hasPercent = match[2] === '%'
          const label = match[3].trim().toLowerCase()
          let foundSlug = null
          if (data.attributs) {
            const attrMatch = Object.entries(data.attributs).find(([slug, def]) => 
              def.nom.toLowerCase() === label || label.includes(def.nom.toLowerCase())
            )
            if (attrMatch) foundSlug = attrMatch[0]
          }
          if (!foundSlug && data.statistiques) {
            const statMatch = Object.entries(data.statistiques).find(([slug, def]) => 
              def.nom.toLowerCase() === label || label.includes(def.nom.toLowerCase())
            )
            if (statMatch) foundSlug = statMatch[0]
          }
          if (foundSlug) {
            const info = resolveAttrInfo(foundSlug)
            if (!setTotals[foundSlug]) {
              setTotals[foundSlug] = { nom: info.nom, total: 0, unite: hasPercent ? '%' : info.unite, categorie: info.categorie, slug: foundSlug }
            }
            setTotals[foundSlug].total += val
          }
        }
      } else if (bonus.attributs) {
        // Nouveau format: objet avec liste d'attributs
        for (const attr of bonus.attributs) {
          const val = attr.value
          const foundSlug = attr.slug
          if (foundSlug) {
            const info = resolveAttrInfo(foundSlug)
            if (!setTotals[foundSlug]) {
              // Déterminer l'unité (pourcentage par défaut, sauf exceptions connues)
              const hasPercent = !(
                foundSlug.includes('taille_chargeur') ||
                foundSlug.includes('capacite_munitions') ||
                foundSlug.includes('utilitaire') ||
                foundSlug.includes('menace') ||
                foundSlug.includes('portee_optimale')
              )
              setTotals[foundSlug] = { nom: info.nom, total: 0, unite: hasPercent ? '%' : info.unite, categorie: info.categorie, slug: foundSlug }
            }
            setTotals[foundSlug].total += val
          }
        }
      }
    }

    for (const [marqueSlug, count] of Object.entries(counts)) {
      const ensemble = ensemblesMap[marqueSlug]
      if (!ensemble) continue
      const bonuses = []
      const checkBonus = (pieces, bonus) => {
        const active = count >= pieces
        bonuses.push({ pieces, text: bonus, active })
        if (active) parseAndAddBonus(bonus)
      }
      if (ensemble.bonus1piece) checkBonus(1, ensemble.bonus1piece)
      if (ensemble.bonus2pieces) checkBonus(2, ensemble.bonus2pieces)
      if (ensemble.bonus3pieces) checkBonus(3, ensemble.bonus3pieces)
      if (ensemble.bonus4pieces) checkBonus(4, ensemble.bonus4pieces)
      const entry = { slug: marqueSlug, nom: ensemble.nom, type: ensemble.type, count, maxPieces: ensemble.type === 'gear_set' ? 4 : 3, bonuses }
      if (ensemble.type === 'gear_set') gearSets.push(entry)
      else brandSets.push(entry)
    }
    gearSets.sort((a, b) => b.count - a.count)
    brandSets.sort((a, b) => b.count - a.count)
    return { setBonuses: { gearSets, brandSets }, setAttributeTotals: setTotals }
  }, [build.gear, ensemblesMap, data.attributs, data.statistiques])

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
        const keyToUse = a.slug || a.nom
        if (!offensiveTotals[keyToUse]) offensiveTotals[keyToUse] = { nom: a.nom, slug: a.slug, total: 0, unite: a.unite || '', categorie: a.categorie || '' }
        offensiveTotals[keyToUse].total += a.valeur
      }
    }
    for (const slot of Object.keys(build.gear || {})) {
      const attrs = build.gearAttributes[slot]
      if (!attrs) continue
      if (attrs.essentiels) attrs.essentiels.forEach(addAttr)
      if (attrs.classiques) attrs.classiques.forEach(addAttr)
    }

    // AJOUT: Inclure les bonus d'ensemble dans les totaux offensifs qui affectent les armes
    for (const [slug, entry] of Object.entries(setAttributeTotals || {})) {
      const cat = normCat(entry.categorie)
      if (cat === 'offensif') {
        if (!offensiveTotals[slug]) offensiveTotals[slug] = { ...entry, total: 0 }
        offensiveTotals[slug].total += entry.total
      }
    }

    return { gearAttributeTotals: totals, offensiveGearAttributeTotals: offensiveTotals }
  }, [build.gear, build.gearAttributes, setAttributeTotals])

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

  // Bonus de mods d'équipement (affectent le joueur globalement → s'appliquent à toutes les armes)
  const gearModTotals = useMemo(() => {
    const totals = {}
    const gmv = build.modValues?.gearMods || {}
    for (const [slot, slotMods] of Object.entries(build.gearMods || {})) {
      const modArray = Array.isArray(slotMods) ? slotMods : [slotMods]
      for (let modIdx = 0; modIdx < modArray.length; modIdx++) {
        const mod = modArray[modIdx]
        if (!mod?.attributs || !Array.isArray(mod.attributs)) continue
        for (const entry of mod.attributs) {
          if (!entry.attribut) continue
          const info = resolveAttrInfo(entry.attribut)
          // Utiliser la valeur fixe si présente, sinon la valeur utilisateur du curseur, sinon le max de l'attribut
          const userVal = gmv[slot]?.[modIdx]?.[entry.attribut]
          const val = entry.valeur != null ? entry.valeur : (userVal != null ? userVal : (info.max != null ? info.max : null))
          if (val == null) continue
          const key = entry.attribut
          if (!totals[key]) totals[key] = { nom: info.nom, total: 0, unite: info.unite, categorie: info.categorie }
          totals[key].total += val
        }
      }
    }
    return totals
  }, [build.gearMods, build.modValues, data.attributs])

  /**
   * Statistiques PAR ARME : chaque arme a ses propres mods d'arme + les mods d'équipement +
   * les attributs offensifs d'équipement + les valeurs essentielles de l'arme.
   * Les stats d'arme ne se cumulent PAS entre les armes.
   */
  const weaponStats = useMemo(() => {
    const exp = build.expertise || {}
    const essVals = build.weaponEssentialValues || {}
    const stats = []

    /** Helper pour sommer toutes les sources d'une statistique spécifique à partir d'une map de stats agrégées par attribut */
    const getStatTotalFromMap = (statsMap, statSlug) => {
      let total = 0
      Object.entries(statsMap).forEach(([attrSlug, entry]) => {
        const actualSlug = entry.slug || attrSlug
        const attrDef = data.attributs?.[actualSlug]
        if (attrDef && attrDef.statistiques && attrDef.statistiques.includes(statSlug)) {
          total += entry.total
        } else if (actualSlug === statSlug) {
          total += entry.total
        }
      })
      return total
    }

    const buildWeaponStat = (weapon, weaponMods, expertiseKey, slotLabel, weaponAttr) => {
      if (!weapon) return null
      const isProto = build.prototypes?.[expertiseKey] || false
      const base = (isProto && weapon.prototypeDegatsBase) ? weapon.prototypeDegatsBase : (weapon.degatsBase || 0)
      const lvl = exp[expertiseKey] || 0
      
      // Récupérer les données du type d'arme
      const typeData = data.armes_type?.[weapon.type]
      const typeStatSlug = typeData?.statistique

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
      
      // On ne fusionne que les stats offensives provenant du gear (mods et attributs)
      // Les stats défensives et utilitaires du gear ne s'appliquent pas à l'affichage de l'arme
      const gearOffensiveStats = {}
      const addOffensiveFrom = (source) => {
        Object.entries(source).forEach(([key, entry]) => {
          const cat = normCat(entry.categorie)
          if (cat === 'offensif') {
            const attrSlug = entry.slug || key
            if (!gearOffensiveStats[attrSlug]) gearOffensiveStats[attrSlug] = { ...entry }
            else gearOffensiveStats[attrSlug].total += entry.total
          }
        })
      }
      
      addOffensiveFrom(gearModTotals)
      addOffensiveFrom(offensiveGearAttributeTotals)
      mergeIn(gearOffensiveStats)

      // Attributs essentiels de l'arme (valeurs personnalisées par le joueur)
      const slotEssVals = essVals[expertiseKey] || {}
      const essentials = weapon.attributs_essentiels || []
      for (const ess of essentials) {
        if (!ess?.nom) continue
        const attrDef = data.attributs?.[ess.nom]
        if (!attrDef) continue
        const hasPredef = ess.valeur != null
        const val = hasPredef ? ess.valeur : (slotEssVals[ess.nom] != null ? slotEssVals[ess.nom] : attrDef.max)
        const key = ess.nom
        if (!allStats[key]) allStats[key] = { nom: attrDef.nom, total: 0, unite: attrDef.unite || '%', categorie: attrDef.categorie || '' }
        allStats[key].total += val
      }
      // Si pas d'attributs_essentiels sur l'arme, utiliser ceux du type
      if (!essentials.length && typeData) {
        if (typeData.attributs_essentiels) {
          for (const slug of typeData.attributs_essentiels) {
            const attrDef = data.attributs?.[slug]
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

      // CALCUL DES DÉGÂTS TOTAUX (Expertise + Dégâts d'arme + Dégâts type + Multiplicateurs)
      const weaponDamageBonus = getStatTotalFromMap(allStats, 'degats_arme')
      const typeDamageBonus = typeStatSlug ? getStatTotalFromMap(allStats, typeStatSlug) : 0
      
      const dta = getStatTotalFromMap(allStats, 'degats_protections')
      const dth = getStatTotalFromMap(allStats, 'degats_sante')
      const ooc = getStatTotalFromMap(allStats, 'degats_cible_non_abritee')

      const hsd = getStatTotalFromMap(allStats, 'degats_headshot') + (weapon.headshot || 0)
      const chd = getStatTotalFromMap(allStats, 'degats_coup_critique')
      const chc = Math.min(60, getStatTotalFromMap(allStats, 'probabilite_coup_critique'))

      const wdMultiplier = 1 + (lvl + weaponDamageBonus + typeDamageBonus) / 100
      const baseModified = base * wdMultiplier

      const calcDmg = (isCrit, isHeadshot, targetStat, oocStat) => {
        let critHsdMult = 1
        if (isCrit && isHeadshot) critHsdMult += (chd + hsd) / 100
        else if (isCrit) critHsdMult += chd / 100
        else if (isHeadshot) critHsdMult += hsd / 100
        
        return Math.round(baseModified * critHsdMult * (1 + targetStat / 100) * (1 + oocStat / 100))
      }

      const effectiveDamages = {
        protection: {
          body: calcDmg(false, false, dta, ooc),
          crit: calcDmg(true, false, dta, ooc),
          headshot: calcDmg(false, true, dta, ooc),
          headshotCrit: calcDmg(true, true, dta, ooc)
        },
        health: {
          body: calcDmg(false, false, dth, ooc),
          crit: calcDmg(true, false, dth, ooc),
          headshot: calcDmg(false, true, dth, ooc),
          headshotCrit: calcDmg(true, true, dth, ooc)
        }
      }

      const chcFactor = chc / 100
      const invChcFactor = 1 - chcFactor

      const avgDmgProtBody = (effectiveDamages.protection.body * invChcFactor) + (effectiveDamages.protection.crit * chcFactor)
      const avgDmgProtHeadshot = (effectiveDamages.protection.headshot * invChcFactor) + (effectiveDamages.protection.headshotCrit * chcFactor)

      const avgDmgHealthBody = (effectiveDamages.health.body * invChcFactor) + (effectiveDamages.health.crit * chcFactor)
      const avgDmgHealthHeadshot = (effectiveDamages.health.headshot * invChcFactor) + (effectiveDamages.health.headshotCrit * chcFactor)

      const multMultiplier = (1 + ooc / 100) * (1 + Math.max(dta, dth) / 100)
      const finalDamage = Math.round(baseModified * multMultiplier)

      const filteredStats = { ...allStats }
      
      const allTypeStatSlugs = Object.values(data.armes_type || {}).map(t => t.statistique).filter(Boolean)
      
      const statsToRemove = [
        'degats_arme', 
        ...allTypeStatSlugs,
        'degats_protections', 
        'degats_sante', 
        'degats_cible_non_abritee', 
        'degats_headshot', 
        'degats_coup_critique', 
        'probabilite_coup_critique'
      ].filter(Boolean)
      
      Object.keys(filteredStats).forEach(attrSlug => {
        const attrDef = data.attributs?.[attrSlug]
        if (attrDef && attrDef.statistiques && attrDef.statistiques.some(s => statsToRemove.includes(s))) {
          delete filteredStats[attrSlug]
        } else if (statsToRemove.includes(attrSlug)) {
          delete filteredStats[attrSlug]
        }
      })

      return {
        nom: weapon.nom,
        type: weapon.type,
        slot: slotLabel,
        degatsBase: base,
        degatsAffiche: finalDamage,
        expertise: lvl,
        modStats: ownModStats,
        totalStats: allStats,
        groupedStats: groupStatsByTarget(filteredStats),
        effectiveDamages,
        avgDamages: { 
          protection: { body: Math.round(avgDmgProtBody), headshot: Math.round(avgDmgProtHeadshot) },
          health: { body: Math.round(avgDmgHealthBody), headshot: Math.round(avgDmgHealthHeadshot) }
        },
        chc,
        chd,
        hsd,
        dta,
        dth,
        ooc
      }
    }

    const w0 = buildWeaponStat(build.weapons?.[0], build.weaponMods?.[0], 'weapon0', 'Primaire', build.weaponAttributes?.[0])
    if (w0) stats.push(w0)
    const w1 = buildWeaponStat(build.weapons?.[1], build.weaponMods?.[1], 'weapon1', 'Secondaire', build.weaponAttributes?.[1])
    if (w1) stats.push(w1)
    const ws = buildWeaponStat(build.sidearm, build.sidearmMods, 'sidearm', 'Poing', build.sidearmAttribute)
    if (ws) stats.push(ws)
    const wsp = buildWeaponStat(build.specialWeapon, null, 'special', 'Spécifique', null)
    if (wsp) stats.push(wsp)

    return stats
  }, [build.weapons, build.sidearm, build.specialWeapon, build.weaponMods, build.sidearmMods, build.expertise, build.weaponEssentialValues, build.weaponAttributes, build.sidearmAttribute, gearModTotals, offensiveGearAttributeTotals, data.attributs, data.armes_type, data.statistiques])

  const allAttributeTotals = useMemo(() => {
    const combined = {}
    const mergeIn = (source) => {
      for (const [slug, entry] of Object.entries(source)) {
        const key = entry.slug || slug
        if (!combined[key]) combined[key] = { ...entry }
        else combined[key].total += entry.total
      }
    }
    mergeIn(gearAttributeTotals)
    mergeIn(gearModTotals)
    mergeIn(setAttributeTotals || {})
    return combined
  }, [gearAttributeTotals, gearModTotals, setAttributeTotals])

  const attributesByCategory = useMemo(() => {
    const groups = { offensif: [], defensif: [], utilitaire: [], autre: [] }
    for (const entry of Object.values(allAttributeTotals)) {
      const nc = normCat(entry.categorie)
      if (groups[nc]) groups[nc].push(entry)
      else groups.autre.push(entry)
    }
    return groups
  }, [allAttributeTotals])

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

  const equippedSkills = useMemo(() => (build.skills || []).filter(Boolean), [build.skills])

  const specialisation = build.specialisation
  const specialisationLabel = specialisation ? build.SPECIALISATIONS?.[specialisation]?.label : null

  const totalGearPieces = useMemo(() => Object.values(build.gear || {}).filter(Boolean).length, [build.gear])
  const totalWeapons = useMemo(() => {
    let c = 0
    if (build.specialWeapon) c++
    if (build.weapons?.[0]) c++
    if (build.weapons?.[1]) c++
    if (build.sidearm) c++
    return c
  }, [build.specialWeapon, build.weapons, build.sidearm])

  const equippedTalents = useMemo(() => {
    const talents = []
    if (build.weaponTalents) build.weaponTalents.forEach((t, i) => { if (t) talents.push({ slot: `Arme ${i + 1}`, ...t }) })
    if (build.sidearmTalent) talents.push({ slot: 'Poing', ...build.sidearmTalent })
    if (build.gearTalents) {
      for (const [slot, t] of Object.entries(build.gearTalents)) {
        if (t) talents.push({ slot, ...t })
      }
    }
    return talents
  }, [build.weaponTalents, build.sidearmTalent, build.gearTalents])

  const calculatedStats = useMemo(() => {
    let baseArmorFromGear = 0
    let armorFromExpertise = 0

    const gearTypes = data.equipements_type || data['equipements-type'] || {}
    
    for (const slot of Object.keys(build.gear || {})) {
      if (build.gear[slot]) {
        const typeInfo = gearTypes[slot]
        if (typeInfo?.protectionBase) {
          const pb = typeInfo.protectionBase
          baseArmorFromGear += pb
          
          const grade = build.expertise?.[slot] || 0
          if (grade > 0) {
            armorFromExpertise += (pb * grade * 0.01)
          }
        }
      }
    }
    
    let totalArmor = baseArmorFromGear

    let armorPoints = 0
    let armorPercent = 0

    const processSource = (sourceMap) => {
      if (!sourceMap) return
      Object.entries(sourceMap).forEach(([slug, entry]) => {
        const isArmor = slug === 'protection' || data.attributs?.[slug]?.statistiques?.includes('protection')
        
        if (isArmor) {
          if (entry.unite === '%') armorPercent += entry.total
          else armorPoints += entry.total
        } else if (slug === 'protection_fixe') {
          armorPoints += entry.total
        }
      })
    }

    processSource(gearAttributeTotals)
    processSource(gearModTotals)
    processSource(setAttributeTotals)

    const armorBeforePercent = totalArmor + armorPoints + armorFromExpertise

    const finalArmor = Math.round(armorBeforePercent * (1 + (armorPercent / 100)))

    return {
      protection_totale: { nom: "Armure totale", total: finalArmor, unite: "pts", categorie: "defensif" },
      protection_base: { nom: "Protection de base (Gear)", total: Math.floor(baseArmorFromGear + armorFromExpertise), unite: "pts", categorie: "defensif" }
    }
  }, [
    allAttributeTotals, 
    build.expertise, 
    build.gear, 
    data.equipements_type, 
    data.attributs,
    setAttributeTotals, 
    gearModTotals, 
    gearAttributeTotals
  ])

  const attributesByCategoryFinal = useMemo(() => {
    const groups = { ...attributesByCategory }
    
    const extraStats = [
      calculatedStats.protection_totale
    ]
    
    if (calculatedStats.protection_base.total > 0) {
      extraStats.push(calculatedStats.protection_base)
    }

    groups.defensif = [
      ...extraStats,
      ...groups.defensif.filter(a => 
        a.nom !== "Armure totale" && 
        a.nom !== "Santé totale" && 
        a.nom !== "Protection de base (Gear)" &&
        a.nom !== "Protection de base (Agent)" &&
        !a.nom?.toLowerCase().includes("santé")
      )
    ]
    
    return groups
  }, [attributesByCategory, calculatedStats])

  return {
    coreStats,
    allAttributeTotals,
    attributesByCategory: attributesByCategoryFinal,
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