import { describe, expect, it } from 'vitest'
import { toSearchParams } from '../api'
import { matchesParams, normalizeParams } from '../taskQuery'
import type { Task } from '../types'

const task = (patch: Partial<Task> = {}): Task => ({
  id: 1,
  title: 'Write report',
  description: 'Quarterly numbers',
  status: 'todo',
  priority: 3,
  due_date: '2030-06-15',
  due_time: null,
  remind_at: null,
  completed_at: null,
  position: 0,
  is_overdue: false,
  category_id: 2,
  category: { id: 2, name: 'Work', color: 'indigo', icon: 'briefcase' },
  labels: [{ id: 5, name: 'focus', color: 'violet' }],
  subtasks: [],
  subtasks_count: 0,
  completed_subtasks_count: 0,
  created_at: '',
  updated_at: '',
  ...patch,
})
const today = '2030-06-15'

describe('matchesParams', () => {
  it('matches status, priority, category and label filters', () => {
    expect(matchesParams(task(), { status: ['todo', 'in_progress'] }, today)).toBe(true)
    expect(matchesParams(task(), { status: 'done' }, today)).toBe(false)
    expect(matchesParams(task(), { priority: [3, 4] }, today)).toBe(true)
    expect(matchesParams(task(), { category_id: 2 }, today)).toBe(true)
    expect(matchesParams(task(), { category_id: 'none' }, today)).toBe(false)
    expect(matchesParams(task({ category_id: null }), { category_id: 'none' }, today)).toBe(true)
    expect(matchesParams(task(), { label_id: 5 }, today)).toBe(true)
    expect(matchesParams(task(), { label_id: 6 }, today)).toBe(false)
  })

  it('matches search in title or description', () => {
    expect(matchesParams(task(), { search: 'QUARTERLY' }, today)).toBe(true)
    expect(matchesParams(task(), { search: 'invoice' }, today)).toBe(false)
  })

  it('matches due windows and date ranges', () => {
    expect(matchesParams(task(), { due: 'today' }, today)).toBe(true)
    expect(matchesParams(task({ due_date: '2030-06-10' }), { due: 'overdue' }, today)).toBe(true)
    expect(matchesParams(task({ due_date: '2030-06-10', status: 'done' }), { due: 'overdue' }, today)).toBe(false)
    expect(matchesParams(task({ due_date: '2030-06-21' }), { due: 'week' }, today)).toBe(true)
    expect(matchesParams(task({ due_date: '2030-06-22' }), { due: 'week' }, today)).toBe(false)
    expect(matchesParams(task({ due_date: null }), { due: 'none' }, today)).toBe(true)
    expect(matchesParams(task(), { date_from: '2030-06-01', date_to: '2030-06-30' }, today)).toBe(true)
    expect(matchesParams(task(), { date_to: '2030-06-14' }, today)).toBe(false)
  })
})

describe('query helpers', () => {
  it('normalizes params into a stable cache key', () => {
    expect(normalizeParams({ search: '', status: ['todo', 'done'], priority: [], sort: 'title' })).toEqual({
      status: ['done', 'todo'],
      sort: 'title',
    })
  })

  it('serializes query strings with comma lists', () => {
    expect(toSearchParams({ status: ['todo', 'done'], page: 2, search: '', x: undefined })).toBe(
      '?status=todo%2Cdone&page=2',
    )
    expect(toSearchParams({})).toBe('')
  })
})
