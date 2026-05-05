import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  label: string
  icon?: React.ReactNode
  maxHeight?: number
}

const LINE_H = 20

export function CodeBlock({ code, label, icon, maxHeight = 320 }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const lines = code.split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      {/* Header */}
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span
            className="text-xs font-display font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            {label}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display font-medium transition-colors"
          style={{
            color: copied ? '#10B981' : 'var(--text-muted)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code body */}
      <div
        className="flex overflow-auto"
        style={{ background: 'var(--bg-elevated)', maxHeight }}
      >
        {/* Line numbers */}
        <div
          className="flex-shrink-0 select-none py-3 text-right"
          style={{
            background: 'var(--bg-base)',
            borderRight: '1px solid var(--border)',
            minWidth: 44,
            paddingLeft: 8,
            paddingRight: 10,
          }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              className="text-xs font-mono"
              style={{ height: LINE_H, lineHeight: `${LINE_H}px`, color: 'var(--text-muted)' }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <pre
          className="flex-1 text-xs font-mono px-4 py-3 m-0"
          style={{
            color: 'var(--text-primary)',
            lineHeight: `${LINE_H}px`,
            whiteSpace: 'pre',
            overflowX: 'visible',
          }}
        >
          {code}
        </pre>
      </div>
    </div>
  )
}
