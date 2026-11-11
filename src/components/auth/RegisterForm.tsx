'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ErrorAlert } from '@/components/ui/Alert'
import { FormField } from '@/components/ui/FormField'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { useAuthActions } from '@/lib/queries'
import { passwordStrength, STRENGTH_COLORS, STRENGTH_LABELS } from './strength'
import { useFormErrors } from './useFormErrors'

export function RegisterForm() {
  const auth = useAuthActions()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const { errors, setErrors, error, loading, run } = useFormErrors()
  const strength = passwordStrength(form.password)
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }
    run(async () => {
      const payload: Record<string, string> = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      }
      if (form.phone.trim()) payload.phone = form.phone.trim()
      await auth.register(payload)
      router.replace('/verify-email?welcome=1')
      router.refresh()
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Start organizing your work in under a minute.</p>

      <ErrorAlert message={error} />

      <form className="mt-8 space-y-4" noValidate onSubmit={submit}>
        <FormField label="Full name" error={errors.name}>
          {(f) => <input {...f} className="input" autoComplete="name" placeholder="Jane Doe" autoFocus value={form.name} onChange={set('name')} />}
        </FormField>
        <FormField label="Email" error={errors.email}>
          {(f) => (
            <input {...f} className="input" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          )}
        </FormField>
        <FormField label="Phone (optional)" error={errors.phone} hint="Lets you sign in with your phone number too.">
          {(f) => <input {...f} className="input" type="tel" autoComplete="tel" placeholder="+1 555 000 1234" value={form.phone} onChange={set('phone')} />}
        </FormField>
        <FormField label="Password" error={errors.password}>
          {(f) => (
            <>
              <input {...f} className="input" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
              {form.password && (
                <div className="mt-2 flex items-center gap-2" aria-live="polite">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={cn('h-1 flex-1 rounded-full transition-colors', i <= strength ? STRENGTH_COLORS[strength] : 'bg-zinc-200 dark:bg-zinc-800')}
                      />
                    ))}
                  </div>
                  <span className="w-16 text-right text-xs text-zinc-500">{STRENGTH_LABELS[strength]}</span>
                </div>
              )}
            </>
          )}
        </FormField>
        <FormField label="Confirm password" error={errors.password_confirmation}>
          {(f) => (
            <input
              {...f}
              className="input"
              type="password"
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={set('password_confirmation')}
            />
          )}
        </FormField>

        <button type="submit" className="btn btn-primary btn-lg mt-2 w-full" disabled={loading}>
          {loading && <Spinner />} Create account
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400">
          Sign in
        </Link>
      </p>
    </div>
  )
}
