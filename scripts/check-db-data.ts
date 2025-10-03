import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { outstandingRepairs, workflowDefinitions, items } from '../src/lib/schema';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkData() {
  try {
    console.log('Checking outstanding repairs...');
    const repairs = await db.select().from(outstandingRepairs).limit(5);
    console.log('Outstanding repairs found:', repairs.length);
    repairs.forEach(repair => {
      console.log(`- ID: ${repair.id}, Type: ${repair.repairType}, Status: ${repair.status}, Item: ${repair.itemId}`);
    });
    
    console.log('\nChecking workflow definitions...');
    const workflows = await db.select().from(workflowDefinitions).limit(5);
    console.log('Workflow definitions found:', workflows.length);
    workflows.forEach(workflow => {
      console.log(`- ID: ${workflow.id}, Name: ${workflow.name}, AppliesTo: ${JSON.stringify(workflow.appliesTo)}`);
    });
    
    console.log('\nChecking items...');
    const itemsData = await db.select().from(items).limit(5);
    console.log('Items found:', itemsData.length);
    itemsData.forEach(item => {
      console.log(`- ID: ${item.id}, LP: ${item.lp}, SKU: ${item.sku}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
