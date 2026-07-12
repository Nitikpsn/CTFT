import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SummaryCards from '../components/SummaryCards'
import Dashboard from '../components/Dashboard'
import ComparisonTable from '../components/ComparisonTable'
import AIChat from '../components/AIChat'
import { compare, getStats } from '../services/api'
import { CompareResult, StatsResult } from '../types'
import { ArrowLeft, GitCompare } from 'lucide-react'

export default function Compare() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [result, setResult] = useState<CompareResult | null>(null)
  const [stats, setStats] = useState<StatsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    Promise.all([
      getStats(sessionId).catch(() => null),
      compare(sessionId),
    ])
      .then(([s, r]) => {
        setStats(s)
        setResult(r)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          Running comparison...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 underline">Back to upload</Link>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Comparison Results</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{sessionId?.slice(0, 8)}</p>
        </div>
      </div>

      <SummaryCards
        matched={result.matched}
        missing={result.missing}
        modified={result.modified}
        newStudents={result.new}
      />

      {stats && <Dashboard stats={stats} />}

      <ComparisonTable
        modifications={result.modifications}
        newRecords={result.new_records}
        missingRecords={result.missing_records}
      />

      <AIChat sessionId={sessionId || null} />
    </div>
  )
}
