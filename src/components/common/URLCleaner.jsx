import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function URLCleaner() {
    const location = useLocation();
    const navigate = useNavigate();
    const rawBase = import.meta.env.BASE_URL || '/';
    const base = (rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase) || '';

    useEffect(() => {
        const path = window.location.pathname;
        // Si le chemin commence par base (et base n'est pas vide)
        if (base && path.startsWith(base) && !window.location.hash) {
            const routeToRestore = path.slice(base.length);
            const currentSearch = window.location.search;
            if (routeToRestore) {
                setTimeout(() => {
                    navigate(routeToRestore + currentSearch, { replace: true });
                }, 0);
            }
        }
    }, [navigate, base]);

    useEffect(() => {
        let internalPath = location.pathname;
        if (!internalPath.startsWith('/')) internalPath = '/' + internalPath;

        // On ne rajoute base que si BASE_URL n'est pas ./ ou /
        // Et on évite de doubler base si internalPath le contient déjà par erreur
        const finalPath = (base && !internalPath.startsWith(base)) 
            ? base + internalPath 
            : internalPath;

        const cleanUrl = finalPath + location.search;
        
        if (window.location.pathname !== cleanUrl) {
            window.history.replaceState(null, '', cleanUrl);
        }
    }, [location, base]);

    return null;
}