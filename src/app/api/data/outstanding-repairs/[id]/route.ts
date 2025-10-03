import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

// GET /api/data/outstanding-repairs/[id] - Get a specific outstanding repair
export const GET = withAuth(async (
  req: NextRequest,
  { userId }: { userId: string },
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  try {
    const repair = await dbOperations.getOutstandingRepairById(resolvedParams.id)
    
    if (!repair) {
      return NextResponse.json(
        { success: false, error: 'Outstanding repair not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: repair,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Failed to fetch outstanding repair:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch outstanding repair',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// PUT /api/data/outstanding-repairs/[id] - Update an outstanding repair
export const PUT = withAuth(async (
  req: NextRequest,
  { userId }: { userId: string },
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  try {
    const body = await req.json()
    const { 
      status, 
      description, 
      priority, 
      estimatedCost, 
      actualCost, 
      assignedTechnicianId, 
      completedAt 
    } = body
    
    const result = await dbOperations.updateOutstandingRepair(resolvedParams.id, { 
      status,
      description,
      priority,
      estimatedCost,
      actualCost,
      assignedTechnicianId,
      completedAt: completedAt ? new Date(completedAt) : undefined
    })
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Outstanding repair not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Outstanding repair updated successfully'
    })
  } catch (error) {
    console.error('Failed to update outstanding repair:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update outstanding repair',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// DELETE /api/data/outstanding-repairs/[id] - Delete an outstanding repair
export const DELETE = withAuth(async (
  req: NextRequest,
  { userId }: { userId: string },
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  try {
    const result = await dbOperations.deleteOutstandingRepair(resolvedParams.id)
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Outstanding repair not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Outstanding repair deleted successfully',
      deletedId: result.id
    })
  } catch (error) {
    console.error('Failed to delete outstanding repair:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete outstanding repair',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
