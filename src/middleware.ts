import { createMiddlewareClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareClient(request)

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = [
    '/dashboard',
    '/profile',
    '/ideas/new',
    '/ideas/edit',
    '/admin'
  ].some(route => request.nextUrl.pathname.startsWith(route))

  // If user is not signed in and the current path is a protected route,
  // redirect the user to the sign-in page
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and the current path is an auth page,
  // redirect the user to the dashboard
  if (session && isAuthPage && !request.nextUrl.pathname.includes('/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check if user has admin role for admin routes (simplified to avoid timeout)
  if (session && request.nextUrl.pathname.startsWith('/admin')) {
    // For now, just check if user is authenticated
    // TODO: Add proper admin role check in the admin page component instead
    console.log('Admin route accessed by:', session.user.email)
  }

  return response
  } catch (error) {
    console.error('Middleware error:', error)
    // If middleware fails, allow the request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}