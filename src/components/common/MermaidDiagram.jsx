import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#1a1a2e',
        primaryTextColor: '#e0e0e0',
        primaryBorderColor: '#4a4a6a',
        lineColor: '#4a4a6a',
        secondaryColor: '#16213e',
        tertiaryColor: '#0f3460',
    },
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
})

let mermaidCounter = 0

export default function MermaidDiagram({ chart }) {
    const containerRef = useRef(null)
    const [svg, setSvg] = useState('')
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!chart || !containerRef.current) return

        const id = `mermaid-${++mermaidCounter}`

        mermaid.render(id, chart.trim())
            .then(({ svg: renderedSvg }) => {
                setSvg(renderedSvg)
                setError(null)
            })
            .catch((err) => {
                console.warn('Mermaid rendering error:', err)
                setError(chart)
                setSvg('')
            })
    }, [chart])

    if (error) {
        return (
            <pre className="bg-tactical-hover p-4 rounded my-4 overflow-x-auto border border-red-500/50 text-red-400 text-sm font-mono">
                <code>{error}</code>
            </pre>
        )
    }

    return (
        <div
            ref={containerRef}
            className="my-4 flex justify-center overflow-x-auto [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}
