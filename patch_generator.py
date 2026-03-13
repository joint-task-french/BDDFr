with open("src/pages/GeneratorPage.jsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { useDataLoader } from '../hooks/useDataLoader'",
    "import { useDataLoader } from '../hooks/useDataLoader'\nimport { useGame } from '../context/GameContext'"
)

content = content.replace(
    """export default function GeneratorPage() {
  const { data, loading, error, progress } = useDataLoader()""",
    """export default function GeneratorPage() {
  const { data, loading, error, progress } = useDataLoader()
  const { currentGame } = useGame()"""
)

content = content.replace(
    """<p className="text-sm text-gray-500">Ajout / Édition de données pour la Base de Données The Division 2</p>""",
    """<p className="text-sm text-gray-500">Ajout / Édition de données pour la Base de Données {currentGame === 'td1' ? 'The Division 1' : 'The Division 2'}</p>"""
)

with open("src/pages/GeneratorPage.jsx", "w") as f:
    f.write(content)
