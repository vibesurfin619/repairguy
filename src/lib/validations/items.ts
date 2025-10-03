import { z } from 'zod';

export const scanItemSchema = z.object({
  lp: z.string().min(1, 'License plate is required').trim(),
});

export type ScanItemInput = z.infer<typeof scanItemSchema>;
