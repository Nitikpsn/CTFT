const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function uploadFiles(
  file1: File,
  file2: File
): Promise<import('../types').UploadResult> {
  const form = new FormData()
  form.append('file1', file1)
  form.append('file2', file2)
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function compare(session_id: string) {
  return apiFetch<import('../types').CompareResult>('/api/compare', {
    method: 'POST',
    body: JSON.stringify({ session_id }),
  })
}

export async function getStats(sessionId: string) {
  return apiFetch<import('../types').StatsResult>(`/api/stats/${sessionId}`)
}

export async function generateReport(sessionId: string) {
  return apiFetch<import('../types').ReportResult>('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  })
}

export async function chatQuery(sessionId: string, query: string) {
  return apiFetch<import('../types').ChatResult>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, query }),
  })
}