'use client'

import { Modal } from '@/components/ui/Modal'
import { useIsMac } from '@/hooks/useShortcuts'
import { uiStore, useUi } from '@/lib/ui'

export function ShortcutsHelp() {
  const open = useUi((s) => s.shortcutsOpen)
  const mod = useIsMac() ? '⌘' : 'Ctrl'
  const groups = [
    {
      title: 'General',
      items: [
        { keys: [mod, 'K'], label: 'Open command palette' },
        { keys: ['/'], label: 'Search tasks' },
        { keys: ['N'], label: 'New task' },
        { keys: ['['], label: 'Toggle sidebar' },
        { keys: ['?'], label: 'Show keyboard shortcuts' },
        { keys: ['Esc'], label: 'Close dialog or panel' },
      ],
    },
    {
      title: 'Navigation',
      items: [
        { keys: ['G', 'T'], label: 'Go to Today' },
        { keys: ['G', 'U'], label: 'Go to Upcoming' },
        { keys: ['G', 'A'], label: 'Go to All tasks' },
        { keys: ['G', 'B'], label: 'Go to Board' },
        { keys: ['G', 'C'], label: 'Go to Calendar' },
        { keys: ['G', 'D'], label: 'Go to Dashboard' },
      ],
    },
    {
      title: 'Quick add syntax',
      items: [
        { keys: ['today', 'tomorrow'], label: 'Set the due date' },
        { keys: ['!urgent', '!high'], label: 'Set the priority (also !medium, !low)' },
        { keys: ['#Work'], label: 'Put in a category' },
        { keys: ['@label'], label: 'Add a label' },
      ],
    },
  ]

  return (
    <Modal open={open} title="Keyboard shortcuts" size="max-w-lg" onClose={() => uiStore.set({ shortcutsOpen: false })}>
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.title}>
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">{g.title}</h3>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {g.items.map((item) => (
                <li key={item.label} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-zinc-700 dark:text-zinc-300">{item.label}</span>
                  <span className="flex gap-1">
                    {item.keys.map((k) => (
                      <kbd key={k} className="kbd">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}
