'use client'

import { ChevronsUpDown, Keyboard, LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react'
import Link from 'next/link'
import { Popover } from '@/components/ui/Popover'
import { cn } from '@/lib/cn'
import { initials, useAuthActions, useMe } from '@/lib/queries'
import { setTheme, uiStore, useUi, type Theme } from '@/lib/ui'

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
]

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { data: user } = useMe()
  const auth = useAuthActions()
  const theme = useUi((s) => s.theme)

  async function logout(close: () => void) {
    close()
    await auth.logout()
    // Full page load so no cached data of this user survives the sign-out.
    window.location.replace('/login')
  }

  return (
    <Popover
      width="w-64"
      triggerClass="block"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Account menu"
          onClick={toggle}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
            {user ? initials(user.name) : ''}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                {user ? (
                  <>
                    <span className="block truncate text-[13px] font-medium">{user.name}</span>
                    <span className="block truncate text-xs text-zinc-500">{user.email}</span>
                  </>
                ) : (
                  <>
                    <span className="skeleton mb-1 block h-3 w-24" />
                    <span className="skeleton block h-2.5 w-32" />
                  </>
                )}
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-zinc-400" />
            </>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <div role="menu">
          <div className="px-2.5 pt-1.5 pb-2">
            <p className="truncate text-[13px] font-medium">{user?.name}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <div
            className="mx-1.5 mb-1.5 grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
            role="radiogroup"
            aria-label="Theme"
          >
            {themes.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={theme === t.value}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition',
                  theme === t.value
                    ? 'bg-white text-zinc-900 shadow-soft dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
                )}
                onClick={() => setTheme(t.value)}
              >
                <t.icon className="size-3.5" /> {t.label}
              </button>
            ))}
          </div>
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          <Link href="/settings" className="menu-item" role="menuitem" onClick={close}>
            <Settings className="size-4 text-zinc-400" /> Settings
          </Link>
          <button
            type="button"
            className="menu-item"
            role="menuitem"
            onClick={() => {
              close()
              uiStore.set({ shortcutsOpen: true })
            }}
          >
            <Keyboard className="size-4 text-zinc-400" /> Keyboard shortcuts <span className="kbd ml-auto">?</span>
          </button>
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          <button
            type="button"
            className="menu-item text-red-600 dark:text-red-400"
            role="menuitem"
            onClick={() => logout(close)}
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </Popover>
  )
}
