import { addDays } from 'date-fns'
import { parseDate, todayISO, toISODate } from './dates'
import type { Task, TaskParams } from './types'

const list = (v: unknown): string[] =>
  (Array.isArray(v) ? v.map(String) : String(v ?? '').split(',')).filter(Boolean)

/** Client-side check that mirrors the API filters, used for optimistic inserts. */
export function matchesParams(task: Task, params: TaskParams = {}, today = todayISO()): boolean {
  if (params.status && list(params.status).length && !list(params.status).includes(task.status)) return false
  if (params.priority && list(params.priority).length && !list(params.priority).map(Number).includes(task.priority))
    return false
  if (params.category_id !== undefined && params.category_id !== '') {
    if (params.category_id === 'none' ? task.category_id : task.category_id !== Number(params.category_id)) return false
  }
  if (params.label_id && !task.labels?.some((l) => l.id === Number(params.label_id))) return false
  if (params.search) {
    const q = params.search.toLowerCase()
    if (!task.title.toLowerCase().includes(q) && !(task.description ?? '').toLowerCase().includes(q)) return false
  }
  const due = task.due_date
  if (params.date_from && (!due || due < params.date_from)) return false
  if (params.date_to && (!due || due > params.date_to)) return false
  switch (params.due) {
    case 'today':
      return due === today
    case 'overdue':
      return !!due && due < today && task.status !== 'done'
    case 'upcoming':
      return !!due && due > today
    case 'scheduled':
      return !!due
    case 'none':
      return !due
    case 'week': {
      if (!due) return false
      const end = toISODate(addDays(parseDate(today) ?? new Date(), 6))
      return due >= today && due <= end
    }
  }
  return true
}

/** Stable query key params: drop empty values so equivalent filters share a cache entry. */
export function normalizeParams(params: TaskParams): TaskParams {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) {
      if (v.length) out[k] = [...v].sort()
      continue
    }
    out[k] = v
  }
  return out as TaskParams
}
