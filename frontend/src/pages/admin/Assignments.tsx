import { useEffect, useState } from 'react'
import { GitBranch, Plus, Trash2, X, Check, CheckCircle } from 'lucide-react'
import { getAssignments, createAssignment, deleteAssignment, getContexts, getAnnotators } from '../../api/client'
import type { Assignment, ContextListItem, Annotator } from '../../types'

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

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [contexts, setContexts] = useState<ContextListItem[]>([])
  const [annotators, setAnnotators] = useState<Annotator[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedContext, setSelectedContext] = useState('')
  const [selectedAnnotator, setSelectedAnnotator] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      getAssignments().then(r => setAssignments(r.data)),
      getContexts().then(r => setContexts(r.data)),
      getAnnotators().then(r => setAnnotators(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!selectedContext || !selectedAnnotator) {
      setError('Select both a context and an annotator')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await createAssignment(parseInt(selectedContext), parseInt(selectedAnnotator))
      const refreshed = await getAssignments()
      setAssignments(refreshed.data)
      setSelectedContext('')
      setSelectedAnnotator('')
      setAdding(false)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to create assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this assignment?')) return
    setDeleting(id)
    try {
      await deleteAssignment(id)
      setAssignments(prev => prev.filter(a => a.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const selectStyle = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Assignments
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {loading ? '…' : `${assignments.length} total · ${assignments.filter(a => a.is_completed).length} completed`}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-150"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff' }}
        >
          <Plus size={14} />
          New Assignment
        </button>
      </div>

      {adding && (
        <div
          className="rounded-xl border p-5 mb-6 animate-fade-up"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent)' }}
        >
          <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Assign Context to Annotator
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-display font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Context
              </label>
              <select
                value={selectedContext}
                onChange={e => setSelectedContext(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={selectStyle}
              >
                <option value="">Select context…</option>
                {contexts.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.platform})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-display font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Annotator
              </label>
              <select
                value={selectedAnnotator}
                onChange={e => setSelectedAnnotator(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={selectStyle}
              >
                <option value="">Select annotator…</option>
                {annotators.map(a => (
                  <option key={a.id} value={a.id}>{a.name} (@{a.username})</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-400 font-mono mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Check size={13} /> Assign
            </button>
            <button
              onClick={() => { setAdding(false); setError(''); setSelectedContext(''); setSelectedAnnotator('') }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b last:border-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="h-4 w-56 rounded bg-[var(--border)] animate-pulse" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 && !adding ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 animate-fade-up"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <GitBranch size={32} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>No assignments yet</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Assign a context to an annotator to begin</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <GitBranch size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              All Assignments
            </span>
          </div>
          {assignments.map((a, i) => (
            <div
              key={a.id}
              className="flex items-center justify-between px-5 py-3 border-b last:border-0 group"
              style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {a.context?.title ?? `Context #${a.context?.id}`}
                  </p>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    → {a.annotator?.name ?? 'Unknown'} (@{a.annotator?.username})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {a.context?.platform && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: PLATFORM_COLORS[a.context.platform], color: PLATFORM_TEXT[a.context.platform] }}>
                    {a.context.platform}
                  </span>
                )}
                {a.is_completed ? (
                  <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                    <CheckCircle size={10} /> done
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                    pending
                  </span>
                )}
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deleting === a.id}
                  className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#EF4444')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
