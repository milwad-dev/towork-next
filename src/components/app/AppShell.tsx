'use client'

import { CalendarDays, CalendarRange, Kanban, MailWarning, Menu, Plus, Search, Star } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { Logo } from '@/components/ui/Logo'
import { useShortcuts } from '@/hooks/useShortcuts'
import { cn } from '@/lib/cn'
import { useMe } from '@/lib/queries'
import { closeTask, openQuickAdd, uiStore, useUi } from '@/lib/ui'
import { CommandPalette } from './CommandPalette'
import { QuickAddDialog } from './QuickAddDialog'
import { ShortcutsHelp } from './ShortcutsHelp'
import { Sidebar } from './Sidebar'

const bottomNav = [
  { href: '/today', label: 'Today', icon: Star },
  { href: '/upcoming', label: 'Upcoming', icon: CalendarRange },
  { href: '/board', label: 'Board', icon: Kanban },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
]

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUi((s) => s.sidebarCollapsed)
  const mobileNavOpen = useUi((s) => s.mobileNavOpen)
  const pathname = usePathname()
  const { data: user } = useMe()

  useShortcuts()

  // Close the mobile menu and the task drawer when navigating.
  useEffect(() => {
    uiStore.set({ mobileNavOpen: false })
    closeTask()
  }, [pathname])

  const navLink = (item: (typeof bottomNav)[number]) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
        pathname === item.href ? 'text-accent-600 dark:text-accent-400' : 'text-zinc-500',
      )}
    >
      <item.icon className="size-5" /> {item.label}
    </Link>
  )

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 border-r border-zinc-200/70 bg-zinc-50/80 transition-[width] duration-300 ease-out md:block dark:border-zinc-800/70 dark:bg-zinc-900/40',
          collapsed ? 'w-[60px]' : 'w-64',
        )}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-40 animate-fade-in bg-zinc-950/40 md:hidden"
            onClick={() => uiStore.set({ mobileNavOpen: false })}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] animate-sheet-in bg-zinc-50 shadow-pop md:hidden dark:bg-zinc-900">
            <Sidebar mobile onNavigate={() => uiStore.set({ mobileNavOpen: false })} />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-zinc-200/70 bg-white/80 px-3 backdrop-blur-lg md:hidden dark:border-zinc-800/70 dark:bg-zinc-950/80">
          <button
            type="button"
            className="btn-icon"
            aria-label="Open menu"
            onClick={() => uiStore.set({ mobileNavOpen: true })}
          >
            <Menu className="size-5" />
          </button>
          <Link href="/today" className="rounded-lg">
            <Logo size="size-6" />
          </Link>
          <button
            type="button"
            className="btn-icon ml-auto"
            aria-label="Search"
            onClick={() => uiStore.set({ paletteOpen: true })}
          >
            <Search className="size-5" />
          </button>
        </header>

        {user && !user.email_verified_at && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200/70 bg-amber-50 px-4 py-2 text-[13px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <span className="flex items-center gap-2">
              <MailWarning className="size-4" /> Please verify your email address to secure your account.
            </span>
            <Link href="/verify-email" className="font-semibold underline-offset-2 hover:underline">
              Verify now →
            </Link>
          </div>
        )}

        <main id="main" key={pathname} className="flex-1 animate-fade-in pb-24 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden dark:border-zinc-800/70 dark:bg-zinc-950/90"
        aria-label="Primary"
      >
        {bottomNav.slice(0, 2).map(navLink)}
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="-mt-6 flex size-13 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg ring-4 shadow-indigo-500/30 ring-white active:scale-95 dark:ring-zinc-950"
            aria-label="New task"
            onClick={() => openQuickAdd()}
          >
            <Plus className="size-6" />
          </button>
        </div>
        {bottomNav.slice(2).map(navLink)}
      </nav>

      <TaskDrawer />
      <CommandPalette />
      <QuickAddDialog />
      <ShortcutsHelp />
    </div>
  )
}
