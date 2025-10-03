import { relations } from "drizzle-orm/relations";
import { workflowDefinitions, workflowQuestions, gradingRules, items, repairSessions, users, repairAnswers, labels } from "./schema";

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
}));

export const itemsRelations = relations(items, ({many}) => ({
	repairSessions: many(repairSessions),
	labels: many(labels),
}));

export const usersRelations = relations(users, ({many}) => ({
	repairSessions: many(repairSessions),
	labels: many(labels),
}));

export const repairAnswersRelations = relations(repairAnswers, ({one}) => ({
	repairSession: one(repairSessions, {
		fields: [repairAnswers.sessionId],
		references: [repairSessions.id]
	}),
	workflowQuestion: one(workflowQuestions, {
		fields: [repairAnswers.questionId],
		references: [workflowQuestions.id]
	}),
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