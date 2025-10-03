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
 * API Route wrapper that enforces role-based access control
 * Uses hybrid approach: checks database first, falls back to Clerk metadata
 */
export function withRole<T = any>(
  requiredRole: string,
  handler: (req: NextRequest, auth: { userId: string }, context: T) => Promise<NextResponse> | NextResponse
) {
  return withAuth(async (req: NextRequest, authData: { userId: string }, context: T) => {
    const { getDbUser } = await import('@/lib/auth');
    
    try {
      // First, check database for role
      const dbUser = await getDbUser(authData.userId);
      
      if (dbUser) {
        if (dbUser.role !== requiredRole) {
          return NextResponse.json(
            { 
              error: 'Insufficient permissions',
              message: `This endpoint requires the '${requiredRole}' role`,
              requiredRole,
              userRole: dbUser.role
            },
            { status: 403 }
          );
        }
        
        return await handler(req, authData, context);
      }
      
      // Fallback to Clerk metadata if not found in database
      const { currentUser } = await import('@clerk/nextjs/server');
      const user = await currentUser();
      
      if (!user) {
        return NextResponse.json(
          { 
            error: 'User not found',
            message: 'Unable to retrieve user information'
          },
          { status: 404 }
        );
      }

      const userRoles = user.publicMetadata.roles as string[] | undefined;
      const hasRole = userRoles?.includes(requiredRole) ?? false;

      if (!hasRole) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            message: `This endpoint requires the '${requiredRole}' role`,
            requiredRole
          },
          { status: 403 }
        );
      }

      return await handler(req, authData, context);
    } catch (error) {
      console.error('Role check error:', error);
      return NextResponse.json(
        { 
          error: 'Authorization failed',
          message: 'Unable to verify user permissions'
        },
        { status: 500 }
      );
    }
  });
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
