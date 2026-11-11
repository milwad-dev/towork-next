'use client'

import { Check, Plus, Tag } from 'lucide-react'
import { useState } from 'react'
import { Popover } from '@/components/ui/Popover'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { COLOR_KEYS, colorOf } from '@/lib/constants'
import { useCollectionMutations, useLabels } from '@/lib/queries'
import { toast } from '@/lib/ui'

export function LabelPicker({
  value,
  onChange,
  compact = false,
}: {
  value: number[]
  onChange: (ids: number[]) => void
  compact?: boolean
}) {
  const { data: labels = [] } = useLabels()
  const mutations = useCollectionMutations('labels')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const selected = labels.filter((l) => value.includes(l.id))
  const filtered = labels.filter((l) => l.name.toLowerCase().includes(q))
  const canCreate = !!q && !labels.some((l) => l.name.toLowerCase() === q)

  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  async function create() {
    if (!canCreate) return
    try {
      const label = await mutations.create({ name: query.trim(), color: COLOR_KEYS[labels.length % COLOR_KEYS.length] })
      onChange([...value, label.id])
      setQuery('')
    } catch (e) {
      toast(errorMessage(e), { type: 'error' })
    }
  }

  return (
    <Popover
      width="w-60"
      onOpenChange={(open) => !open && setQuery('')}
      trigger={({ toggle: toggleOpen, open }) => (
        <button
          type="button"
          className={cn(
            'btn btn-sm max-w-52 border font-normal hover:bg-zinc-100 dark:hover:bg-zinc-800',
            selected.length
              ? 'border-zinc-200 dark:border-zinc-700'
              : 'border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700',
            open && 'bg-zinc-100 dark:bg-zinc-800',
          )}
          aria-expanded={open}
          aria-label="Labels"
          onClick={toggleOpen}
        >
          <Tag className="size-3.5" />
          {selected.length ? (
            <span className="truncate">{selected.map((l) => l.name).join(', ')}</span>
          ) : (
            !compact && <span>Labels</span>
          )}
        </button>
      )}
    >
      {() => (
        <>
          <div className="p-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input h-8 text-[13px]"
              placeholder="Search or create…"
              aria-label="Search labels"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (filtered.length === 1 && !canCreate) toggle(filtered[0].id)
                else create()
              }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((l) => (
              <button
                key={l.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={value.includes(l.id)}
                className="menu-item"
                onClick={() => toggle(l.id)}
              >
                <span className={cn('size-2 rounded-full', colorOf(l.color).dot)} />
                <span className="truncate">{l.name}</span>
                {value.includes(l.id) && <Check className="ml-auto size-4 text-accent-500" />}
              </button>
            ))}
            {canCreate && (
              <button type="button" className="menu-item text-accent-600 dark:text-accent-400" onClick={create}>
                <Plus className="size-4" /> Create “{query.trim()}”
              </button>
            )}
            {!filtered.length && !canCreate && (
              <p className="px-2.5 py-2 text-xs text-zinc-500">Type to create your first label.</p>
            )}
          </div>
        </>
      )}
    </Popover>
  )
}
