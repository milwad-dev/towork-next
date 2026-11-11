'use client'

import {
  CalendarDays,
  CalendarRange,
  Circle,
  CircleCheck,
  CornerDownLeft,
  Inbox,
  Kanban,
  Keyboard,
  LayoutDashboard,
  Monitor,
  Plus,
  Search,
  Settings,
  Star,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { colorOf, iconOf } from '@/lib/constants'
import { formatDue } from '@/lib/dates'
import { searchTasks, useCategories, useLabels, useTaskMutations } from '@/lib/queries'
import type { Task } from '@/lib/types'
import { cycleTheme, openQuickAdd, openTask, toast, uiStore, useUi } from '@/lib/ui'

interface Item {
  id: string
  group: string
  label: string
  icon: LucideIcon
  iconClass?: string
  hint?: string
  meta?: string
  keepOpen?: boolean
  run: () => void
}

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen)
  const close = () => uiStore.set({ paletteOpen: false })
  return (
    <Modal open={open} title="Command palette" bare size="max-w-xl" position="top" onClose={close}>
      {open && <PaletteBody onClose={close} />}
    </Modal>
  )
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const theme = useUi((s) => s.theme)
  const { data: categories = [] } = useCategories()
  const { data: labels = [] } = useLabels()
  const tasks = useTaskMutations()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Task[]>([])
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) return
    let cancelled = false
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const found = await searchTasks(q)
        if (!cancelled) setResults(found)
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query])

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => router.push(href)
    const commands: Item[] = [
      { id: 'new', group: 'Actions', label: 'Create task', icon: Plus, hint: 'N', run: () => openQuickAdd() },
      {
        id: 'theme',
        group: 'Actions',
        label: `Switch theme (now: ${theme})`,
        icon: Monitor,
        run: cycleTheme,
        keepOpen: true,
      },
      {
        id: 'shortcuts',
        group: 'Actions',
        label: 'Keyboard shortcuts',
        icon: Keyboard,
        hint: '?',
        run: () => uiStore.set({ shortcutsOpen: true }),
      },
      { id: 'today', group: 'Go to', label: 'Today', icon: Star, run: go('/today') },
      { id: 'upcoming', group: 'Go to', label: 'Upcoming', icon: CalendarRange, run: go('/upcoming') },
      { id: 'all', group: 'Go to', label: 'All tasks', icon: Inbox, run: go('/tasks') },
      { id: 'board', group: 'Go to', label: 'Board', icon: Kanban, run: go('/board') },
      { id: 'calendar', group: 'Go to', label: 'Calendar', icon: CalendarDays, run: go('/calendar') },
      { id: 'dashboard', group: 'Go to', label: 'Dashboard', icon: LayoutDashboard, run: go('/dashboard') },
      { id: 'settings', group: 'Go to', label: 'Settings', icon: Settings, run: go('/settings') },
      ...categories.map((c) => ({
        id: `c${c.id}`,
        group: 'Categories',
        label: c.name,
        icon: iconOf(c.icon),
        iconClass: colorOf(c.color).text,
        run: go(`/categories/${c.id}`),
      })),
      ...labels.map((l) => ({
        id: `l${l.id}`,
        group: 'Labels',
        label: l.name,
        icon: Tag,
        iconClass: colorOf(l.color).text,
        run: go(`/labels/${l.id}`),
      })),
    ]

    const q = query.trim().toLowerCase()
    const cmds = q
      ? commands.filter((c) => c.label.toLowerCase().includes(q))
      : commands.filter((c) => c.group !== 'Labels')
    const taskItems: Item[] = (q ? results : []).map((t) => ({
      id: `t${t.id}`,
      group: 'Tasks',
      label: t.title,
      icon: t.status === 'done' ? CircleCheck : Circle,
      iconClass: t.status === 'done' ? 'text-green-500' : 'text-zinc-400',
      meta: t.due_date ? formatDue(t.due_date) : t.category?.name,
      run: () => openTask(t.id),
    }))
    const list = [...taskItems, ...cmds]
    if (q) {
      const title = query.trim()
      list.push({
        id: 'create',
        group: 'Actions',
        label: `Create task “${title}”`,
        icon: Plus,
        run: async () => {
          try {
            const task = await tasks.create({ title })
            toast('Task added', { action: { label: 'Open', handler: () => openTask(task.id) } })
          } catch {
            openQuickAdd()
          }
        },
      })
    }
    return list
  }, [query, results, categories, labels, theme, router, tasks])

  const groups = useMemo(() => {
    const out: { name: string; items: (Item & { index: number })[] }[] = []
    items.forEach((item, index) => {
      let g = out.find((x) => x.name === item.group)
      if (!g) out.push((g = { name: item.group, items: [] }))
      g.items.push({ ...item, index })
    })
    return out
  }, [items])

  function run(item?: Item) {
    if (!item) return
    if (!item.keepOpen) onClose()
    item.run()
  }

  function move(delta: number) {
    const n = items.length
    if (!n) return
    const next = (active + delta + n) % n
    setActive(next)
    requestAnimationFrame(() =>
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' }),
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 dark:border-zinc-800">
        <Search className="size-4 shrink-0 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            if (!e.target.value.trim()) {
              setResults([])
              setSearching(false)
            }
          }}
          className="h-13 min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-zinc-400 focus:outline-none"
          placeholder="Search tasks or type a command…"
          aria-label="Search"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={items[active] ? `palette-${items[active].id}` : undefined}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              move(1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              move(-1)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              run(items[active])
            }
          }}
        />
        {searching && <Spinner className="size-4 text-zinc-400" />}
        <kbd className="kbd">Esc</kbd>
      </div>
      <div
        id="palette-list"
        ref={listRef}
        role="listbox"
        className="scrollbar-thin max-h-[min(26rem,60vh)] overflow-y-auto p-2"
      >
        {groups.map((g) => (
          <div key={g.name} className="mb-1">
            <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              {g.name}
            </p>
            {g.items.map((item) => (
              <button
                key={item.id}
                id={`palette-${item.id}`}
                type="button"
                role="option"
                aria-selected={active === item.index}
                data-index={item.index}
                className="menu-item py-2"
                data-active={active === item.index}
                onMouseMove={() => setActive(item.index)}
                onClick={() => run(item)}
              >
                <item.icon className={`size-4 shrink-0 ${item.iconClass ?? 'text-zinc-400'}`} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.meta && <span className="text-xs text-zinc-400">{item.meta}</span>}
                {item.hint && <kbd className="kbd">{item.hint}</kbd>}
                {active === item.index && <CornerDownLeft className="size-3.5 text-zinc-400" />}
              </button>
            ))}
          </div>
        ))}
        {!items.length && <p className="px-3 py-8 text-center text-[13px] text-zinc-500">No results.</p>}
      </div>
    </>
  )
}
