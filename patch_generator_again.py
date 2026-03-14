with open("src/pages/GeneratorPage.jsx", "r") as f:
    content = f.read()

content = content.replace(
"""export default function GeneratorPage() {
  const { data, loading, error, progress } = useDataLoader()
  const { currentGame } = useGame()""",
"""export default function GeneratorPage() {
  const { data, loading, error, progress } = useDataLoader()
  const { currentGame } = useGame()"""
)

# Fix title
content = content.replace(
"""          <p className="text-sm text-gray-500">Ajout / Édition de données pour la Base de Données The Division 2</p>""",
"""          <p className="text-sm text-gray-500">Ajout / Édition de données pour la Base de Données {currentGame === 'td1' ? 'The Division 1' : 'The Division 2'}</p>"""
)

# Fix export path inside generator
content = content.replace(
"""zip.file(`data/${fileName}`, JSON.stringify(exportedData, null, 2))""",
"""zip.file(`data/${currentGame}/${fileName}`, JSON.stringify(exportedData, null, 2))"""
)

with open("src/pages/GeneratorPage.jsx", "w") as f:
    f.write(content)
