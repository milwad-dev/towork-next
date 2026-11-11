import type { Metadata } from 'next'
import { ClientOnly, PageSkeleton } from '@/components/ui/ClientOnly'
import { SettingsView } from '@/components/settings/SettingsView'

export const metadata: Metadata = { title: 'Settings' }

export default function Page() {
  return (
    <ClientOnly fallback={<PageSkeleton />}>
      <SettingsView />
    </ClientOnly>
  )
}
