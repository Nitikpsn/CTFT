import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { chatQuery } from '../services/api'

export default function AIChat({ sessionId }: { sessionId: string | null }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView() }, [messages])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [sessionId, query, loading])

  return (
    <div className="card flex flex-col" style={{ height: '420px' }}>
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-medium text-slate-200">AI Query</h3>
        </div>
        {sessionId && (
          <span style={{ fontSize: '10px' }} className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-2 py-0.5 rounded-md">
            English / हिन्दी
          </span>
        )}
      </div>

      {/* messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !error && (
          <p className="text-xs text-slate-500 text-center py-6">
            Ask anything about your data, e.g. "How many SC students in Class 5?"
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="p-1.5 bg-indigo-600/20 border border-indigo-600/20 text-indigo-400 rounded-lg h-fit">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : ''}`}>
              {msg.role === 'user' ? (
                <div className="bg-indigo-600 text-white text-sm rounded-xl px-3.5 py-2" style={{ borderBottomRightRadius: '4px' }}>{msg.text}</div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm" style={{ borderBottomLeftRadius: '4px' }}>
                  <p className="text-slate-500 italic text-xs mb-1">
                    Normalized: <span className="not-italic font-medium text-slate-200">{msg.text}</span>
                  </p>
                  {msg.data && (
                    <>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {Object.entries(msg.data.filter_applied || {}).map(([k, v]) => (
                          <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300 border border-slate-600">
                            {k}: {v as string}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">{msg.data.total_records} records</p>
                      {msg.data.records?.length > 0 && (
                        <details className="mt-1.5">
                          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">View results</summary>
                          <div className="mt-1.5 overflow-x-auto text-xs">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-slate-700">
                                  {Object.keys(msg.data.records[0]).map(k => (
                                    <th key={k} className="text-left px-2 py-1 font-medium text-slate-500">{k}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {msg.data.records.slice(0, 10).map((r: any, idx: number) => (
                                  <tr key={idx} className="border-b border-slate-800">
                                    {Object.keys(msg.data.records[0]).map(k => (
                                      <td key={k} className="px-2 py-1 text-slate-400">{r[k] || '—'}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {msg.data.records.length > 10 && (
                              <p className="text-xs text-slate-500 mt-1">Showing 10 of {msg.data.records.length}</p>
                            )}
                          </div>
                        </details>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="p-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg h-fit">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="p-1.5 bg-indigo-600/20 border border-indigo-600/20 text-indigo-400 rounded-lg">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-rose-400">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='e.g. "Show all SC students in Class 3"'
            disabled={!sessionId}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-600/50 disabled:opacity-40"
          />
          <button type="submit" disabled={loading || !sessionId || !query.trim()} className="btn-primary">
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}