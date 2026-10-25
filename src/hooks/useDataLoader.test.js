import { describe, it, expect, beforeAll } from 'vitest'
import {
  getLoadedData,
  getBundledJsoncPaths,
  DATA_FILES_MAP,
  __resetDataCache,
} from './useDataLoader'

/**
 * Test de chargement des donnees.
 *
 * Raison d'etre : deux des vingt-deux JSONC (armes.jsonc, talents-armes.jsonc)
 * ont ete illisibles a l'execution pendant un temps indetermine. L'echec etait
 * invisible — le parseur journalisait puis renvoyait `null` — et la validation
 * passait au vert parce qu'elle utilise un autre parseur.
 *
 * Ce test emprunte exactement le chemin de l'application, donc toute donnee
 * illisible, oubliee ou videe echoue ici, en quelques millisecondes et sans
 * navigateur.
 */

let data

beforeAll(() => {
  __resetDataCache()
  data = getLoadedData()
})

describe('integrite du bundle de donnees', () => {
  it('charge chaque fichier declare, sans valeur nulle', () => {
    for (const key of Object.keys(DATA_FILES_MAP)) {
      expect(data[key], `la cle "${key}" est absente ou nulle`).toBeTruthy()
    }
  })

  it('ne laisse aucun .jsonc de src/data/ hors de DATA_FILES_MAP', () => {
    // AGENTS.md impose d'aligner DATA_FILES_MAP, FILE_MAP et filterConfigs
    // quand une categorie est ajoutee. Ce garde-fou attrape l'oubli le plus
    // courant : deposer un JSONC sans le brancher.
    const declared = new Set(Object.values(DATA_FILES_MAP).map(f => `../data/${f}`))
    const bundled = getBundledJsoncPaths()
    const orphans = bundled.filter(p => !declared.has(p))

    expect(orphans, `JSONC presents mais non declares : ${orphans.join(', ')}`).toEqual([])
  })

  it('declare uniquement des fichiers qui existent', () => {
    const bundled = new Set(getBundledJsoncPaths())
    const missing = Object.entries(DATA_FILES_MAP)
      .filter(([, f]) => !bundled.has(`../data/${f}`))
      .map(([k, f]) => `${k} -> ${f}`)

    expect(missing, `declares mais introuvables : ${missing.join(', ')}`).toEqual([])
  })
})

describe('volumetrie des categories', () => {
  // Bornes basses volontairement laches : elles ne sont pas la pour verrouiller
  // un inventaire (qui bouge a chaque patch du jeu) mais pour detecter qu'une
  // categorie s'est silencieusement videe.
  const MINIMA = {
    armes: 200,
    equipements: 400,
    ensembles: 50,
    talentsArmes: 80,
    talentsEquipements: 100,
    attributs: 100,
    statistiques: 50,
    modsArmes: 200,
    modsCompetences: 50,
    competences: 30,
  }

  for (const [key, min] of Object.entries(MINIMA)) {
    it(`${key} contient au moins ${min} entrees`, () => {
      const n = Array.isArray(data[key]) ? data[key].length : Object.keys(data[key]).length
      expect(n).toBeGreaterThanOrEqual(min)
    })
  }
})

describe('enrichissements appliques au chargement', () => {
  it('injecte le slug dans les categories indexees par slug', () => {
    for (const key of ['armes', 'equipements', 'ensembles', 'talentsArmes', 'attributs']) {
      const [slug, item] = Object.entries(data[key])[0]
      expect(item.slug, `slug non injecte dans ${key}`).toBe(slug)
    }
  })

  it('aplatit les competences en conservant le regroupement', () => {
    expect(Array.isArray(data.competences)).toBe(true)
    expect(data.competencesGrouped).toBeTruthy()
    // L'aplatissement produit plus de variantes que de competences de base.
    expect(data.competences.length).toBeGreaterThan(Object.keys(data.competencesGrouped).length)
  })

  it('marque les mods d equipements avec estMod', () => {
    const mods = Object.values(data.modsEquipements)
    expect(mods.length).toBeGreaterThan(0)
    expect(mods.every(m => m.estMod === true)).toBe(true)
  })

  it('injecte les armes de specialisation dans le catalogue d armes', () => {
    const specWeapons = Object.values(data.armes).filter(a => a.specialisation)
    // Une arme signature par specialisation.
    expect(specWeapons.length).toBe(Object.keys(data.classSpe).length)
    expect(specWeapons.every(w => w.slug && w.nom)).toBe(true)
  })

  it('construit les lookups et le changelog', () => {
    expect(data.lookups).toBeTruthy()
    expect(Array.isArray(data.changelog)).toBe(true)
  })
})

describe('cache singleton', () => {
  it('renvoie la meme instance sans re-parser', () => {
    expect(getLoadedData()).toBe(data)
  })
})
