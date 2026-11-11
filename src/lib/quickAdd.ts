import { addDays } from 'date-fns'
import { toISODate } from './dates'
import type { Category, Label, Priority } from './types'

const PRIORITY_WORDS: Record<string, Priority> = { low: 1, medium: 2, med: 2, high: 3, urgent: 4 }

export interface QuickAddResult {
  title: string
  due_date?: string
  priority?: Priority
  category_id?: number
  label_ids: number[]
}

/**
 * Parse the light "natural" syntax of the quick-add input:
 *   - `today`, `tomorrow`                     → due date
 *   - `!low` `!medium` `!high` `!urgent`      → priority
 *   - `#Category`                             → category, matched case-insensitively by name
 *   - `@label`                                → label(s), matched case-insensitively by name
 * Tokens that don't match anything are left in the title.
 */
export function parseQuickAdd(
  input: string,
  {
    categories = [],
    labels = [],
    now = new Date(),
  }: { categories?: Pick<Category, 'id' | 'name'>[]; labels?: Pick<Label, 'id' | 'name'>[]; now?: Date } = {},
): QuickAddResult {
  const result: QuickAddResult = { title: '', label_ids: [] }
  const kept: string[] = []
  const squash = (s: string) => s.toLowerCase().replace(/\s+/g, '')

  for (const token of String(input).trim().split(/\s+/)) {
    if (!token) continue
    const lower = token.toLowerCase()

    if (lower === 'today') {
      result.due_date = toISODate(now)
      continue
    }
    if (lower === 'tomorrow') {
      result.due_date = toISODate(addDays(now, 1))
      continue
    }
    if (lower.startsWith('!') && PRIORITY_WORDS[lower.slice(1)]) {
      result.priority = PRIORITY_WORDS[lower.slice(1)]
      continue
    }
    if (lower.startsWith('#') && lower.length > 1) {
      const cat = categories.find((c) => squash(c.name) === lower.slice(1))
      if (cat) {
        result.category_id = cat.id
        continue
      }
    }
    if (lower.startsWith('@') && lower.length > 1) {
      const label = labels.find((l) => squash(l.name) === lower.slice(1))
      if (label) {
        if (!result.label_ids.includes(label.id)) result.label_ids.push(label.id)
        continue
      }
    }
    kept.push(token)
  }

  result.title = kept.join(' ').trim()
  return result
}
