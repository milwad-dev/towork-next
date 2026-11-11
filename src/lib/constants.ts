import {
  BookOpen,
  Briefcase,
  Code,
  Dumbbell,
  Folder,
  GraduationCap,
  Heart,
  House,
  Music,
  Plane,
  ShoppingCart,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ColorKey, Priority, TaskParams, TaskStatus } from './types'

interface ColorClasses {
  dot: string
  soft: string
  text: string
  bar: string
}

/**
 * Colour keys accepted by the API for categories and labels. Every Tailwind
 * class is written out in full so the Tailwind scanner picks them up.
 */
export const COLORS: Record<ColorKey, ColorClasses> = {
  slate: { dot: 'bg-slate-400', soft: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', text: 'text-slate-500', bar: 'bg-slate-400' },
  red: { dot: 'bg-red-500', soft: 'bg-red-500/10 text-red-600 dark:text-red-400', text: 'text-red-500', bar: 'bg-red-500' },
  orange: { dot: 'bg-orange-500', soft: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', text: 'text-orange-500', bar: 'bg-orange-500' },
  amber: { dot: 'bg-amber-500', soft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', text: 'text-amber-500', bar: 'bg-amber-500' },
  green: { dot: 'bg-green-500', soft: 'bg-green-500/10 text-green-700 dark:text-green-400', text: 'text-green-500', bar: 'bg-green-500' },
  teal: { dot: 'bg-teal-500', soft: 'bg-teal-500/10 text-teal-700 dark:text-teal-400', text: 'text-teal-500', bar: 'bg-teal-500' },
  sky: { dot: 'bg-sky-500', soft: 'bg-sky-500/10 text-sky-700 dark:text-sky-400', text: 'text-sky-500', bar: 'bg-sky-500' },
  blue: { dot: 'bg-blue-500', soft: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', text: 'text-blue-500', bar: 'bg-blue-500' },
  indigo: { dot: 'bg-indigo-500', soft: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', text: 'text-indigo-500', bar: 'bg-indigo-500' },
  violet: { dot: 'bg-violet-500', soft: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', text: 'text-violet-500', bar: 'bg-violet-500' },
  pink: { dot: 'bg-pink-500', soft: 'bg-pink-500/10 text-pink-600 dark:text-pink-400', text: 'text-pink-500', bar: 'bg-pink-500' },
  rose: { dot: 'bg-rose-500', soft: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', text: 'text-rose-500', bar: 'bg-rose-500' },
}

export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[]

export function colorOf(key: string | null | undefined): ColorClasses {
  return COLORS[key as ColorKey] ?? COLORS.slate
}

/** Curated Lucide icons for categories. Stored as kebab-case names (same set as towork-vue). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  briefcase: Briefcase,
  house: House,
  'book-open': BookOpen,
  heart: Heart,
  'shopping-cart': ShoppingCart,
  dumbbell: Dumbbell,
  plane: Plane,
  code: Code,
  music: Music,
  'graduation-cap': GraduationCap,
  wallet: Wallet,
  sparkles: Sparkles,
  target: Target,
}

export function iconOf(name: string | null | undefined): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || Folder
}

export interface PriorityMeta {
  value: Priority
  label: string
  short: string
  flag: string
  soft: string
  ring: string
  bar: string
}

/** Priorities: 1 = low … 4 = urgent. */
export const PRIORITIES: PriorityMeta[] = [
  { value: 4, label: 'Urgent', short: 'P1', flag: 'text-red-500', soft: 'bg-red-500/10 text-red-600 dark:text-red-400', ring: 'border-red-500', bar: 'bg-red-500' },
  { value: 3, label: 'High', short: 'P2', flag: 'text-orange-500', soft: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', ring: 'border-orange-500', bar: 'bg-orange-500' },
  { value: 2, label: 'Medium', short: 'P3', flag: 'text-blue-500', soft: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', ring: 'border-blue-500', bar: 'bg-blue-500' },
  { value: 1, label: 'Low', short: 'P4', flag: 'text-zinc-400', soft: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400', ring: 'border-zinc-300 dark:border-zinc-600', bar: 'bg-zinc-400' },
]

export function priorityOf(value: number | string | null | undefined): PriorityMeta {
  return PRIORITIES.find((p) => p.value === Number(value)) ?? PRIORITIES[3]
}

export const STATUSES: { value: TaskStatus; label: string; dot: string }[] = [
  { value: 'todo', label: 'To do', dot: 'bg-zinc-400' },
  { value: 'in_progress', label: 'In progress', dot: 'bg-amber-500' },
  { value: 'done', label: 'Done', dot: 'bg-green-500' },
]

export function statusOf(value: string) {
  return STATUSES.find((s) => s.value === value) ?? STATUSES[0]
}

export const SORTS: { value: NonNullable<TaskParams['sort']>; label: string }[] = [
  { value: 'position', label: 'Manual' },
  { value: 'due_date', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created_at', label: 'Date created' },
  { value: 'title', label: 'Title' },
]
