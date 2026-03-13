import re

with open("src/hooks/useDataLoader.js", "r") as f:
    content = f.read()

content = content.replace(
    "export function useDataLoader() {",
    "import { useGame } from '../context/GameContext.jsx'\n\nexport function useDataLoader() {"
)

content = content.replace(
"""  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {""",
"""  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const { currentGame } = useGame()

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoading(true)
      setProgress(0)"""
)

content = content.replace(
"""          const raw = await loadJsonc(`${BASE}data/${file}`)""",
"""          const raw = await loadJsonc(`${BASE}data/${currentGame}/${file}`)"""
)

content = content.replace(
"""    loadAll()
    return () => { cancelled = true }
  }, [])""",
"""    loadAll()
    return () => { cancelled = true }
  }, [currentGame])"""
)

with open("src/hooks/useDataLoader.js", "w") as f:
    f.write(content)
