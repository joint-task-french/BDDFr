import { useState, useEffect } from 'react'
import { flattenCompetences } from '../utils/competenceUtils'
import { getSpecialisations } from '../utils/formatters'
import { buildLookupMaps } from '../utils/lookupMaps'
import { slugify } from "../utils/slugify.js";

const jsoncFiles = import.meta.glob('../data/*.jsonc', { query: '?raw', eager: true, import: 'default' })

function stripJsonComments(text) {
  let cleanText = text.replace(/^\uFEFF/, '');
  return cleanText.replace(/("(?:\\.|[^\\"])*")|(\/\*[\s\S]*?\*\/)|(\/\/(?:.*)$)/gm, (match, string) => {
    if (string) return string;
    return '';
  });
}

function parseJsoncContent(rawText) {
  try {
    return JSON.parse(stripJsonComments(rawText));
  } catch (e) {
    console.error("Erreur de parsing JSONC", e);
    return null;
  }
}

const DATA_FILES_MAP = {
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
  talentsAutres: 'talents-autres.jsonc',
  talentsEquipements: 'talents-equipements.jsonc',
  talentsPrototypes: 'talents-prototypes.jsonc',
}

const SLUG_KEYED_FILES = new Set([
  'armes', 'attributs', 'classSpe', 'competences', 'ensembles',
  'equipements', 'modsArmes', 'modsCompetences', 'modsEquipements',
  'statistiques', 'talentsArmes', 'talentsAutres', 'talentsEquipements', 'talentsPrototypes',
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

export function useDataLoader() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    try {
      const result = {}
      const entries = Object.entries(DATA_FILES_MAP)

      for (let i = 0; i < entries.length; i++) {
        const [key, filename] = entries[i]
        const filePath = `../data/${filename}`
        const rawText = jsoncFiles[filePath]

        if (!rawText) {
          console.error(`Fichier introuvable dans le bundle : ${filePath}`);
          continue;
        }

        const rawData = parseJsoncContent(rawText)

        if (SLUG_KEYED_FILES.has(key)) {
          result[key] = injectSlugs(rawData)
        } else {
          result[key] = rawData
        }

        // Enrichissement data-driven : les items issus de mods-equipements.jsonc sont des mods
        if (key === 'modsEquipements' && result[key] && typeof result[key] === 'object') {
          Object.values(result[key]).forEach(item => {
            if (item && typeof item === 'object') item.estMod = true
          })
        }

        setProgress(Math.round(((i + 1) / entries.length) * 100))
      }

      if (result.competences) {
        result.competencesGrouped = result.competences
        result.competences = flattenCompetences(Object.values(result.competences))
      }

      if (result.metadata?.changelog) {
        result.changelog = result.metadata.changelog
      } else {
        result.changelog = []
      }

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

        specWeapons.forEach(sw => {
          result.armes[sw.slug] = sw
        })
      }

      if (result.classSpe) {
        getSpecialisations(Object.values(result.classSpe))
      }

      result.lookups = buildLookupMaps(result)

      setData(result)
      setLoading(false)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }, [])

  return { data, loading, error, progress }
}