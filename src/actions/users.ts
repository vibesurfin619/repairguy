'use server';

import { z } from 'zod';
import { requireDbUser, syncUser, getDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

/**
 * Sync all Clerk users to database
 * This creates database records for users that exist in Clerk but not in database
 */
export async function syncClerkUsersToDatabase() {
  try {
    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100, // Adjust as needed
    });
    
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
    };
    
    // Process each Clerk user
    for (const clerkUser of clerkUsers.data) {
      try {
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const name = clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.firstName || undefined;
        
        // Sync user to database
        await syncUser(clerkUser.id, email, name);
        
        // Check if this was a new user or update
        const existingUser = await getDbUser(clerkUser.id);
        if (existingUser) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (error) {
        console.error(`Failed to sync user ${clerkUser.id}:`, error);
        results.errors++;
      }
    }
    
    revalidatePath('/dashboard');
    return {
      success: true,
      results,
      message: `Synced ${results.created} new users, updated ${results.updated} existing users`
    };
  } catch (error) {
    console.error('Failed to sync Clerk users to database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync Clerk users to database'
    };
  }
}

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    const allUsers = await db.select().from(users);
    
    return {
      success: true,
      users: allUsers
    };
  } catch (error) {
    console.error('Failed to get all users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all users'
    };
  }
}
