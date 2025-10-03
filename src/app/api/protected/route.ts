import { withAuth } from '@/lib/auth-api';
import { NextRequest, NextResponse } from 'next/server';

// Example of a protected API route using the authentication rule
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    // This route is now protected and will only execute for authenticated users
    // The userId is guaranteed to exist here
    
    return NextResponse.json({
      message: 'Successfully authenticated with Clerk',
      userId,
      provider: 'Clerk',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Protected API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json();
    
    // Example of processing authenticated user data
    return NextResponse.json({
      message: 'Data processed successfully',
      userId,
      receivedData: body,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Protected API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 400 }
    );
  }
});
