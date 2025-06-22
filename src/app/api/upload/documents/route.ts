import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const documentType = formData.get('documentType') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type (documents)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF, DOC, DOCX, TXT, JPG, PNG, GIF, XLS, or XLSX files.' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for documents)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'uploads', 'documents', userId);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store file metadata
    const fileMetadata = {
      id: uuidv4(),
      originalName: file.name,
      fileName: fileName,
      filePath: filePath,
      fileSize: file.size,
      fileType: file.type,
      userId: userId,
      documentType: documentType,
      uploadedAt: new Date().toISOString(),
      category: 'document'
    };

    // In production, save metadata to database
    console.log('Document uploaded:', fileMetadata);

    return NextResponse.json({
      message: 'Document uploaded successfully',
      fileId: fileMetadata.id,
      originalName: file.name,
      fileName: fileName,
      fileSize: file.size,
      documentType: documentType,
      uploadedAt: fileMetadata.uploadedAt,
      downloadUrl: `/api/files/${fileMetadata.id}`
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}