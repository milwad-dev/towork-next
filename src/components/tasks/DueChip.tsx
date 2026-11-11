import { CalendarDays } from 'lucide-react'
import { dueTone, formatDue, formatTime, type DueTone } from '@/lib/dates'

export const DUE_CLASSES: Record<DueTone, string> = {
  overdue: 'text-red-600 dark:text-red-400',
  today: 'text-green-600 dark:text-green-400',
  soon: 'text-amber-600 dark:text-amber-400',
  later: 'text-zinc-500 dark:text-zinc-400',
  none: 'text-zinc-500',
}

export function DueChip({ date, time, done = false }: { date: string | null; time?: string | null; done?: boolean }) {
  if (!date) return null
  const tone = dueTone(date, done)
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${DUE_CLASSES[tone]}`}>
      <CalendarDays className="size-3.5" />
      {formatDue(date)}
      {time && ` · ${formatTime(time)}`}
      {tone === 'overdue' && <span className="sr-only">(overdue)</span>}
    </span>
  )
}
