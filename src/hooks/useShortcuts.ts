'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { openQuickAdd, setSidebarCollapsed, uiStore } from '@/lib/ui'

const GO: Record<string, string> = { t: '/today', u: '/upcoming', a: '/tasks', b: '/board', c: '/calendar', d: '/dashboard', s: '/settings' }

export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el?.tagName) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

/** Global keyboard shortcuts for the app shell. */
export function useShortcuts() {
  const router = useRouter()

  useEffect(() => {
    let gPressedAt = 0
    const anyModalOpen = () => {
      const s = uiStore.get()
      return s.paletteOpen || s.quickAddOpen || s.shortcutsOpen || !!document.querySelector('[aria-modal="true"]')
    }

    function onKey(e: KeyboardEvent) {
      const ui = uiStore.get()
      if (e.key === 'Escape' && ui.mobileNavOpen) {
        uiStore.set({ mobileNavOpen: false })
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        uiStore.set({ paletteOpen: !ui.paletteOpen })
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || anyModalOpen()) return

      const key = e.key
      if (gPressedAt && Date.now() - gPressedAt < 1000 && GO[key.toLowerCase()]) {
        e.preventDefault()
        gPressedAt = 0
        router.push(GO[key.toLowerCase()])
        return
      }
      gPressedAt = 0

      if (key === 'g') gPressedAt = Date.now()
      else if (key === 'n' || key === 'N') {
        e.preventDefault()
        openQuickAdd()
      } else if (key === '/') {
        e.preventDefault()
        uiStore.set({ paletteOpen: true })
      } else if (key === '?') {
        e.preventDefault()
        uiStore.set({ shortcutsOpen: true })
      } else if (key === '[') {
        setSidebarCollapsed(!ui.sidebarCollapsed)
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [router])
}

export function useIsMac() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
}
