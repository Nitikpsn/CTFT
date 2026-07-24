import { CheckCircle2, ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react'

const CARD_CONFIG = {
  matched:  { label: 'Matched', icon: CheckCircle2, color: '#10b981', border: '#059669' },
  missing:  { label: 'Missing', icon: ArrowDown,     color: '#f43f5e', border: '#e11d48' },
  modified: { label: 'Modified', icon: ArrowUpRight, color: '#f59e0b', border: '#d97706' },
  new:      { label: 'New', icon: Sparkles,          color: '#6366f1', border: '#4f46e5' },
}

export default function SummaryCards({ matched, missing, modified, newStudents }: any) {
  const values = { matched, missing, modified, new: newStudents }
  const total = matched + missing + modified + newStudents

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Object.entries(CARD_CONFIG).map(([key, cfg]) => {
        const Icon = cfg.icon
        const val = values[key as keyof typeof values]
        return (
          <div
            key={key}
            className="border rounded-xl p-4"
            style={{ background: `${cfg.color}08`, borderColor: `${cfg.border}33` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
              <Icon className="w-4 h-4" style={{ color: cfg.color }} />
            </div>
            <p className="text-2xl font-semibold text-white">{val.toLocaleString()}</p>
            <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${total > 0 ? (val / total) * 100 : 0}%`, background: cfg.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}