with open("scripts/validate-schemas.mjs", "r") as f:
    content = f.read()

content = content.replace(
"""for (const file of FILES_TO_VALIDATE) {
  const dataPath = join(DATA_DIR, file)
  const schemaName = file.replace('.jsonc', '.schema.json')
  const schemaPath = join(SCHEMA_DIR, schemaName)""",
"""for (const file of FILES_TO_VALIDATE) {
  const dataPath = file === 'metadata.jsonc' ? join(DATA_DIR, '..', file) : join(DATA_DIR, file)
  const schemaName = file.replace('.jsonc', '.schema.json')
  const schemaPath = join(SCHEMA_DIR, schemaName)"""
)

with open("scripts/validate-schemas.mjs", "w") as f:
    f.write(content)
