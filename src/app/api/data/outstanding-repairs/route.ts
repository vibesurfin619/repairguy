import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

// GET /api/data/outstanding-repairs - Get all outstanding repairs
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const repairs = await dbOperations.getOutstandingRepairs()
    
    return NextResponse.json({
      success: true,
      data: repairs,
      count: repairs.length,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Failed to fetch outstanding repairs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch outstanding repairs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// POST /api/data/outstanding-repairs - Create a new outstanding repair
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { 
      itemId, 
      repairType, 
      status, 
      description, 
      priority, 
      estimatedCost, 
      actualCost, 
      assignedTechnicianId 
    } = body
    
    const result = await dbOperations.createOutstandingRepair({
      itemId,
      repairType,
      status,
      description,
      priority,
      estimatedCost,
      actualCost,
      assignedTechnicianId
    })
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Outstanding repair created successfully'
    })
  } catch (error) {
    console.error('Failed to create outstanding repair:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create outstanding repair',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
