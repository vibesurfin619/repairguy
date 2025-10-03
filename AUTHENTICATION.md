# Authentication Rules for RepairGuy

This project enforces the exclusive use of **Clerk** for all authentication needs. This document outlines the rules, utilities, and best practices for maintaining consistent authentication throughout the application.

## 🔐 Authentication Provider Rule

**RULE**: All authentication MUST use Clerk. No other authentication providers are allowed.

- ✅ Use Clerk's authentication hooks and utilities
- ✅ Use server-side Clerk functions for API routes
- ❌ Never implement custom authentication logic
- ❌ Never use other authentication providers (NextAuth, Auth0, etc.)

## 🏗️ Architecture Overview

### Middleware Layer (`middleware.ts`)
- Enforces authentication on protected routes
- Redirects unauthenticated users to sign-in
- Adds `X-Auth-Provider: Clerk` header to all responses
- Protects API routes with clear error messages

### Authentication Utilities

#### Server-Side (`src/lib/auth.ts`)
- `requireAuth()` - Throws error if not authenticated
- `requireAuthWithRedirect()` - Redirects to sign-in if not authenticated
- `getCurrentUser()` - Safely gets current user (returns null if not authenticated)
- `hasRole(role)` - Checks if user has specific role
- `requireRole(role)` - Requires specific role or throws error
- `authenticateApiRequest()` - API route authentication helper

#### Client-Side (`src/lib/auth-client.ts`)
- `useRequireAuth()` - Hook that redirects if not authenticated
- `useRequireRole()` - Hook for role-based access control
- `AuthGuard` - Component wrapper for protected content
- `useSignOut()` - Consistent sign-out functionality

#### API Helpers (`src/lib/auth-api.ts`)
- `withAuth()` - HOC for API routes requiring authentication
- `withRole()` - HOC for API routes requiring specific roles
- `withRateLimit()` - Rate limiting for authenticated endpoints

## 🛡️ Protection Patterns

### Page Protection
```typescript
// Server Component
import { requireAuthWithRedirect } from '@/lib/auth';

export default async function ProtectedPage() {
  await requireAuthWithRedirect('/dashboard');
  // Page content here
}

// Client Component
import { AuthGuard } from '@/lib/auth-client';

export default function ProtectedClientPage() {
  return (
    <AuthGuard>
      {/* Protected content here */}
    </AuthGuard>
  );
}
```

### API Route Protection
```typescript
import { withAuth } from '@/lib/auth-api';

export const GET = withAuth(async (req, { userId }) => {
  // Protected API logic here
  return NextResponse.json({ userId, data: 'protected' });
});
```

### Role-Based Protection
```typescript
import { withRole } from '@/lib/auth-api';

export const POST = withRole('admin', async (req, { userId }) => {
  // Admin-only API logic here
  return NextResponse.json({ message: 'Admin access granted' });
});
```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Optional Environment Variables
```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
CLERK_WEBHOOK_SECRET=whsec_...
```

### Environment Validation
The application automatically validates Clerk configuration on startup:

```typescript
import { requireValidClerkEnvironment } from '@/lib/env-validation';

// In your app startup
requireValidClerkEnvironment();
```

## 🛠️ Development Guidelines

### 1. Authentication Checks
- Always use provided authentication utilities
- Never implement custom JWT validation
- Always handle authentication errors gracefully

### 2. Role-Based Access Control
- Define roles in Clerk Dashboard
- Store roles in user's `publicMetadata`
- Use `hasRole()` and `requireRole()` utilities

### 3. Error Handling
- Provide clear error messages mentioning Clerk
- Return appropriate HTTP status codes (401, 403)
- Include provider information in error responses

### 4. Testing Authentication
- Test with authenticated and unauthenticated states
- Verify role-based access controls
- Test redirect flows

## 🚨 Security Considerations

1. **Never expose secret keys** in client-side code
2. **Always validate authentication** on server-side for sensitive operations
3. **Use HTTPS** in production environments
4. **Regularly rotate** Clerk secrets
5. **Monitor authentication logs** for suspicious activity

## 📝 Route Configuration

### Public Routes (No Authentication Required)
- `/` - Landing page
- `/sign-in` - Sign-in page
- `/sign-up` - Sign-up page
- `/api/webhooks/*` - Webhook endpoints

### Protected Routes (Authentication Required)
- All other routes require authentication
- Users are redirected to `/sign-in` if not authenticated

### Protected API Routes
- `/api/protected/*` - General protected APIs
- `/api/user/*` - User-specific APIs
- `/api/admin/*` - Admin-only APIs

## 🔄 Migration from Other Auth Providers

If migrating from another authentication provider:

1. **Remove old auth configuration** completely
2. **Update all authentication checks** to use Clerk utilities
3. **Test all protected routes** and API endpoints
4. **Update user data migration** to match Clerk's user structure
5. **Verify role mappings** if using RBAC

## 🆘 Troubleshooting

### Common Issues

1. **"Authentication required" errors**
   - Check environment variables are set correctly
   - Verify Clerk configuration in dashboard
   - Ensure middleware is properly configured

2. **Redirect loops**
   - Check public routes configuration
   - Verify sign-in/sign-up URLs are correct
   - Ensure middleware matcher patterns are correct

3. **Role-based access denied**
   - Verify roles are set in Clerk Dashboard
   - Check user's publicMetadata contains roles
   - Ensure role names match exactly

## 📞 Support

For Clerk-specific issues:
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Community](https://clerk.com/discord)
- [Clerk Support](https://clerk.com/support)

For application-specific authentication issues, review this documentation and the authentication utilities in the codebase.
