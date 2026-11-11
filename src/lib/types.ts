/** API models, see towork-backend docs/api-v1.md. */

export type ColorKey =
  | 'slate'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'teal'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'pink'
  | 'rose'

export type TaskStatus = 'todo' | 'in_progress' | 'done'
/** 1 = low, 2 = medium, 3 = high, 4 = urgent */
export type Priority = 1 | 2 | 3 | 4

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  email_verified_at: string | null
  created_at: string
}

export interface Category {
  id: number
  name: string
  color: ColorKey
  icon: string | null
  tasks_count?: number
  open_tasks_count?: number
  created_at?: string
}

export interface Label {
  id: number
  name: string
  color: ColorKey
  tasks_count?: number
  open_tasks_count?: number
  created_at?: string
}

export interface Subtask {
  id: number
  task_id: number
  title: string
  is_completed: boolean
  position: number
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  due_date: string | null
  due_time: string | null
  remind_at: string | null
  completed_at: string | null
  position: number
  is_overdue: boolean
  category_id: number | null
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null
  labels: Pick<Label, 'id' | 'name' | 'color'>[]
  subtasks: Subtask[]
  subtasks_count: number
  completed_subtasks_count: number
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface Stats {
  totals: {
    all: number
    todo: number
    in_progress: number
    done: number
    overdue: number
    due_today: number
    upcoming: number
  }
  completion_rate: number
  by_priority: Record<'1' | '2' | '3' | '4', number>
  by_category: { id: number; name: string; color: ColorKey; total: number; done: number }[]
  activity: { date: string; created: number; completed: number }[]
  streak: number
}

/** Query parameters accepted by GET /tasks. */
export interface TaskParams {
  search?: string
  status?: TaskStatus[] | string
  priority?: number[] | string
  category_id?: number | 'none' | string
  label_id?: number | string
  due?: 'today' | 'overdue' | 'upcoming' | 'week' | 'scheduled' | 'none'
  date_from?: string
  date_to?: string
  sort?: 'position' | 'created_at' | 'due_date' | 'priority' | 'title'
  direction?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

/** Fields accepted by POST/PATCH /tasks. */
export interface TaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: Priority
  category_id?: number | null
  label_ids?: number[]
  due_date?: string | null
  due_time?: string | null
  remind_at?: string | null
  subtasks?: string[]
}
