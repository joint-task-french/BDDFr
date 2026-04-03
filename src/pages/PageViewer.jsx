import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MarkdownText from '../components/common/MarkdownText';
import SearchBar from '../components/database/SearchBar';

const markdownFiles = import.meta.glob('../content/pages/*.md', { query: '?raw', eager: true, import: 'default' });

function parseFrontmatter(rawContent) {
    const regex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = rawContent.match(regex);

    if (!match) return { metadata: {}, content: rawContent };

    const metadata = {};
    match[1].split('\n').forEach(line => {
        const [key, ...rest] = line.split(':');
        if (key && rest.length) {
            let value = rest.join(':').trim();
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
            } else {
                value = value.replace(/^['"]|['"]$/g, '');
            }
            metadata[key.trim()] = value;
        }
    });

    return { metadata, content: match[2] };
}

const availablePages = Object.entries(markdownFiles)
    .filter(([path]) => import.meta.env.DEV || !path.includes('.wip.'))
    .map(([path, rawContent]) => {
    const id = path.split('/').pop().replace('.md', '');
    const { metadata, content } = parseFrontmatter(rawContent);

    return {
        id,
        title: metadata.title || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: metadata.description || '',
        tags: metadata.tags || [],
        content
    };
});

// Extraction de tous les tags uniques pour générer les boutons de filtre
const allTags = Array.from(new Set(availablePages.flatMap(page => page.tags))).sort();

export default function PageViewer() {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(''); // État pour le tag sélectionné

    if (pageId) {
        const currentPage = availablePages.find(p => p.id === pageId);

        if (!currentPage) {
            return (
                <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                    <div className="p-6 text-red-500 font-bold uppercase tracking-widest text-center">
                        Document introuvable
                    </div>
                </div>
            );
        }

        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                <button
                    onClick={() => navigate('/pages')}
                    className="mb-6 text-shd hover:opacity-80 flex items-center gap-2 uppercase text-sm font-bold tracking-widest transition-opacity"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour aux documents
                </button>

                <div className="mb-8 border-b border-tactical-border pb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-widest uppercase mb-2">
                        {currentPage.title}
                    </h1>
                    {currentPage.description && (
                        <p className="text-gray-400 text-sm md:text-base">
                            {currentPage.description}
                        </p>
                    )}
                    {currentPage.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {currentPage.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-tactical-hover text-shd text-xs font-bold uppercase tracking-widest rounded border border-shd/30">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <MarkdownText className="w-full">
                    {currentPage.content}
                </MarkdownText>
            </div>
        );
    }

    const filteredPages = availablePages.filter(p => {
        const searchLower = searchTerm.toLowerCase();

        // Vérifie la recherche textuelle
        const matchesSearch = searchTerm === '' ||
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchLower));

        // Vérifie le tag sélectionné
        const matchesTag = selectedTag === '' || p.tags.includes(selectedTag);

        return matchesSearch && matchesTag;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col h-full">
            <div className="mb-6 shrink-0">
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-4">Bibliothèque de Documents</h2>

                <div className="mb-4">
                    <SearchBar value={searchTerm} onChange={setSearchTerm} />
                </div>

                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedTag('')}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded border transition-all duration-200 ${
                                selectedTag === ''
                                    ? 'bg-shd/20 text-shd border-shd/40'
                                    : 'bg-tactical-panel text-gray-400 border-tactical-border hover:border-gray-500 hover:text-gray-300'
                            }`}
                        >
                            Tous
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded border transition-all duration-200 ${
                                    selectedTag === tag
                                        ? 'bg-shd/20 text-shd border-shd/40'
                                        : 'bg-tactical-panel text-gray-400 border-tactical-border hover:border-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                {filteredPages.length > 0 ? (
                    filteredPages.map(page => (
                        <Link
                            key={page.id}
                            to={`/pages/${page.id}`}
                            className="flex flex-col p-5 bg-tactical-panel border border-tactical-border rounded hover:border-shd hover:bg-tactical-hover transition-all duration-200 group h-full"
                        >
                            <h3 className="text-lg font-bold text-gray-200 group-hover:text-shd transition-colors line-clamp-2 mb-2">
                                {page.title}
                            </h3>

                            {page.description && (
                                <p className="text-sm text-gray-500 line-clamp-3 flex-grow mb-4">
                                    {page.description}
                                </p>
                            )}

                            <div className="mt-auto">
                                {page.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {page.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 bg-tactical-hover text-shd text-xs font-bold uppercase tracking-widest rounded border border-shd/30">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-300">
                                    <span>Lire le document</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center border border-dashed border-tactical-border rounded bg-tactical-panel/50">
                        <p className="text-gray-500 uppercase tracking-widest font-bold">
                            Aucun document trouvé
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}