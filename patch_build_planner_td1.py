with open("src/pages/BuildPlannerPage.jsx", "r") as f:
    content = f.read()

content = content.replace(
    "function BuildPlannerContent({ data }) {",
    "function TD2BuildPlannerContent({ data }) {"
)

td1_placeholder = """
function TD1BuildPlannerContent({ data }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest mb-4">
        Build <span className="text-shd">Planner</span> - The Division 1
      </h2>
      <p className="text-gray-400">
        Le Build Planner pour The Division 1 est en cours de construction.
      </p>
    </div>
  )
}

function BuildPlannerContent({ data }) {
  const { currentGame } = useGame()
  if (currentGame === 'td1') {
    return <TD1BuildPlannerContent data={data} />
  }
  return <TD2BuildPlannerContent data={data} />
}
"""

content = content.replace(
    "export default function BuildPlannerPage() {",
    td1_placeholder + "\nexport default function BuildPlannerPage() {"
)

# the previous substitution replaces the 'const { currentGame } = useGame()' inside TD2BuildPlannerContent because we now have one inside BuildPlannerContent.
# Actually, the previously named BuildPlannerContent (now TD2BuildPlannerContent) has `const { currentGame } = useGame()`. Let's remove it since it's only TD2 now.
content = content.replace(
    "  const { currentGame } = useGame()\n\n  // Charger un build depuis l'URL au montage",
    "  // Charger un build depuis l'URL au montage"
)

content = content.replace(
    "{currentGame === 'td1' ? 'The Division 1' : 'The Division 2'}",
    "The Division 2"
)

with open("src/pages/BuildPlannerPage.jsx", "w") as f:
    f.write(content)
