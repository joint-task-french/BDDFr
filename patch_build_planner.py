with open("src/pages/BuildPlannerPage.jsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { BuildProvider, useBuild } from '../context/BuildContext'",
    "import { BuildProvider, useBuild } from '../context/BuildContext'\nimport { useGame } from '../context/GameContext'"
)

content = content.replace(
    """function BuildPlannerContent({ data }) {
  const { dispatch } = useBuild()
  const location = useLocation()""",
    """function BuildPlannerContent({ data }) {
  const { dispatch } = useBuild()
  const location = useLocation()
  const { currentGame } = useGame()"""
)

content = content.replace(
    """          <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
            Build <span className="text-shd">Planner</span>
          </h2>
          <p className="text-sm text-gray-500">Concevez votre build The Division 2</p>""",
    """          <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-1">
            Build <span className="text-shd">Planner</span>
          </h2>
          <p className="text-sm text-gray-500">Concevez votre build {currentGame === 'td1' ? 'The Division 1' : 'The Division 2'}</p>"""
)

with open("src/pages/BuildPlannerPage.jsx", "w") as f:
    f.write(content)
