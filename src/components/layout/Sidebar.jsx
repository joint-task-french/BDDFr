import { NavLink } from 'react-router-dom'
import JTFrLogo from '../common/JTFrLogo.jsx'

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
          <JTFrLogo className="w-7 h-7 sm:w-8 sm:h-8 text-shd" />
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

      {/* Status */}
      <div className="mt-auto p-4 border-t border-tactical-border text-xs text-gray-600 flex justify-between items-center shrink-0">
        <span><span className='text-blue-700'>BDD</span><span className='text-white'>F</span><span className='text-red-500'>r</span><span> v2.0</span></span>
        <span className="inline-block w-2 h-2 rounded-full bg-shd animate-pulse shadow-[0_0_8px_#ff9000]" />
      </div>
    </aside>
  )
}

