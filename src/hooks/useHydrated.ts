'use client'

import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/** False during SSR and hydration, true afterwards (safe for portals). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
