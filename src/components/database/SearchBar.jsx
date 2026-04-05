import { useState, useEffect, useRef } from 'react'

export default function SearchBar({ value, onChange, placeholder = "Rechercher dans la catégorie..." }) {
    const [localValue, setLocalValue] = useState(value || '')
    const lastSentValue = useRef(value || '')

    useEffect(() => {
        if (value !== lastSentValue.current) {
            setLocalValue(value || '')
        }
        lastSentValue.current = value || ''
    }, [value])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (localValue !== value) {
                lastSentValue.current = localValue
                onChange(localValue)
            }
        }, 100)

        return () => clearTimeout(timeoutId)
    }, [localValue, onChange, value])

    return (
        <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                value={localValue}
                onChange={e => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2.5 bg-tactical-panel border border-tactical-border rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-shd text-sm uppercase tracking-wide"
            />
            {localValue && (
                <button
                    onClick={() => {
                        setLocalValue('')
                        lastSentValue.current = ''
                        onChange('')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-shd"
                >
                    ✕
                </button>
            )}
        </div>
    )
}
