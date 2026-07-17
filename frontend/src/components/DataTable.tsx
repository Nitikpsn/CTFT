import { useState, useMemo } from 'react'
import { Search, ArrowUpDown } from 'lucide-react'

export default function DataTable({ columns, data, pageSize = 50, emptyMessage = 'No records' }: {
  columns: { key: string; label: string; render?: (v: string, row: any) => any }[]
  data: any[]
  pageSize?: number
  emptyMessage?: string
}) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let list = [...data]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(row => columns.some(col => String(row[col.key] || '').toLowerCase().includes(q)))
    }
    if (sortKey) {
      list.sort((a, b) => {
        const av = (a[sortKey] || '').toLowerCase()
        const bv = (b[sortKey] || '').toLowerCase()
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }
    return list
  }, [data, search, sortKey, sortAsc])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  if (!data.length) {
    return <div className="card py-10 text-center"><p className="text-sm text-notion-text-tertiary">{emptyMessage}</p></div>
  }

  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-notion-border dark:border-notion-border-dark">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-notion-text-tertiary" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-notion-border dark:border-notion-border-dark rounded bg-notion-hover dark:bg-notion-hover-dark text-notion-text-primary dark:text-notion-text-primary-dark placeholder-notion-text-tertiary focus:outline-none focus:ring-1 focus:ring-notion-text-secondary"
          />
        </div>
        <p className="text-xs text-notion-text-tertiary mt-1.5">{filtered.length} of {data.length} records</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-notion-border dark:border-notion-border-dark bg-notion-sidebar dark:bg-notion-sidebar-dark">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left px-4 py-2 font-medium text-notion-text-tertiary text-xs uppercase tracking-wider cursor-pointer select-none hover:text-notion-text-secondary dark:hover:text-notion-text-secondary-dark"
                  onClick={() => {
                    if (sortKey === col.key) setSortAsc(!sortAsc)
                    else { setSortKey(col.key); setSortAsc(true) }
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className={`w-3 h-3 ${sortKey === col.key ? 'text-notion-text-primary dark:text-notion-text-primary-dark' : 'opacity-30'}`} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="border-b border-notion-border/50 dark:border-notion-border-dark/50 hover:bg-notion-hover/50 dark:hover:bg-notion-hover-dark/50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2 text-notion-text-secondary dark:text-notion-text-secondary-dark">
                    {col.render ? col.render(row[col.key] || '', row) : row[col.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-2 border-t border-notion-border dark:border-notion-border-dark flex items-center justify-between text-xs text-notion-text-tertiary">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary !px-3 !py-1 !text-xs">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-secondary !px-3 !py-1 !text-xs">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
