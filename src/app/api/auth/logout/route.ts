import { NextResponse, type NextRequest } from 'next/server'
import { callBackend } from '@/lib/server/forward'
import { clearSession, SESSION_COOKIE } from '@/lib/server/session'

/** Revoke the token on the API (best effort) and always clear the cookie. */
export async function POST(request: NextRequest) {
  if (request.cookies.get(SESSION_COOKIE)) {
    await callBackend(request, 'auth/logout', { body: null })
  }
  const response = new NextResponse(null, { status: 204 })
  clearSession(response)
  return response
}
