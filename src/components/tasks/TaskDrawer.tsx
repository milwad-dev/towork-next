'use client'

import { formatDistanceToNow } from 'date-fns'
import { Bell, BellOff, Check, CircleDot, Clock, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useHydrated } from '@/hooks/useHydrated'
import { useTaskActions } from '@/hooks/useTaskActions'
import { ApiError, errorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { STATUSES } from '@/lib/constants'
import { fromLocalInput, toLocalInput } from '@/lib/dates'
import { useTask } from '@/lib/queries'
import type { Subtask, Task, TaskInput } from '@/lib/types'
import { closeTask, toast, useUi } from '@/lib/ui'
import { CategoryPicker } from './CategoryPicker'
import { DuePicker } from './DuePicker'
import { LabelPicker } from './LabelPicker'
import { PriorityPicker } from './PriorityPicker'
import { TaskCheckbox } from './TaskCheckbox'

/** Slide-over with every field of a task. Edits save automatically. */
export function TaskDrawer() {
  const id = useUi((s) => s.openTaskId)
  const mounted = useHydrated()
  if (!mounted || id === null) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 animate-fade-in bg-zinc-950/20 backdrop-blur-[1px] lg:bg-transparent lg:backdrop-blur-none dark:bg-black/40" onClick={closeTask} />
      <aside
        role="dialog"
        aria-modal="false"
        data-drawer
        aria-label="Task details"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl animate-drawer-in flex-col border-l border-zinc-200 bg-white shadow-pop dark:border-zinc-800 dark:bg-zinc-900"
      >
        <DrawerContent key={id} id={id} />
      </aside>
    </>,
    document.body,
  )
}

type SaveState = 'idle' | 'saving' | 'saved'

function DrawerContent({ id }: { id: number }) {
  const { data: task, error, isFetching } = useTask(id)
  const actions = useTaskActions()
  const tasks = actions.mutations
  const [saveState, setSaveState] = useState<SaveState>('idle')

  // Text fields are edited locally and saved with a debounce.
  const [title, setTitle] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const pending = useRef<TaskInput>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const flush = useCallback(async () => {
    clearTimeout(saveTimer.current)
    const patch = pending.current
    pending.current = {}
    if (!Object.keys(patch).length) return
    if ('title' in patch && !patch.title?.trim()) delete patch.title // never save an empty title
    if (!Object.keys(patch).length) return
    setSaveState('saving')
    try {
      await tasks.update(id, patch)
      setSaveState('saved')
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaveState('idle'), 1500)
    } catch (e) {
      setSaveState('idle')
      toast(errorMessage(e), { type: 'error' })
    }
  }, [id, tasks])

  // Save anything pending when the drawer closes or switches task.
  const flushRef = useRef(flush)
  useEffect(() => {
    flushRef.current = flush
  })
  useEffect(() => () => void flushRef.current(), [])

  function change(patch: TaskInput, debounce = false) {
    Object.assign(pending.current, patch)
    clearTimeout(saveTimer.current)
    if (debounce) saveTimer.current = setTimeout(flush, 700)
    else flush()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      if ((document.activeElement as HTMLElement | null)?.closest?.('.popover')) return
      closeTask()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const notFound = error instanceof ApiError && error.status === 404
  const shownTitle = title ?? task?.title ?? ''
  const shownDescription = description ?? task?.description ?? ''

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-100 px-4 dark:border-zinc-800">
        {task && (
          <button
            type="button"
            className={cn('btn btn-sm', task.status === 'done' ? 'bg-green-500/10 text-green-700 hover:bg-green-500/15 dark:text-green-400' : 'btn-secondary')}
            onClick={() => actions.toggle(task)}
          >
            <Check className="size-3.5" /> {task.status === 'done' ? 'Completed' : 'Mark complete'}
          </button>
        )}
        <span className="ml-2 flex items-center gap-1.5 text-xs text-zinc-400" aria-live="polite">
          {saveState === 'saving' && (
            <>
              <Spinner /> Saving…
            </>
          )}
          {saveState === 'saved' && (
            <>
              <Check className="size-3.5 text-green-500" /> Saved
            </>
          )}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {task && (
            <button
              type="button"
              className="btn-icon hover:text-red-600"
              aria-label="Delete task"
              title="Delete task"
              onClick={async () => {
                await flush()
                await actions.remove(task)
              }}
            >
              <Trash2 className="size-4" />
            </button>
          )}
          <button type="button" className="btn-icon" aria-label="Close" title="Close (Esc)" onClick={closeTask}>
            <X className="size-4" />
          </button>
        </div>
      </header>

      {notFound ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <p className="font-medium">This task no longer exists.</p>
          <button type="button" className="btn btn-secondary mt-4" onClick={closeTask}>
            Close
          </button>
        </div>
      ) : !task ? (
        <div className="space-y-4 p-6">
          <div className="skeleton h-7 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            <div className="px-6 pt-6">
              <AutoGrowTextarea
                value={shownTitle}
                rows={1}
                className={cn(
                  'w-full resize-none bg-transparent text-xl leading-snug font-semibold tracking-tight focus:outline-none',
                  task.status === 'done' && 'text-zinc-400 line-through',
                )}
                aria-label="Title"
                maxLength={255}
                onChange={(e) => {
                  setTitle(e.target.value)
                  change({ title: e.target.value }, true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
                onBlur={() => flush()}
              />
              {!shownTitle.trim() && <p className="field-error">A title is required.</p>}
            </div>

            <dl className="mt-4 grid grid-cols-[7.5rem_1fr] items-center gap-x-3 gap-y-2.5 px-6 text-[13px]">
              <dt className="flex items-center gap-2 text-zinc-500">
                <CircleDot className="size-4" /> Status
              </dt>
              <dd className="flex flex-wrap gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={cn(
                      'btn btn-sm border',
                      task.status === s.value
                        ? 'border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white'
                        : 'border-transparent font-normal text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    )}
                    aria-pressed={task.status === s.value}
                    onClick={() => change({ status: s.value })}
                  >
                    <span className={cn('size-2 rounded-full', s.dot)} /> {s.label}
                  </button>
                ))}
              </dd>

              <dt className="text-zinc-500">Due</dt>
              <dd>
                <DuePicker
                  date={task.due_date}
                  time={task.due_time}
                  withTime
                  onChange={(due_date, due_time) => change(due_date === task.due_date ? { due_time } : { due_date, due_time })}
                />
              </dd>

              <dt className="text-zinc-500">Priority</dt>
              <dd>
                <PriorityPicker value={task.priority} onChange={(priority) => change({ priority })} />
              </dd>

              <dt className="text-zinc-500">Category</dt>
              <dd>
                <CategoryPicker value={task.category_id} onChange={(category_id) => change({ category_id })} />
              </dd>

              <dt className="text-zinc-500">Labels</dt>
              <dd>
                <LabelPicker value={task.labels.map((l) => l.id)} onChange={(label_ids) => change({ label_ids })} />
              </dd>

              <dt className="flex items-center gap-2 text-zinc-500">
                <Bell className="size-4" /> Reminder
              </dt>
              <dd className="flex items-center gap-1.5">
                <input
                  type="datetime-local"
                  className="input h-8 w-auto text-[13px]"
                  defaultValue={toLocalInput(task.remind_at)}
                  key={task.remind_at ?? 'none'}
                  aria-label="Reminder"
                  onChange={(e) => change({ remind_at: fromLocalInput(e.target.value) })}
                />
                {task.remind_at && (
                  <button type="button" className="btn-icon" aria-label="Remove reminder" title="Remove reminder" onClick={() => change({ remind_at: null })}>
                    <BellOff className="size-4" />
                  </button>
                )}
              </dd>
            </dl>

            <div className="mt-6 px-6">
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Description</h3>
              <AutoGrowTextarea
                value={shownDescription}
                rows={3}
                className="input min-h-24 resize-none text-[14px] leading-relaxed"
                placeholder="Add more details, links or notes…"
                aria-label="Description"
                onChange={(e) => {
                  setDescription(e.target.value)
                  change({ description: e.target.value || null }, true)
                }}
                onBlur={() => flush()}
              />
            </div>

            <Subtasks task={task} />
          </div>

          <footer className="flex shrink-0 items-center gap-1.5 border-t border-zinc-100 px-6 py-3 text-xs text-zinc-400 dark:border-zinc-800">
            <Clock className="size-3.5" />
            Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            {task.completed_at && ` · Completed ${formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}`}
            {isFetching && (
              <span className="ml-auto">
                <Spinner />
              </span>
            )}
          </footer>
        </>
      )}
    </>
  )
}

function AutoGrowTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [props.value])
  return <textarea ref={ref} {...props} />
}

function Subtasks({ task }: { task: Task }) {
  const { mutations } = useTaskActions()
  const [newTitle, setNewTitle] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const list = task.subtasks ?? []
  const doneCount = list.filter((s) => s.is_completed).length
  const progress = list.length ? Math.round((doneCount / list.length) * 100) : 0

  const guard = (p: Promise<unknown>) => p.catch((e) => toast(errorMessage(e), { type: 'error' }))

  function add(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    setNewTitle('')
    guard(mutations.addSubtask(task.id, title))
  }

  function rename(sub: Subtask, value: string) {
    setEditing(null)
    const title = value.trim()
    if (!title || title === sub.title) return
    guard(mutations.updateSubtask(task.id, sub.id, { title }))
  }

  return (
    <div className="mt-6 px-6 pb-8">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
          Subtasks
          {!!list.length && (
            <span className="ml-1 font-medium tracking-normal normal-case">
              {doneCount}/{list.length}
            </span>
          )}
        </h3>
        {!!list.length && (
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <ul className="space-y-0.5">
        {list.map((sub) => (
          <li key={sub.id} className="group/sub flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
            <GripVertical className="size-3.5 text-zinc-300 opacity-0 group-hover/sub:opacity-100 dark:text-zinc-600" aria-hidden="true" />
            <TaskCheckbox
              checked={sub.is_completed}
              label="Complete subtask"
              onToggle={() => guard(mutations.updateSubtask(task.id, sub.id, { is_completed: !sub.is_completed }))}
            />
            {editing === sub.id ? (
              <input
                defaultValue={sub.title}
                className="min-w-0 flex-1 bg-transparent text-[13px] focus:outline-none"
                aria-label="Subtask title"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    rename(sub, e.currentTarget.value)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    e.stopPropagation()
                    setEditing(null)
                  }
                }}
                onBlur={(e: ChangeEvent<HTMLInputElement>) => editing === sub.id && rename(sub, e.target.value)}
              />
            ) : (
              <button
                type="button"
                className={cn('min-w-0 flex-1 truncate text-left text-[13px]', sub.is_completed && 'text-zinc-400 line-through')}
                title="Click to rename"
                onClick={() => setEditing(sub.id)}
              >
                {sub.title}
              </button>
            )}
            <button
              type="button"
              className="btn-icon size-6 opacity-0 group-hover/sub:opacity-100 hover:text-red-600 focus-visible:opacity-100"
              aria-label="Delete subtask"
              onClick={() => guard(mutations.removeSubtask(task.id, sub.id))}
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form className="mt-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5" onSubmit={add}>
        <span className="w-3.5" />
        <Plus className="size-[18px] text-zinc-400" />
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[13px] placeholder:text-zinc-400 focus:outline-none"
          placeholder="Add a subtask and press Enter"
          aria-label="New subtask"
          maxLength={255}
        />
      </form>
    </div>
  )
}
