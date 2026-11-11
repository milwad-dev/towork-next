'use client'

import { AlignLeft, Bell, CalendarX2, Ellipsis, ListChecks, Sun, Sunrise, Trash2 } from 'lucide-react'
import { Popover } from '@/components/ui/Popover'
import { useTaskActions } from '@/hooks/useTaskActions'
import { cn } from '@/lib/cn'
import { colorOf, PRIORITIES } from '@/lib/constants'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { quickDates } from '@/lib/dates'
import type { Task } from '@/lib/types'
import { openTask, useUi } from '@/lib/ui'
import { DueChip } from './DueChip'
import { LabelPill } from './LabelPill'
import { PriorityFlag } from './PriorityFlag'
import { TaskCheckbox } from './TaskCheckbox'

export function TaskItem({ task, hideCategory = false, hideDue = false }: { task: Task; hideCategory?: boolean; hideDue?: boolean }) {
  const actions = useTaskActions()
  const isOpen = useUi((s) => s.openTaskId === task.id)
  const done = task.status === 'done'
  const hasMeta =
    (!hideDue && task.due_date) || task.subtasks_count || (!hideCategory && task.category) || task.labels?.length || task.description || task.remind_at

  return (
    <div
      className={cn(
        'group relative flex animate-fade-in cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-zinc-50 dark:hover:bg-zinc-900',
        isOpen && 'bg-accent-50/70 ring-1 ring-accent-200 dark:bg-accent-500/10 dark:ring-accent-500/30',
      )}
      role="button"
      tabIndex={0}
      aria-label={`Open task: ${task.title}`}
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && openTask(task.id)}
    >
      <div className="pt-0.5">
        <TaskCheckbox checked={done} priority={task.priority} onToggle={() => actions.toggle(task)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'min-w-0 truncate text-[14px] leading-6 transition-colors',
              done ? 'text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600' : 'text-zinc-800 dark:text-zinc-100',
            )}
          >
            {task.title}
          </p>
          {task.status === 'in_progress' && (
            <span className="chip h-5 shrink-0 rounded-full bg-amber-500/10 px-2 text-[11px] text-amber-700 dark:text-amber-400">In progress</span>
          )}
        </div>
        {!!hasMeta && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {!hideDue && <DueChip date={task.due_date} time={task.due_time} done={done} />}
            {!!task.subtasks_count && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs text-zinc-500',
                  task.completed_subtasks_count === task.subtasks_count && 'text-green-600 dark:text-green-400',
                )}
              >
                <ListChecks className="size-3.5" /> {task.completed_subtasks_count}/{task.subtasks_count}
              </span>
            )}
            {task.description && <AlignLeft className="size-3.5 text-zinc-400" aria-label="Has description" />}
            {task.remind_at && <Bell className="size-3.5 text-zinc-400" aria-label="Has reminder" />}
            {task.labels?.map((l) => <LabelPill key={l.id} label={l} />)}
            {!hideCategory && task.category && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                <CategoryIcon name={task.category.icon} className={cn('size-3.5', colorOf(task.category.color).text)} />
                {task.category.name}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 pt-0.5">
        {task.priority > 1 && !done && <PriorityFlag priority={task.priority} className="mt-1 size-3.5" />}
        <Popover
          width="w-52"
          align="end"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              className={cn('btn-icon size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100', open && 'opacity-100')}
              aria-label="Task options"
              onClick={(e) => {
                e.stopPropagation()
                toggle()
              }}
            >
              <Ellipsis className="size-4" />
            </button>
          )}
        >
          {({ close }) => {
            const dates = quickDates()
            const act = (fn: () => void) => () => {
              close()
              fn()
            }
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <p className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Due</p>
                <button type="button" className="menu-item" onClick={act(() => actions.update(task, { due_date: dates[0].value }, 'Moved to today'))}>
                  <Sun className="size-4 text-green-500" /> Today
                </button>
                <button type="button" className="menu-item" onClick={act(() => actions.update(task, { due_date: dates[1].value }, 'Moved to tomorrow'))}>
                  <Sunrise className="size-4 text-amber-500" /> Tomorrow
                </button>
                {task.due_date && (
                  <button type="button" className="menu-item" onClick={act(() => actions.update(task, { due_date: null, due_time: null }))}>
                    <CalendarX2 className="size-4 text-zinc-400" /> No date
                  </button>
                )}
                <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Priority</p>
                <div className="flex gap-1 px-1.5 pb-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={cn(
                        'flex h-8 flex-1 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800',
                        task.priority === p.value && 'bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700',
                      )}
                      aria-label={p.label}
                      title={p.label}
                      onClick={act(() => actions.update(task, { priority: p.value }))}
                    >
                      <PriorityFlag priority={p.value} className="size-4" />
                    </button>
                  ))}
                </div>
                <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                <button type="button" className="menu-item text-red-600 dark:text-red-400" onClick={act(() => actions.remove(task))}>
                  <Trash2 className="size-4" /> Delete
                </button>
              </div>
            )
          }}
        </Popover>
      </div>
    </div>
  )
}
