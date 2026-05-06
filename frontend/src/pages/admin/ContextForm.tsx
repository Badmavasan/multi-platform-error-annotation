import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X, Check } from 'lucide-react'
import { getContext, createContext, updateContext, getErrors, uploadImage } from '../../api/client'
import type { Platform, PredefinedError } from '../../types'
import { CodeEditor } from '../../components/CodeEditor'

const PLATFORMS: Platform[] = ['Algopython', 'Pyrates', 'SPY']

const PLATFORM_COLORS: Record<string, string> = {
  Algopython: 'rgba(99,102,241,0.12)',
  Pyrates: 'rgba(245,158,11,0.12)',
  SPY: 'rgba(16,185,129,0.12)',
}
const PLATFORM_TEXT: Record<string, string> = {
  Algopython: '#6366F1',
  Pyrates: '#F59E0B',
  SPY: '#10B981',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-display font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </label>
  )
}

function Field({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col ${className}`}>{children}</div>
}

function inputStyle(focused = false) {
  return {
    background: 'var(--bg-elevated)',
    borderColor: focused ? 'var(--accent)' : 'var(--border)',
    color: 'var(--text-primary)',
  }
}

export default function ContextForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [platform, setPlatform] = useState<Platform>('Algopython')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [studentSubmission, setStudentSubmission] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [selectedErrors, setSelectedErrors] = useState<number[]>([])

  const [availableErrors, setAvailableErrors] = useState<PredefinedError[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getErrors(platform).then(r => setAvailableErrors(r.data))
    if (!isEdit) setSelectedErrors([])
  }, [platform, isEdit])

  useEffect(() => {
    if (!isEdit) return
    getContext(parseInt(id!)).then(r => {
      const ctx = r.data
      setPlatform(ctx.platform)
      setTitle(ctx.title)
      setDescription(ctx.description)
      setStudentSubmission(ctx.student_submission)
      setCorrectAnswer(ctx.correct_answer)
      setImageUrl(ctx.image_url)
      setSelectedErrors(ctx.errors.map(e => e.id))
    }).finally(() => setLoading(false))
  }, [id, isEdit])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 3 Mo.')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const res = await uploadImage(file)
      setImageUrl(res.data.url)
    } finally {
      setUploading(false)
    }
  }

  const toggleError = (errorId: number) => {
    setSelectedErrors(prev =>
      prev.includes(errorId) ? prev.filter(id => id !== errorId) : [...prev, errorId]
    )
  }

  const handleSubmit = async () => {
    if (!title.trim() || !studentSubmission.trim() || !correctAnswer.trim()) {
      setError('Title, student submission, and correct answer are required')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      platform,
      title: title.trim(),
      description: description.trim(),
      student_submission: studentSubmission.trim(),
      correct_answer: correctAnswer.trim(),
      image_url: imageUrl,
      error_ids: selectedErrors,
    }
    try {
      if (isEdit) {
        await updateContext(parseInt(id!), payload)
      } else {
        await createContext(payload)
      }
      navigate('/admin/contexts')
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to save context')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-up">
        <div className="h-8 w-48 rounded bg-[var(--border)] animate-pulse mb-4" />
        <div className="h-4 w-32 rounded bg-[var(--border)] animate-pulse" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <button
          onClick={() => navigate('/admin/contexts')}
          className="p-2 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Context' : 'New Context'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isEdit ? 'Update the annotation context' : 'Create a new annotation context'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main form */}
        <div className="col-span-2 flex flex-col gap-5">
          <div
            className="rounded-xl border p-5 animate-fade-up stagger-1"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Basic Info
            </h2>
            <div className="flex flex-col gap-4">
              <Field>
                <Label>Platform</Label>
                <div className="flex gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all"
                      style={
                        platform === p
                          ? { background: PLATFORM_COLORS[p], color: PLATFORM_TEXT[p], border: `1px solid ${PLATFORM_TEXT[p]}40` }
                          : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              <Field>
                <Label>Title</Label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Context title"
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-mono border outline-none transition-all"
                  style={inputStyle()}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </Field>

              <Field>
                <Label>Description</Label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-mono border outline-none transition-all resize-none"
                  style={inputStyle()}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </Field>
            </div>
          </div>

          <div
            className="rounded-xl border p-5 animate-fade-up stagger-2"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Submission &amp; Answer
            </h2>
            <div className="flex flex-col gap-4">
              <Field>
                <Label>Student Submission</Label>
                <CodeEditor
                  value={studentSubmission}
                  onChange={setStudentSubmission}
                  placeholder="Paste the student's code here…"
                  minRows={8}
                />
              </Field>
              <Field>
                <Label>Correct Answer</Label>
                <CodeEditor
                  value={correctAnswer}
                  onChange={setCorrectAnswer}
                  placeholder="Paste the correct solution here…"
                  minRows={8}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <div
            className="rounded-xl border p-5 animate-fade-up stagger-1"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Image
            </h2>
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Context"
                  className="w-full rounded-lg object-cover"
                  style={{ maxHeight: 160, border: '1px solid var(--border)' }}
                />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
              >
                <Upload size={18} />
                <span className="text-xs font-display font-medium">
                  {uploading ? 'Uploading…' : 'Upload image'}
                </span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <div
            className="rounded-xl border p-5 animate-fade-up stagger-2 flex-1"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              Predefined Errors
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Select errors present in this context
            </p>
            {availableErrors.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No errors defined for {platform}</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                {availableErrors.map(err => {
                  const selected = selectedErrors.includes(err.id)
                  return (
                    <button
                      key={err.id}
                      onClick={() => toggleError(err.id)}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: selected ? PLATFORM_COLORS[platform] : 'var(--bg-elevated)',
                        border: `1px solid ${selected ? PLATFORM_TEXT[platform] + '40' : 'var(--border)'}`,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: selected ? PLATFORM_TEXT[platform] : 'var(--bg-base)',
                          border: `1px solid ${selected ? PLATFORM_TEXT[platform] : 'var(--border)'}`,
                        }}
                      >
                        {selected && <Check size={10} style={{ color: '#fff' }} />}
                      </div>
                      <span className="text-xs font-display font-medium" style={{ color: selected ? PLATFORM_TEXT[platform] : 'var(--text-secondary)' }}>
                        {err.error_tag}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg text-sm font-mono text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-display font-semibold disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff' }}
        >
          <Check size={14} />
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Context'}
        </button>
        <button
          onClick={() => navigate('/admin/contexts')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-display font-medium transition-all"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
