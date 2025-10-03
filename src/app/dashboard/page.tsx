import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  repairSessions, 
  items, 
  users, 
  outstandingRepairs,
  workflowDefinitions,
  labels 
} from '@/lib/schema';
import { eq, desc, asc, count, sql } from 'drizzle-orm';
import { DashboardStats } from '@/components/DashboardStats';
import { RecentRepairs } from '@/components/RecentRepairs';
import { RepairsByStatus } from '@/components/RepairsByStatus';
import { OutstandingRepairsTile } from '@/components/OutstandingRepairsTile';
import { WorkflowStatsTile } from '@/components/WorkflowStatsTile';

export default async function DashboardPage() {
  const user = await requireAuth();
  
  // Fetch dashboard statistics
  const [
    totalRepairSessions,
    totalItems,
    totalUsers,
    totalOutstandingRepairs,
    totalWorkflows,
    totalLabels,
    recentSessions,
    sessionsByStatus,
    recentItems,
    outstandingRepairsData,
    workflowStats
  ] = await Promise.all([
    // Total repair sessions
    db.select({ count: count() }).from(repairSessions),
    
    // Total items
    db.select({ count: count() }).from(items),
    
    // Total users
    db.select({ count: count() }).from(users),
    
    // Total outstanding repairs
    db.select({ count: count() }).from(outstandingRepairs),
    
    // Total workflows
    db.select({ count: count() }).from(workflowDefinitions),
    
    // Total labels
    db.select({ count: count() }).from(labels),
    
    // Recent repair sessions (last 5)
    db.select({
      id: repairSessions.id,
      status: repairSessions.status,
      startedAt: repairSessions.startedAt,
      itemId: repairSessions.itemId,
      technicianId: repairSessions.technicianId,
      itemLp: items.lp,
      technicianName: users.name
    })
    .from(repairSessions)
    .leftJoin(items, eq(repairSessions.itemId, items.id))
    .leftJoin(users, eq(repairSessions.technicianId, users.id))
    .orderBy(desc(repairSessions.startedAt))
    .limit(5),
    
    // Sessions by status
    db.select({
      status: repairSessions.status,
      count: count()
    })
    .from(repairSessions)
    .groupBy(repairSessions.status),
    
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
    .limit(5),
    
    // Outstanding repairs with details
    db.select({
      id: outstandingRepairs.id,
      repairType: outstandingRepairs.repairType,
      status: outstandingRepairs.status,
      priority: outstandingRepairs.priority,
      description: outstandingRepairs.description,
      estimatedCost: outstandingRepairs.estimatedCost,
      createdAt: outstandingRepairs.createdAt,
      itemLp: items.lp,
      technicianName: users.name
    })
    .from(outstandingRepairs)
    .leftJoin(items, eq(outstandingRepairs.itemId, items.id))
    .leftJoin(users, eq(outstandingRepairs.assignedTechnicianId, users.id))
    .orderBy(desc(outstandingRepairs.priority), asc(outstandingRepairs.createdAt))
    .limit(10),
    
    // Workflow statistics
    db.select({
      name: workflowDefinitions.name,
      version: workflowDefinitions.version,
      isActive: workflowDefinitions.isActive,
      sessionCount: count(repairSessions.id)
    })
    .from(workflowDefinitions)
    .leftJoin(repairSessions, eq(workflowDefinitions.id, repairSessions.workflowVersionId))
    .groupBy(workflowDefinitions.id, workflowDefinitions.name, workflowDefinitions.version, workflowDefinitions.isActive)
    .orderBy(desc(count(repairSessions.id)))
    .limit(5)
  ]);

  const stats = {
    totalRepairSessions: totalRepairSessions[0]?.count || 0,
    totalItems: totalItems[0]?.count || 0,
    totalUsers: totalUsers[0]?.count || 0,
    totalOutstandingRepairs: totalOutstandingRepairs[0]?.count || 0,
    totalWorkflows: totalWorkflows[0]?.count || 0,
    totalLabels: totalLabels[0]?.count || 0
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
        <OutstandingRepairsTile repairs={outstandingRepairsData} />
        <WorkflowStatsTile workflows={workflowStats} />
      </div>
      
      {/* Recent Data Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentRepairs sessions={recentSessions} />
        <RepairsByStatus sessionsByStatus={sessionsByStatus} />
      </div>
    </div>
  );
}

