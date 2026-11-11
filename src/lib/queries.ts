'use client'

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import { api } from './api'
import { matchesParams, normalizeParams } from './taskQuery'
import type { Category, Label, Paginated, Stats, Subtask, Task, TaskInput, TaskParams, TaskStatus, User } from './types'

export const keys = {
  me: ['me'] as const,
  categories: ['categories'] as const,
  labels: ['labels'] as const,
  stats: ['stats'] as const,
  tasks: ['tasks'] as const,
  taskList: (params: TaskParams) => ['tasks', 'list', normalizeParams(params)] as const,
  task: (id: number) => ['tasks', 'detail', id] as const,
}

type TaskPages = InfiniteData<Paginated<Task>, number>

// ---------------------------------------------------------------- user

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api.get<{ data: User }>('me').then((r) => r.data),
    staleTime: 60_000,
  })
}

export function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

// ---------------------------------------------------------------- categories & labels

type CollectionKind = 'categories' | 'labels'
type CollectionItem<K extends CollectionKind> = K extends 'categories' ? Category : Label

function useCollection<K extends CollectionKind>(kind: K) {
  return useQuery({
    queryKey: [kind],
    queryFn: () =>
      api
        .get<{ data: CollectionItem<K>[] }>(kind)
        .then((r) => [...r.data].sort((a, b) => a.name.localeCompare(b.name))),
    staleTime: 30_000,
  })
}

export const useCategories = () => useCollection('categories')
export const useLabels = () => useCollection('labels')

export function useCollectionMutations(kind: CollectionKind) {
  const qc = useQueryClient()
  const refresh = () => {
    qc.invalidateQueries({ queryKey: [kind] })
    qc.invalidateQueries({ queryKey: keys.tasks })
    qc.invalidateQueries({ queryKey: keys.stats })
  }
  return {
    create: (payload: Partial<Category>) =>
      api.post<{ data: Category }>(kind, payload).then((r) => {
        refresh()
        return r.data
      }),
    update: (id: number, payload: Partial<Category>) =>
      api.put<{ data: Category }>(`${kind}/${id}`, payload).then((r) => {
        refresh()
        return r.data
      }),
    remove: (id: number) => api.delete(`${kind}/${id}`).then(refresh),
  }
}

// ---------------------------------------------------------------- tasks

export function useTaskList(params: TaskParams, enabled = true) {
  const normalized = normalizeParams(params)
  return useInfiniteQuery({
    queryKey: keys.taskList(normalized),
    queryFn: ({ pageParam, signal }) =>
      api.get<Paginated<Task>>('tasks', { ...(normalized as Record<string, string>), page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    enabled,
  })
}

export function useTask(id: number | null) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: keys.task(id ?? 0),
    queryFn: () => api.get<{ data: Task }>(`tasks/${id}`).then((r) => r.data),
    enabled: id !== null,
    // Show the copy from a list instantly while the full task loads.
    placeholderData: () => (id === null ? undefined : findCachedTask(qc, id)),
  })
}

export function useStats() {
  return useQuery({
    queryKey: keys.stats,
    queryFn: () => api.get<{ data: Stats }>('stats').then((r) => r.data),
  })
}

export function searchTasks(term: string, perPage = 8) {
  return api.get<Paginated<Task>>('tasks', { search: term, per_page: perPage, sort: 'created_at' }).then((r) => r.data)
}

function findCachedTask(qc: QueryClient, id: number): Task | undefined {
  for (const [, data] of qc.getQueriesData<TaskPages>({ queryKey: [...keys.tasks, 'list'] })) {
    for (const page of data?.pages ?? []) {
      const t = page.data.find((x) => x.id === id)
      if (t) return t
    }
  }
  return undefined
}

/** Apply a change to every cached copy of a task (lists and detail). */
export function patchCachedTask(qc: QueryClient, id: number, fn: (t: Task) => Task) {
  qc.setQueriesData<TaskPages>({ queryKey: [...keys.tasks, 'list'] }, (data) =>
    data
      ? { ...data, pages: data.pages.map((p) => ({ ...p, data: p.data.map((t) => (t.id === id ? fn(t) : t)) })) }
      : data,
  )
  qc.setQueryData<Task>(keys.task(id), (t) => (t ? fn(t) : t))
}

/** Put a server task into every cache: replace it, drop it from lists it no longer matches. */
function storeTask(qc: QueryClient, task: Task) {
  for (const [key, data] of qc.getQueriesData<TaskPages>({ queryKey: [...keys.tasks, 'list'] })) {
    if (!data) continue
    const params = (key[2] ?? {}) as TaskParams
    const matches = matchesParams(task, params)
    const exists = data.pages.some((p) => p.data.some((t) => t.id === task.id))
    if (!exists && !matches) continue
    qc.setQueryData<TaskPages>(key, {
      ...data,
      pages: data.pages.map((p, i) => {
        let rows = p.data.map((t) => (t.id === task.id ? task : t))
        if (exists && !matches) rows = rows.filter((t) => t.id !== task.id)
        if (!exists && matches && i === data.pages.length - 1) rows = [...rows, task]
        return { ...p, data: rows }
      }),
    })
  }
  qc.setQueryData(keys.task(task.id), task)
}

function snapshot(qc: QueryClient) {
  return qc.getQueriesData({ queryKey: keys.tasks })
}
function restore(qc: QueryClient, snap: ReturnType<typeof snapshot>) {
  for (const [key, data] of snap) qc.setQueryData(key, data)
}

/** Counters in the sidebar and dashboard depend on tasks. */
function touchCounts(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: keys.categories })
  qc.invalidateQueries({ queryKey: keys.labels })
  qc.invalidateQueries({ queryKey: keys.stats })
}

const completedAt = (status: TaskStatus) => (status === 'done' ? new Date().toISOString() : null)

export function useTaskMutations() {
  const qc = useQueryClient()

  async function create(payload: TaskInput): Promise<Task> {
    const { data } = await api.post<{ data: Task }>('tasks', payload)
    storeTask(qc, data)
    touchCounts(qc)
    return data
  }

  /** Optimistically patch a task; rolls back on failure. */
  async function update(id: number, patch: TaskInput): Promise<Task> {
    const snap = snapshot(qc)
    patchCachedTask(qc, id, (t) => ({
      ...t,
      ...(patch as Partial<Task>),
      ...(patch.status ? { completed_at: completedAt(patch.status) } : {}),
    }))
    try {
      const { data } = await api.patch<{ data: Task }>(`tasks/${id}`, patch)
      storeTask(qc, data)
      if ('category_id' in patch || 'label_ids' in patch || 'status' in patch || 'due_date' in patch) touchCounts(qc)
      return data
    } catch (e) {
      restore(qc, snap)
      throw e
    }
  }

  async function toggle(id: number): Promise<Task> {
    const snap = snapshot(qc)
    patchCachedTask(qc, id, (t) => {
      const status: TaskStatus = t.status === 'done' ? 'todo' : 'done'
      return { ...t, status, completed_at: completedAt(status) }
    })
    try {
      const { data } = await api.patch<{ data: Task }>(`tasks/${id}/toggle`)
      // Keep it visible in the current list until the next refetch (so "Undo" makes sense).
      patchCachedTask(qc, id, () => data)
      touchCounts(qc)
      return data
    } catch (e) {
      restore(qc, snap)
      throw e
    }
  }

  async function remove(id: number): Promise<void> {
    const snap = snapshot(qc)
    qc.setQueriesData<TaskPages>({ queryKey: [...keys.tasks, 'list'] }, (data) =>
      data ? { ...data, pages: data.pages.map((p) => ({ ...p, data: p.data.filter((t) => t.id !== id) })) } : data,
    )
    try {
      await api.delete(`tasks/${id}`)
      qc.removeQueries({ queryKey: keys.task(id) })
      touchCounts(qc)
    } catch (e) {
      restore(qc, snap)
      throw e
    }
  }

  /** Persist Kanban order. `columns` holds every column's tasks in their new order. */
  async function reorder(columns: Record<TaskStatus, Task[]>): Promise<void> {
    const payload: { id: number; status: TaskStatus; position: number }[] = []
    for (const [status, tasks] of Object.entries(columns) as [TaskStatus, Task[]][]) {
      tasks.forEach((task, position) => {
        payload.push({ id: task.id, status, position })
        patchCachedTask(qc, task.id, (t) => ({
          ...t,
          status,
          position,
          completed_at: t.status === status ? t.completed_at : completedAt(status),
        }))
      })
    }
    await api.post('tasks/reorder', { tasks: payload })
    touchCounts(qc)
  }

  function patchSubtasks(taskId: number, fn: (list: Subtask[]) => Subtask[]) {
    patchCachedTask(qc, taskId, (t) => {
      const subtasks = fn(t.subtasks ?? [])
      return {
        ...t,
        subtasks,
        subtasks_count: subtasks.length,
        completed_subtasks_count: subtasks.filter((s) => s.is_completed).length,
      }
    })
  }

  async function addSubtask(taskId: number, title: string) {
    const { data } = await api.post<{ data: Subtask }>(`tasks/${taskId}/subtasks`, { title })
    patchSubtasks(taskId, (list) => [...list, data])
    return data
  }

  async function updateSubtask(taskId: number, subtaskId: number, patch: Partial<Subtask>) {
    patchSubtasks(taskId, (list) => list.map((s) => (s.id === subtaskId ? { ...s, ...patch } : s)))
    const { data } = await api.patch<{ data: Subtask }>(`subtasks/${subtaskId}`, patch)
    patchSubtasks(taskId, (list) => list.map((s) => (s.id === subtaskId ? data : s)))
    return data
  }

  async function removeSubtask(taskId: number, subtaskId: number) {
    patchSubtasks(taskId, (list) => list.filter((s) => s.id !== subtaskId))
    await api.delete(`subtasks/${subtaskId}`)
  }

  return { create, update, toggle, remove, reorder, addSubtask, updateSubtask, removeSubtask }
}

/** Flatten an infinite task query. */
export function flatTasks(data: { pages: Paginated<Task>[] } | undefined): Task[] {
  return data?.pages.flatMap((p) => p.data) ?? []
}

// ---------------------------------------------------------------- auth

export function useAuthActions() {
  const qc = useQueryClient()
  return {
    async login(payload: { login: string; password: string }) {
      const r = await api.post<{ data: { user: User } }>('auth/login', payload, { skipAuthRedirect: true })
      qc.clear()
      qc.setQueryData(keys.me, r.data.user)
      return r.data.user
    },
    async register(payload: Record<string, string>) {
      const r = await api.post<{ data: { user: User } }>('auth/register', payload)
      qc.clear()
      qc.setQueryData(keys.me, r.data.user)
      return r.data.user
    },
    async logout() {
      await api.post('auth/logout', undefined, { skipAuthRedirect: true }).catch(() => {})
      qc.clear()
    },
    async updateProfile(payload: { name: string; email: string; phone?: string | null }) {
      const r = await api.put<{ data: User }>('me', payload)
      qc.setQueryData(keys.me, r.data)
      return r.data
    },
    updatePassword: (payload: Record<string, string>) => api.put('me/password', payload),
    async deleteAccount(password: string) {
      await api.delete('me', { password })
      qc.clear()
    },
    sendVerification: () => api.post<{ message: string }>('auth/email/verification-notification'),
    async verifyEmail(code: string) {
      const r = await api.post<{ data: User }>('auth/email/verify', { code })
      qc.setQueryData(keys.me, r.data)
      return r.data
    },
  }
}
