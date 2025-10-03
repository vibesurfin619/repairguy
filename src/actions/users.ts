'use server';

import { z } from 'zod';
import { requireRoleDbUser, updateUserRole, getDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Validation schemas
const updateUserRoleSchema = z.object({
  clerkId: z.string().min(1, 'Clerk ID is required'),
  role: z.enum(['TECHNICIAN', 'ADMIN', 'SUPERVISOR']),
});

const syncAllUsersSchema = z.object({
  defaultRole: z.enum(['TECHNICIAN', 'ADMIN', 'SUPERVISOR']).default('TECHNICIAN'),
  updateClerkMetadata: z.boolean().default(true),
});

// Type exports
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type SyncAllUsersInput = z.infer<typeof syncAllUsersSchema>;

/**
 * Update a single user's role in database and optionally sync to Clerk
 */
export async function updateUserRoleAction(input: UpdateUserRoleInput) {
  try {
    // Validate input
    const validatedInput = updateUserRoleSchema.parse(input);
    
    // Require admin role to update user roles
    await requireRoleDbUser('ADMIN');
    
    // Update database
    const updatedUser = await updateUserRole(validatedInput.clerkId, validatedInput.role);
    
    // Update Clerk metadata
    try {
      await clerkClient.users.updateUserMetadata(validatedInput.clerkId, {
        publicMetadata: {
          roles: [validatedInput.role],
        },
      });
    } catch (clerkError) {
      console.error('Failed to update Clerk metadata:', clerkError);
      // Continue even if Clerk update fails - database is updated
    }
    
    revalidatePath('/dashboard');
    return { 
      success: true, 
      user: updatedUser,
      message: `User role updated to ${validatedInput.role}` 
    };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user role' 
    };
  }
}

/**
 * Sync all users in database to a specific role and update Clerk metadata
 * This is useful for bulk role updates
 */
export async function syncAllUsersToRole(input: SyncAllUsersInput) {
  try {
    // Validate input
    const validatedInput = syncAllUsersSchema.parse(input);
    
    // Require admin role to perform bulk updates
    await requireRoleDbUser('ADMIN');
    
    // Get all users from database
    const allUsers = await db.select().from(users);
    
    const results = {
      updated: 0,
      errors: 0,
      clerkUpdated: 0,
      clerkErrors: 0,
    };
    
    // Update each user
    for (const user of allUsers) {
      try {
        // Update database
        await db.update(users)
          .set({ 
            role: validatedInput.defaultRole,
            updatedAt: new Date().toISOString()
          })
          .where(eq(users.clerkId, user.clerkId));
        
        results.updated++;
        
        // Update Clerk metadata if requested
        if (validatedInput.updateClerkMetadata) {
          try {
            await clerkClient.users.updateUserMetadata(user.clerkId, {
              publicMetadata: {
                roles: [validatedInput.defaultRole],
              },
            });
            results.clerkUpdated++;
          } catch (clerkError) {
            console.error(`Failed to update Clerk metadata for user ${user.clerkId}:`, clerkError);
            results.clerkErrors++;
          }
        }
      } catch (error) {
        console.error(`Failed to update user ${user.clerkId}:`, error);
        results.errors++;
      }
    }
    
    revalidatePath('/dashboard');
    return {
      success: true,
      results,
      message: `Updated ${results.updated} users to ${validatedInput.defaultRole} role`
    };
  } catch (error) {
    console.error('Failed to sync all users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync all users'
    };
  }
}

/**
 * Sync all Clerk users to database and set default role
 * This creates database records for users that exist in Clerk but not in database
 */
export async function syncClerkUsersToDatabase(defaultRole: 'TECHNICIAN' | 'ADMIN' | 'SUPERVISOR' = 'TECHNICIAN') {
  try {
    // Require admin role to perform sync
    await requireRoleDbUser('ADMIN');
    
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
        // Check if user exists in database
        const existingUser = await getDbUser(clerkUser.id);
        
        if (!existingUser) {
          // Create new user in database
          await db.insert(users).values({
            id: crypto.randomUUID(),
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: clerkUser.firstName && clerkUser.lastName 
              ? `${clerkUser.firstName} ${clerkUser.lastName}` 
              : clerkUser.firstName || null,
            role: defaultRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          results.created++;
        } else if (existingUser.role !== defaultRole) {
          // Update existing user's role
          await db.update(users)
            .set({ 
              role: defaultRole,
              updatedAt: new Date().toISOString()
            })
            .where(eq(users.clerkId, clerkUser.id));
          
          results.updated++;
        }
        
        // Update Clerk metadata to match database
        try {
          await clerkClient.users.updateUserMetadata(clerkUser.id, {
            publicMetadata: {
              roles: [defaultRole],
            },
          });
        } catch (clerkError) {
          console.error(`Failed to update Clerk metadata for user ${clerkUser.id}:`, clerkError);
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
 * Get all users with their roles
 */
export async function getAllUsers() {
  try {
    // Require admin role to view all users
    await requireRoleDbUser('ADMIN');
    
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
