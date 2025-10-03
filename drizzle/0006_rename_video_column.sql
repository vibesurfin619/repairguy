-- Migration: Rename videoFilePath to videoUrl in workflow_definitions
ALTER TABLE "workflow_definitions" RENAME COLUMN "videoFilePath" TO "videoUrl";
