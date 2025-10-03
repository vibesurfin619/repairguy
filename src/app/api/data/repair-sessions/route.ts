import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

// GET /api/data/repair-sessions - Get all repair sessions
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const sessions = await dbOperations.getRepairSessions()
    
    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Failed to fetch repair sessions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch repair sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// POST /api/data/repair-sessions - Create a new repair session
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    
    // Create new repair session with the authenticated user
    const result = await dbOperations.createRepairSession({
      technicianId: userId,
      itemId: body.itemId,
      workflowVersionId: body.workflowVersionId,
      status: body.status || 'IN_PROGRESS'
    })
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Repair session created successfully'
    })
  } catch (error) {
    console.error('Failed to create repair session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create repair session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
