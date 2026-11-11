'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

/**
 * A floating panel anchored to its trigger. The panel is portaled to <body>
 * and positioned with `fixed`, so it is never clipped by scroll containers.
 */
export function Popover({
  trigger,
  children,
  align = 'start',
  width = 'w-56',
  triggerClass = 'inline-flex',
  disabled = false,
  onOpenChange,
}: {
  trigger: (api: { open: boolean; toggle: () => void }) => ReactNode
  children: (api: { close: () => void }) => ReactNode
  align?: 'start' | 'end'
  width?: string
  triggerClass?: string
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({ top: -9999, left: -9999 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const place = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const h = panelRef.current?.offsetHeight ?? 0
    const w = panelRef.current?.offsetWidth ?? 0
    const gap = 6
    let top = r.bottom + gap
    if (top + h > window.innerHeight - 8 && r.top - gap - h > 8) top = r.top - gap - h
    let left = align === 'end' ? r.right - w : r.left
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8))
    setStyle({ top, left })
  }, [align])

  const setOpenState = useCallback(
    (v: boolean) => {
      setOpen(v)
      onOpenChange?.(v)
    },
    [onOpenChange],
  )
  const close = useCallback(() => setOpenState(false), [setOpenState])
  const toggle = useCallback(() => {
    if (disabled) return
    setOpenState(!open)
  }, [disabled, open, setOpenState])

  useLayoutEffect(() => {
    if (!open) return
    place()
    panelRef.current?.querySelector<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])')?.focus()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        triggerRef.current?.querySelector<HTMLElement>('button, [tabindex]')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, close, place])

  return (
    <>
      <div ref={triggerRef} className={triggerClass}>
        {trigger({ open, toggle })}
      </div>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className={cn('popover fixed z-[70] max-h-[min(24rem,80vh)] overflow-y-auto scrollbar-thin', width)}
            style={style}
          >
            {children({ close })}
          </div>,
          document.body,
        )}
    </>
  )
}
