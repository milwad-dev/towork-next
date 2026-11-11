import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TaskCheckbox } from '../tasks/TaskCheckbox'

describe('TaskCheckbox', () => {
  it('reports its state accessibly and calls onToggle', () => {
    const onToggle = vi.fn()
    const { rerender } = render(<TaskCheckbox checked={false} priority={4} onToggle={onToggle} />)

    const box = screen.getByRole('checkbox', { name: 'Mark as complete' })
    expect(box).toHaveAttribute('aria-checked', 'false')
    expect(box.className).toContain('border-red-500') // urgent ring

    fireEvent.click(box)
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(box.className).toContain('animate-pop')

    rerender(<TaskCheckbox checked priority={4} onToggle={onToggle} />)
    expect(screen.getByRole('checkbox', { name: 'Mark as not done' })).toHaveAttribute('aria-checked', 'true')
  })

  it('does not trigger the parent row click', () => {
    const onRow = vi.fn()
    render(
      <div onClick={onRow}>
        <TaskCheckbox checked={false} onToggle={() => {}} />
      </div>,
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onRow).not.toHaveBeenCalled()
  })
})
