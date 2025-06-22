import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Mock file database - in production this would be a real database
const fileDatabase: Record<string, {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  userId: string;
  category: string;
  uploadedAt: string;
}> = {};

interface RouteParams {
  params: {
    fileId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = params;
    
    // In production, fetch file metadata from database
    const fileMetadata = fileDatabase[fileId];
    
    if (!fileMetadata) {
      // For demo purposes, create mock file paths
      const mockFiles = {
        'resume_1': {
          filePath: join(process.cwd(), 'public', 'demo-resume.pdf'),
          fileName: 'demo-resume.pdf',
          fileType: 'application/pdf',
          originalName: 'John_Doe_Resume.pdf'
        },
        'profile_1': {
          filePath: join(process.cwd(), 'public', 'demo-avatar.png'),
          fileName: 'demo-avatar.png', 
          fileType: 'image/png',
          originalName: 'profile_picture.png'
        }
      };

      const mockFile = mockFiles[fileId as keyof typeof mockFiles];
      if (!mockFile) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      try {
        const fileBuffer = await readFile(mockFile.filePath);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': mockFile.fileType,
            'Content-Disposition': `inline; filename="${mockFile.originalName}"`,
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (readError) {
        // If demo file doesn't exist, return a placeholder response
        return NextResponse.json(
          { 
            message: 'Demo file not found, but endpoint is working',
            fileId: fileId,
            expectedPath: mockFile.filePath
          },
          { status: 200 }
        );
      }
    }

    // Read and serve the actual file
    try {
      const fileBuffer = await readFile(fileMetadata.filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': fileMetadata.fileType,
          'Content-Disposition': `inline; filename="${fileMetadata.originalName}"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch (readError) {
      console.error('Error reading file:', readError);
      return NextResponse.json(
        { error: 'File not accessible' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = params;
    
    // Check if file exists
    const fileMetadata = fileDatabase[fileId];
    if (!fileMetadata) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // In production, verify user has permission to delete this file
    
    // Delete file from filesystem
    try {
      const fs = require('fs').promises;
      await fs.unlink(fileMetadata.filePath);
    } catch (deleteError) {
      console.error('Error deleting physical file:', deleteError);
    }

    // Remove from database
    delete fileDatabase[fileId];

    return NextResponse.json({
      message: 'File deleted successfully',
      fileId: fileId
    });

  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}