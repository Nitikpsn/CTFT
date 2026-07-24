import { Lightbulb, CheckCircle, AlertTriangle, XCircle, HelpCircle, Brain } from 'lucide-react'
import type { AIInsight } from '../types'

const INSIGHT_STYLES: Record<string, { icon: any; label: string; cls: string }> = {
  correction:        { icon: CheckCircle,     label: 'Correction',        cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-600/20' },
  rename:            { icon: Lightbulb,       label: 'Rename',            cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-600/20' },
  reclassification:  { icon: AlertTriangle,   label: 'Reclassification',  cls: 'bg-amber-500/10 text-amber-400 border-amber-600/20' },
  data_entry_error:  { icon: XCircle,         label: 'Data Entry Error',  cls: 'bg-rose-500/10 text-rose-400 border-rose-600/20' },
  unknown:           { icon: HelpCircle,       label: 'Unknown',           cls: 'bg-slate-800 text-slate-400 border-slate-700' },
}

const ACTION_COLORS: Record<string, string> = {
  accept: 'bg-emerald-500/10 text-emerald-400 border-emerald-600/20',
  skip:   'bg-indigo-500/10 text-indigo-400 border-indigo-600/20',
  review: 'bg-amber-500/10 text-amber-400 border-amber-600/20',
}

export default function AIInsightBadge({ insight }: { insight: AIInsight }) {
  const cfg = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.unknown
  const Icon = cfg.icon
  const actionCls = ACTION_COLORS[insight.action] || ACTION_COLORS.review

  return (
    <div className={`mt-2 ${cfg.cls} border rounded-lg p-2.5`}>
      <div className="flex items-start gap-2">
        <Brain className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.cls.split(' ')[1]}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon className={`w-3 h-3 ${cfg.cls.split(' ')[1]}`} />
            <span className={`text-xs font-medium ${cfg.cls.split(' ')[1]}`}>{cfg.label}</span>
            <span className="text-[10px] text-slate-500 ml-auto">{Math.round(insight.confidence * 100)}%</span>
          </div>
          <p className="text-xs text-slate-400">{insight.explanation}</p>
          <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${actionCls}`}>
            {insight.action === 'accept' ? 'Accept' : insight.action === 'skip' ? 'Skip' : 'Review'}
          </span>
        </div>
      </div>
    </div>
  )
}