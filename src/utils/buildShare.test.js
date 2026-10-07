import { describe, it, expect } from 'vitest'
import { compressToEncodedURIComponent } from 'lz-string'
import { encodeBuild, decodeBuild } from './buildShare'

/**
 * AGENTS.md impose que `decodeBuild` reste retro-compatible : les URLs de
 * partage deja diffusees (ancien format base64, nouveau format `~` + lz-string)
 * doivent continuer a se resoudre. Ces tests verrouillent ce contrat.
 */

const emptyState = {
  weapons: [null, null],
  weaponTalents: [null, null],
  gear: {},
  skills: [],
}

describe('encodeBuild', () => {
  it('retourne une chaine vide pour un build vide', () => {
    expect(encodeBuild(emptyState)).toBe('')
  })

  it('prefixe le format compact par ~', () => {
    const encoded = encodeBuild({ ...emptyState, specialWeapon: { slug: 'lance_grenades' } })
    expect(encoded.startsWith('~')).toBe(true)
  })

  it('encode le slug plutot que l objet complet', () => {
    const encoded = encodeBuild({
      ...emptyState,
      specialWeapon: { slug: 'lance_grenades', nom: 'Lance-grenades', degats: 12345 },
    })
    const decoded = decodeBuild(encoded)
    expect(decoded.sw).toBe('lance_grenades')
    expect(JSON.stringify(decoded)).not.toContain('12345')
  })

  it('se rabat sur le nom quand le slug est absent', () => {
    const encoded = encodeBuild({ ...emptyState, specialWeapon: { nom: 'Arbalete' } })
    expect(decodeBuild(encoded).sw).toBe('Arbalete')
  })
})

describe('aller-retour encode/decode', () => {
  it('preserve armes, talents, equipement et competences', () => {
    const state = {
      ...emptyState,
      weapons: [{ slug: 'famas' }, { slug: 'p416' }],
      weaponTalents: [{ slug: 'tueur' }, null],
      sidearm: { slug: 'd50' },
      gear: { masque: { slug: 'masque_ceinture' }, torse: { slug: 'torse_petrov' } },
      gearTalents: { torse: { slug: 'obstine' } },
      skills: [{ competenceSlug: 'drone', slug: 'attaque' }],
    }
    const decoded = decodeBuild(encodeBuild(state))

    expect(decoded.w).toEqual(['famas', 'p416'])
    expect(decoded.wt).toEqual(['tueur'])
    expect(decoded.sa).toBe('d50')
    expect(decoded.g).toEqual(['masque_ceinture', 'torse_petrov'])
    expect(decoded.gt).toEqual(['obstine'])
    expect(decoded.s).toEqual([['drone', 'attaque']])
  })

  it('preserve expertise, prototypes et niveaux SHD', () => {
    const state = {
      ...emptyState,
      weapons: [{ slug: 'famas' }, null],
      expertise: { weapon0: 12, masque: 5 },
      prototypes: { weapon0: true },
      shdLevels: { offensif: 40 },
    }
    const decoded = decodeBuild(encodeBuild(state))

    expect(decoded.exp[0]).toBe(12)
    expect(decoded.p[0]).toBe(1)
    expect(decoded.shd).toEqual({ offensif: 40 })
  })

  it('elague les emplacements vides en fin de tableau', () => {
    const dense = encodeBuild({ ...emptyState, weapons: [{ slug: 'famas' }, null] })
    const sparse = encodeBuild({
      ...emptyState,
      weapons: [{ slug: 'famas' }, null, null, null],
    })
    expect(dense).toBe(sparse)
  })
})

describe('decodeBuild — retro-compatibilite', () => {
  it('decode l ancien format base64 URL-safe', () => {
    // Ancien format : JSON encode en base64 URL-safe, sans prefixe.
    const legacy = { sw: 'lance_grenades', w: ['famas', 'p416'], exp: [10] }
    const b64 = Buffer.from(JSON.stringify(legacy), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    expect(decodeBuild(b64)).toEqual(legacy)
  })

  it('decode un payload compact produit hors de cette version', () => {
    // Tableau compact brut : verrouille l'ordre des positions du format.
    const raw = ['lance_grenades', ['famas'], null, 'd50']
    const encoded = '~' + compressToEncodedURIComponent(JSON.stringify(raw))

    expect(decodeBuild(encoded)).toEqual({
      sw: 'lance_grenades',
      w: ['famas'],
      sa: 'd50',
    })
  })

  it('renvoie null sur une entree vide, invalide ou corrompue', () => {
    expect(decodeBuild('')).toBeNull()
    expect(decodeBuild(null)).toBeNull()
    expect(decodeBuild(undefined)).toBeNull()
    expect(decodeBuild('~nimportequoi!!!')).toBeNull()
    expect(decodeBuild('pas-du-base64-valide???')).toBeNull()
  })
})
