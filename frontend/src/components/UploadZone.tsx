import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle2, School, Globe } from 'lucide-react'

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
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'text/csv': ['.csv'] },
  })

  const drop2 = useDropzone({
    onDrop: useCallback((accepted: File[]) => {
      if (accepted.length) {
        setFile2(accepted[0])
        onUpload({ school: file1, portal: accepted[0] })
      }
    }, [file1, onUpload]),
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'text/csv': ['.csv'] },
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FileBox
        zone={drop1}
        file={file1}
        title="School Record"
        subtitle="Your school's internal Excel data"
        icon={School}
        hint="school_record.xlsx"
      />
      <FileBox
        zone={drop2}
        file={file2}
        title="Portal Record"
        subtitle="Government portal snapshot"
        icon={Globe}
        hint="portal_record.xlsx"
      />
    </div>
  )
}

function FileBox({ zone, file, title, subtitle, icon: Icon, hint }: any) {
  const active = zone.isDragActive
  return (
    <div
      {...zone.getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        active ? 'border-notion-text-secondary dark:border-notion-text-secondary-dark bg-notion-hover dark:bg-notion-hover-dark' :
        file ? 'border-emerald-400/60 dark:border-emerald-400/30 bg-emerald-50/50 dark:bg-emerald-900/10' :
        'border-notion-border dark:border-notion-border-dark hover:border-notion-text-tertiary dark:hover:border-notion-text-tertiary-dark'
      }`}
    >
      <input {...zone.getInputProps()} />
      <div className={`w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center ${file ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-notion-hover dark:bg-notion-hover-dark'}`}>
        {file ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Icon className={`w-5 h-5 ${active ? 'text-notion-text-secondary' : 'text-notion-text-tertiary'}`} />}
      </div>
      <p className="text-sm font-medium text-notion-text-primary dark:text-notion-text-primary-dark">{title}</p>
      <p className="text-[11px] text-notion-text-tertiary dark:text-notion-text-tertiary-dark mt-0.5">{subtitle}</p>
      {file ? (
        <p className="text-xs text-notion-text-secondary mt-2 truncate max-w-[200px] mx-auto">{file.name}</p>
      ) : (
        <p className="text-xs text-notion-text-tertiary mt-2">{active ? 'Drop file here' : `Click or drag ${hint}`}</p>
      )}
    </div>
  )
}
