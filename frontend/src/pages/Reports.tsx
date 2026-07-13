import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { generateReport } from '../services/api'
import { ReportResult } from '../types'
import { ArrowLeft, Download, FileSpreadsheet, CheckCircle } from 'lucide-react'

export default function Reports() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [report, setReport] = useState<ReportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const API_BASE = import.meta.env.VITE_API_URL || ''

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">CBSE/KVS Report</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{sessionId?.slice(0, 8)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900">Generate Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Class-wise, category-wise, gender-wise, language medium summary, missing records & mismatch report
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{report.message}</span>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-5">
              <StatBox label="Portal" value={report.summary.total_portal} />
              <StatBox label="Matched" value={report.summary.matched} />
              <StatBox label="New" value={report.summary.new} />
              <StatBox label="Missing" value={report.summary.missing} />
              <StatBox label="Modified" value={report.summary.modified} />
            </div>

            <a
              href={`${API_BASE}${report.download_url}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Excel Report
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
