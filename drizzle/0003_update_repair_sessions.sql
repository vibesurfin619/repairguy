-- Update repair_sessions table to remove workflow dependencies
-- Migration: 0003_update_repair_sessions

-- Remove the foreign key constraint to workflow_definitions
ALTER TABLE "repair_sessions" DROP CONSTRAINT IF EXISTS "repair_sessions_workflowVersionId_fkey";

-- Add new columns
ALTER TABLE "repair_sessions" ADD COLUMN "repairType" text NOT NULL DEFAULT 'TROLLEY_REPLACEMENT';
ALTER TABLE "repair_sessions" ADD COLUMN "sopUrl" text NOT NULL DEFAULT 'https://example.com/sop';
ALTER TABLE "repair_sessions" ADD COLUMN "wasCompleted" boolean;
ALTER TABLE "repair_sessions" ADD COLUMN "selectedFailureAnswer" text;
ALTER TABLE "repair_sessions" ADD COLUMN "notes" text;

-- Remove the old workflowVersionId column
ALTER TABLE "repair_sessions" DROP COLUMN IF EXISTS "workflowVersionId";