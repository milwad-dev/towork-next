'use client'

import { CornerDownLeft, Plus } from 'lucide-react'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { errorMessage, fieldErrors } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useCategories, useLabels, useTaskMutations } from '@/lib/queries'
import { parseQuickAdd } from '@/lib/quickAdd'
import type { Priority, Task, TaskInput } from '@/lib/types'
import { openTask, toast } from '@/lib/ui'
import { CategoryPicker } from './CategoryPicker'
import { DuePicker } from './DuePicker'
import { LabelPicker } from './LabelPicker'
import { PriorityPicker } from './PriorityPicker'

export interface QuickAddHandle {
  focus: () => void
}

interface Form {
  title: string
  description: string
  due_date: string | null
  due_time: string | null
  priority: Priority
  category_id: number | null
  label_ids: number[]
}

/**
 * Inline task composer. Type a title and press Enter. Supports `today`,
 * `tomorrow`, `!high`, `#category` and `@label` shortcuts, or the pickers.
 */
export const QuickAdd = forwardRef<
  QuickAddHandle,
  {
    defaults?: Partial<TaskInput>
    /** Always show the expanded composer (used in dialogs). */
    expanded?: boolean
    placeholder?: string
    onCreated?: (task: Task) => void
    onCancel?: () => void
  }
>(function QuickAdd({ defaults = {}, expanded = false, placeholder = 'Add a task', onCreated, onCancel }, ref) {
  const { data: categories = [] } = useCategories()
  const { data: labels = [] } = useLabels()
  const tasks = useTaskMutations()
  const input = useRef<HTMLInputElement>(null)

  const blank = (): Form => ({
    title: '',
    description: '',
    due_date: defaults.due_date ?? null,
    due_time: null,
    priority: defaults.priority ?? 1,
    category_id: defaults.category_id ?? null,
    label_ids: defaults.label_ids ? [...defaults.label_ids] : [],
  })
  const [form, setForm] = useState<Form>(blank)
  const [focused, setFocused] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }))

  const open = expanded || focused || !!form.title
  const parsed = useMemo(() => parseQuickAdd(form.title, { categories, labels }), [form.title, categories, labels])
  const hints: string[] = []
  if (parsed.due_date && parsed.due_date !== form.due_date) hints.push('date')
  if (parsed.priority && parsed.priority !== form.priority) hints.push('priority')
  if (parsed.category_id && parsed.category_id !== form.category_id)
    hints.push(`#${categories.find((c) => c.id === parsed.category_id)?.name}`)
  for (const id of parsed.label_ids) if (!form.label_ids.includes(id)) hints.push(`@${labels.find((l) => l.id === id)?.name}`)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!parsed.title || saving) return
    setSaving(true)
    setError('')
    try {
      const payload: TaskInput = {
        title: parsed.title,
        description: form.description || null,
        due_date: parsed.due_date ?? form.due_date,
        due_time: form.due_time,
        priority: parsed.priority ?? form.priority,
        category_id: parsed.category_id ?? form.category_id,
        label_ids: [...new Set([...form.label_ids, ...parsed.label_ids])],
      }
      if (defaults.status) payload.status = defaults.status
      const task = await tasks.create(payload)
      onCreated?.(task)
      toast('Task added', { action: { label: 'Open', handler: () => openTask(task.id) } })
      setForm(blank())
      requestAnimationFrame(() => input.current?.focus())
    } catch (err) {
      setError(Object.values(fieldErrors(err))[0] || errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setForm(blank())
    setError('')
    input.current?.blur()
    setFocused(false)
    onCancel?.()
  }

  return (
    <form
      className={cn(
        'rounded-xl border transition',
        open ? 'border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900',
      )}
      onSubmit={submit}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Stay open while focus moves into a picker (portaled popovers count as outside).
        const next = e.relatedTarget as HTMLElement | null
        if (!e.currentTarget.contains(next) && !next?.closest?.('.popover')) setFocused(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          cancel()
        }
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span
          className={cn(
            'flex size-[18px] shrink-0 items-center justify-center rounded-full text-accent-600 dark:text-accent-400',
            open ? 'border-[1.5px] border-dashed border-zinc-300 dark:border-zinc-600' : 'bg-accent-500/10',
          )}
        >
          {!open && <Plus className="size-3.5" strokeWidth={2.5} />}
        </span>
        <input
          ref={input}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-6 placeholder:text-zinc-400 focus:outline-none"
          placeholder={open ? 'Task name' : placeholder}
          aria-label="New task title"
          maxLength={255}
          data-quick-add
          autoFocus={expanded}
        />
      </div>
      {open && (
        <div className="px-3 pb-3 pl-[42px]">
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-transparent text-[13px] text-zinc-600 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-400"
            placeholder="Description"
            aria-label="Description"
          />
          {hints.length ? (
            <p className="mt-1.5 text-xs text-accent-600 dark:text-accent-400">Detected: {hints.join(', ')}</p>
          ) : (
            !form.title && (
              <p className="mt-1.5 hidden text-xs text-zinc-400 sm:block">
                Tip: try “Call Sam <span className="font-medium">tomorrow !high #Work @phone</span>”
              </p>
            )
          )}
          {error && <p className="field-error">{error}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <DuePicker date={form.due_date} time={form.due_time} withTime onChange={(due_date, due_time) => setForm({ ...form, due_date, due_time })} />
            <PriorityPicker value={form.priority} compact onChange={(priority) => setForm({ ...form, priority })} />
            <CategoryPicker value={form.category_id} onChange={(category_id) => setForm({ ...form, category_id })} />
            <LabelPicker value={form.label_ids} onChange={(label_ids) => setForm({ ...form, label_ids })} />
            <div className="ml-auto flex items-center gap-1.5 max-sm:mt-1 max-sm:w-full max-sm:justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={!parsed.title || saving}>
                {saving && <Spinner />} Add task <CornerDownLeft className="size-3.5 opacity-70" />
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
})
