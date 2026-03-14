import re

with open("scripts/validate-schemas.mjs", "r") as f:
    content = f.read()

content = content.replace(
    "const DATA_DIR = path.join(__dirname, '../src/data');",
    "const DATA_DIR = path.join(__dirname, '../src/data/td2');"
)

with open("scripts/validate-schemas.mjs", "w") as f:
    f.write(content)
