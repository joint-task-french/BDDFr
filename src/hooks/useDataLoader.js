import { useState, useEffect } from 'react'
import { loadJsonc } from '../utils/dataLoader'

const BASE = import.meta.env.BASE_URL

const DATA_FILES = {
  armes: 'armes.jsonc',
  equipements: 'equipements.jsonc',
  attributs: 'attributs.jsonc',
  talentsArmes: 'talents-armes.jsonc',
  talentsEquipements: 'talents-equipements.jsonc',
  ensembles: 'ensembles.jsonc',
  competences: 'competences.jsonc',
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

