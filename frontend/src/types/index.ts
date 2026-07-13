export interface UploadResult {
  session_id: string
  school_rows: number
  portal_rows: number
  columns_mapped: string[]
  errors?: { row: number; field: string; message: string }[]
  school_sample: Record<string, string>[]
  portal_sample: Record<string, string>[]
}

export interface CompareResult {
  matched: number
  missing: number
  modified: number
  new: number
  matched_ids: string[]
  modifications: Modification[]
  new_records: Record<string, string>[]
  missing_records: Record<string, string>[]
}

export interface Modification {
  id: string
  field_name: string
  old_value: string
  new_value: string
  record_name: string
  difference_type: string
  ai_insight?: AIInsight
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

export interface CategoryDelta {
  [category: string]: number
}

export interface ClassDiff {
  class: string | number
  deltas: CategoryDelta
  net_delta: number
  abs_delta_sum: number
  students_delta: number
  is_reclassification: boolean
  reclassification_score: number
  school_totals: Record<string, number>
  govt_totals: Record<string, number>
  school_total_students: number
  govt_total_students: number
  positive_deltas: Record<string, number>
  negative_deltas: Record<string, number>
}

export interface ConsistencyCheck {
  file: string
  class: string | number
  category_sum: number
  students_total: number
  gap: number
  severity: string
}

export interface CategoryCompareResult {
  class_diffs: ClassDiff[]
  summary: {
    total_classes: number
    total_reclassifications: number
    total_headcount_diffs: number
    total_students_school: number
    total_students_govt: number
    total_delta_net: number
    total_delta_abs: number
  }
  flags: { type: string; message: string; classes: (string | number)[] }[]
  school_meta: { has_subtotal_rows: boolean; has_gender_split: boolean; total_consistency_warnings: number; consistency_checks: ConsistencyCheck[] }
  govt_meta: { has_subtotal_rows: boolean; has_gender_split: boolean; total_consistency_warnings: number; consistency_checks: ConsistencyCheck[] }
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
