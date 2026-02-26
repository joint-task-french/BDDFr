import json
import os
import glob

# Configuration des vrais noms de catégories (1 à 17)
CATEGORY_INFO = {
    "1": {"name": "Présentation & Logs", "desc": "Réseau SHD - Terminal d'accueil et mises à jour"},
    "2": {"name": "Ensembles de Marque", "desc": "Bonus apportés par les ensembles de marque (Brand Sets)"},
    "3": {"name": "Modèles d'Équipements", "desc": "Liste des modèles d'équipements selon les marques"},
    "4": {"name": "Ensembles d'Équipement", "desc": "Bonus des Gear Sets (4 pièces)"},
    "5": {"name": "Équipements Nommés", "desc": "Masques, Sacs, Torses nommés et talents parfaits"},
    "6": {"name": "Rolls Max Équipements", "desc": "Valeurs d'attributs maximales pour les armures (Level 40)"},
    "7": {"name": "Exotiques", "desc": "Armes et armures exotiques du réseau SHD"},
    "8": {"name": "Talents d'Équipements", "desc": "Talents pour sacs à dos et torses"},
    "9": {"name": "Armes Nommées (Vol. 1)", "desc": "Liste des armes nommées et talents parfaits"},
    "10": {"name": "Talents d'Armes", "desc": "Effets et prérequis des talents d'armes"},
    "11": {"name": "Armes Nommées (Vol. 2)", "desc": "Suite des armes nommées et obtention spécifique"},
    "12": {"name": "Statistiques des Armes", "desc": "Plages de dégâts, CPM, chargeurs et rechargement"},
    "13": {"name": "Compétences", "desc": "Variantes, statistiques par Tier et Surcharge"},
    "14": {"name": "Mods d'Armes", "desc": "Bonus, malus et localisation des mods d'armes"},
    "15": {"name": "Mods d'Équipement", "desc": "Mods offensifs, défensifs et utilitaires"},
    "16": {"name": "Rolls Max Armes", "desc": "Valeurs d'attributs maximales pour les armes (Level 40)"},
    "17": {"name": "Mods de Compétences", "desc": "Emplacements, effets des mods et statistiques max"}
}

def upgrade_jsons():
    print(">> Initialisation de l'ISAC... Restructuration des fichiers JSON en cours.")

    if not os.path.exists("data"):
        print("✗ Erreur : Le dossier 'data' est introuvable. Placez ce script au même niveau que le dossier 'data'.")
        return

    # Parcourt tous les fichiers .json présents dans le dossier data/
    for filepath in glob.glob("data/*.json"):
        filename = os.path.basename(filepath)
        file_id = filename.split('.')[0]

        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                raw_data = json.load(f)
            except json.JSONDecodeError:
                continue

        # Si le fichier possède déjà la nouvelle structure, on l'ignore pour gagner du temps
        if isinstance(raw_data, dict) and "category_name" in raw_data:
            print(f"[{filename}] Déjà aux normes SHD.")
            continue

        info = CATEGORY_INFO.get(file_id, {"name": f"Archive classifiée {file_id}", "desc": "Données réseau extraites"})

        new_data = []
        for row in raw_data:
            if not isinstance(row, dict):
                continue

            new_row = {}
            el_name = ""
            el_desc = ""

            # Heuristique : On cherche automatiquement la colonne qui sert de nom
            for k, v in row.items():
                k_lower = k.lower()
                if ("nom" in k_lower or "marque" in k_lower or "arme" in k_lower or "compétence" in k_lower or "mod" in k_lower) and not el_name and v.strip():
                    el_name = v.strip()

            # Repli : Si aucun nom clair, on prend le premier texte de la ligne
            if not el_name:
                for v in row.values():
                    if v.strip():
                        el_name = v.strip()
                        break

            # Heuristique : On cherche la description ou le talent
            for k, v in row.items():
                k_lower = k.lower()
                if ("description" in k_lower or "talent" in k_lower or "bonus" in k_lower or "effet" in k_lower) and not el_desc and v.strip():
                    el_desc = v.strip()

            # Ajout des deux clés obligatoires pour le tableau de recherche unifiée
            new_row["element_name"] = el_name if el_name else "Inconnu"
            new_row["element_description"] = el_desc if el_desc else "-"

            # Ajout des autres statistiques pour le badge "Données Tactiques"
            for k, v in row.items():
                if k.strip():
                    new_row[k.strip()] = v.strip() if v.strip() else ""

            new_data.append(new_row)

        new_json = {
            "category_name": info["name"],
            "category_description": info["desc"],
            "data": new_data
        }

        # Réécriture du fichier avec la structure officielle
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(new_json, f, ensure_ascii=False, indent=2)

        print(f"✓ [{filename}] Restructuré avec succès !")

if __name__ == "__main__":
    upgrade_jsons()
    print(">> Opération terminée. Le site web (ISAC) est prêt à charger toutes les données.")