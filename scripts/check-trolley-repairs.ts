import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { outstandingRepairs, items } from '../src/lib/schema';
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

async function checkTrolleyRepairs() {
  try {
    console.log('Checking TROLLEY_REPLACEMENT outstanding repairs...');
    
    const trolleyRepairs = await db.select({
      repairId: outstandingRepairs.id,
      repairType: outstandingRepairs.repairType,
      status: outstandingRepairs.status,
      itemId: outstandingRepairs.itemId,
      itemLp: items.lp,
      itemSku: items.sku,
    })
    .from(outstandingRepairs)
    .innerJoin(items, eq(outstandingRepairs.itemId, items.id))
    .where(eq(outstandingRepairs.repairType, 'TROLLEY_REPLACEMENT'));
    
    console.log(`Found ${trolleyRepairs.length} trolley repairs:`);
    trolleyRepairs.forEach((repair, index) => {
      console.log(`  ${index + 1}. ID: ${repair.repairId}`);
      console.log(`     Status: ${repair.status}`);
      console.log(`     Item: ${repair.itemLp} (${repair.itemSku})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTrolleyRepairs();
