with open("scripts/validate-schemas.mjs", "r") as f:
    content = f.read()

content = content.replace(
    "const SCHEMA_DIR = join(__dirname, '..', 'src', 'data', 'schemas')",
    "const SCHEMA_DIR = join(__dirname, '..', 'src', 'data', 'td2', 'schemas')"
)

with open("scripts/validate-schemas.mjs", "w") as f:
    f.write(content)
