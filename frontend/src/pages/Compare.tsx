import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import SummaryCards from '../components/SummaryCards'
import Dashboard from '../components/Dashboard'
import ComparisonTable from '../components/ComparisonTable'
import CategoryComparison from '../components/CategoryComparison'
import AIChat from '../components/AIChat'
import { compare, getStats, compareCategories, streamCompare } from '../services/api'
import { ArrowLeft, BarChart3, Layers, Radio } from 'lucide-react'

export default function Compare() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [result, setResult] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [catResult, setCatResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [catLoading, setCatLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'student' | 'category'>('student')
  const [streamMode, setStreamMode] = useState(false)
  const [streamProgress, setStreamProgress] = useState<{ current: number; total: number; message: string } | null>(null)
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const modsRef = useRef<any[]>([])
  const newRef = useRef<any[]>([])
  const missRef = useRef<any[]>([])

  const isAggregate = result?.data_type === 'aggregate'

  // fetch comparison + stats on mount
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
        if (r?.data_type === 'aggregate') {
          setTab('category')
          if (r?.category_result) {
            setCatResult(r.category_result)
          }
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  // fetch category comparison on demand
  useEffect(() => {
    if (!sessionId || tab !== 'category' || catResult || isAggregate) return
    setCatLoading(true)
    compareCategories(sessionId)
      .then(setCatResult)
      .catch(() => {})
      .finally(() => setCatLoading(false))
  }, [sessionId, tab, catResult, isAggregate])

  const startStream = useCallback(() => {
    if (!sessionId || isAggregate) return
    setStreamMode(true)
    setLiveEvents([])
    modsRef.current = []
    newRef.current = []
    missRef.current = []

    const onEvent = (event: string, data: any) => {
      setLiveEvents(prev => [...prev, { event, data, ts: Date.now() }].slice(-200))
      if (event === 'progress') {
        setStreamProgress({ current: data.current, total: data.total, message: data.message })
      } else if (event === 'diff_analyzed') {
        modsRef.current.push(data)
      } else if (event === 'new_record') {
        newRef.current.push(data)
      } else if (event === 'missing_record') {
        missRef.current.push(data)
      }
    }

    const onComplete = () => {
      setStreamMode(false)
      setStreamProgress(null)
      setResult((prev: any) => ({
        ...prev,
        modifications: modsRef.current,
        new_records: newRef.current,
        missing_records: missRef.current,
        matched: (prev?.matched || 0) + modsRef.current.filter((m: any) => m.difference_type === 'matched').length,
        modified: modsRef.current.length,
        new: newRef.current.length,
        missing: missRef.current.length,
      }))
    }

    const onError = (err: Error) => {
      setStreamMode(false)
      setError(err.message)
    }

    abortRef.current = streamCompare(sessionId, onEvent, onComplete, onError)
  }, [sessionId, isAggregate])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  if (loading && !result) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-200 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Comparing...</p>
        </div>
      </div>
    )
  }

  if (error && !result) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="card p-6">
          <p className="text-sm text-rose-400 mb-3">{error}</p>
          <Link to="/" className="btn-primary"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </div>
      </div>
    )
  }

  if (!result) return null

  const streamModifications = modsRef.current
  const streamNew = newRef.current
  const streamMissing = missRef.current
  const hasStreamData = streamModifications.length > 0 || streamNew.length > 0 || streamMissing.length > 0

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="p-1 text-slate-500 hover:text-slate-300"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Comparison</h1>
          <p className="text-xs text-slate-500 font-mono">
            {sessionId?.slice(0, 8)}
            {isAggregate && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-400">
                Class-Level Data
              </span>
            )}
          </p>
        </div>
        <div className="flex-1" />
        {!streamMode && !hasStreamData && !isAggregate && (
          <button onClick={startStream} className="btn-secondary text-sm">
            <Radio className="w-3.5 h-3.5" /> Real-time AI
          </button>
        )}
        <Link to={`/reports/${sessionId}`} className="btn-secondary text-sm">
          <ArrowLeft className="w-3.5 h-3.5 rotate-180" /> Report
        </Link>
      </div>

      {/* streaming progress bar */}
      {streamProgress && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-200 rounded-full animate-spin" />
              <span className="text-sm font-medium text-slate-200">AI Real-time Analysis</span>
            </div>
            <span className="text-xs text-slate-500">{streamProgress.current}/{streamProgress.total}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${streamProgress.total > 0 ? (streamProgress.current / streamProgress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">{streamProgress.message}</p>
        </div>
      )}

      {/* live events log */}
      {liveEvents.length > 0 && (
        <details className="card">
          <summary className="px-4 py-2.5 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200">
            Live Stream Log ({liveEvents.length} events)
          </summary>
          <div className="px-4 pb-3 max-h-48 overflow-y-auto space-y-1">
            {liveEvents.map((evt, i) => (
              <div key={i} className="text-[10px] font-mono text-slate-500">
                <span className={
                  evt.event === 'progress' ? 'text-indigo-400' :
                  evt.event === 'diff_analyzed' ? 'text-amber-400' :
                  evt.event === 'fuzzy_match' || evt.event === 'ai_match' ? 'text-emerald-400' :
                  'text-slate-500'
                }>
                  [{evt.event}]
                </span>{' '}
                {JSON.stringify(evt.data).slice(0, 120)}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* tabs */}
      <div className="flex gap-0.5 border-b border-slate-800">
        {!isAggregate && (
          <button
            onClick={() => setTab('student')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              tab === 'student'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Student Records
          </button>
        )}
        <button
          onClick={() => setTab('category')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'category'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {isAggregate ? 'Class Comparison' : 'Category Summary'}
        </button>
      </div>

      {tab === 'student' && !isAggregate && (
        <>
          <SummaryCards
            matched={result.matched}
            missing={result.missing}
            modified={result.modified}
            newStudents={result.new}
          />
          {stats && <Dashboard stats={stats} />}
          <ComparisonTable
            modifications={streamModifications.length > 0 ? streamModifications : result.modifications}
            newRecords={streamNew.length > 0 ? streamNew : result.new_records}
            missingRecords={streamMissing.length > 0 ? streamMissing : result.missing_records}
          />
          <AIChat sessionId={sessionId || null} />
        </>
      )}

      {tab === 'category' && (
        <>
          {catLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-200 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Analyzing category breakdown...</p>
              </div>
            </div>
          ) : catResult ? (
            <CategoryComparison result={catResult} />
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-500">No category data available for this upload.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}