'use client'

import { format } from 'date-fns'
import { AlarmClock, CircleCheckBig, CircleDashed, Flame, LayoutDashboard, Sun, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { colorOf, PRIORITIES } from '@/lib/constants'
import { parseDate } from '@/lib/dates'
import { useMe, useStats } from '@/lib/queries'
import type { Stats } from '@/lib/types'

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function DashboardView() {
  const { data: user } = useMe()
  const { data: stats, error, isPending, refetch } = useStats()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="mb-8 flex items-start gap-3">
        <div className="mt-1 flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
          <LayoutDashboard className="size-5 text-accent-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
            {greeting()}
            {user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Here&apos;s how your work is going.</p>
        </div>
      </header>

      {error ? (
        <div className="card flex items-center justify-between gap-4 p-4 text-[13px]">
          <span className="text-red-600 dark:text-red-400">{errorMessage(error)}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : isPending ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="skeleton h-72 rounded-xl lg:col-span-2" />
            <div className="skeleton h-72 rounded-xl" />
          </div>
        </>
      ) : !stats.totals.all ? (
        <EmptyState
          icon={TrendingUp}
          title="Your dashboard is waiting"
          description="Create a few tasks and complete them. Your progress, streaks and trends will appear here."
        >
          <Link href="/today" className="btn btn-primary">
            Add your first task
          </Link>
        </EmptyState>
      ) : (
        <Dashboard stats={stats} />
      )}
    </div>
  )
}

function Dashboard({ stats }: { stats: Stats }) {
  const t = stats.totals
  const cards = [
    {
      label: 'Open tasks',
      value: t.todo + t.in_progress,
      sub: `${t.in_progress} in progress`,
      icon: CircleDashed,
      tone: 'text-accent-600 bg-accent-500/10 dark:text-accent-400',
      href: '/tasks',
    },
    {
      label: 'Due today',
      value: t.due_today,
      sub: `${t.upcoming} upcoming`,
      icon: Sun,
      tone: 'text-green-600 bg-green-500/10 dark:text-green-400',
      href: '/today',
    },
    {
      label: 'Overdue',
      value: t.overdue,
      sub: t.overdue ? 'Needs attention' : 'Nothing late',
      icon: AlarmClock,
      tone: 'text-red-600 bg-red-500/10 dark:text-red-400',
      href: '/today',
    },
    {
      label: 'Completed',
      value: t.done,
      sub: `of ${t.all} total`,
      icon: CircleCheckBig,
      tone: 'text-violet-600 bg-violet-500/10 dark:text-violet-400',
      href: '/tasks',
    },
  ]
  const priorityTotal = Object.values(stats.by_priority).reduce((s, n) => s + n, 0)
  const R = 42
  const C = 2 * Math.PI * R

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="card group p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{c.label}</span>
              <span className={cn('flex size-8 items-center justify-center rounded-lg', c.tone)}>
                <c.icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{c.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ActivityChart activity={stats.activity} />

        {/* Completion & streak */}
        <section className="card flex flex-col p-5" aria-labelledby="progress-title">
          <h2 id="progress-title" className="text-[15px] font-semibold">
            Progress
          </h2>
          <div className="flex flex-1 flex-col items-center justify-center py-4">
            <div className="relative">
              <svg viewBox="0 0 100 100" className="size-36 -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#6366f1" />
                    <stop offset="1" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  strokeWidth="9"
                  className="stroke-zinc-100 dark:stroke-zinc-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke="url(#ring-g)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - stats.completion_rate / 100)}
                  className="transition-[stroke-dashoffset] duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">{stats.completion_rate}%</span>
                <span className="text-xs text-zinc-500">completed</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
              <Flame className="size-5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold">{stats.streak}-day streak</p>
              <p className="text-xs text-zinc-500">
                {stats.streak ? 'Keep it going. Finish a task today.' : 'Complete a task to start a streak.'}
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="card p-5 lg:col-span-2" aria-labelledby="cat-title">
          <h2 id="cat-title" className="text-[15px] font-semibold">
            Categories
          </h2>
          {!stats.by_category.length && (
            <p className="mt-4 text-[13px] text-zinc-500">
              No categories yet. Create one from the sidebar to group related tasks.
            </p>
          )}
          <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {stats.by_category.map((c) => (
              <li key={c.id}>
                <Link href={`/categories/${c.id}`} className="group block">
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-medium group-hover:underline">
                      <span className={cn('size-2 rounded-full', colorOf(c.color).dot)} /> {c.name}
                    </span>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {c.done}/{c.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', colorOf(c.color).bar)}
                      style={{ width: `${c.total ? (c.done / c.total) * 100 : 0}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Priority */}
        <section className="card p-5" aria-labelledby="prio-title">
          <h2 id="prio-title" className="text-[15px] font-semibold">
            Open by priority
          </h2>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            {PRIORITIES.map((p) => (
              <div
                key={p.value}
                className={cn('h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full', p.bar)}
                style={{
                  width: `${priorityTotal ? ((stats.by_priority[String(p.value) as '1'] ?? 0) / priorityTotal) * 100 : 0}%`,
                }}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {PRIORITIES.map((p) => (
              <li key={p.value} className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2">
                  <span className={cn('size-2.5 rounded-sm', p.bar)} /> {p.label}
                </span>
                <span className="font-medium tabular-nums">{stats.by_priority[String(p.value) as '1'] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

const W = 640
const H = 200
const PAD = { top: 12, right: 8, bottom: 28, left: 28 }

function ActivityChart({ activity }: { activity: Stats['activity'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const maxY = Math.max(4, ...activity.flatMap((d) => [d.created, d.completed]))
  const niceMax = Math.ceil(maxY / 4) * 4
  const slot = (W - PAD.left - PAD.right) / Math.max(1, activity.length)
  const barW = Math.max(4, Math.min(14, slot / 3))
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / niceMax)
  const ticks = [0, 1, 2, 3, 4].map((i) => (niceMax / 4) * i)
  const created = activity.reduce((s, d) => s + d.created, 0)
  const completed = activity.reduce((s, d) => s + d.completed, 0)
  const hovered = hover !== null ? activity[hover] : null

  return (
    <section className="card p-5 lg:col-span-2" aria-labelledby="activity-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="activity-title" className="text-[15px] font-semibold">
            Activity
          </h2>
          <p className="text-xs text-zinc-500">Last 14 days</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-600" /> Created{' '}
            <b className="font-semibold tabular-nums">{created}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-accent-500" /> Completed{' '}
            <b className="font-semibold tabular-nums">{completed}</b>
          </span>
        </div>
      </div>
      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Bar chart of tasks created and completed per day over the last 14 days"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeDasharray="3 3"
              />
              <text x={PAD.left - 8} y={y(t) + 3} textAnchor="end" className="fill-zinc-400 text-[10px]">
                {t}
              </text>
            </g>
          ))}
          {activity.map((d, i) => (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={H - PAD.top - PAD.bottom}
                className={hover === i ? 'fill-zinc-100/80 dark:fill-zinc-800/60' : 'fill-transparent'}
                rx="6"
              />
              <rect
                x={PAD.left + i * slot + slot / 2 - barW - 1}
                y={y(d.created)}
                width={barW}
                height={Math.max(0, H - PAD.bottom - y(d.created))}
                rx="3"
                className="fill-zinc-300 transition-all duration-500 dark:fill-zinc-600"
              />
              <rect
                x={PAD.left + i * slot + slot / 2 + 1}
                y={y(d.completed)}
                width={barW}
                height={Math.max(0, H - PAD.bottom - y(d.completed))}
                rx="3"
                className="fill-accent-500 transition-all duration-500"
              />
              {(i % 2 === 0 || i === activity.length - 1) && (
                <text
                  x={PAD.left + i * slot + slot / 2}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[10px]"
                >
                  {format(parseDate(d.date)!, 'MMM d')}
                </text>
              )}
            </g>
          ))}
        </svg>
        {hovered && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-pop dark:bg-zinc-700"
            style={{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%` }}
          >
            <p className="font-medium">{format(parseDate(hovered.date)!, 'EEE, MMM d')}</p>
            <p className="text-zinc-300">
              {hovered.created} created · {hovered.completed} completed
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
