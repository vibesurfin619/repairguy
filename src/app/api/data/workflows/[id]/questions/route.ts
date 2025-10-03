import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import dbOperations from '@/lib/db'

// GET /api/data/workflows/[id]/questions - Get workflow questions for a specific workflow
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

    const questions = await dbOperations.getWorkflowQuestions(resolvedParams.id)
    
    return NextResponse.json({
      success: true,
      data: questions,
      count: questions.length,
      workflowId: resolvedParams.id,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error('Failed to fetch workflow questions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch workflow questions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/data/workflows/[id]/questions - Create a new workflow question
export async function POST(
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
    const { prompt, key, order, required, critical, failOnNo, helpText } = body
    
    const result = await dbOperations.createWorkflowQuestion({
      workflowId: resolvedParams.id,
      prompt,
      key,
      order,
      required,
      critical,
      failOnNo,
      helpText
    })
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Workflow question created successfully'
    })
  } catch (error) {
    console.error('Failed to create workflow question:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create workflow question',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
