'use client'

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { addMonths, format, isSameMonth, isToday, subMonths } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TaskItem } from '@/components/tasks/TaskItem'
import { Popover } from '@/components/ui/Popover'
import { useTaskActions } from '@/hooks/useTaskActions'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { priorityOf } from '@/lib/constants'
import { monthGrid, parseDate, toISODate } from '@/lib/dates'
import { flatTasks, useTaskList } from '@/lib/queries'
import type { Task } from '@/lib/types'
import { openQuickAdd, openTask } from '@/lib/ui'

const MAX_CHIPS = 3
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function chipClass(t: Task) {
  if (t.status === 'done') return 'bg-zinc-100 text-zinc-400 line-through dark:bg-zinc-800/60'
  return (
    {
      4: 'bg-red-500/10 text-red-700 dark:text-red-300',
      3: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
      2: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    }[t.priority as number] ?? 'bg-accent-500/10 text-accent-700 dark:text-accent-300'
  )
}

export function CalendarView() {
  const actions = useTaskActions()
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState(() => toISODate(new Date()))

  const days = useMemo(() => monthGrid(month), [month])
  const from = toISODate(days[0])
  const to = toISODate(days[days.length - 1])
  const query = useTaskList({ date_from: from, date_to: to, sort: 'due_date', per_page: 200 })
  const tasks = flatTasks(query.data)

  const byDay = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const t of tasks) if (t.due_date) (map[t.due_date] ??= []).push(t)
    for (const list of Object.values(map)) {
      list.sort(
        (a, b) =>
          Number(a.status === 'done') - Number(b.status === 'done') ||
          (a.due_time ?? '99').localeCompare(b.due_time ?? '99') ||
          b.priority - a.priority,
      )
    }
    return map
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return
    const day = String(over.id)
    const task = tasks.find((t) => t.id === Number(active.id))
    if (!task || task.due_date === day) return
    await actions.update(task, { due_date: day }, `Moved to ${format(parseDate(day)!, 'MMM d')}`)
  }

  function go(delta: -1 | 0 | 1) {
    if (delta === 0) {
      setMonth(new Date())
      setSelected(toISODate(new Date()))
    } else setMonth((m) => (delta > 0 ? addMonths(m, 1) : subMonths(m, 1)))
  }

  const selectedTasks = byDay[selected] ?? []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
          <CalendarDays className="size-5 text-accent-500" />
        </div>
        <h1 className="mr-auto text-2xl font-semibold tracking-tight">{format(month, 'MMMM yyyy')}</h1>
        <div className="flex items-center gap-1">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => go(0)}>
            Today
          </button>
          <button type="button" className="btn-icon" aria-label="Previous month" onClick={() => go(-1)}>
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" className="btn-icon" aria-label="Next month" onClick={() => go(1)}>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      {query.isError && (
        <div className="card mb-4 flex items-center justify-between gap-4 p-4 text-[13px]">
          <span className="text-red-600 dark:text-red-400">{errorMessage(query.error)}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => query.refetch()}>
            Retry
          </button>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className={cn('card overflow-hidden', query.isFetching && 'opacity-70 transition-opacity')}>
          <div className="grid grid-cols-7 border-b border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[11px] font-semibold tracking-wider text-zinc-500 uppercase"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7" role="grid" aria-label={format(month, 'MMMM yyyy')}>
            {days.map((d) => (
              <DayCell
                key={d.toISOString()}
                date={d}
                month={month}
                tasks={byDay[toISODate(d)] ?? []}
                selected={selected === toISODate(d)}
                onSelect={() => setSelected(toISODate(d))}
              />
            ))}
          </div>
        </div>
      </DndContext>
      <p className="mt-3 hidden text-xs text-zinc-400 sm:block">
        Tip: drag a task to another day to reschedule it. Double-click a day to add a task.
      </p>

      {/* Mobile agenda for the selected day */}
      <section className="mt-6 sm:hidden" aria-live="polite">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">{format(parseDate(selected)!, 'EEEE, MMM d')}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openQuickAdd({ due_date: selected })}>
            <Plus className="size-4" /> Add
          </button>
        </div>
        {!selectedTasks.length && (
          <p className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-[13px] text-zinc-400 dark:border-zinc-800">
            No tasks on this day.
          </p>
        )}
        {selectedTasks.map((t) => (
          <TaskItem key={t.id} task={t} hideDue />
        ))}
      </section>
    </div>
  )
}

function DayCell({
  date,
  month,
  tasks,
  selected,
  onSelect,
}: {
  date: Date
  month: Date
  tasks: Task[]
  selected: boolean
  onSelect: () => void
}) {
  const iso = toISODate(date)
  const { setNodeRef, isOver } = useDroppable({ id: iso })
  const inMonth = isSameMonth(date, month)

  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      aria-selected={selected}
      className={cn(
        'group relative min-h-16 border-r border-b border-zinc-100 p-1 transition-colors sm:min-h-28 sm:p-1.5 dark:border-zinc-800/80 [&:nth-child(7n)]:border-r-0',
        !inMonth && 'bg-zinc-50/60 dark:bg-zinc-950/40',
        isOver && 'bg-accent-500/10 ring-2 ring-accent-500/40 ring-inset',
        selected && 'max-sm:bg-accent-500/5',
      )}
      onClick={onSelect}
      onDoubleClick={() => openQuickAdd({ due_date: iso })}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums',
            isToday(date)
              ? 'bg-accent-600 text-white'
              : inMonth
                ? 'text-zinc-700 dark:text-zinc-300'
                : 'text-zinc-400 dark:text-zinc-600',
          )}
        >
          {format(date, 'd')}
        </span>
        <button
          type="button"
          className="btn-icon size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:hidden"
          aria-label={`Add task on ${format(date, 'MMMM d')}`}
          onClick={(e) => {
            e.stopPropagation()
            openQuickAdd({ due_date: iso })
          }}
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Mobile: dots */}
      <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
        {tasks.slice(0, 4).map((t) => (
          <span
            key={t.id}
            className={cn(
              'size-1.5 rounded-full',
              t.status === 'done' ? 'bg-zinc-300 dark:bg-zinc-600' : priorityOf(t.priority).bar,
            )}
          />
        ))}
      </div>

      {/* Desktop: chips */}
      <div className="mt-1 hidden space-y-0.5 sm:block">
        {tasks.slice(0, MAX_CHIPS).map((t) => (
          <Chip key={t.id} task={t} />
        ))}
        {tasks.length > MAX_CHIPS && (
          <Popover
            width="w-72"
            triggerClass="block"
            trigger={({ toggle }) => (
              <button
                type="button"
                className="w-full rounded-md px-1.5 text-left text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle()
                }}
              >
                +{tasks.length - MAX_CHIPS} more
              </button>
            )}
          >
            {({ close }) => (
              <>
                <p className="px-2.5 pt-1.5 pb-1 text-xs font-semibold">{format(date, 'EEEE, MMM d')}</p>
                {tasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      close()
                      openTask(t.id)
                    }}
                  >
                    <span
                      className={cn(
                        'size-2 shrink-0 rounded-full',
                        t.status === 'done' ? 'bg-zinc-300' : priorityOf(t.priority).bar,
                      )}
                    />
                    <span className={cn('truncate', t.status === 'done' && 'text-zinc-400 line-through')}>
                      {t.title}
                    </span>
                  </button>
                ))}
              </>
            )}
          </Popover>
        )}
      </div>
    </div>
  )
}

function Chip({ task: t }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: t.id })
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cn(
        'relative block w-full cursor-grab truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition hover:brightness-95 active:cursor-grabbing dark:hover:brightness-125',
        chipClass(t),
        isDragging && 'z-10 shadow-pop',
      )}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      title={t.title}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        openTask(t.id)
      }}
    >
      {t.due_time && <span className="opacity-70">{t.due_time}</span>} {t.title}
    </button>
  )
}
