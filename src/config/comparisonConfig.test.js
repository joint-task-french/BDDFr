import { describe, it, expect } from 'vitest'
import {
  COMPARISON_MAX,
  buildComparison,
  comparisonGroupKey,
  comparisonGroupLabel,
  isComparable,
} from './comparisonConfig'
import { getLoadedData } from '../hooks/useDataLoader'

/**
 * Le comparateur repose entierement sur cette configuration : c'est elle qui
 * decide ce qui a du sens d'etre mis cote a cote, et quelle valeur est la
 * meilleure. Une erreur ici produit soit un refus incomprehensible, soit une
 * comparaison trompeuse.
 */

const data = getLoadedData()

describe('groupes de comparaison', () => {
  it('met toutes les armes dans un seul groupe', () => {
    // Un fusil a pompe face a un fusil de precision reste une comparaison utile.
    const pompe = { type: 'calibre_12', nom: 'ACS-12' }
    const sniper = { type: 'fusil_precision', nom: 'TAC-50' }

    expect(comparisonGroupKey('armes', pompe)).toBe(comparisonGroupKey('armes', sniper))
  })

  it('separe les equipements par emplacement', () => {
    const torse = { emplacement: 'torse', nom: 'A' }
    const autreTorse = { emplacement: 'torse', nom: 'B' }
    const sac = { emplacement: 'sac_a_dos', nom: 'C' }

    expect(comparisonGroupKey('equipements', torse)).toBe(comparisonGroupKey('equipements', autreTorse))
    expect(comparisonGroupKey('equipements', torse)).not.toBe(comparisonGroupKey('equipements', sac))
  })

  it('separe les mods d armes par type d emplacement', () => {
    const bouche = { type: 'bouche', nom: 'Cache-flamme' }
    const chargeur = { type: 'chargeur', nom: 'Barillet' }

    expect(comparisonGroupKey('modsArmes', bouche)).not.toBe(comparisonGroupKey('modsArmes', chargeur))
  })

  it('ne melange jamais deux categories, meme a groupe identique', () => {
    // Un torse d'equipement et un talent de torse partagent l'emplacement.
    const equipement = { emplacement: 'torse', nom: 'Plastron' }
    const talent = { emplacement: 'torse', nom: 'Obstiné' }

    expect(comparisonGroupKey('equipements', equipement))
      .not.toBe(comparisonGroupKey('talentsEquipements', talent))
  })

  it('nomme le groupe de façon lisible', () => {
    expect(comparisonGroupLabel('equipements', { emplacement: 'sac_a_dos' }, data)).toBe('Sac à dos')
    expect(comparisonGroupLabel('armes', { type: 'fusil' }, data)).toBe('Armes')
  })

  it('declare comparables les categories attendues', () => {
    for (const c of ['armes', 'equipements', 'ensembles', 'competences', 'talentsArmes',
      'talentsEquipements', 'talentsPrototypes', 'modsArmes', 'modsEquipements',
      'modsCompetences', 'descente']) {
      expect(isComparable(c), `${c} devrait être comparable`).toBe(true)
    }
    expect(isComparable('categorie_inexistante')).toBe(false)
    expect(comparisonGroupKey('categorie_inexistante', {})).toBeNull()
  })
})

describe('construction du tableau', () => {
  const armes = [
    { nom: 'A', type: 'fusil', degatsBase: 100, rpm: 300, rechargement: 2 },
    { nom: 'B', type: 'fusil', degatsBase: 200, rpm: 300, rechargement: 3 },
  ]

  const ligne = (rows, key) => rows.find(r => r.key === key)

  it('designe la valeur la plus haute quand plus = mieux', () => {
    const rows = buildComparison('armes', armes, data)
    expect(ligne(rows, 'degatsBase').best).toEqual([1])
  })

  it('designe la valeur la plus basse quand moins = mieux', () => {
    const rows = buildComparison('armes', armes, data)
    // Rechargement : 2 s bat 3 s.
    expect(ligne(rows, 'rechargement').best).toEqual([0])
  })

  it('ne designe personne en cas d egalite generale', () => {
    const rows = buildComparison('armes', armes, data)
    expect(ligne(rows, 'rpm').best).toEqual([])
  })

  it('designe tous les ex aequo', () => {
    const rows = buildComparison('armes', [
      ...armes,
      { nom: 'C', type: 'fusil', degatsBase: 200, rpm: 100, rechargement: 5 },
    ], data)
    expect(ligne(rows, 'degatsBase').best).toEqual([1, 2])
  })

  it('retire les lignes qu aucun element ne renseigne', () => {
    const rows = buildComparison('armes', armes, data)
    // Aucune de ces armes de test n'a de fabricant ni de talent.
    expect(ligne(rows, 'fabricant')).toBeUndefined()
    expect(ligne(rows, 'talents')).toBeUndefined()
    expect(ligne(rows, 'degatsBase')).toBeDefined()
  })

  it('renvoie un tableau vide sans element ou sur categorie inconnue', () => {
    expect(buildComparison('armes', [], data)).toEqual([])
    expect(buildComparison('inconnue', armes, data)).toEqual([])
  })

  it('ne leve jamais sur un item incomplet', () => {
    expect(() => buildComparison('armes', [{ nom: 'Vide' }, {}], data)).not.toThrow()
    expect(() => buildComparison('equipements', [{}], data)).not.toThrow()
  })
})


describe('emplacements de mods', () => {
  const ligne = (rows, key) => rows.find(r => r.key === key)

  it('affiche une ligne par emplacement possible, meme non accepte', () => {
    // Une arme avec chargeur + bouche, une autre avec viseur seul : les deux
    // emplacements doivent apparaitre pour les deux armes, vides si absents.
    const rows = buildComparison('armes', [
      { nom: 'A', emplacementsMods: { chargeur: 'chargeur_556', bouche: 'bouche_556' } },
      { nom: 'B', emplacementsMods: { viseur: 'rail_optique' } },
    ], data)

    expect(ligne(rows, 'mod_chargeur').cells[0]).toMatchObject({ t: 'txt' })
    expect(ligne(rows, 'mod_chargeur').cells[1]).toBeNull()
    expect(ligne(rows, 'mod_viseur').cells[0]).toBeNull()
    expect(ligne(rows, 'mod_viseur').cells[1]).toMatchObject({ t: 'txt' })
  })

  it('affiche la sous-categorie acceptee, pas le nom de l emplacement', () => {
    const rows = buildComparison('armes', [
      { nom: 'A', emplacementsMods: { chargeur: 'chargeur_556' } },
    ], data)

    // `chargeur_556` doit etre resolu via modsArmesType.
    expect(ligne(rows, 'mod_chargeur').cells[0].v).toBe(data.modsArmesType.chargeur_556.nom)
  })

  it('retire les emplacements qu aucune arme comparee n accepte', () => {
    const rows = buildComparison('armes', [
      { nom: 'A', emplacementsMods: { viseur: 'rail_optique' } },
      { nom: 'B', emplacementsMods: { viseur: 'rail_optique_court' } },
    ], data)

    expect(ligne(rows, 'mod_viseur')).toBeDefined()
    expect(ligne(rows, 'mod_chargeur')).toBeUndefined()
  })

  it('gere la forme objet des emplacements de competences', () => {
    // Les competences stockent `[{ emplacement: 'BOBINE' }]` et non des chaines :
    // les traiter comme des chaines produisait « [object Object] ».
    const rows = buildComparison('competences', [
      { competence: 'A', variante: 'x', emplacementsMods: [{ emplacement: 'BOBINE' }] },
      { competence: 'B', variante: 'y', emplacementsMods: [{ emplacement: 'GYRO' }] },
    ], data)

    const bobine = rows.find(r => r.label.includes('BOBINE'))
    const gyro = rows.find(r => r.label.includes('GYRO'))

    expect(bobine, 'la ligne BOBINE devrait exister').toBeDefined()
    expect(bobine.cells[0]).toMatchObject({ t: 'bool', v: true })
    expect(bobine.cells[1]).toBeNull()
    expect(gyro.cells[1]).toMatchObject({ t: 'bool', v: true })

    // Aucun libelle ne doit contenir de serialisation d'objet.
    rows.forEach(r => expect(r.label).not.toContain('object Object'))
  })
})

describe('talents detailles', () => {
  const ligne = (rows, key) => rows.find(r => r.key === key)

  it('joint la description a chaque talent', () => {
    const talent = Object.values(data.talentsArmes).find(t => t.description)
    const arme = { nom: 'A', slug: 'arme_test', talents: [talent.slug] }
    const cell = ligne(buildComparison('armes', [arme], data), 'talents').cells[0]

    expect(cell.t).toBe('talents')
    expect(cell.v[0].nom).toBe(talent.nom)
    expect(cell.v[0].description).toBe(talent.description)
    expect(cell.v[0].parfait).toBe(false)
  })

  it('bascule sur la version parfaite pour les armes concernees', () => {
    const talent = Object.values(data.talentsArmes)
      .find(t => t.perfectDescription && t.armesParfaites?.length)
    const slugParfait = talent.armesParfaites[0]

    const parfaite = { nom: 'P', slug: slugParfait, talents: [talent.slug] }
    const ordinaire = { nom: 'O', slug: 'une_autre_arme', talents: [talent.slug] }

    const cells = ligne(buildComparison('armes', [parfaite, ordinaire], data), 'talents').cells
    expect(cells[0].v[0].parfait).toBe(true)
    expect(cells[0].v[0].description).toBe(talent.perfectDescription)
    expect(cells[1].v[0].parfait).toBe(false)
  })

  it('reste lisible si le talent est introuvable', () => {
    const cell = ligne(buildComparison('armes', [
      { nom: 'A', slug: 'a', talents: ['talent_inexistant'] },
    ], data), 'talents').cells[0]

    expect(cell.v[0].nom).toBeTruthy()
    expect(cell.v[0].parfait).toBe(false)
  })
})

describe('sur les vraies donnees', () => {
  it('compare deux armes reelles sans perdre de ligne numerique', () => {
    const armes = Object.values(data.armes).filter(a => a.degatsBase && a.rpm).slice(0, 4)
    const rows = buildComparison('armes', armes, data)

    const cles = rows.map(r => r.key)
    expect(cles).toContain('degatsBase')
    expect(cles).toContain('rpm')
    expect(cles).toContain('rechargement')
    // Chaque ligne comporte autant de cellules que d'elements compares.
    rows.forEach(r => expect(r.cells).toHaveLength(armes.length))
  })

  it('compare des equipements du meme emplacement', () => {
    const torses = Object.values(data.equipements).filter(e => e.emplacement === 'torse').slice(0, 3)
    expect(torses.length).toBeGreaterThan(1)

    const rows = buildComparison('equipements', torses, data)
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach(r => expect(r.cells).toHaveLength(torses.length))
  })

  it('limite la comparaison a 4 elements', () => {
    expect(COMPARISON_MAX).toBe(4)
  })
})
