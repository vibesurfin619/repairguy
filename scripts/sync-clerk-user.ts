#!/usr/bin/env tsx

/**
 * Script to sync a specific Clerk user with Neon database using Drizzle ORM
 * Run with: npx tsx scripts/sync-clerk-user.ts
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

async function syncClerkUser() {
  const clerkUserId = 'user_33WWUo5GYcC8r3vhA97AO3qhRxt';
  
  console.log(`🔍 Syncing Clerk user: ${clerkUserId}`);
  
  // Verify environment variables are loaded
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not found in environment variables');
    process.exit(1);
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded successfully');
  
  // Create database connection directly
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  console.log('✅ Database connection established');
  
  try {
    // Fetch user data from Clerk API
    console.log('📋 Fetching user data from Clerk...');
    
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
    }
    
    const clerkUser = await response.json();
    
    console.log(`✅ Found user in Clerk: ${clerkUser.email_addresses[0]?.email_address} (${clerkUser.id})`);
    console.log(`   - Name: ${clerkUser.first_name} ${clerkUser.last_name}`);
    console.log(`   - Email: ${clerkUser.email_addresses[0]?.email_address}`);
    
    // Check if user exists in database using Drizzle
    console.log('🔍 Checking database for user...');
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);
    
    if (!existingUser) {
      console.log('📝 Creating new user in database...');
      
      // Create new user in database with TECHNICIAN role (default)
      const [newUser] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          clerkId: clerkUserId,
          email: clerkUser.email_addresses[0]?.email_address || '',
          name: clerkUser.first_name && clerkUser.last_name 
            ? `${clerkUser.first_name} ${clerkUser.last_name}` 
            : clerkUser.first_name || null,
          role: 'TECHNICIAN', // Default role
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      
      console.log('✅ Created new user in database');
      console.log(`   - ID: ${newUser.id}`);
      console.log(`   - Email: ${newUser.email}`);
      console.log(`   - Role: ${newUser.role}`);
    } else {
      console.log('📝 User already exists in database');
      console.log(`   - ID: ${existingUser.id}`);
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Role: ${existingUser.role}`);
      
      // Update user info if needed
      const needsUpdate = 
        existingUser.email !== (clerkUser.email_addresses[0]?.email_address || '') ||
        existingUser.name !== (clerkUser.first_name && clerkUser.last_name 
          ? `${clerkUser.first_name} ${clerkUser.last_name}` 
          : clerkUser.first_name || null);
      
      if (needsUpdate) {
        console.log('🔄 Updating user information...');
        
        const [updatedUser] = await db
          .update(users)
          .set({
            email: clerkUser.email_addresses[0]?.email_address || '',
            name: clerkUser.first_name && clerkUser.last_name 
              ? `${clerkUser.first_name} ${clerkUser.last_name}` 
              : clerkUser.first_name || null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.clerkId, clerkUserId))
          .returning();
        
        console.log('✅ Updated user information');
        console.log(`   - Email: ${updatedUser.email}`);
        console.log(`   - Name: ${updatedUser.name}`);
      }
    }
    
    // Update Clerk metadata to match database role
    console.log('🔄 Updating Clerk metadata...');
    try {
      const currentRole = existingUser?.role || 'TECHNICIAN';
      
      const updateResponse = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: {
            roles: [currentRole],
          },
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Clerk API update error: ${updateResponse.status} ${updateResponse.statusText}`);
      }
      
      console.log(`✅ Updated Clerk metadata to ${currentRole} role`);
    } catch (clerkError) {
      console.error('❌ Failed to update Clerk metadata:', clerkError);
      console.log('⚠️  Database sync completed successfully, but Clerk metadata update failed');
      console.log('   You may need to manually update the user\'s metadata in Clerk Dashboard');
    }
    
    console.log('\n🎉 Successfully synced Clerk user with Neon database!');
    console.log('\n📋 Summary:');
    console.log(`   - Clerk ID: ${clerkUserId}`);
    console.log(`   - Email: ${clerkUser.email_addresses[0]?.email_address}`);
    console.log(`   - Database: ${existingUser ? 'Updated' : 'Created'}`);
    console.log(`   - Clerk Metadata: Updated`);
    
  } catch (error) {
    console.error('❌ Failed to sync user:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  syncClerkUser()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { syncClerkUser };
