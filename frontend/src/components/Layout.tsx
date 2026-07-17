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
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    fetch(`${API_BASE}/api/sessions`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => {})
  }, [location.pathname])

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const sessionId = location.pathname.split('/')[2]

  const sidebarClass = sidebarOpen ? 'translate-x-0' : '-translate-x-full'

  return (
    <div className="min-h-screen bg-white dark:bg-notion-bg-dark flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-notion-sidebar dark:bg-notion-sidebar-dark flex flex-col transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${sidebarClass}`}>
        <div className="h-11 flex items-center px-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-notion-text-primary dark:bg-white flex items-center justify-center">
              <LayoutDashboard className="w-3 h-3 text-white dark:text-notion-bg-dark" />
            </div>
            <span className="font-semibold text-notion-text-primary dark:text-notion-text-primary-dark text-sm">CTFT</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 text-notion-text-tertiary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-1 px-2 space-y-px overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-2 py-1 text-sm rounded ${
                  isActive
                    ? 'bg-notion-hover dark:bg-notion-hover-dark text-notion-text-primary dark:text-notion-text-primary-dark font-medium'
                    : 'text-notion-text-secondary dark:text-notion-text-secondary-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}

          {sessions.length > 0 && (
            <div className="mt-4">
              <p className="px-2 text-[11px] text-notion-text-tertiary dark:text-notion-text-tertiary-dark mb-0.5">
                Recent
              </p>
              {sessions.map(s => {
                const active = s.session_id === sessionId
                return (
                  <Link
                    key={s.session_id}
                    to={`/compare/${s.session_id}`}
                    className={`flex items-center gap-2 px-2 py-1 text-sm rounded ${
                      active
                        ? 'bg-notion-hover dark:bg-notion-hover-dark text-notion-text-primary dark:text-notion-text-primary-dark'
                        : 'text-notion-text-secondary dark:text-notion-text-secondary-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark'
                    }`}
                  >
                    <div className={`w-1 h-1 rounded-full ${active ? 'bg-notion-text-primary dark:bg-white' : 'bg-notion-text-tertiary dark:bg-notion-text-tertiary-dark'}`} />
                    <div className="truncate">
                      <p className="text-xs font-mono truncate">{s.session_id.slice(0, 8)}</p>
                      <p className="text-[10px] text-notion-text-tertiary dark:text-notion-text-tertiary-dark truncate">{s.created}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        <div className="px-3 py-2 space-y-2">
          <div className="flex items-start gap-2 p-2 bg-notion-hover dark:bg-notion-hover-dark rounded">
            <AlertTriangle className="w-3.5 h-3.5 text-notion-text-secondary dark:text-notion-text-secondary-dark mt-0.5 flex-shrink-0" />
            <p className="text-[10px] leading-tight text-notion-text-secondary dark:text-notion-text-secondary-dark">
              Only for KV teachers comparing Excel student data.
            </p>
          </div>
          <p className="text-[10px] text-notion-text-tertiary dark:text-notion-text-tertiary-dark text-center">Made by <a href="https://github.com/Nitikpsn" target="_blank" rel="noopener noreferrer" className="text-notion-text-secondary dark:text-notion-text-secondary-dark hover:text-notion-text-primary dark:hover:text-notion-text-primary-dark underline underline-offset-2">Nitik Paswan</a></p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-11 bg-white dark:bg-notion-bg-dark border-b border-notion-border dark:border-notion-border-dark flex items-center px-3 lg:px-5 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 -ml-1 text-notion-text-secondary dark:text-notion-text-secondary-dark">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button onClick={() => setDark(!dark)} className="p-1.5 text-notion-text-secondary dark:text-notion-text-secondary-dark hover:text-notion-text-primary dark:hover:text-notion-text-primary-dark rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors">
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
