'use client'

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlignLeft, Kanban, ListChecks, Plus, Search } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { QuickAdd } from '@/components/tasks/QuickAdd'
import { DueChip } from '@/components/tasks/DueChip'
import { LabelPill } from '@/components/tasks/LabelPill'
import { PriorityFlag } from '@/components/tasks/PriorityFlag'
import { TaskCheckbox } from '@/components/tasks/TaskCheckbox'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useDebounced } from '@/hooks/useDebounced'
import { useTaskActions } from '@/hooks/useTaskActions'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { colorOf, STATUSES } from '@/lib/constants'
import { flatTasks, useCategories, useTaskList } from '@/lib/queries'
import type { Task, TaskStatus } from '@/lib/types'
import { openTask, toast } from '@/lib/ui'

type Columns = Record<TaskStatus, Task[]>

const TONES: Record<TaskStatus, string> = { todo: 'bg-zinc-400', in_progress: 'bg-amber-500', done: 'bg-green-500' }

function buildColumns(tasks: Task[]): Columns {
  const next: Columns = { todo: [], in_progress: [], done: [] }
  for (const t of tasks) (next[t.status] ?? next.todo).push(t)
  for (const key of Object.keys(next) as TaskStatus[]) next[key].sort((a, b) => a.position - b.position || a.id - b.id)
  return next
}

function columnOf(columns: Columns, id: string | number): TaskStatus | null {
  if (typeof id === 'string' && id in columns) return id as TaskStatus
  for (const key of Object.keys(columns) as TaskStatus[]) if (columns[key].some((t) => t.id === id)) return key
  return null
}

export function BoardView() {
  const { data: categories = [] } = useCategories()
  const actions = useTaskActions()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [adding, setAdding] = useState<TaskStatus | null>(null)
  const debouncedSearch = useDebounced(search.trim(), 250)

  const query = useTaskList({ sort: 'position', per_page: 200, search: debouncedSearch, category_id: categoryId })
  const tasks = flatTasks(query.data)
  const serverColumns = useMemo(() => buildColumns(tasks), [tasks])

  // While dragging, a local copy of the columns drives the UI.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const startColumns = useRef<Columns | null>(null)
  const columns = dragColumns ?? serverColumns
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragStart(e: DragStartEvent) {
    startColumns.current = serverColumns
    setDragColumns(serverColumns)
    setActiveId(Number(e.active.id))
  }

  // Move the card into another column as soon as it hovers it.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    setDragColumns((prev) => {
      const cols = prev ?? serverColumns
      const from = columnOf(cols, active.id)
      const to = columnOf(cols, over.id)
      if (!from || !to || from === to) return cols
      const moving = cols[from].find((t) => t.id === active.id)!
      const overIndex = cols[to].findIndex((t) => t.id === over.id)
      const index = overIndex === -1 ? cols[to].length : overIndex
      return {
        ...cols,
        [from]: cols[from].filter((t) => t.id !== active.id),
        [to]: [...cols[to].slice(0, index), { ...moving, status: to }, ...cols[to].slice(index)],
      }
    })
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    let final = dragColumns ?? serverColumns
    if (over) {
      const col = columnOf(final, active.id)
      if (col && col === columnOf(final, over.id)) {
        const oldIndex = final[col].findIndex((t) => t.id === active.id)
        const newIndex = final[col].findIndex((t) => t.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) final = { ...final, [col]: arrayMove(final[col], oldIndex, newIndex) }
      }
    }

    const before = startColumns.current
    const changed =
      !before ||
      (Object.keys(final) as TaskStatus[]).some((k) => final[k].map((t) => t.id).join() !== before[k].map((t) => t.id).join())
    if (!changed) {
      setDragColumns(null)
      return
    }
    try {
      await actions.mutations.reorder(final) // updates the cache optimistically before the request
    } catch (e) {
      query.refetch()
      toast(errorMessage(e), { type: 'error' })
    } finally {
      setDragColumns(null)
    }
  }

  return (
    <div className="flex h-full flex-col px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
          <Kanban className="size-5 text-accent-500" />
        </div>
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold tracking-tight">Board</h1>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Drag cards between columns to update their status.</p>
        </div>
        <label className="relative w-full sm:w-56">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} type="search" className="input h-9 pl-9 text-[13px]" placeholder="Search…" />
        </label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input h-9 w-full text-[13px] sm:w-44" aria-label="Filter by category">
          <option value="">All categories</option>
          <option value="none">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </header>

      {query.isError ? (
        <div className="card flex items-center justify-between gap-4 p-4 text-[13px]">
          <span className="text-red-600 dark:text-red-400">{errorMessage(query.error)}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => query.refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => {
            setActiveId(null)
            setDragColumns(null)
          }}
        >
          <div className="-mx-4 flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {STATUSES.map((s) => (
              <section
                key={s.value}
                className="flex w-[85vw] max-w-sm shrink-0 snap-center flex-col rounded-2xl bg-zinc-100/70 p-2 sm:w-80 lg:w-auto lg:max-w-none dark:bg-zinc-900/60"
                aria-label={`${s.label} column`}
              >
                <header className="flex items-center gap-2 px-2 pt-1 pb-2.5">
                  <span className={cn('size-2 rounded-full', TONES[s.value])} />
                  <h2 className="text-[13px] font-semibold">{s.label}</h2>
                  <span className="rounded-full bg-zinc-200/80 px-2 text-xs font-medium text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">
                    {columns[s.value].length}
                  </span>
                  <button
                    type="button"
                    className="btn-icon ml-auto size-7"
                    aria-label={`Add task to ${s.label}`}
                    onClick={() => setAdding(adding === s.value ? null : s.value)}
                  >
                    <Plus className="size-4" />
                  </button>
                </header>

                {adding === s.value && (
                  <div className="mb-2">
                    <QuickAdd defaults={{ status: s.value }} expanded onCancel={() => setAdding(null)} />
                  </div>
                )}

                {query.isPending ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-20 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <Column status={s.value} tasks={columns[s.value]} onToggle={actions.toggle} />
                )}
              </section>
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {activeTask ? <Card task={activeTask} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

function Column({ status, tasks, onToggle }: { status: TaskStatus; tasks: Task[]; onToggle: (t: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <SortableContext id={status} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn('flex min-h-32 flex-1 flex-col gap-2 rounded-xl transition-colors', isOver && !tasks.length && 'bg-accent-500/5')}>
        {tasks.map((t) => (
          <SortableCard key={t.id} task={t} onToggle={onToggle} />
        ))}
        {!tasks.length && (
          <p className="pointer-events-none flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-8 text-xs text-zinc-400 dark:border-zinc-800">
            Drop tasks here
          </p>
        )}
      </div>
    </SortableContext>
  )
}

function SortableCard({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40 [&>article]:border-dashed')}
      {...attributes}
      {...listeners}
      aria-label={task.title}
      onKeyDown={(e) => {
        // Space/arrows are used by dnd-kit; Enter opens the task.
        if (e.key === 'Enter') openTask(task.id)
        else listeners?.onKeyDown?.(e)
      }}
    >
      <Card task={task} onToggle={onToggle} />
    </div>
  )
}

function Card({ task: t, overlay = false, onToggle }: { task: Task; overlay?: boolean; onToggle?: (t: Task) => void }) {
  const done = t.status === 'done'
  return (
    <article
      className={cn(
        'group cursor-grab rounded-xl border border-zinc-200/80 bg-white p-3 shadow-soft transition hover:border-zinc-300 hover:shadow-md active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
        overlay && 'rotate-2 shadow-pop',
      )}
      onClick={() => openTask(t.id)}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <TaskCheckbox checked={done} priority={t.priority} onToggle={() => onToggle?.(t)} />
        </div>
        <p className={cn('min-w-0 flex-1 text-[13px] leading-5 font-medium', done && 'text-zinc-400 line-through')}>{t.title}</p>
        {t.priority > 1 && <PriorityFlag priority={t.priority} className="mt-0.5 size-3.5" />}
      </div>
      {!!t.labels?.length && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {t.labels.map((l) => (
            <LabelPill key={l.id} label={l} />
          ))}
        </div>
      )}
      {(t.due_date || t.subtasks_count > 0 || t.description || t.category) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <DueChip date={t.due_date} time={t.due_time} done={done} />
          {!!t.subtasks_count && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <ListChecks className="size-3.5" /> {t.completed_subtasks_count}/{t.subtasks_count}
            </span>
          )}
          {t.description && <AlignLeft className="size-3.5 text-zinc-400" />}
          {t.category && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-500">
              <CategoryIcon name={t.category.icon} className={cn('size-3.5', colorOf(t.category.color).text)} /> {t.category.name}
            </span>
          )}
        </div>
      )}
    </article>
  )
}
