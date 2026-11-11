import type { Metadata } from 'next'
import { ClientOnly, PageSkeleton } from '@/components/ui/ClientOnly'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { TasksView } from '@/components/tasks/TasksView'

export const metadata: Metadata = { title: 'Label' }

async function View({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  return (
    <ClientOnly fallback={<PageSkeleton />}>
      <TasksView key={id} mode="label" id={Number(id)} />
    </ClientOnly>
  )
}

export default function Page({ params }: PageProps<'/labels/[id]'>) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <View params={params} />
    </Suspense>
  )
}
