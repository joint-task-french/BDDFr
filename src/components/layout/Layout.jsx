import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import MobileOverlay from './MobileOverlay'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="bg-tactical-bg text-gray-300 font-sans antialiased flex h-screen overflow-hidden bg-grid">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MobileOverlay open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-tactical-panel border-b border-tactical-border">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-shd p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-bold text-white tracking-widest uppercase">
            Réseau <span className="text-shd">SHD</span>: <span className='text-blue-700'>JT</span><span className='text-white'>F</span><span className='text-red-500'>r</span>
          </span>
        </header>

        <div className="flex-1 overflow-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  )
}

