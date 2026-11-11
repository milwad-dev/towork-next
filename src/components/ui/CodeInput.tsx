'use client'

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

/** Six separate digit boxes that behave like one input (paste, arrows, backspace). */
export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  invalid = false,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  length?: number
  invalid?: boolean
  disabled?: boolean
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const focus = (i: number) => requestAnimationFrame(() => boxes.current[Math.max(0, Math.min(i, length - 1))]?.focus())

  function commit(next: string[]) {
    const joined = next.join('')
    onChange(joined)
    if (joined.length === length && /^\d+$/.test(joined)) onComplete?.(joined)
  }

  function fill(start: number, raw: string) {
    const chars = raw.replace(/\D/g, '').split('')
    const next = [...digits]
    for (let k = 0; k < chars.length && start + k < length; k++) next[start + k] = chars[k]
    commit(next)
    focus(Math.min(start + chars.length, length - 1))
  }

  function onInput(i: number, raw: string) {
    const v = raw.replace(/\D/g, '')
    if (v.length > 1) return fill(i, v) // typed fast or autofilled into one box
    const next = [...digits]
    next[i] = v
    commit(next)
    if (v) focus(i + 1)
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits]
      next[i - 1] = ''
      commit(next)
      focus(i - 1)
      e.preventDefault()
    } else if (e.key === 'ArrowLeft') focus(i - 1)
    else if (e.key === 'ArrowRight') focus(i + 1)
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el
          }}
          value={d}
          className="input h-12 w-full max-w-12 px-0 text-center text-lg font-semibold tabular-nums"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid}
          disabled={disabled}
          autoFocus={i === 0}
          onChange={(e) => onInput(i, e.target.value)}
          onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault()
            fill(i, e.clipboardData.getData('text'))
          }}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}
