import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

// Routes that require authentication
const protectedRoutes = [
    '/deputies',
    '/groupes',
    '/textes',
    '/commissions',
    '/causes',
    '/dossiers',
    '/messages',
]

// Routes only accessible when NOT authenticated
const authOnlyRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
]

export default auth((req) => {
    const { nextUrl, auth: session } = req
    const isLoggedIn = !!session?.user
    const path = nextUrl.pathname

    // Home page: redirect to dashboard if logged in
    if (path === '/') {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/groupes/dashboard', nextUrl))
        }
        // Not logged in - show landing page
        return NextResponse.next()
    }

    // Protected routes: redirect to signin if not logged in
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
    if (isProtectedRoute && !isLoggedIn) {
        const callbackUrl = encodeURIComponent(path + nextUrl.search)
        return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl))
    }

    // Auth routes: redirect to dashboard if already logged in
    const isAuthRoute = authOnlyRoutes.some(route => path.startsWith(route))
    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/groupes/dashboard', nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
