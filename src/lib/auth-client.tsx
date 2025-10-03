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
 * Authentication guard component
 * Wraps components that require authentication
 */
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading) {
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
