import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Calcul unique au chargement du module — avant tout replaceState
// Avec HashRouter, les routes internes sont dans le hash (#/route).
// Au chargement, window.location.pathname est toujours le base path pur,
// car les pages statiques redirigent vers /#/route avant que React ne charge.
function computeAbsoluteBase() {
    const raw = import.meta.env.BASE_URL || '/';

    // BASE_URL déjà absolu → on retire juste le slash final
    if (raw.startsWith('/')) {
        return raw.endsWith('/') ? raw.slice(0, -1) : raw;
    }

    // BASE_URL relatif (ex. './') : on le résout en absolu via le pathname actuel
    const pathname = window.location.pathname;
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

const ABSOLUTE_BASE = computeAbsoluteBase();

export default function URLCleaner() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const path = window.location.pathname;
        if (ABSOLUTE_BASE && path.startsWith(ABSOLUTE_BASE) && !window.location.hash) {
            const routeToRestore = path.slice(ABSOLUTE_BASE.length);
            const currentSearch = window.location.search;
            if (routeToRestore && routeToRestore !== '/') {
                setTimeout(() => {
                    navigate(routeToRestore + currentSearch, { replace: true });
                }, 0);
            }
        }
    }, [navigate]);

    useEffect(() => {
        const internalPath = location.pathname + location.search;
        const cleanUrl = ABSOLUTE_BASE + internalPath;

        if (window.location.pathname !== cleanUrl) {
            window.history.replaceState(null, '', cleanUrl);
        }
    }, [location]);

    return null;
}
