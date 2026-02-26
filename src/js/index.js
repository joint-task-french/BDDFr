let allData = [];
let isFirstLoad = true;
let loadedModulesCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadAllCategoriesProgressively();

    document.getElementById('search-input').addEventListener('input', triggerSearch);
});

window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('mobile-overlay').classList.toggle('hidden');
};

async function loadAllCategoriesProgressively() {
    const statusEl = document.getElementById('loading-status');
    const led = document.getElementById('status-led');

    // TODO : changé avec une requete GET pour récupérer la liste des fichiers
    for (let i = 1; i <= 30; i++) {
        try {
            const response = await fetch(`data/${i}.json`);
            if (!response.ok) continue;

            const json = await response.json();

            if (json.category_name && json.data) {

                if (isFirstLoad) {
                    document.getElementById('loader').classList.add('opacity-0', 'pointer-events-none');
                    setTimeout(() => document.getElementById('loader').classList.add('hidden'), 300);
                    document.getElementById('categories-container').classList.remove('hidden');
                    isFirstLoad = false;
                }

                allData.push({
                    id: `cat-${i}`,
                    category_name: json.category_name,
                    category_description: json.category_description || "",
                    items: json.data
                });

                appendCategoryToSidebar(json.category_name, `cat-${i}`);
                appendCategoryToMainView(json, `cat-${i}`);

                loadedModulesCount++;
                statusEl.innerText = `${loadedModulesCount} MOD(S)`;
            }
        } catch (error) {
            console.warn(`Erreur locale ou module manquant sur data/${i}.json`);
        }

        await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (isFirstLoad) {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('empty-state').classList.remove('hidden');
    } else {
        statusEl.innerText = "SYSTÈME ONLINE";
        statusEl.classList.remove('animate-pulse', 'text-shd');
        statusEl.classList.add('text-emerald-500');
        led.classList.replace('bg-shd', 'bg-emerald-500');
        led.classList.replace('shadow-[0_0_8px_#ff9000]', 'shadow-[0_0_8px_#10b981]');
    }
}

function appendCategoryToSidebar(name, id) {
    const navContainer = document.getElementById('nav-links');
    const link = document.createElement('button');

    link.className = `w-full text-left px-3 py-2.5 sm:py-2 rounded mb-1 text-sm font-medium transition-all duration-200 text-gray-400 hover:bg-tactical-hover hover:text-gray-200 border-l-2 border-transparent hover:border-shd uppercase tracking-wide break-words leading-snug`;
    link.innerText = name;

    link.onclick = () => {
        if (window.innerWidth < 768) window.toggleSidebar();

        const searchInput = document.getElementById('search-input');
        if (searchInput.value) {
            searchInput.value = '';
            triggerSearch();
        }

        const targetSection = document.getElementById(id);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    navContainer.appendChild(link);
}

function formatCellContent(columnName, cellValue, isCompactMode = false) {
    if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') {
        return '<span class="text-tactical-border/50">-</span>';
    }

    const valueStr = String(cellValue).trim();
    const colLower = String(columnName).toLowerCase();
    const valLower = valueStr.toLowerCase();

    // Gestion des cas "N/A"
    if (valLower === 'non applicable' || valLower === 'n/a') return '<span class="text-gray-600">-</span>';

    // Gestion des images
    const isImageCol = colLower.includes('image') || colLower.includes('icon') || colLower.includes('visuel');
    const isImageUrl = valueStr.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i);
    if ((isImageCol || isImageUrl) && valueStr.startsWith('http')) {
        if (isCompactMode) return `<span class="text-shd underline text-[10px]">Visuel lié</span>`;
        return `<img src="${valueStr}" alt="img" class="max-w-[48px] sm:max-w-[64px] max-h-[64px] object-contain rounded border border-tactical-border bg-black/60 shadow-sm" loading="lazy">`;
    }

    // Gestion des liens
    if (valueStr.startsWith('http://') || valueStr.startsWith('https://')) {
        return `<a href="${valueStr}" target="_blank" class="inline-flex items-center gap-1 text-xs text-shd hover:text-white transition-colors underline decoration-shd/50 underline-offset-2 uppercase tracking-widest break-all">Lien Externe</a>`;
    }

    // Gestion des statuts Oui/Non
    if (['oui', 'actif', 'vrai', 'true', 'disponible', '✔'].includes(valLower)) {
        return `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-900/50 text-emerald-400 border border-emerald-500/50 whitespace-nowrap shadow-sm">Oui</span>`;
    }
    if (['non', 'inactif', 'faux', 'false', 'indisponible', 'x'].includes(valLower)) {
        return `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-red-900/50 text-red-400 border border-red-500/50 whitespace-nowrap shadow-sm">Non</span>`;
    }

    // --- LOGIQUE DE RETOUR À LA LIGNE TACTIQUE ---
    const div = document.createElement('div');
    div.innerText = valueStr;
    let content = div.innerHTML;

    // On cherche un point (.) suivi par une lettre [a-zA-Zà-ÿÀ-ß] ou un espace [\s]
    // Le (?=...) est un "lookahead" : il vérifie la condition sans supprimer le caractère suivant
    content = content.replace(/\.(?=[a-zA-Zà-ÿÀ-ß\s])/g, '.<br/>');

    // On préserve aussi les sauts de ligne réels déjà présents dans le JSON
    return content.replace(/\n/g, '<br/>');
}

function appendCategoryToMainView(json, id) {
    const container = document.getElementById('categories-container');
    const section = document.createElement('div');
    section.id = id;
    section.className = "bg-tactical-panel/60 sm:rounded-lg border border-tactical-border shadow-lg overflow-hidden fade-in relative shrink-0 scroll-mt-6 flex flex-col max-h-[80vh]";

    let html = `
        <div class="px-6 py-5 border-b border-tactical-border bg-gradient-to-r from-tactical-panel to-tactical-bg relative overflow-hidden shrink-0 z-20 shadow-md">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-shd"></div>
            <h3 class="text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-3">${json.category_name}</h3>
            ${json.category_description ? `<p class="text-gray-400 text-sm mt-2 font-medium tracking-wide">${json.category_description}</p>` : ''}
        </div>
    `;

    if (json.data && json.data.length > 0) {
        html += `
            <div class="overflow-x-auto w-full flex-1 relative bg-tactical-panel/30 custom-scrollbar">
                <table class="w-full table-auto divide-y divide-tactical-border border-collapse text-left">
                    <thead class="sticky top-0 z-10 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        <tr>
        `;

        const columns = Object.keys(json.data[0]).filter(c => c && c !== 'element_name' && c !== 'element_description');

        // On identifie la colonne "flexible" (Bonus, Talent, ou la dernière par défaut)
        const flexibleIdx = columns.findIndex(c => {
            const n = c.toLowerCase();
            return n.includes('bonus') || n.includes('talent') || n.includes('description') || n.includes('nom');
        });
        const targetIdx = flexibleIdx !== -1 ? flexibleIdx : columns.length - 1;

        columns.forEach((col, index) => {
            const isFlex = index === targetIdx;
            const style = isFlex ? 'style="width: auto;"' : 'style="width: 1%;"';
            const wrap = isFlex ? 'whitespace-normal min-w-[250px]' : 'whitespace-nowrap';

            html += `<th ${style} class="px-4 sm:px-6 py-3 text-xs font-bold text-gray-300 uppercase tracking-widest ${wrap} align-bottom bg-[#15181d] border-b border-shd/40">${col}</th>`;
        });

        html += `</tr></thead><tbody class="divide-y divide-tactical-border/40">`;

        json.data.forEach((row, rowIndex) => {
            const rowClass = rowIndex % 2 === 0 ? 'bg-transparent' : 'bg-tactical-hover/20';
            html += `<tr id="${id}-row-${rowIndex}" class="row-hover transition-all duration-700 ${rowClass}">`;

            columns.forEach((col, colIndex) => {
                const isFlex = colIndex === targetIdx;
                const style = isFlex ? 'style="width: auto;"' : 'style="width: 1%;"';
                const wrap = isFlex ? 'whitespace-normal' : 'whitespace-nowrap';

                html += `<td ${style} class="px-4 sm:px-6 py-3 text-sm text-gray-300 ${wrap} align-top leading-relaxed border-y border-transparent">
                    ${formatCellContent(col, row[col])}
                </td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
    } else {
        html += `<div class="p-6 text-gray-500 text-sm italic uppercase tracking-widest flex-1">Dossier vide.</div>`;
    }

    section.innerHTML = html;
    container.appendChild(section);
}


function triggerSearch() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const catContainer = document.getElementById('categories-container');
    const searchContainer = document.getElementById('search-results-container');
    const tbody = document.getElementById('search-table-body');
    const stats = document.getElementById('search-stats');

    if (!term) {
        catContainer.classList.remove('hidden');
        searchContainer.classList.add('hidden');
        return;
    }

    catContainer.classList.add('hidden');
    searchContainer.classList.remove('hidden');
    tbody.innerHTML = '';

    let matchCount = 0;

    allData.forEach(cat => {
        cat.items.forEach((item, index) => {
            const matches = Object.values(item).some(val => String(val).toLowerCase().includes(term));

            if (matches) {
                matchCount++;

                const elName = item.element_name && item.element_name !== "Inconnu" ? item.element_name : "-";
                const elDesc = item.element_description && item.element_description !== "-" ? item.element_description : "-";

                const tr = document.createElement('tr');
                tr.className = `row-hover transition-colors duration-150 ${matchCount % 2 === 0 ? 'bg-tactical-bg/50' : 'bg-tactical-hover/30'} cursor-pointer hover:bg-shd/10`;
                tr.onclick = () => window.scrollToElement(cat.id, `${cat.id}-row-${index}`);

                tr.innerHTML = `
                    <td class="px-4 py-3 text-xs sm:text-sm text-shd font-bold uppercase tracking-widest align-top border-y border-tactical-border/30">
                        ${cat.category_name}
                    </td>
                    <td class="px-4 py-3 text-sm sm:text-[15px] text-white font-bold align-top border-y border-tactical-border/30 break-words whitespace-normal">
                        ${formatCellContent('element_name', elName)}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-400 align-top border-y border-tactical-border/30 break-words whitespace-normal">
                        ${formatCellContent('element_description', elDesc)}
                    </td>
                `;
                tbody.appendChild(tr);
            }
        });
    });

    stats.innerText = `${matchCount} élément(s) trouvé(s) — Cliquez sur une ligne pour l'afficher en détail.`;

    if (matchCount === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-12 text-center text-gray-500 text-lg uppercase tracking-widest">Aucune correspondance trouvée.</td></tr>`;
    }
}

window.scrollToElement = function(catId, rowId) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    triggerSearch();

    setTimeout(() => {
        const targetRow = document.getElementById(rowId);
        if (targetRow) {
            const parentTableContainer = targetRow.closest('.overflow-auto');
            if (parentTableContainer) {
                const offsetTop = targetRow.offsetTop - (parentTableContainer.clientHeight / 2) + (targetRow.clientHeight / 2);
                parentTableContainer.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }

            const mainScrollArea = document.getElementById('main-scroll-area');
            const categoryElement = document.getElementById(catId);
            if (categoryElement && mainScrollArea) {
                categoryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            targetRow.classList.add('highlight-pulse');
            setTimeout(() => {
                targetRow.classList.remove('highlight-pulse');
            }, 2000);
        }
    }, 50);
}

function formatCellContent(columnName, cellValue, isCompactMode = false) {
    if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') {
        return '<span class="text-tactical-border/50">-</span>';
    }

    const valueStr = String(cellValue).trim();
    const colLower = String(columnName).toLowerCase();
    const valLower = valueStr.toLowerCase();

    if (valLower === 'non applicable' || valLower === 'n/a') return '<span class="text-gray-600">-</span>';

    const isImageCol = colLower.includes('image') || colLower.includes('icon') || colLower.includes('visuel');
    const isImageUrl = valueStr.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i);

    if ((isImageCol || isImageUrl) && valueStr.startsWith('http')) {
        if (isCompactMode) return `<span class="text-shd underline text-[10px]">Visuel lié</span>`;
        return `<img src="${valueStr}" alt="img" class="max-w-[48px] sm:max-w-[64px] max-h-[64px] object-contain rounded border border-tactical-border bg-black/60 shadow-sm" loading="lazy">`;
    }

    if (valueStr.startsWith('http://') || valueStr.startsWith('https://')) {
        return `<a href="${valueStr}" target="_blank" class="inline-flex items-center gap-1 text-xs text-shd hover:text-white transition-colors underline decoration-shd/50 underline-offset-2 uppercase tracking-widest break-all">
            Lien Externe
        </a>`;
    }

    if (['oui', 'actif', 'vrai', 'true', 'disponible', '✔'].includes(valLower)) {
        return `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-900/50 text-emerald-400 border border-emerald-500/50 whitespace-nowrap shadow-sm">Oui</span>`;
    }
    if (['non', 'inactif', 'faux', 'false', 'indisponible', 'x'].includes(valLower)) {
        return `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-red-900/50 text-red-400 border border-red-500/50 whitespace-nowrap shadow-sm">Non</span>`;
    }

    const div = document.createElement('div');
    div.innerText = valueStr;
    return div.innerHTML.replace(/\n/g, '<br/>');
}