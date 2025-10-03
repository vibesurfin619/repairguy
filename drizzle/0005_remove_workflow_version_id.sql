-- Remove workflowVersionId column from repair_sessions table
-- Migration: 0005_remove_workflow_version_id

-- Drop the foreign key constraint first (if it exists)
ALTER TABLE "repair_sessions" DROP CONSTRAINT IF EXISTS "repair_sessions_workflowVersionId_fkey";

-- Remove the workflowVersionId column
ALTER TABLE "repair_sessions" DROP COLUMN IF EXISTS "workflowVersionId";
