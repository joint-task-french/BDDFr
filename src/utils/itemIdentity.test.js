import { describe, it, expect } from 'vitest'
import { itemKey, itemLabel, itemRef, categoryItems, resolveItem } from './itemIdentity'
import { getLoadedData } from '../hooks/useDataLoader'

/**
 * Les listes stockent des references (categorie + cle) et non des objets : si
 * l'identite d'un item n'est pas stable et unique, une liste pointe sur le
 * mauvais element — ou perd le sien au moindre renommage.
 */

const data = getLoadedData()

describe('itemKey', () => {
  it('utilise le slug par defaut', () => {
    expect(itemKey('armes', { slug: 'acs_12', nom: 'ACS-12' })).toBe('acs_12')
  })

  it('se rabat sur le nom slugifie quand le slug manque', () => {
    expect(itemKey('armes', { nom: 'ACS-12' })).toBe('acs_12')
  })

  it('qualifie les variantes de competence par leur competence parente', () => {
    // Deux competences distinctes peuvent avoir une variante « precision » :
    // le seul slug de variante ne suffit pas a les distinguer.
    const a = { competenceSlug: 'abri_intelligent', slug: 'precision' }
    const b = { competenceSlug: 'drone', slug: 'precision' }

    expect(itemKey('competences', a)).not.toBe(itemKey('competences', b))
    expect(itemKey('competences', a)).toBe('abri_intelligent:precision')
  })

  it('renvoie null sur un item non identifiable', () => {
    expect(itemKey('armes', null)).toBeNull()
    expect(itemKey('armes', {})).toBeNull()
  })

  it('prefixe la reference globale par la categorie', () => {
    expect(itemRef('armes', { slug: 'acs_12' })).toBe('armes::acs_12')
    expect(itemRef('armes', {})).toBeNull()
  })
})

describe('itemLabel', () => {
  it('utilise le nom quand il existe', () => {
    expect(itemLabel({ nom: 'ACS-12' })).toBe('ACS-12')
  })

  it('compose competence et variante a defaut de nom', () => {
    // Les variantes de competences n'ont pas de champ `nom` : sans ce repli,
    // listes et comparateur affichaient un slug brut.
    expect(itemLabel({ competence: 'Abri intelligent', variante: 'Fortifié' }))
      .toBe('Abri intelligent — Fortifié')
  })

  it('se rabat sur la variante puis le slug', () => {
    expect(itemLabel({ variante: 'Fortifié' })).toBe('Fortifié')
    expect(itemLabel({ slug: 'acs_12' })).toBe('acs_12')
    expect(itemLabel(null)).toBe('')
    expect(itemLabel({})).toBe('')
  })

  it('nomme lisiblement toute variante de competence des donnees', () => {
    for (const variante of data.competences.slice(0, 20)) {
      const label = itemLabel(variante)
      expect(label).toBeTruthy()
      // Aucun slug brut ne doit remonter jusqu'a l'affichage.
      expect(label).not.toMatch(/^[a-z0-9_]+$/)
    }
  })
})

describe('categoryItems', () => {
  it('normalise les objets indexes par slug en tableau', () => {
    const armes = categoryItems(data, 'armes')
    expect(Array.isArray(armes)).toBe(true)
    expect(armes.length).toBeGreaterThan(200)
  })

  it('laisse les categories deja sous forme de tableau', () => {
    expect(Array.isArray(categoryItems(data, 'competences'))).toBe(true)
  })

  it('reconstitue la vue Descente depuis ses trois sources', () => {
    const descente = categoryItems(data, 'descente')
    expect(descente.length).toBeGreaterThan(0)
    expect(descente.every(t => t.descente)).toBe(true)
    // La vue distingue talents d'armes et d'equipements.
    expect(descente.some(t => t.isWeaponTalent === true)).toBe(true)
    expect(descente.some(t => t.isWeaponTalent === false)).toBe(true)
  })

  it('renvoie un tableau vide sur une categorie inconnue ou sans donnees', () => {
    expect(categoryItems(data, 'inexistante')).toEqual([])
    expect(categoryItems(null, 'armes')).toEqual([])
  })
})

describe('resolveItem', () => {
  it('retrouve un item par sa cle', () => {
    const arme = Object.values(data.armes)[0]
    const cle = itemKey('armes', arme)

    expect(resolveItem(data, 'armes', cle)).toBe(arme)
  })

  it('retrouve la bonne variante de competence', () => {
    const variante = data.competences[0]
    const cle = itemKey('competences', variante)
    const retrouve = resolveItem(data, 'competences', cle)

    expect(retrouve.variante).toBe(variante.variante)
    expect(retrouve.competence).toBe(variante.competence)
  })

  it('renvoie null pour une cle disparue plutot que de lever', () => {
    // Un slug renomme ou supprime ne doit pas casser une liste enregistree.
    expect(resolveItem(data, 'armes', 'arme_qui_n_existe_plus')).toBeNull()
    expect(resolveItem(data, 'armes', null)).toBeNull()
    expect(resolveItem(null, 'armes', 'acs_12')).toBeNull()
  })
})
