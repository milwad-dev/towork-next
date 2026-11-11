'use client'

import { Check, Folder, FolderX } from 'lucide-react'
import { Popover } from '@/components/ui/Popover'
import { cn } from '@/lib/cn'
import { colorOf, iconOf } from '@/lib/constants'
import { useCategories } from '@/lib/queries'

export function CategoryPicker({ value, onChange, compact = false }: { value: number | null; onChange: (id: number | null) => void; compact?: boolean }) {
  const { data: categories = [] } = useCategories()
  const current = categories.find((c) => c.id === value) ?? null
  const Icon = current ? iconOf(current.icon) : Folder

  return (
    <Popover
      width="w-56"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className={cn(
            'btn btn-sm max-w-44 border font-normal hover:bg-zinc-100 dark:hover:bg-zinc-800',
            current ? 'border-zinc-200 dark:border-zinc-700' : 'border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700',
            open && 'bg-zinc-100 dark:bg-zinc-800',
          )}
          aria-expanded={open}
          aria-label="Category"
          onClick={toggle}
        >
          <Icon className={cn('size-3.5', current && colorOf(current.color).text)} />
          {current ? <span className="truncate">{current.name}</span> : !compact && <span>Category</span>}
        </button>
      )}
    >
      {({ close }) => (
        <>
          {!categories.length && <p className="px-2.5 py-2 text-xs text-zinc-500">No categories yet. Create one from the sidebar.</p>}
          {categories.map((c) => {
            const CIcon = iconOf(c.icon)
            return (
              <button
                key={c.id}
                type="button"
                className="menu-item"
                data-active={value === c.id}
                onClick={() => {
                  onChange(c.id)
                  close()
                }}
              >
                <CIcon className={cn('size-4', colorOf(c.color).text)} />
                <span className="truncate">{c.name}</span>
                {value === c.id && <Check className="ml-auto size-4 text-accent-500" />}
              </button>
            )
          })}
          {value !== null && (
            <>
              <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  onChange(null)
                  close()
                }}
              >
                <FolderX className="size-4 text-zinc-400" /> No category
              </button>
            </>
          )}
        </>
      )}
    </Popover>
  )
}
