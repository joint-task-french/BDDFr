with open("scripts/validate-schemas.mjs", "r") as f:
    content = f.read()

content = content.replace(
"""for (const { data: dataFile, schema: schemaFile } of VALIDATIONS) {
  totalFiles++
  const dataPath = join(DATA_DIR, dataFile)""",
"""for (const { data: dataFile, schema: schemaFile } of VALIDATIONS) {
  totalFiles++
  const dataPath = dataFile === 'metadata.jsonc' ? join(DATA_DIR, '..', dataFile) : join(DATA_DIR, dataFile)"""
)

with open("scripts/validate-schemas.mjs", "w") as f:
    f.write(content)
