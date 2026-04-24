// src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import JTFrLogo from '../common/JTFrLogo.jsx'
import { InfoToolTip } from "../common/InfoToolTip.jsx"
import { useDataLoader } from '../../hooks/useDataLoader.js'
import { GameIcon, resolveAsset } from '../common/GameAssets.jsx'
import { apiBuildotheque } from '../../utils/apiBuildotheque'
import metadata from '../../data/metadata.jsonc?raw'

const parseMetadata = (raw) => {
  try {
    const clean = raw.replace(/^\uFEFF/, '').replace(/("(?:\\.[^\\"])*")(\/\*[\s\S]*?\*\/)(\/\/.*$)/gm, (match, string) => {
      if (string) return string;
      return '';
    });
    return JSON.parse(clean);
  } catch (e) {
    return { buildLibraryApiUrl: 'https://api.buildotheque.com' };
  }
}

const metadataObj = parseMetadata(metadata);
const DEFAULT_API_URL = metadataObj.buildLibraryApiUrl || 'https://api.buildotheque.com';

const BASE = import.meta.env.BASE_URL

export default function Sidebar({ open, onClose }) {
  const location = useLocation()
  const isMapActive = location.pathname.startsWith('/map')
  const isBuildActive = location.pathname.startsWith('/build') || location.pathname.startsWith('/shd') || location.pathname.startsWith('/library')

  const { data, error } = useDataLoader()
  const mapsConfig = Array.isArray(data?.maps) ? data.maps : []
  const loadingError = !!error

  const [buildsExpanded, setBuildsExpanded] = useState(true)
  const [mapsExpanded, setMapsExpanded] = useState(true)
  const [user, setUser] = useState(apiBuildotheque.user)

  useEffect(() => {
    const handleAuthChange = (e) => {
      console.log("Sidebar: Auth change detected", e.detail?.user);
      setUser(e.detail?.user || null)
    }
    window.addEventListener('auth-change', handleAuthChange)

    const checkAuth = () => {
      const currentUser = apiBuildotheque.user;
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        setUser(currentUser);
      }
    };
    checkAuth();

    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [user])

  const linkClass = ({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-bold uppercase tracking-widest transition-all duration-200 border ${
          isActive
              ? 'bg-shd/10 text-shd border-shd/30'
              : 'text-gray-400 hover:bg-tactical-hover hover:text-gray-200 border-transparent'
      }`

  return (
      <aside
          className={`w-64 sm:w-72 bg-tactical-panel border-r border-tactical-border flex flex-col h-full z-30 transition-transform duration-300
        absolute md:relative shadow-[4px_0_24px_rgba(0,0,0,0.8)]
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-4 sm:p-6 border-b border-tactical-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <JTFrLogo className="w-8 h-8 md:w-10 md:h-10 xl:w-12 xl:h-12" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-widest">
              Réseau <span className="text-shd">SHD</span>: <span className='text-blue-700'>JT</span><span className='text-white'>F</span><span className='text-red-500'>r</span>
            </h1>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-shd p-2 -mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="px-3 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Base de Données
          </NavLink>
          <NavLink to="/pages" className={linkClass} onClick={onClose}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Documents
          </NavLink>
          <div>
            <NavLink
                to="/map"
                className={({ isActive }) => `flex justify-between items-center group px-3 py-2.5 rounded text-sm font-bold uppercase tracking-widest transition-all duration-200 border ${
                    isActive || isMapActive
                        ? 'bg-shd/10 text-shd border-shd/30'
                        : 'text-gray-400 hover:bg-tactical-hover hover:text-gray-200 border-transparent'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setMapsExpanded(!mapsExpanded);
                }}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Carte Interactive
              </div>
              <svg
                  className={`w-4 h-4 transition-transform duration-200 ${mapsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </NavLink>
            {mapsConfig.length > 0 && (
                <div className={`pl-11 pr-2 space-y-1 overflow-hidden transition-all duration-300 ${mapsExpanded ? 'max-h-125 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                  {mapsConfig.map(map => {
                    const isCurrentMapActive = location.pathname.startsWith(`/map/${map.id}`) || (location.pathname === '/map' && map.id === mapsConfig[0].id)
                    const targetUrl = map.subMaps ? `/map/${map.id}/${map.subMaps[0].id}` : `/map/${map.id}`

                    return (
                        <div key={map.id}>
                          <Link
                              to={targetUrl}
                              onClick={window.innerWidth < 768 && !map.subMaps ? onClose : undefined}
                              className={`group flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors border ${
                                  isCurrentMapActive
                                      ? 'bg-shd/10 text-shd border-shd/30'
                                      : 'text-gray-500 hover:text-gray-300 hover:bg-tactical-hover border-transparent'
                              }`}
                          >
                            <div className="w-5 h-5 shrink-0 flex items-center justify-center opacity-80">
                              <GameIcon
                                  src={resolveAsset(map.icon)}
                                  className="w-full h-full object-contain"
                                  color={isCurrentMapActive ? "text-shd" : "text-gray-500 group-hover:text-gray-300"}
                              />
                            </div>
                            {map.name}
                          </Link>

                          {map.subMaps && isCurrentMapActive && (
                              <div className="pl-6 mt-1 space-y-1 border-l border-tactical-border/50 ml-3">
                                {map.subMaps.map(subMap => {
                                  const isSubActive = location.pathname === `/map/${map.id}/${subMap.id}` ||
                                      (location.pathname === `/map/${map.id}` && subMap.id === map.subMaps[0].id)

                                  return (
                                      <Link
                                          key={subMap.id}
                                          to={`/map/${map.id}/${subMap.id}`}
                                          onClick={window.innerWidth < 768 ? onClose : undefined}
                                          className={`block px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                              isSubActive
                                                  ? 'text-shd bg-shd/5'
                                                  : 'text-gray-500 hover:text-gray-300 hover:bg-tactical-hover'
                                          }`}
                                      >
                                        {subMap.name}
                                      </Link>
                                  )
                                })}
                              </div>
                          )}
                        </div>
                    )
                  })}
                </div>
            )}
            {loadingError && (
                <div className="text-[10px] text-red-500 font-mono pl-11 pr-2 mt-2 uppercase">
                  [ERROR] Impossible de charger maps.jsonc
                </div>
            )}
          </div>
          <div>
            <NavLink
                to="/build"
                className={({ isActive }) => `flex justify-between items-center group px-3 py-2.5 rounded text-sm font-bold uppercase tracking-widest transition-all duration-200 border ${
                    isActive || isBuildActive
                        ? 'bg-shd/10 text-shd border-shd/30'
                        : 'text-gray-400 hover:bg-tactical-hover hover:text-gray-200 border-transparent'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setBuildsExpanded(!buildsExpanded);
                }}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z" />
                </svg>
                Builds
              </div>
              <svg
                  className={`w-4 h-4 transition-transform duration-200 ${buildsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </NavLink>
            <div className={`pl-11 pr-2 space-y-1 overflow-hidden transition-all duration-300 ${buildsExpanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>

              <NavLink
                  to="/shd"
                  className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors border ${
                          isActive
                              ? 'bg-shd/10 text-shd border-shd/30'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-tactical-hover border-transparent'
                      }`
                  }
                  onClick={onClose}
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center opacity-80">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Ma Montre SHD
              </NavLink>
              <NavLink
                  to="/library"
                  className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors border ${
                          isActive
                              ? 'bg-shd/10 text-shd border-shd/30'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-tactical-hover border-transparent'
                      }`
                  }
                  onClick={onClose}
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center opacity-80">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                Buildothèque
              </NavLink>
              <NavLink
                  to="/build"
                  className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors border ${
                          isActive
                              ? 'bg-shd/10 text-shd border-shd/30'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-tactical-hover border-transparent'
                      }`
                  }
                  onClick={onClose}
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center opacity-80">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                Build Planner
              </NavLink>
            </div>
          </div>
          <NavLink to="/changelog" className={linkClass} onClick={onClose}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Changelog
          </NavLink>
        </nav>

        <div className="flex-1" />

        <div className="px-3 pb-2 mt-4">
          <div className="text-xs text-gray-500 uppercase tracking-widest px-3 mb-1.5 flex flex-row">
            Outils de contribution
            <InfoToolTip text={"Outils utiles aux contributeurs de la Base de données"} />
          </div>
          <NavLink to="/generator" className={linkClass} onClick={onClose}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Générateur JSONC
          </NavLink>
        </div>

        <div className="p-4 border-t border-tactical-border flex flex-col gap-4 shrink-0">
          {user ? (
              <div
                  className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5 hover:border-red-500/30 group transition-all cursor-pointer"
                  onClick={() => {
                    if(window.confirm('Voulez-vous vous déconnecter ?')) {
                      apiBuildotheque.logout();
                    }
                  }}
                  title="Cliquer pour se déconnecter"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {user.avatar && user.avatar.startsWith('http') ? (
                      <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-shd/50 group-hover:border-red-500/50 transition-colors" />
                  ) : (
                      <div className="w-8 h-8 rounded-full bg-shd/20 border border-shd/50 flex items-center justify-center text-xs font-black text-shd group-hover:border-red-500/50 group-hover:text-red-500 transition-colors">
                        {user.username?.substring(0, 2).toUpperCase()}
                      </div>
                  )}
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-xs text-gray-500 uppercase font-black truncate group-hover:text-red-400">Connecté</span>
                    <span className="text-xs text-white font-bold truncate group-hover:text-red-500 transition-colors">{user.username}</span>
                  </div>
                </div>
                <div className="p-2 text-gray-500 group-hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
          ) : (
              <button
                  onClick={() => apiBuildotheque.loginDiscord(apiBuildotheque.baseUrl || DEFAULT_API_URL)}
                  className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white py-2 rounded font-bold text-xs uppercase transition-colors"
                  style={{ height: '36px' }}
              >
                <div className="flex items-center gap-2 px-3">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.966 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.946 2.419-2.157 2.419z"/>
                  </svg>
                  Connexion Discord
                </div>
              </button>
          )}

          <div className="text-xs text-gray-600 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <a href="https://github.com/BDDFr/JTFr-BDDFr" target="_blank" rel="noopener noreferrer"
                 className="text-gray-500 hover:text-shd transition-colors" title="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <span><span className='text-blue-700'>BDD</span><span className='text-white'>F</span><span className='text-red-500'>r</span><span> v2.0</span></span>
            </div>
            <span className="inline-block w-2 h-2 rounded-full bg-shd animate-pulse shadow-[0_0_8px_#ff9000]" />
          </div>
        </div>
      </aside>
  )
}