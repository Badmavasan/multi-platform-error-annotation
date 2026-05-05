import axios from 'axios'
import type {
  TokenResponse, Context, ContextListItem, PredefinedError,
  Annotator, Assignment, QueueItem, Annotation,
} from '../types'

const api = axios.create({ baseURL: '/error-annotation/api/v1' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('user_name')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post<TokenResponse>('/auth/login', { username, password })

// ── Predefined Errors ─────────────────────────────────────────────────────────
export const getErrors = (platform?: string) =>
  api.get<PredefinedError[]>('/errors', { params: platform ? { platform } : {} })

export const createError = (data: { platform: string; error_tag: string; description: string }) =>
  api.post<PredefinedError>('/errors', data)

export const updateError = (id: number, data: { description?: string }) =>
  api.put<PredefinedError>(`/errors/${id}`, data)

export const deleteError = (id: number) => api.delete(`/errors/${id}`)

// ── Image upload ──────────────────────────────────────────────────────────────
export const uploadImage = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<{ url: string }>('/upload/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ── Contexts ──────────────────────────────────────────────────────────────────
export const getContexts = () => api.get<ContextListItem[]>('/contexts')
export const getContext = (id: number) => api.get<Context>(`/contexts/${id}`)
export const createContext = (data: object) => api.post<Context>('/contexts', data)
export const updateContext = (id: number, data: object) => api.put<Context>(`/contexts/${id}`, data)
export const deleteContext = (id: number) => api.delete(`/contexts/${id}`)

// ── Users ─────────────────────────────────────────────────────────────────────
export const getAnnotators = () => api.get<Annotator[]>('/users')
export const createAnnotator = (data: object) => api.post<Annotator>('/users', data)
export const deleteAnnotator = (id: number) => api.delete(`/users/${id}`)

// ── Assignments ───────────────────────────────────────────────────────────────
export const getAssignments = () => api.get<Assignment[]>('/assignments')
export const createAssignment = (context_id: number, annotator_id: number) =>
  api.post('/assignments', { context_id, annotator_id })
export const deleteAssignment = (id: number) => api.delete(`/assignments/${id}`)

// ── Admin export ──────────────────────────────────────────────────────────────
export const getAnnotationsExport = () => api.get<import('../types').ContextExport[]>('/admin/annotations/export')

// ── Annotator queue ───────────────────────────────────────────────────────────
export const getQueue = () => api.get<QueueItem[]>('/annotator/queue')
export const getQueueItem = (id: number) => api.get<QueueItem>(`/annotator/queue/${id}`)
export const submitAnnotation = (id: number, data: object) =>
  api.post<Annotation>(`/annotator/queue/${id}/annotate`, data)

export default api
