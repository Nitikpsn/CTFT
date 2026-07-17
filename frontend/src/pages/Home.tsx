import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/UploadZone'
import { uploadFiles } from '../services/api'
import { CheckCircle2, AlertCircle, ArrowRight, FileText, BarChart3, School, Globe } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
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

  if (result) {
    return (
      <div>
        <button onClick={() => { setResult(null); setError('') }} className="btn-secondary mb-4">
          <ArrowRight className="w-4 h-4 rotate-180" />
          Upload new files
        </button>

        <div className="card">
          <div className="px-5 py-4 border-b border-notion-border dark:border-notion-border-dark">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-notion-text-primary dark:text-notion-text-primary-dark">Uploaded successfully</p>
                <p className="text-xs text-notion-text-tertiary font-mono">{result.session_id.slice(0, 8)}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-notion-sidebar dark:bg-notion-hover-dark rounded-lg p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <School className="w-3 h-3 text-notion-text-tertiary" />
                  <p className="text-[11px] text-notion-text-tertiary font-medium">School Records</p>
                </div>
                <p className="text-2xl font-semibold text-notion-text-primary dark:text-notion-text-primary-dark">{result.school_rows.toLocaleString()}</p>
                <p className="text-[11px] text-notion-text-tertiary mt-0.5">rows parsed</p>
              </div>
              <div className="bg-notion-sidebar dark:bg-notion-hover-dark rounded-lg p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3 h-3 text-notion-text-tertiary" />
                  <p className="text-[11px] text-notion-text-tertiary font-medium">Portal Records</p>
                </div>
                <p className="text-2xl font-semibold text-notion-text-primary dark:text-notion-text-primary-dark">{result.portal_rows.toLocaleString()}</p>
                <p className="text-[11px] text-notion-text-tertiary mt-0.5">rows parsed</p>
              </div>
              <div className="bg-notion-sidebar dark:bg-notion-hover-dark rounded-lg p-4">
                <p className="text-[11px] text-notion-text-tertiary font-medium mb-1.5">Mapped Columns</p>
                <p className="text-sm font-medium text-notion-text-secondary dark:text-notion-text-secondary-dark truncate">{result.columns_mapped.filter((c: string) => c !== 'source_sheet').join(', ') || '—'}</p>
              </div>
              <div className="bg-notion-sidebar dark:bg-notion-hover-dark rounded-lg p-4">
                <p className="text-[11px] text-notion-text-tertiary font-medium mb-1.5">Total</p>
                <p className="text-2xl font-semibold text-notion-text-primary dark:text-notion-text-primary-dark">{(result.school_rows + result.portal_rows).toLocaleString()}</p>
                <p className="text-[11px] text-notion-text-tertiary mt-0.5">combined rows</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/30 rounded-lg">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">{result.errors.length} validation error(s)</p>
                {result.errors.slice(0, 5).map((e: any, i: number) => (
                  <p key={i} className="text-xs text-amber-600 dark:text-amber-400">Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => navigate(`/compare/${result.session_id}`)} className="btn-primary">
                <BarChart3 className="w-4 h-4" /> Compare <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate(`/reports/${result.session_id}`)} className="btn-secondary">
                <FileText className="w-4 h-4" /> Report
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-notion-text-primary dark:text-notion-text-primary-dark">CTFT Comparison Tool for Teachers</h1>
        <p className="text-sm text-notion-text-secondary mt-1">Upload two Excel files to compare and find differences</p>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-notion-border dark:border-notion-border-dark">
          <span className="text-sm font-medium text-notion-text-primary dark:text-notion-text-primary-dark">Upload files</span>
        </div>
        <div className="p-5">
          <UploadZone onUpload={handleUpload} />
        </div>

        {loading && (
          <div className="px-5 py-4 border-t border-notion-border dark:border-notion-border-dark text-center">
            <div className="inline-flex items-center gap-2 text-sm text-notion-text-secondary">
              <div className="w-4 h-4 border-2 border-notion-text-tertiary border-t-notion-text-primary rounded-full animate-spin" />
              Processing...
            </div>
          </div>
        )}

        {error && (
          <div className="px-5 py-4 border-t border-notion-border dark:border-notion-border-dark">
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/30 rounded-lg text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
