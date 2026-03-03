import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const URLCleaner = () => {
    const location = useLocation();

    useEffect(() => {
        const base = import.meta.env.BASE_URL;
        const normalizedBase = base === '/' ? '' : (base.endsWith('/') ? base.slice(0, -1) : base);
        const cleanURL = `${normalizedBase}${location.pathname}${location.search}${location.hash}`;
        if (window.location.hash.includes('#/')) {
            window.history.replaceState(null, '', cleanURL);
        }
    }, [location]);

    return null;
};

export default URLCleaner;