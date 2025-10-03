/**
 * Authentication utilities and rules for RepairGuy
 * This file enforces the use of Clerk as the sole authentication provider
 * All users have equal access to all features
 */

import { currentUser } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from './db';
import { users, type User } from './schema';
import { eq } from 'drizzle-orm';

// Authentication rule enforcement
export const AUTH_PROVIDER = 'CLERK' as const;

/**
 * Server-side authentication guard
 * Ensures that only Clerk-authenticated users can access protected resources
 */
export async function requireAuth() {
  const user = await currentUser();
  
  if (!user) {
    throw new Error('Authentication required. Please sign in using Clerk.');
  }
  
  return user;
}

/**
 * Server-side authentication guard with redirect
 * Redirects unauthenticated users to sign-in page
 */
export async function requireAuthWithRedirect(redirectTo?: string) {
  const { userId } = await auth();
  
  if (!userId) {
    const signInUrl = redirectTo 
      ? `/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`
      : '/sign-in';
    redirect(signInUrl);
  }
  
  return userId;
}

/**
 * Get current user safely
 * Returns null if not authenticated instead of throwing
 */
export async function getCurrentUser() {
  try {
    return await currentUser();
  } catch {
    return null;
  }
}

/**
 * Get user from database by Clerk ID
 * Returns null if user not found
 */
export async function getDbUser(clerkId: string): Promise<User | null> {
  try {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    
    return user || null;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return null;
  }
}

/**
 * Get current authenticated user from database
 * Returns null if not authenticated or not found in database
 */
export async function getCurrentDbUser(): Promise<User | null> {
  const clerkUser = await getCurrentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  return await getDbUser(clerkUser.id);
}

/**
 * Get current authenticated user from database
 * Throws error if not authenticated or not found in database
 */
export async function requireDbUser(): Promise<User> {
  const clerkUser = await requireAuth();
  
  const dbUser = await getDbUser(clerkUser.id);
  if (!dbUser) {
    throw new Error('User not found in database. Please contact administrator.');
  }
  
  return dbUser;
}

/**
 * API Route authentication helper
 * Use this in API routes to ensure Clerk authentication
 */
export async function authenticateApiRequest() {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      error: 'Authentication required. This API uses Clerk authentication.',
      status: 401
    };
  }
  
  const user = await currentUser();
  return { user, userId };
}

/**
 * Sync user to database
 * Creates or updates user in database
 */
export async function syncUser(clerkId: string, email: string, name?: string): Promise<User> {
  try {
    // Check if user exists in database
    const existingUser = await getDbUser(clerkId);
    
    if (existingUser) {
      // Update existing user if needed
      if (existingUser.email !== email || existingUser.name !== name) {
        const [updatedUser] = await db.update(users)
          .set({ 
            email,
            name: name || null,
            updatedAt: new Date().toISOString() 
          })
          .where(eq(users.clerkId, clerkId))
          .returning();
        
        return updatedUser;
      }
      return existingUser;
    } else {
      // Create new user in database
      const [newUser] = await db.insert(users)
        .values({
          id: crypto.randomUUID(),
          clerkId,
          email,
          name: name || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      
      return newUser;
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    throw new Error('Failed to sync user');
  }
}

// Type definitions for better TypeScript support
export type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
export type AuthResult = Awaited<ReturnType<typeof authenticateApiRequest>>;
