import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    // Test the database connection by getting item counts
    const items = await dbOperations.getItems()
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully using Drizzle ORM!',
      authenticatedUser: userId,
      data: {
        itemsCount: items.length,
        tables: [
          'items',
          'workflow_definitions',
          'workflow_failure_answers',
          'grading_rules',
          'labels',
          'outstanding_repairs',
          'repair_answer_outstanding_repairs',
          'users'
        ]
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to connect to database',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
