'use client'

import { CircleAlert, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CodeInput } from '@/components/ui/CodeInput'
import { Spinner } from '@/components/ui/Spinner'
import { ApiError, errorMessage, fieldErrors } from '@/lib/api'
import { useAuthActions, useMe } from '@/lib/queries'
import { toast } from '@/lib/ui'

export function VerifyEmailForm() {
  const auth = useAuthActions()
  const { data: user } = useMe()
  const router = useRouter()
  const welcome = !!useSearchParams().get('welcome')

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // A code was already sent on registration.
  const [cooldown, setCooldown] = useState(welcome ? 30 : 0)
  const busy = useRef(false)

  useEffect(() => {
    if (user?.email_verified_at) router.replace('/today')
  }, [user, router])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function verify(value = code) {
    if (value.length !== 6 || busy.current) return
    busy.current = true
    setLoading(true)
    setError('')
    try {
      await auth.verifyEmail(value)
      toast('Email verified. Welcome aboard!')
      router.replace('/today')
    } catch (e) {
      setError(fieldErrors(e).code || errorMessage(e))
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  async function resend() {
    setError('')
    try {
      await auth.sendVerification()
      toast('A new code is on its way.', { type: 'info' })
      setCooldown(30)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast('Your email is already verified.')
        router.replace('/today')
        return
      }
      setError(errorMessage(e))
    }
  }

  return (
    <div>
      <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
        <MailCheck className="size-5" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{welcome ? 'One last step' : 'Verify your email'}</h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        Enter the 6-digit code we sent to{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{user?.email ?? 'your email'}</span>.
      </p>

      <form
        className="mt-8 space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          verify()
        }}
      >
        <div>
          <CodeInput value={code} onChange={setCode} invalid={!!error} disabled={loading} onComplete={verify} />
          {error && (
            <p className="field-error flex items-center gap-1.5" role="alert">
              <CircleAlert className="size-3.5" /> {error}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || code.length !== 6}>
          {loading && <Spinner />} Verify email
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-[13px]">
        <button
          type="button"
          className="font-medium text-accent-600 hover:text-accent-500 disabled:text-zinc-400 dark:text-accent-400"
          disabled={cooldown > 0}
          onClick={resend}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
        <Link href="/today" className="font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          Do this later →
        </Link>
      </div>
    </div>
  )
}
