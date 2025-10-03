# Database Interactions with Drizzle ORM

## Core Principles

ALL database interactions in this project MUST use Drizzle ORM schema and queries. Never use raw SQL queries or other database libraries.

## Required Imports and Setup

### Standard Database Imports
```typescript
import dbOperations from '@/lib/db'
import { db, drizzleDb } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, desc, asc, and, or, not, like, ilike, isNull, isNotNull } from 'drizzle-orm'
```

### Type Imports
```typescript
import type { 
  Item, NewItem,
  WorkflowDefinition, NewWorkflowDefinition,
  WorkflowQuestion, NewWorkflowQuestion,
  RepairSession, NewRepairSession,
  RepairAnswer, NewRepairAnswer,
  GradingRule, NewGradingRule,
  Label, NewLabel,
  User, NewUser
} from '@/lib/schema'
```

## Database Connection Pattern

ALWAYS check if database is initialized before operations:

```typescript
if (!db) {
  throw new Error('Database not initialized')
}
```

## Preferred Query Patterns

### 1. Use dbOperations Helper Functions (PREFERRED)

For common operations, use the pre-built helper functions from `@/lib/db`:

```typescript
// ✅ CORRECT - Use helper functions
const items = await dbOperations.getItems()
const item = await dbOperations.getItemById(id)
const session = await dbOperations.createRepairSession(sessionData)

// ✅ CORRECT - With error handling
try {
  const result = await dbOperations.createItem(itemData)
  return { success: true, data: result }
} catch (error) {
  console.error('Database operation failed:', error)
  throw new Error('Failed to create item')
}
```

### 2. Direct Drizzle Queries (When helpers don't exist)

```typescript
// ✅ CORRECT - Direct select with proper imports
const items = await db.select().from(schema.items).where(eq(schema.items.status, 'AWAITING_REPAIR'))

// ✅ CORRECT - Insert with returning
const result = await db
  .insert(schema.items)
  .values({
    lp: 'LP12345',
    status: 'AWAITING_REPAIR',
    // ... other fields
  })
  .returning()

// ✅ CORRECT - Update with conditions
const updated = await db
  .update(schema.items)
  .set({ status: 'IN_REPAIR', updatedAt: new Date().toISOString() })
  .where(eq(schema.items.id, itemId))
  .returning()
```

### 3. Complex Queries with Relations

```typescript
// ✅ CORRECT - Using query builder with relations
const sessionWithDetails = await db.query.repairSessions.findFirst({
  where: eq(schema.repairSessions.id, sessionId),
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
})

// ✅ CORRECT - Multiple conditions
const filteredSessions = await db
  .select()
  .from(schema.repairSessions)
  .where(
    and(
      eq(schema.repairSessions.technicianId, technicianId),
      eq(schema.repairSessions.status, 'IN_PROGRESS')
    )
  )
  .orderBy(desc(schema.repairSessions.createdAt))
```

## Required Error Handling

ALL database operations MUST include proper error handling:

```typescript
// ✅ CORRECT - Proper error handling
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const result = await dbOperations.createItem(body)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Database operation failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
```

## Schema Enums Usage

ALWAYS use the defined enums from schema:

```typescript
// ✅ CORRECT - Use enum values
const item = await dbOperations.createItem({
  lp: 'LP12345',
  status: 'AWAITING_REPAIR', // ItemStatus enum
})

const user = await dbOperations.createUser({
  clerkId: 'user_123',
  email: 'user@example.com',
  role: 'TECHNICIAN', // UserRole enum
})

// Available enum values:
// ItemStatus: 'AWAITING_REPAIR' | 'IN_REPAIR' | 'COMPLETED' | 'REQUIRES_REVIEW' | 'SCRAP'
// RepairSessionStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED'
// UserRole: 'TECHNICIAN' | 'ADMIN' | 'SUPERVISOR'
// LabelFormat: 'PDF' | 'ZPL'
```

## Type Safety Requirements

ALWAYS use TypeScript types from schema:

```typescript
// ✅ CORRECT - Use proper types
import type { NewItem, Item } from '@/lib/schema'

const createItem = async (itemData: NewItem): Promise<Item> => {
  return await dbOperations.createItem(itemData)
}

// ✅ CORRECT - Partial updates
const updateItem = async (id: string, updates: Partial<NewItem>) => {
  // Implementation
}
```

## Transaction Patterns

For complex operations requiring multiple database calls:

```typescript
// ✅ CORRECT - Use transaction for multiple operations
import { db } from '@/lib/db'

const complexOperation = async (data: any) => {
  if (!db) throw new Error('Database not initialized')
  
  return await db.transaction(async (tx) => {
    const item = await tx.insert(schema.items).values(data.item).returning()
    const session = await tx.insert(schema.repairSessions).values({
      ...data.session,
      itemId: item[0].id
    }).returning()
    
    return { item: item[0], session: session[0] }
  })
}
```

## Forbidden Patterns

❌ **NEVER** do these:

```typescript
// ❌ FORBIDDEN - Raw SQL queries
const result = await sql`SELECT * FROM items WHERE status = 'AWAITING_REPAIR'`

// ❌ FORBIDDEN - Using other ORMs
import { PrismaClient } from '@prisma/client'

// ❌ FORBIDDEN - Direct SQL without Drizzle
import { Pool } from 'pg'

// ❌ FORBIDDEN - Bypassing schema types
const item = await db.select().from('items') // Use schema.items instead

// ❌ FORBIDDEN - No error handling
const result = await dbOperations.createItem(data) // Always wrap in try-catch

// ❌ FORBIDDEN - Hardcoded enum values without type checking
const status = 'WAITING_REPAIR' // Should be 'AWAITING_REPAIR'
```

## Database Operations Available

### Items
- `getItems()` - Get all items
- `getItemById(id)` - Get item by ID
- `createItem(data)` - Create new item

### Repair Sessions
- `getRepairSessions()` - Get all repair sessions
- `getRepairSessionById(id)` - Get session by ID
- `getRepairSessionsByTechnicianId(technicianId)` - Get sessions by technician
- `createRepairSession(data)` - Create new session
- `updateRepairSession(id, updates)` - Update session
- `deleteRepairSession(id)` - Delete session

### Workflow Definitions
- `getWorkflowDefinitions()` - Get all workflows
- `getWorkflowDefinitionById(id)` - Get workflow by ID
- `createWorkflowDefinition(data)` - Create new workflow

### Workflow Questions
- `getWorkflowQuestions(workflowId)` - Get questions for workflow
- `createWorkflowQuestion(data)` - Create new question

### Repair Answers
- `getRepairAnswers(sessionId)` - Get answers for session
- `createRepairAnswer(data)` - Create new answer
- `updateRepairAnswer(id, answer, notes?)` - Update answer

### Users
- `getUsers()` - Get all users
- `getUserById(id)` - Get user by ID
- `getUserByClerkId(clerkId)` - Get user by Clerk ID
- `createUser(data)` - Create new user

### Labels
- `getLabels()` - Get all labels
- `createLabel(data)` - Create new label

### Grading Rules
- `getGradingRules(workflowId)` - Get rules for workflow
- `createGradingRule(data)` - Create new rule

### Complex Queries
- `getRepairSessionWithDetails(id)` - Get session with all relations
- `getWorkflowDefinitionWithQuestions(id)` - Get workflow with questions

## API Route Pattern

ALWAYS follow this pattern for API routes:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const data = await dbOperations.getSomeData()
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Database operation failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
```

## Migration Workflow

When schema changes are needed:

1. Update `src/lib/schema.ts`
2. Run `npm run db:generate` to generate migration
3. Run `npm run db:migrate` to apply migration
4. Update `dbOperations` helpers if needed
5. Update types and relations if needed

## Performance Best Practices

1. **Use indexes**: Leverage existing unique indexes (lp, clerkId, etc.)
2. **Limit results**: Use `.limit()` for large datasets
3. **Select specific fields**: Don't always select all columns
4. **Use relations wisely**: Only fetch needed relations

```typescript
// ✅ GOOD - Specific fields and limit
const recentItems = await db
  .select({
    id: schema.items.id,
    lp: schema.items.lp,
    status: schema.items.status
  })
  .from(schema.items)
  .limit(50)
  .orderBy(desc(schema.items.createdAt))
```

## Summary

- ALWAYS use Drizzle ORM and schema definitions
- PREFER `dbOperations` helper functions when available
- ALWAYS include proper error handling
- ALWAYS use TypeScript types from schema
- NEVER use raw SQL or other database libraries
- ALWAYS validate enum values against schema definitions
