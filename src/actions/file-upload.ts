'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const uploadFileSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileData: z.string().min(1, 'File data is required'),
  workflowId: z.string().min(1, 'Workflow ID is required'),
});

type UploadFileInput = z.infer<typeof uploadFileSchema>;

export async function uploadWorkflowPng(input: UploadFileInput) {
  const user = await requireAuth();
  
  try {
    console.log('Starting file upload for user:', user.id);
    console.log('Input received:', {
      fileName: input.fileName,
      fileDataLength: input.fileData?.length || 0,
      workflowId: input.workflowId
    });
    
    const validatedInput = uploadFileSchema.parse(input);
    
    // Validate that the file is a PNG
    if (!validatedInput.fileName.toLowerCase().endsWith('.png')) {
      console.log('Invalid file type:', validatedInput.fileName);
      return { 
        success: false, 
        error: 'Only PNG files are allowed' 
      };
    }
    
    // Check file size (base64 is ~33% larger than original)
    const estimatedOriginalSize = (validatedInput.fileData.length * 3) / 4;
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
    if (estimatedOriginalSize > maxSizeBytes) {
      console.log('File too large:', estimatedOriginalSize, 'bytes');
      return { 
        success: false, 
        error: 'File size exceeds 5MB limit' 
      };
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'workflows');
    console.log('Uploads directory:', uploadsDir);
    
    if (!existsSync(uploadsDir)) {
      console.log('Creating uploads directory');
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const sanitizedFileName = validatedInput.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${validatedInput.workflowId}_${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, uniqueFileName);
    
    console.log('Writing file to:', filePath);
    
    // Convert base64 data to buffer and write file
    const fileBuffer = Buffer.from(validatedInput.fileData, 'base64');
    console.log('File buffer size:', fileBuffer.length, 'bytes');
    
    // Validate PNG file signature
    const pngSignature = fileBuffer.slice(0, 8);
    const expectedSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    if (!pngSignature.equals(expectedSignature)) {
      console.log('Invalid PNG signature:', pngSignature);
      return { 
        success: false, 
        error: 'Invalid PNG file format' 
      };
    }
    
    await writeFile(filePath, fileBuffer);
    console.log('File written successfully');
    
    // Return the relative path for storing in database
    const relativePath = `/uploads/workflows/${uniqueFileName}`;
    
    console.log('Upload successful, returning path:', relativePath);
    
    return { 
      success: true, 
      filePath: relativePath,
      fileName: uniqueFileName
    };
  } catch (error) {
    console.error('Failed to upload PNG file:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : error instanceof Error 
          ? `Upload failed: ${error.message}`
          : 'Failed to upload PNG file' 
    };
  }
}

export async function uploadWorkflowVideo(input: UploadFileInput) {
  const user = await requireAuth();
  
  try {
    console.log('Starting video upload for user:', user.id);
    console.log('Input received:', {
      fileName: input.fileName,
      fileDataLength: input.fileData?.length || 0,
      workflowId: input.workflowId
    });
    
    const validatedInput = uploadFileSchema.parse(input);
    
    // Validate that the file is an MP4
    if (!validatedInput.fileName.toLowerCase().endsWith('.mp4')) {
      console.log('Invalid file type:', validatedInput.fileName);
      return { 
        success: false, 
        error: 'Only MP4 files are allowed' 
      };
    }
    
    // Check file size (base64 is ~33% larger than original)
    const estimatedOriginalSize = (validatedInput.fileData.length * 3) / 4;
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB limit for videos
    if (estimatedOriginalSize > maxSizeBytes) {
      console.log('File too large:', estimatedOriginalSize, 'bytes');
      return { 
        success: false, 
        error: 'File size exceeds 50MB limit' 
      };
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'workflows');
    console.log('Uploads directory:', uploadsDir);
    
    if (!existsSync(uploadsDir)) {
      console.log('Creating uploads directory');
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const sanitizedFileName = validatedInput.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${validatedInput.workflowId}_${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, uniqueFileName);
    
    console.log('Writing video file to:', filePath);
    
    // Convert base64 data to buffer and write file
    const fileBuffer = Buffer.from(validatedInput.fileData, 'base64');
    console.log('Video file buffer size:', fileBuffer.length, 'bytes');
    
    // Basic MP4 validation - check for MP4 signature
    const mp4Signature = fileBuffer.slice(4, 8);
    const expectedSignatures = [
      Buffer.from('ftyp'), // MP4 container signature
      Buffer.from('isom'), // ISO Media signature
      Buffer.from('mp41'), // MP4 version 1 signature
      Buffer.from('mp42'), // MP4 version 2 signature
    ];
    
    const isValidMp4 = expectedSignatures.some(sig => mp4Signature.equals(sig));
    if (!isValidMp4) {
      console.log('Invalid MP4 signature:', mp4Signature);
      return { 
        success: false, 
        error: 'Invalid MP4 file format' 
      };
    }
    
    await writeFile(filePath, fileBuffer);
    console.log('Video file written successfully');
    
    // Return the relative path for storing in database
    const relativePath = `/uploads/workflows/${uniqueFileName}`;
    
    console.log('Video upload successful, returning path:', relativePath);
    
    return { 
      success: true, 
      filePath: relativePath,
      fileName: uniqueFileName
    };
  } catch (error) {
    console.error('Failed to upload MP4 file:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
        : error instanceof Error 
          ? `Upload failed: ${error.message}`
          : 'Failed to upload MP4 file' 
    };
  }
}

export async function deleteWorkflowPng(filePath: string) {
  const user = await requireAuth();
  
  try {
    if (!filePath || !filePath.startsWith('/uploads/workflows/')) {
      return { success: false, error: 'Invalid file path' };
    }
    
    const fullPath = join(process.cwd(), 'public', filePath);
    
    // Check if file exists before attempting to delete
    if (existsSync(fullPath)) {
      const { unlink } = await import('fs/promises');
      await unlink(fullPath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete PNG file:', error);
    return { success: false, error: 'Failed to delete PNG file' };
  }
}

export async function deleteWorkflowVideo(filePath: string) {
  const user = await requireAuth();
  
  try {
    if (!filePath || !filePath.startsWith('/uploads/workflows/')) {
      return { success: false, error: 'Invalid file path' };
    }
    
    const fullPath = join(process.cwd(), 'public', filePath);
    
    // Check if file exists before attempting to delete
    if (existsSync(fullPath)) {
      const { unlink } = await import('fs/promises');
      await unlink(fullPath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete MP4 file:', error);
    return { success: false, error: 'Failed to delete MP4 file' };
  }
}
