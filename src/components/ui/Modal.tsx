'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'max-w-md',
  bare = false,
  position = 'center',
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: string
  /** Hide the header (for custom layouts like the command palette). */
  bare?: boolean
  position?: 'center' | 'top'
  footer?: ReactNode
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
      }
      if (e.key === 'Tab' && panel.current) {
        const els = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
        if (!els.length) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => {
      const auto = panel.current?.querySelector<HTMLElement>(
        '[data-autofocus], input, textarea, button:not([data-close])',
      )
      auto?.focus()
    })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[60] flex animate-fade-in justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px] dark:bg-black/60',
        position === 'top' ? 'items-start pt-[12vh]' : 'items-center',
      )}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'w-full animate-slide-up overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-pop dark:border-zinc-800 dark:bg-zinc-900',
          size,
        )}
      >
        {bare ? (
          children
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 px-5 pt-5">
              <div>
                <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                {description && <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{description}</p>}
              </div>
              <button type="button" className="btn-icon -mt-1 -mr-1" aria-label="Close" data-close onClick={onClose}>
                <X className="size-4" />
              </button>
            </div>
            <div className="px-5 pt-4 pb-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                {footer}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
