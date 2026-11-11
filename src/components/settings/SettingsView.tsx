'use client'

import { BadgeCheck, MailWarning, Monitor, Moon, Settings, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { errorMessage, fieldErrors } from '@/lib/api'
import { cn } from '@/lib/cn'
import { initials, useAuthActions, useMe } from '@/lib/queries'
import type { User } from '@/lib/types'
import { setTheme, toast, useUi, type Theme } from '@/lib/ui'

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export function SettingsView() {
  const { data: user } = useMe()
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="mb-8 flex items-start gap-3">
        <div className="mt-1 flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
          <Settings className="size-5 text-accent-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Manage your account and preferences.</p>
        </div>
      </header>
      {user ? (
        <SettingsBody user={user} />
      ) : (
        <div className="space-y-6">
          <div className="skeleton h-72 rounded-xl" />
          <div className="skeleton h-40 rounded-xl" />
        </div>
      )}
    </div>
  )
}

const card = 'border-b border-zinc-100 p-5 dark:border-zinc-800'

function SettingsBody({ user }: { user: User }) {
  const auth = useAuthActions()
  const router = useRouter()
  const theme = useUi((s) => s.theme)
  const verified = !!user.email_verified_at

  // Profile
  const [profile, setProfile] = useState({ name: user.name, email: user.email, phone: user.phone ?? '' })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileErrors({})
    const emailChanged = profile.email.trim() !== user.email
    try {
      await auth.updateProfile({ name: profile.name.trim(), email: profile.email.trim(), phone: profile.phone.trim() || null })
      toast(emailChanged ? 'Profile saved. Please verify your new email.' : 'Profile saved')
    } catch (err) {
      const fields = fieldErrors(err)
      setProfileErrors(fields)
      if (!Object.keys(fields).length) toast(errorMessage(err), { type: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  // Password
  const emptyPassword = { current_password: '', password: '', password_confirmation: '' }
  const [password, setPassword] = useState(emptyPassword)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [savingPassword, setSavingPassword] = useState(false)
  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordErrors({})
    if (password.password !== password.password_confirmation) {
      setPasswordErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }
    setSavingPassword(true)
    try {
      await auth.updatePassword(password)
      setPassword(emptyPassword)
      toast('Password updated')
    } catch (err) {
      const fields = fieldErrors(err)
      setPasswordErrors(fields)
      if (!Object.keys(fields).length) toast(errorMessage(err), { type: 'error' })
    } finally {
      setSavingPassword(false)
    }
  }

  // Verification
  const [sending, setSending] = useState(false)
  async function sendCode() {
    setSending(true)
    try {
      await auth.sendVerification()
      router.push('/verify-email')
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setSending(false)
    }
  }

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteForm, setDeleteForm] = useState({ confirm: '', password: '' })
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault()
    setDeleting(true)
    setDeleteError('')
    try {
      await auth.deleteAccount(deleteForm.password)
      // Full page load so no cached data of the deleted account survives.
      window.location.replace('/register')
    } catch (err) {
      setDeleteError(fieldErrors(err).password || errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {!verified && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <MailWarning className="size-5 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">Your email isn&apos;t verified</p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">We&apos;ll send a 6-digit code to {user.email}.</p>
          </div>
          <button type="button" className="btn btn-sm bg-amber-600 text-white hover:bg-amber-500" disabled={sending} onClick={sendCode}>
            {sending && <Spinner />} Send code
          </button>
        </div>
      )}

      {/* Profile */}
      <section className="card">
        <div className={card}>
          <h2 className="text-[15px] font-semibold">Profile</h2>
          <p className="text-xs text-zinc-500">Your name and contact details.</p>
        </div>
        <form className="space-y-4 p-5" onSubmit={saveProfile}>
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-semibold text-white">
              {initials(user.name)}
            </span>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="flex items-center gap-1 text-xs text-zinc-500">
                {verified && <BadgeCheck className="size-3.5 text-green-500" />} {verified ? 'Verified account' : 'Unverified'}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" error={profileErrors.name}>
              {(f) => <input {...f} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input" autoComplete="name" />}
            </FormField>
            <FormField label="Phone" error={profileErrors.phone}>
              {(f) => (
                <input
                  {...f}
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="input"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Optional"
                />
              )}
            </FormField>
          </div>
          <FormField label="Email" error={profileErrors.email} hint="Changing your email will require verifying it again.">
            {(f) => (
              <input {...f} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="input" type="email" autoComplete="email" />
            )}
          </FormField>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile && <Spinner />} Save profile
            </button>
          </div>
        </form>
      </section>

      {/* Appearance */}
      <section className="card">
        <div className={card}>
          <h2 className="text-[15px] font-semibold">Appearance</h2>
          <p className="text-xs text-zinc-500">Choose how ToWork looks on this device.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5" role="radiogroup" aria-label="Theme">
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={theme === t.value}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 text-[13px] font-medium transition',
                theme === t.value
                  ? 'border-accent-500 bg-accent-500/5 text-accent-700 ring-2 ring-accent-500/20 dark:text-accent-300'
                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60',
              )}
              onClick={() => setTheme(t.value)}
            >
              <t.icon className="size-5" /> {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Password */}
      <section className="card">
        <div className={card}>
          <h2 className="text-[15px] font-semibold">Password</h2>
          <p className="text-xs text-zinc-500">Use at least 8 characters, including letters and numbers.</p>
        </div>
        <form className="space-y-4 p-5" onSubmit={savePassword}>
          <FormField label="Current password" error={passwordErrors.current_password}>
            {(f) => (
              <input
                {...f}
                value={password.current_password}
                onChange={(e) => setPassword({ ...password, current_password: e.target.value })}
                className="input"
                type="password"
                autoComplete="current-password"
              />
            )}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="New password" error={passwordErrors.password}>
              {(f) => (
                <input
                  {...f}
                  value={password.password}
                  onChange={(e) => setPassword({ ...password, password: e.target.value })}
                  className="input"
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </FormField>
            <FormField label="Confirm new password" error={passwordErrors.password_confirmation}>
              {(f) => (
                <input
                  {...f}
                  value={password.password_confirmation}
                  onChange={(e) => setPassword({ ...password, password_confirmation: e.target.value })}
                  className="input"
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </FormField>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={savingPassword || !password.current_password || !password.password}>
              {savingPassword && <Spinner />} Update password
            </button>
          </div>
        </form>
      </section>

      {/* Danger zone */}
      <section className="card border-red-200 dark:border-red-500/20">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-red-600 dark:text-red-400">Delete account</h2>
            <p className="text-xs text-zinc-500">Permanently delete your account, tasks, categories and labels. This cannot be undone.</p>
          </div>
          <button type="button" className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
            Delete account
          </button>
        </div>
      </section>

      <Modal
        open={deleteOpen}
        title="Delete your account?"
        description="All of your data will be permanently removed. This cannot be undone."
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="delete-form" className="btn btn-danger" disabled={deleteForm.confirm !== 'DELETE' || !deleteForm.password || deleting}>
              {deleting && <Spinner />} Delete forever
            </button>
          </>
        }
      >
        <form id="delete-form" className="space-y-4" onSubmit={deleteAccount}>
          <FormField label="Type DELETE to confirm">
            {(f) => <input {...f} value={deleteForm.confirm} onChange={(e) => setDeleteForm({ ...deleteForm, confirm: e.target.value })} className="input" autoComplete="off" />}
          </FormField>
          <FormField label="Your password" error={deleteError}>
            {(f) => (
              <input
                {...f}
                value={deleteForm.password}
                onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                className="input"
                type="password"
                autoComplete="current-password"
              />
            )}
          </FormField>
        </form>
      </Modal>
    </div>
  )
}
