'use client'

import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ErrorAlert } from '@/components/ui/Alert'
import { CodeInput } from '@/components/ui/CodeInput'
import { FormField } from '@/components/ui/FormField'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { toast } from '@/lib/ui'
import { useFormErrors } from './useFormErrors'

type Step = 'email' | 'code' | 'password'
const link = 'font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400'

export function ForgotPasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [form, setForm] = useState({ email: '', code: '', password: '', password_confirmation: '' })
  const { errors, setErrors, error, loading, run } = useFormErrors()

  const sendCode = () =>
    run(async () => {
      await api.post('auth/forgot-password', { email: form.email.trim() })
      setStep('code')
    })
  const resend = () =>
    run(async () => {
      await api.post('auth/forgot-password', { email: form.email.trim() })
      toast('A new code is on its way.', { type: 'info' })
    })
  const checkCode = (code = form.code) =>
    run(async () => {
      await api.post('auth/reset-password/check', { email: form.email.trim(), code })
      setStep('password')
    })
  const reset = () => {
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }
    run(async () => {
      await api.post('auth/reset-password', { ...form, email: form.email.trim() })
      toast('Password updated. You can sign in now.')
      router.replace('/login')
    })
  }

  const onSubmit = (fn: () => void) => (e: React.FormEvent) => {
    e.preventDefault()
    fn()
  }
  const Icon = step === 'code' ? MailCheck : KeyRound

  return (
    <div>
      <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
        <Icon className="size-5" />
      </div>

      {step === 'email' && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a 6-digit code.
          </p>
        </>
      )}
      {step === 'code' && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            If an account exists for <span className="font-medium text-zinc-700 dark:text-zinc-200">{form.email}</span>,
            we sent it a code. It expires in 60 minutes.
          </p>
        </>
      )}
      {step === 'password' && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Use at least 8 characters, including letters and numbers.
          </p>
        </>
      )}

      <ErrorAlert message={error} />

      {step === 'email' && (
        <form className="mt-8 space-y-5" noValidate onSubmit={onSubmit(sendCode)}>
          <FormField label="Email" error={errors.email}>
            {(f) => (
              <input
                {...f}
                className="input"
                type="email"
                autoComplete="email"
                autoFocus
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
          </FormField>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || !form.email.trim()}>
            {loading && <Spinner />} Send code
          </button>
        </form>
      )}

      {step === 'code' && (
        <form className="mt-8 space-y-5" noValidate onSubmit={onSubmit(() => checkCode())}>
          <div>
            <CodeInput
              value={form.code}
              invalid={!!errors.code}
              onChange={(code) => setForm((f) => ({ ...f, code }))}
              onComplete={(code) => checkCode(code)}
            />
            {errors.code && <p className="field-error">{errors.code}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || form.code.length !== 6}>
            {loading && <Spinner />} Continue
          </button>
          <p className="text-center text-[13px] text-zinc-500">
            Didn&apos;t get it?{' '}
            <button type="button" className={link} disabled={loading} onClick={resend}>
              Resend code
            </button>{' '}
            ·{' '}
            <button type="button" className={link} onClick={() => setStep('email')}>
              Change email
            </button>
          </p>
        </form>
      )}

      {step === 'password' && (
        <form className="mt-8 space-y-4" noValidate onSubmit={onSubmit(reset)}>
          <FormField label="New password" error={errors.password}>
            {(f) => (
              <input
                {...f}
                className="input"
                type="password"
                autoComplete="new-password"
                autoFocus
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Confirm new password" error={errors.password_confirmation}>
            {(f) => (
              <input
                {...f}
                className="input"
                type="password"
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              />
            )}
          </FormField>
          {errors.code && <p className="field-error">{errors.code}</p>}
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading && <Spinner />} Update password
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-8 flex items-center justify-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </div>
  )
}
