import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function URLCleaner() {
    const location = useLocation();
    const navigate = useNavigate();
    const rawBase = import.meta.env.BASE_URL || '/';
    const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
    useEffect(() => {
        const path = window.location.pathname;
        if (path.length > base.length && path.startsWith(base) && !window.location.hash) {
            const routeToRestore = path.slice(base.length);
            const currentSearch = window.location.search;
            setTimeout(() => {
                navigate(routeToRestore + currentSearch, { replace: true });
            }, 0);
        }
    }, [navigate, base]);
    useEffect(() => {
        let internalPath = location.pathname;
        if (!internalPath.startsWith('/')) internalPath = '/' + internalPath;
        const cleanUrl = base + internalPath + location.search;
        window.history.replaceState(null, '', cleanUrl);
    }, [location, base]);

    return null;
}