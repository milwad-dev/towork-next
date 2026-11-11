import { colorOf } from '@/lib/constants'
import { cn } from '@/lib/cn'

export function ColorDot({ color, size = 'size-2' }: { color?: string | null; size?: string }) {
  return <span className={cn('inline-block shrink-0 rounded-full', colorOf(color).dot, size)} aria-hidden="true" />
}
