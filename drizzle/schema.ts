import { pgTable, uniqueIndex, text, jsonb, integer, boolean, timestamp, foreignKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const itemStatus = pgEnum("ItemStatus", ['AWAITING_REPAIR', 'IN_REPAIR', 'COMPLETED', 'REQUIRES_REVIEW', 'SCRAP'])
export const labelFormat = pgEnum("LabelFormat", ['PDF', 'ZPL'])
export const outstandingRepairStatus = pgEnum("OutstandingRepairStatus", ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const repairSessionStatus = pgEnum("RepairSessionStatus", ['IN_PROGRESS', 'SUBMITTED', 'ABANDONED'])
export const repairType = pgEnum("RepairType", ['TROLLEY_REPLACEMENT', 'HANDLE_REPLACEMENT', 'LINER_REPLACEMENT', 'ZIPPER_SLIDER', 'ZIPPER_TAPE', 'ZIPPER_FULL_REPLACEMENT', 'WHEEL_REPLACEMENT', 'LOCK_REPLACEMENT', 'LOGO_REPLACEMENT'])
export const userRole = pgEnum("UserRole", ['TECHNICIAN', 'ADMIN', 'SUPERVISOR'])


export const workflowDefinitions = pgTable("workflow_definitions", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	appliesTo: jsonb().notNull(),
	sopUrl: text().notNull(),
	version: integer().default(1).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("workflow_definitions_id_version_key").using("btree", table.id.asc().nullsLast().op("int4_ops"), table.version.asc().nullsLast().op("int4_ops")),
]);

export const workflowQuestions = pgTable("workflow_questions", {
	id: text().primaryKey().notNull(),
	workflowId: text().notNull(),
	order: integer().notNull(),
	prompt: text().notNull(),
	key: text().notNull(),
	required: boolean().default(true).notNull(),
	critical: boolean().default(false).notNull(),
	failOnNo: boolean().default(false).notNull(),
	helpText: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflowDefinitions.id],
			name: "workflow_questions_workflowId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const gradingRules = pgTable("grading_rules", {
	id: text().primaryKey().notNull(),
	workflowId: text().notNull(),
	logic: jsonb().notNull(),
	gradeOutput: text().notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflowDefinitions.id],
			name: "grading_rules_workflowId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const items = pgTable("items", {
	id: text().primaryKey().notNull(),
	lp: text().notNull(),
	sku: text(),
	model: text(),
	status: itemStatus().default('AWAITING_REPAIR').notNull(),
	currentWorkflowVersionId: text(),
	grade: text(),
	newBarcode: text(),
	locationId: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("items_lp_key").using("btree", table.lp.asc().nullsLast().op("text_ops")),
]);

export const repairSessions = pgTable("repair_sessions", {
	id: text().primaryKey().notNull(),
	itemId: text().notNull(),
	workflowVersionId: text().notNull(),
	technicianId: text().notNull(),
	status: repairSessionStatus().default('IN_PROGRESS').notNull(),
	startedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	endedAt: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [items.id],
			name: "repair_sessions_itemId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.technicianId],
			foreignColumns: [users.id],
			name: "repair_sessions_technicianId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.workflowVersionId],
			foreignColumns: [workflowDefinitions.id],
			name: "repair_sessions_workflowVersionId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	clerkId: text().notNull(),
	email: text().notNull(),
	name: text(),
	role: userRole().default('TECHNICIAN').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("users_clerkId_key").using("btree", table.clerkId.asc().nullsLast().op("text_ops")),
]);

export const repairAnswers = pgTable("repair_answers", {
	id: text().primaryKey().notNull(),
	sessionId: text().notNull(),
	questionId: text().notNull(),
	answer: boolean().notNull(),
	notes: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("repair_answers_sessionId_questionId_key").using("btree", table.sessionId.asc().nullsLast().op("text_ops"), table.questionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [repairSessions.id],
			name: "repair_answers_sessionId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [workflowQuestions.id],
			name: "repair_answers_questionId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const labels = pgTable("labels", {
	id: text().primaryKey().notNull(),
	itemId: text().notNull(),
	format: labelFormat().default('PDF').notNull(),
	contentBlobUrl: text(),
	printedBy: text(),
	printedAt: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [items.id],
			name: "labels_itemId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.printedBy],
			foreignColumns: [users.id],
			name: "labels_printedBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const outstandingRepairs = pgTable("outstanding_repairs", {
	id: text().primaryKey().notNull(),
	itemId: text().notNull(),
	repairType: repairType().notNull(),
	status: outstandingRepairStatus().default('PENDING').notNull(),
	description: text(),
	priority: integer().default(1).notNull(),
	estimatedCost: integer(),
	actualCost: integer(),
	assignedTechnicianId: text(),
	completedAt: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [items.id],
			name: "outstanding_repairs_itemId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.assignedTechnicianId],
			foreignColumns: [users.id],
			name: "outstanding_repairs_assignedTechnicianId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const repairSessionOutstandingRepairs = pgTable("repair_session_outstanding_repairs", {
	id: text().primaryKey().notNull(),
	repairSessionId: text().notNull(),
	outstandingRepairId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("repair_session_outstanding_repairs_unique").using("btree", table.repairSessionId.asc().nullsLast().op("text_ops"), table.outstandingRepairId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.repairSessionId],
			foreignColumns: [repairSessions.id],
			name: "repair_session_outstanding_repairs_sessionId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.outstandingRepairId],
			foreignColumns: [outstandingRepairs.id],
			name: "repair_session_outstanding_repairs_repairId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const repairAnswerOutstandingRepairs = pgTable("repair_answer_outstanding_repairs", {
	id: text().primaryKey().notNull(),
	repairAnswerId: text().notNull(),
	outstandingRepairId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("repair_answer_outstanding_repairs_unique").using("btree", table.repairAnswerId.asc().nullsLast().op("text_ops"), table.outstandingRepairId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.repairAnswerId],
			foreignColumns: [repairAnswers.id],
			name: "repair_answer_outstanding_repairs_answerId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.outstandingRepairId],
			foreignColumns: [outstandingRepairs.id],
			name: "repair_answer_outstanding_repairs_repairId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);
