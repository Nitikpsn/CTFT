import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#373737', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#ec4899']
const COLORS_DARK = ['rgba(255,255,255,0.8)', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#ec4899']

export default function Dashboard({ stats }: { stats: any }) {
  if (!stats || !stats.labels || Object.keys(stats.labels).length === 0) {
    return (
      <div className="card p-8 text-center mt-4">
        <p className="text-sm text-notion-text-tertiary">No stats</p>
      </div>
    )
  }

  const entries = Object.entries(stats.labels).filter(([, v]) => (v as number) > 0) as [string, number][]
  const total = entries.reduce((a, [, v]) => a + v, 0)

  const data = entries.map(([name, value]) => ({ name, value }))
  const isSmall = entries.length <= 2

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div className="card">
        <div className="px-4 py-3 border-b border-notion-border dark:border-notion-border-dark">
          <h3 className="text-sm font-medium text-notion-text-primary dark:text-notion-text-primary-dark">Distribution</h3>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={260}>
            {isSmall ? (
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            ) : (
              <BarChart data={data}>
                <Tooltip />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Bar dataKey="value" fill="#373737" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-notion-border dark:border-notion-border-dark">
          <h3 className="text-sm font-medium text-notion-text-primary dark:text-notion-text-primary-dark">Summary</h3>
        </div>
        <div className="p-4 space-y-3">
          {entries.map(([key, value], i) => {
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-notion-text-secondary dark:text-notion-text-secondary-dark capitalize">{key}</span>
                  <span className="font-medium text-notion-text-primary dark:text-notion-text-primary-dark">
                    {value.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-notion-hover dark:bg-notion-hover-dark rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
