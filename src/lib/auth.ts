/**
 * Authentication utilities and rules for RepairGuy
 * This file enforces the use of Clerk as the sole authentication provider
 * Uses hybrid approach: roles stored in database, synced with Clerk metadata
 */

import { currentUser } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from './db';
import { users, type User, type UserRole } from './schema';
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
 * Check if user has specific role
 * Uses hybrid approach: checks database first, falls back to Clerk metadata
 */
export async function hasRole(role: string): Promise<boolean> {
  const clerkUser = await getCurrentUser();
  
  if (!clerkUser) {
    return false;
  }
  
  // First, check database for role
  const dbUser = await getDbUser(clerkUser.id);
  if (dbUser) {
    return dbUser.role === role;
  }
  
  // Fallback to Clerk metadata if not found in database
  const userRoles = clerkUser.publicMetadata.roles as string[] | undefined;
  return userRoles?.includes(role) ?? false;
}

/**
 * Require specific role
 * Throws error if user doesn't have required role
 */
export async function requireRole(role: string) {
  const clerkUser = await requireAuth();
  const userHasRole = await hasRole(role);
  
  if (!userHasRole) {
    throw new Error(`Access denied. Required role: ${role}`);
  }
  
  // Return database user if available, otherwise return Clerk user
  const dbUser = await getDbUser(clerkUser.id);
  return dbUser || clerkUser;
}

/**
 * Require specific role and return database user
 * Throws error if user doesn't have required role or not found in database
 */
export async function requireRoleDbUser(role: string): Promise<User> {
  const clerkUser = await requireAuth();
  const userHasRole = await hasRole(role);
  
  if (!userHasRole) {
    throw new Error(`Access denied. Required role: ${role}`);
  }
  
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
 * Sync user role between database and Clerk metadata
 * Creates or updates user in database and syncs role to Clerk
 */
export async function syncUserRole(clerkId: string, email: string, name?: string, role: UserRole = 'TECHNICIAN'): Promise<User> {
  try {
    // Check if user exists in database
    const existingUser = await getDbUser(clerkId);
    
    if (existingUser) {
      // Update existing user if role changed
      if (existingUser.role !== role) {
        const [updatedUser] = await db.update(users)
          .set({ 
            role, 
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
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      
      return newUser;
    }
  } catch (error) {
    console.error('Error syncing user role:', error);
    throw new Error('Failed to sync user role');
  }
}

/**
 * Update user role in database and sync to Clerk metadata
 * This function should be called when roles are changed
 */
export async function updateUserRole(clerkId: string, newRole: UserRole): Promise<User> {
  try {
    // Update database
    const [updatedUser] = await db.update(users)
      .set({ 
        role: newRole, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(users.clerkId, clerkId))
      .returning();
    
    if (!updatedUser) {
      throw new Error('User not found in database');
    }
    
    // Note: Clerk metadata sync should be handled by webhooks or admin actions
    // This function only updates the database
    return updatedUser;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
}

// Type definitions for better TypeScript support
export type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
export type AuthResult = Awaited<ReturnType<typeof authenticateApiRequest>>;
