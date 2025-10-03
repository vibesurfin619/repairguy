import { relations } from "drizzle-orm/relations";
import { workflowDefinitions, gradingRules, items, labels, users, outstandingRepairs, workflowFailureAnswers } from "./schema";

export const gradingRulesRelations = relations(gradingRules, ({one}) => ({
	workflowDefinition: one(workflowDefinitions, {
		fields: [gradingRules.workflowId],
		references: [workflowDefinitions.id]
	}),
}));

export const workflowDefinitionsRelations = relations(workflowDefinitions, ({many}) => ({
	gradingRules: many(gradingRules),
	workflowFailureAnswers: many(workflowFailureAnswers),
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

export const itemsRelations = relations(items, ({many}) => ({
	labels: many(labels),
	outstandingRepairs: many(outstandingRepairs),
}));

export const usersRelations = relations(users, ({many}) => ({
	labels: many(labels),
	outstandingRepairs: many(outstandingRepairs),
}));

export const outstandingRepairsRelations = relations(outstandingRepairs, ({one}) => ({
	item: one(items, {
		fields: [outstandingRepairs.itemId],
		references: [items.id]
	}),
	user: one(users, {
		fields: [outstandingRepairs.assignedTechnicianId],
		references: [users.id]
	}),
}));

export const workflowFailureAnswersRelations = relations(workflowFailureAnswers, ({one}) => ({
	workflowDefinition: one(workflowDefinitions, {
		fields: [workflowFailureAnswers.workflowId],
		references: [workflowDefinitions.id]
	}),
}));