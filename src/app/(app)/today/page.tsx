import type { Metadata } from 'next'
import { ClientOnly, PageSkeleton } from '@/components/ui/ClientOnly'
import { TasksView } from '@/components/tasks/TasksView'

export const metadata: Metadata = { title: 'Today' }

export default function Page() {
  return (
    <ClientOnly fallback={<PageSkeleton />}>
      <TasksView mode="today" />
    </ClientOnly>
  )
}
