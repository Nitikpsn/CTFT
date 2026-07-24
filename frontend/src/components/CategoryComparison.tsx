import type { CategoryCompareResult, MetricValue } from '../types'
import { ArrowUpDown, AlertTriangle } from 'lucide-react'

// labels for the category columns
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
  if (value === 0) return <span className="text-xs text-slate-600">—</span>
  if (value > 0) return <span className="text-xs font-medium text-emerald-400">+{value}</span>
  return <span className="text-xs font-medium text-rose-400">{value}</span>
}

function MetricCell({ m }: { m: MetricValue }) {
  if (m.from === 0 && m.to === 0) return <span className="text-xs text-slate-600">—</span>
  return (
    <div className="text-right">
      <DeltaBadge value={m.delta} />
      <div className="text-[9px] text-slate-500">{m.from}→{m.to}</div>
    </div>
  )
}

export default function CategoryComparison({ result }: { result: CategoryCompareResult }) {
  const { summary, discrepancies } = result

  if (discrepancies.length === 0) {
    return (
      <div className="text-sm text-slate-500 text-center py-8">
        No category-level data found to compare.
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
  const hasCorrection = summary.school_corrected || summary.portal_corrected

  return (
    <div className="space-y-5">
      {hasCorrection && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-600/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-300">
            <p className="font-medium mb-0.5">Total corrected from category breakdown</p>
            {summary.school_corrected && (
              <p>
                School: category columns sum to {summary.school_category_sum?.toLocaleString()},
                which exceeds the stated total — using category sum for accurate comparison.
              </p>
            )}
            {summary.portal_corrected && (
              <p>
                Portal: category columns sum to {summary.portal_category_sum?.toLocaleString()},
                which exceeds the stated total — using category sum for accurate comparison.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">School Record Total</p>
          <p className="text-lg font-semibold text-white">{summary.school_total.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">Portal Record Total</p>
          <p className="text-lg font-semibold text-white">{summary.portal_total.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">Net Difference</p>
          <p className={`text-lg font-semibold ${summary.net_difference === 0 ? 'text-white' : summary.net_difference > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.net_difference > 0 ? '+' : ''}{summary.net_difference.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="text-left px-3 py-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Class</th>
              {metricKeys.map(cat => (
                <th key={cat} className="text-right px-2 py-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">
                    <ArrowUpDown className="w-3 h-3" />
                    {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {discrepancies.map(d => {
              const hasDiff = Object.values(d.metrics).some(m => m.delta !== 0)
              return (
                <tr key={d.class_id} className={`hover:bg-slate-800/30 ${hasDiff ? 'bg-slate-800/20' : ''}`}>
                  <td className="px-3 py-2 text-xs font-medium text-slate-200">{d.class_id}</td>
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