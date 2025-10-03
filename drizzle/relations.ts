import { relations } from "drizzle-orm/relations";
import { workflowDefinitions, workflowQuestions, gradingRules, items, repairSessions, users, repairAnswers, labels, outstandingRepairs, repairSessionOutstandingRepairs, repairAnswerOutstandingRepairs } from "./schema";

export const workflowQuestionsRelations = relations(workflowQuestions, ({one, many}) => ({
	workflowDefinition: one(workflowDefinitions, {
		fields: [workflowQuestions.workflowId],
		references: [workflowDefinitions.id]
	}),
	repairAnswers: many(repairAnswers),
}));

export const workflowDefinitionsRelations = relations(workflowDefinitions, ({many}) => ({
	workflowQuestions: many(workflowQuestions),
	gradingRules: many(gradingRules),
	repairSessions: many(repairSessions),
}));

export const gradingRulesRelations = relations(gradingRules, ({one}) => ({
	workflowDefinition: one(workflowDefinitions, {
		fields: [gradingRules.workflowId],
		references: [workflowDefinitions.id]
	}),
}));

export const repairSessionsRelations = relations(repairSessions, ({one, many}) => ({
	item: one(items, {
		fields: [repairSessions.itemId],
		references: [items.id]
	}),
	user: one(users, {
		fields: [repairSessions.technicianId],
		references: [users.id]
	}),
	workflowDefinition: one(workflowDefinitions, {
		fields: [repairSessions.workflowVersionId],
		references: [workflowDefinitions.id]
	}),
	repairAnswers: many(repairAnswers),
	repairSessionOutstandingRepairs: many(repairSessionOutstandingRepairs),
}));

export const itemsRelations = relations(items, ({many}) => ({
	repairSessions: many(repairSessions),
	labels: many(labels),
	outstandingRepairs: many(outstandingRepairs),
}));

export const usersRelations = relations(users, ({many}) => ({
	repairSessions: many(repairSessions),
	labels: many(labels),
	outstandingRepairs: many(outstandingRepairs),
}));

export const repairAnswersRelations = relations(repairAnswers, ({one, many}) => ({
	repairSession: one(repairSessions, {
		fields: [repairAnswers.sessionId],
		references: [repairSessions.id]
	}),
	workflowQuestion: one(workflowQuestions, {
		fields: [repairAnswers.questionId],
		references: [workflowQuestions.id]
	}),
	repairAnswerOutstandingRepairs: many(repairAnswerOutstandingRepairs),
}));

export const labelsRelations = relations(labels, ({one}) => ({
	item: one(items, {
		fields: [labels.itemId],
		references: [items.id]
	}),
	user: one(users, {
		fields: [labels.printedBy],
		references: [users.id]
	}),
}));

export const outstandingRepairsRelations = relations(outstandingRepairs, ({one, many}) => ({
	item: one(items, {
		fields: [outstandingRepairs.itemId],
		references: [items.id]
	}),
	user: one(users, {
		fields: [outstandingRepairs.assignedTechnicianId],
		references: [users.id]
	}),
	repairSessionOutstandingRepairs: many(repairSessionOutstandingRepairs),
	repairAnswerOutstandingRepairs: many(repairAnswerOutstandingRepairs),
}));

export const repairSessionOutstandingRepairsRelations = relations(repairSessionOutstandingRepairs, ({one}) => ({
	repairSession: one(repairSessions, {
		fields: [repairSessionOutstandingRepairs.repairSessionId],
		references: [repairSessions.id]
	}),
	outstandingRepair: one(outstandingRepairs, {
		fields: [repairSessionOutstandingRepairs.outstandingRepairId],
		references: [outstandingRepairs.id]
	}),
}));

export const repairAnswerOutstandingRepairsRelations = relations(repairAnswerOutstandingRepairs, ({one}) => ({
	repairAnswer: one(repairAnswers, {
		fields: [repairAnswerOutstandingRepairs.repairAnswerId],
		references: [repairAnswers.id]
	}),
	outstandingRepair: one(outstandingRepairs, {
		fields: [repairAnswerOutstandingRepairs.outstandingRepairId],
		references: [outstandingRepairs.id]
	}),
}));