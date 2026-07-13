import { useState, useMemo } from 'react'
import DataTable from './DataTable'
import AIInsightBadge from './AIInsights'

export default function ComparisonTable({ modifications, newRecords, missingRecords }: any) {
  const [tab, setTab] = useState('modified')
  const [selectedMod, setSelectedMod] = useState<string | null>(null)

  const tabs = [
    { key: 'modified', label: 'Modified', count: modifications.length },
    { key: 'new', label: 'New', count: newRecords.length },
    { key: 'missing', label: 'Missing', count: missingRecords.length },
  ]

  const modCols = [
    { key: 'id', label: 'ID' },
    { key: 'record_name', label: 'Name' },
    { key: 'field_name', label: 'Field', render: (v: string) => <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">{v}</span> },
    { key: 'old_value', label: 'Old', render: (v: string) => <span className="text-red-600 dark:text-red-400 text-xs">{v || '—'}</span> },
    { key: 'new_value', label: 'New', render: (v: string) => <span className="text-emerald-600 dark:text-emerald-400 text-xs">{v || '—'}</span> },
    {
      key: 'ai_insight',
      label: 'AI',
      render: (v: any, row: any) => (
        row.ai_insight ? (
          <button
            onClick={() => setSelectedMod(selectedMod === row.id + row.field_name ? null : row.id + row.field_name)}
            className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
              row.ai_insight.action === 'accept'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : row.ai_insight.action === 'skip'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
            }`}
          >
            {row.ai_insight.type.replace(/_/g, ' ')}
          </button>
        ) : (
          <span className="text-[10px] text-neutral-400">—</span>
        )
      ),
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
      <div className="flex gap-1 mb-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t.key
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'modified' && (
        <div>
          <DataTable columns={modCols} data={modifications.map((m: any) => ({ ...m }))} emptyMessage="No modifications" />
          {selectedMod && modifications
            .filter((m: any) => m.id + m.field_name === selectedMod && m.ai_insight)
            .map((m: any) => (
              <div key={m.id + m.field_name} className="mt-2 px-4">
                <AIInsightBadge insight={m.ai_insight} />
              </div>
            ))}
        </div>
      )}
      {tab === 'new' && <DataTable columns={dynCols} data={newRecords} emptyMessage="No new records" />}
      {tab === 'missing' && <DataTable columns={dynCols} data={missingRecords} emptyMessage="No missing records" />}
    </div>
  )
}
