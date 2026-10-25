import { useState, useEffect } from 'react'
import { parse as parseJsonc, printParseErrorCode } from 'jsonc-parser'
import { flattenCompetences } from '../utils/competenceUtils'
import { getSpecialisations } from '../utils/formatters'
import { buildLookupMaps } from '../utils/lookupMaps'
import { slugify } from "../utils/slugify.js";

const jsoncFiles = import.meta.glob('../data/**/*.jsonc', { query: '?raw', eager: true, import: 'default' })

/**
 * Parse un JSONC avec `jsonc-parser` — la meme bibliotheque que les scripts de
 * validation (scripts/validate/*.mjs), pour que ce qui passe la validation soit
 * exactement ce que l'application sait lire.
 *
 * L'ancien strip par expression reguliere se desynchronisait sur certains
 * fichiers : un commentaire // pouvait etre avale par une pseudo-chaine, et
 * 2 des 22 JSONC (armes.jsonc, talents-armes.jsonc) devenaient illisibles — en
 * silence, puisque le resultat etait seulement journalise puis mis a null,
 * alors que la validation, elle, passait au vert.
 *
 * L'erreur nomme desormais le fichier fautif et remonte jusqu'a l'UI.
 */
function parseJsoncContent(rawText, filename) {
  const errors = []
  const data = parseJsonc(rawText, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  })

  if (errors.length > 0) {
    const details = errors
      .slice(0, 3)
      .map(e => `${printParseErrorCode(e.error)} (offset ${e.offset})`)
      .join(", ")
    throw new Error(`JSONC invalide dans ${filename} : ${details}`)
  }
  if (data === undefined) {
    throw new Error(`JSONC vide ou illisible : ${filename}`)
  }

  return data
}

export const DATA_FILES_MAP = {
  armes: 'armes/armes.jsonc',
  armes_type: 'armes/armes-type.jsonc',
  attributs: 'attributs/attributs.jsonc',
  attributs_type: 'attributs/attributs-type.jsonc',
  classSpe: 'class-spe.jsonc',
  competences: 'competences.jsonc',
  ensembles: 'equipements/ensembles.jsonc',
  equipements: 'equipements/equipements.jsonc',
  equipements_type: 'equipements/equipements-type.jsonc',
  metadata: 'metadata.jsonc',
  modsArmes: 'armes/mods-armes.jsonc',
  modsArmesType: 'armes/mods-armes-type.jsonc',
  modsCompetences: 'mods-competences.jsonc',
  modsEquipements: 'equipements/mods-equipements.jsonc',
  statistiques: 'attributs/statistiques.jsonc',
  montre: 'montre/montre.jsonc',
  talentsArmes: 'armes/talents-armes.jsonc',
  talentsAutres: 'talents-autres.jsonc',
  talentsEquipements: 'equipements/talents-equipements.jsonc',
  talentsPrototypes: 'talents-prototypes.jsonc',
  builds: 'builds/builds.jsonc',
  buildsTags: 'builds/tags.jsonc',
}

const SLUG_KEYED_FILES = new Set([
  'armes', 'attributs', 'classSpe', 'competences', 'ensembles',
  'equipements', 'modsArmes', 'modsCompetences', 'modsEquipements',
  'statistiques', 'talentsArmes', 'talentsAutres', 'talentsEquipements', 'talentsPrototypes', 'buildsTags',
])

function injectSlugs(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  Object.entries(obj).forEach(([slug, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      value.slug = slug
    }
  })
  return obj
}

/**
 * Parse et enrichit l'integralite des JSONC. Couteux : ~400 Ko de texte a
 * parser, plus la construction des lookup maps.
 */
function parseAllData() {
  const result = {}

  for (const [key, filename] of Object.entries(DATA_FILES_MAP)) {
    const filePath = `../data/${filename}`
    const rawText = jsoncFiles[filePath]

    if (!rawText) {
      throw new Error(`Fichier de donnees introuvable dans le bundle : ${filePath}`)
    }

    const rawData = parseJsoncContent(rawText, filename)

    result[key] = SLUG_KEYED_FILES.has(key) ? injectSlugs(rawData) : rawData

    // Enrichissement data-driven : les items issus de mods-equipements.jsonc sont des mods
    if (key === 'modsEquipements' && result[key] && typeof result[key] === 'object') {
      Object.values(result[key]).forEach(item => {
        if (item && typeof item === 'object') item.estMod = true
      })
    }
  }

  if (result.competences) {
    result.competencesGrouped = result.competences
    result.competences = flattenCompetences(Object.values(result.competences))
  }

  result.changelog = result.metadata?.changelog ?? []

  if (result.classSpe && result.armes) {
    const specWeapons = Object.values(result.classSpe).map(spec => ({
      ...spec.arme,
      slug: slugify(spec.arme.nom),
      specialisation: spec.nom,
    }))

    specWeapons.forEach(sw => {
      result.armes[sw.slug] = sw
    })
  }

  if (result.classSpe) {
    getSpecialisations(Object.values(result.classSpe))
  }

  result.lookups = buildLookupMaps(result)

  return result
}

// --- Singleton -------------------------------------------------------------
// `useDataLoader` est appele par 7 composants independants (App + chaque page).
// Sans ce cache au niveau module, chacun re-parsait les 22 JSONC a chaque
// montage : 2 parses complets au chargement initial, puis un parse complet a
// chaque navigation, et autant de copies de la donnee en memoire.
let dataCache = null
let dataError = null

/** Chemins des JSONC reellement presents dans le bundle (pour les tests). */
export function getBundledJsoncPaths() {
  return Object.keys(jsoncFiles)
}

export function getLoadedData() {
  if (dataCache) return dataCache
  if (dataError) throw dataError
  try {
    dataCache = parseAllData()
    return dataCache
  } catch (e) {
    dataError = e
    throw e
  }
}

/** Reinitialise le cache — reserve aux tests. */
export function __resetDataCache() {
  dataCache = null
  dataError = null
}

const READY = (data) => ({ data, loading: false, error: null, progress: 100 })
const PENDING = { data: {}, loading: true, error: null, progress: 0 }

export function useDataLoader() {
  // Si la donnee est deja en cache (toute navigation apres la premiere), on
  // rend directement l'etat final : pas de flash de loader, pas de re-parse.
  const [state, setState] = useState(() => (dataCache ? READY(dataCache) : PENDING))

  useEffect(() => {
    if (!state.loading) return
    try {
      setState(READY(getLoadedData()))
    } catch (e) {
      setState({ data: {}, loading: false, error: e.message, progress: 100 })
    }
  }, [state.loading])

  return state
}
