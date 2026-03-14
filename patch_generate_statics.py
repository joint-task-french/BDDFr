with open("scripts/generate-static-pages.mjs", "r") as f:
    content = f.read()

content = content.replace(
    "const DATA_DIR = './src/data';",
    "const DATA_DIR = './src/data/td2';"
)

with open("scripts/generate-static-pages.mjs", "w") as f:
    f.write(content)

with open("scripts/generate-static-pages-images.mjs", "r") as f:
    content = f.read()

content = content.replace(
    "const DATA_DIR = './src/data';",
    "const DATA_DIR = './src/data/td2';"
)

with open("scripts/generate-static-pages-images.mjs", "w") as f:
    f.write(content)
