import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/UploadZone'
import { uploadFiles } from '../services/api'
import { UploadResult } from '../types'
import { CheckCircle, AlertCircle, ArrowRight, FileText } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState('')

  const handleUpload = useCallback(async (files: { school: File | null; portal: File | null }) => {
    if (!files.school || !files.portal) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await uploadFiles(files.school, files.portal)
      setResult(res)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Upload Records</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your school records and portal records to compare and generate reports
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <UploadZone onUpload={handleUpload} />

        {loading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            Processing files...
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Upload successful</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Session</p>
                <p className="text-sm font-mono mt-0.5">{result.session_id.slice(0, 8)}...</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">School records</p>
                <p className="text-sm font-semibold mt-0.5">{result.school_rows}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Portal records</p>
                <p className="text-sm font-semibold mt-0.5">{result.portal_rows}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Columns mapped</p>
                <p className="text-sm mt-0.5 truncate">{result.columns_mapped.join(', ') || '—'}</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-medium text-red-700 mb-2">
                  {result.errors.length} validation error{result.errors.length > 1 ? 's' : ''}
                </p>
                {result.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-red-600 mt-1">Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => navigate(`/compare/${result.session_id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Compare Files
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/reports/${result.session_id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
