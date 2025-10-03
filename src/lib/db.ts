import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, desc, asc } from 'drizzle-orm';
import * as schema from './schema';
import * as relations from './relations';
import { randomUUID } from 'crypto';

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL environment variable is required');
  }
  console.warn('DATABASE_URL not found, database operations will fail at runtime');
}

// Create a database connection only if DATABASE_URL is available
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
export const db = sql ? drizzle(sql, { schema: { ...schema, ...relations } }) : null;

// Database query helpers using Drizzle ORM
export const dbOperations = {

  // Repair Sessions Operations
  async getRepairSessions() {
    if (!db) throw new Error('Database not initialized');
    return await db.select().from(schema.repairSessions).orderBy(desc(schema.repairSessions.createdAt));
  },

  async getRepairSessionById(id: string) {
    if (!db) throw new Error('Database not initialized');
    const sessions = await db.select().from(schema.repairSessions).where(eq(schema.repairSessions.id, id));
    return sessions[0] || null;
  },

  async getRepairSessionsByTechnicianId(technicianId: string) {
    if (!db) throw new Error('Database not initialized');
    return await db
      .select()
      .from(schema.repairSessions)
      .where(eq(schema.repairSessions.technicianId, technicianId))
      .orderBy(desc(schema.repairSessions.createdAt));
  },

  async createRepairSession(session: {
    technicianId: string;
    itemId: string;
    workflowVersionId: string;
    status?: 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED';
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.repairSessions)
      .values({
        id: randomUUID(),
        technicianId: session.technicianId,
        itemId: session.itemId,
        workflowVersionId: session.workflowVersionId,
        status: session.status || 'IN_PROGRESS',
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  async updateRepairSession(id: string, updates: { 
    status?: 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED';
    endedAt?: Date;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .update(schema.repairSessions)
      .set({
        ...(updates.status && { status: updates.status }),
        ...(updates.endedAt && { endedAt: updates.endedAt.toISOString() }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.repairSessions.id, id))
      .returning();
    return result[0] || null;
  },

  async deleteRepairSession(id: string) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .delete(schema.repairSessions)
      .where(eq(schema.repairSessions.id, id))
      .returning({ id: schema.repairSessions.id });
    return result[0] || null;
  },

  async getItems() {
    if (!db) throw new Error('Database not initialized');
    return await db.select().from(schema.items).orderBy(desc(schema.items.createdAt));
  },

  async getItemById(id: string) {
    if (!db) throw new Error('Database not initialized');
    const items = await db.select().from(schema.items).where(eq(schema.items.id, id));
    return items[0] || null;
  },

  async createItem(item: {
    lp: string;
    sku?: string;
    model?: string;
    status?: 'AWAITING_REPAIR' | 'IN_REPAIR' | 'COMPLETED' | 'REQUIRES_REVIEW' | 'SCRAP';
    currentWorkflowVersionId?: string;
    grade?: string;
    newBarcode?: string;
    locationId?: string;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.items)
      .values({
        id: randomUUID(),
        lp: item.lp,
        sku: item.sku,
        model: item.model,
        status: item.status || 'AWAITING_REPAIR',
        currentWorkflowVersionId: item.currentWorkflowVersionId,
        grade: item.grade,
        newBarcode: item.newBarcode,
        locationId: item.locationId,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  // Workflow Definitions Operations
  async getWorkflowDefinitions() {
    if (!db) throw new Error('Database not initialized');
    return await db.select().from(schema.workflowDefinitions).orderBy(asc(schema.workflowDefinitions.name));
  },

  async getWorkflowDefinitionById(id: string) {
    if (!db) throw new Error('Database not initialized');
    const workflows = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(eq(schema.workflowDefinitions.id, id));
    return workflows[0] || null;
  },

  async createWorkflowDefinition(workflow: {
    name: string;
    appliesTo: any;
    sopUrl: string;
    version?: number;
    isActive?: boolean;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.workflowDefinitions)
      .values({
        id: randomUUID(),
        name: workflow.name,
        appliesTo: workflow.appliesTo,
        sopUrl: workflow.sopUrl,
        version: workflow.version || 1,
        isActive: workflow.isActive !== false,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  async updateWorkflowDefinition(id: string, updates: {
    name?: string;
    appliesTo?: any;
    sopUrl?: string;
    version?: number;
    isActive?: boolean;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .update(schema.workflowDefinitions)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.workflowDefinitions.id, id))
      .returning();
    return result[0] || null;
  },

  async deleteWorkflowDefinition(id: string) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .delete(schema.workflowDefinitions)
      .where(eq(schema.workflowDefinitions.id, id))
      .returning({ id: schema.workflowDefinitions.id });
    return result[0] || null;
  },

  // Find the most applicable workflow for repair type and SKU
  async findApplicableWorkflow(repairType: string, sku?: string) {
    if (!db) throw new Error('Database not initialized');
    
    // First, try to find a workflow that matches both repair type and SKU
    if (sku) {
      const specificWorkflow = await db
        .select()
        .from(schema.workflowDefinitions)
        .where(eq(schema.workflowDefinitions.isActive, true))
        .orderBy(desc(schema.workflowDefinitions.version));
      
      // Filter workflows in JavaScript since we can't easily query JSON in this setup
      const matchingWorkflows = specificWorkflow.filter(w => {
        const appliesTo = w.appliesTo as any;
        return appliesTo.repairType === repairType && appliesTo.sku === sku;
      });
      
      if (matchingWorkflows.length > 0) {
        return matchingWorkflows[0]; // Return the highest version
      }
    }
    
    // If no specific workflow found, look for repair type only
    const generalWorkflows = await db
      .select()
      .from(schema.workflowDefinitions)
      .where(eq(schema.workflowDefinitions.isActive, true))
      .orderBy(desc(schema.workflowDefinitions.version));
    
    const generalMatchingWorkflows = generalWorkflows.filter(w => {
      const appliesTo = w.appliesTo as any;
      return appliesTo.repairType === repairType && !appliesTo.sku;
    });
    
    return generalMatchingWorkflows[0] || null;
  },

  // Workflow Questions Operations
  async getWorkflowQuestions(workflowId: string) {
    if (!db) throw new Error('Database not initialized');
    return await db
      .select()
      .from(schema.workflowQuestions)
      .where(eq(schema.workflowQuestions.workflowId, workflowId))
      .orderBy(asc(schema.workflowQuestions.order));
  },

  async createWorkflowQuestion(question: {
    workflowId: string;
    order: number;
    prompt: string;
    key: string;
    required?: boolean;
    critical?: boolean;
    failOnNo?: boolean;
    helpText?: string;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.workflowQuestions)
      .values({
        id: randomUUID(),
        workflowId: question.workflowId,
        order: question.order,
        prompt: question.prompt,
        key: question.key,
        required: question.required !== false,
        critical: question.critical || false,
        failOnNo: question.failOnNo || false,
        helpText: question.helpText,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  async updateWorkflowQuestion(id: string, updates: {
    prompt?: string;
    key?: string;
    order?: number;
    required?: boolean;
    critical?: boolean;
    failOnNo?: boolean;
    helpText?: string;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .update(schema.workflowQuestions)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.workflowQuestions.id, id))
      .returning();
    return result[0] || null;
  },

  async deleteWorkflowQuestion(id: string) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .delete(schema.workflowQuestions)
      .where(eq(schema.workflowQuestions.id, id))
      .returning({ id: schema.workflowQuestions.id });
    return result[0] || null;
  },

  // Repair Answers Operations
  async getRepairAnswers(sessionId: string) {
    if (!db) throw new Error('Database not initialized');
    return await db
      .select()
      .from(schema.repairAnswers)
      .where(eq(schema.repairAnswers.sessionId, sessionId));
  },

  async createRepairAnswer(answer: {
    sessionId: string;
    questionId: string;
    answer: boolean;
    notes?: string;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.repairAnswers)
      .values({
        id: randomUUID(),
        sessionId: answer.sessionId,
        questionId: answer.questionId,
        answer: answer.answer,
        notes: answer.notes,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  async updateRepairAnswer(id: string, answer: boolean, notes?: string) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .update(schema.repairAnswers)
      .set({
        answer: answer,
        notes: notes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.repairAnswers.id, id))
      .returning();
    return result[0] || null;
  },

  // Users Operations
  async getUsers() {
    if (!db) throw new Error('Database not initialized');
    return await db.select().from(schema.users).orderBy(asc(schema.users.name));
  },

  async getUserById(id: string) {
    if (!db) throw new Error('Database not initialized');
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0] || null;
  },

  async getUserByClerkId(clerkId: string) {
    if (!db) throw new Error('Database not initialized');
    const users = await db.select().from(schema.users).where(eq(schema.users.clerkId, clerkId));
    return users[0] || null;
  },

  async createUser(user: {
    clerkId: string;
    email: string;
    name?: string;
    role?: 'TECHNICIAN' | 'ADMIN' | 'SUPERVISOR';
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.users)
      .values({
        id: randomUUID(),
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        role: user.role || 'TECHNICIAN',
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  // Schema Information Operations (for backward compatibility)
  async getDatabaseSchema() {
    if (!sql) throw new Error('Database not initialized');
    // Using raw SQL for schema introspection as it's meta-information
    const result = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    return result;
  },

  async getTableNames() {
    if (!sql) throw new Error('Database not initialized');
    // Using raw SQL for schema introspection as it's meta-information
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    return result.map((row: any) => row.table_name);
  },

  // Complex queries with relations
  async getRepairSessionWithDetails(id: string) {
    if (!db) throw new Error('Database not initialized');
    return await db.query.repairSessions.findFirst({
      where: eq(schema.repairSessions.id, id),
      with: {
        item: true,
        workflowDefinition: true,
        user: true,
        repairAnswers: {
          with: {
            workflowQuestion: true,
          },
        },
      },
    });
  },

  async getWorkflowDefinitionWithQuestions(id: string) {
    if (!db) throw new Error('Database not initialized');
    return await db.query.workflowDefinitions.findFirst({
      where: eq(schema.workflowDefinitions.id, id),
      with: {
        workflowQuestions: {
          orderBy: asc(schema.workflowQuestions.order),
        },
      },
    });
  },

  // Labels Operations
  async getLabels() {
    if (!db) throw new Error('Database not initialized');
    return await db.select().from(schema.labels).orderBy(desc(schema.labels.createdAt));
  },

  async createLabel(label: {
    itemId: string;
    format?: 'PDF' | 'ZPL';
    contentBlobUrl?: string;
    printedBy?: string;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.labels)
      .values({
        id: randomUUID(),
        itemId: label.itemId,
        format: label.format || 'PDF',
        contentBlobUrl: label.contentBlobUrl,
        printedBy: label.printedBy,
        printedAt: label.printedBy ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  // Grading Rules Operations
  async getGradingRules(workflowId: string) {
    if (!db) throw new Error('Database not initialized');
    return await db
      .select()
      .from(schema.gradingRules)
      .where(eq(schema.gradingRules.workflowId, workflowId))
      .orderBy(asc(schema.gradingRules.order));
  },

  async createGradingRule(rule: {
    workflowId: string;
    logic: any;
    gradeOutput: string;
    order?: number;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.gradingRules)
      .values({
        id: randomUUID(),
        workflowId: rule.workflowId,
        logic: rule.logic,
        gradeOutput: rule.gradeOutput,
        order: rule.order || 0,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  // Workflow Failure Answers Operations
  async getWorkflowFailureAnswers(workflowId: string) {
    if (!db) throw new Error('Database not initialized');
    return await db
      .select()
      .from(schema.workflowFailureAnswers)
      .where(eq(schema.workflowFailureAnswers.workflowId, workflowId));
  },

  async createWorkflowFailureAnswer(failureAnswer: {
    workflowId: string;
    code: string;
    label: string;
    description?: string;
    requiresNotes?: boolean;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .insert(schema.workflowFailureAnswers)
      .values({
        id: randomUUID(),
        workflowId: failureAnswer.workflowId,
        code: failureAnswer.code,
        label: failureAnswer.label,
        description: failureAnswer.description,
        requiresNotes: failureAnswer.requiresNotes || false,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return result[0];
  },

  async updateWorkflowFailureAnswer(id: string, updates: {
    code?: string;
    label?: string;
    description?: string;
    requiresNotes?: boolean;
  }) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .update(schema.workflowFailureAnswers)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.workflowFailureAnswers.id, id))
      .returning();
    return result[0] || null;
  },

  async deleteWorkflowFailureAnswer(id: string) {
    if (!db) throw new Error('Database not initialized');
    const result = await db
      .delete(schema.workflowFailureAnswers)
      .where(eq(schema.workflowFailureAnswers.id, id))
      .returning({ id: schema.workflowFailureAnswers.id });
    return result[0] || null;
  },

  // Custom query builder for complex operations
  getQueryBuilder() {
    if (!db) throw new Error('Database not initialized');
    return db;
  }
};

// Export the main database instance and operations
export { db as drizzleDb };
export default dbOperations;