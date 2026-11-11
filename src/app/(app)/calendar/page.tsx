import type { Metadata } from 'next'
import { ClientOnly, PageSkeleton } from '@/components/ui/ClientOnly'
import { CalendarView } from '@/components/calendar/CalendarView'

export const metadata: Metadata = { title: 'Calendar' }

export default function Page() {
  return (
    <ClientOnly fallback={<PageSkeleton />}>
      <CalendarView />
    </ClientOnly>
  )
}
