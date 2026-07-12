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
  matched_admissions: string[]
  modifications: Modification[]
  new_records: StudentRecord[]
  missing_records: StudentRecord[]
}

export interface Modification {
  admission_no: string
  field_name: string
  old_value: string
  new_value: string
  student_name: string
  difference_type: string
}

export interface StudentRecord {
  admission_no: string
  student_name: string
  class_name: string
  gender: string
  category: string
  language: string
  source_sheet: string
  difference_type?: string
}

export interface StatsResult {
  boys: number
  girls: number
  sc: number
  obc: number
  st: number
  ews: number
  gen: number
  total: number
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
  records: StudentRecord[]
}