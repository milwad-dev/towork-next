import { describe, expect, it } from 'vitest'
import { parseQuickAdd } from '../quickAdd'

const now = new Date(2030, 5, 15) // 15 June 2030, local time
const categories = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Side Project' },
]
const labels = [
  { id: 7, name: 'focus' },
  { id: 8, name: 'quick-win' },
]

describe('parseQuickAdd', () => {
  it('returns the plain title when there are no tokens', () => {
    expect(parseQuickAdd('Buy milk', { now })).toEqual({ title: 'Buy milk', label_ids: [] })
  })

  it('parses dates, priority, category and labels', () => {
    const r = parseQuickAdd('Call Sam tomorrow !high #work @focus @quick-win', { categories, labels, now })
    expect(r).toEqual({ title: 'Call Sam', due_date: '2030-06-16', priority: 3, category_id: 1, label_ids: [7, 8] })
  })

  it('understands today and every priority word', () => {
    expect(parseQuickAdd('x today', { now }).due_date).toBe('2030-06-15')
    expect(parseQuickAdd('x !low').priority).toBe(1)
    expect(parseQuickAdd('x !med').priority).toBe(2)
    expect(parseQuickAdd('x !urgent').priority).toBe(4)
  })

  it('matches multi-word category names without spaces', () => {
    expect(parseQuickAdd('Ship it #sideproject', { categories }).category_id).toBe(2)
  })

  it('keeps unknown tokens in the title and de-duplicates labels', () => {
    const r = parseQuickAdd('Fix #bug @focus @focus !nope', { categories, labels, now })
    expect(r.title).toBe('Fix #bug !nope')
    expect(r.label_ids).toEqual([7])
  })
})
