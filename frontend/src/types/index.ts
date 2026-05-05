export type Platform = 'Algopython' | 'Pyrates' | 'SPY'
export type Role = 'admin' | 'annotator'

export interface PredefinedError {
  id: number
  platform: Platform
  error_tag: string
  description: string
}

export interface Context {
  id: number
  platform: Platform
  title: string
  description: string
  image_url: string | null
  student_submission: string
  correct_answer: string
  created_at: string
  errors: PredefinedError[]
}

export interface ContextListItem {
  id: number
  platform: Platform
  title: string
  created_at: string
  assignment_count: number
}

export interface Annotator {
  id: number
  username: string
  name: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Assignment {
  id: number
  assigned_at: string
  is_completed: boolean
  context: Context
  annotator: Annotator
}

export interface ErrorReview {
  error: PredefinedError
  is_agreed: boolean
}

export interface Annotation {
  id: number
  assignment_id: number
  error_reviews: ErrorReview[]
  has_additional_errors: boolean
  additional_errors_text: string | null
  submitted_at: string
}

export interface QueueItem {
  assignment_id: number
  context: Context
  is_completed: boolean
  annotation: Annotation | null
}

export interface ErrorReviewExport {
  error_id: number
  error_tag: string
  is_agreed: boolean
}

export interface AssignmentExport {
  assignment_id: number
  annotator_username: string
  annotator_name: string
  submitted_at: string
  error_reviews: ErrorReviewExport[]
  has_additional_errors: boolean
  additional_errors_text: string | null
}

export interface ContextExport {
  context_id: number
  context_title: string
  platform: string
  context_errors: PredefinedError[]
  annotations: AssignmentExport[]
}

export interface TokenResponse {
  access_token: string
  token_type: string
  role: Role
  user_id: number
  name: string
}
