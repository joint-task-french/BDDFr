/**
 * Remontee des erreurs client.
 *
 * Raison d'etre : deux pannes bloquantes (ecran blanc, catalogue vide) sont
 * restees en production sans que personne le sache. Sans signal, la prochaine
 * se decouvrira de la meme facon — par hasard.
 *
 * Activation : definir `VITE_ERROR_WEBHOOK` au build (URL de webhook Discord,
 * ou tout endpoint acceptant un POST JSON). Sans cette variable, le module se
 * contente de journaliser en console : aucun appel reseau, aucun effet.
 *
 * Ne transmet jamais de donnees utilisateur : uniquement le message d'erreur,
 * la pile, l'URL de la page et la version applicative.
 */

const WEBHOOK = import.meta.env.VITE_ERROR_WEBHOOK || null

// Garde-fous : une erreur dans une boucle de rendu peut se declencher des
// centaines de fois par seconde. On ne veut ni noyer le canal, ni la page.
const MAX_PAR_SESSION = 5
const dejaVues = new Set()
let envoyees = 0

function signature(message, stack) {
  return `${message}::${(stack || '').split('\n').slice(0, 3).join('|')}`
}

function formatPayload(message, stack, contexte) {
  const lignes = [
    `**Erreur BDDFr** — ${contexte}`,
    `\`${String(message).slice(0, 400)}\``,
    `Page : ${location.hash || '/'} · Version : ${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'inconnue'}`,
  ]
  if (stack) {
    lignes.push('```')
    lignes.push(String(stack).split('\n').slice(0, 8).join('\n').slice(0, 1200))
    lignes.push('```')
  }
  // `content` est le champ attendu par les webhooks Discord ; les autres
  // endpoints recoivent simplement un JSON avec des champs structures a cote.
  return {
    content: lignes.join('\n'),
    message: String(message).slice(0, 400),
    stack: stack ? String(stack).slice(0, 2000) : null,
    contexte,
    page: location.hash || '/',
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null,
    userAgent: navigator.userAgent,
  }
}

export function reportError(error, contexte = 'inconnu') {
  const message = error?.message || String(error)
  const stack = error?.stack || null

  console.error(`[${contexte}]`, error)

  if (!WEBHOOK) return

  const sig = signature(message, stack)
  if (dejaVues.has(sig)) return
  dejaVues.add(sig)

  if (envoyees >= MAX_PAR_SESSION) return
  envoyees++

  try {
    // `keepalive` permet a la requete de survivre a la fermeture de l'onglet,
    // frequente quand la page vient de casser.
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formatPayload(message, stack, contexte)),
      keepalive: true,
      mode: 'cors',
    }).catch(() => { /* la remontee ne doit jamais casser l'app */ })
  } catch {
    /* idem */
  }
}

let installe = false

/** Installe les gestionnaires globaux. Idempotent. */
export function initErrorReporting() {
  if (installe) return
  installe = true

  window.addEventListener('error', (e) => {
    // Les erreurs de chargement de ressources n'ont pas d'objet Error.
    if (e.error) reportError(e.error, 'erreur globale')
    else if (e.message) reportError(new Error(e.message), 'erreur globale')
  })

  window.addEventListener('unhandledrejection', (e) => {
    reportError(e.reason instanceof Error ? e.reason : new Error(String(e.reason)), 'promesse rejetee')
  })
}

/** Reserve aux tests. */
export function __resetErrorReporter() {
  dejaVues.clear()
  envoyees = 0
  installe = false
}

export const __isEnabled = () => Boolean(WEBHOOK)
