import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Upload, GitCompare, FileSpreadsheet, MessageSquare, Home, Menu, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface Session {
  session_id: string
  files: string[]
  created: string
}

const navItems = [
  { path: '/', label: 'Upload Files', icon: Upload },
  { path: '/compare', label: 'Compare', icon: GitCompare, disabled: true },
  { path: '/reports', label: 'Reports', icon: FileSpreadsheet, disabled: true },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/sessions`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => {})
  }, [location.pathname])

  const sessionId = location.pathname.split('/')[2]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SS</span>
            </div>
            <span className="font-semibold text-gray-900">School Sync</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            if (item.disabled) {
              return (
                <div
                  key={item.path}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 rounded-lg cursor-not-allowed"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              )
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}

          {/* Sessions */}
          {sessions.length > 0 && (
            <div className="mt-6">
              <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Recent Sessions</p>
              <div className="space-y-0.5">
                {sessions.map(s => {
                  const active = s.session_id === sessionId
                  return (
                    <Link
                      key={s.session_id}
                      to={`/compare/${s.session_id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                        active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <div className="truncate min-w-0 flex-1">
                        <p className="truncate text-xs font-mono">{s.session_id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-400 truncate">{s.created}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">School Sync AI v1.0</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
