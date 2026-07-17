import type { CategoryCompareResult, MetricValue } from '../types'
import { ArrowUpDown } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  students: 'Students',
  general: 'General',
  obc: 'OBC',
  obc_cl: 'OBC (CL)',
  obc_ncl: 'OBC (NCL)',
  sc: 'SC',
  st: 'ST',
  muslim: 'Muslim',
  christian: 'Christian',
  sikh: 'Sikh',
  buddhist: 'Buddhist',
  parsi: 'Parsi',
  jain: 'Jain',
  minority_total: 'Minority',
  cwsn: 'CWSN',
  rte: 'RTE',
  sgc: 'SGC',
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-notion-text-tertiary">—</span>
  if (value > 0) return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+{value}</span>
  return <span className="text-xs font-medium text-red-600 dark:text-red-400">{value}</span>
}

function MetricCell({ m }: { m: MetricValue }) {
  if (m.from === 0 && m.to === 0) return <span className="text-xs text-notion-text-tertiary">—</span>
  return (
    <div className="text-right">
      <DeltaBadge value={m.delta} />
      <div className="text-[9px] text-notion-text-tertiary">
        {m.from}→{m.to}
      </div>
    </div>
  )
}

export default function CategoryComparison({ result }: { result: CategoryCompareResult }) {
  const { summary, discrepancies } = result

  if (discrepancies.length === 0) {
    return (
      <div className="text-sm text-notion-text-tertiary text-center py-8">
        No category data found to compare.
      </div>
    )
  }

  const allMetrics = new Set<string>()
  for (const d of discrepancies) {
    for (const key of Object.keys(d.metrics)) {
      allMetrics.add(key)
    }
  }
  const metricKeys = Array.from(allMetrics)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-notion-sidebar dark:bg-notion-hover-dark rounded-lg p-3">
          <p className="text-[10px] text-notion-text-tertiary mb-0.5">School Record Total</p>
          <p className="text-lg font-semibold text-notion-text-primary dark:text-notion-text-primary-dark">{summary.school_total.toLocaleString()}</p>
        </div>
        <div className="bg-notion-sidebar dark:bg-notion-hover-dark rounded-lg p-3">
          <p className="text-[10px] text-notion-text-tertiary mb-0.5">Portal Record Total</p>
          <p className="text-lg font-semibold text-notion-text-primary dark:text-notion-text-primary-dark">{summary.portal_total.toLocaleString()}</p>
        </div>
        <div className="bg-notion-sidebar dark:bg-notion-hover-dark rounded-lg p-3">
          <p className="text-[10px] text-notion-text-tertiary mb-0.5">Net Difference</p>
          <p className={`text-lg font-semibold ${summary.net_difference === 0 ? 'text-notion-text-primary dark:text-notion-text-primary-dark' : summary.net_difference > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {summary.net_difference > 0 ? '+' : ''}{summary.net_difference.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-notion-border dark:border-notion-border-dark">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-notion-sidebar dark:bg-notion-hover-dark">
              <th className="text-left px-3 py-2 text-[10px] font-medium text-notion-text-tertiary uppercase tracking-wider">Class</th>
              {metricKeys.map(cat => (
                <th key={cat} className="text-right px-2 py-2 text-[10px] font-medium text-notion-text-tertiary uppercase tracking-wider whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">
                    <ArrowUpDown className="w-3 h-3" />
                    {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-notion-border dark:divide-notion-border-dark">
            {discrepancies.map(d => {
              const hasDiff = Object.values(d.metrics).some(m => m.delta !== 0)
              return (
                <tr key={d.class_id} className={`hover:bg-notion-hover/50 dark:hover:bg-notion-hover-dark/50 ${hasDiff ? 'bg-notion-hover/30 dark:bg-notion-hover-dark/30' : ''}`}>
                  <td className="px-3 py-2 text-xs font-medium text-notion-text-primary dark:text-notion-text-primary-dark">
                    {d.class_id}
                  </td>
                  {metricKeys.map(cat => (
                    <td key={cat} className="px-2 py-2">
                      {d.metrics[cat] ? <MetricCell m={d.metrics[cat]} /> : null}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
