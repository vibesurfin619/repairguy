import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

// GET /api/data/workflows - Get all workflow definitions
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const workflows = await dbOperations.getWorkflowDefinitions()
    
    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Failed to fetch workflows:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// POST /api/data/workflows - Create a new workflow definition
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { name, appliesTo, sopUrl, version, isActive } = body
    
    const result = await dbOperations.createWorkflowDefinition({
      name,
      appliesTo,
      sopUrl,
      version,
      isActive
    })
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Workflow definition created successfully'
    })
  } catch (error) {
    console.error('Failed to create workflow definition:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create workflow definition',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
