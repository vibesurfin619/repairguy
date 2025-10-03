import { z } from 'zod';

// RepairType enum values
export const repairTypeEnum = z.enum([
  'TROLLEY_REPLACEMENT',
  'HANDLE_REPLACEMENT', 
  'LINER_REPLACEMENT',
  'ZIPPER_SLIDER',
  'ZIPPER_TAPE',
  'ZIPPER_FULL_REPLACEMENT',
  'WHEEL_REPLACEMENT',
  'LOCK_REPLACEMENT',
  'LOGO_REPLACEMENT'
]);

// OutstandingRepairStatus enum values
export const outstandingRepairStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]);

// Priority levels (1 = low, 2 = medium, 3 = high, 4 = urgent)
export const priorityEnum = z.number().int().min(1).max(4);

// Create Outstanding Repair Schema
export const createOutstandingRepairSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  repairType: repairTypeEnum,
  status: outstandingRepairStatusEnum.optional().default('PENDING'),
  description: z.string().optional(),
  priority: priorityEnum.optional().default(1),
  estimatedCost: z.number().int().positive().optional(),
  actualCost: z.number().int().positive().optional(),
  assignedTechnicianId: z.string().optional(),
});

// Update Outstanding Repair Schema
export const updateOutstandingRepairSchema = z.object({
  id: z.string().min(1, 'Repair ID is required'),
  status: outstandingRepairStatusEnum.optional(),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  estimatedCost: z.number().int().positive().optional(),
  actualCost: z.number().int().positive().optional(),
  assignedTechnicianId: z.string().optional(),
  completedAt: z.date().optional(),
});

// Query Outstanding Repairs Schema
export const queryOutstandingRepairsSchema = z.object({
  itemId: z.string().optional(),
  status: outstandingRepairStatusEnum.optional(),
  repairType: repairTypeEnum.optional(),
  assignedTechnicianId: z.string().optional(),
  priority: priorityEnum.optional(),
  includeCompleted: z.boolean().optional().default(false),
});

// Type exports
export type CreateOutstandingRepairInput = z.infer<typeof createOutstandingRepairSchema>;
export type UpdateOutstandingRepairInput = z.infer<typeof updateOutstandingRepairSchema>;
export type QueryOutstandingRepairsInput = z.infer<typeof queryOutstandingRepairsSchema>;
export type RepairType = z.infer<typeof repairTypeEnum>;
export type OutstandingRepairStatus = z.infer<typeof outstandingRepairStatusEnum>;
