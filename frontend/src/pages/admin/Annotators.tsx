import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, X, Check } from 'lucide-react'
import { getAnnotators, createAnnotator, deleteAnnotator } from '../../api/client'
import type { Annotator } from '../../types'

export default function Annotators() {
  const [annotators, setAnnotators] = useState<Annotator[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ username: '', name: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    getAnnotators().then(r => setAnnotators(r.data)).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.username.trim() || !form.name.trim() || !form.password.trim()) {
      setError('Username, name, and password are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await createAnnotator({
        username: form.username.trim(),
        name: form.name.trim(),
        password: form.password,
      })
      setAnnotators(prev => [...prev, res.data])
      setForm({ username: '', name: '', password: '' })
      setAdding(false)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to create annotator')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this annotator? Their assignments will also be deleted.')) return
    setDeleting(id)
    try {
      await deleteAnnotator(id)
      setAnnotators(prev => prev.filter(a => a.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Annotators
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {loading ? '…' : `${annotators.length} registered`}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-150"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff' }}
        >
          <Plus size={14} />
          New Annotator
        </button>
      </div>

      {adding && (
        <div
          className="rounded-xl border p-5 mb-6 animate-fade-up"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent)' }}
        >
          <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            New Annotator
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { label: 'Username', key: 'username', type: 'text', placeholder: 'john_doe' },
              { label: 'Name', key: 'name', type: 'text', placeholder: 'John Doe' },
{ label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-display font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono border outline-none"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-red-400 font-mono mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Check size={13} /> Create
            </button>
            <button
              onClick={() => { setAdding(false); setError(''); setForm({ username: '', name: '', email: '', password: '' }) }}
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
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b last:border-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="h-4 w-40 rounded bg-[var(--border)] animate-pulse" />
            </div>
          ))}
        </div>
      ) : annotators.length === 0 && !adding ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 animate-fade-up"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <Users size={32} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>No annotators yet</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Add your first annotator to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <Users size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Registered Annotators
            </span>
          </div>
          {annotators.map((a, i) => (
            <div
              key={a.id}
              className="flex items-center justify-between px-5 py-3 border-b last:border-0 group"
              style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold"
                  style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
                >
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.name}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>@{a.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: a.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: a.is_active ? '#10B981' : '#EF4444' }}
                >
                  {a.is_active ? 'active' : 'inactive'}
                </span>
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
