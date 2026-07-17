import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { generateReport } from '../services/api'
import { ArrowLeft, Download, FileSpreadsheet, CheckCircle2, BarChart3 } from 'lucide-react'

export default function Reports() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_BASE = import.meta.env.VITE_API_URL || ''

  const handleGenerate = async () => {
    if (!sessionId) return
    setLoading(true)
    setError('')
    try {
      const res = await generateReport(sessionId)
      setReport(res)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-1 text-notion-text-tertiary hover:text-notion-text-secondary dark:hover:text-notion-text-secondary-dark"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-lg font-semibold text-notion-text-primary dark:text-notion-text-primary-dark">Report</h1>
          <p className="text-xs text-notion-text-tertiary font-mono">{sessionId?.slice(0, 8)}</p>
        </div>
        <div className="flex-1" />
        {sessionId && (
          <Link to={`/compare/${sessionId}`} className="btn-secondary text-sm">
            <BarChart3 className="w-3.5 h-3.5" /> Compare
          </Link>
        )}
      </div>

      <div className="card">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-notion-sidebar dark:bg-notion-hover-dark flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-notion-text-secondary dark:text-notion-text-secondary-dark" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-notion-text-primary dark:text-notion-text-primary-dark">Generate Summary Report</h2>
              <p className="text-sm text-notion-text-secondary mt-0.5">Export matching details and statistics as Excel</p>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="btn-primary">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><FileSpreadsheet className="w-4 h-4" /> Generate Report</>
            )}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/30 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
        </div>
      </div>

      {report && (
        <div className="card">
          <div className="px-4 py-3 border-b border-notion-border dark:border-notion-border-dark">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{report.message}</span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(report.summary).map(([k, v]) => (
                <div key={k} className="bg-notion-sidebar dark:bg-notion-hover-dark rounded-lg p-3 text-center">
                  <p className="text-xs text-notion-text-tertiary capitalize">{k.replace('_', ' ')}</p>
                  <p className="text-lg font-semibold text-notion-text-primary dark:text-notion-text-primary-dark">{v as number}</p>
                </div>
              ))}
            </div>
            <a href={`${API_BASE}${report.download_url}`} className="btn-primary inline-flex">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
