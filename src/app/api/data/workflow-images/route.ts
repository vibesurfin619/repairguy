import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-api';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const GET = withAuth(async (req: NextRequest, { userId, user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
    // Security check: ensure the path is within the uploads directory
    if (!filePath.startsWith('/uploads/workflows/') || filePath.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }
    
    const fullPath = join(process.cwd(), 'public', filePath);
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read the file
    const fileBuffer = await readFile(fullPath);
    
    // Return the PNG file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving PNG file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
});
