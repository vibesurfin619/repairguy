import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

// POST /api/data/query - Execute custom SQL queries (disabled for security with Drizzle)
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Custom SQL queries are disabled',
      message: 'Use the specific API endpoints for database operations. All queries now use Drizzle ORM for type safety.'
    },
    { status: 403 }
  )
})

// GET /api/data/query - Get database schema information
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    // Use the schema helper from our operations
    const schemaInfo = await dbOperations.getDatabaseSchema()
    
    // Group columns by table
    const schema: Record<string, any[]> = {}
    schemaInfo.forEach((row: any) => {
      if (!schema[row.table_name]) {
        schema[row.table_name] = []
      }
      schema[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default
      })
    })
    
    return NextResponse.json({
      success: true,
      schema,
      tableCount: Object.keys(schema).length,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Failed to fetch schema:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch database schema',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})