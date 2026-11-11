import { describe, expect, it } from 'vitest'
import { dayHeading, dueTone, formatDue, fromLocalInput, monthGrid, parseDate, toLocalInput } from '../dates'

const now = new Date(2030, 5, 15, 12) // Saturday 15 June 2030

describe('dates', () => {
  it('parses API dates as local dates', () => {
    const d = parseDate('2030-06-15')!
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2030, 5, 15])
    expect(parseDate(null)).toBeNull()
    expect(parseDate('nope')).toBeNull()
  })

  it('formats due dates relative to today', () => {
    expect(formatDue('2030-06-15', now)).toBe('Today')
    expect(formatDue('2030-06-16', now)).toBe('Tomorrow')
    expect(formatDue('2030-06-14', now)).toBe('Yesterday')
    expect(formatDue('2030-06-19', now)).toBe('Wednesday')
    expect(formatDue('2030-07-30', now)).toBe('Jul 30')
    expect(formatDue('2031-01-02', now)).toBe('Jan 2, 2031')
  })

  it('picks a tone for due chips', () => {
    expect(dueTone('2030-06-10', false, now)).toBe('overdue')
    expect(dueTone('2030-06-10', true, now)).toBe('later')
    expect(dueTone('2030-06-15', false, now)).toBe('today')
    expect(dueTone('2030-06-17', false, now)).toBe('soon')
    expect(dueTone('2030-06-30', false, now)).toBe('later')
    expect(dueTone(null, false, now)).toBe('none')
  })

  it('builds day headings', () => {
    expect(dayHeading('2030-06-15', now)).toBe('Today · Sat, Jun 15')
    expect(dayHeading('2030-06-16', now)).toBe('Tomorrow · Sun, Jun 16')
    expect(dayHeading(null, now)).toBe('No date')
  })

  it('builds a Monday-first month grid', () => {
    const grid = monthGrid(new Date(2030, 5, 1))
    expect(grid.length % 7).toBe(0)
    expect(grid[0].getDay()).toBe(1)
    expect(grid.at(-1)!.getDay()).toBe(0)
  })

  it('round-trips datetime-local values', () => {
    const iso = fromLocalInput('2030-06-15T09:30')!
    expect(toLocalInput(iso)).toBe('2030-06-15T09:30')
    expect(fromLocalInput('')).toBeNull()
  })
})
