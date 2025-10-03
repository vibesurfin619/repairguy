-- Add RepairType and OutstandingRepairStatus enums (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE "public"."RepairType" AS ENUM('TROLLEY_REPLACEMENT', 'HANDLE_REPLACEMENT', 'LINER_REPLACEMENT', 'ZIPPER_SLIDER', 'ZIPPER_TAPE', 'ZIPPER_FULL_REPLACEMENT', 'WHEEL_REPLACEMENT', 'LOCK_REPLACEMENT', 'LOGO_REPLACEMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."OutstandingRepairStatus" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create outstanding_repairs table
CREATE TABLE IF NOT EXISTS "outstanding_repairs" (
	"id" text PRIMARY KEY NOT NULL,
	"itemId" text NOT NULL,
	"repairType" "RepairType" NOT NULL,
	"status" "OutstandingRepairStatus" DEFAULT 'PENDING' NOT NULL,
	"description" text,
	"priority" integer DEFAULT 1 NOT NULL,
	"estimatedCost" integer,
	"actualCost" integer,
	"assignedTechnicianId" text,
	"completedAt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);

-- Create repair_session_outstanding_repairs junction table
CREATE TABLE IF NOT EXISTS "repair_session_outstanding_repairs" (
	"id" text PRIMARY KEY NOT NULL,
	"repairSessionId" text NOT NULL,
	"outstandingRepairId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create repair_answer_outstanding_repairs junction table
CREATE TABLE IF NOT EXISTS "repair_answer_outstanding_repairs" (
	"id" text PRIMARY KEY NOT NULL,
	"repairAnswerId" text NOT NULL,
	"outstandingRepairId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "outstanding_repairs" ADD CONSTRAINT "outstanding_repairs_itemId_fkey" 
    FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE cascade;

ALTER TABLE "outstanding_repairs" ADD CONSTRAINT "outstanding_repairs_assignedTechnicianId_fkey" 
    FOREIGN KEY ("assignedTechnicianId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;

ALTER TABLE "repair_session_outstanding_repairs" ADD CONSTRAINT "repair_session_outstanding_repairs_sessionId_fkey" 
    FOREIGN KEY ("repairSessionId") REFERENCES "public"."repair_sessions"("id") ON DELETE cascade ON UPDATE cascade;

ALTER TABLE "repair_session_outstanding_repairs" ADD CONSTRAINT "repair_session_outstanding_repairs_repairId_fkey" 
    FOREIGN KEY ("outstandingRepairId") REFERENCES "public"."outstanding_repairs"("id") ON DELETE cascade ON UPDATE cascade;

ALTER TABLE "repair_answer_outstanding_repairs" ADD CONSTRAINT "repair_answer_outstanding_repairs_answerId_fkey" 
    FOREIGN KEY ("repairAnswerId") REFERENCES "public"."repair_answers"("id") ON DELETE cascade ON UPDATE cascade;

ALTER TABLE "repair_answer_outstanding_repairs" ADD CONSTRAINT "repair_answer_outstanding_repairs_repairId_fkey" 
    FOREIGN KEY ("outstandingRepairId") REFERENCES "public"."outstanding_repairs"("id") ON DELETE cascade ON UPDATE cascade;

-- Add unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "repair_session_outstanding_repairs_unique" ON "repair_session_outstanding_repairs" USING btree ("repairSessionId","outstandingRepairId");

CREATE UNIQUE INDEX IF NOT EXISTS "repair_answer_outstanding_repairs_unique" ON "repair_answer_outstanding_repairs" USING btree ("repairAnswerId","outstandingRepairId");
