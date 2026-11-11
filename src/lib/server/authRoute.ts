import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { callBackend, relay, unreachable } from './forward'
import { setSession } from './session'

/**
 * Log in or register through Laravel, then move the token into the httpOnly
 * cookie and return only the user to the browser.
 */
export async function authenticate(request: NextRequest, path: 'auth/login' | 'auth/register') {
  const res = await callBackend(request, path)
  if (!res) return unreachable()
  if (!res.ok) return relay(res)

  const json = (await res.json()) as { data?: { user?: unknown; token?: string } }
  const token = json.data?.token
  if (!token) return NextResponse.json({ message: 'Unexpected response from the API.' }, { status: 502 })

  const response = NextResponse.json({ data: { user: json.data?.user } }, { status: res.status })
  response.headers.set('Cache-Control', 'no-store')
  setSession(response, request, token)
  return response
}
