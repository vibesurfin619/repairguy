import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import dbOperations from '@/lib/db'

// GET /api/data/repair-sessions/[id] - Get a specific repair session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'This API endpoint requires Clerk authentication'
        },
        { status: 401 }
      );
    }

    const session = await dbOperations.getRepairSessionById(resolvedParams.id)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Repair session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: session,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Failed to fetch repair session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch repair session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/data/repair-sessions/[id] - Update a repair session
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'This API endpoint requires Clerk authentication'
        },
        { status: 401 }
      );
    }

    const body = await req.json()
    const { status } = body
    
    const result = await dbOperations.updateRepairSession(resolvedParams.id, { status })
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Repair session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Repair session updated successfully'
    })
  } catch (error) {
    console.error('Failed to update repair session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update repair session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/data/repair-sessions/[id] - Delete a repair session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'This API endpoint requires Clerk authentication'
        },
        { status: 401 }
      );
    }

    const result = await dbOperations.deleteRepairSession(resolvedParams.id)
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Repair session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Repair session deleted successfully',
      deletedId: result.id
    })
  } catch (error) {
    console.error('Failed to delete repair session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete repair session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}