import { Check } from 'lucide-react'
import { COLOR_KEYS, colorOf } from '@/lib/constants'
import { cn } from '@/lib/cn'
import type { ColorKey } from '@/lib/types'

export function ColorPicker({ value, onChange }: { value: ColorKey; onChange: (c: ColorKey) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {COLOR_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={key}
          title={key}
          className={cn(
            'flex size-7 items-center justify-center rounded-full ring-offset-2 transition hover:scale-110 dark:ring-offset-zinc-900',
            colorOf(key).dot,
            value === key && 'ring-2 ring-zinc-900/70 dark:ring-white/80',
          )}
          onClick={() => onChange(key)}
        >
          {value === key && <Check className="size-3.5 text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}
