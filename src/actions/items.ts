'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { items, workflowDefinitions, outstandingRepairs, users } from '@/lib/schema';
import { eq, ilike } from 'drizzle-orm';
import { scanItemSchema, type ScanItemInput } from '@/lib/validations/items';

export async function scanItem(input: ScanItemInput) {
  try {
    // Require authentication first
    const user = await requireAuth();
    console.log('User authenticated:', user.id);
    
    // Validate input with Zod
    const validatedInput = scanItemSchema.parse(input);
    console.log('Input validated:', validatedInput);
    
    // Check if database is initialized
    if (!db) {
      console.error('Database not initialized');
      return { 
        success: false, 
        error: 'Database connection error',
        message: 'Database not properly initialized' 
      };
    }

    console.log('Searching for item with LP:', validatedInput.lp);
    
    // First try exact match (case-sensitive)
    let [item] = await db.select()
      .from(items)
      .where(eq(items.lp, validatedInput.lp))
      .limit(1);
    
    // If no exact match found, try case-insensitive search
    if (!item) {
      console.log('No exact match found, trying case-insensitive search...');
      [item] = await db.select()
        .from(items)
        .where(ilike(items.lp, validatedInput.lp))
        .limit(1);
    }
    
    // If still no match, try with trimmed input
    if (!item) {
      const trimmedLp = validatedInput.lp.trim().toUpperCase();
      console.log('Trying with trimmed and uppercase LP:', trimmedLp);
      [item] = await db.select()
        .from(items)
        .where(ilike(items.lp, trimmedLp))
        .limit(1);
    }
    
    console.log('Database query result:', item);
    
    if (!item) {
      console.log('No item found with LP:', validatedInput.lp);
      
      // For debugging: let's see what items actually exist (first 5)
      console.log('Checking what items exist in database...');
      const allItems = await db.select({ id: items.id, lp: items.lp, sku: items.sku })
        .from(items)
        .limit(5);
      console.log('Sample items in database:', allItems);
      
      return { 
        success: false, 
        error: 'Item not found',
        message: `No item found with license plate: ${validatedInput.lp}`,
        debug: {
          searchedFor: validatedInput.lp,
          sampleItems: allItems.map(i => i.lp)
        }
      };
    }

    // Get current workflow information if exists
    let workflowInfo = null;
    if (item.currentWorkflowVersionId) {
      console.log('Fetching workflow for item:', item.currentWorkflowVersionId);
      const [workflow] = await db.select()
        .from(workflowDefinitions)
        .where(eq(workflowDefinitions.id, item.currentWorkflowVersionId))
        .limit(1);
      
      workflowInfo = workflow || null;
      console.log('Workflow found:', workflowInfo);
    }

    // Get outstanding repairs for this item
    console.log('Fetching outstanding repairs for item:', item.id);
    const itemOutstandingRepairs = await db.select({
      id: outstandingRepairs.id,
      repairType: outstandingRepairs.repairType,
      status: outstandingRepairs.status,
      description: outstandingRepairs.description,
      priority: outstandingRepairs.priority,
      estimatedCost: outstandingRepairs.estimatedCost,
      actualCost: outstandingRepairs.actualCost,
      completedAt: outstandingRepairs.completedAt,
      createdAt: outstandingRepairs.createdAt,
      updatedAt: outstandingRepairs.updatedAt,
      assignedTechnician: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    })
    .from(outstandingRepairs)
    .leftJoin(users, eq(outstandingRepairs.assignedTechnicianId, users.id))
    .where(eq(outstandingRepairs.itemId, item.id));
    
    console.log('Outstanding repairs found:', itemOutstandingRepairs.length);

    // Separate outstanding repairs into pending and completed
    const pendingRepairs = itemOutstandingRepairs.filter(repair => 
      repair.status === 'PENDING' || repair.status === 'IN_PROGRESS'
    );
    const completedRepairs = itemOutstandingRepairs.filter(repair => 
      repair.status === 'COMPLETED'
    );
    
    const result = { 
      success: true, 
      item: {
        ...item,
        workflow: workflowInfo,
        pendingRepairs,
        completedRepairs
      }
    };
    
    console.log('Scan completed successfully');
    return result;
    
  } catch (error) {
    console.error('Failed to scan item:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return { 
          success: false, 
          error: 'Authentication required',
          message: 'Please sign in to scan items' 
        };
      }
      
      if (error.message.includes('Database')) {
        return { 
          success: false, 
          error: 'Database error',
          message: 'Unable to connect to database' 
        };
      }
    }
    
    return { 
      success: false, 
      error: 'Failed to scan item',
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
