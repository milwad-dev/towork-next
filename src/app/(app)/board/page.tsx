import type { Metadata } from 'next'
import { ClientOnly, PageSkeleton } from '@/components/ui/ClientOnly'
import { BoardView } from '@/components/board/BoardView'

export const metadata: Metadata = { title: 'Board' }

export default function Page() {
  return (
    <ClientOnly fallback={<PageSkeleton />}>
      <BoardView />
    </ClientOnly>
  )
}
