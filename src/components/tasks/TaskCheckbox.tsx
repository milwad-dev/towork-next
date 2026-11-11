'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'
import { priorityOf } from '@/lib/constants'
import { cn } from '@/lib/cn'

export function TaskCheckbox({
  checked,
  priority = 1,
  label = 'Mark as complete',
  onToggle,
}: {
  checked: boolean
  priority?: number
  label?: string
  onToggle: () => void
}) {
  const [popping, setPopping] = useState(false)

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? 'Mark as not done' : label}
      className={cn(
        'group/check relative flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200',
        checked ? 'border-accent-500 bg-accent-500' : cn(priorityOf(priority).ring, 'hover:bg-accent-500/10'),
        popping && 'animate-pop',
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (!checked) {
          setPopping(true)
          setTimeout(() => setPopping(false), 400)
        }
        onToggle()
      }}
    >
      <Check
        className={cn(
          'size-3 transition-all duration-200',
          checked ? 'scale-100 text-white opacity-100' : 'scale-75 text-zinc-400 opacity-0 group-hover/check:opacity-60',
        )}
        strokeWidth={3}
      />
      {popping && <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-accent-500/40" />}
    </button>
  )
}
