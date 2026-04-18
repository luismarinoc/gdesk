import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle i18n routing first
  const response = intlMiddleware(request)

  // Strip locale prefix to check path
  const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/'
  const isPublicPath = PUBLIC_PATHS.some(p => pathWithoutLocale.startsWith(p))
  const isApiPath = pathname.startsWith('/api')

  if (isApiPath) return NextResponse.next()

  // Check Supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  if (!user && !isPublicPath) {
    const locale = pathname.split('/')[1] || 'es'
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (user && isPublicPath) {
    const locale = pathname.split('/')[1] || 'es'
    return NextResponse.redirect(new URL(`/${locale}/tickets`, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|otf)).*)'],
}
