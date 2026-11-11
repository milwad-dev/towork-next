/**
 * Browser-side API client. Every request goes to this app's own `/api/*`
 * route handlers, which forward it to the Laravel API with the token from the
 * httpOnly session cookie. The token is never visible to JavaScript.
 */

export class ApiError extends Error {
  status: number
  data: { message?: string; errors?: Record<string, string[] | string> } | null

  constructor(status: number, data: ApiError['data'], message?: string) {
    super(message ?? data?.message ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type Query = Record<string, string | number | boolean | null | undefined | (string | number)[]>

interface RequestOptions {
  query?: Query
  body?: unknown
  /** Don't redirect to /login on 401 (used while checking the session). */
  skipAuthRedirect?: boolean
  signal?: AbortSignal
}

const timezone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
})()

/** Serialize query params: arrays become comma lists, empty values are dropped. */
export function toSearchParams(query: Query = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','))
    } else {
      params.set(key, String(value))
    }
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

let redirecting = false

function onUnauthorized() {
  if (redirecting || typeof window === 'undefined') return
  redirecting = true
  const here = window.location.pathname + window.location.search
  const target = here.startsWith('/login') ? '/login' : `/login?redirect=${encodeURIComponent(here)}`
  window.location.replace(target)
}

export async function request<T = unknown>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = `/api/${path.replace(/^\/+/, '')}${toSearchParams(options.query)}`
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (timezone) headers['X-Timezone'] = timezone
  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      signal: options.signal,
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError(0, null, "Can't reach the server. Check your connection.")
  }

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && !options.skipAuthRedirect) onUnauthorized()
    throw new ApiError(res.status, data)
  }
  return data as T
}

export const api = {
  get: <T>(path: string, query?: Query, opts?: Omit<RequestOptions, 'query' | 'body'>) =>
    request<T>('GET', path, { ...opts, query }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, { body }),
}

/** Field errors from a Laravel 422 response: `{ field: 'first message' }`. */
export function fieldErrors(error: unknown): Record<string, string> {
  const errors = error instanceof ApiError ? error.data?.errors : undefined
  if (!errors) return {}
  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages]),
  )
}

/** A friendly, single-line message for any failed request. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof ApiError)) return fallback
  if (error.status === 0) return error.message
  if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.'
  if (error.status >= 500) return 'The server had a problem. Please try again.'
  return error.data?.message || fallback
}
