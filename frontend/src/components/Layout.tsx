import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Upload, GitCompare, FileSpreadsheet, Menu, LayoutDashboard, Moon, Sun, X, BookOpen, AlertTriangle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const navItems = [
  { path: '/', label: 'Upload', icon: Upload },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/reports', label: 'Reports', icon: FileSpreadsheet },
  { path: '/how-to-use', label: 'How to Use', icon: BookOpen },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [sessions, setSessions] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // dark mode: default to light
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !dark)
    localStorage.setItem('theme', dark ? 'light' : 'dark')
  }, [dark])

  useEffect(() => {
    fetch(`${API_BASE}/api/sessions`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => {})
  }, [location.pathname])

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const sessionId = location.pathname.split('/')[2]

  return (
    <div className="min-h-screen bg-surface flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-12 flex items-center px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <LayoutDashboard className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">CTFT</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}

          {/* recent sessions - last 20 */}
          {sessions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <p className="px-3 text-xs text-slate-500 mb-1 font-medium tracking-wider uppercase">Recent</p>
              {sessions.map(s => {
                const active = s.session_id === sessionId
                return (
                  <Link
                    key={s.session_id}
                    to={`/compare/${s.session_id}`}
                    className={`flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      active
                        ? 'bg-slate-800 text-slate-200'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-1 h-1 rounded-full ${active ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                    <span className="font-mono truncate">{s.session_id.slice(0, 8)}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        <div className="px-3 py-3 space-y-2 border-t border-slate-800">
          <div className="flex items-start gap-2 px-2 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">Built for KV teachers to compare Excel data with the portal.</p>
          </div>
          <p className="text-xs text-slate-600 text-center">
            Made by <a href="https://github.com/Nitikpsn" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-300 underline underline-offset-2">Nitik Paswan</a>
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-surface border-b border-slate-800 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/50">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button onClick={() => setDark(!dark)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/50 transition-colors">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}