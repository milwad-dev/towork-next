import { AppShell } from '@/components/app/AppShell'

/**
 * The signed-in area is a client-rendered shell (it reads the pathname and the
 * user's session data). Opt it out of instant-navigation validation; pages
 * still prerender their static skeletons and load data on the client.
 */
export const instant = false

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return <AppShell>{children}</AppShell>
}
