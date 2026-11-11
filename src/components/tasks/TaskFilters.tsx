'use client'

import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, ListFilter, Search, X } from 'lucide-react'
import { Popover } from '@/components/ui/Popover'
import { cn } from '@/lib/cn'
import { colorOf, PRIORITIES, SORTS, STATUSES } from '@/lib/constants'
import { useCategories, useLabels } from '@/lib/queries'
import type { TaskParams, TaskStatus } from '@/lib/types'
import { PriorityFlag } from './PriorityFlag'

export interface Filters {
  search: string
  status: TaskStatus[]
  priority: number[]
  due: '' | NonNullable<TaskParams['due']>
  category_id: string
  label_id: string
  sort: NonNullable<TaskParams['sort']>
  direction: 'asc' | 'desc'
  group: 'status' | 'priority' | 'none'
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  status: [],
  priority: [],
  due: '',
  category_id: '',
  label_id: '',
  sort: 'created_at',
  direction: 'desc',
  group: 'status',
}

const DUE: { value: Filters['due']; label: string }[] = [
  { value: '', label: 'Any time' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'scheduled', label: 'Has due date' },
  { value: 'none', label: 'No due date' },
]
const GROUPS: { value: Filters['group']; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'none', label: 'None' },
]

const chipOn = 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300'
const chipOff =
  'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
const sectionTitle = 'mb-1.5 block text-[11px] font-semibold tracking-wider text-zinc-400 uppercase'

export function clearedFilters(f: Filters, hideCategory: boolean, hideLabel: boolean): Filters {
  return {
    ...f,
    search: '',
    status: [],
    priority: [],
    due: '',
    ...(hideCategory ? {} : { category_id: '' }),
    ...(hideLabel ? {} : { label_id: '' }),
  }
}

/** Search, filter, sort and group controls bound to a filters object. */
export function TaskFilters({
  value,
  onChange,
  hideCategory = false,
  hideLabel = false,
  className,
}: {
  value: Filters
  onChange: (f: Filters) => void
  hideCategory?: boolean
  hideLabel?: boolean
  className?: string
}) {
  const { data: categories = [] } = useCategories()
  const { data: labels = [] } = useLabels()
  const set = <K extends keyof Filters>(key: K, v: Filters[K]) => onChange({ ...value, [key]: v })
  const toggleIn = <K extends 'status' | 'priority'>(key: K, v: Filters[K][number]) => {
    const list = value[key] as Filters[K][number][]
    set(key, (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]) as Filters[K])
  }

  const activeCount =
    (value.status.length ? 1 : 0) +
    (value.priority.length ? 1 : 0) +
    (value.due ? 1 : 0) +
    (!hideCategory && value.category_id ? 1 : 0) +
    (!hideLabel && value.label_id ? 1 : 0)

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <label className="relative min-w-0 flex-1 basis-48">
        <span className="sr-only">Search tasks</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={value.search}
          type="search"
          className="input h-9 pl-9 text-[13px]"
          placeholder="Search tasks…"
          onChange={(e) => set('search', e.target.value)}
        />
      </label>

      <Popover
        width="w-72"
        align="end"
        trigger={({ toggle, open }) => (
          <button type="button" className="btn btn-secondary btn-sm h-9" aria-expanded={open} onClick={toggle}>
            <ListFilter className="size-4" /> Filter
            {!!activeCount && (
              <span className="flex size-5 items-center justify-center rounded-full bg-accent-600 text-[11px] text-white">
                {activeCount}
              </span>
            )}
          </button>
        )}
      >
        {() => (
          <div className="space-y-3 p-2">
            <section>
              <p className={sectionTitle}>Status</p>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={cn('chip h-7 border px-2', value.status.includes(s.value) ? chipOn : chipOff)}
                    aria-pressed={value.status.includes(s.value)}
                    onClick={() => toggleIn('status', s.value)}
                  >
                    <span className={cn('size-1.5 rounded-full', s.dot)} /> {s.label}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <p className={sectionTitle}>Priority</p>
              <div className="flex flex-wrap gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={cn('chip h-7 border px-2', value.priority.includes(p.value) ? chipOn : chipOff)}
                    aria-pressed={value.priority.includes(p.value)}
                    onClick={() => toggleIn('priority', p.value)}
                  >
                    <PriorityFlag priority={p.value} className="size-3" /> {p.label}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <label className={sectionTitle} htmlFor="f-due">
                Due
              </label>
              <select
                id="f-due"
                className="input h-8 text-[13px]"
                value={value.due}
                onChange={(e) => set('due', e.target.value as Filters['due'])}
              >
                {DUE.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </section>
            {!hideCategory && (
              <section>
                <label className={sectionTitle} htmlFor="f-cat">
                  Category
                </label>
                <select
                  id="f-cat"
                  className="input h-8 text-[13px]"
                  value={value.category_id}
                  onChange={(e) => set('category_id', e.target.value)}
                >
                  <option value="">Any category</option>
                  <option value="none">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </section>
            )}
            {!hideLabel && !!labels.length && (
              <section>
                <p className={sectionTitle}>Label</p>
                <div className="flex flex-wrap gap-1">
                  {labels.map((l) => {
                    const on = value.label_id === String(l.id)
                    return (
                      <button
                        key={l.id}
                        type="button"
                        className={cn('chip h-7 rounded-full border px-2', on ? chipOn : chipOff)}
                        onClick={() => set('label_id', on ? '' : String(l.id))}
                      >
                        <span className={cn('size-1.5 rounded-full', colorOf(l.color).dot)} /> {l.name}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}
            {!!activeCount && (
              <button
                type="button"
                className="btn btn-ghost btn-sm w-full"
                onClick={() => onChange(clearedFilters(value, hideCategory, hideLabel))}
              >
                <X className="size-3.5" /> Clear filters
              </button>
            )}
          </div>
        )}
      </Popover>

      <Popover
        width="w-56"
        align="end"
        trigger={({ toggle, open }) => (
          <button
            type="button"
            className="btn btn-secondary btn-sm h-9"
            aria-expanded={open}
            aria-label="Sort and group"
            onClick={toggle}
          >
            {value.direction === 'desc' ? (
              <ArrowDownWideNarrow className="size-4" />
            ) : (
              <ArrowUpNarrowWide className="size-4" />
            )}
            <span className="max-sm:hidden">{SORTS.find((s) => s.value === value.sort)?.label}</span>
          </button>
        )}
      >
        {() => (
          <>
            <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              Sort by
            </p>
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                className="menu-item"
                data-active={value.sort === s.value}
                onClick={() =>
                  onChange({ ...value, sort: s.value, direction: s.value === 'created_at' ? 'desc' : 'asc' })
                }
              >
                {s.label} {value.sort === s.value && <Check className="ml-auto size-4 text-accent-500" />}
              </button>
            ))}
            <div className="m-1.5 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              {(['asc', 'desc'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={cn(
                    'rounded-md py-1 text-xs font-medium',
                    value.direction === d ? 'bg-white shadow-soft dark:bg-zinc-700' : 'text-zinc-500',
                  )}
                  onClick={() => set('direction', d)}
                >
                  {d === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              ))}
            </div>
            <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              Group by
            </p>
            {GROUPS.map((g) => (
              <button
                key={g.value}
                type="button"
                className="menu-item"
                data-active={value.group === g.value}
                onClick={() => set('group', g.value)}
              >
                {g.label} {value.group === g.value && <Check className="ml-auto size-4 text-accent-500" />}
              </button>
            ))}
          </>
        )}
      </Popover>
    </div>
  )
}
