'use client'

import { format } from 'date-fns'
import { CalendarRange, ChevronRight, CircleCheckBig, Inbox, Pencil, SearchX, Star, Tag, type LucideIcon } from 'lucide-react'
import { notFound } from 'next/navigation'
import { useMemo, useState } from 'react'
import { CollectionDialog } from '@/components/app/CollectionDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useDebounced } from '@/hooks/useDebounced'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { colorOf, iconOf, PRIORITIES, STATUSES } from '@/lib/constants'
import { dayHeading, quickDates, todayISO } from '@/lib/dates'
import { flatTasks, useCategories, useLabels, useTaskList } from '@/lib/queries'
import type { Task, TaskInput, TaskParams, TaskStatus } from '@/lib/types'
import { QuickAdd } from './QuickAdd'
import { clearedFilters, DEFAULT_FILTERS, TaskFilters, type Filters } from './TaskFilters'
import { TaskItem } from './TaskItem'

export type TasksMode = 'today' | 'upcoming' | 'all' | 'category' | 'label'

interface Group {
  key: string
  title: string | null
  items: Task[]
  tone?: string
  dot?: string
  hideDue?: boolean
  collapsible?: boolean
}

const OPEN: TaskStatus[] = ['todo', 'in_progress']

export function TasksView({ mode, id }: { mode: TasksMode; id?: number }) {
  const today = todayISO()
  const categories = useCategories()
  const labels = useLabels()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true })
  const [editOpen, setEditOpen] = useState(false)
  const search = useDebounced(filters.search.trim(), 250)
  const filterable = mode === 'all' || mode === 'category' || mode === 'label'

  const category = mode === 'category' ? (categories.data?.find((c) => c.id === id) ?? null) : null
  const label = mode === 'label' ? (labels.data?.find((l) => l.id === id) ?? null) : null
  if (mode === 'category' && categories.isSuccess && !category) notFound()
  if (mode === 'label' && labels.isSuccess && !label) notFound()

  const params = useMemo<TaskParams>(() => {
    switch (mode) {
      case 'today':
        return { date_to: today, status: OPEN, sort: 'due_date', per_page: 200 }
      case 'upcoming':
        return { due: 'upcoming', status: OPEN, sort: 'due_date', per_page: 200 }
      default: {
        const p: TaskParams = {
          search,
          status: filters.status,
          priority: filters.priority,
          due: filters.due || undefined,
          category_id: filters.category_id,
          label_id: filters.label_id,
          sort: filters.sort,
          direction: filters.direction,
          per_page: 50,
        }
        if (mode === 'category') p.category_id = id
        if (mode === 'label') p.label_id = id
        return p
      }
    }
  }, [mode, id, today, search, filters.status, filters.priority, filters.due, filters.category_id, filters.label_id, filters.sort, filters.direction])

  const query = useTaskList(params)
  const items = flatTasks(query.data)
  const total = query.data?.pages.at(-1)?.meta.total ?? items.length
  const openCount = items.filter((t) => t.status !== 'done').length
  const hasFilters = !!(filters.search || filters.status.length || filters.priority.length || filters.due || filters.category_id || filters.label_id)

  const header: { title: string; subtitle?: string; icon: LucideIcon; iconClass: string } = (() => {
    switch (mode) {
      case 'today':
        return { title: 'Today', subtitle: format(new Date(), 'EEEE, MMMM d'), icon: Star, iconClass: 'text-amber-500' }
      case 'upcoming':
        return { title: 'Upcoming', subtitle: 'Everything scheduled after today', icon: CalendarRange, iconClass: 'text-accent-500' }
      case 'category':
        return { title: category?.name ?? '…', icon: iconOf(category?.icon), iconClass: colorOf(category?.color).text }
      case 'label':
        return { title: label?.name ?? '…', icon: Tag, iconClass: colorOf(label?.color).text }
      default:
        return { title: 'All tasks', icon: Inbox, iconClass: 'text-accent-500' }
    }
  })()

  const quickDefaults: Partial<TaskInput> =
    mode === 'today'
      ? { due_date: today }
      : mode === 'upcoming'
        ? { due_date: quickDates()[1].value }
        : mode === 'category'
          ? { category_id: id }
          : mode === 'label' && id
            ? { label_ids: [id] }
            : {}

  const groups: Group[] = useMemo(() => {
    if (mode === 'today') {
      const overdue = items.filter((t) => t.due_date && t.due_date < today)
      const rest = items.filter((t) => !t.due_date || t.due_date >= today)
      const out: Group[] = []
      if (overdue.length) out.push({ key: 'overdue', title: 'Overdue', tone: 'text-red-600 dark:text-red-400', items: overdue })
      out.push({ key: 'today', title: 'Today', items: rest, hideDue: true })
      return out
    }
    if (mode === 'upcoming') {
      const byDate = new Map<string, Task[]>()
      for (const t of items) {
        const k = t.due_date ?? ''
        if (!byDate.has(k)) byDate.set(k, [])
        byDate.get(k)!.push(t)
      }
      return [...byDate.entries()]
        .sort(([a], [b]) => (a || '9999').localeCompare(b || '9999'))
        .map(([date, list]) => ({ key: date || 'none', title: dayHeading(date || null), items: list, hideDue: true }))
    }
    if (filters.group === 'status') {
      return STATUSES.map((s) => ({
        key: s.value,
        title: s.label,
        dot: s.dot,
        items: items.filter((t) => t.status === s.value),
        collapsible: s.value === 'done',
      })).filter((g) => g.items.length)
    }
    if (filters.group === 'priority') {
      return PRIORITIES.map((p) => ({ key: `p${p.value}`, title: p.label, dot: p.bar, items: items.filter((t) => t.priority === p.value) })).filter(
        (g) => g.items.length,
      )
    }
    return [{ key: 'all', title: null, items }]
  }, [items, mode, today, filters.group])

  const clear = () => setFilters(clearedFilters(filters, mode === 'category', mode === 'label'))
  const done = category ? (category.tasks_count ?? 0) - (category.open_tasks_count ?? 0) : 0

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
            <header.icon className={cn('size-5', header.iconClass)} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{header.title}</h1>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
              {header.subtitle && `${header.subtitle} · `}
              {(!query.isPending || items.length > 0) &&
                (mode === 'today' || mode === 'upcoming' ? `${openCount} open` : `${total} ${total === 1 ? 'task' : 'tasks'}`)}
            </p>
          </div>
          {(mode === 'category' || mode === 'label') && (category || label) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" /> Edit
            </button>
          )}
        </div>

        {category && (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={cn('h-full rounded-full transition-all duration-700', colorOf(category.color).bar)}
                style={{ width: `${category.tasks_count ? Math.round((done / category.tasks_count) * 100) : 0}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 tabular-nums">
              {done}/{category.tasks_count ?? 0} done
            </span>
          </div>
        )}

        {filterable && (
          <TaskFilters value={filters} onChange={setFilters} className="mt-5" hideCategory={mode === 'category'} hideLabel={mode === 'label'} />
        )}
      </header>

      <QuickAdd
        key={`${mode}${id ?? ''}`}
        defaults={quickDefaults}
        placeholder={mode === 'today' ? 'Add a task for today' : 'Add a task'}
      />
      <div className="mb-4" />

      {query.isError ? (
        <div className="card flex items-center justify-between gap-4 p-4 text-[13px]">
          <span className="text-red-600 dark:text-red-400">{errorMessage(query.error)}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => query.refetch()}>
            Retry
          </button>
        </div>
      ) : query.isPending ? (
        <div className="space-y-1" aria-busy="true" aria-label="Loading tasks">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <span className="skeleton size-[18px] rounded-full" />
              <span className="skeleton h-3.5" style={{ width: `${40 + ((i * 37) % 45)}%` }} />
            </div>
          ))}
        </div>
      ) : !items.length ? (
        filterable && hasFilters ? (
          <EmptyState icon={SearchX} title="No tasks match your filters" description="Try a different search or clear the filters.">
            <button type="button" className="btn btn-secondary" onClick={clear}>
              Clear filters
            </button>
          </EmptyState>
        ) : mode === 'today' ? (
          <EmptyState icon={CircleCheckBig} tone="green" title="All clear for today" description="Enjoy the calm, or plan something new above." />
        ) : mode === 'upcoming' ? (
          <EmptyState icon={CalendarRange} title="Nothing scheduled" description="Tasks with a future due date will show up here, grouped by day." />
        ) : (
          <EmptyState icon={Inbox} title="No tasks yet" description="Capture your first task above. Press N anywhere to add one quickly." />
        )
      ) : (
        <div className={cn('space-y-6', query.isFetching && !query.isFetchingNextPage && 'opacity-80 transition-opacity')}>
          {groups.map((g) => {
            const isCollapsed = g.collapsible && collapsed[g.key]
            return (
              <section key={g.key} aria-label={g.title ?? 'Tasks'}>
                {g.title && (
                  <button
                    type="button"
                    className={cn(
                      'mb-1 flex w-full items-center gap-2 border-b border-zinc-100 px-1 pb-2 text-left text-[13px] font-semibold dark:border-zinc-800/80',
                      g.tone ?? 'text-zinc-800 dark:text-zinc-200',
                    )}
                    aria-expanded={!isCollapsed}
                    disabled={!g.collapsible}
                    onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                  >
                    {g.collapsible && <ChevronRight className={cn('size-4 text-zinc-400 transition-transform', !isCollapsed && 'rotate-90')} />}
                    {g.dot && <span className={cn('size-2 rounded-full', g.dot)} />}
                    {g.title}
                    <span className="font-normal text-zinc-400">{g.items.length}</span>
                  </button>
                )}
                {!isCollapsed && (
                  <div className="relative">
                    {g.items.map((t) => (
                      <TaskItem key={t.id} task={t} hideCategory={mode === 'category'} hideDue={g.hideDue} />
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <button type="button" className="btn btn-secondary" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                {query.isFetchingNextPage && <Spinner />} Load more
              </button>
            </div>
          )}
        </div>
      )}

      {editOpen && (category || label) && (
        <CollectionDialog open kind={mode === 'label' ? 'label' : 'category'} item={category ?? label} onClose={() => setEditOpen(false)} />
      )}
    </div>
  )
}
