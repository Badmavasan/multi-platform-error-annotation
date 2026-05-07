import { useEffect, useState } from 'react'
import { GitBranch, Plus, Trash2, X, Check, CheckCircle, Search } from 'lucide-react'
import { getAssignments, createBulkAssignments, deleteAssignment, getContexts, getAnnotators } from '../../api/client'
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

  const [selectedContextIds, setSelectedContextIds] = useState<number[]>([])
  const [selectedAnnotatorIds, setSelectedAnnotatorIds] = useState<number[]>([])
  const [contextSearch, setContextSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      getAssignments().then(r => setAssignments(r.data)),
      getContexts().then(r => setContexts(r.data)),
      getAnnotators().then(r => setAnnotators(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const filteredContexts = contexts.filter(c =>
    c.title.toLowerCase().includes(contextSearch.toLowerCase()) ||
    c.platform.toLowerCase().includes(contextSearch.toLowerCase())
  )

  const toggleContext = (id: number) =>
    setSelectedContextIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleAnnotator = (id: number) =>
    setSelectedAnnotatorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleAllContexts = () => {
    const visibleIds = filteredContexts.map(c => c.id)
    const allSelected = visibleIds.every(id => selectedContextIds.includes(id))
    if (allSelected) {
      setSelectedContextIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedContextIds(prev => [...new Set([...prev, ...visibleIds])])
    }
  }

  const toggleAllAnnotators = () => {
    const allIds = annotators.map(a => a.id)
    const allSelected = allIds.every(id => selectedAnnotatorIds.includes(id))
    setSelectedAnnotatorIds(allSelected ? [] : allIds)
  }

  const handleCreate = async () => {
    if (selectedContextIds.length === 0 || selectedAnnotatorIds.length === 0) {
      setError('Sélectionnez au moins un contexte et un annotateur.')
      return
    }
    setSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await createBulkAssignments(selectedContextIds, selectedAnnotatorIds)
      const { created, skipped } = res.data
      const refreshed = await getAssignments()
      setAssignments(refreshed.data)
      setSelectedContextIds([])
      setSelectedAnnotatorIds([])
      setContextSearch('')
      setAdding(false)
      setSuccessMsg(`${created} assignment(s) créé(s)${skipped > 0 ? `, ${skipped} déjà existant(s) ignoré(s)` : ''}.`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet assignment ?')) return
    setDeleting(id)
    try {
      await deleteAssignment(id)
      setAssignments(prev => prev.filter(a => a.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const totalToCreate = selectedContextIds.length * selectedAnnotatorIds.length
  const visibleIds = filteredContexts.map(c => c.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedContextIds.includes(id))
  const allAnnotatorsSelected = annotators.length > 0 && annotators.every(a => selectedAnnotatorIds.includes(a.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Assignments
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {loading ? '…' : `${assignments.length} total · ${assignments.filter(a => a.is_completed).length} complétés`}
          </p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(''); setSuccessMsg('') }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-150"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff' }}
        >
          <Plus size={14} />
          Nouvel Assignment
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm font-mono animate-fade-up"
          style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}>
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}

      {adding && (
        <div className="rounded-xl border p-5 mb-6 animate-fade-up" style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Assigner des contextes à des annotateurs
            </h3>
            {totalToCreate > 0 && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)' }}>
                {selectedContextIds.length} contexte(s) × {selectedAnnotatorIds.length} annotateur(s) = {totalToCreate} assignment(s)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Contexts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-display font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Contextes ({selectedContextIds.length} sélectionné(s))
                </label>
                <button onClick={toggleAllContexts} className="text-xs font-display font-medium"
                  style={{ color: 'var(--accent)' }}>
                  {allVisibleSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  value={contextSearch}
                  onChange={e => setContextSearch(e.target.value)}
                  placeholder="Rechercher un contexte…"
                  className="flex-1 text-xs outline-none bg-transparent"
                  style={{ color: 'var(--text-primary)' }}
                />
                {contextSearch && (
                  <button onClick={() => setContextSearch('')} style={{ color: 'var(--text-muted)' }}>
                    <X size={11} />
                  </button>
                )}
              </div>

              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', maxHeight: 280, overflowY: 'auto' }}>
                {filteredContexts.length === 0 ? (
                  <p className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>Aucun résultat</p>
                ) : filteredContexts.map((c, i) => {
                  const selected = selectedContextIds.includes(c.id)
                  return (
                    <button key={c.id} onClick={() => toggleContext(c.id)}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors"
                      style={{
                        background: selected ? 'rgba(99,102,241,0.08)' : i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                        borderBottom: '1px solid var(--border)',
                      }}>
                      <div className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                        style={{
                          background: selected ? '#6366F1' : 'transparent',
                          border: `1.5px solid ${selected ? '#6366F1' : 'var(--border-hover)'}`,
                        }}>
                        {selected && <Check size={10} color="#fff" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {c.title}
                        </p>
                      </div>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: PLATFORM_COLORS[c.platform], color: PLATFORM_TEXT[c.platform] }}>
                        {c.platform}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Annotators */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-display font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Annotateurs ({selectedAnnotatorIds.length} sélectionné(s))
                </label>
                <button onClick={toggleAllAnnotators} className="text-xs font-display font-medium"
                  style={{ color: 'var(--accent)' }}>
                  {allAnnotatorsSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', maxHeight: 316, overflowY: 'auto' }}>
                {annotators.length === 0 ? (
                  <p className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>Aucun annotateur</p>
                ) : annotators.map((a, i) => {
                  const selected = selectedAnnotatorIds.includes(a.id)
                  return (
                    <button key={a.id} onClick={() => toggleAnnotator(a.id)}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors"
                      style={{
                        background: selected ? 'rgba(99,102,241,0.08)' : i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                        borderBottom: '1px solid var(--border)',
                      }}>
                      <div className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                        style={{
                          background: selected ? '#6366F1' : 'transparent',
                          border: `1.5px solid ${selected ? '#6366F1' : 'var(--border-hover)'}`,
                        }}>
                        {selected && <Check size={10} color="#fff" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-medium" style={{ color: 'var(--text-primary)' }}>
                          {a.name}
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>@{a.username}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 font-mono mb-3">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || totalToCreate === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-semibold disabled:opacity-40 transition-all"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              <Check size={13} />
              {saving ? 'Création…' : `Assigner${totalToCreate > 0 ? ` (${totalToCreate})` : ''}`}
            </button>
            <button
              onClick={() => { setAdding(false); setError(''); setSelectedContextIds([]); setSelectedAnnotatorIds([]); setContextSearch('') }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              <X size={13} /> Annuler
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
        <div className="rounded-xl border flex flex-col items-center justify-center py-16 animate-fade-up"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <GitBranch size={32} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Aucun assignment</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Assignez des contextes à des annotateurs pour commencer</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <GitBranch size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Tous les Assignments
            </span>
          </div>
          {assignments.map((a, i) => (
            <div key={a.id}
              className="flex items-center justify-between px-5 py-3 border-b last:border-0 group"
              style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
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
                  <span className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: PLATFORM_COLORS[a.context.platform], color: PLATFORM_TEXT[a.context.platform] }}>
                    {a.context.platform}
                  </span>
                )}
                {a.is_completed ? (
                  <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                    <CheckCircle size={10} /> done
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
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
