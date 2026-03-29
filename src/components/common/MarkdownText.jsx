import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import {resolveIcon} from "../../utils/gameAssets.jsx";

export default function MarkdownText({ children, className = "" }) {
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
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white uppercase tracking-widest mt-8 mb-4 border-b border-tactical-border pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-gray-200 uppercase tracking-widest mt-8 mb-4 border-b border-tactical-border/50 pb-1" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-shd mt-6 mb-3" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-lg font-bold text-gray-300 mt-4 mb-2" {...props} />,
                    h5: ({node, ...props}) => <h5 className="text-base font-bold text-gray-300 mt-4 mb-2 uppercase tracking-wide" {...props} />,
                    h6: ({node, ...props}) => <h6 className="text-sm font-bold text-gray-400 mt-4 mb-2 uppercase tracking-wide" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-300 leading-relaxed last:mb-0" {...props} />,
                    a: ({node, ...props}) => <a className="text-shd underline hover:opacity-80 transition-opacity" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-shd font-bold" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-gray-400" {...props} />,
                    del: ({node, ...props}) => <del className="line-through text-gray-600" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 text-gray-300 space-y-1 last:mb-0" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 text-gray-300 space-y-1 last:mb-0" {...props} />,
                    li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-shd pl-4 py-1 italic text-gray-400 bg-tactical-hover/30 my-4 rounded-r" {...props} />,
                    code: ({node, inline, ...props}) =>
                        inline
                            ? <code className="bg-tactical-hover text-shd px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                            : <code className="block bg-transparent text-gray-300 p-0 text-sm font-mono overflow-x-auto" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-tactical-hover p-4 rounded my-4 overflow-x-auto border border-tactical-border" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-8 border-t border-tactical-border/50" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full text-left border-collapse text-sm text-gray-300" {...props} /></div>,
                    th: ({node, ...props}) => <th className="border-b border-tactical-border p-2 font-bold text-gray-200 uppercase tracking-wider bg-tactical-hover/50" {...props} />,
                    td: ({node, ...props}) => <td className="border-b border-tactical-border/30 p-2" {...props} />,
                    img: ({node, ...props}) => {
                        const src = props.src || '';
                        let imageUrl = src;

                        if (src.startsWith('slug:')) {
                            const imageSlug = src.substring(5);
                            console.log('icon : ' + imageSlug + " -> " + resolveIcon(imageSlug))
                            imageUrl = resolveIcon(imageSlug);
                        }

                        return (
                            <img
                                className="max-w-full h-auto rounded border border-tactical-border my-4"
                                loading="lazy"
                                alt={props.alt || ''}
                                {...props}
                                src={imageUrl}
                            />
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}