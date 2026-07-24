import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle2, School, Globe } from 'lucide-react'

const ACCEPT_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
}

export default function UploadZone({ onUpload }: { onUpload: (files: { school: File | null; portal: File | null }) => void }) {
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)

  const drop1 = useDropzone({
    onDrop: useCallback((accepted: File[]) => {
      if (accepted.length) {
        setFile1(accepted[0])
        onUpload({ school: accepted[0], portal: file2 })
      }
    }, [file2, onUpload]),
    accept: ACCEPT_TYPES,
    maxFiles: 1,
  })

  const drop2 = useDropzone({
    onDrop: useCallback((accepted: File[]) => {
      if (accepted.length) {
        setFile2(accepted[0])
        onUpload({ school: file1, portal: accepted[0] })
      }
    }, [file1, onUpload]),
    accept: ACCEPT_TYPES,
    maxFiles: 1,
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FileBox zone={drop1} file={file1} title="School Record" subtitle="Your school's internal Excel data" icon={School} />
      <FileBox zone={drop2} file={file2} title="Portal Record" subtitle="Government portal snapshot" icon={Globe} />
    </div>
  )
}

function FileBox({ zone, file, title, subtitle, icon: Icon }: any) {
  const active = zone.isDragActive
  return (
    <div
      {...zone.getRootProps()}
      className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-150 ${
        active
          ? 'border-indigo-500 bg-indigo-500/5'
          : file
          ? 'border-emerald-600/40 bg-emerald-600/5'
          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/80'
      }`}
    >
      <input {...zone.getInputProps()} />
      <div className={`w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center ${file ? 'bg-emerald-600/10' : 'bg-slate-800'}`}>
        {file ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />}
      </div>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      {file ? (
        <p className="text-xs text-slate-400 mt-2 truncate max-w-[200px] mx-auto font-mono">{file.name}</p>
      ) : (
        <p className="text-xs text-slate-500 mt-2">{active ? 'Drop file' : 'Click to browse'}</p>
      )}
    </div>
  )
}