'use client'

import { QuickAdd } from '@/components/tasks/QuickAdd'
import { Modal } from '@/components/ui/Modal'
import { uiStore, useUi } from '@/lib/ui'

export function QuickAddDialog() {
  const open = useUi((s) => s.quickAddOpen)
  const defaults = useUi((s) => s.quickAddDefaults)
  const close = () => uiStore.set({ quickAddOpen: false })
  return (
    <Modal open={open} title="New task" bare size="max-w-xl" position="top" onClose={close}>
      <div className="p-2">
        <QuickAdd key={JSON.stringify(defaults)} defaults={defaults} expanded onCreated={close} onCancel={close} />
      </div>
    </Modal>
  )
}
