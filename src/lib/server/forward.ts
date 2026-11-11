import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { apiUrl, backendHeaders, clearSession } from './session'

const NO_BODY = new Set(['GET', 'HEAD'])

/** Call the Laravel API and return the raw response (or a 502 on network failure). */
export async function callBackend(request: NextRequest, path: string, init?: { body?: BodyInit | null }) {
  const method = request.method
  const hasBody = !NO_BODY.has(method)
  const body = init?.body !== undefined ? init.body : hasBody ? await request.arrayBuffer() : undefined

  try {
    return await fetch(`${apiUrl()}/${path}${request.nextUrl.search}`, {
      method,
      headers: backendHeaders(request, hasBody && !!body),
      body: hasBody ? body : undefined,
      cache: 'no-store',
      redirect: 'manual',
    })
  } catch {
    return null
  }
}

export function unreachable() {
  return NextResponse.json({ message: "Can't reach the ToWork API. Is the backend running?" }, { status: 502 })
}

/** Convert a backend response into a Next response, clearing the session on 401. */
export async function relay(res: Response): Promise<NextResponse> {
  const response =
    res.status === 204 || res.status === 304
      ? new NextResponse(null, { status: res.status })
      : new NextResponse(await res.arrayBuffer(), {
          status: res.status,
          headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
        })

  const retryAfter = res.headers.get('retry-after')
  if (retryAfter) response.headers.set('Retry-After', retryAfter)
  response.headers.set('Cache-Control', 'no-store')

  if (res.status === 401) clearSession(response)
  return response
}
