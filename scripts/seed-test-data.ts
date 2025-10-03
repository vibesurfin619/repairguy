import { config } from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables FIRST before importing db
config({ path: ['.env.local', '.env'] });

// Debug: Check if DATABASE_URL is loaded
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);
console.log('Environment variables loaded:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('CLERK')));

// Test SKUs provided
const testSkus = [
  'AWAY-ALU-CARRY-SLV',
  'AWAY-BIGGERCARRY-POLY-NVY',
  'AWAY-BIGGERCARRY-POLY-BLK',
  'AWAY-DUFFLE-35L-TAN',
  'AWAY-CARRYON-POLY-GRN',
  'AWAY-CARRYON-POLY-SND',
  'AWAY-EXPAND-MED-NAV',
  'AWAY-MEDIUM-POLY-NVY',
  'AWAY-ALU-CARRY-GRPH',
  'AWAY-FLEX-MED-NAV',
  'AWAY-LARGE-POLY-BLK',
  'AWAY-LARGE-POLY-SND',
  'AWAY-FLEX-CARRY-SEA',
  'AWAY-EXPAND-LRG-BLK',
  'AWAY-TOILETRY-SML-TAU',
  'AWAY-ALU-LARGE-SLV',
  'AWAY-DUFFLE-35L-BLK',
  'AWAY-TOILETRY-LRG-BLK',
  'AWAY-CARRYON-POLY-BLK',
  'AWAY-ALU-LARGE-GRPH',
  'AWAY-CARRYON-POLY-NVY',
  'AWAY-MEDIUM-POLY-BLK'
];

// Repair types from the schema
const repairTypes = [
  'TROLLEY_REPLACEMENT',
  'HANDLE_REPLACEMENT',
  'LINER_REPLACEMENT',
  'ZIPPER_SLIDER',
  'ZIPPER_TAPE',
  'ZIPPER_FULL_REPLACEMENT',
  'WHEEL_REPLACEMENT',
  'LOCK_REPLACEMENT',
  'LOGO_REPLACEMENT'
] as const;

// Helper function to generate LP numbers
function generateLP(): string {
  return `LP${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
}

// Helper function to extract model from SKU
function extractModel(sku: string): string {
  const parts = sku.split('-');
  if (parts.length >= 3) {
    return `${parts[1]} ${parts[2]}`;
  }
  return sku;
}

// Helper function to get random repair types for an item
function getRandomRepairTypes(count: number = 2): string[] {
  const shuffled = [...repairTypes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, repairTypes.length));
}

// Helper function to get random priority
function getRandomPriority(): number {
  return Math.floor(Math.random() * 4) + 1; // 1-4
}

// Helper function to get random cost
function getRandomCost(): number {
  return Math.floor(Math.random() * 50000) + 5000; // $50-$500 in cents
}

async function seedData() {
  // Use dynamic import after environment variables are loaded
  const { db } = await import('../src/lib/db');
  const { items, outstandingRepairs } = await import('../src/lib/schema');
  
  if (!db) {
    throw new Error('Database connection not available. Please check your DATABASE_URL.');
  }

  console.log('🌱 Starting to seed test data...');

  try {
    // Clear existing test data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing test data...');
    await db.delete(outstandingRepairs);
    await db.delete(items);

    // Insert items
    console.log('📦 Inserting items...');
    const itemsData = testSkus.map(sku => ({
      id: randomUUID(),
      lp: generateLP(),
      sku: sku,
      model: extractModel(sku),
      status: 'AWAITING_REPAIR' as const,
      currentWorkflowVersionId: null,
      grade: null,
      newBarcode: null,
      locationId: `LOC-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const insertedItems = await db.insert(items).values(itemsData).returning();
    console.log(`✅ Inserted ${insertedItems.length} items`);

    // Insert outstanding repairs for each item
    console.log('🔧 Inserting outstanding repairs...');
    const repairsData = [];

    for (const item of insertedItems) {
      // Generate 1-3 repairs per item
      const repairCount = Math.floor(Math.random() * 3) + 1;
      const itemRepairTypes = getRandomRepairTypes(repairCount);

      for (const repairType of itemRepairTypes) {
        const repair = {
          id: randomUUID(),
          itemId: item.id,
          repairType: repairType as any,
          status: Math.random() > 0.7 ? 'IN_PROGRESS' as const : 'PENDING' as const,
          description: `${repairType.replace(/_/g, ' ').toLowerCase()} needed for ${item.sku}`,
          priority: getRandomPriority(),
          estimatedCost: getRandomCost(),
          actualCost: Math.random() > 0.5 ? getRandomCost() : null,
          assignedTechnicianId: null, // We don't have users seeded yet
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        repairsData.push(repair);
      }
    }

    const insertedRepairs = await db.insert(outstandingRepairs).values(repairsData).returning();
    console.log(`✅ Inserted ${insertedRepairs.length} outstanding repairs`);

    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`Items created: ${insertedItems.length}`);
    console.log(`Outstanding repairs created: ${insertedRepairs.length}`);
    console.log(`Average repairs per item: ${(insertedRepairs.length / insertedItems.length).toFixed(1)}`);

    // Show some sample data
    console.log('\n📋 Sample seeded data:');
    console.log('Items:');
    insertedItems.slice(0, 3).forEach(item => {
      console.log(`  - ${item.sku} (${item.lp}) - ${item.status}`);
    });
    
    console.log('Outstanding Repairs:');
    insertedRepairs.slice(0, 5).forEach(repair => {
      console.log(`  - ${repair.repairType} for item ${repair.itemId} - ${repair.status} (Priority: ${repair.priority})`);
    });

    console.log('\n🎉 Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Run the seeding
seedData()
  .then(() => {
    console.log('✅ Database seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  });
