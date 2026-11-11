/** 0–4 password strength: length, letters + numbers, mixed case, symbols or length ≥ 14. */
export function passwordStrength(p: string): number {
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (/[a-zA-Z]/.test(p) && /\d/.test(p)) s++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p) || p.length >= 14) s++
  return s
}

export const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
export const STRENGTH_COLORS = ['bg-zinc-300', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500']
