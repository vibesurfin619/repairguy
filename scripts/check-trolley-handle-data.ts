import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { outstandingRepairs, workflowDefinitions, items } from '../src/lib/schema';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkTrolleyHandleData() {
  try {
    console.log('🔍 Checking trolley and handle repair data...\n');
    
    // Check total counts
    const allRepairs = await db.select().from(outstandingRepairs);
    const trolleyRepairs = await db.select().from(outstandingRepairs).where(eq(outstandingRepairs.repairType, 'TROLLEY_REPLACEMENT'));
    const handleRepairs = await db.select().from(outstandingRepairs).where(eq(outstandingRepairs.repairType, 'HANDLE_REPLACEMENT'));
    const allItems = await db.select().from(items);
    
    console.log('📊 Summary:');
    console.log(`Total Items: ${allItems.length}`);
    console.log(`Total Outstanding Repairs: ${allRepairs.length}`);
    console.log(`Trolley Replacements: ${trolleyRepairs.length}`);
    console.log(`Handle Replacements: ${handleRepairs.length}`);
    
    // Check repair types distribution
    const repairTypeCounts = allRepairs.reduce((acc, repair) => {
      acc[repair.repairType] = (acc[repair.repairType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n🔧 Repair Type Distribution:');
    Object.entries(repairTypeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    // Check status distribution
    const statusCounts = allRepairs.reduce((acc, repair) => {
      acc[repair.status] = (acc[repair.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📋 Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Show sample items with their repairs
    console.log('\n📦 Sample Items with Repairs:');
    const sampleItems = allItems.slice(0, 5);
    
    for (const item of sampleItems) {
      const itemRepairs = allRepairs.filter(repair => repair.itemId === item.id);
      console.log(`\n${item.sku} (${item.lp}):`);
      itemRepairs.forEach(repair => {
        console.log(`  - ${repair.repairType}: ${repair.status} (Priority: ${repair.priority})`);
        console.log(`    Description: ${repair.description}`);
      });
    }
    
    // Verify only trolley and handle repairs exist
    const otherRepairTypes = allRepairs.filter(repair => 
      repair.repairType !== 'TROLLEY_REPLACEMENT' && 
      repair.repairType !== 'HANDLE_REPLACEMENT'
    );
    
    if (otherRepairTypes.length > 0) {
      console.log('\n⚠️  Warning: Found repair types other than trolley and handle:');
      otherRepairTypes.forEach(repair => {
        console.log(`  - ${repair.repairType} for item ${repair.itemId}`);
      });
    } else {
      console.log('\n✅ Confirmed: Only trolley and handle repairs exist in the database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTrolleyHandleData();
