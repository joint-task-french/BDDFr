import urllib.request
import csv
import json
import os

# Liste des fichiers à générer et leurs identifiants Google Sheet correspondants
# Format : (numéro_fichier, "gid_google_sheet")
sources = [
    (1, "231694488"),
    (2, "343675342"),
    (3, "75552353"),
    (4, "1622743915"),
    (5, "1216119849"),
    (6, "919620538"),
    (7, "1094383333"),
    (8, "1118126881"),
    (9, "1023439180"),
    (10, "726143234"),
    (11, "625596718"),
    (12, "841737552"),
    (13, "1822287271"),
    (14, "800549283"),
    (15, "1713925069"),
    (16, "286271050"),
    (17, "924553089")
]

base_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRE4UTNoEFXXhEcTc42rqHsXfJcU-KKGuklNXyjSEAkwlcjzw4qp4p1JTxa9O-yDitiPfnu1yBCxhID/pub?single=true&output=csv&gid="

# Créer le dossier /data s'il n'existe pas
output_dir = "data"
os.makedirs(output_dir, exist_ok=True)

print(">> Début du téléchargement des données The Division 2...")

for file_num, gid in sources:
    url = f"{base_url}{gid}"
    output_file = os.path.join(output_dir, f"{file_num}.json")

    print(f"Traitement du fichier {file_num}.json (GID: {gid})...", end=" ", flush=True)

    try:
        # Téléchargement des données CSV depuis l'URL
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            csv_content = response.read().decode('utf-8')

        # On lit le CSV de manière brute
        lines = csv_content.splitlines()
        reader = csv.reader(lines)
        all_rows = list(reader)

        # 1. RECHERCHE DU PREMIER TEXTE POUR SERVIR D'EN-TÊTE
        header_index = -1
        for i, row in enumerate(all_rows):
            # Dès qu'une ligne contient au moins un texte, on la prend
            if any(cell.strip() for cell in row):
                header_index = i
                break

        if header_index == -1:
            print("✗ Avertissement : Aucun texte trouvé sur cette page.")
            continue

        raw_headers = all_rows[header_index]
        headers = []

        # Sécurisation des en-têtes (on remplace les cases vides par "Colonne_X")
        for i, h in enumerate(raw_headers):
            clean_h = h.strip()
            if clean_h:
                headers.append(clean_h)
            else:
                headers.append(f"Colonne_{i+1}")

        # 2. EXTRACTION DE TOUTES LES DONNÉES (SANS EXCEPTION)
        data = []
        for row in all_rows[header_index + 1:]:
            # On ignore UNIQUEMENT les lignes 100% vides
            non_empty_cells = [cell.strip() for cell in row if cell.strip()]
            if len(non_empty_cells) == 0:
                continue

            item = {}
            has_real_data = False

            # On parcourt chaque cellule de la ligne
            for i, cell_val in enumerate(row):
                val = cell_val.strip()

                # Si la ligne contient plus de données que prévu, on ajoute un en-tête à la volée
                if i >= len(headers):
                    headers.append(f"Colonne_{i+1}")

                header_name = headers[i]
                item[header_name] = val

                if val:
                    has_real_data = True

            # On sauvegarde la ligne si elle a au moins un texte
            if has_real_data:
                data.append(item)

        # Sauvegarde en JSON formaté (indenté pour la lisibilité)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"✓ Succès ({len(data)} éléments extraits)")

    except Exception as e:
        print(f"✗ Erreur : {e}")

print("\n>> Extraction terminée ! Tous les textes sont sauvegardés dans le dossier 'data'.")