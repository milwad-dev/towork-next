import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'accent',
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  tone?: 'accent' | 'green'
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="relative mb-5">
        <div className={cn('absolute inset-0 -z-10 scale-150 rounded-full blur-2xl', tone === 'green' ? 'bg-green-500/15' : 'bg-accent-500/15')} />
        <div
          className={cn(
            'flex size-14 items-center justify-center rounded-2xl border bg-white shadow-soft dark:bg-zinc-900',
            tone === 'green' ? 'border-green-500/20 text-green-500' : 'border-accent-500/20 text-accent-500',
          )}
        >
          <Icon className="size-6" />
        </div>
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-[13px] text-zinc-500 dark:text-zinc-400">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
