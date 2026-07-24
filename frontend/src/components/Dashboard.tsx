import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// todo: maybe make these configurable later
const COLORS = ['#64748b', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#ec4899']

export default function Dashboard({ stats }: { stats: any }) {
  if (!stats?.labels || Object.keys(stats.labels).length === 0) {
    return (
      <div className="card p-8 text-center mt-4">
        <p className="text-sm text-slate-500">No statistics to display yet</p>
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
        <div className="card-header">
          <h3 className="text-sm font-medium text-slate-200">Distribution</h3>
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
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-medium text-slate-200">Summary</h3>
        </div>
        <div className="p-4 space-y-3">
          {entries.map(([key, value], i) => {
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400 capitalize">{key}</span>
                  <span className="font-medium text-slate-200">{value.toLocaleString()} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
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