with open("scripts/validate-schemas.mjs", "r") as f:
    content = f.read()

content = content.replace("(\//(?:.*)$)", "(\\/\\/(?:.*)$)")

with open("scripts/validate-schemas.mjs", "w") as f:
    f.write(content)
