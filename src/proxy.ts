import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Define route protection arrays
const PUBLIC_PATHS = ['/', '/auth'];
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/debug'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip assets, next internals, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/models') || // Face-API weights
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Retrieve the JWT from cookies
  const tokenCookie = request.cookies.get('token');
  const token = tokenCookie?.value;
  const user = token ? await verifyToken(token) : null;

  // 3. Handle API Requests
  if (pathname.startsWith('/api/')) {
    // If it's a public API path, let it pass
    if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Require auth for all other API paths
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Enforce role-based access for specific admin/photographer API actions
    if (pathname.startsWith('/api/admin') && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    // Pass authenticated user context via request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-name', user.name);
    if (user.clubName) {
      requestHeaders.set('x-user-club', user.clubName);
    } else {
      requestHeaders.set('x-user-club', '');
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 4. Handle Page Routing (Frontend redirects)
  const isPublicPage = PUBLIC_PATHS.some((path) => pathname === path);

  if (!user && !isPublicPage) {
    // Redirect unauthenticated user to auth page
    const loginUrl = new URL('/auth', request.url);
    // Remember original destination
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === '/auth') {
    // Authenticated users shouldn't see login screen
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow through and inject headers for Server Components (if they read request headers)
  const requestHeaders = new Headers(request.headers);
  if (user) {
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-role', user.role);
    if (user.clubName) {
      requestHeaders.set('x-user-club', user.clubName);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api/auth/login|api/auth/register|api/auth/logout|_next/static|_next/image|favicon.ico).*)'],
};
