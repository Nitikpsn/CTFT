export interface UploadResult {
  session_id: string
  school_rows: number
  portal_rows: number
  columns_mapped: string[]
  errors?: { row: number; field: string; message: string }[]
  school_sample: Record<string, string>[]
  portal_sample: Record<string, string>[]
}

export interface FuzzyMatch {
  school_id: string
  portal_id: string
  score: number
}

export interface CompareResult {
  data_type?: 'student' | 'aggregate'
  matched: number
  missing: number
  modified: number
  new: number
  matched_ids: string[]
  fuzzy_matched?: FuzzyMatch[]
  modifications: Modification[]
  new_records: Record<string, string>[]
  missing_records: Record<string, string>[]
  category_result?: CategoryCompareResult
  school_label?: string
  portal_label?: string
}

export interface Modification {
  id: string
  field_name: string
  old_value: string
  new_value: string
  record_name: string
  difference_type: string
  ai_insight?: AIInsight
  fuzzy_score?: number
  school_id?: string
  portal_id?: string
}

export interface AIInsight {
  type: 'correction' | 'rename' | 'reclassification' | 'data_entry_error' | 'unknown'
  explanation: string
  confidence: number
  action: 'accept' | 'skip' | 'review'
}

export interface StatsResult {
  labels: Record<string, number>
  charts?: ChartData[]
}

export interface ChartData {
  title: string
  type: 'pie' | 'bar'
  data: { name: string; value: number }[]
}

export interface MetricValue {
  from: number
  to: number
  delta: number
}

export interface Discrepancy {
  class_id: string
  metrics: Record<string, MetricValue>
}

export interface CategoryCompareResult {
  summary: {
    school_total: number
    portal_total: number
    net_difference: number
  }
  discrepancies: Discrepancy[]
}

export interface ReportResult {
  message: string
  download_url: string
  summary: {
    total_portal: number
    matched: number
    new: number
    missing: number
    modified: number
  }
}

export interface ChatResult {
  original_query: string
  normalized_query: string
  filter_applied: Record<string, string>
  total_records: number
  records: Record<string, string>[]
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: string, row: Record<string, string>) => React.ReactNode
}
