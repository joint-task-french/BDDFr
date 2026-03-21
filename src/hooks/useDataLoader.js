import { useState, useEffect } from 'react'
import { loadJsonc } from '../utils/dataLoader'
import { flattenCompetences } from '../utils/competenceUtils'
import { getSpecialisations } from '../utils/formatters'
import { buildLookupMaps } from '../utils/lookupMaps'
import {slugify} from "../utils/slugify.js";

const BASE = import.meta.env.BASE_URL

const DATA_FILES = {
  armes: 'armes.jsonc',
  armes_type: 'armes-type.jsonc',
  attributs: 'attributs.jsonc',
  attributs_type: 'attributs-type.jsonc',
  classSpe: 'class-spe.jsonc',
  competences: 'competences.jsonc',
  ensembles: 'ensembles.jsonc',
  equipements: 'equipements.jsonc',
  equipements_type: 'equipements-type.jsonc',
  metadata: 'metadata.jsonc',
  modsArmes: 'mods-armes.jsonc',
  modsArmesType: 'mods-armes-type.jsonc',
  modsCompetences: 'mods-competences.jsonc',
  modsEquipements: 'mods-equipements.jsonc',
  statistiques: 'statistiques.jsonc',
  talentsArmes: 'talents-armes.jsonc',
  talentsEquipements: 'talents-equipements.jsonc',
  talentsPrototypes: 'talents-prototypes.jsonc',
}

/**
 * Fichiers de données qui sont des objets à clé slug.
 * Ils seront convertis en arrays (avec le slug réinjecté) pour les consommateurs.
 * Les fichiers de types (*_type) et metadata restent tels quels (déjà des objets simples).
 */
const SLUG_KEYED_FILES = new Set([
  'armes', 'attributs', 'classSpe', 'competences', 'ensembles',
  'equipements', 'modsArmes', 'modsCompetences', 'modsEquipements',
  'statistiques', 'talentsArmes', 'talentsEquipements', 'talentsPrototypes',
])

/**
 * Injecte le slug dans chaque valeur de l'objet (si c'est un objet).
 */
function injectSlugs(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  Object.entries(obj).forEach(([slug, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      value.slug = slug
    }
  })
  return obj
}

export function useDataLoader() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        const entries = Object.entries(DATA_FILES)
        const result = {}
        for (let i = 0; i < entries.length; i++) {
          const [key, file] = entries[i]
          const raw = await loadJsonc(`${BASE}data/${file}`)

          // Injecter les slugs mais garder la structure objet
          if (SLUG_KEYED_FILES.has(key)) {
            result[key] = injectSlugs(raw)
          } else {
            result[key] = raw
          }

          if (!cancelled) setProgress(Math.round(((i + 1) / entries.length) * 100))
        }
        if (!cancelled) {
          // Post-process: flatten competences for consumers, keep grouped for generator
          if (result.competences) {
            result.competencesGrouped = result.competences
            result.competences = flattenCompetences(Object.values(result.competences))
          }
          // Extract changelog from metadata
          if (result.metadata?.changelog) {
            result.changelog = result.metadata.changelog
          } else {
            result.changelog = []
          }
          // Merge specific weapons from classSpe into armes for display
          if (result.classSpe && result.armes) {
            const specWeapons = Object.values(result.classSpe).map(spec => ({
              nom: spec.arme.nom,
              slug: slugify(spec.arme.nom),
              type: 'arme_specifique',
              fabricant: spec.nom,
              portee: spec.arme.portee,
              rpm: spec.arme.rpm,
              chargeur: spec.arme.chargeur,
              rechargement: spec.arme.rechargement,
              headshot: spec.arme.headshot,
              degatsBase: spec.arme.degatsBase,
              icon: spec.arme.icon,
              estExotique: false,
              estNomme: false,
              talents: [],
              specialisation: spec.nom,
            }))
            
            // Injecter les armes de spé dans l'objet armes
            specWeapons.forEach(sw => {
              result.armes[sw.slug] = sw
            })
          }
          // Initialize specialisations cache for components outside BuildProvider
          if (result.classSpe) {
            getSpecialisations(Object.values(result.classSpe))
          }
          // Build slug → object lookup maps
          result.lookups = buildLookupMaps(result)
          setData(result)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [])

  return { data, loading, error, progress }
}

