import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  items, 
  users, 
  outstandingRepairs,
  workflowDefinitions,
  labels 
} from '@/lib/schema';
import { eq, desc, asc, count, sql } from 'drizzle-orm';
import { DashboardStats } from '@/components/DashboardStats';
import { OutstandingRepairsTile } from '@/components/OutstandingRepairsTile';
import { ManageWorkflowsButton } from '@/components/ManageWorkflowsButton';

export default async function DashboardPage() {
  const user = await requireAuth();
  
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  // Fetch dashboard statistics
  const [
    totalItems,
    totalUsers,
    totalOutstandingRepairs,
    totalInProgressRepairs,
    totalCompletedRepairs,
    totalFailedRepairs,
    recentItems
  ] = await Promise.all([
    // Total items
    db.select({ count: count() }).from(items),
    
    // Total users
    db.select({ count: count() }).from(users),
    
    // Total outstanding repairs (PENDING status only)
    db.select({ count: count() }).from(outstandingRepairs).where(eq(outstandingRepairs.status, 'PENDING')),
    
    // Total in-progress repairs
    db.select({ count: count() }).from(outstandingRepairs).where(eq(outstandingRepairs.status, 'IN_PROGRESS')),
    
    // Total completed repairs
    db.select({ count: count() }).from(outstandingRepairs).where(eq(outstandingRepairs.status, 'COMPLETED')),
    
    // Total failed repairs
    db.select({ count: count() }).from(outstandingRepairs).where(eq(outstandingRepairs.status, 'CANCELLED')),
    
    // Recent items (last 5)
    db.select({
      id: items.id,
      lp: items.lp,
      sku: items.sku,
      model: items.model,
      status: items.status,
      createdAt: items.createdAt
    })
    .from(items)
    .orderBy(desc(items.createdAt))
    .limit(5)
  ]);

  const stats = {
    totalItems: totalItems[0]?.count || 0,
    totalUsers: totalUsers[0]?.count || 0,
    totalOutstandingRepairs: totalOutstandingRepairs[0]?.count || 0,
    totalInProgressRepairs: totalInProgressRepairs[0]?.count || 0,
    totalCompletedRepairs: totalCompletedRepairs[0]?.count || 0,
    totalFailedRepairs: totalFailedRepairs[0]?.count || 0
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Repair Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}! 
          Overview of repair operations and system status.
        </p>
      </div>
      
      {/* Main Statistics Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardStats stats={stats} />
      </div>
      
      {/* Secondary Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <OutstandingRepairsTile />
        <ManageWorkflowsButton />
      </div>
    </div>
  );
}

