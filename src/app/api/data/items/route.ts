import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-api'
import dbOperations from '@/lib/db'

// GET /api/data/items - Get all items
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const items = await dbOperations.getItems()
    
    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch items',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// POST /api/data/items - Create a new item
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { lp, sku, model, status, currentWorkflowVersionId, grade, newBarcode, locationId } = body
    
    const result = await dbOperations.createItem({
      lp,
      sku,
      model,  
      status,
      currentWorkflowVersionId,
      grade,
      newBarcode,
      locationId
    })
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Item created successfully'
    })
  } catch (error) {
    console.error('Failed to create item:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
