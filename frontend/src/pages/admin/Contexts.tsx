import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, Trash2, Edit2 } from 'lucide-react'
import { getContexts, deleteContext } from '../../api/client'
import type { ContextListItem } from '../../types'

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

export default function Contexts() {
  const [contexts, setContexts] = useState<ContextListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    getContexts().then(r => setContexts(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this context? This cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteContext(id)
      setContexts(prev => prev.filter(c => c.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Contexts
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {loading ? '…' : `${contexts.length} total`}
          </p>
        </div>
        <Link
          to="/admin/contexts/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-150"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff' }}
        >
          <Plus size={14} />
          New Context
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b last:border-0 flex items-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="w-2 h-2 rounded-full bg-[var(--border)]" />
              <div className="h-4 w-48 rounded bg-[var(--border)] animate-pulse" />
            </div>
          ))}
        </div>
      ) : contexts.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 animate-fade-up"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <FileText size={32} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>No contexts yet</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Create your first annotation context</p>
          <Link
            to="/admin/contexts/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff' }}
          >
            <Plus size={13} /> New Context
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <FileText size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              All Contexts
            </span>
          </div>
          {contexts.map((ctx, i) => (
            <div
              key={ctx.id}
              className="flex items-center justify-between px-5 py-3 border-b last:border-0 group"
              style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: PLATFORM_TEXT[ctx.platform] ?? 'var(--accent)' }} />
                <span className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{ctx.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: PLATFORM_COLORS[ctx.platform], color: PLATFORM_TEXT[ctx.platform] }}>
                  {ctx.platform}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ctx.assignment_count} assigned</span>
                <Link
                  to={`/admin/contexts/${ctx.id}/edit`}
                  className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                >
                  <Edit2 size={13} />
                </Link>
                <button
                  onClick={() => handleDelete(ctx.id)}
                  disabled={deleting === ctx.id}
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
