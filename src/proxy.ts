import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { locales, defaultLocale } from '@/config/i18n';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/about',
  '/contact',
  '/offline',
];

// Define auth routes (redirect to dashboard if already authenticated)
const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

// API routes that don't require auth
const publicApiRoutes = [
  '/api/auth/login',
  '/api/health',
  '/api/appointments/public',
  '/api/schedules',
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response with no-cache headers
  let response: NextResponse;

  // Skip proxy for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest.json') ||
    pathname.includes('.')
  ) {
    response = NextResponse.next();
    // Disable caching for all responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If pathname doesn't have locale, redirect to add it
  if (!pathnameHasLocale && pathname !== '/') {
    // Detect user's preferred language
    const acceptLanguage = request.headers.get('accept-language');
    let preferredLocale = defaultLocale;

    if (acceptLanguage && acceptLanguage.includes('ar')) {
      preferredLocale = 'ar';
    }

    // Check for locale cookie
    const localeCookie = request.cookies.get('locale')?.value;
    if (localeCookie && locales.includes(localeCookie as any)) {
      preferredLocale = localeCookie as any;
    }

    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Extract locale from pathname (e.g., /en/dashboard -> en)
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : defaultLocale;

  // Get auth token from cookies
  const token = request.cookies.get('auth-token');

  // Remove locale from pathname for route checking
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathWithoutLocale.startsWith(route)) || pathWithoutLocale === '/';
  
  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathWithoutLocale.startsWith(route));

  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user has token, verify it
  if (token) {
    try {
      await jwtVerify(token.value, JWT_SECRET);

      // Do not redirect away from auth routes based only on having a valid JWT.
      // The token may be valid but reference a user that no longer exists (e.g., after a DB reset),
      // which would cause an infinite redirect loop between /auth/login and /dashboard.
    } catch (error) {
      // Invalid token - this is common when JWT secret changes or tokens expire
      console.warn('Invalid JWT token, clearing and redirecting to login');
      
      // Clear invalid token and redirect to login
      response = NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
      response.cookies.set('auth-token', '', { 
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      // Don't redirect if already on auth page to prevent infinite loops
      if (!isAuthRoute) {
        return response;
      }
    }
  }

  response = NextResponse.next();
  // Disable caching for all responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
