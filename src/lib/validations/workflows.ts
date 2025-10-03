import { z } from 'zod';
import { repairTypeEnum } from './outstanding-repairs';

// Workflow applies to configuration
export const workflowAppliesToSchema = z.object({
  repairType: repairTypeEnum,
  sku: z.string().optional(), // Optional SKU for more specific targeting
});

// Failure answer schema
export const failureAnswerSchema = z.object({
  code: z.string().min(1, 'Failure code is required').max(50),
  label: z.string().min(1, 'Failure label is required').max(200),
  description: z.string().optional(),
  requiresNotes: z.boolean().default(false),
});

// Create workflow definition schema
export const createWorkflowDefinitionSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(255),
  repairType: repairTypeEnum,
  sku: z.string().optional(),
  sopUrl: z.string().url('SOP URL must be a valid URL'),
  version: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  failureAnswers: z.array(failureAnswerSchema).default([]),
});

// Update workflow definition schema
export const updateWorkflowDefinitionSchema = z.object({
  id: z.string().min(1, 'Workflow ID is required'),
  name: z.string().min(1).max(255).optional(),
  repairType: repairTypeEnum.optional(),
  sku: z.string().optional(),
  sopUrl: z.string().url().optional(),
  version: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  failureAnswers: z.array(failureAnswerSchema).optional(),
});

// Create workflow question schema
export const createWorkflowQuestionSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  prompt: z.string().min(1, 'Question prompt is required').max(500),
  key: z.string().min(1, 'Question key is required').max(100),
  order: z.number().int().min(0),
  required: z.boolean().default(true),
  critical: z.boolean().default(false),
  failOnNo: z.boolean().default(false),
  helpText: z.string().max(1000).optional(),
});

// Update workflow question schema
export const updateWorkflowQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  prompt: z.string().min(1).max(500).optional(),
  key: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
  required: z.boolean().optional(),
  critical: z.boolean().optional(),
  failOnNo: z.boolean().optional(),
  helpText: z.string().max(1000).optional(),
});

// Create grading rule schema
export const createGradingRuleSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  logic: z.record(z.string(), z.any()), // JSON logic for grading
  gradeOutput: z.string().min(1, 'Grade output is required').max(100),
  order: z.number().int().min(0).default(0),
});

// Update grading rule schema
export const updateGradingRuleSchema = z.object({
  id: z.string().min(1, 'Grading rule ID is required'),
  logic: z.record(z.string(), z.any()).optional(),
  gradeOutput: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
});

// Query workflows schema
export const queryWorkflowsSchema = z.object({
  repairType: repairTypeEnum.optional(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
  includeQuestions: z.boolean().default(false),
  includeGradingRules: z.boolean().default(false),
});

// Find applicable workflow schema (for workflow precedence logic)
export const findApplicableWorkflowSchema = z.object({
  repairType: repairTypeEnum,
  sku: z.string().optional(),
});

// SOP rendering schema
export const sopRenderSchema = z.object({
  sopUrl: z.string().url('SOP URL must be valid'),
  workflowId: z.string().min(1, 'Workflow ID is required'),
});

// Type exports
export type WorkflowAppliesTo = z.infer<typeof workflowAppliesToSchema>;
export type FailureAnswer = z.infer<typeof failureAnswerSchema>;
export type CreateWorkflowDefinitionInput = z.infer<typeof createWorkflowDefinitionSchema>;
export type UpdateWorkflowDefinitionInput = z.infer<typeof updateWorkflowDefinitionSchema>;
export type CreateWorkflowQuestionInput = z.infer<typeof createWorkflowQuestionSchema>;
export type UpdateWorkflowQuestionInput = z.infer<typeof updateWorkflowQuestionSchema>;
export type CreateGradingRuleInput = z.infer<typeof createGradingRuleSchema>;
export type UpdateGradingRuleInput = z.infer<typeof updateGradingRuleSchema>;
export type QueryWorkflowsInput = z.infer<typeof queryWorkflowsSchema>;
export type FindApplicableWorkflowInput = z.infer<typeof findApplicableWorkflowSchema>;
export type SopRenderInput = z.infer<typeof sopRenderSchema>;
