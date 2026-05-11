import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Code2, BookOpen, Check, ThumbsUp, ThumbsDown, ChevronDown, X, Search } from 'lucide-react'
import { getQueueItem, submitAnnotation } from '../../api/client'
import type { PredefinedError, QueueItem } from '../../types'
import { CodeBlock } from '../../components/CodeBlock'

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

export default function AnnotateContext() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const id = parseInt(assignmentId!)

  const [item, setItem] = useState<QueueItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // error.id → true (oui) | false (non) | undefined (pas encore répondu)
  const [errorReviews, setErrorReviews] = useState<Record<number, boolean>>({})
  // yes/no additional errors
  const [hasAdditional, setHasAdditional] = useState<boolean | null>(null)
  const [selectedAdditionalIds, setSelectedAdditionalIds] = useState<number[]>([])
  const [additionalText, setAdditionalText] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getQueueItem(id).then(r => {
      const qItem = r.data
      setItem(qItem)
      if (qItem.annotation) {
        const ann = qItem.annotation
        const reviews: Record<number, boolean> = {}
        ann.error_reviews.forEach(r => { reviews[r.error.id] = r.is_agreed })
        setErrorReviews(reviews)
        setHasAdditional(ann.has_additional_errors)
        setSelectedAdditionalIds(ann.additional_error_ids ?? [])
        setAdditionalText(ann.additional_errors_text ?? '')
      }
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async () => {
    if (!item) return
    const ctx = item.context

    const unanswered = ctx.errors.filter(e => errorReviews[e.id] === undefined)
    if (unanswered.length > 0) {
      setSubmitError(`Veuillez répondre à toutes les erreurs (${unanswered.length} sans réponse).`)
      return
    }

    if (hasAdditional === null) {
      setSubmitError('Veuillez répondre à la question sur les erreurs supplémentaires.')
      return
    }

    if (hasAdditional && selectedAdditionalIds.length === 0 && !additionalText.trim()) {
      setSubmitError('Veuillez sélectionner au moins une erreur ou décrire les erreurs supplémentaires.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      await submitAnnotation(id, {
        error_reviews: ctx.errors.map(e => ({ error_id: e.id, is_agreed: errorReviews[e.id] })),
        has_additional_errors: hasAdditional,
        additional_error_ids: hasAdditional ? selectedAdditionalIds : [],
        additional_errors_text: hasAdditional && additionalText.trim() ? additionalText.trim() : null,
      })
      navigate('/annotator')
    } catch (e: any) {
      setSubmitError(e.response?.data?.detail ?? "Échec de la soumission.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !item) {
    return (
      <div className="animate-fade-up flex flex-col gap-4">
        <div className="h-8 w-48 rounded bg-[var(--border)] animate-pulse" />
        <div className="h-64 rounded-xl bg-[var(--border)] animate-pulse" />
        <div className="h-40 rounded-xl bg-[var(--border)] animate-pulse" />
      </div>
    )
  }

  const ctx = item.context
  const platformColor = PLATFORM_TEXT[ctx.platform]
  const platformBg = PLATFORM_COLORS[ctx.platform]
  const isCompleted = item.is_completed

  // Errors available for additional selection: all platform errors excluding those already in the context
  const contextErrorIds = new Set(ctx.errors.map(e => e.id))
  const availableErrors: PredefinedError[] = (item.platform_errors ?? []).filter(e => !contextErrorIds.has(e.id))
  const filteredErrors = availableErrors.filter(e =>
    e.error_tag.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase())
  )
  const selectedErrors = availableErrors.filter(e => selectedAdditionalIds.includes(e.id))

  const toggleError = (id: number) => {
    setSelectedAdditionalIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-up">
        <button
          onClick={() => navigate('/annotator')}
          className="p-2 rounded-lg transition-all flex-shrink-0"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="font-display text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {ctx.title}
            </h1>
            {isCompleted && (
              <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                <CheckCircle size={10} /> annoté
              </span>
            )}
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: platformBg, color: platformColor }}>
            {ctx.platform}
          </span>
        </div>
      </div>

      {/* Platform description banner */}
      {ctx.platform_description && (
        <div className="flex gap-3 rounded-xl px-4 py-3 animate-fade-up stagger-1"
          style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <span className="mt-0.5 flex-shrink-0 text-base" style={{ color: '#F59E0B' }}>⚠</span>
          <div className="text-sm leading-relaxed platform-desc" style={{ color: '#F59E0B' }}
            dangerouslySetInnerHTML={{ __html: ctx.platform_description }} />
        </div>
      )}

      {/* Image */}
      {ctx.image_url && (
        <div className="rounded-xl border overflow-hidden animate-fade-up stagger-1"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-2"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-display font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}>Contexte visuel</span>
          </div>
          <div className="p-4">
            <img src={ctx.image_url} alt="Contexte"
              className="w-full rounded-lg object-contain"
              style={{ maxHeight: 480 }} />
          </div>
        </div>
      )}

      {/* Code blocks */}
      <div className="grid grid-cols-2 gap-4 animate-fade-up stagger-2">
        <CodeBlock code={ctx.student_submission} label="Soumission de l'étudiant"
          icon={<Code2 size={13} style={{ color: 'var(--text-muted)' }} />} maxHeight={400} />
        <CodeBlock code={ctx.correct_answer} label="Solution correcte"
          icon={<BookOpen size={13} style={{ color: 'var(--text-muted)' }} />} maxHeight={400} />
      </div>

      {/* Annotation panel */}
      <div className="rounded-xl border animate-fade-up stagger-3"
        style={{ background: 'var(--bg-surface)', borderColor: isCompleted ? 'rgba(16,185,129,0.3)' : 'var(--border)' }}>

        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            Informations supplémentaires
          </h2>
          {ctx.description && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {ctx.description}
            </p>
          )}
        </div>

        <div className="px-6 py-6 flex flex-col gap-10">

          {/* Section 1 — per-error review */}
          {ctx.errors.length > 0 ? (
            <div>
              <p className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                Erreurs identifiées dans ce contexte <span style={{ color: '#EF4444' }}>*</span>
              </p>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Pour chaque erreur ci-dessous, indiquez si elle est présente dans la soumission de l'étudiant
                par rapport à la solution correcte.
              </p>
              <div className="flex flex-col gap-3">
                {ctx.errors.map(err => {
                  const answer = errorReviews[err.id]
                  return (
                    <div key={err.id} className="rounded-lg border p-4 transition-colors"
                      style={{
                        borderColor: answer === true ? 'rgba(16,185,129,0.4)' : answer === false ? 'rgba(239,68,68,0.4)' : 'var(--border)',
                        background: answer === true ? 'rgba(16,185,129,0.05)' : answer === false ? 'rgba(239,68,68,0.05)' : 'var(--bg-elevated)',
                      }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-bold text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>
                            {err.error_tag}
                          </p>
                          {err.description && (
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}
                              dangerouslySetInnerHTML={{ __html: err.description }} />
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {isCompleted ? (
                            answer !== undefined && (
                              <span className="flex items-center gap-1.5 text-sm font-display font-semibold px-3 py-1.5 rounded-lg"
                                style={answer
                                  ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                                  : { background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                                {answer ? <><ThumbsUp size={13} /> Oui</> : <><ThumbsDown size={13} /> Non</>}
                              </span>
                            )
                          ) : (
                            <>
                              <button
                                onClick={() => setErrorReviews(p => ({ ...p, [err.id]: true }))}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-semibold transition-all"
                                style={answer === true
                                  ? { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)' }
                                  : { background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                <ThumbsUp size={13} /> Oui
                              </button>
                              <button
                                onClick={() => setErrorReviews(p => ({ ...p, [err.id]: false }))}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-semibold transition-all"
                                style={answer === false
                                  ? { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)' }
                                  : { background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                <ThumbsDown size={13} /> Non
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aucune erreur n'a été associée à ce contexte.
            </p>
          )}

          {/* Section 2 — additional errors yes/no */}
          <div>
            <p className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              Erreurs supplémentaires <span style={{ color: '#EF4444' }}>*</span>
            </p>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Avez-vous identifié des erreurs dans la soumission de l'étudiant qui ne figurent pas dans la liste ci-dessus ?
            </p>

            <div className="flex gap-3 mb-4">
              {isCompleted ? (
                <span className="flex items-center gap-1.5 text-sm font-display font-semibold px-4 py-2 rounded-lg"
                  style={hasAdditional
                    ? { background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }
                    : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <Check size={13} /> {hasAdditional ? 'Oui' : 'Non'}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => setHasAdditional(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all"
                    style={hasAdditional === true
                      ? { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)' }
                      : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    <ThumbsUp size={13} /> Oui
                  </button>
                  <button
                    onClick={() => { setHasAdditional(false); setSelectedAdditionalIds([]); setAdditionalText('') }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all"
                    style={hasAdditional === false
                      ? { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)' }
                      : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    <ThumbsDown size={13} /> Non
                  </button>
                </>
              )}
            </div>

            {hasAdditional && (
              <div className="flex flex-col gap-4">

                {/* Multi-select dropdown */}
                <div>
                  <label className="block text-sm font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Sélectionner des erreurs existantes
                  </label>

                  {isCompleted ? (
                    selectedErrors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedErrors.map(e => (
                          <span key={e.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)' }}>
                            {e.error_tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune erreur sélectionnée</p>
                    )
                  ) : (
                    <div className="relative" ref={dropdownRef}>
                      {/* Selected chips */}
                      {selectedErrors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {selectedErrors.map(e => (
                            <span key={e.id} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold"
                              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)' }}>
                              {e.error_tag}
                              <button onClick={() => toggleError(e.id)} className="ml-0.5 hover:opacity-70">
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Trigger */}
                      <button
                        onClick={() => setDropdownOpen(o => !o)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors"
                        style={{
                          background: 'var(--bg-elevated)',
                          border: `1px solid ${dropdownOpen ? 'var(--accent)' : 'var(--border)'}`,
                          color: 'var(--text-secondary)',
                        }}>
                        <span>{selectedErrors.length > 0 ? `${selectedErrors.length} sélectionnée(s)` : 'Choisir des erreurs…'}</span>
                        <ChevronDown size={14} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                      </button>

                      {/* Dropdown panel */}
                      {dropdownOpen && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border overflow-hidden"
                          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                          {/* Search */}
                          <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <input
                              autoFocus
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                              placeholder="Rechercher…"
                              className="flex-1 text-sm outline-none bg-transparent"
                              style={{ color: 'var(--text-primary)' }}
                            />
                            {search && (
                              <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          {/* Options */}
                          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                            {filteredErrors.length === 0 ? (
                              <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>Aucun résultat</p>
                            ) : filteredErrors.map(e => {
                              const selected = selectedAdditionalIds.includes(e.id)
                              return (
                                <button key={e.id} onClick={() => toggleError(e.id)}
                                  className="w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors"
                                  style={{
                                    background: selected ? 'rgba(99,102,241,0.08)' : 'transparent',
                                    borderBottom: '1px solid var(--border)',
                                  }}
                                  onMouseEnter={ev => { if (!selected) ev.currentTarget.style.background = 'var(--bg-surface)' }}
                                  onMouseLeave={ev => { ev.currentTarget.style.background = selected ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                                  <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                                    style={{
                                      background: selected ? '#6366F1' : 'transparent',
                                      border: `1.5px solid ${selected ? '#6366F1' : 'var(--border-hover)'}`,
                                    }}>
                                    {selected && <Check size={10} color="#fff" strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-mono font-bold" style={{ color: selected ? '#6366F1' : 'var(--text-primary)' }}>
                                      {e.error_tag}
                                    </p>
                                    {e.description && (
                                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}
                                        dangerouslySetInnerHTML={{ __html: e.description }} />
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Optional free text */}
                <div>
                  <label className="block text-sm font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Remarques libres <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>(optionnel)</span>
                  </label>
                  {isCompleted ? (
                    additionalText ? (
                      <div className="rounded-lg border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                        {additionalText}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>—</p>
                    )
                  ) : (
                    <textarea
                      value={additionalText}
                      onChange={e => setAdditionalText(e.target.value)}
                      rows={3}
                      placeholder="Remarques supplémentaires…"
                      className="w-full rounded-lg border px-4 py-3 text-sm leading-relaxed resize-y outline-none transition-colors"
                      style={{
                        background: 'var(--bg-elevated)',
                        borderColor: additionalText.trim() ? 'var(--border-hover)' : 'var(--border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.currentTarget.style.borderColor = additionalText.trim() ? 'var(--border-hover)' : 'var(--border)')}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {submitError && (
            <div className="px-4 py-3 rounded-lg text-sm font-mono text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {submitError}
            </div>
          )}

          {/* Submit / completed */}
          {!isCompleted ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="self-start flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-display font-semibold disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff' }}>
              <Check size={14} />
              {submitting ? 'Envoi en cours…' : "Soumettre l'annotation"}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm font-display font-medium" style={{ color: '#10B981' }}>
              <CheckCircle size={16} />
              Ce contexte a déjà été annoté.
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
