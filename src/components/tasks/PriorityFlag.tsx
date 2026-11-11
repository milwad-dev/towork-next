import { Flag } from 'lucide-react'
import { priorityOf } from '@/lib/constants'

export function PriorityFlag({ priority, className = 'size-3.5' }: { priority: number; className?: string }) {
  const p = priorityOf(priority)
  return (
    <Flag
      className={`${className} ${p.flag}`}
      fill={priority >= 3 ? 'currentColor' : 'none'}
      aria-label={`${p.label} priority`}
    />
  )
}
