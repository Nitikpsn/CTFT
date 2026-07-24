import { useState, useMemo } from 'react'
import DataTable from './DataTable'
import AIInsightBadge from './AIInsights'

export default function ComparisonTable({ modifications, newRecords, missingRecords }: any) {
  const [tab, setTab] = useState('modified')
  const [selectedMod, setSelectedMod] = useState<string | null>(null)

  const tabs = [
    { key: 'modified', label: 'Modified', count: modifications.length },
    { key: 'new', label: 'Added', count: newRecords.length },
    { key: 'missing', label: 'Missing', count: missingRecords.length },
  ]

  const modCols = [
    { key: 'id', label: 'ID' },
    { key: 'record_name', label: 'Name' },
    {
      key: 'field_name',
      label: 'Field',
      render: (v: string) => (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-600/20">
          {v}
        </span>
      ),
    },
    { key: 'old_value', label: 'Old', render: (v: string) => <span className="text-rose-400 text-xs">{v || '—'}</span> },
    { key: 'new_value', label: 'New', render: (v: string) => <span className="text-emerald-400 text-xs">{v || '—'}</span> },
    {
      key: 'ai_insight',
      label: 'AI',
      render: (v: any, row: any) => {
        if (!row.ai_insight) {
          return <span className="text-[10px] text-slate-600">—</span>
        }
        const key = row.id + row.field_name
        const isSelected = selectedMod === key
        const action = row.ai_insight.action
        let cls = 'bg-amber-500/10 text-amber-400 border-amber-600/20'
        if (action === 'accept') cls = 'bg-emerald-500/10 text-emerald-400 border-emerald-600/20'
        if (action === 'skip') cls = 'bg-indigo-500/10 text-indigo-400 border-indigo-600/20'
        return (
          <button
            onClick={() => setSelectedMod(isSelected ? null : key)}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors border ${cls}`}
          >
            {row.ai_insight.type.replace(/_/g, ' ')}
          </button>
        )
      },
    },
  ]

  const dynCols = useMemo(() => {
    const sample = newRecords[0] || missingRecords[0]
    if (!sample) return []
    return Object.keys(sample).map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    }))
  }, [newRecords, missingRecords])

  return (
    <div className="mt-4">
      {/* tab bar */}
      <div className="flex gap-0.5 mb-3 bg-slate-800/50 rounded-lg p-0.5 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t.key
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'modified' && (
        <div>
          <DataTable
            columns={modCols}
            data={modifications.map((m: any) => ({ ...m }))}
            emptyMessage="All records match — no modifications found"
          />
          {selectedMod && modifications
            .filter((m: any) => m.id + m.field_name === selectedMod && m.ai_insight)
            .map((m: any) => (
              <div key={m.id + m.field_name} className="mt-2 px-4">
                <AIInsightBadge insight={m.ai_insight} />
              </div>
            ))}
        </div>
      )}
      {tab === 'new' && (
        <DataTable columns={dynCols} data={newRecords} emptyMessage="No new records found" />
      )}
      {tab === 'missing' && (
        <DataTable columns={dynCols} data={missingRecords} emptyMessage="No missing records found" />
      )}
    </div>
  )
}