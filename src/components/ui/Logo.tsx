import { useId } from 'react'
import { cn } from '@/lib/cn'

export function Logo({
  size = 'size-7',
  withText = true,
  textClass = 'text-[15px]',
}: {
  size?: string
  withText?: boolean
  textClass?: string
}) {
  // Unique per instance: a hidden copy (e.g. the desktop sidebar on mobile) would
  // otherwise own a shared gradient id and the visible logo would render blank.
  const gradientId = `towork-logo-${useId().replace(/:/g, '')}`
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg className={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
        <path
          d="M19 33.5l8.5 8.5L45 23"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withText && <span className={cn('font-semibold tracking-tight', textClass)}>ToWork</span>}
    </span>
  )
}
