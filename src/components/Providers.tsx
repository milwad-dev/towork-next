'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api'
import { applyTheme, hydrateUi } from '@/lib/ui'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { ToastStack } from './ui/ToastStack'

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: true,
            // Don't retry client errors (401/403/404/422).
            retry: (count, error) =>
              !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
          },
        },
      }),
  )

  useEffect(() => {
    hydrateUi()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [])

  return (
    <QueryClientProvider client={client}>
      {children}
      <ToastStack />
      <ConfirmDialog />
    </QueryClientProvider>
  )
}
