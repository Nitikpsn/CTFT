import { useState } from 'react'
import { Send, Bot, MessageSquare } from 'lucide-react'
import { chatQuery } from '../services/api'
import { StudentRecord } from '../types'

interface AIChatProps {
  sessionId: string | null
}

export default function AIChat({ sessionId }: AIChatProps) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{
    original_query: string
    normalized_query: string
    filter_applied: Record<string, string>
    total_records: number
    records: StudentRecord[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId || !query.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await chatQuery(sessionId, query)
      setResult(res)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gray-700" />
          <h3 className="text-sm font-medium text-gray-900">AI Query Assistant</h3>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Ask in natural language or Hindi</p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-3 border-b border-gray-100 flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='e.g. "Show SC girls in class 6"'
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
          disabled={!sessionId}
        />
        <button
          type="submit"
          disabled={loading || !sessionId}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Ask
        </button>
      </form>

      {error && <p className="px-5 py-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500 mb-4">
            <span>Normalized: <span className="text-gray-700 font-medium">{result.normalized_query}</span></span>
            <span>Filter: <span className="font-mono text-xs text-gray-700">{JSON.stringify(result.filter_applied)}</span></span>
            <span>Results: <span className="text-gray-700 font-medium">{result.total_records}</span></span>
          </div>

          {result.records.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Admission</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Class</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Gender</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody>
                {result.records.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.admission_no}</td>
                    <td className="px-3 py-2 text-gray-900">{r.student_name}</td>
                    <td className="px-3 py-2 text-gray-700">{r.class_name}</td>
                    <td className="px-3 py-2 text-gray-700">{r.gender}</td>
                    <td className="px-3 py-2 text-gray-700">{r.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400">No matching records found</p>
          )}
        </div>
      )}
    </div>
  )
}
