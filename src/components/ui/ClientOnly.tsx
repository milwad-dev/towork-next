'use client'

import type { ReactNode } from 'react'
import { useHydrated } from '@/hooks/useHydrated'

/**
 * Renders children only in the browser. App screens depend on the user's
 * clock and timezone ("today", the current month), so they must not be
 * prerendered on the server.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return useHydrated() ? children : fallback
}

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10" aria-busy="true" aria-label="Loading">
      <div className="mb-6 flex items-start gap-3">
        <span className="skeleton mt-1 size-9 rounded-xl" />
        <div className="flex-1 space-y-2 pt-1">
          <span className="skeleton block h-6 w-40" />
          <span className="skeleton block h-3.5 w-56" />
        </div>
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <span className="skeleton size-[18px] rounded-full" />
          <span className="skeleton h-3.5" style={{ width: `${40 + ((i * 37) % 45)}%` }} />
        </div>
      ))}
    </div>
  )
}
