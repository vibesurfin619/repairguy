'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import dbOperations from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  createWorkflowDefinitionSchema,
  updateWorkflowDefinitionSchema,
  createGradingRuleSchema,
  updateGradingRuleSchema,
  findApplicableWorkflowSchema,
  failureAnswerSchema,
  type CreateWorkflowDefinitionInput,
  type UpdateWorkflowDefinitionInput,
  type CreateGradingRuleInput,
  type UpdateGradingRuleInput,
  type FindApplicableWorkflowInput,
  type FailureAnswer,
} from '@/lib/validations/workflows';

// Workflow Definition Actions
export async function createWorkflowDefinition(input: CreateWorkflowDefinitionInput) {
  const user = await requireAuth();
  
  try {
    const validatedInput = createWorkflowDefinitionSchema.parse(input);
    
    // Create appliesTo object
    const appliesTo = {
      repairType: validatedInput.repairType,
      ...(validatedInput.sku && { sku: validatedInput.sku }),
    };
    
    const workflow = await dbOperations.createWorkflowDefinition({
      name: validatedInput.name,
      appliesTo,
      sopUrl: validatedInput.sopUrl,
      pngFilePath: validatedInput.pngFilePath,
      version: validatedInput.version,
      isActive: validatedInput.isActive,
    });
    
    // If failure answers are provided, create them
    if (validatedInput.failureAnswers.length > 0) {
      for (const failureAnswer of validatedInput.failureAnswers) {
        await dbOperations.createWorkflowFailureAnswer({
          workflowId: workflow.id,
          code: failureAnswer.code,
          label: failureAnswer.label,
          description: failureAnswer.description,
          requiresNotes: failureAnswer.requiresNotes,
        });
      }
    }
    
    revalidatePath('/dashboard/workflows');
    return { success: true, workflow };
  } catch (error) {
    console.error('Failed to create workflow definition:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to create workflow definition' 
    };
  }
}

export async function updateWorkflowDefinition(input: UpdateWorkflowDefinitionInput) {
  const user = await requireAuth();
  
  
  try {
    const validatedInput = updateWorkflowDefinitionSchema.parse(input);
    
    const updates: any = {};
    if (validatedInput.name) updates.name = validatedInput.name;
    if (validatedInput.sopUrl) updates.sopUrl = validatedInput.sopUrl;
    if (validatedInput.pngFilePath !== undefined) updates.pngFilePath = validatedInput.pngFilePath;
    if (validatedInput.version) updates.version = validatedInput.version;
    if (validatedInput.isActive !== undefined) updates.isActive = validatedInput.isActive;
    
    if (validatedInput.repairType || validatedInput.sku !== undefined) {
      // Get current workflow to preserve existing appliesTo data if needed
      const current = await dbOperations.getWorkflowDefinitionById(validatedInput.id);
      if (!current) {
        return { success: false, error: 'Workflow not found' };
      }
      
      const currentAppliesTo = current.appliesTo as any;
      updates.appliesTo = {
        repairType: validatedInput.repairType || currentAppliesTo.repairType,
        ...(validatedInput.sku && { sku: validatedInput.sku }),
      };
    }
    
    const workflow = await dbOperations.updateWorkflowDefinition(validatedInput.id, updates);
    
    if (!workflow) {
      return { success: false, error: 'Workflow not found' };
    }
    
    // Handle failure answers if provided
    if (validatedInput.failureAnswers) {
      // For simplicity, we'll delete all existing failure answers and recreate them
      const existingFailures = await dbOperations.getWorkflowFailureAnswers(validatedInput.id);
      for (const failure of existingFailures) {
        await dbOperations.deleteWorkflowFailureAnswer(failure.id);
      }
      
      // Create new failure answers
      for (const failureAnswer of validatedInput.failureAnswers) {
        await dbOperations.createWorkflowFailureAnswer({
          workflowId: validatedInput.id,
          code: failureAnswer.code,
          label: failureAnswer.label,
          description: failureAnswer.description,
          requiresNotes: failureAnswer.requiresNotes,
        });
      }
    }
    
    revalidatePath('/dashboard/workflows');
    return { success: true, workflow };
  } catch (error) {
    console.error('Failed to update workflow definition:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to update workflow definition' 
    };
  }
}

export async function deleteWorkflowDefinition(workflowId: string) {
  const user = await requireAuth();
  
  
  try {
    const result = await dbOperations.deleteWorkflowDefinition(workflowId);
    
    if (!result) {
      return { success: false, error: 'Workflow not found' };
    }
    
    revalidatePath('/dashboard/workflows');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete workflow definition:', error);
    return { success: false, error: 'Failed to delete workflow definition' };
  }
}


// Grading Rule Actions
export async function createGradingRule(input: CreateGradingRuleInput) {
  const user = await requireAuth();
  
  
  try {
    const validatedInput = createGradingRuleSchema.parse(input);
    
    const rule = await dbOperations.createGradingRule(validatedInput);
    
    revalidatePath('/dashboard/workflows');
    return { success: true, rule };
  } catch (error) {
    console.error('Failed to create grading rule:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to create grading rule' 
    };
  }
}

// Find Applicable Workflow Action
export async function findApplicableWorkflow(input: FindApplicableWorkflowInput) {
  const user = await requireAuth();
  
  try {
    const validatedInput = findApplicableWorkflowSchema.parse(input);
    
    const workflow = await dbOperations.findApplicableWorkflow(
      validatedInput.repairType,
      validatedInput.sku
    );
    
    if (!workflow) {
      return { success: false, error: 'No applicable workflow found' };
    }
    
    // Get related data
    const gradingRules = await dbOperations.getGradingRules(workflow.id);
    const failureAnswers = await dbOperations.getWorkflowFailureAnswers(workflow.id);
    
    return { 
      success: true, 
      workflow: {
        ...workflow,
        gradingRules,
        failureAnswers,
      }
    };
  } catch (error) {
    console.error('Failed to find applicable workflow:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to find applicable workflow' 
    };
  }
}

// Failure Answer Actions
export async function createWorkflowFailureAnswer(
  workflowId: string, 
  failureAnswer: FailureAnswer
) {
  const user = await requireAuth();
  

  try {
    const validatedFailureAnswer = failureAnswerSchema.parse(failureAnswer);
    
    const result = await dbOperations.createWorkflowFailureAnswer({
      workflowId,
      ...validatedFailureAnswer,
    });
    
    revalidatePath('/dashboard/workflows');
    return { success: true, failureAnswer: result };
  } catch (error) {
    console.error('Failed to create workflow failure answer:', error);
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : 'Failed to create failure answer' 
    };
  }
}

export async function deleteWorkflowFailureAnswer(failureAnswerId: string) {
  const user = await requireAuth();
  
  
  try {
    const result = await dbOperations.deleteWorkflowFailureAnswer(failureAnswerId);
    
    if (!result) {
      return { success: false, error: 'Failure answer not found' };
    }
    
    revalidatePath('/dashboard/workflows');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete workflow failure answer:', error);
    return { success: false, error: 'Failed to delete failure answer' };
  }
}
