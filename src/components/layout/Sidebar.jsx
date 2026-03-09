import { NavLink } from 'react-router-dom'
import JTFrLogo from '../common/JTFrLogo.jsx'
import {InfoToolTip} from "../common/InfoToolTip.jsx";

export default function Sidebar({ open, onClose }) {
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
      {/* Logo */}
      <div className="p-4 sm:p-6 border-b border-tactical-border flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <JTFrLogo className="w-8 h-8 md:w-10 md:h-10 xl:w-12 xl:h-12" />
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-widest uppercase">
            Réseau <span className="text-shd">SHD</span>: <span className='text-blue-700'>JT</span><span className='text-white'>F</span><span className='text-red-500'>r</span>
          </h1>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-500 hover:text-shd p-2 -mr-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-2">
        <NavLink to="/" end className={linkClass} onClick={onClose}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          Base de Données
        </NavLink>
        <NavLink to="/build" className={linkClass} onClick={onClose}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Build Planner
        </NavLink>
        <NavLink to="/changelog" className={linkClass} onClick={onClose}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Changelog
        </NavLink>
      </nav>

      {/* Spacer pushes outils + footer to bottom */}
      <div className="flex-1" />

      {/* Outils — en bas de la sidebar */}
      <div className="px-3 pb-2">
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

      {/* Footer */}
      <div className="p-4 border-t border-tactical-border text-xs text-gray-600 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <a href="https://github.com/joint-task-french/BDDFr" target="_blank" rel="noopener noreferrer"
            className="text-gray-500 hover:text-shd transition-colors" title="GitHub">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <span><span className='text-blue-700'>BDD</span><span className='text-white'>F</span><span className='text-red-500'>r</span><span> v2.0</span></span>
        </div>
        <span className="inline-block w-2 h-2 rounded-full bg-shd animate-pulse shadow-[0_0_8px_#ff9000]" />
      </div>
    </aside>
  )
}

