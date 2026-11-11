'use client'

import { resolveConfirm, useUi } from '@/lib/ui'
import { Modal } from './Modal'

export function ConfirmDialog() {
  const state = useUi((s) => s.confirm)
  return (
    <Modal
      open={state.open}
      title={state.title}
      description={state.message}
      size="max-w-sm"
      onClose={() => resolveConfirm(false)}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => resolveConfirm(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`}
            data-autofocus
            onClick={() => resolveConfirm(true)}
          >
            {state.confirmLabel}
          </button>
        </>
      }
    >
      {null}
    </Modal>
  )
}
