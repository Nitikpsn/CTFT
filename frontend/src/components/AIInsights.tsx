import { Lightbulb, CheckCircle, AlertTriangle, XCircle, HelpCircle, Brain } from 'lucide-react'
import type { AIInsight } from '../types'

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  correction: { icon: CheckCircle, label: 'Correction', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  rename: { icon: Lightbulb, label: 'Rename', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  reclassification: { icon: AlertTriangle, label: 'Reclassification', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  data_entry_error: { icon: XCircle, label: 'Data Entry Error', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  unknown: { icon: HelpCircle, label: 'Unknown', color: 'text-notion-text-secondary dark:text-notion-text-secondary-dark', bg: 'bg-notion-sidebar dark:bg-notion-hover-dark' },
}

export default function AIInsightBadge({ insight }: { insight: AIInsight }) {
  const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.unknown
  const Icon = cfg.icon

  return (
    <div className={`mt-2 ${cfg.bg} rounded-lg p-2.5`}>
      <div className="flex items-start gap-2">
        <Brain className={`w-3.5 h-3.5 ${cfg.color} mt-0.5 flex-shrink-0`} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon className={`w-3 h-3 ${cfg.color}`} />
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            <span className="text-[10px] text-notion-text-tertiary ml-auto">
              {Math.round(insight.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-xs text-notion-text-secondary dark:text-notion-text-secondary-dark">{insight.explanation}</p>
          <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
            insight.action === 'accept' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
            insight.action === 'skip' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' :
            'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
          }`}>
            {insight.action === 'accept' ? 'Accept' : insight.action === 'skip' ? 'Skip' : 'Review'}
          </span>
        </div>
      </div>
    </div>
  )
}
