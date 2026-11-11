import { colorOf } from '@/lib/constants'

export function LabelPill({ label }: { label: { name: string; color: string } }) {
  return <span className={`chip h-5 rounded-full px-2 text-[11px] ${colorOf(label.color).soft}`}>{label.name}</span>
}
