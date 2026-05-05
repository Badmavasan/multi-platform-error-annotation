import { useRef, useState } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  minRows?: number
  maxHeight?: number
}

const LINE_H = 24
const PAD_V = 12

export function CodeEditor({ value, onChange, placeholder, minRows = 10, maxHeight = 480 }: CodeEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [focused, setFocused] = useState(false)

  const lineCount = Math.max(value.split('\n').length, minRows)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const s = ta.selectionStart
      const end = ta.selectionEnd
      const next = value.slice(0, s) + '    ' + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 4
      })
    }
  }

  return (
    <div
      className="rounded-lg overflow-hidden flex border transition-colors"
      style={{
        borderColor: focused ? 'var(--accent)' : 'var(--border)',
        background: 'var(--bg-elevated)',
      }}
    >
      {/* Line numbers */}
      <div
        className="flex-shrink-0 overflow-hidden select-none"
        style={{
          background: 'var(--bg-base)',
          borderRight: '1px solid var(--border)',
          minWidth: 48,
        }}
      >
        <div
          style={{
            transform: `translateY(-${scrollTop}px)`,
            paddingTop: PAD_V,
            paddingBottom: PAD_V,
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="text-right pr-3 pl-2 text-xs font-mono"
              style={{ height: LINE_H, lineHeight: `${LINE_H}px`, color: 'var(--text-muted)' }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="flex-1 text-sm font-mono outline-none resize-none bg-transparent"
        style={{
          padding: `${PAD_V}px 12px`,
          lineHeight: `${LINE_H}px`,
          color: 'var(--text-primary)',
          minHeight: minRows * LINE_H + PAD_V * 2,
          maxHeight,
          overflowY: 'auto',
        }}
      />
    </div>
  )
}
