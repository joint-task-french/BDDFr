# BDDFr - Base de Données Française pour The Division 2

Bienvenue dans le projet **BDDFr**, une base de données communautaire et open-source regroupant les informations essentielles sur le jeu **The Division 2**. 

Ce projet permet de consulter et de contribuer aux données concernant les armes, équipements, compétences, talents et bien plus encore, le tout structuré pour être facilement maintenable et extensible.

## 🚀 Fonctionnalités

- **Base de données complète** : Armes, équipements, ensembles de marque/set, compétences, mods et statistiques.
- **Support JSONC** : Données stockées au format JSON avec commentaires pour une meilleure lisibilité.
- **Génération statique** : Scripts pour générer des pages statiques et des images dans les embeds sur les réseaux sociaux.
- **Validation automatique** : Utilisation de schémas JSON pour garantir l'intégrité des données.
- **Build Planner** : Outil intégré pour planifier et visualiser vos builds.
- **Open Source** : Système de contribution via GitHub (Issues et Pull Requests).

## 🛠️ Installation et Développement

### Prérequis
- [Node.js](https://nodejs.org/) (version recommandée : 18+)
- npm

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/joint-task-french/BDDFr.git
cd BDDFr

# Installer les dépendances
npm install
```

### Scripts disponibles
- `npm run dev` : Lance le serveur de développement Vite.
- `npm run build` : Compile le projet pour la production et génère les pages statiques.
- `npm run sync-data` : Synchronise les fichiers de données de `src/data/` vers `public/data/`.
- `npm run validate` : Valide les fichiers JSONC par rapport aux schémas définis.

## 📁 Structure du Projet

- `src/data/` : Contient les sources de données au format `.jsonc`.
- `src/data/schemas/` : Schémas de validation JSON.
- `src/components/` : Composants React de l'interface utilisateur.
- `src/config/` : Configurations pour les filtres et les champs du générateur.
- `scripts/` : Utilitaires pour la migration, la synchronisation et la validation des données.
- `public/` : Ressources statiques (images, polices, données synchronisées).

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. **Signaler une erreur** : Ouvrez une Issue si vous constatez une donnée erronée ou manquante.
2. **Proposer une modification** :
    - Forkez le projet.
    - Modifiez les fichiers concernés dans `src/data/`.
    - Vérifiez la validité avec `npm run validate`.
    - Soumettez une Pull Request.

Un workflow GitHub est en place pour transformer automatiquement certaines issues de contribution soumise via le site en Pull Requests.

## 📜 Crédits

Ce projet est maintenu par la communauté française de The Division 2. Un grand merci à tous les contributeurs : 
- Raven
- Major45-FR
- marco888
- Squal_fr
- Franck-FR
- Saiyanns
- V0ldeen
- Ben3and
- Titi-FT-70
- PP.1974-fr
- Captain77
- ocelus_ftnl
- NicoLeFourbe
- MastoroZ

---
