import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Users, GitBranch, CheckCircle, ArrowRight, Library } from 'lucide-react'
import { getContexts, getAnnotators, getAssignments } from '../../api/client'
import type { ContextListItem, Annotator, Assignment } from '../../types'

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

function StatCard({ label, value, delay }: { label: string; value: number | string; delay: string }) {
  return (
    <div
      className={`rounded-xl p-5 border relative overflow-hidden animate-fade-up stagger-${delay}`}
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs font-display font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10" style={{ background: 'var(--accent)' }} />
    </div>
  )
}

export default function Dashboard() {
  const [contexts, setContexts] = useState<ContextListItem[]>([])
  const [annotators, setAnnotators] = useState<Annotator[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getContexts().then(r => setContexts(r.data)),
      getAnnotators().then(r => setAnnotators(r.data)),
      getAssignments().then(r => setAssignments(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const completed = assignments.filter(a => a.is_completed).length
  const pending = assignments.length - completed

  return (
    <div>
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Error annotation platform · admin panel
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Contexts" value={loading ? '—' : contexts.length} delay="1" />
        <StatCard label="Annotators" value={loading ? '—' : annotators.length} delay="2" />
        <StatCard label="Completed" value={loading ? '—' : completed} delay="3" />
        <StatCard label="Pending" value={loading ? '—' : pending} delay="4" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { to: '/admin/contexts/new', label: 'New Context', sub: 'Create an annotation context', icon: FileText, bg: 'rgba(99,102,241,0.12)', color: 'var(--accent)' },
          { to: '/admin/errors', label: 'Error Library', sub: 'Manage predefined errors', icon: Library, bg: 'rgba(245,158,11,0.12)', color: 'var(--amber)' },
          { to: '/admin/annotators', label: 'Annotators', sub: 'Create & manage annotators', icon: Users, bg: 'rgba(99,102,241,0.12)', color: 'var(--accent)' },
          { to: '/admin/assignments', label: 'Assignments', sub: 'Assign contexts to annotators', icon: GitBranch, bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
        ].map(({ to, label, sub, icon: Icon, bg, color }, i) => (
          <Link
            key={to}
            to={to}
            className={`group rounded-xl p-5 border flex items-center justify-between transition-all duration-150 animate-fade-up stagger-${i + 1}`}
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
              </div>
            </div>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
          </Link>
        ))}
      </div>

      {!loading && contexts.length > 0 && (
        <div className="rounded-xl border overflow-hidden animate-fade-up stagger-5" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <FileText size={13} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Recent Contexts
              </span>
            </div>
            <Link to="/admin/contexts" className="text-xs" style={{ color: 'var(--accent)' }}>View all →</Link>
          </div>
          {contexts.slice(0, 8).map((ctx, i) => (
            <Link
              key={ctx.id}
              to={`/admin/contexts/${ctx.id}/edit`}
              className="flex items-center justify-between px-5 py-3 border-b last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
              style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: PLATFORM_TEXT[ctx.platform] ?? 'var(--accent)' }} />
                <span className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{ctx.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: PLATFORM_COLORS[ctx.platform], color: PLATFORM_TEXT[ctx.platform] }}>
                  {ctx.platform}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ctx.assignment_count} assigned</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
