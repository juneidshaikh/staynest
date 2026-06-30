import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

const PROTECTED_PATHS = ['/dashboard', '/profile', '/bookings', '/wishlist', '/owner', '/admin', '/messages', '/settings']
const ADMIN_PATHS = ['/admin']
const OWNER_PATHS = ['/owner']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get('access_token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const payload = verifyAccessToken(token)

    if (ADMIN_PATHS.some(p => pathname.startsWith(p)) && !['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (OWNER_PATHS.some(p => pathname.startsWith(p)) && !['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  } catch {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/bookings/:path*', '/wishlist/:path*', '/owner/:path*', '/admin/:path*', '/messages/:path*', '/settings/:path*'],
}
