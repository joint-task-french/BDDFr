import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/**
 * ESLint est introduit sur une base de code existante : ~60 violations
 * preexistantes (surtout `set-state-in-effect` et `rules-of-hooks`) touchent
 * des composants sans couverture de test. Les corriger en masse serait plus
 * risque qu'utile.
 *
 * Strategie : ces regles-la sont en `warn` (dette visible, a resorber
 * progressivement), tout le reste est en `error`.
 *
 *   npm run lint        — echoue sur toute NOUVELLE erreur (les warnings passent)
 *   npm run lint:ci     — cliquet : echoue si le nombre d'avertissements DEPASSE
 *                         le plafond fige dans package.json. Quand vous en
 *                         resorbez, abaissez ce plafond dans la foulee : la
 *                         dette ne peut alors que decroitre.
 *   npm run lint:strict — objectif final : zero avertissement.
 *
 * Pour retirer une regle de la dette : corrigez ses occurrences, puis
 * deplacez-la de LEGACY_DEBT_* vers les regles en `error`.
 */
// Dette portant sur les regles react-hooks (necessite le plugin).
const LEGACY_DEBT_HOOKS = {
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/rules-of-hooks': 'warn',
  'react-hooks/exhaustive-deps': 'warn',
  'react-hooks/immutability': 'warn',
  'react-hooks/preserve-manual-memoization': 'warn',
}

// Dette portant sur les regles ESLint de base.
const LEGACY_DEBT_CORE = {
  'no-case-declarations': 'warn',
  'no-prototype-builtins': 'warn',
  'no-constant-binary-expression': 'warn',
  'no-empty': 'warn',
  'no-useless-escape': 'warn',
}

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/data/**', '.eslint-report.json'] },

  // Code applicatif (navigateur)
  {
    files: ['src/**/*.{js,jsx}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
        __REPOS_URL__: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...LEGACY_DEBT_HOOKS,
      ...LEGACY_DEBT_CORE,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      // `console.log` en production : bruit et fuite d'informations
      // (les logs d'authentification exposaient le flux de token).
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // Scripts Node (build, validation, CI)
  {
    files: ['scripts/**/*.mjs', '*.config.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...LEGACY_DEBT_CORE,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },

  // Scripts pilotant un navigateur via Puppeteer : le corps des
  // `page.evaluate()` s'execute dans la page, avec les globals du navigateur.
  {
    files: [
      'scripts/generate-static-pages-images.mjs',
      'scripts/smoke-test.mjs',
      'scripts/extract/**/*.mjs',
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },

  // Tests
  {
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { 'no-console': 'off' },
  },
]
