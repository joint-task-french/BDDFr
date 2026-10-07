import { describe, it, expect } from 'vitest'
import { parse } from 'jsonc-parser'
import { readFileSync } from 'node:fs'
import { resolveCoreCategory, CORE_CATEGORIES } from './useBuildStats'

/**
 * `resolveCoreCategory` decide a quelle categorie de coeur (offensif, defensif,
 * utilitaire) un emplacement est attribue. Une erreur ici produit une
 * statistique fausse dans le planner, sans aucun signal visible.
 *
 * L'ancienne implementation faisait du rapprochement approximatif sur des noms
 * francais ; ces tests verrouillent la correspondance exacte et surtout le fait
 * qu'elle reste alignee sur l'enum du schema.
 */

const ENUM_SCHEMA = parse(
  readFileSync('src/data/schemas/equipements/ensembles.schema.json', 'utf8')
).patternProperties['^[a-z0-9_]+$'].properties.attributsEssentiels.items.enum

describe('resolveCoreCategory', () => {
  it('mappe chaque categorie de coeur sur elle-meme', () => {
    expect(resolveCoreCategory('offensif')).toBe('offensif')
    expect(resolveCoreCategory('defensif')).toBe('defensif')
    expect(resolveCoreCategory('utilitaire')).toBe('utilitaire')
  })

  it('tolere accents et casse', () => {
    expect(resolveCoreCategory('Offensif')).toBe('offensif')
    expect(resolveCoreCategory('DÉFENSIF')).toBe('defensif')
  })

  it('n attribue aucune categorie a un coeur aleatoire', () => {
    // 'random' est une valeur legitime du schema : elle ne doit pas etre
    // comptee, mais ne doit pas non plus lever.
    expect(resolveCoreCategory('random')).toBeNull()
  })

  it('renvoie null sur une valeur vide ou inconnue', () => {
    expect(resolveCoreCategory(null)).toBeNull()
    expect(resolveCoreCategory(undefined)).toBeNull()
    expect(resolveCoreCategory('')).toBeNull()
    expect(resolveCoreCategory('nawak')).toBeNull()
  })

  it('ne se laisse plus abuser par une correspondance approximative', () => {
    // Avec l'ancien rapprochement flou, ces chaines tombaient dans les
    // heuristiques ('degat' -> offensif, 'armure' -> defensif) et produisaient
    // une categorie a partir de texte libre.
    expect(resolveCoreCategory('degats de competence')).toBeNull()
    expect(resolveCoreCategory('armure totale')).toBeNull()
    expect(resolveCoreCategory('tiers de competence')).toBeNull()
  })
})

describe('alignement avec le schema', () => {
  it('couvre toutes les valeurs du schema, random excepte', () => {
    const attendues = ENUM_SCHEMA.filter(v => v !== 'random')

    // Si le schema gagne une categorie, ce test echoue : c'est le rappel qu'il
    // faut aussi l'ajouter a CORE_CATEGORIES (et aux compteurs du planner).
    expect([...CORE_CATEGORIES].sort()).toEqual(attendues.sort())
  })

  it('resout toute valeur du schema sans lever', () => {
    for (const valeur of ENUM_SCHEMA) {
      expect(() => resolveCoreCategory(valeur)).not.toThrow()
    }
  })
})
