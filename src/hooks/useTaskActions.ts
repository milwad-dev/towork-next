'use client'

import { errorMessage } from '@/lib/api'
import { useTaskMutations } from '@/lib/queries'
import type { Task, TaskInput } from '@/lib/types'
import { closeTask, confirm, toast, uiStore } from '@/lib/ui'

/** Shared task actions with toasts, undo and confirmation. */
export function useTaskActions() {
  const tasks = useTaskMutations()

  async function toggle(task: Task) {
    const wasDone = task.status === 'done'
    try {
      await tasks.toggle(task.id)
      if (!wasDone) {
        toast('Task completed', { action: { label: 'Undo', handler: () => tasks.toggle(task.id).catch(() => {}) } })
      }
    } catch (e) {
      toast(errorMessage(e), { type: 'error' })
    }
  }

  async function update(task: Task, patch: TaskInput, message?: string) {
    try {
      const updated = await tasks.update(task.id, patch)
      if (message) toast(message)
      return updated
    } catch (e) {
      toast(errorMessage(e), { type: 'error' })
      return null
    }
  }

  async function remove(task: Task) {
    const ok = await confirm({
      title: 'Delete task?',
      message: `“${task.title}” and its subtasks will be permanently deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return false
    try {
      await tasks.remove(task.id)
      if (uiStore.get().openTaskId === task.id) closeTask()
      toast('Task deleted')
      return true
    } catch (e) {
      toast(errorMessage(e), { type: 'error' })
      return false
    }
  }

  return { toggle, update, remove, mutations: tasks }
}
