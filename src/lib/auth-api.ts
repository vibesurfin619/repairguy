import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * API Route wrapper that enforces Clerk authentication
 * Use this to wrap API route handlers that require authentication
 */
// Overload for routes without parameters
export function withAuth(
  handler: (req: NextRequest, auth: { userId: string }) => Promise<NextResponse> | NextResponse
): (req: NextRequest) => Promise<NextResponse>;

// Overload for routes with parameters  
export function withAuth<T = any>(
  handler: (req: NextRequest, auth: { userId: string }, context: T) => Promise<NextResponse> | NextResponse
): (req: NextRequest, context: T) => Promise<NextResponse>;

// Implementation
export function withAuth<T = any>(
  handler: (req: NextRequest, auth: { userId: string }, context?: T) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest, context?: T) => {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json(
          { 
            error: 'Authentication required',
            message: 'This API endpoint requires Clerk authentication'
          },
          { status: 401 }
        );
      }

      if (context !== undefined) {
        return await handler(req, { userId }, context);
      } else {
        return await handler(req, { userId });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          message: 'Unable to verify authentication status'
        },
        { status: 500 }
      );
    }
  };
}


/**
 * Rate limiting decorator for authenticated APIs
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit<T = any>(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  handler: (req: NextRequest, auth: { userId: string }, context: T) => Promise<NextResponse> | NextResponse
) {
  return withAuth(async (req: NextRequest, authData: { userId: string }, context: T) => {
    const { userId } = authData;
    const now = Date.now();
    const key = `${userId}:${req.nextUrl.pathname}`;
    
    const existing = rateLimitMap.get(key);
    
    if (existing && existing.resetTime > now) {
      if (existing.count >= maxRequests) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${Math.ceil((existing.resetTime - now) / 1000)} seconds.`,
            retryAfter: Math.ceil((existing.resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((existing.resetTime - now) / 1000).toString()
            }
          }
        );
      }
      existing.count++;
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    }

    return await handler(req, authData, context);
  });
}
