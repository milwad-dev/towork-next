import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = { title: 'Not found' }

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-3xl" />
      <Logo withText={false} size="size-12" />
      <p className="mt-8 bg-gradient-to-b from-zinc-900 to-zinc-400 bg-clip-text text-8xl font-bold tracking-tighter text-transparent dark:from-white dark:to-zinc-600">
        404
      </p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight">This page took the day off</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      {/* "/" redirects to Today or to sign in, depending on the session cookie. */}
      <Link href="/" className="btn btn-primary btn-lg mt-8">
        <ArrowLeft className="size-4" /> Back to ToWork
      </Link>
    </div>
  )
}
