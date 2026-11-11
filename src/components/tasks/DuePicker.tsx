'use client'

import { CalendarArrowUp, CalendarDays, CalendarX2, Sun, Sunrise } from 'lucide-react'
import { Popover } from '@/components/ui/Popover'
import { cn } from '@/lib/cn'
import { dueTone, formatDue, formatTime, quickDates } from '@/lib/dates'

const icons = { today: Sun, tomorrow: Sunrise, 'next-week': CalendarArrowUp }
const tones: Partial<Record<string, string>> = {
  overdue: 'text-red-600 dark:text-red-400',
  today: 'text-green-600 dark:text-green-400',
  soon: 'text-amber-600 dark:text-amber-400',
}

export function DuePicker({
  date,
  time = null,
  onChange,
  withTime = false,
  compact = false,
}: {
  date: string | null
  time?: string | null
  /** Called with the new date and time (time is cleared with the date). */
  onChange: (date: string | null, time: string | null) => void
  withTime?: boolean
  compact?: boolean
}) {
  const toneClass = tones[dueTone(date)] ?? 'text-zinc-700 dark:text-zinc-300'

  return (
    <Popover
      width="w-64"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className={cn(
            'btn btn-sm border border-dashed border-zinc-300 font-normal hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
            date ? cn('border-solid', toneClass) : 'text-zinc-500',
            open && 'bg-zinc-100 dark:bg-zinc-800',
          )}
          aria-expanded={open}
          aria-label="Due date"
          onClick={toggle}
        >
          <CalendarDays className="size-3.5" />
          {date ? (
            <span>
              {formatDue(date)}
              {time && withTime && ` · ${formatTime(time)}`}
            </span>
          ) : (
            !compact && <span>Due date</span>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <>
          {quickDates().map((o) => {
            const Icon = icons[o.key as keyof typeof icons]
            return (
              <button
                key={o.key}
                type="button"
                className="menu-item"
                onClick={() => {
                  onChange(o.value, time)
                  close()
                }}
              >
                <Icon className="size-4 text-zinc-400" /> {o.label}
                <span className="ml-auto text-xs text-zinc-400">
                  {formatDue(o.value) === o.label ? '' : formatDue(o.value)}
                </span>
              </button>
            )
          })}
          {date && (
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                onChange(null, null)
                close()
              }}
            >
              <CalendarX2 className="size-4 text-zinc-400" /> No date
            </button>
          )}
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          <div className="space-y-2 p-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-500">Pick a date</span>
              <input
                type="date"
                className="input h-9"
                value={date ?? ''}
                onChange={(e) => onChange(e.target.value || null, e.target.value ? time : null)}
              />
            </label>
            {withTime && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-500">Time (optional)</span>
                <input
                  type="time"
                  className="input h-9"
                  value={time ?? ''}
                  disabled={!date}
                  onChange={(e) => onChange(date, e.target.value || null)}
                />
              </label>
            )}
          </div>
        </>
      )}
    </Popover>
  )
}
