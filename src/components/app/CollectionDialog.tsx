'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { errorMessage, fieldErrors } from '@/lib/api'
import { cn } from '@/lib/cn'
import { CATEGORY_ICONS } from '@/lib/constants'
import { useCollectionMutations } from '@/lib/queries'
import type { Category, ColorKey, Label } from '@/lib/types'
import { toast } from '@/lib/ui'

export type CollectionKind = 'category' | 'label'

/** Create / edit dialog shared by categories and labels. Mount it with a `key` to reset the form. */
export function CollectionDialog({
  open,
  kind,
  item,
  onClose,
}: {
  open: boolean
  kind: CollectionKind
  item: Category | Label | null
  onClose: () => void
}) {
  const router = useRouter()
  const mutations = useCollectionMutations(kind === 'label' ? 'labels' : 'categories')
  const noun = kind
  const Noun = noun[0].toUpperCase() + noun.slice(1)

  const [form, setForm] = useState({
    name: item?.name ?? '',
    color: (item?.color ?? (kind === 'label' ? 'violet' : 'indigo')) as ColorKey,
    icon: (item && 'icon' in item ? item.icon : null) ?? 'folder',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const payload: Partial<Category> = { name: form.name.trim(), color: form.color }
      if (kind === 'category') payload.icon = form.icon
      if (item) {
        await mutations.update(item.id, payload)
        toast(`${Noun} updated`)
      } else {
        const created = await mutations.create(payload)
        toast(`${Noun} created`)
        router.push(`/${kind === 'category' ? 'categories' : 'labels'}/${created.id}`)
      }
      onClose()
    } catch (err) {
      const fields = fieldErrors(err)
      setErrors(fields)
      if (!Object.keys(fields).length) toast(errorMessage(err), { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={item ? `Edit ${noun}` : `New ${noun}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="collection-form" className="btn btn-primary" disabled={saving || !form.name.trim()}>
            {saving && <Spinner />} {item ? 'Save changes' : `Create ${noun}`}
          </button>
        </>
      }
    >
      <form id="collection-form" className="space-y-5" onSubmit={save}>
        <FormField label="Name" error={errors.name}>
          {(f) => (
            <input
              {...f}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              maxLength={100}
              placeholder={kind === 'label' ? 'e.g. waiting-on' : 'e.g. Work'}
              data-autofocus
            />
          )}
        </FormField>
        <div>
          <span className="label">Color</span>
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
        </div>
        {kind === 'category' && (
          <div>
            <span className="label">Icon</span>
            <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label="Icon">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={form.icon === key}
                  aria-label={key}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-lg border transition',
                    form.icon === key
                      ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800',
                  )}
                  onClick={() => setForm({ ...form, icon: key })}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
