import { z } from 'zod';

// Repair completion schema
export const completeRepairSchema = z.object({
  repairId: z.string().min(1, 'Repair ID is required'),
  wasSuccessful: z.boolean(),
  failureReason: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
}).refine((data) => {
  // If repair was not successful, failureReason is required
  if (!data.wasSuccessful && !data.failureReason) {
    return false;
  }
  return true;
}, {
  message: "Failure reason is required when repair could not be completed",
  path: ["failureReason"],
});

// Get repair with workflow schema
export const getRepairWithWorkflowSchema = z.object({
  repairId: z.string().min(1, 'Repair ID is required'),
});

// Type exports
export type CompleteRepairInput = z.infer<typeof completeRepairSchema>;
export type GetRepairWithWorkflowInput = z.infer<typeof getRepairWithWorkflowSchema>;
