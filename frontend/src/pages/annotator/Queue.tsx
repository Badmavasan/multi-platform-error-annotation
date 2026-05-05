import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { getQueue } from '../../api/client'
import type { QueueItem } from '../../types'

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

export default function Queue() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getQueue().then(r => setItems(r.data)).finally(() => setLoading(false))
  }, [])

  const pending = items.filter(i => !i.is_completed)
  const completed = items.filter(i => i.is_completed)

  return (
    <div>
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Ma file d'attente
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {loading ? '…' : `${pending.length} en attente · ${completed.length} complété${completed.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b last:border-0 flex items-center gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-lg bg-[var(--border)] animate-pulse" />
              <div className="h-4 w-48 rounded bg-[var(--border)] animate-pulse" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-20 animate-fade-up"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <ListChecks size={36} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Aucune tâche pour le moment</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Les contextes assignés apparaîtront ici</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.length > 0 && (
            <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <Clock size={13} style={{ color: '#F59E0B' }} />
                <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  En attente
                </span>
              </div>
              {pending.map((item, i) => (
                <Link
                  key={item.assignment_id}
                  to={`/annotator/queue/${item.assignment_id}`}
                  className="group flex items-center justify-between px-5 py-4 border-b last:border-0 transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                      style={{ background: PLATFORM_COLORS[item.context.platform], color: PLATFORM_TEXT[item.context.platform] }}
                    >
                      {item.context.platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.context.title}
                      </p>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{item.context.platform}</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <CheckCircle size={13} style={{ color: '#10B981' }} />
                <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Complétés
                </span>
              </div>
              {completed.map((item, i) => (
                <Link
                  key={item.assignment_id}
                  to={`/annotator/queue/${item.assignment_id}`}
                  className="group flex items-center justify-between px-5 py-4 border-b last:border-0 transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                      style={{ background: PLATFORM_COLORS[item.context.platform], color: PLATFORM_TEXT[item.context.platform] }}
                    >
                      {item.context.platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.context.title}
                      </p>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{item.context.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-mono" style={{ color: '#10B981' }}>
                      <CheckCircle size={11} /> annoté
                    </span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
