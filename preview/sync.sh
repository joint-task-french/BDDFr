#!/bin/sh

# ==========================================
# CONFIGURATION VIA VARIABLES D'ENVIRONNEMENT
# ==========================================
if [ -z "$REPO_URL" ] || [ -z "$DOMAIN" ] || [ -z "$BASE_PATH" ]; then
    echo "❌ ERREUR : Les variables REPO_URL, DOMAIN et BASE_PATH doivent être définies."
    exit 1
fi

# Nettoyage et formatage du BASE_PATH pour éviter les doubles slash (ex: "BDDFr" -> "/BDDFr")
BP_CLEAN="/$(echo "$BASE_PATH" | sed 's/^\///' | sed 's/\/$//')"

# Le dossier final où atterriront toutes les branches (ex: /var/www/html/BDDFr)
DEST_DIR="/var/www/html$BP_CLEAN"
WORK_DIR="/tmp/workdir"
INTERVAL_SECONDS=120

mkdir -p $DEST_DIR
mkdir -p $WORK_DIR
cd $WORK_DIR

if [ ! -d ".git" ]; then
    echo "📥 Clone initial du dépôt depuis $REPO_URL..."
    git clone $REPO_URL .
fi

while true; do
    echo "🔄 [$(date +'%H:%M:%S')] Vérification des mises à jour..."
    git fetch --all --prune --quiet

    active_safe_branches=""

    # --- ÉTAPE 1 : COMPILATION ---
    for branch in $(git branch -r | grep origin/ | grep -v HEAD | sed 's/origin\///'); do

        # Filtrage Regex optionnel
        if [ -n "$BRANCH_REGEX" ]; then
            if ! echo "$branch" | grep -Eq "$BRANCH_REGEX"; then continue; fi
        fi

        safe_branch=$(echo "$branch" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9]/-/g' -e 's/^-//' -e 's/-$//')
        active_safe_branches="$active_safe_branches $safe_branch"

        remote_hash=$(git rev-parse origin/$branch)
        hash_file="$DEST_DIR/$safe_branch.hash"
        current_hash=""
        if [ -f "$hash_file" ]; then current_hash=$(cat "$hash_file"); fi

        if [ "$remote_hash" != "$current_hash" ]; then
            echo "🚀 Nouvelle version détectée sur la branche '$branch' ($remote_hash)."

            git checkout -f $branch --quiet
            git reset --hard origin/$branch --quiet

            npm ci --silent

            # --- LA MAGIE EST ICI ---
            # On force la variable d'environnement VITE_BASE_PATH pour que Vite l'utilise
            FULL_BASE_PATH="$BP_CLEAN/$safe_branch/"
            VITE_BASE_PATH="$FULL_BASE_PATH" npm run build

            # Déplacement des fichiers
            rm -rf "$DEST_DIR/$safe_branch"
            mkdir -p "$DEST_DIR/$safe_branch"
            cp -r dist/* "$DEST_DIR/$safe_branch/"

            echo "$remote_hash" > "$hash_file"
            echo "✅ Branche déployée sur https://$DOMAIN$FULL_BASE_PATH"
        fi
    done

    # --- ÉTAPE 2 : NETTOYAGE ---
    for dir in $(find $DEST_DIR -mindepth 1 -maxdepth 1 -type d); do
        dir_name=$(basename $dir)
        is_active=false
        for active_branch in $active_safe_branches; do
            if [ "$dir_name" = "$active_branch" ]; then is_active=true; break; fi
        done

        if [ "$is_active" = false ]; then
            echo "🧹 Nettoyage de la branche supprimée : '$dir_name'..."
            rm -rf "$dir"
            rm -f "$DEST_DIR/$dir_name.hash"
        fi
    done

    # --- ÉTAPE 3 : LOGS ---
    echo "🌐 Environnements actuellement en ligne :"
    count=0
    for dir in $(find $DEST_DIR -mindepth 1 -maxdepth 1 -type d | sort); do
        dir_name=$(basename $dir)
        echo "   👉 https://$DOMAIN$BP_CLEAN/$dir_name/"
        count=$((count + 1))
    done
    if [ "$count" -eq 0 ]; then echo "   (Aucune branche actuellement déployée)"; fi
    echo "---------------------------------------------------"

    sleep $INTERVAL_SECONDS
done