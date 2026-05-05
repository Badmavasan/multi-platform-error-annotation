import { useEffect, useState } from 'react'
import { Library, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { getErrors, createError, updateError, deleteError } from '../../api/client'
import type { PredefinedError, Platform } from '../../types'

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

function ErrorRow({
  error,
  onUpdate,
  onDelete,
}: {
  error: PredefinedError
  onUpdate: (id: number, data: { description: string }) => Promise<void>
  onDelete: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState(error.description)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(error.id, { description })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDescription(error.description)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="px-5 py-3 border-b last:border-0" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>{error.error_tag}</p>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-sm font-mono border outline-none"
            style={{ background: 'var(--bg-base)', borderColor: 'var(--accent)', color: 'var(--text-primary)' }}
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Check size={11} /> Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-medium"
              style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              <X size={11} /> Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-start justify-between px-5 py-3 border-b last:border-0 group"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-mono font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{error.error_tag}</p>
        {error.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{error.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(error.id)}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#EF4444')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function Errors() {
  const [errors, setErrors] = useState<PredefinedError[]>([])
  const [loading, setLoading] = useState(true)
  const [activePlatform, setActivePlatform] = useState<Platform>('Algopython')
  const [adding, setAdding] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [createError_, setCreateError] = useState('')

  useEffect(() => {
    getErrors().then(r => setErrors(r.data)).finally(() => setLoading(false))
  }, [])

  const platformErrors = errors.filter(e => e.platform === activePlatform)

  const handleCreate = async () => {
    if (!newTag.trim()) return
    setSaving(true)
    setCreateError('')
    try {
      const res = await createError({ platform: activePlatform, error_tag: newTag.trim(), description: newDesc.trim() })
      setErrors(prev => [...prev, res.data])
      setNewTag('')
      setNewDesc('')
      setAdding(false)
    } catch (e: any) {
      setCreateError(e.response?.data?.detail ?? 'Failed to create error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: number, data: { description: string }) => {
    const res = await updateError(id, data)
    setErrors(prev => prev.map(e => e.id === id ? res.data : e))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this error type? This will affect any contexts that use it.')) return
    await deleteError(id)
    setErrors(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div>
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Error Library
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage predefined error types per platform
        </p>
      </div>

      <div className="flex gap-2 mb-6 animate-fade-up">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => setActivePlatform(p)}
            className="px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-150"
            style={
              activePlatform === p
                ? { background: PLATFORM_COLORS[p], color: PLATFORM_TEXT[p], border: `1px solid ${PLATFORM_TEXT[p]}40` }
                : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {p}
            <span
              className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded"
              style={
                activePlatform === p
                  ? { background: PLATFORM_TEXT[p] + '20', color: PLATFORM_TEXT[p] }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
              }
            >
              {errors.filter(e => e.platform === p).length}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Library size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {activePlatform} Errors
            </span>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all"
            style={{ background: PLATFORM_COLORS[activePlatform], color: PLATFORM_TEXT[activePlatform] }}
          >
            <Plus size={11} /> Add Error
          </button>
        </div>

        {adding && (
          <div className="px-5 py-4 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-2">
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="error_tag"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono border outline-none"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--accent)', color: 'var(--text-primary)' }}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono border outline-none"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              />
              {createError_ && (
                <p className="text-xs font-mono text-red-400">{createError_}</p>
              )}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleCreate}
                  disabled={saving || !newTag.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  <Check size={11} /> Add
                </button>
                <button
                  onClick={() => { setAdding(false); setNewTag(''); setNewDesc(''); setCreateError('') }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-medium"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-3 border-b last:border-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="h-4 w-48 rounded bg-[var(--border)] animate-pulse" />
            </div>
          ))
        ) : platformErrors.length === 0 && !adding ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Library size={24} style={{ color: 'var(--text-muted)' }} className="mb-2" />
            <p className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>No errors for {activePlatform}</p>
          </div>
        ) : (
          platformErrors.map(error => (
            <ErrorRow key={error.id} error={error} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}
