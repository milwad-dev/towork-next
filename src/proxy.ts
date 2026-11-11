import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimistic route protection based on the presence of the session cookie.
 * The API remains the source of truth: an expired token gets a 401, the
 * /api proxy clears the cookie and the client redirects to /login.
 */
const SESSION_COOKIE = 'towork_session'
const GUEST_ONLY = ['/login', '/register', '/forgot-password']

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const signedIn = !!request.cookies.get(SESSION_COOKIE)?.value
  const guestOnly = GUEST_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (pathname === '/') {
    return NextResponse.redirect(new URL(signedIn ? '/today' : '/login', request.url))
  }
  if (guestOnly) {
    return signedIn ? NextResponse.redirect(new URL('/today', request.url)) : NextResponse.next()
  }
  if (!signedIn) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname + search)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  // Everything except API routes, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|.*\\.(?:png|jpg|svg|webp|ico|txt)$).*)'],
}
