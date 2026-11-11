'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ErrorAlert } from '@/components/ui/Alert'
import { FormField } from '@/components/ui/FormField'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthActions } from '@/lib/queries'
import { PasswordInput } from './PasswordInput'
import { useFormErrors } from './useFormErrors'

export function LoginForm() {
  const auth = useAuthActions()
  const search = useSearchParams()
  const [form, setForm] = useState({ login: '', password: '' })
  const { errors, error, loading, run } = useFormErrors()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    run(async () => {
      await auth.login({ login: form.login.trim(), password: form.password })
      const redirect = search.get('redirect')
      // Full page load: the auth cookie just changed, so start with a fresh router cache.
      window.location.replace(redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/today')
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Sign in to pick up where you left off.</p>

      <ErrorAlert message={error} />

      <form className="mt-8 space-y-5" noValidate onSubmit={submit}>
        <FormField label="Email or phone" error={errors.login}>
          {(f) => (
            <input
              {...f}
              className="input"
              type="text"
              autoComplete="username"
              placeholder="you@example.com"
              required
              autoFocus
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
            />
          )}
        </FormField>

        <FormField
          error={errors.password}
          labelSlot={(id) => (
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor={id} className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400"
              >
                Forgot password?
              </Link>
            </div>
          )}
        >
          {(f) => (
            <PasswordInput
              {...f}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
        </FormField>

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
          {loading && <Spinner />} Sign in
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
        New to ToWork?{' '}
        <Link href="/register" className="font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400">
          Create an account
        </Link>
      </p>
    </div>
  )
}
