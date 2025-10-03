'use server';

import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { outstandingRepairs, workflowDefinitions, workflowFailureAnswers, items, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { completeRepairSchema, CompleteRepairInput } from '@/lib/validations/repair-workflow';

// Get repair details with workflow information
export async function getRepairWithWorkflow(repairId: string) {
  const user = await requireAuth();
  
  try {
    const repair = await db.select({
      id: outstandingRepairs.id,
      itemId: outstandingRepairs.itemId,
      repairType: outstandingRepairs.repairType,
      status: outstandingRepairs.status,
      description: outstandingRepairs.description,
      priority: outstandingRepairs.priority,
      estimatedCost: outstandingRepairs.estimatedCost,
      actualCost: outstandingRepairs.actualCost,
      assignedTechnicianId: outstandingRepairs.assignedTechnicianId,
      completedAt: outstandingRepairs.completedAt,
      createdAt: outstandingRepairs.createdAt,
      updatedAt: outstandingRepairs.updatedAt,
      // Item details
      item: {
        id: items.id,
        lp: items.lp,
        sku: items.sku,
        model: items.model,
        status: items.status,
        grade: items.grade,
        newBarcode: items.newBarcode,
        locationId: items.locationId,
      },
      // Assigned technician details
      assignedTechnician: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(outstandingRepairs)
    .leftJoin(items, eq(outstandingRepairs.itemId, items.id))
    .leftJoin(users, eq(outstandingRepairs.assignedTechnicianId, users.id))
    .where(eq(outstandingRepairs.id, repairId))
    .limit(1);

    if (repair.length === 0) {
      return { success: false, error: 'Repair not found' };
    }

    const repairData = repair[0];

    // Check if repair is in PENDING status
    if (repairData.status !== 'PENDING') {
      return { 
        success: false, 
        error: `Repair is already ${repairData.status.toLowerCase().replace('_', ' ')}`,
        repair: repairData 
      };
    }

    // Find applicable workflow for this repair type
    const workflows = await db.select({
      id: workflowDefinitions.id,
      name: workflowDefinitions.name,
      appliesTo: workflowDefinitions.appliesTo,
      sopUrl: workflowDefinitions.sopUrl,
      pngFilePath: workflowDefinitions.pngFilePath,
      videoUrl: workflowDefinitions.videoUrl,
      version: workflowDefinitions.version,
      isActive: workflowDefinitions.isActive,
    })
    .from(workflowDefinitions)
    .where(
      and(
        eq(workflowDefinitions.isActive, true),
        // Check if the workflow applies to this repair type
        // The appliesTo field is JSONB, so we need to check if it contains the repair type
        // For now, we'll get all active workflows and filter in application logic
      )
    );

    // Filter workflows that apply to this repair type
    const applicableWorkflows = workflows.filter(workflow => {
      const appliesTo = workflow.appliesTo as any;
      return appliesTo?.repairType === repairData.repairType;
    });

    // Get the most recent version of the applicable workflow
    const workflow = applicableWorkflows.sort((a, b) => b.version - a.version)[0];

    if (!workflow) {
      return { 
        success: false, 
        error: 'No workflow definition found for this repair type',
        repair: repairData 
      };
    }

    // Get failure answers for this workflow
    const failureAnswers = await db.select()
      .from(workflowFailureAnswers)
      .where(eq(workflowFailureAnswers.workflowId, workflow.id));

    return {
      success: true,
      repair: repairData,
      workflow: {
        ...workflow,
        failureAnswers,
      },
    };
  } catch (error) {
    console.error('Error fetching repair with workflow:', error);
    return { success: false, error: 'Failed to fetch repair details' };
  }
}

// Complete a repair
export async function completeRepair(input: CompleteRepairInput) {
  const user = await requireAuth();
  
  try {
    const validatedInput = completeRepairSchema.parse(input);
    
    // First, check if the repair exists and is still in PENDING status
    const existingRepair = await db.select()
      .from(outstandingRepairs)
      .where(eq(outstandingRepairs.id, validatedInput.repairId))
      .limit(1);

    if (existingRepair.length === 0) {
      return { success: false, error: 'Repair not found' };
    }

    if (existingRepair[0].status !== 'PENDING') {
      return { success: false, error: `Repair is already ${existingRepair[0].status.toLowerCase().replace('_', ' ')}` };
    }
    
    // Update the outstanding repair
    const [updatedRepair] = await db.update(outstandingRepairs)
      .set({
        status: validatedInput.wasSuccessful ? 'COMPLETED' : 'CANCELLED',
        completedAt: new Date(),
        actualCost: validatedInput.wasSuccessful ? 0 : undefined, // Set to 0 for successful repairs
        updatedAt: new Date(),
      })
      .where(eq(outstandingRepairs.id, validatedInput.repairId))
      .returning();

    if (!updatedRepair) {
      return { success: false, error: 'Failed to update repair' };
    }

    // Check if all repairs for this item are completed
    const allRepairs = await db.select()
      .from(outstandingRepairs)
      .where(eq(outstandingRepairs.itemId, updatedRepair.itemId));

    const allCompleted = allRepairs.every(repair => 
      repair.status === 'COMPLETED' || repair.status === 'CANCELLED'
    );

    // If all repairs are completed, update item status
    if (allCompleted) {
      await db.update(items)
        .set({
          status: 'COMPLETED',
          updatedAt: new Date(),
        })
        .where(eq(items.id, updatedRepair.itemId));
    }

    revalidatePath('/dashboard');
    revalidatePath('/repair-workflow');

    return { 
      success: true, 
      repair: updatedRepair,
      itemCompleted: allCompleted,
    };
  } catch (error) {
    console.error('Error completing repair:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: 'Failed to complete repair' };
  }
}
