/**
 * Client-side authentication hooks and components
 * Ensures consistent use of Clerk authentication on the frontend
 */

'use client';

import { useAuth, useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Custom hook to ensure authentication
 * Redirects to sign-in if not authenticated
 */
export function useRequireAuth(redirectTo?: string) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      const signInUrl = redirectTo 
        ? `/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`
        : '/sign-in';
      router.push(signInUrl);
    }
  }, [isLoaded, userId, router, redirectTo]);

  return { isAuthenticated: !!userId, isLoading: !isLoaded };
}

/**
 * Custom hook for role-based access control
 */
export function useRequireRole(role: string) {
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useRequireAuth();

  const hasRole = isLoaded && user 
    ? (user.publicMetadata.roles as string[] | undefined)?.includes(role) ?? false
    : false;

  return {
    hasRole,
    isLoading: !isLoaded,
    isAuthenticated,
    user
  };
}

/**
 * Authentication guard component
 * Wraps components that require authentication
 */
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireRole?: string;
}

export function AuthGuard({ children, fallback, requireRole }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const roleCheck = useRequireRole(requireRole || '');

  if (isLoading || roleCheck.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  if (requireRole && !roleCheck.hasRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p className="text-sm text-gray-600 mt-2">Required role: {requireRole}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Sign out helper with cleanup
 */
export function useSignOut() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return handleSignOut;
}
