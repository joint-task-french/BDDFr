import { Component } from 'react'
import { reportError } from '../../utils/errorReporter'

/**
 * Filet de securite racine : sans lui, la moindre exception de rendu
 * (JSONC malforme, donnee manquante, bug d'un composant) demonte tout l'arbre
 * React et laisse un ecran blanc sans aucun message.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, errorInfo) {
        reportError(error, 'rendu React')
        console.error('Pile de composants :', errorInfo?.componentStack)
    }

    handleReset = () => {
        this.setState({ error: null })
    }

    handleHardReset = () => {
        // Dernier recours : un state de build corrompu en localStorage peut
        // faire replanter l'app a chaque chargement.
        try {
            localStorage.removeItem('div2_current_build')
        } catch (e) {
            console.warn('Impossible de nettoyer le localStorage', e)
        }
        window.location.reload()
    }

    render() {
        const { error } = this.state
        if (!error) return this.props.children

        return (
            <div className="min-h-screen bg-tactical-bg flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-red-400 uppercase tracking-widest mb-3">
                    Erreur inattendue
                </h1>
                <p className="text-gray-400 text-sm max-w-lg mb-2">
                    Une erreur a interrompu l'affichage de la page. Le detail ci-dessous peut
                    aider a la corriger&nbsp;:
                </p>
                <pre className="text-xs text-red-300 bg-tactical-hover border border-tactical-border rounded p-3 max-w-lg overflow-x-auto text-left mb-6">
                    {error?.message || String(error)}
                </pre>
                <div className="flex flex-wrap gap-3 justify-center">
                    <button
                        onClick={this.handleReset}
                        className="px-4 py-2 bg-shd/20 border border-shd text-shd text-sm uppercase tracking-wider hover:bg-shd/30 transition-colors"
                    >
                        Reessayer
                    </button>
                    <button
                        onClick={this.handleHardReset}
                        className="px-4 py-2 border border-tactical-border text-gray-300 text-sm uppercase tracking-wider hover:bg-tactical-hover transition-colors"
                    >
                        Reinitialiser le build et recharger
                    </button>
                </div>
            </div>
        )
    }
}
