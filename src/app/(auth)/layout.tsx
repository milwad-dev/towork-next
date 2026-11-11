import { CalendarDays, Check, Flag, Kanban, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'

const preview = [
  { title: 'Draft the v1 launch post', tag: 'Marketing', color: 'bg-pink-400', done: true },
  { title: 'Review pull requests', tag: 'Work', color: 'bg-sky-400', done: true, flag: true },
  { title: 'Plan sprint goals', tag: 'Work', color: 'bg-sky-400', due: 'Today' },
  { title: 'Book flights to Lisbon', tag: 'Travel', color: 'bg-amber-400', due: 'Fri' },
]

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Form column */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/" className="w-fit rounded-lg">
          <Logo />
        </Link>
        <main className="mx-auto flex w-full max-w-sm flex-1 animate-fade-in flex-col justify-center py-10">
          {children}
        </main>
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          ToWork is free and open source ·{' '}
          <a
            href="https://github.com/milwad-dev/towork-next"
            target="_blank"
            rel="noopener"
            className="underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300"
          >
            GitHub
          </a>
        </p>
      </div>

      {/* Brand panel */}
      <aside
        className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between"
        aria-hidden="true"
      >
        <div className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-violet-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-indigo-300/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
            <Sparkles className="size-3.5" /> Version 1.0
          </span>
          <h2 className="mt-6 max-w-md text-4xl leading-tight font-semibold tracking-tight">
            Calm, focused task management for people who ship.
          </h2>
          <p className="mt-4 max-w-md text-[15px] text-indigo-100/90">
            Plan your day, organize projects, and track progress with lists, a Kanban board, and a calendar, all in one
            place.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md rounded-2xl bg-white/95 p-2 text-zinc-800 shadow-2xl ring-1 ring-black/5 backdrop-blur">
          <div className="flex items-center justify-between px-3 pt-2 pb-3">
            <div>
              <p className="text-sm font-semibold">Today</p>
              <p className="text-xs text-zinc-500">4 tasks · 2 done</p>
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            </div>
          </div>
          <ul>
            {preview.map((t) => (
              <li key={t.title} className="flex items-center gap-3 rounded-xl px-3 py-2.5 odd:bg-zinc-50">
                <span
                  className={cn(
                    'flex size-[18px] items-center justify-center rounded-full border-[1.5px]',
                    t.done ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-300',
                  )}
                >
                  {t.done && <Check className="size-3 text-white" strokeWidth={3} />}
                </span>
                <span className={cn('flex-1 truncate text-[13px]', t.done && 'text-zinc-400 line-through')}>
                  {t.title}
                </span>
                {t.flag && <Flag className="size-3.5 text-red-500" />}
                {t.due && <span className="text-xs font-medium text-indigo-600">{t.due}</span>}
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className={cn('size-1.5 rounded-full', t.color)} />
                  {t.tag}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex gap-8 text-sm text-indigo-100/90">
          <span className="flex items-center gap-2">
            <Kanban className="size-4" /> Kanban board
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4" /> Calendar
          </span>
          <span className="flex items-center gap-2">
            <Flag className="size-4" /> Priorities
          </span>
        </div>
      </aside>
    </div>
  )
}
