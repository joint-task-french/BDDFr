import { useState, useEffect } from 'react'
import { loadJsonc } from '../utils/dataLoader'
import { flattenCompetences } from '../utils/competenceUtils'
import { getSpecialisations } from '../utils/formatters'
import { buildLookupMaps } from '../utils/lookupMaps'

const BASE = import.meta.env.BASE_URL

const DATA_FILES = {
  armes: 'armes.jsonc',
  equipements: 'equipements.jsonc',
  attributs: 'attributs.jsonc',
  talentsArmes: 'talents-armes.jsonc',
  talentsEquipements: 'talents-equipements.jsonc',
  ensembles: 'ensembles.jsonc',
  competences: 'competences.jsonc',
  classSpe: 'class-spe.jsonc',
  modsArmes: 'mods-armes.jsonc',
  modsEquipements: 'mods-equipements.jsonc',
  modsCompetences: 'mods-competences.jsonc',
  metadata: 'metadata.jsonc',
  changelog: 'changelog.jsonc',
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
          result[key] = await loadJsonc(`${BASE}data/${file}`)
          if (!cancelled) setProgress(Math.round(((i + 1) / entries.length) * 100))
        }
        if (!cancelled) {
          // Post-process: flatten competences for consumers, keep grouped for generator
          if (result.competences) {
            result.competencesGrouped = result.competences
            result.competences = flattenCompetences(result.competences)
          }
          // Initialize specialisations cache for components outside BuildProvider
          if (result.classSpe) {
            getSpecialisations(result.classSpe)
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

