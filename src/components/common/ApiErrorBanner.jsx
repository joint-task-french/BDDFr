import { useEffect, useState } from 'react'
import { API_ERROR_EVENT, apiBuildotheque } from '../../utils/apiBuildotheque'

/**
 * Banniere d'indisponibilite de la Buildotheque.
 *
 * Sans elle, une panne de l'API se traduisait par un simple « aucun build » :
 * l'utilisateur ne pouvait pas distinguer un service tombe d'une recherche
 * sans resultat, et relancait indefiniment la meme requete.
 */
export default function ApiErrorBanner() {
    const [message, setMessage] = useState(() => apiBuildotheque.getLastError()?.message || null)

    useEffect(() => {
        const onError = (e) => setMessage(e.detail?.message || 'Service indisponible.')
        window.addEventListener(API_ERROR_EVENT, onError)
        return () => window.removeEventListener(API_ERROR_EVENT, onError)
    }, [])

    if (!message) return null

    const dismiss = () => {
        apiBuildotheque.clearLastError()
        setMessage(null)
    }

    return (
        <div
            role="alert"
            className="mb-6 flex items-start gap-3 border border-red-500/50 bg-red-500/10 rounded px-4 py-3"
        >
            <span aria-hidden="true" className="text-red-400 font-bold leading-6">!</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-300 uppercase tracking-wider">
                    Buildothèque indisponible
                </p>
                <p className="text-sm text-gray-300 break-words">{message}</p>
                <p className="text-xs text-gray-500 mt-1">
                    Vos builds enregistrés en local restent accessibles.
                </p>
            </div>
            <button
                onClick={dismiss}
                aria-label="Masquer le message"
                className="text-gray-500 hover:text-gray-300 transition-colors px-1 leading-none"
            >
                ×
            </button>
        </div>
    )
}
