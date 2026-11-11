'use client'

import { createStore } from './store'
import type { TaskInput } from './types'

export type Theme = 'system' | 'light' | 'dark'
export const THEME_KEY = 'towork.theme'
const SIDEBAR_KEY = 'towork.sidebar'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  action?: { label: string; handler: () => void }
}

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger: boolean
}

interface UiState {
  theme: Theme
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  paletteOpen: boolean
  shortcutsOpen: boolean
  quickAddOpen: boolean
  /** Defaults for the global quick-add dialog (e.g. a due date from the calendar). */
  quickAddDefaults: Partial<TaskInput>
  /** Id of the task open in the detail drawer. */
  openTaskId: number | null
  toasts: Toast[]
  confirm: ConfirmState
}

function read(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

export const uiStore = createStore<UiState>({
  theme: 'system',
  sidebarCollapsed: false,
  mobileNavOpen: false,
  paletteOpen: false,
  shortcutsOpen: false,
  quickAddOpen: false,
  quickAddDefaults: {},
  openTaskId: null,
  toasts: [],
  confirm: { open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false },
})

export const useUi = uiStore.useStore

/** Read persisted preferences (called once on the client). */
export function hydrateUi() {
  uiStore.set({
    theme: read(THEME_KEY, 'system') as Theme,
    sidebarCollapsed: read(SIDEBAR_KEY, '0') === '1',
  })
  applyTheme()
}

function prefersDark() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

export function applyTheme() {
  if (typeof document === 'undefined') return
  const { theme } = uiStore.get()
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark()))
}

export function setTheme(theme: Theme) {
  write(THEME_KEY, theme)
  uiStore.set({ theme })
  applyTheme()
}

export function cycleTheme() {
  const order: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
  setTheme(order[uiStore.get().theme] ?? 'system')
}

export function setSidebarCollapsed(collapsed: boolean) {
  write(SIDEBAR_KEY, collapsed ? '1' : '0')
  uiStore.set({ sidebarCollapsed: collapsed })
}

let toastId = 0

export function toast(
  message: string,
  opts: { type?: Toast['type']; action?: Toast['action']; timeout?: number } = {},
): number {
  const id = ++toastId
  uiStore.set((s) => ({ toasts: [...s.toasts, { id, message, type: opts.type ?? 'success', action: opts.action }] }))
  setTimeout(() => dismissToast(id), opts.timeout ?? (opts.action ? 6000 : 3500))
  return id
}

export function dismissToast(id: number) {
  uiStore.set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}

export const openTask = (id: number) => uiStore.set({ openTaskId: id })
export const closeTask = () => uiStore.set({ openTaskId: null })

export function openQuickAdd(defaults: Partial<TaskInput> = {}) {
  uiStore.set({ quickAddOpen: true, quickAddDefaults: defaults })
}

let confirmResolver: ((v: boolean) => void) | null = null

/** Promise-based confirm dialog: `if (await confirm({ title })) { ... }` */
export function confirm(opts: { title: string; message?: string; confirmLabel?: string; danger?: boolean }) {
  uiStore.set({
    confirm: {
      open: true,
      title: opts.title,
      message: opts.message ?? '',
      confirmLabel: opts.confirmLabel ?? 'Confirm',
      danger: !!opts.danger,
    },
  })
  return new Promise<boolean>((resolve) => (confirmResolver = resolve))
}

export function resolveConfirm(value: boolean) {
  uiStore.set((s) => ({ confirm: { ...s.confirm, open: false } }))
  confirmResolver?.(value)
  confirmResolver = null
}

