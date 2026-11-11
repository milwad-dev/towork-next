'use client'

import { Check } from 'lucide-react'
import { Popover } from '@/components/ui/Popover'
import { cn } from '@/lib/cn'
import { PRIORITIES, priorityOf } from '@/lib/constants'
import type { Priority } from '@/lib/types'
import { PriorityFlag } from './PriorityFlag'

export function PriorityPicker({
  value,
  onChange,
  compact = false,
}: {
  value: Priority
  onChange: (p: Priority) => void
  compact?: boolean
}) {
  return (
    <Popover
      width="w-44"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className={cn(
            'btn btn-sm border font-normal hover:bg-zinc-100 dark:hover:bg-zinc-800',
            value > 1
              ? 'border-zinc-200 dark:border-zinc-700'
              : 'border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700',
            open && 'bg-zinc-100 dark:bg-zinc-800',
          )}
          aria-expanded={open}
          aria-label="Priority"
          onClick={toggle}
        >
          <PriorityFlag priority={value} />
          {(!compact || value > 1) && <span>{priorityOf(value).label}</span>}
        </button>
      )}
    >
      {({ close }) =>
        PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            className="menu-item"
            data-active={value === p.value}
            onClick={() => {
              onChange(p.value)
              close()
            }}
          >
            <PriorityFlag priority={p.value} className="size-4" /> {p.label}
            {value === p.value && <Check className="ml-auto size-4 text-accent-500" />}
          </button>
        ))
      }
    </Popover>
  )
}
