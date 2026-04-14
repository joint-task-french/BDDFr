import { useMemo } from 'react'
import { useBuild } from '../context/BuildContext'

/**
 * Mapping attribut essentiel → catégorie de core.
 */
function resolveCoreCategory(essentialName, attributs) {
  if (!essentialName) return null
  const norm = essentialName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (!attributs) return null
  const match = Object.values(attributs).find(a => {
    if (!a.estEssentiel || !a.cible?.includes('equipement')) return false
    const aNorm = a.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const slugNorm = a.slug.toLowerCase().replace(/_/g, ' ')
    return aNorm === norm || aNorm.includes(norm) || norm.includes(aNorm) || slugNorm.includes(norm) || norm.includes(slugNorm)
  })
  if (match) return match.categorie
  
  if (norm.includes('degat') || norm.includes('arme') || norm.includes('offensif')) return 'offensif'
  if (norm.includes('protect') || norm.includes('armure') || norm.includes('defensif')) return 'defensif'
  if (norm.includes('competence') || norm.includes('tier') || norm.includes('utilitaire')) return 'utilitaire'
  return null
}

function normCat(cat) {
  if (!cat) return 'autre'
  return cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Hook qui calcule toutes les statistiques du build actuel.
 */
export function useBuildStats(data) {
  const build = useBuild()

  // Helper pour résoudre les informations d'un attribut ou d'une statistique
  const resolveAttrInfo = (attrSlug) => {
    if (!attrSlug) return { nom: '', unite: '%', categorie: 'autre' }

    const def = data.attributs?.[attrSlug]
    if (def) return { 
      nom: def.nom, 
      unite: def.unite || '%', 
      categorie: def.categorie || 'autre', 
      min: def.min, 
      max: def.max, 
      statistiques: def.statistiques 
    }

    const stat = data.statistiques?.[attrSlug]
    if (stat) {
      // Déduire la catégorie de la statistique si absente
      let cat = stat.categorie || ''
      if (!cat) {
        // Tenter de trouver la catégorie dans la montre
        if (data.montre?.categories) {
          for (const [catKey, category] of Object.entries(data.montre.categories)) {
            const hasMatch = category.stats && (
              category.stats[attrSlug] || 
              Object.values(category.stats).some(s => s.statistique === attrSlug || s.target === attrSlug)
            )
            if (hasMatch) {
              cat = catKey
              break
            }
          }
        }
      }
      if (!cat) {
        const norm = attrSlug.toLowerCase()
        if (norm.includes('degat') || norm.includes('critique') || norm.includes('headshot') || norm.includes('arme') || norm.includes('cadence')) cat = 'offensif'
        else if (norm.includes('protect') || norm.includes('armure') || norm.includes('resistance') || norm.includes('sante')) cat = 'defensif'
        else if (norm.includes('competence') || norm.includes('recup') || norm.includes('duree')) cat = 'utilitaire'
        else if (norm.includes('maniement') || norm.includes('precision') || norm.includes('stabilite') || norm.includes('rechargement') || norm.includes('chargeur') || norm.includes('munitions') || norm.includes('echange')) cat = 'maniement'
        else cat = 'autre'
      }
      return { nom: stat.nom, unite: '%', categorie: cat }
    }

    // Fallback pour les slugs inconnus (ex: targets de la montre)
    const norm = attrSlug.toLowerCase()
    let cat = 'autre'
    
    // Tenter de trouver la catégorie dans la montre pour les fallbacks aussi
    if (data.montre?.categories) {
      for (const [catKey, category] of Object.entries(data.montre.categories)) {
        const hasMatch = category.stats && (
          category.stats[attrSlug] || 
          Object.values(category.stats).some(s => s.statistique === attrSlug || s.target === attrSlug)
        )
        if (hasMatch) {
          cat = catKey
          break
        }
      }
    }
    
    if (cat === 'autre') {
      if (norm.includes('degat') || norm.includes('critique') || norm.includes('headshot') || norm.includes('arme') || norm.includes('cadence')) cat = 'offensif'
      else if (norm.includes('protect') || norm.includes('armure') || norm.includes('resistance') || norm.includes('sante')) cat = 'defensif'
      else if (norm.includes('competence') || norm.includes('recup') || norm.includes('duree')) cat = 'utilitaire'
      else if (norm.includes('maniement') || norm.includes('precision') || norm.includes('stabilite') || norm.includes('rechargement') || norm.includes('chargeur') || norm.includes('munitions') || norm.includes('echange')) cat = 'maniement'
    }

    return { 
      nom: attrSlug.replace(/_arm$|_eqp$|_mod$/, '').replace(/_shd$/, ' (Montre)').replace(/_/g, ' '), 
      unite: '%', 
      categorie: cat 
    }
  }

  return useMemo(() => {
    // console.log("useBuildStats: recalculating due to build/data change", build.shdLevels)
    if (!data.attributs || !data.statistiques) {
      return {
        coreStats: { offensif: 0, defensif: 0, utilitaire: 0 },
        weaponStats: [],
        attributesByCategory: { offensif: [], defensif: [], utilitaire: [], maniement: [], autre: [] },
        setBonuses: { gearSets: [], brandSets: [] },
        allAttributeTotals: {},
        totalGearPieces: 0,
        totalWeapons: 0,
        equippedSkills: [],
        equippedTalents: [],
        specialisation: null,
        shdLevels: build.shdLevels
      }
    }

    // --------------------------------------------------------------------------
    // 1: Récupération des statistiques de la montre
    // --------------------------------------------------------------------------
    const watchStats = {}
    if (build.shdLevels && data.montre?.categories) {
      Object.entries(data.montre.categories).forEach(([catKey, category]) => {
        if (!category.stats) return
        Object.entries(category.stats).forEach(([statId, config]) => {
          const level = build.shdLevels?.[statId] || 0
          if (level > 0) {
            const val = level * config.ratio
            // On utilise la statistique cible définie dans le JSONC, sinon l'ID de la stat
            const targetSlug = config.statistique || config.target || statId
            watchStats[statId] = {
              nom: config.label || config.nom || statId,
              total: val,
              unite: config.unite || '%',
              categorie: catKey,
              slug: targetSlug,
              sourceNom: "Montre SHD"
            }
          }
        })
      })
    }

    // --------------------------------------------------------------------------
    // Calcul des bonus d'ensemble (prérequis pour les étapes 2, 3, 4)
    // --------------------------------------------------------------------------
    const ensemblesMap = data.ensembles || {}
    const counts = {}
    let wildcardCount = 0
    for (const slot of Object.keys(build.gear || {})) {
      const piece = build.gear[slot]
      if (!piece?.marque) continue
      if (piece.marque === '*') wildcardCount++
      else counts[piece.marque] = (counts[piece.marque] || 0) + 1
    }
    if (wildcardCount > 0) {
      for (const marqueSlug of Object.keys(counts)) counts[marqueSlug] += wildcardCount
    }

    const setAttributeTotals = {}
    const gearSets = []
    const brandSets = []
    
    const parseAndAddBonus = (bonus) => {
      if (!bonus) return
      if (typeof bonus === 'string') {
        const match = bonus.match(/^\+?([0-9.,]+)(%?)\s+(.+)$/)
        if (match) {
          const val = parseFloat(match[1].replace(',', '.'))
          const hasPercent = match[2] === '%'
          const label = match[3].trim().toLowerCase()
          let foundSlug = null
          const attrMatch = Object.entries(data.attributs).find(([slug, def]) => 
            def.nom.toLowerCase() === label || label.includes(def.nom.toLowerCase())
          )
          if (attrMatch) foundSlug = attrMatch[0]
          else {
            const statMatch = Object.entries(data.statistiques).find(([slug, def]) => 
              def.nom.toLowerCase() === label || label.includes(def.nom.toLowerCase())
            )
            if (statMatch) foundSlug = statMatch[0]
          }
          if (foundSlug) {
            const info = resolveAttrInfo(foundSlug)
            if (!setAttributeTotals[foundSlug]) {
              setAttributeTotals[foundSlug] = { 
                nom: info.nom, 
                total: 0, 
                unite: hasPercent ? '%' : info.unite, 
                categorie: info.categorie, 
                slug: foundSlug 
              }
            }
            setAttributeTotals[foundSlug].total += val
          }
        }
      } else if (bonus.attributs) {
        for (const attr of bonus.attributs) {
          if (attr.slug) {
            const info = resolveAttrInfo(attr.slug)
            if (!setAttributeTotals[attr.slug]) {
              setAttributeTotals[attr.slug] = { 
                nom: info.nom, 
                total: 0, 
                unite: info.unite || '%', 
                categorie: info.categorie, 
                slug: attr.slug 
              }
            }
            setAttributeTotals[attr.slug].total += attr.value
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

    // --------------------------------------------------------------------------
    // 2, 3, 4: Récupération des statistiques de l'équipement (Offensif, Défensif, Utilitaire)
    // --------------------------------------------------------------------------
    const gearTotals = { offensif: {}, defensif: {}, utilitaire: {}, maniement: {}, autre: {} }
    
    const addStatToGear = (slug, val, cat) => {
      if (!slug || val == null) return
      const nc = normCat(cat)
      const target = gearTotals[nc] || gearTotals.autre
      if (!target[slug]) target[slug] = 0
      target[slug] += val
    }

    // Parcourir chaque slot de pièce d'équipement
    for (const slot of Object.keys(build.gear || {})) {
      // Attributs classiques et essentiels
      const attrs = build.gearAttributes?.[slot]
      if (attrs) {
        [...(attrs.essentiels || []), ...(attrs.classiques || [])].forEach(a => {
          if (a.valeur != null) addStatToGear(a.slug || a.nom, a.valeur, a.categorie)
        })
      }
      // Mods d'équipement
      const mods = build.gearMods?.[slot]
      if (mods) {
        const modArray = Array.isArray(mods) ? mods : [mods]
        modArray.forEach((mod, modIdx) => {
          if (mod?.attributs) {
            mod.attributs.forEach(entry => {
              const info = resolveAttrInfo(entry.attribut)
              const userVal = build.modValues?.gearMods?.[slot]?.[modIdx]?.[entry.attribut]
              const val = entry.valeur != null ? entry.valeur : (userVal != null ? userVal : (info.max || 0))
              addStatToGear(entry.attribut, val, info.categorie)
            })
          }
        })
      }
    }

    // Ajouter les bonus d'ensemble calculés précédemment
    Object.values(setAttributeTotals).forEach(entry => {
      addStatToGear(entry.slug, entry.total, entry.categorie)
    })

    // --------------------------------------------------------------------------
    // 5: Fusionner les statistiques récolté avec celles présente dans la montre 
    // --------------------------------------------------------------------------
    const globalMerged = {}
    
    // On collecte toutes les sources (Watch + Gear)
    const allSources = [
      ...Object.values(watchStats),
      ...Object.entries(gearTotals).flatMap(([cat, stats]) => 
        Object.entries(stats).map(([slug, val]) => {
          const info = resolveAttrInfo(slug)
          return { slug, total: val, categorie: cat, unite: info.unite, sourceNom: "Équipement" }
        })
      )
    ]

    // On fusionne vers les statistiques cibles du jeu
    allSources.forEach(src => {
      const info = resolveAttrInfo(src.slug)
      const targets = info.statistiques || [src.slug]
      targets.forEach(t => {
        if (!globalMerged[t]) globalMerged[t] = { 
          total: 0, 
          unite: src.unite || '%',
          categorie: src.categorie || info.categorie,
          sources: [] 
        }
        globalMerged[t].total += src.total
        globalMerged[t].sources.push({ nom: src.sourceNom, valeur: src.total, unite: src.unite })
      })
    })

    // --------------------------------------------------------------------------
    // 6: Récupération des statistiques des armes (chaque arme séparément fusionnée)
    // --------------------------------------------------------------------------
    const finalWeapons = []
    const weaponSlots = [
      { key: 'weapon0', data: build.weapons[0], attrs: build.weaponAttributes[0], mods: build.weaponMods[0], talent: build.weaponTalents[0], label: 'Primaire' },
      { key: 'weapon1', data: build.weapons[1], attrs: build.weaponAttributes[1], mods: build.weaponMods[1], talent: build.weaponTalents[1], label: 'Secondaire' },
      { key: 'sidearm', data: build.sidearm, attrs: build.sidearmAttribute, mods: build.sidearmMods, talent: build.sidearmTalent, label: 'Poing' },
      { key: 'special', data: build.specialWeapon, attrs: null, mods: null, talent: null, label: 'Spécifique' }
    ]

    weaponSlots.forEach(slot => {
      if (!slot.data) return
      
      const wStats = {}
      const groupedStats = {}

      const addStat = (slug, val, sourceNom, sourceUnite) => {
        if (!slug || val === 0) return
        const info = resolveAttrInfo(slug)
        const targets = info.statistiques || [slug]
        targets.forEach(t => {
          const targetInfo = resolveAttrInfo(t)
          if (!wStats[t]) wStats[t] = 0
          wStats[t] += val

          if (!groupedStats[t]) {
            const targetInfo = resolveAttrInfo(t)
            // Filtrer : On ne garde pour l'arme que ce qui est offensif ou maniement
            if (targetInfo.categorie !== 'offensif' && targetInfo.categorie !== 'maniement') return

            groupedStats[t] = {
              nom: targetInfo.nom,
              total: 0,
              unite: targetInfo.unite || sourceUnite || '%',
              sources: []
            }
          }
          groupedStats[t].total += val
          groupedStats[t].sources.push({ nom: sourceNom, valeur: val, unite: sourceUnite || info.unite })
        })
      }

      // Initialiser avec les stats globales (Équipement + Montre)
      Object.entries(globalMerged).forEach(([slug, entry]) => {
        entry.sources.forEach(src => {
          addStat(slug, src.valeur, src.nom, src.unite)
        })
      })

      // Ajouter les attributs spécifiques à l'arme
      const ownAttrs = Array.isArray(slot.attrs) ? slot.attrs : (slot.attrs ? [slot.attrs] : [])
      ownAttrs.forEach(a => {
        addStat(a.slug || a.nom, a.valeur, "Attribut d'arme")
      })

      // Ajouter les mods de l'arme
      if (slot.mods) {
        slot.mods.forEach(mod => {
          if (mod.attributs) {
            mod.attributs.forEach(entry => {
              addStat(entry.attribut, entry.valeur, mod.nom || "Mod d'arme")
            })
          }
        })
      }
      
      // Ajouter les attributs par défaut/essentiels de l'arme (ex: DTH sur AR)
      const typeData = data.armes_type?.[slot.data.type]
      const essVals = build.weaponEssentialValues?.[slot.key] || {}
      const essentials = slot.data.attributs_essentiels || (typeData?.attributs_essentiels?.map(slug => ({ nom: slug })) || [])
      essentials.forEach(ess => {
        const slug = ess.nom
        const attrDef = data.attributs?.[slug]
        if (!attrDef) return
        const val = ess.valeur != null ? ess.valeur : (essVals[slug] != null ? essVals[slug] : attrDef.max)
        addStat(slug, val, "Bonus de type")
      })

      // Bonus d'expertise de l'arme
      const expertiseLvl = build.expertise?.[slot.key] || 0
      if (expertiseLvl > 0) {
        addStat('degats_arme', expertiseLvl, "Expertise")
      }
      
      // --------------------------------------------------------------------------
      // Calcul des dégâts selon la formule :
      // DMG = BASE x (1+AWD%) x (1+TWD%) x (1+HSD%+CHD%) x (1+DTA%/DTH%) x (1+DTOOC%) x (1+AMP%)
      // --------------------------------------------------------------------------
      const base = slot.data.degatsBase || 0
      
      // TWD (Total Weapon Damage) = Global (Montre + Cores Rouges)
      const twd = (wStats['degats_arme'] || 0) / 100
      // AWD (All Weapon Damage?) = Spécifique au type
      const typeStatSlug = typeData?.statistique
      const awd = (wStats[typeStatSlug] || 0) / 100
      
      const hsd = ( (slot.data.headshot || 0) + (wStats['degats_headshot'] || 0) ) / 100
      const chd = (wStats['degats_coup_critique'] || 0) / 100
      const chc = Math.min(60, (wStats['probabilite_coup_critique'] || 0)) / 100
      
      const dta = (wStats['degats_protections'] || 0) / 100
      const dth = (wStats['degats_sante'] || 0) / 100
      const dtooc = (wStats['degats_cible_non_abritee'] || 0) / 100
      
      // Multiplicateur AMP (Talents/Buffs)
      const amp = 1

      // Dégâts de base calculés (BASE x AWD x TWD x AMP)
      const dmgCalculated = base * (1 + awd) * (1 + twd) * amp
      
      const calcDmg = (isCrit, isHeadshot, vsProtection) => {
        let critHsdMult = 1
        if (isCrit && isHeadshot) critHsdMult = (1 + hsd + chd)
        else if (isCrit) critHsdMult = (1 + chd)
        else if (isHeadshot) critHsdMult = (1 + hsd)
        
        const vsMult = vsProtection ? (1 + dta) : (1 + dth)
        return Math.round(dmgCalculated * critHsdMult * vsMult * (1 + dtooc))
      }

      const effectiveDamages = {
        protection: {
          body: calcDmg(false, false, true),
          crit: calcDmg(true, false, true),
          headshot: calcDmg(false, true, true),
          headshotCrit: calcDmg(true, true, true)
        },
        health: {
          body: calcDmg(false, false, false),
          crit: calcDmg(true, false, false),
          headshot: calcDmg(false, true, false),
          headshotCrit: calcDmg(true, true, false)
        }
      }

      const avgDamages = {
        protection: {
          body: Math.round(effectiveDamages.protection.body * (1 - chc) + effectiveDamages.protection.crit * chc),
          headshot: Math.round(effectiveDamages.protection.headshot * (1 - chc) + effectiveDamages.protection.headshotCrit * chc)
        },
        health: {
          body: Math.round(effectiveDamages.health.body * (1 - chc) + effectiveDamages.health.crit * chc),
          headshot: Math.round(effectiveDamages.health.headshot * (1 - chc) + effectiveDamages.health.headshotCrit * chc)
        }
      }

      finalWeapons.push({
        ...slot.data,
        nom: slot.data.nom,
        type: slot.data.type,
        slot: slot.label,
        degatsAffiche: Math.round(dmgCalculated),
        effectiveDamages,
        avgDamages,
        weaponStats: wStats,
        groupedStats,
        chc: Math.round(chc * 100 * 10) / 10,
        chd: Math.round(chd * 100 * 10) / 10,
        hsd: Math.round(hsd * 100 * 10) / 10,
        dta: Math.round(dta * 100 * 10) / 10,
        dth: Math.round(dth * 100 * 10) / 10,
        dtooc: Math.round(dtooc * 100 * 10) / 10,
        twd: Math.round(twd * 100 * 10) / 10,
        awd: Math.round(awd * 100 * 10) / 10,
        expertise: expertiseLvl
      })
    })

    // --------------------------------------------------------------------------
    // 7: Renvoyé les statistiques globales et individuelles
    // --------------------------------------------------------------------------
    
    // Calcul de l'armure totale (Protection)
    const gearTypes = data.equipements_type || data['equipements-type'] || {}
    const metadata = data.metadata || {}
    let baseArmor = metadata.baseArmorDefault || 0
    let expertiseArmor = 0
    for (const slot of Object.keys(build.gear || {})) {
      if (build.gear[slot]) {
        const pb = gearTypes[slot]?.protectionBase || 0
        baseArmor += pb
        expertiseArmor += (pb * (build.expertise?.[slot] || 0) * 0.01)
      }
    }
    const armorBonusPoints = globalMerged['protection']?.total || 0
    const armorBonusPercent = (globalMerged['protection_shd']?.total || 0) + (globalMerged['protection_percent']?.total || 0)
    const finalArmor = Math.round((baseArmor + expertiseArmor + armorBonusPoints) * (1 + (armorBonusPercent / 100)))

    // Regrouper les statistiques globales par catégorie pour l'affichage
    const displayStats = { offensif: [], defensif: [], utilitaire: [], maniement: [], autre: [] }
    Object.entries(globalMerged).forEach(([slug, entry]) => {
      const info = resolveAttrInfo(slug)
      const nc = normCat(entry.categorie || info.categorie)
      if (displayStats[nc]) {
        displayStats[nc].push({ 
          slug, 
          nom: info.nom, 
          total: entry.total, 
          unite: entry.unite,
          sources: entry.sources // Passer les sources pour l'affichage détaillé
        })
      }
    })

    // Ajouter l'armure totale calculée dans la catégorie défensive avec sources
    displayStats.defensif.push({ 
      slug: 'protection_totale', 
      nom: "Armure totale", 
      total: finalArmor, 
      unite: "pts",
      sources: [
        { nom: "Armure de base", valeur: baseArmor, unite: "pts" },
        ...(expertiseArmor > 0 ? [{ nom: "Expertise", valeur: expertiseArmor, unite: "pts" }] : []),
        ...(armorBonusPoints > 0 ? [{ nom: "Bonus fixes", valeur: armorBonusPoints, unite: "pts" }] : []),
        ...(armorBonusPercent > 0 ? [{ nom: "Bonus %", valeur: armorBonusPercent, unite: "%" }] : [])
      ]
    })

    const { counts: coreCounts, sources: coreSources } = calculateCores(build.gearAttributes, build.gear, ensemblesMap, data.attributs)

    return {
      coreStats: coreCounts,
      coreSources: coreSources,
      weaponStats: finalWeapons,
      attributesByCategory: displayStats,
      setBonuses: { gearSets, brandSets },
      allAttributeTotals: globalMerged,
      totalGearPieces: Object.values(build.gear || {}).filter(Boolean).length,
      totalWeapons: [build.weapons?.[0], build.weapons?.[1], build.sidearm, build.specialWeapon].filter(Boolean).length,
      equippedSkills: (build.skills || []).filter(Boolean),
      equippedTalents: getEquippedTalents(build),
      specialisation: build.specialisation,
      shdLevels: build.shdLevels // Exposer pour faciliter le debug/suivi si besoin
    }

  }, [build, data])
}

// --- Fonctions Helpers auxiliaires ---

function calculateCores(gearAttributes, gear, ensemblesMap, attributsRepo) {
  const counts = { offensif: 0, defensif: 0, utilitaire: 0 }
  const sources = { offensif: [], defensif: [], utilitaire: [] }
  const slots = ['masque', 'torse', 'holster', 'sac_a_dos', 'gants', 'genouilleres']
  
  slots.forEach(slot => {
    const piece = gear?.[slot]
    if (!piece) return
    
    const attrs = gearAttributes?.[slot]
    if (attrs?.essentiels && attrs.essentiels.length > 0) {
      attrs.essentiels.forEach(ess => {
        const nc = normCat(ess.categorie)
        if (counts[nc] !== undefined) {
          counts[nc]++
          sources[nc].push({ nom: slot.charAt(0).toUpperCase() + slot.slice(1), valeur: 1 })
        }
      })
    } else {
      // Fallback sur l'ensemble si pas d'attribut sélectionné
      const ensemble = (piece.marque && piece.marque !== '*') ? ensemblesMap[piece.marque] : null
      if (ensemble?.attributsEssentiels) {
        ensemble.attributsEssentiels.forEach(essName => {
          const cat = resolveCoreCategory(essName, attributsRepo)
          const nc = normCat(cat)
          if (counts[nc] !== undefined) {
            counts[nc]++
            sources[nc].push({ nom: `${slot.charAt(0).toUpperCase() + slot.slice(1)} (${ensemble.nom})`, valeur: 1 })
          }
        })
      }
    }
  })

  // Vérifier aussi les bonus d'ensemble qui pourraient donner des coeurs (ex: +1 Tier compétence)
  // Note: On peut itérer sur setAttributeTotals s'il contient des 'niveau_competence' etc.
  
  return { counts, sources }
}

function getEquippedTalents(build) {
  const talents = []
  if (build.weaponTalents) build.weaponTalents.forEach((t, i) => { if (t) talents.push({ slot: `Arme ${i + 1}`, ...t }) })
  if (build.sidearmTalent) talents.push({ slot: 'Poing', ...build.sidearmTalent })
  if (build.gearTalents) {
    for (const [slot, t] of Object.entries(build.gearTalents)) {
      if (t) talents.push({ slot, ...t })
    }
  }
  return talents
}
