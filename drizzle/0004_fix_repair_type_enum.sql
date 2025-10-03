-- Fix repairType column to use enum type
-- Migration: 0004_fix_repair_type_enum

-- First, ensure the enum type exists
DO $$ BEGIN
    CREATE TYPE "RepairType" AS ENUM ('TROLLEY_REPLACEMENT', 'HANDLE_REPLACEMENT', 'LINER_REPLACEMENT', 'ZIPPER_SLIDER', 'ZIPPER_TAPE', 'ZIPPER_FULL_REPLACEMENT', 'WHEEL_REPLACEMENT', 'LOCK_REPLACEMENT', 'LOGO_REPLACEMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the repair_sessions table to use the enum
ALTER TABLE "repair_sessions" ALTER COLUMN "repairType" TYPE "RepairType" USING "repairType"::"RepairType";

-- Also update the outstanding_repairs table to use the enum (if it's not already)
ALTER TABLE "outstanding_repairs" ALTER COLUMN "repairType" TYPE "RepairType" USING "repairType"::"RepairType";
