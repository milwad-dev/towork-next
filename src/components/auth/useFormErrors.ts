'use client'

import { useState } from 'react'
import { errorMessage, fieldErrors } from '@/lib/api'

/** Field errors + a general error banner + loading flag around an async submit. */
export function useFormErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function run(fn: () => Promise<void>) {
    setLoading(true)
    setErrors({})
    setError('')
    try {
      await fn()
    } catch (e) {
      const fields = fieldErrors(e)
      setErrors(fields)
      if (!Object.keys(fields).length) setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return { errors, setErrors, error, setError, loading, run }
}
