with open("src/pages/ChangelogPage.jsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { useDataLoader } from '../hooks/useDataLoader'",
    "import { useDataLoader } from '../hooks/useDataLoader'\nimport { useGame } from '../context/GameContext'"
)

content = content.replace(
    """export default function ChangelogPage() {
  const { data, loading, error, progress } = useDataLoader()""",
    """export default function ChangelogPage() {
  const { data, loading, error, progress } = useDataLoader()
  const { currentGame } = useGame()"""
)

content = content.replace(
    """<p className="text-sm text-gray-500">Historique des mises à jour de The Division 2</p>""",
    """<p className="text-sm text-gray-500">Historique des mises à jour de {currentGame === 'td1' ? 'The Division 1' : 'The Division 2'}</p>"""
)

with open("src/pages/ChangelogPage.jsx", "w") as f:
    f.write(content)
