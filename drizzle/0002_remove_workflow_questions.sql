-- Remove workflow_questions table and update repair_answers
-- Migration: 0002_remove_workflow_questions

-- First, drop the foreign key constraint from repair_answers to workflow_questions
ALTER TABLE "repair_answers" DROP CONSTRAINT IF EXISTS "repair_answers_questionId_fkey";

-- Rename questionId column to failureAnswerId in repair_answers
ALTER TABLE "repair_answers" RENAME COLUMN "questionId" TO "failureAnswerId";

-- Update the unique index name
DROP INDEX IF EXISTS "repair_answers_sessionId_questionId_key";
CREATE UNIQUE INDEX "repair_answers_sessionId_failureAnswerId_key" ON "repair_answers" USING btree ("sessionId" ASC NULLS LAST, "failureAnswerId" ASC NULLS LAST);

-- Add the new foreign key constraint to workflow_failure_answers
ALTER TABLE "repair_answers" ADD CONSTRAINT "repair_answers_failureAnswerId_fkey" FOREIGN KEY ("failureAnswerId") REFERENCES "workflow_failure_answers"("id") ON UPDATE cascade ON DELETE restrict;

-- Drop the workflow_questions table
DROP TABLE IF EXISTS "workflow_questions";
