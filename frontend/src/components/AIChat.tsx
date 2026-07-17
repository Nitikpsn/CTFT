import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { chatQuery } from '../services/api'

export default function AIChat({ sessionId }: { sessionId: string | null }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView() }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId || !query.trim() || loading) return
    const q = query
    setQuery('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    setError('')
    try {
      const res = await chatQuery(sessionId, q)
      setMessages(m => [...m, { role: 'assistant', text: res.normalized_query, data: res }])
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="mt-4 card">
      <div className="px-4 py-3 border-b border-notion-border dark:border-notion-border-dark">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-notion-text-secondary dark:text-notion-text-secondary-dark" />
          <h3 className="text-sm font-medium text-notion-text-primary dark:text-notion-text-primary-dark">AI Query</h3>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !error && (
          <p className="text-xs text-notion-text-tertiary text-center py-6">Ask something like "show records where value is X"</p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && <Bot className="w-6 h-6 p-1 rounded bg-notion-hover dark:bg-notion-hover-dark text-notion-text-secondary dark:text-notion-text-secondary-dark flex-shrink-0" />}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : ''}`}>
              {msg.role === 'user' ? (
                <div className="bg-notion-text-primary dark:bg-white text-white dark:text-notion-bg-dark text-sm rounded-lg px-3 py-2">{msg.text}</div>
              ) : (
                <div className="bg-notion-sidebar dark:bg-notion-hover-dark border border-notion-border dark:border-notion-border-dark rounded-lg px-3 py-2 text-sm">
                  <p className="text-notion-text-tertiary italic text-xs mb-1">Normalized: <span className="not-italic font-medium text-notion-text-primary dark:text-notion-text-primary-dark">{msg.text}</span></p>
                  {msg.data && (
                    <>
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {Object.entries(msg.data.filter_applied || {}).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded text-xs font-medium bg-notion-hover dark:bg-notion-hover-dark text-notion-text-secondary dark:text-notion-text-secondary-dark">{k}: {v as string}</span>
                        ))}
                      </div>
                      <p className="text-xs text-notion-text-tertiary">{msg.data.total_records} records</p>
                      {msg.data.records?.length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-notion-text-tertiary cursor-pointer hover:text-notion-text-secondary dark:hover:text-notion-text-secondary-dark">View results</summary>
                          <div className="mt-1 overflow-x-auto text-xs">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-notion-border dark:border-notion-border-dark">
                                  {Object.keys(msg.data.records[0]).map(k => <th key={k} className="text-left px-2 py-1 font-medium text-notion-text-tertiary">{k}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {msg.data.records.slice(0, 10).map((r: any, idx: number) => (
                                  <tr key={idx} className="border-b border-notion-border/50 dark:border-notion-border-dark/50">
                                    {Object.keys(msg.data.records[0]).map(k => <td key={k} className="px-2 py-1 text-notion-text-secondary dark:text-notion-text-secondary-dark">{r[k] || '—'}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {msg.data.records.length > 10 && <p className="text-xs text-notion-text-tertiary mt-1">Showing 10 of {msg.data.records.length}</p>}
                          </div>
                        </details>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            {msg.role === 'user' && <User className="w-6 h-6 p-1 rounded bg-notion-hover dark:bg-notion-hover-dark text-notion-text-secondary flex-shrink-0" />}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <Bot className="w-6 h-6 p-1 rounded bg-notion-hover dark:bg-notion-hover-dark text-notion-text-secondary dark:text-notion-text-secondary-dark flex-shrink-0" />
            <div className="bg-notion-sidebar dark:bg-notion-hover-dark border border-notion-border dark:border-notion-border-dark rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-notion-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-notion-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-notion-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-notion-border dark:border-notion-border-dark">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='e.g. "Show records with X"'
            disabled={!sessionId}
            className="flex-1 px-3 py-1.5 text-sm border border-notion-border dark:border-notion-border-dark rounded bg-notion-hover dark:bg-notion-hover-dark text-notion-text-primary dark:text-notion-text-primary-dark placeholder-notion-text-tertiary focus:outline-none focus:ring-1 focus:ring-notion-text-secondary"
          />
          <button type="submit" disabled={loading || !sessionId || !query.trim()} className="btn-primary">
            {loading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Ask
          </button>
        </div>
      </form>
    </div>
  )
}
