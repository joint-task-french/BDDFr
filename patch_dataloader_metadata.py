with open("src/hooks/useDataLoader.js", "r") as f:
    content = f.read()

content = content.replace(
"""          const raw = await loadJsonc(`${BASE}data/${currentGame}/${file}`)""",
"""          const raw = key === 'metadata'
            ? await loadJsonc(`${BASE}data/${file}`)
            : await loadJsonc(`${BASE}data/${currentGame}/${file}`)"""
)

with open("src/hooks/useDataLoader.js", "w") as f:
    f.write(content)
