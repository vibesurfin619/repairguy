CREATE TABLE "workflow_failure_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"workflowId" text NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"requiresNotes" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_failure_answers" ADD CONSTRAINT "workflow_failure_answers_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."workflow_definitions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_failure_answers_workflow_code_key" ON "workflow_failure_answers" USING btree ("workflowId" text_ops,"code" text_ops);