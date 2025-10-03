import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/test-clerk(.*)',
  '/api/webhooks(.*)',
]);

// Define API routes that require authentication
const isProtectedApiRoute = createRouteMatcher([
  '/api/protected(.*)',
  '/api/user(.*)',
  '/api/admin(.*)',
  '/api/data(.*)',
  '/api/test-db(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  
  // For API routes that require authentication
  if (isProtectedApiRoute(req) && !userId) {
    return NextResponse.json(
      { error: 'Authentication required. Please use Clerk authentication.' },
      { status: 401 }
    );
  }
  
  // For non-API routes that require authentication
  if (!isPublicRoute(req) && !isApiRoute && !userId) {
    return (await auth()).redirectToSignIn();
  }
  
  // Add custom header to indicate Clerk is being used
  const response = NextResponse.next();
  response.headers.set('X-Auth-Provider', 'Clerk');
  
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
