import { NextResponse, type NextRequest } from 'next/server'
import { callBackend, relay, unreachable } from '@/lib/server/forward'
import { clearSession } from '@/lib/server/session'

/**
 * Catch-all proxy: /api/<path> → ${API_URL}/<path>, adding the bearer token
 * from the httpOnly session cookie. The auth endpoints that return a token are
 * handled by their own route handlers and blocked here so a token can never
 * reach the browser.
 */
const BLOCKED = new Set(['auth/login', 'auth/register'])

async function handler(request: NextRequest, ctx: RouteContext<'/api/[...path]'>) {
  const { path } = await ctx.params
  const joined = path.map(encodeURIComponent).join('/')

  if (BLOCKED.has(joined)) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  }

  const res = await callBackend(request, joined)
  if (!res) return unreachable()

  const response = await relay(res)
  // Deleting the account revokes every token: drop the cookie too.
  if (joined === 'me' && request.method === 'DELETE' && res.ok) clearSession(response)
  return response
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }
