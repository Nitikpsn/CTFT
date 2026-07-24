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

  // after upload, show result view
  if (result) {
    return (
      <div>
        <button onClick={() => { setResult(null); setError('') }} className="btn-secondary mb-4">
          <ArrowRight className="w-4 h-4 rotate-180" />
          Upload new files
        </button>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Files uploaded successfully</p>
                <p className="text-xs text-slate-500 font-mono">Session {result.session_id.slice(0, 8)}</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <School className="w-3 h-3 text-slate-500" />
                  <p className="text-[11px] text-slate-500 font-medium">School Records</p>
                </div>
                <p className="text-2xl font-semibold text-white">{result.school_rows.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">students parsed</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <p className="text-[11px] text-slate-500 font-medium">Portal Records</p>
                </div>
                <p className="text-2xl font-semibold text-white">{result.portal_rows.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">students parsed</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-[11px] text-slate-500 font-medium mb-1.5">Mapped Columns</p>
                <p className="text-sm font-medium text-slate-300 truncate">
                  {result.columns_mapped.filter((c: string) => c !== 'source_sheet').join(', ') || '—'}
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-[11px] text-slate-500 font-medium mb-1.5">Total</p>
                <p className="text-2xl font-semibold text-white">{(result.school_rows + result.portal_rows).toLocaleString()}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">combined rows</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="mb-5 p-3 bg-amber-500/5 border border-amber-600/20 rounded-xl">
                <p className="text-xs font-medium text-amber-400 mb-1">
                  {result.errors.length} validation issue{result.errors.length > 1 ? 's' : ''} found
                </p>
                {result.errors.slice(0, 5).map((e: any, i: number) => (
                  <p key={i} className="text-xs text-amber-300">Row {e.row}: {e.message}</p>
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
        <h1 className="text-3xl font-bold text-white tracking-tight">CTFT</h1>
        <p className="text-base text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
          Compare your school records with the KV portal. Spot every mismatch in seconds.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="text-sm font-medium text-slate-200">Upload files</span>
        </div>
        <div className="p-5">
          <UploadZone onUpload={handleUpload} />
        </div>

        {loading && (
          <div className="px-5 py-4 border-t border-slate-800 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-200 rounded-full animate-spin" />
              Processing...
            </div>
          </div>
        )}

        {error && (
          <div className="px-5 py-4 border-t border-slate-800">
            <div className="flex items-start gap-2 p-3 bg-rose-500/5 border border-rose-600/20 rounded-xl text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}