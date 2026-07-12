import { Users, ArrowDown, ArrowUpRight, ArrowUp } from 'lucide-react'

interface SummaryCardsProps {
  matched: number
  missing: number
  modified: number
  newStudents: number
}

export default function SummaryCards({ matched, missing, modified, newStudents }: SummaryCardsProps) {
  const cards = [
    { label: 'Matched', value: matched, icon: Users, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Missing', value: missing, icon: ArrowDown, color: 'bg-red-50 text-red-700' },
    { label: 'Modified', value: modified, icon: ArrowUpRight, color: 'bg-amber-50 text-amber-700' },
    { label: 'New', value: newStudents, icon: ArrowUp, color: 'bg-blue-50 text-blue-700' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">{c.label}</p>
            <c.icon className={`w-4 h-4 ${c.color}`} />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{c.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
