import { useMemo, useState } from 'react'
import { Modification, StudentRecord } from '../types'

interface ComparisonTableProps {
  modifications: Modification[]
  newRecords: StudentRecord[]
  missingRecords: StudentRecord[]
}

type Tab = 'modified' | 'new' | 'missing'

export default function ComparisonTable({ modifications, newRecords, missingRecords }: ComparisonTableProps) {
  const [tab, setTab] = useState<Tab>('modified')

  const tabs = [
    { key: 'modified' as Tab, label: 'Modified', count: modifications.length, color: 'text-amber-600' },
    { key: 'new' as Tab, label: 'New Students', count: newRecords.length, color: 'text-blue-600' },
    { key: 'missing' as Tab, label: 'Missing', count: missingRecords.length, color: 'text-red-600' },
  ]

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg">
      <div className="border-b border-gray-200 flex">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 ${t.color}`}>({t.count})</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        {tab === 'modified' && <ModificationsTable data={modifications} />}
        {tab === 'new' && <SimpleTable records={newRecords} />}
        {tab === 'missing' && <SimpleTable records={missingRecords} />}
      </div>
    </div>
  )
}

function ModificationsTable({ data }: { data: Modification[] }) {
  if (!data.length) return <p className="p-5 text-sm text-gray-400">No modifications found</p>

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Admission No</th>
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Student</th>
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Field</th>
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Old Value</th>
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">New Value</th>
        </tr>
      </thead>
      <tbody>
        {data.map((m, i) => (
          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
            <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{m.admission_no}</td>
            <td className="px-4 py-2.5 text-gray-900">{m.student_name}</td>
            <td className="px-4 py-2.5">
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">{m.field_name}</span>
            </td>
            <td className="px-4 py-2.5 text-red-600 text-xs">{m.old_value || '—'}</td>
            <td className="px-4 py-2.5 text-green-600 text-xs">{m.new_value || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SimpleTable({ records }: { records: StudentRecord[] }) {
  if (!records.length) return <p className="p-5 text-sm text-gray-400">No records</p>

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Admission No</th>
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Class</th>
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Gender</th>
          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r, i) => (
          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
            <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{r.admission_no}</td>
            <td className="px-4 py-2.5 text-gray-900">{r.student_name}</td>
            <td className="px-4 py-2.5 text-gray-700">{r.class_name}</td>
            <td className="px-4 py-2.5 text-gray-700">{r.gender}</td>
            <td className="px-4 py-2.5 text-gray-700">{r.category}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
