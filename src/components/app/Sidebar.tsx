'use client'

import {
  CalendarDays,
  CalendarRange,
  Ellipsis,
  Inbox,
  Kanban,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { Popover } from '@/components/ui/Popover'
import { useIsMac } from '@/hooks/useShortcuts'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { colorOf, iconOf } from '@/lib/constants'
import { useCategories, useCollectionMutations, useLabels } from '@/lib/queries'
import type { Category, Label } from '@/lib/types'
import { confirm, openQuickAdd, setSidebarCollapsed, toast, uiStore } from '@/lib/ui'
import { CollectionDialog, type CollectionKind } from './CollectionDialog'
import { UserMenu } from './UserMenu'

const nav = [
  { href: '/today', label: 'Today', icon: Star },
  { href: '/upcoming', label: 'Upcoming', icon: CalendarRange },
  { href: '/tasks', label: 'All tasks', icon: Inbox },
  { href: '/board', label: 'Board', icon: Kanban },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

const activeLink = 'bg-white text-zinc-900 shadow-soft ring-1 ring-zinc-200/70 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700/60'
const idleLink = 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100'

export function Sidebar({ collapsed = false, mobile = false, onNavigate }: { collapsed?: boolean; mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const isMac = useIsMac()
  const categories = useCategories()
  const labels = useLabels()
  const categoryMutations = useCollectionMutations('categories')
  const labelMutations = useCollectionMutations('labels')
  const [dialog, setDialog] = useState<{ open: boolean; kind: CollectionKind; item: Category | Label | null; key: number }>({
    open: false,
    kind: 'category',
    item: null,
    key: 0,
  })

  const openDialog = (kind: CollectionKind, item: Category | Label | null = null) =>
    setDialog((d) => ({ open: true, kind, item, key: d.key + 1 }))

  async function removeItem(kind: CollectionKind, item: Category | Label) {
    const ok = await confirm({
      title: `Delete “${item.name}”?`,
      message:
        kind === 'category'
          ? 'Its tasks will stay but become uncategorized. This cannot be undone.'
          : 'The label will be removed from all tasks. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await (kind === 'category' ? categoryMutations : labelMutations).remove(item.id)
      toast(`Deleted “${item.name}”`)
      if (pathname === `/${kind === 'category' ? 'categories' : 'labels'}/${item.id}`) router.push('/tasks')
    } catch (e) {
      toast(errorMessage(e), { type: 'error' })
    }
  }

  const sections = [
    { kind: 'category' as const, title: 'Categories', query: categories, base: '/categories' },
    { kind: 'label' as const, title: 'Labels', query: labels, base: '/labels' },
  ]

  return (
    <nav className="flex h-full flex-col" aria-label="Main">
      {/* Header */}
      <div className={cn('flex h-14 shrink-0 items-center gap-2 px-3', collapsed && 'justify-center px-0')}>
        {!collapsed && (
          <Link href="/today" className="rounded-lg px-1.5" onClick={onNavigate}>
            <Logo />
          </Link>
        )}
        {!mobile && (
          <button
            type="button"
            className={cn('btn-icon', !collapsed && 'ml-auto')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar  [' : 'Collapse sidebar  ['}
            onClick={() => setSidebarCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className={cn('space-y-1 px-3 pb-3', collapsed && 'px-2')}>
        <button
          type="button"
          className={cn('btn btn-primary w-full', collapsed && 'px-0')}
          title={collapsed ? 'New task (N)' : undefined}
          aria-label="New task"
          onClick={() => {
            openQuickAdd()
            onNavigate?.()
          }}
        >
          <Plus className="size-4" />
          {!collapsed && (
            <>
              New task <span className="ml-auto rounded bg-white/15 px-1.5 text-[11px]">N</span>
            </>
          )}
        </button>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200',
            collapsed && 'justify-center px-0',
          )}
          aria-label="Search"
          onClick={() => {
            uiStore.set({ paletteOpen: true })
            onNavigate?.()
          }}
        >
          <Search className="size-4" />
          {!collapsed && (
            <>
              Search
              <span className="ml-auto flex gap-0.5">
                <span className="kbd">{isMac ? '⌘' : 'Ctrl'}</span>
                <span className="kbd">K</span>
              </span>
            </>
          )}
        </button>
      </div>

      <div className={cn('scrollbar-thin flex-1 overflow-y-auto px-3 pb-4', collapsed && 'px-2')}>
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition',
                    active ? activeLink : idleLink,
                    collapsed && 'justify-center px-0',
                  )}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  <item.icon className={cn('size-4 shrink-0', active && 'text-accent-600 dark:text-accent-400')} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Categories & labels */}
        {sections.map((section) => (
          <div key={section.kind}>
            {!collapsed ? (
              <div className="mt-6 mb-1 flex items-center justify-between px-2.5">
                <h3 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">{section.title}</h3>
                <button
                  type="button"
                  className="btn-icon size-6"
                  aria-label={`New ${section.kind}`}
                  title={`New ${section.kind}`}
                  onClick={() => openDialog(section.kind)}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="mx-2 my-3 h-px bg-zinc-200 dark:bg-zinc-800" />
            )}

            <ul className="space-y-0.5">
              {section.query.isPending &&
                [1, 2, 3].map((i) => (
                  <li key={i} className="flex h-8 items-center gap-2.5 px-2.5">
                    <span className="skeleton size-2.5 rounded-full" />
                    {!collapsed && <span className="skeleton h-3 flex-1" />}
                  </li>
                ))}
              {(section.query.data ?? []).map((item) => {
                const href = `${section.base}/${item.id}`
                const active = pathname === href
                const Icon = section.kind === 'category' ? iconOf((item as Category).icon) : Tag
                const count = section.kind === 'category' ? item.open_tasks_count : item.tasks_count
                return (
                  <li key={item.id} className="group/item relative">
                    <Link
                      href={href}
                      className={cn(
                        'flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition',
                        active ? cn('font-medium', activeLink) : idleLink,
                        collapsed && 'justify-center px-0',
                      )}
                      title={collapsed ? item.name : undefined}
                      onClick={onNavigate}
                    >
                      <Icon className={cn('size-4 shrink-0', colorOf(item.color).text)} />
                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.name}</span>
                          <span className="text-xs text-zinc-400 tabular-nums group-hover/item:opacity-0">{count || ''}</span>
                        </>
                      )}
                    </Link>
                    {!collapsed && (
                      <Popover
                        width="w-40"
                        align="end"
                        triggerClass="absolute top-1 right-1"
                        trigger={({ toggle, open }) => (
                          <button
                            type="button"
                            className={cn(
                              'flex size-6 items-center justify-center rounded-md text-zinc-400 opacity-0 transition group-hover/item:opacity-100 hover:bg-zinc-200 hover:text-zinc-700 focus-visible:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-200',
                              open && 'opacity-100',
                            )}
                            aria-label={`Options for ${item.name}`}
                            onClick={(e) => {
                              e.preventDefault()
                              toggle()
                            }}
                          >
                            <Ellipsis className="size-4" />
                          </button>
                        )}
                      >
                        {({ close }) => (
                          <>
                            <button
                              type="button"
                              className="menu-item"
                              onClick={() => {
                                close()
                                openDialog(section.kind, item)
                              }}
                            >
                              <Pencil className="size-3.5 text-zinc-400" /> Edit
                            </button>
                            <button
                              type="button"
                              className="menu-item text-red-600 dark:text-red-400"
                              onClick={() => {
                                close()
                                removeItem(section.kind, item)
                              }}
                            >
                              <Trash2 className="size-3.5" /> Delete
                            </button>
                          </>
                        )}
                      </Popover>
                    )}
                  </li>
                )
              })}
              {section.query.isSuccess && !section.query.data.length && !collapsed && (
                <li>
                  <button
                    type="button"
                    className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-300"
                    onClick={() => openDialog(section.kind)}
                  >
                    <Plus className="size-4" /> Add {section.kind === 'category' ? 'a category' : 'a label'}
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-zinc-200/70 p-2 dark:border-zinc-800/70">
        <UserMenu collapsed={collapsed} />
      </div>

      {dialog.open && (
        <CollectionDialog
          key={dialog.key}
          open
          kind={dialog.kind}
          item={dialog.item}
          onClose={() => setDialog((d) => ({ ...d, open: false }))}
        />
      )}
    </nav>
  )
}
