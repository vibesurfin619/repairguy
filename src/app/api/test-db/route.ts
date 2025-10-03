import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    // Test the database connection by getting repair session and item counts
    const sessions = await dbOperations.getRepairSessions()
    const items = await dbOperations.getItems()
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully using Drizzle ORM!',
      authenticatedUser: userId,
      data: {
        repairSessionsCount: sessions.length,
        itemsCount: items.length,
        tables: [
          'repair_sessions', 
          'repair_answers',
          'items',
          'workflow_definitions',
          'workflow_questions',
          'grading_rules',
          'labels'
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
