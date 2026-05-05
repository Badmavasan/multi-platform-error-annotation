import { useEffect, useState } from 'react'
import { Download, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { getAnnotationsExport } from '../../api/client'
import type { ContextExport } from '../../types'

const PLATFORM_TEXT: Record<string, string> = {
  Algopython: '#6366F1',
  Pyrates: '#F59E0B',
  SPY: '#10B981',
}
const PLATFORM_BG: Record<string, string> = {
  Algopython: 'rgba(99,102,241,0.12)',
  Pyrates: 'rgba(245,158,11,0.12)',
  SPY: 'rgba(16,185,129,0.12)',
}

function agreementBadge(values: boolean[]) {
  if (values.length < 2) return null
  const agreed = values.every(v => v === values[0])
  return (
    <span className="text-xs font-mono px-2 py-0.5 rounded"
      style={agreed
        ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
        : { background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
      {agreed ? 'accord' : 'désaccord'}
    </span>
  )
}

export default function AnnotationsView() {
  const [data, setData] = useState<ContextExport[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    getAnnotationsExport().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const toggleExpand = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `annotations-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalAnnotations = data.reduce((s, c) => s + c.annotations.length, 0)

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-fade-up">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-xl bg-[var(--border)] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Annotations
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {data.length} contexte{data.length !== 1 ? 's' : ''} annoté{data.length !== 1 ? 's' : ''} · {totalAnnotations} annotation{totalAnnotations !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={data.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff' }}
        >
          <Download size={14} />
          Exporter JSON
        </button>
      </div>

      {data.length === 0 && (
        <div className="rounded-xl border py-16 text-center"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Aucune annotation soumise pour le moment.
          </p>
        </div>
      )}

      {/* Context cards */}
      {data.map(ctx => {
        const isOpen = expanded.has(ctx.context_id)
        const annotatorCount = ctx.annotations.length

        return (
          <div key={ctx.context_id} className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>

            {/* Context header — click to expand */}
            <button
              onClick={() => toggleExpand(ctx.context_id)}
              className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[var(--bg-elevated)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                  style={{ background: PLATFORM_BG[ctx.platform], color: PLATFORM_TEXT[ctx.platform] }}>
                  {ctx.platform}
                </span>
                <span className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {ctx.context_title}
                </span>
                <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {ctx.context_errors.length} erreur{ctx.context_errors.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
                  {annotatorCount} annotateur{annotatorCount !== 1 ? 's' : ''}
                </span>
                {isOpen ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />}
              </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t" style={{ borderColor: 'var(--border)' }}>

                {/* Per-error agreement summary (only if multiple annotators) */}
                {annotatorCount > 1 && ctx.context_errors.length > 0 && (
                  <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                    <p className="text-xs font-display font-semibold uppercase tracking-widest mb-3"
                      style={{ color: 'var(--text-muted)' }}>
                      Accord par erreur
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {ctx.context_errors.map(err => {
                        const votes = ctx.annotations
                          .flatMap(a => a.error_reviews)
                          .filter(r => r.error_id === err.id)
                          .map(r => r.is_agreed)
                        return (
                          <div key={err.id} className="flex items-center gap-3">
                            <span className="font-mono text-xs font-semibold w-48 truncate"
                              style={{ color: 'var(--text-primary)' }}>
                              {err.error_tag}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {votes.map((v, i) => (
                                <span key={i}
                                  style={{ color: v ? '#10B981' : '#EF4444' }}>
                                  {v ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
                                </span>
                              ))}
                            </div>
                            {agreementBadge(votes)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Per-annotator annotation */}
                <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
                  {ctx.annotations.map(ann => (
                    <div key={ann.assignment_id} className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-mono font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {ann.annotator_name}
                        </span>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          @{ann.annotator_username}
                        </span>
                        <span className="text-xs font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
                          {new Date(ann.submitted_at).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Error reviews */}
                      {ann.error_reviews.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {ann.error_reviews.map(r => (
                            <span key={r.error_id}
                              className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg"
                              style={r.is_agreed
                                ? { background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }
                                : { background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                              {r.is_agreed ? <ThumbsUp size={10} /> : <ThumbsDown size={10} />}
                              {r.error_tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Additional errors */}
                      {ann.has_additional_errors && ann.additional_errors_text && (
                        <div className="flex gap-2 mt-2 text-sm rounded-lg px-3 py-2"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <MessageSquare size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                          <span className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {ann.additional_errors_text}
                          </span>
                        </div>
                      )}
                      {!ann.has_additional_errors && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Aucune erreur supplémentaire signalée.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
