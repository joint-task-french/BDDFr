with open("src/pages/DatabasePage.jsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { useParams, useNavigate, useSearchParams } from 'react-router-dom'",
    "import { useParams, useNavigate, useSearchParams } from 'react-router-dom'\nimport { useGame } from '../context/GameContext'"
)

content = content.replace(
    """  const { data, loading, error, progress } = useDataLoader()
  const { category, slug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()""",
    """  const { data, loading, error, progress } = useDataLoader()
  const { category, slug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentGame } = useGame()"""
)

content = content.replace(
    """          <p className="text-sm text-gray-500">The Division 2 — Données en français</p>""",
    """          <p className="text-sm text-gray-500">{currentGame === 'td1' ? 'The Division 1' : 'The Division 2'} — Données en français</p>"""
)

with open("src/pages/DatabasePage.jsx", "w") as f:
    f.write(content)
