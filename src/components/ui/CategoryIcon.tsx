import { createElement } from 'react'
import { iconOf } from '@/lib/constants'

/** Renders a category's Lucide icon by its stored kebab-case name. */
export function CategoryIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  return createElement(iconOf(name), { className, 'aria-hidden': true })
}
