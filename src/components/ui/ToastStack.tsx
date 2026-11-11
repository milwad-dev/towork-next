'use client'

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { dismissToast, useUi } from '@/lib/ui'

const icons = { success: CircleCheck, error: CircleAlert, info: Info }
const tones = { success: 'text-green-400', error: 'text-red-400', info: 'text-sky-400' }

export function ToastStack() {
  const toasts = useUi((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite" role="status">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-md animate-toast-in items-center gap-3 rounded-xl bg-zinc-900 py-2.5 pr-2 pl-3.5 text-[13px] text-zinc-100 shadow-pop ring-1 ring-white/10 dark:bg-zinc-800"
          >
            <Icon className={`size-4 shrink-0 ${tones[t.type]}`} />
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="rounded-md px-2 py-1 font-semibold text-accent-300 hover:bg-white/10"
                onClick={() => {
                  t.action!.handler()
                  dismissToast(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-100" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
