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
        date: metadata.date || null,
        update: metadata.update || null,
        tags: metadata.tags || [],
        authors: metadata.authors || [],
        content
    };
});

// Extraction de tous les tags triés par fréquence (plus utilisé en premier), puis alphabétique
const tagCounts = availablePages.flatMap(page => page.tags).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
}, {});
const allTags = Array.from(new Set(Object.keys(tagCounts))).sort((a, b) => {
    const diff = tagCounts[b] - tagCounts[a];
    if (diff !== 0) return diff;
    return a.localeCompare(b, 'fr');
});

const SORT_OPTIONS = [
    { id: 'date-desc', label: 'Date (récent)', icon: '↓' },
    { id: 'date-asc', label: 'Date (ancien)', icon: '↑' },
    { id: 'alpha-asc', label: 'Alphabétique A-Z', icon: '↓' },
    { id: 'alpha-desc', label: 'Alphabétique Z-A', icon: '↑' },
];

function sortPages(pages, sortId) {
    return [...pages].sort((a, b) => {
        switch (sortId) {
            case 'date-desc':
                return (b.update || b.date || '').localeCompare(a.update || a.date || '');
            case 'date-asc':
                return (a.update || a.date || '').localeCompare(b.update || b.date || '');
            case 'alpha-asc':
                return a.title.localeCompare(b.title, 'fr');
            case 'alpha-desc':
                return b.title.localeCompare(a.title, 'fr');
            default:
                return 0;
        }
    });
}

function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

export default function PageViewer() {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]); // Tags sélectionnés (filtre cumulatif)
    const [sortBy, setSortBy] = useState('date-desc');
    const [sortOpen, setSortOpen] = useState(false);

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


                    <div className="flex flex-row py-1 text-xs font-bold mt-4 gap-4 items-center">
                        <p className="text-sm w-20 shrink-0">Tags :</p>
                        {currentPage.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {currentPage.tags.map(tag => (
                                    <span key={tag} className="px-2.5 py-1 bg-tactical-hover text-shd text-xs font-bold uppercase tracking-widest rounded border border-shd/30">
                                    {tag}
                                </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-row py-1 text-xs font-bold gap-4 items-center">
                        <p className="text-sm w-20 shrink-0">Auteurs :</p>
                        {currentPage.authors.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {currentPage.authors.map(author => (
                                    <span key={author} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold tracking-widest rounded border border-emerald-500/50">
                                    {author}
                                </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {currentPage.date && (
                        <div className="flex flex-row py-1 text-xs font-bold gap-4 items-center">
                            <p className="text-sm w-20 shrink-0">Date :</p>
                            <span className="px-2.5 py-1 bg-tactical-hover text-gray-300 text-xs font-bold uppercase tracking-widest rounded border border-tactical-border">
                                {formatDate(currentPage.date)}
                            </span>
                        </div>
                    )}

                    {currentPage.update && (
                        <div className="flex flex-row py-1 text-xs font-bold gap-4 items-center">
                            <p className="text-sm w-20 shrink-0">Mis a jours :</p>
                            <span className="px-2.5 py-1 bg-tactical-hover text-gray-300 text-xs font-bold uppercase tracking-widest rounded border border-tactical-border">
                                {formatDate(currentPage.update)}
                            </span>
                        </div>
                    )}

                </div>

                <MarkdownText className="w-full">
                    {currentPage.content}
                </MarkdownText>
            </div>
        );
    }

    // Pages filtrées par recherche textuelle uniquement (pour calculer les compteurs de tags dynamiques)
    const searchFilteredPages = availablePages.filter(p => {
        if (searchTerm === '') return true;
        const searchLower = searchTerm.toLowerCase();
        return p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchLower));
    });

    // Pages correspondant aux tags sélectionnés (base pour les compteurs dynamiques)
    const pagesMatchingSelectedTags = searchFilteredPages.filter(p =>
        selectedTags.length === 0 || selectedTags.every(tag => p.tags.includes(tag))
    );

    // Compteurs dynamiques : pour chaque tag, nombre d'articles parmi ceux déjà filtrés par les tags sélectionnés
    const dynamicTagCounts = {};
    allTags.forEach(tag => {
        if (selectedTags.includes(tag)) {
            // Pour un tag déjà sélectionné, compter les articles qui matchent tous les autres tags sélectionnés + celui-ci
            dynamicTagCounts[tag] = pagesMatchingSelectedTags.filter(p => p.tags.includes(tag)).length;
        } else {
            // Pour un tag non sélectionné, compter combien d'articles matcheraient si on l'ajoutait
            dynamicTagCounts[tag] = pagesMatchingSelectedTags.filter(p => p.tags.includes(tag)).length;
        }
    });

    const filteredPages = sortPages(pagesMatchingSelectedTags, sortBy);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col h-full">
            <div className="mb-6 shrink-0">
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-4">Bibliothèque de Documents</h2>

                <div className="mb-4">
                    <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher dans les documents..." />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {allTags.length > 0 && (
                            <>
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 w-10 shrink-0">Tags :</span>
                                {selectedTags.length > 0 && (
                                    <button
                                        onClick={() => setSelectedTags([])}
                                        className="px-2 py-1.5 text-xs font-bold uppercase tracking-widest rounded border transition-all duration-200 bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                        title="Réinitialiser les filtres"
                                    >
                                        ✕
                                    </button>
                                )}
                                {allTags.map(tag => {
                                    const isSelected = selectedTags.includes(tag);
                                    const count = dynamicTagCounts[tag] || 0;
                                    const isDisabled = !isSelected && count === 0;

                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => !isDisabled && setSelectedTags(prev =>
                                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                            )}
                                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded border transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-shd/20 text-shd border-shd/40'
                                                    : isDisabled
                                                        ? 'bg-tactical-panel/50 text-gray-600 border-tactical-border/50 cursor-not-allowed opacity-50'
                                                        : 'bg-tactical-panel text-gray-400 border-tactical-border hover:border-gray-500 hover:text-gray-300'
                                            }`}
                                            disabled={isDisabled}
                                        >
                                            {tag} <span className="text-[10px] opacity-60">({count})</span>
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 w-10 shrink-0">Tri :</span>
                        <div className="relative">
                        <button
                            onClick={() => setSortOpen(!sortOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border transition-all duration-200 ${
                                sortBy !== 'date-desc' || sortOpen
                                    ? 'bg-shd/20 text-shd border-shd/40'
                                    : 'bg-tactical-panel text-gray-400 border-tactical-border hover:border-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <svg className={`w-4 h-4 ${sortBy !== 'date-desc' ? 'text-shd' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Tri'}</span>
                            <svg className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {sortOpen && (
                            <div className="absolute left-0 mt-2 z-10 bg-tactical-panel border border-tactical-border rounded-lg p-2 animate-fade-in min-w-[200px]">
                                {SORT_OPTIONS.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => { setSortBy(option.id); setSortOpen(false); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                                            sortBy === option.id
                                                ? 'bg-shd/20 text-shd'
                                                : 'text-gray-400 hover:bg-tactical-hover hover:text-gray-300'
                                        }`}
                                    >
                                        <span className="text-sm">{option.icon}</span>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    </div>
                </div>
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
                                <p className="text-sm text-gray-500 line-clamp-3 grow mb-4">
                                    {page.description}
                                </p>
                            )}

                            <div className="mt-auto">
                                {page.date && (
                                <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-bold">
                                    {formatDate(page.date)}
                                </p>
                            )}
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