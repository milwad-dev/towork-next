import { CircleAlert } from 'lucide-react'

export function ErrorAlert({ message, className = 'mt-6' }: { message: string; className?: string }) {
  if (!message) return null
  return (
    <div
      className={`${className} flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300`}
      role="alert"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" /> {message}
    </div>
  )
}
