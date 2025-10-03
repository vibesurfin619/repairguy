#!/usr/bin/env tsx

/**
 * Script to sync all users to database
 * Run with: npx tsx scripts/sync-users-to-technicians.ts
 */

import { clerkClient } from '@clerk/nextjs/server';
import { db } from '../src/lib/db';
import { users } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function syncAllUsersToDatabase() {
  console.log('🚀 Starting user sync to database...');
  
  try {
    // Get all users from Clerk
    console.log('📋 Fetching users from Clerk...');
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100, // Adjust as needed for your user count
    });
    
    console.log(`Found ${clerkUsers.data.length} users in Clerk`);
    
    const results = {
      created: 0,
      updated: 0,
      clerkUpdated: 0,
      errors: 0,
    };
    
    // Process each user
    for (const clerkUser of clerkUsers.data) {
      try {
        console.log(`Processing user: ${clerkUser.emailAddresses[0]?.emailAddress || 'No email'} (${clerkUser.id})`);
        
        // Check if user exists in database
        const [existingUser] = await db.select()
          .from(users)
          .where(eq(users.clerkId, clerkUser.id))
          .limit(1);
        
        if (!existingUser) {
          // Create new user in database
          await db.insert(users).values({
            id: crypto.randomUUID(),
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: clerkUser.firstName && clerkUser.lastName 
              ? `${clerkUser.firstName} ${clerkUser.lastName}` 
              : clerkUser.firstName || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          console.log(`✅ Created new user in database`);
          results.created++;
        } else {
          console.log(`⏭️  User already exists in database`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to process user ${clerkUser.id}:`, error);
        results.errors++;
      }
    }
    
    console.log('\n📊 Sync Results:');
    console.log(`- Created: ${results.created} users`);
    console.log(`- Updated: ${results.updated} users`);
    console.log(`- Errors: ${results.errors} users`);
    
    if (results.errors === 0) {
      console.log('\n🎉 All users successfully synced to database!');
    } else {
      console.log('\n⚠️  Sync completed with some errors. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Failed to sync users:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  syncAllUsersToDatabase()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { syncAllUsersToTechnicians };
