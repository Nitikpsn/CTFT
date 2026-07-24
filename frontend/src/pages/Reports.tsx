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
      {/* header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="p-1 text-slate-500 hover:text-slate-300"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Report</h1>
          <p className="text-xs text-slate-500 font-mono">{sessionId?.slice(0, 8)}</p>
        </div>
        <div className="flex-1" />
        {sessionId && (
          <Link to={`/compare/${sessionId}`} className="btn-secondary text-sm">
            <BarChart3 className="w-3.5 h-3.5" /> Compare
          </Link>
        )}
      </div>

      {/* generate card */}
      <div className="card">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-200">Generate Summary Report</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Export comparison results and statistics as a formatted Excel file
              </p>
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
            <div className="mt-3 p-3 bg-rose-500/5 border border-rose-600/20 rounded-xl text-sm text-rose-300">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* result card */}
      {report && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">{report.message}</span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(report.summary).map(([k, v]) => (
                <div key={k} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 capitalize">{k.replace(/_/g, ' ')}</p>
                  <p className="text-lg font-semibold text-white">{v as number}</p>
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