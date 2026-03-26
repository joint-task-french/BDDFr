import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

/**
 * Composant MarkdownText qui encapsule les textes nécessitant une mise en forme Markdown.
 * Utilise whitespace-pre-line par défaut pour gérer l'affichage de plusieurs lignes.
 */
export default function MarkdownText({ children, className = "" }) {
  if (!children) return null

  // On concatène les enfants s'ils sont passés sous forme de tableau (ex: expressions conditionnelles)
  const content = Array.isArray(children) 
    ? children.filter(c => typeof c === 'string' || typeof c === 'number').join('')
    : children

  if (!content) return null

  return (
    <div className={`whitespace-pre-line ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // On réduit les marges par défaut pour un rendu compact adapté aux cartes
          p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
          // Style pour les liens
          a: ({node, ...props}) => <a className="text-shd underline hover:opacity-80 transition-opacity" {...props} />,
          // On ajoute un style spécifique pour le texte en gras pour les valeurs
          strong: ({node, ...props}) => <strong className="text-shd font-bold" {...props} />,
          // Style pour les listes
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-1 last:mb-0" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-1 last:mb-0" {...props} />,
          li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
          // Style pour les citations
          blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-tactical-border pl-3 italic text-gray-500 my-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
