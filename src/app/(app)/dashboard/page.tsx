import type { Metadata } from 'next'
import { ClientOnly, PageSkeleton } from '@/components/ui/ClientOnly'
import { DashboardView } from '@/components/dashboard/DashboardView'

export const metadata: Metadata = { title: 'Dashboard' }

export default function Page() {
  return (
    <ClientOnly fallback={<PageSkeleton />}>
      <DashboardView />
    </ClientOnly>
  )
}
