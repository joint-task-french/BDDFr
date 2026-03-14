with open("src/App.jsx", "r") as f:
    content = f.read()

content = content.replace(
    "import Loader from './components/common/Loader'",
    "import Loader from './components/common/Loader'\nimport { GameProvider } from './context/GameContext'"
)

content = content.replace(
    """  return (
    <Routes>
        <Route element={<Layout />}>""",
    """  return (
    <GameProvider>
      <Routes>
        <Route element={<Layout />}>"""
)

content = content.replace(
    """        </Route>
    </Routes>
  )""",
    """        </Route>
      </Routes>
    </GameProvider>
  )"""
)

with open("src/App.jsx", "w") as f:
    f.write(content)
