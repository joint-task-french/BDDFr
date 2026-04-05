import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { useNavigate } from 'react-router-dom'
import {resolveAsset} from "./GameAssets.jsx";
import MermaidDiagram from "./MermaidDiagram.jsx";

export default function MarkdownText({ children, className = "" }) {
    const [zoomedImage, setZoomedImage] = useState(null);
    const navigate = useNavigate();

    if (!children) return null

    const content = Array.isArray(children)
        ? children.filter(c => typeof c === 'string' || typeof c === 'number').join('')
        : children

    if (!content) return null

    return (
        <div className={`${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                urlTransform={(url) => url}
                components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white uppercase tracking-widest mt-2 mb-4 border-b border-tactical-border pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-gray-200 uppercase tracking-widest mt-2 mb-4 border-b border-tactical-border/50 pb-1" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-shd mt-2 mb-3" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-lg font-bold text-gray-300 mt-2 mb-2" {...props} />,
                    h5: ({node, ...props}) => <h5 className="text-base font-bold text-gray-300 mt-2 mb-2 uppercase tracking-wide" {...props} />,
                    h6: ({node, ...props}) => <h6 className="text-sm font-bold text-gray-400 mt-2 mb-2 uppercase tracking-wide" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-300 leading-relaxed last:mb-0" {...props} />,
                    a: ({node, href, children, ...props}) => {
                        const isExternal = /^https?:\/\//.test(href || '');
                        const linkClass = "text-shd underline hover:opacity-80 transition-opacity cursor-pointer";
                        if (isExternal) {
                            return <a className={linkClass} href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                        }
                        const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
                        const displayHref = basePath + (href || '');
                        return <a className={linkClass} href={displayHref} onClick={(e) => { e.preventDefault(); navigate(href || ''); }} {...props}>{children}</a>;
                    },
                    strong: ({node, ...props}) => <strong className="text-shd font-bold" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-gray-400" {...props} />,
                    del: ({node, ...props}) => <del className="line-through text-gray-600" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 text-gray-300 space-y-1 last:mb-0" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 text-gray-300 space-y-1 last:mb-0" {...props} />,
                    li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-shd pl-4 py-1 italic text-gray-400 bg-tactical-hover/30 my-4 rounded-r" {...props} />,
                    code: ({node, inline, className: codeClassName, children: codeChildren, ...props}) => {
                        const match = /language-(\w+)/.exec(codeClassName || '')
                        if (!inline && match && match[1] === 'mermaid') {
                            return <MermaidDiagram chart={String(codeChildren).replace(/\n$/, '')} />
                        }
                        return inline
                            ? <code className="bg-tactical-hover text-shd px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{codeChildren}</code>
                            : <code className="block bg-transparent text-gray-300 p-0 text-sm font-mono overflow-x-auto" {...props}>{codeChildren}</code>
                    },
                    pre: ({node, children: preChildren, ...props}) => {
                        const child = Array.isArray(preChildren) ? preChildren[0] : preChildren
                        if (child?.type === MermaidDiagram) {
                            return child
                        }
                        return <pre className="bg-tactical-hover p-4 rounded my-4 overflow-x-auto border border-tactical-border" {...props}>{preChildren}</pre>
                    },
                    hr: ({node, ...props}) => <hr className="my-8 border-t border-tactical-border/50" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full text-left border-collapse text-sm text-gray-300" {...props} /></div>,
                    th: ({node, ...props}) => <th className="border-b border-tactical-border p-2 font-bold text-gray-200 uppercase tracking-wider bg-tactical-hover/50" {...props} />,
                    td: ({node, ...props}) => <td className="border-b border-tactical-border/30 p-2" {...props} />,
                    img: ({node, src, alt, ...props}) => {
                        if (!src) return null;

                        let multiplier = 1;

                        // Capture #inline, #inline-2, ou #inline-[1.5]
                        const inlineRegex = /#inline(?:-(?:\[([0-9.]+)]|([0-9.]+)))?/;
                        const inlineMatch = src.match(inlineRegex);
                        const forceInline = !!inlineMatch;
                        const forceBlock = src.includes('#block');

                        // Extraction du multiplicateur
                        if (inlineMatch) {
                            // Match 1 = entre crochets [], Match 2 = chiffre direct
                            const val = inlineMatch[1] || inlineMatch[2];
                            if (val) {
                                const parsed = parseFloat(val);
                                if (!isNaN(parsed)) {
                                    multiplier = parsed;
                                }
                            }
                        }

                        // Nettoyage de l'URL
                        const cleanSrc = src.replace(inlineRegex, '').replace('#block', '');

                        let isInline = forceInline || (cleanSrc.startsWith('slug:') && !forceBlock);
                        let imageUrl = cleanSrc;

                        if (cleanSrc.startsWith('slug:')) {
                            const imageSlug = cleanSrc.substring(5);
                            imageUrl = resolveAsset(imageSlug);

                            if (!imageUrl) return null;
                        }

                        // Suppression de h-[1.2em] des classes pour pouvoir gérer la taille via l'attribut style
                        const classes = isInline
                            ? "w-auto inline-block align-middle mx-1 -mt-1 rounded-sm object-contain"
                            : "max-w-full h-auto rounded border border-tactical-border my-4 block mx-auto cursor-zoom-in hover:border-shd transition-colors";

                        const { src: _origSrc, alt: _origAlt, ...safeProps } = props;

                        // Calcul et application du multiplicateur sur la hauteur de base (1.2em)
                        const styles = isInline ? { height: `${1.2 * multiplier}em` } : {};

                        return (
                            <img
                                {...safeProps}
                                className={classes}
                                style={styles}
                                loading="lazy"
                                alt={alt || ''}
                                src={imageUrl}
                                onClick={isInline ? undefined : () => setZoomedImage(imageUrl)}
                            />
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>

            {/* Modal de zoom */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 sm:p-8 cursor-zoom-out backdrop-blur-sm transition-all duration-300"
                    onClick={() => setZoomedImage(null)}
                >
                    <img
                        src={zoomedImage}
                        alt="Zoomed preview"
                        className="max-w-full max-h-full object-contain rounded shadow-2xl"
                    />
                </div>
            )}
        </div>
    )
}