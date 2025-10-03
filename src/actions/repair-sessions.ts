'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import dbOperations from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '@/lib/schema';

// Schema for starting a repair workflow
const startRepairWorkflowSchema = z.object({
  outstandingRepairId: z.string().min(1, 'Outstanding repair ID is required'),
});

export type StartRepairWorkflowInput = z.infer<typeof startRepairWorkflowSchema>;

export async function startRepairWorkflow(input: StartRepairWorkflowInput) {
  console.log('startRepairWorkflow called with input:', input);
  const user = await requireAuth();
  console.log('User authenticated:', user.id);
  
  try {
    const validatedInput = startRepairWorkflowSchema.parse(input);
    console.log('Input validated:', validatedInput);
    
    // Get the outstanding repair with item details
    console.log('Looking up outstanding repair:', validatedInput.outstandingRepairId);
    const outstandingRepair = await dbOperations.getQueryBuilder()
      .select({
        id: schema.outstandingRepairs.id,
        itemId: schema.outstandingRepairs.itemId,
        repairType: schema.outstandingRepairs.repairType,
        status: schema.outstandingRepairs.status,
        assignedTechnicianId: schema.outstandingRepairs.assignedTechnicianId,
        item: {
          id: schema.items.id,
          sku: schema.items.sku,
          lp: schema.items.lp,
        }
      })
      .from(schema.outstandingRepairs)
      .innerJoin(schema.items, eq(schema.outstandingRepairs.itemId, schema.items.id))
      .where(eq(schema.outstandingRepairs.id, validatedInput.outstandingRepairId))
      .limit(1);
    
    console.log('Outstanding repair query result:', outstandingRepair);
    
    if (!outstandingRepair.length) {
      console.log('No outstanding repair found');
      return { success: false, error: 'Outstanding repair not found' };
    }
    
    const repair = outstandingRepair[0];
    console.log('Found repair:', repair);
    
    // Check if repair is in pending status
    if (repair.status !== 'PENDING') {
      console.log('Repair status is not PENDING:', repair.status);
      return { success: false, error: 'Repair is not in pending status' };
    }
    
    // Find applicable workflow
    console.log('Looking for workflow for repair type:', repair.repairType, 'SKU:', repair.item.sku);
    const workflow = await dbOperations.findApplicableWorkflow(
      repair.repairType,
      repair.item.sku
    );
    console.log('Found workflow:', workflow);
    
    if (!workflow) {
      console.log('No workflow found');
      return { 
        success: false, 
        error: 'There is no Repair Workflow configured for this item.' 
      };
    }
    
    // Create repair session
    const repairSession = await dbOperations.createRepairSession({
      technicianId: user.id,
      itemId: repair.itemId,
      workflowVersionId: workflow.id,
      status: 'IN_PROGRESS',
    });
    
    // Link the repair session to the outstanding repair
    await dbOperations.getQueryBuilder()
      .insert(schema.repairSessionOutstandingRepairs)
      .values({
        id: randomUUID(),
        repairSessionId: repairSession.id,
        outstandingRepairId: validatedInput.outstandingRepairId,
      });
    
    // Update outstanding repair status
    await dbOperations.getQueryBuilder()
      .update(schema.outstandingRepairs)
      .set({
        status: 'IN_PROGRESS',
        assignedTechnicianId: user.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.outstandingRepairs.id, validatedInput.outstandingRepairId));
    
    // Get workflow with questions for the response
    const workflowWithQuestions = await dbOperations.getWorkflowDefinitionWithQuestions(workflow.id);
    
    revalidatePath('/dashboard');
    revalidatePath(`/repair-session/${repairSession.id}`);
    
    return { 
      success: true, 
      repairSession,
      workflow: workflowWithQuestions,
      item: repair.item
    };
  } catch (error) {
    console.error('Failed to start repair workflow:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to start repair workflow' 
    };
  }
}

// Schema for saving repair answers
const saveRepairAnswersSchema = z.object({
  repairSessionId: z.string().min(1, 'Repair session ID is required'),
  answers: z.array(z.object({
    questionId: z.string().min(1, 'Question ID is required'),
    answer: z.boolean(),
    notes: z.string().optional(),
  })),
});

export type SaveRepairAnswersInput = z.infer<typeof saveRepairAnswersSchema>;

export async function saveRepairAnswers(input: SaveRepairAnswersInput) {
  const user = await requireAuth();
  
  try {
    const validatedInput = saveRepairAnswersSchema.parse(input);
    
    // Verify the repair session belongs to the user
    const repairSession = await dbOperations.getRepairSessionById(validatedInput.repairSessionId);
    if (!repairSession || repairSession.technicianId !== user.id) {
      return { success: false, error: 'Repair session not found or access denied' };
    }
    
    // Save or update each answer
    for (const answer of validatedInput.answers) {
      // Check if answer already exists
      const existingAnswers = await dbOperations.getRepairAnswers(validatedInput.repairSessionId);
      const existingAnswer = existingAnswers.find(a => a.questionId === answer.questionId);
      
      if (existingAnswer) {
        // Update existing answer
        await dbOperations.updateRepairAnswer(existingAnswer.id, answer.answer, answer.notes);
      } else {
        // Create new answer
        await dbOperations.createRepairAnswer({
          sessionId: validatedInput.repairSessionId,
          questionId: answer.questionId,
          answer: answer.answer,
          notes: answer.notes,
        });
      }
    }
    
    revalidatePath(`/repair-session/${validatedInput.repairSessionId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save repair answers:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to save repair answers' 
    };
  }
}

// Schema for completing repair session
const completeRepairSessionSchema = z.object({
  repairSessionId: z.string().min(1, 'Repair session ID is required'),
});

export type CompleteRepairSessionInput = z.infer<typeof completeRepairSessionSchema>;

export async function completeRepairSession(input: CompleteRepairSessionInput) {
  const user = await requireAuth();
  
  try {
    const validatedInput = completeRepairSessionSchema.parse(input);
    
    // Verify the repair session belongs to the user
    const repairSession = await dbOperations.getRepairSessionById(validatedInput.repairSessionId);
    if (!repairSession || repairSession.technicianId !== user.id) {
      return { success: false, error: 'Repair session not found or access denied' };
    }
    
    // Update repair session status
    await dbOperations.updateRepairSession(validatedInput.repairSessionId, {
      status: 'SUBMITTED',
      endedAt: new Date(),
    });
    
    // Update outstanding repair status to completed
    const sessionOutstandingRepairs = await dbOperations.getQueryBuilder()
      .select({ outstandingRepairId: schema.repairSessionOutstandingRepairs.outstandingRepairId })
      .from(schema.repairSessionOutstandingRepairs)
      .where(eq(schema.repairSessionOutstandingRepairs.repairSessionId, validatedInput.repairSessionId));
    
    for (const sessionRepair of sessionOutstandingRepairs) {
      await dbOperations.updateOutstandingRepair(sessionRepair.outstandingRepairId, {
        status: 'COMPLETED',
        completedAt: new Date(),
      });
    }
    
    revalidatePath('/dashboard');
    revalidatePath(`/repair-session/${validatedInput.repairSessionId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to complete repair session:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to complete repair session' 
    };
  }
}

// Schema for abandoning repair session
const abandonRepairSessionSchema = z.object({
  repairSessionId: z.string().min(1, 'Repair session ID is required'),
});

export type AbandonRepairSessionInput = z.infer<typeof abandonRepairSessionSchema>;

export async function abandonRepairSession(input: AbandonRepairSessionInput) {
  const user = await requireAuth();
  
  try {
    const validatedInput = abandonRepairSessionSchema.parse(input);
    
    // Verify the repair session belongs to the user
    const repairSession = await dbOperations.getRepairSessionById(validatedInput.repairSessionId);
    if (!repairSession || repairSession.technicianId !== user.id) {
      return { success: false, error: 'Repair session not found or access denied' };
    }
    
    // Update repair session status
    await dbOperations.updateRepairSession(validatedInput.repairSessionId, {
      status: 'ABANDONED',
      endedAt: new Date(),
    });
    
    // Update outstanding repair status back to pending
    const sessionOutstandingRepairs = await dbOperations.getQueryBuilder()
      .select({ outstandingRepairId: schema.repairSessionOutstandingRepairs.outstandingRepairId })
      .from(schema.repairSessionOutstandingRepairs)
      .where(eq(schema.repairSessionOutstandingRepairs.repairSessionId, validatedInput.repairSessionId));
    
    for (const sessionRepair of sessionOutstandingRepairs) {
      await dbOperations.updateOutstandingRepair(sessionRepair.outstandingRepairId, {
        status: 'PENDING',
        assignedTechnicianId: null, // Unassign the technician
      });
    }
    
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to abandon repair session:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to abandon repair session' 
    };
  }
}
