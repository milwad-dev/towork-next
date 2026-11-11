import 'server-only'
import type { NextRequest, NextResponse } from 'next/server'

/** Name of the httpOnly cookie that holds the Sanctum token. */
export const SESSION_COOKIE = 'towork_session'

const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/** Base URL of the Laravel API (server-only). */
export function apiUrl(): string {
  return (process.env.API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '')
}

/**
 * Secure cookies need HTTPS. Use them when the request came in over HTTPS
 * (directly or through a TLS-terminating proxy), or when forced with COOKIE_SECURE.
 */
function isSecure(request: NextRequest): boolean {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === 'true'
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  return proto === 'https'
}

export function setSession(response: NextResponse, request: NextRequest, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(request),
    path: '/',
    maxAge: MAX_AGE,
  })
}

export function clearSession(response: NextResponse) {
  response.cookies.set({ name: SESSION_COOKIE, value: '', httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
}

/** Headers forwarded to Laravel for a browser request. */
export function backendHeaders(request: NextRequest, withBody: boolean): Headers {
  const headers = new Headers({ Accept: 'application/json' })
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (withBody) headers.set('Content-Type', request.headers.get('content-type') ?? 'application/json')

  const tz = request.headers.get('x-timezone')
  if (tz) headers.set('X-Timezone', tz)
  const ua = request.headers.get('user-agent')
  if (ua) headers.set('User-Agent', ua)

  // Laravel trusts proxies, so its rate limiter sees the real client IP.
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')
  if (ip) headers.set('X-Forwarded-For', ip)
  return headers
}
